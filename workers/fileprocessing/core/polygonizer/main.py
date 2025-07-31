import sys
from .dxf import polygon_parts_from_dxf
from .dto import ClosedPolygon
from .core import combine_polygon_parts
from utils.logger import setup_logger

from typing import List
from ezdxf.document import Drawing
import time

logger = setup_logger("dxf_polygonizer")

def close_polygon_from_dxf(doc: Drawing, tolerance: float, logger_tag: str) -> List[ClosedPolygon]:
    start_time = time.time()
    
    polygon_parts = polygon_parts_from_dxf(doc, tolerance)
    
    valid_parts = [part for part in polygon_parts if part.is_valid()]
    logger.info("valid_parts length:", extra={"valid_parts": len(valid_parts)})
    
    closed_parts = [part.to_closed_polygon() for part in valid_parts if part.is_closed(tolerance)]
    open_parts = [part for part in valid_parts if not part.is_closed(tolerance)]
    
    open_parts, closed_parts = combine_polygon_parts(open_parts, closed_parts, tolerance, logger_tag)
    
    logger.info("result", extra={
        "closed_parts": len(closed_parts),
        "open_parts": len(open_parts)
    })
    
    end_time = time.time()
    logger.info("time taken", extra={"time": end_time - start_time})
    
    return closed_parts