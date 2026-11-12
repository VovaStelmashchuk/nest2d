import io
import os
from utils.logger import setup_logger
from utils import db
from dxf_utils import read_dxf
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

    if not doc.get("is_dxf_copy_exist", False):
        raise Exception("Dxf copy not exists")

    dxf_bytes = db.read_file(db.BUCKET_VALID_DXF, dxf_file_slug)

    drawing = read_dxf(io.BytesIO(dxf_bytes))
    _drawing_cache[dxf_file_slug] = drawing

    return drawing

def _make_dxf_copy(doc) -> Drawing:
    logger = setup_logger("dxf_copy_maker")
    dxf_file_slug = doc["slug"]

    if doc.get("is_dxf_copy_exist", False):
        logger.info("Dxf copy already exists", extra={"dxf_file_slug": dxf_file_slug})
        return

    user_id = doc["owner_id"]

    logger.info("Making dxf copy", extra={"dxf_file_slug": dxf_file_slug})

    dxf_bytes = db.read_file(db.BUCKET_USER_DXF, dxf_file_slug)

    dxf_copy = read_dxf(io.BytesIO(dxf_bytes))

    logger.info("Make a copy Drawing info", extra={"entity_count": len(dxf_copy.modelspace())})

    dxf_copy_text_stream = io.StringIO()
    dxf_copy.write(dxf_copy_text_stream)
    dxf_copy_text = dxf_copy_text_stream.getvalue()
    dxf_copy_text_stream.close()

    dxf_copy_bytes = dxf_copy_text.encode('utf-8')

    db.save_file(db.BUCKET_VALID_DXF, dxf_file_slug, user_id, dxf_copy_bytes)

    db.execute(
        "UPDATE user_dxf_files SET is_dxf_copy_exist = true WHERE id = %s",
        (doc["id"],),
    )
    doc["is_dxf_copy_exist"] = True

    logger.info("Dxf copy made", extra={"dxf_file_slug": dxf_file_slug})

def _make_svg_file(doc):
    drawing = _getting_drawing(doc)

    slug = doc["slug"]
    closed_parts = doc.get("polygon_parts")
    svg_slug = slug.removesuffix('.dxf') + '-origin.svg'
    owner_id = doc["owner_id"]

    svg_string = create_svg_from_doc(drawing, closed_parts)

    db.save_file(db.BUCKET_USER_DXF_SVG, svg_slug, owner_id, svg_string.encode("utf-8"))

    db.execute(
        "UPDATE user_dxf_files SET svg_file_slug = %s WHERE id = %s",
        (svg_slug, doc["id"]),
    )
    doc["svg_file_slug"] = svg_slug

def _close_polygon_from_dxf(doc, logger_tag: str):
    logger = setup_logger(logger_tag)

    if doc.get("polygon_parts"):
        logger.info("polygon_parts_already_exist", extra={"slug": doc["slug"]})

    tolerance = doc["flattening"]

    start_time = time.time()
    drawing = _getting_drawing(doc)
    closed_parts = build_geometry(drawing, tolerance)

    logger.info("result", extra={
        "closed_parts": len(closed_parts),
    })

    if len(closed_parts) == 0:
        raise Exception("Closed parts is 0")

    polygon_parts = []
    for part in closed_parts:
        part_dict = part.to_dict()
        if part_dict is not None:
            polygon_parts.append(part_dict)

    db.execute(
        "UPDATE user_dxf_files SET polygon_parts = %s WHERE id = %s",
        (db.json(polygon_parts), doc["id"]),
    )

    doc["polygon_parts"] = polygon_parts

    end_time = time.time()
    logger.info("time taken", extra={"time": end_time - start_time})

def _set_valid_entity_count(doc):
    drawing = _getting_drawing(doc)
    entity_count = len(drawing.modelspace())

    if entity_count == 0:
        raise Exception("Entity count is 0")

    db.execute(
        "UPDATE user_dxf_files SET valid_entity_count = %s WHERE id = %s",
        (entity_count, doc["id"]),
    )

    return entity_count

max_entity_limit = int(os.environ.get("MAX_ENTITY_LIMIT", '999'))

settings_logger = setup_logger('settings_logger')
settings_logger.info("Max entity limit set", extra={"max_entity_limit": max_entity_limit})

def process_file(doc):
    _drawing_cache.clear()

    start_time = time.time()
    logger = setup_logger("core_fileprocessing")
    logger.info("Processing file", extra={"doc": doc["slug"]})

    _make_dxf_copy(doc)
    entity_count = _set_valid_entity_count(doc)

    if entity_count > max_entity_limit:
        db.execute(
            "UPDATE user_dxf_files SET worker_tag = '1k_entity_count' WHERE id = %s",
            (doc["id"],),
        )
        return False

    _close_polygon_from_dxf(doc, "dxf_polygonizer")

    _make_svg_file(doc)

    end_time = time.time()
    logger.info("time taken", extra={"time": end_time - start_time})

    db.execute(
        "UPDATE user_dxf_files SET processing_time = processing_time + %s WHERE id = %s",
        (end_time - start_time, doc["id"]),
    )

    return True
