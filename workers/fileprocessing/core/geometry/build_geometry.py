from dataclasses import dataclass
from time import time
from typing import List, Dict, Iterable
from itertools import chain

from .dxf_parser import DxfEntityGeometry, convert_entity_to_shapely

from ezdxf.document import Drawing
from shapely.geometry import Polygon
from shapely.validation import make_valid
from shapely.ops import unary_union

from utils.logger import setup_logger

logger = setup_logger("build_geometry")

@dataclass(slots=True)
class ClosedPolygon:
    geometry: Polygon
    handles: List[str]
    
    def to_mongo_dict(self) -> Dict[str, List[List[float]]] :
        if not isinstance(self.geometry, Polygon):
            raise TypeError("The 'geometry' attribute must be a shapely Polygon.")

        bounding_box = self.geometry.bounds
        
        width = bounding_box[2] - bounding_box[0]
        height = bounding_box[3] - bounding_box[1]
        
        if (abs(width) < 0.1 or abs(height) < 0.1):
            return None
        
        coords = list(zip(*self.geometry.exterior.coords.xy))
        if not coords:
            exterior_coords = []
        else:
            reduced = list()  
            reduced.append(coords[0])
            
            for idx in range(1, len(coords)):
                point = coords[idx]
                last = reduced[len(reduced) - 1]
                if abs(point[0] - last[0]) > 0.01 or abs(point[1] - last[1]) > 0.01:
                    reduced.append(point)
                    
            exterior_coords = reduced
        
        return {
            'coordinates': exterior_coords,
            'handles': self.handles,
            'width': width,
            'height': height
        }

def merge_dxf_entities_into_polygons(dxf_entities: Iterable[DxfEntityGeometry], tolerance: float) -> List[ClosedPolygon]:
    result = []
    logger.info("Merging polygons started", extra={"len": len(dxf_entities)})
    for dxf_entity in dxf_entities:
        shapelly_geom = dxf_entity.geometry.convex_hull.buffer(tolerance)
        area = shapelly_geom.area
        if area > 1e-10:
            result.append(ClosedPolygon(geometry=make_valid(shapelly_geom), handles=[dxf_entity.handle]))
            
    logger.info("Merging polygons after filter by area", extra={"len": len(result)})
        
    while True:
        logger.info("Merging polygons", extra={"len": len(result)})
        result.sort(key=lambda cp: cp.geometry.area, reverse=True)
        old_size = len(result)
        for i in range(len(result)):
            to_remove = []
            isFound = False
            for j in range(i + 1, len(result)):
                if result[i].geometry.intersects(result[j].geometry):
                    result[i].geometry = result[i].geometry.union(result[j].geometry).convex_hull
                    result[i].handles.extend(result[j].handles)
                    to_remove.append(j)
                    isFound = True
            if isFound:
                for j in sorted(to_remove, reverse=True):
                    result.pop(j)
                break
                
        if old_size == len(result):
            break
    
    return result


def build_geometry(drawing: Drawing, tolerance: float) -> List[ClosedPolygon]:
    """
    Build geometry from DXF drawing with simple buffering.
    """
    msp = drawing.modelspace()

    dxf_geometries: List[DxfEntityGeometry] = []
    for entity in msp:
        try:
            dxf_geometry: DxfEntityGeometry = convert_entity_to_shapely(entity, tolerance)
            if dxf_geometry is not None:
                dxf_geometries.append(dxf_geometry)
        except Exception as e:
            logger.error("Error converting entity", extra={"entity": entity.dxftype(), "handle": entity.dxf.handle, "error": e})
            raise e

    closed_polygons = merge_dxf_entities_into_polygons(dxf_geometries, tolerance)
    logger.info("Computed closed polygons", extra={"len": len(closed_polygons)})
    
    return closed_polygons    