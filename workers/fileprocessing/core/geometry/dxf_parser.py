from dataclasses import dataclass
from shapely.geometry import Point, LineString, Polygon
from shapely.geometry.base import BaseGeometry

from utils.logger import setup_logger

logger = setup_logger("dxf_parser")

class GeometryConversionError(Exception):
    """Custom exception for errors during DXF to Shapely geometry conversion."""
    pass

@dataclass(slots=True)
class DxfEntityGeometry:
    geometry: BaseGeometry
    handle: str
    
def _vec2(v):
    return Point(float(v[0]), float(v[1]))

def _flatten_entity(entity, tol: float):
    """
    Return list of Point vertices approximating *e*
    and its DXF handle.  All curve entities are tessellated with the
    user–supplied *tol* so the maximum sagitta ≤ tol.
    """
    h = entity.dxf.handle
    kind = entity.dxftype()

    if kind == "LINE":
        pts = [_vec2(entity.dxf.start), _vec2(entity.dxf.end)]

    elif kind == "LWPOLYLINE":
        pts = [_vec2(p) for p in entity.get_points(format="xy")]
        if entity.closed:
            pts.append(pts[0])

    elif kind == "POLYLINE":
        pts = [_vec2(p) for p in entity.points()]
        if getattr(entity, "is_closed", False):
            pts.append(pts[0])

    elif kind == "ARC":
        radius = entity.dxf.radius
        if radius < tol:
            pts = []
        else:
            pts = [_vec2(p) for p in entity.flattening(sagitta=tol)]

    elif kind == "CIRCLE":
        pts = [_vec2(p) for p in entity.flattening(sagitta=tol)]

    elif kind == "ELLIPSE":
        pts = [_vec2(p) for p in entity.flattening(distance=tol)]

    elif kind == "SPLINE":
        pts = [_vec2(p) for p in entity.flattening(distance=tol)]

    else:
        raise GeometryConversionError(f"Unsupported entity type: {kind} (handle: {h})")

    return pts, h

def convert_entity_to_shapely(entity, tol: float = 0.01) -> DxfEntityGeometry | None:
    """
    Converts a single DXF entity to a Shapely geometry object.
    
    Raises:
        GeometryConversionError: If the entity cannot be converted.
    """
    points = []
    
    try:
        points, h = _flatten_entity(entity, tol)
    except GeometryConversionError as e:
        raise e
    
    if len(points) == 0:
        return None
    
    if len(points) == 1:
        shapely_geom = Point(points[0])
    elif len(points) == 2:
        shapely_geom = LineString(points)
    else:
        first_point = points[0]
        last_point = points[-1]
        distance = first_point.distance(last_point)
        is_closed = distance < tol
        if is_closed:
            shapely_geom = Polygon(points)
        else:
            shapely_geom = LineString(points)
    
    return DxfEntityGeometry(geometry=shapely_geom.buffer(tol), handle=h)
    