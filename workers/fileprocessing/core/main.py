import io
from utils.logger import setup_logger
from utils.mongo import user_dxf_bucket, valid_dxf_bucket, user_dxf_files_svg_bucket
from dxf_utils import read_dxf
from utils.mongo import db
from ezdxf.document import Drawing
from core.svg_generator import create_svg_from_doc

from core.polygonizer.dxf import polygon_parts_from_dxf
from core.polygonizer.dto import ClosedPolygon, PolygonPart
from core.polygonizer.core import combine_polygon_parts

from typing import List
from ezdxf.document import Drawing
from shapely.geometry import Point
import time

def _getting_drawing(doc) -> Drawing:
    logger = setup_logger("getting_drawing")
    dxf_file_slug = doc["slug"]
    
    logger.info("Getting drawing", extra={"slug": dxf_file_slug})
    
    if not doc.get("isDxfCopyExist", False):
        raise Exception("Dxf copy not exists")
    
    grid_out = valid_dxf_bucket.open_download_stream_by_name(dxf_file_slug)
    return read_dxf(grid_out)

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
    
    dxf_copy_text_stream = io.StringIO()
    dxf_copy.write(dxf_copy_text_stream)
    dxf_copy_text = dxf_copy_text_stream.getvalue()
    dxf_copy_text_stream.close()
    
    dxf_copy_bytes = dxf_copy_text.encode('utf-8')
    
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
    
def _close_polygon_from_dxf(doc, logger_tag: str) -> List[ClosedPolygon]:
    logger = setup_logger(logger_tag)
    
    def update_cache(open_parts, closed_parts):
        logger.info("save_progress", extra={"open_parts": len(open_parts), "closed_parts": len(closed_parts)})
        
        serialized_open_parts = []
        for part in open_parts:
            serialized_open_parts.append({
                "points": [[p.x, p.y] for p in part.points],
                "handles": part.handles
            })
            
        serialized_closed_parts = []
        for part in closed_parts:
            serialized_closed_parts.append({
                "points": [[p.x, p.y] for p in part.points],
                "handles": part.handles
            })
        
        db["user_dxf_files"].update_one(
            {"_id": doc["_id"]},
            {"$set": { 
                "isPolygoneCacheActive": True,
                "polygoneCache": {
                    "open_parts": serialized_open_parts,
                    "closed_parts": serialized_closed_parts
                }
            }
            }
        )
       
    tolerance = doc["flattening"]
    
    open_parts = None
    closed_parts = None
    
    if doc.get("isPolygoneCacheActive", False):
       logger.info("polygone_cache_active", extra={"polygone_cache": doc["slug"]})
       
       serialized_open_parts = doc["polygoneCache"]["open_parts"]
       serialized_closed_parts = doc["polygoneCache"]["closed_parts"]
       
       open_parts = []
       for part in serialized_open_parts:
           open_parts.append(PolygonPart(
               points=[Point(p[0], p[1]) for p in part["points"]],
               handles=part["handles"]
           ))
           
       closed_parts = []
       for part in serialized_closed_parts:
           closed_parts.append(ClosedPolygon(
               points=[Point(p[0], p[1]) for p in part["points"]],
               handles=part["handles"]
           ))
           
       logger.info("polygone_cache_parts_loaded", extra={"open_parts": len(open_parts), "closed_parts": len(closed_parts)})
    else:
        logger.info("polygone_cache_not_active", extra={"slug": doc["slug"]})
        logger.info("building polygone cache parts", extra={"slug": doc["slug"]})
        
        drawing = _getting_drawing(doc)
        polygon_parts = polygon_parts_from_dxf(drawing, tolerance) 
        
        closed_parts = [part.to_closed_polygon() for part in polygon_parts if part.is_closed(tolerance)]
        open_parts = [part for part in polygon_parts if not part.is_closed(tolerance)]
        
        update_cache(open_parts, closed_parts)
        
    def save_progress(open_parts, closed_parts):
        if not hasattr(save_progress, "_last_update") or (time.time() - save_progress._last_update > 60):
            update_cache(open_parts, closed_parts)
            save_progress._last_update = time.time()
       
    start_time = time.time()
    closed_parts = combine_polygon_parts(open_parts, closed_parts, tolerance, logger_tag, callback=save_progress)
    
    logger.info("result", extra={
        "closed_parts": len(closed_parts),
    })
    
    serialized_closed_parts = []
    for part in closed_parts:
        serialized_closed_parts.append({
            "points": [[p.x, p.y] for p in part.points],
            "handles": part.handles
        })
    
    db["user_dxf_files"].update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "isPolygoneCacheActive": False,
                "isPolygonPartsExist": True,
                "polygonParts": serialized_closed_parts
            },
            "$unset": {
                "polygoneCache": 1
            }
        }
    )
    
    end_time = time.time()
    logger.info("time taken", extra={"time": end_time - start_time})
    
    return closed_parts

def process_file(doc):
    start_time = time.time()
    logger = setup_logger("core_fileprocessing")
    logger.info("Processing file", extra={"doc": doc["slug"]})
    
    _make_dxf_copy(doc)
    _make_svg_file(doc)
    
    closed_polygons = _close_polygon_from_dxf(doc, "dxf_polygonizer") 
    
    end_time = time.time()
    logger.info("time taken", extra={"time": end_time - start_time})
    
    db["user_dxf_files"].update_one(
        {"_id": doc["_id"]},
        {
            "$set": {
                "processingTime": end_time - start_time,
            }
        }
    )
    
    logger.info("close_polygon_from_dxf_finish", extra={"closed_polygons": len(closed_polygons)})
