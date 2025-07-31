from __future__ import annotations

import ezdxf
from shapely.geometry import Polygon
from shapely.geometry import Point
from shapely import contains, covers

from .dto import ClosedPolygon, PolygonPart

from utils.logger import setup_logger

logger = setup_logger("dxf_polygonizer")

def _vec2(v):
    """Return a Point object from a Vec3 or any 3-component iterable."""
    return Point(float(v[0]), float(v[1]))  # works for Vec3, numpy rows, etc.

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
        pts = []

    return pts, h

def _remove_duplicate_points(pts: list[Point], tol: float) -> list[Point]:
    if len(pts) < 2:
        return pts
    
    unique_pts = [pts[0]]
    for i in range(1, len(pts)):
        if not unique_pts[-1].distance(pts[i]) <= tol:
            unique_pts.append(pts[i])
    
    return unique_pts

def polygon_parts_from_dxf(doc: ezdxf.Drawing, tol: float) -> list[PolygonPart]:
    msp = doc.modelspace()
    all_pts: list[PolygonPart] = []
    for e in msp:
        pts, handle = _flatten_entity(e, tol)
        pts = _remove_duplicate_points(pts, tol)
        if len(pts) >= 2:
            all_pts.append(
                PolygonPart(points=pts, handles=[handle])
            )
    
    return all_pts

