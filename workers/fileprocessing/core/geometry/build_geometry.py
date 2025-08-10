from dataclasses import dataclass
from time import time
from typing import List, Dict, Iterable
from itertools import chain

from dxf_parser import DxfEntityGeometry, convert_entity_to_shapely

from ezdxf.document import Drawing
from shapely.geometry import Polygon
from shapely.validation import make_valid
from shapely.ops import unary_union

@dataclass(slots=True)
class ClosedPolygon:
    geometry: Polygon
    handles: List[str]

def merge_dxf_entities_into_polygons(dxf_entities: Iterable[DxfEntityGeometry], tolerance: float = 0.01) -> List[ClosedPolygon]:
    result = []
    for dxf_entity in dxf_entities:
        area = dxf_entity.geometry.area
        if area > 1e-6:
            result.append(ClosedPolygon(geometry=make_valid(dxf_entity.geometry.convex_hull.buffer(tolerance)), handles=[dxf_entity.handle]))
        
    while True:
        print(f"Merging {len(result)} polygons")
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


def build_geometry(drawing: Drawing, tolerance: float = 0.01) -> List[ClosedPolygon]:
    """
    Build geometry from DXF drawing with simple buffering.
    """
    start_time = time()
    msp = drawing.modelspace()

    dxf_geometries: List[DxfEntityGeometry] = []
    for entity in msp:
        try:
            dxf_geometry: DxfEntityGeometry = convert_entity_to_shapely(entity, tolerance)
            dxf_geometries.append(dxf_geometry)
        except Exception as e:
            print(f"Error converting entity {entity.dxftype()} (handle: {entity.dxf.handle}): {e}")
            continue

    closed_polygons = merge_dxf_entities_into_polygons(dxf_geometries, tolerance)
    print(f"Computed {len(closed_polygons)} closed polygons")
    end_time = time()
    print(f"Time taken: {end_time - start_time} seconds")
    
    return closed_polygons    