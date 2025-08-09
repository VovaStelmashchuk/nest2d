from dataclasses import dataclass
from typing import List, Tuple, Union
from ezdxf.math import Vec3
from shapely.geometry import Point, LineString, Polygon
from shapely.geometry.base import BaseGeometry

@dataclass(slots=True)
class DxfEntityGeometry:
    geometry: BaseGeometry
    handle: str
    
def _vec2(p: Vec3) -> Tuple[float, float]:
    return (p.x, p.y)

def convert_entity_to_shapely(entity, tol: float) -> DxfEntityGeometry:
    # ... [Same as previous `convert_entity_to_shapely` code]
    # This function is responsible for converting a single DXF entity to a
    # buffered Shapely polygon where necessary.

    h = entity.dxf.handle
    kind = entity.dxftype()
    shapely_geom = None

    if kind == "LINE":
        points = [_vec2(entity.dxf.start), _vec2(entity.dxf.end)]
        shapely_geom = LineString(points).buffer(tol)

    elif kind in ["LWPOLYLINE", "POLYLINE"]:
        points = [_vec2(p) for p in entity.get_points(format="xy")] if kind == "LWPOLYLINE" else [_vec2(p) for p in entity.points()]
        is_closed = entity.closed if kind == "LWPOLYLINE" else getattr(entity, "is_closed", False)

        if is_closed and len(points) > 2:
            if points[0] != points[-1]:
                points.append(points[0])
            shapely_geom = Polygon(points)
        else:
            shapely_geom = LineString(points).buffer(tol)

    elif kind in ["ARC", "CIRCLE", "ELLIPSE"]:
        points = [_vec2(p) for p in entity.flattening(sagitta=tol)]
        
        if not points: 
            return None
            
        if kind == "ARC":
            shapely_geom = LineString(points).buffer(tol)
        else: # CIRCLE, ELLIPSE
            if len(points) > 2 and points[0] != points[-1]:
                points.append(points[0])
            shapely_geom = Polygon(points)

    elif kind == "SPLINE":
        try:
            points = [_vec2(p) for p in entity.flattening(distance=tol)]
            
            if not points:
                shapely_geom = None
            else:
                is_closed = getattr(entity, 'is_closed', False)
                if is_closed and len(points) > 2:
                    if points[0] != points[-1]:
                        points.append(points[0])
                    shapely_geom = Polygon(points)
                else:
                    shapely_geom = LineString(points).buffer(tol)
        except Exception:
            try:
                points = [_vec2(p) for p in entity.control_points]
                if len(points) >= 2:
                    shapely_geom = LineString(points).buffer(tol)
            except:
                shapely_geom = None

    elif kind == "POINT":
        shapely_geom = Point(_vec2(entity.dxf.location)).buffer(tol)

    else:
        shapely_geom = None

    return DxfEntityGeometry(geometry=shapely_geom, handle=h)