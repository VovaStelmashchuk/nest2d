from dataclasses import dataclass
from typing import List, Dict, Iterable
from itertools import chain

from dxf_parser import DxfEntityGeometry, convert_entity_to_shapely

from ezdxf.document import Drawing
from shapely.geometry import Polygon


@dataclass(slots=True)
class ClosedPolygon:
    geometry: Polygon
    handles: List[str]

def merge_dxf_entities_into_polygons(dxf_entities: Iterable[DxfEntityGeometry]) -> List[ClosedPolygon]:
    result = []
    for dxf_entity in dxf_entities:
        result.append(ClosedPolygon(geometry=dxf_entity.geometry, handles=[dxf_entity.handle]))
        
    while True:
        print(f"Merging {len(result)} polygons")
        n = len(result)
        isFound = False
        for i in range(n):
            for j in range(i + 1, n):
                if result[i].geometry.intersects(result[j].geometry):
                    result[i].geometry = result[i].geometry.union(result[j].geometry)
                    result[i].handles.extend(result[j].handles)
                    result.pop(j)
                    isFound = True
                    break
                if result[i].geometry.contains(result[j].geometry):
                    result[i].geometry = result[i].geometry
                    result[i].handles.extend(result[j].handles)
                    result.pop(j)
                    isFound = True
                    break
                if result[j].geometry.contains(result[i].geometry):
                    result[j].geometry = result[j].geometry
                    result[j].handles.extend(result[i].handles)
                    result.pop(i)
                    isFound = True
                    break
            if isFound:
                break
                
        if n == len(result):
            break
    
    return result


def build_geometry(drawing: Drawing, tolerance: float = 0.01) -> List[ClosedPolygon]:
    """
    Build geometry from DXF drawing with simple buffering.
    """
    msp = drawing.modelspace()

    dxf_geometries: List[DxfEntityGeometry] = []
    for entity in msp:
        try:
            dxf_geometry: DxfEntityGeometry = convert_entity_to_shapely(entity, tolerance)
            original_shapely_geometry = dxf_geometry.geometry
            
            # Simple buffering
            buffered_shapely_geometry = original_shapely_geometry.buffer(tolerance)
            
            dxf_geometries.append(
                DxfEntityGeometry(geometry=buffered_shapely_geometry, handle=dxf_geometry.handle)
            )
        except Exception as e:
            print(f"Error converting entity {entity.dxftype()} (handle: {entity.dxf.handle}): {e}")
            continue

    closed_polygons = merge_dxf_entities_into_polygons(dxf_geometries)
    print(f"Computed {len(closed_polygons)} closed polygons")
    return closed_polygons    