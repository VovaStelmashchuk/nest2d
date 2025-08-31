import io
import os
from utils.logger import setup_logger
from utils.mongo import user_dxf_bucket, valid_dxf_bucket, user_dxf_files_svg_bucket
from dxf_utils import read_dxf
from utils.mongo import db
from ezdxf.document import Drawing
from core.svg_generator import create_svg_from_doc

from typing import List
from ezdxf.document import Drawing
from shapely.geometry import Point
import time

from core.geometry.build_geometry import build_geometry

_drawing_cache = {}

def _getting_drawing(doc) -> Drawing:
    logger = setup_logger("getting_drawing")
    dxf_file_slug = doc["slug"]
    
    logger.info("Getting drawing", extra={"slug": dxf_file_slug})
    
    if dxf_file_slug in _drawing_cache:
        return _drawing_cache[dxf_file_slug]
    
    if not doc.get("isDxfCopyExist", False):
        raise Exception("Dxf copy not exists")
    
    grid_out = valid_dxf_bucket.open_download_stream_by_name(dxf_file_slug)
    
    drawing = read_dxf(grid_out)
    _drawing_cache[dxf_file_slug] = drawing
    
    return drawing

def _make_dxf_copy(doc) -> Drawing:
    logger = setup_logger("dxf_copy_maker")
    dxf_file_slug = doc["slug"]
    
    if doc.get("isDxfCopyExist", False):
        logger.info("Dxf copy already exists", extra={"dxf_file_slug": dxf_file_slug})
        return 
    
    user_id = doc["ownerId"]
    
    logger.info("Making dxf copy", extra={"dxf_file_slug": dxf_file_slug})
    
    grid_out = user_dxf_bucket.open_download_stream_by_name(dxf_file_slug)
    
    dxf_copy = read_dxf(grid_out)
    
    logger.info("Make a copy Drawing info", extra={"entity_count": len(dxf_copy.modelspace())})
    
    dxf_copy_text_stream = io.StringIO()
    dxf_copy.write(dxf_copy_text_stream)
    dxf_copy_text = dxf_copy_text_stream.getvalue()
    dxf_copy_text_stream.close()
    
    dxf_copy_bytes = dxf_copy_text.encode('utf-8')
 
    try:
        valid_dxf_bucket.delete_by_name(filename=dxf_file_slug)
    except Exception as e:
        logger.info("Error deleting dxf file", extra={"error": e})
        
    valid_dxf_bucket.upload_from_stream(filename=dxf_file_slug, source=dxf_copy_bytes, metadata={"ownerId": user_id})
    
    db["user_dxf_files"].update_one(
        {"_id": doc["_id"]},
        {"$set": {"isDxfCopyExist": True}}
    )
    doc["isDxfCopyExist"] = True
    
    logger.info("Dxf copy made", extra={"dxf_file_slug": dxf_file_slug})

def _make_svg_file(doc):
    logger = setup_logger("svg_file_maker")
    if doc.get("isSvgFileExist", False):
        logger.info("Svg file already exists", extra={"slug": doc["slug"]})
        return
    
    drawing = _getting_drawing(doc)
    
    flattening = doc["flattening"]
    owner_id = doc["ownerId"]
    
    slug = doc["slug"]
    svg_slug = slug.removesuffix('.dxf') + '-origin.svg'
    
    logger.info("Making svg file", extra={"flattening": flattening, "file_slug": doc["slug"]})
    
    svg_string = create_svg_from_doc(drawing, flattening)
    svg_bytes = io.BytesIO(svg_string.encode("utf-8"))
    
    user_dxf_files_svg_bucket.upload_from_stream(filename=svg_slug, source=svg_bytes, metadata={"ownerId": owner_id})
    
    db["user_dxf_files"].update_one(
        {"_id": doc["_id"]},
        {"$set": {
            "isSvgFileExist": True,
            "svgFileSlug": svg_slug
        }}
    )
    doc["isSvgFileExist"] = True
    doc["svgFileSlug"] = svg_slug
    
def _close_polygon_from_dxf(doc, logger_tag: str):
    logger = setup_logger(logger_tag)
     
    if doc.get("polygonParts"):
        logger.info("polygon_parts_already_exist", extra={"slug": doc["slug"]})
        return
     
    tolerance = doc["flattening"]
 
    start_time = time.time()
    drawing = _getting_drawing(doc)
    closed_parts = build_geometry(drawing, tolerance)
    
    logger.info("result", extra={
        "closed_parts": len(closed_parts),
    })
    
    if len(closed_parts) == 0:
        raise Exception("Closed parts is 0")
    
    db["user_dxf_files"].update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "polygonParts": [part.to_mongo_dict() for part in closed_parts]
            }
        }
    )
    
    end_time = time.time()
    logger.info("time taken", extra={"time": end_time - start_time})

def _set_valid_entity_count(doc):
    drawing = _getting_drawing(doc)
    entity_count = len(drawing.modelspace())
    
    if entity_count == 0:
        raise Exception("Entity count is 0")
    
    db["user_dxf_files"].update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "validEntityCount": entity_count
            }
        }
    )
    
    return entity_count

max_entity_limit = int(os.environ.get("MAX_ENTITY_LIMIT", '999'))

def process_file(doc):
    _drawing_cache.clear()
    
    start_time = time.time()
    logger = setup_logger("core_fileprocessing")
    logger.info("Processing file", extra={"doc": doc["slug"]})
    
    _make_dxf_copy(doc)
    entity_count = _set_valid_entity_count(doc)
    
    _make_svg_file(doc)
    
    
    if entity_count > max_entity_limit:
        db["user_dxf_files"].update_one(
            {"_id": doc["_id"]},
            {"$set": {"worker_tag": "1k_entity_count"}}
        )
        return False
    
    _close_polygon_from_dxf(doc, "dxf_polygonizer") 
    
    end_time = time.time()
    logger.info("time taken", extra={"time": end_time - start_time})
    
    original_processing_time = doc.get("processingTime", 0)
    
    db["user_dxf_files"].update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "processingTime": original_processing_time + (end_time - start_time),
            }
        }
    )
    
    return True
    