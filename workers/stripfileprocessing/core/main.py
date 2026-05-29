import time

from utils.logger import setup_logger
from utils.mongo import db, strip_user_dxf_bucket
from dxf_utils import read_dxf
from core.geometry.build_geometry import build_geometry

strip_user_dxf_files = db["strip_user_dxf_files"]


def _close_polygon_from_dxf(doc):
    """
    Reads the user input DXF for a strip file, builds the closed polygon parts
    and attaches them as the `polygonParts` field (coordinates + handles +
    bounding box) to the strip_user_dxf_files document.
    """
    logger = setup_logger("strip_dxf_polygonizer")

    if doc.get("polygonParts"):
        logger.info("polygon_parts_already_exist", extra={"slug": doc["slug"]})

    tolerance = doc.get("flattening", 0.01)

    start_time = time.time()

    grid_out = strip_user_dxf_bucket.open_download_stream_by_name(doc["slug"])
    drawing = read_dxf(grid_out)

    closed_parts = build_geometry(drawing, tolerance)

    logger.info("result", extra={"closed_parts": len(closed_parts)})

    if len(closed_parts) == 0:
        raise Exception("Closed parts is 0")

    polygon_parts = []
    for part in closed_parts:
        mongo_dict = part.to_mongo_dict()
        if mongo_dict is not None:
            polygon_parts.append(mongo_dict)

    strip_user_dxf_files.update_one(
        {"_id": doc["_id"]},
        {"$set": {"polygonParts": polygon_parts}}
    )
    doc["polygonParts"] = polygon_parts

    end_time = time.time()
    logger.info("time taken", extra={"time": end_time - start_time})

    return polygon_parts


def process_file(doc):
    start_time = time.time()
    logger = setup_logger("core_stripfileprocessing")
    logger.info("Processing strip file", extra={"slug": doc["slug"]})

    polygon_parts = _close_polygon_from_dxf(doc)

    if len(polygon_parts) == 0:
        return False

    end_time = time.time()
    logger.info("time taken", extra={"time": end_time - start_time})

    original_processing_time = doc.get("processingTime", 0)

    strip_user_dxf_files.update_one(
        {"_id": doc["_id"]},
        {"$set": {"processingTime": original_processing_time + (end_time - start_time)}}
    )

    return True
