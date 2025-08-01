from operator import contains
import time

import shapely
from .dto import ClosedPolygon, PolygonPart, Point
from shapely.geometry import Polygon
from utils.logger import setup_logger

logger = setup_logger("polygonizer")

def _combine_nested_polygons(polys: list[ClosedPolygon], tol: float) -> list[ClosedPolygon]:
    """
    Return a **new list** where every polygon that was strictly contained
    inside another has been merged into its parent:

        * Parent keeps its `points`
        * Parent's `handles` = union of its own + all children's
        * Nested children are removed.

    `tol` – optional buffer used to compensate for floating‑point
    noise: parent.buffer(+tol).covers(child) allows boundary‑touching
    cases to count as 'inside'.
    """

    # Sort by descending area so big parents come first
    order = sorted(range(len(polys)), key=lambda i: polys[i].geometry.area, reverse=True)

    keep = [True] * len(polys)
    for i in order:
        if not keep[i]:
            continue
        parent = polys[i].geometry
        for j in order:                                # check every *smaller* poly
            if i == j or not keep[j]:
                continue
            child = polys[j].geometry

            # Strict inclusion test with numeric tolerance
            # - contains(...)  ensures child interior is strictly inside parent interior
            # - covers(...)    catches 'same boundary' degeneracies
            # - For tolerance cases, we need to ensure the child is mostly inside the parent
            
            # First check if child is completely inside parent
            inside = None
            if parent.contains(child):
                inside = True
            else:
                # For boundary-touching cases, check if child is mostly inside parent
                # by buffering the parent slightly and checking coverage
                buffered_parent = parent.buffer(tol)
                if buffered_parent.covers(child):
                    # Additional check: ensure child area is significantly inside parent
                    # (not just touching at edges)
                    try:
                        intersection_area = parent.intersection(child).area
                    except Exception as e:
                        logger.warning(f"Error computing intersection between polygons: {e}")
                        logger.warning(f"Parent: {polys[i].handles}")
                        logger.warning(f"Points: {polys[i].points}")
                        inside = False
                else:
                    inside = False

            if inside is not None and inside:
                # merge handles
                polys[i].handles = sorted(set(polys[i].handles) |
                                          set(polys[j].handles))
                keep[j] = False                       # drop child

    # Build the cleaned list preserving original order
    return [p for p, k in zip(polys, keep) if k]

def _combine_intersecting_polygons(polys: list[ClosedPolygon], tol: float) -> list[ClosedPolygon]:
    """
    Return a **new list** where every polygon that intersects with another has been merged into its parent:
    
    * Intersecting polygons are combined into a single polygon
    * The resulting polygon's `handles` = union of all intersecting polygons' handles
    * The resulting polygon's `points` = union of the geometries including intersection points
    
    `tol` – optional buffer used to compensate for floating‑point
    noise: polygons that are within `tol` distance are considered intersecting.
    """
    if not polys:
        return []

    # Use a copy to avoid modifying the original list
    polys = polys[:]
    
    # Keep merging until no more intersections are found
    while True:
        merged_in_pass = False
        i = 0
        while i < len(polys):
            j = i + 1
            while j < len(polys):
                poly_i = polys[i].geometry
                poly_j = polys[j].geometry

                # Use a small buffer to handle floating point issues, but respect tol=0
                buffered_i = poly_i.buffer(tol) if tol > 0 else poly_i
                buffered_j = poly_j.buffer(tol) if tol > 0 else poly_j

                if buffered_i.intersects(buffered_j):
                    # Only merge if the intersection has an area (is a Polygon)
                    intersection = buffered_i.intersection(buffered_j)
                    if intersection.area > 1e-9:  # Use a small threshold for area
                        # Merge polygons
                        union_poly = poly_i.union(poly_j)
                        
                        # Create new combined polygon
                        if union_poly.geom_type == 'Polygon':
                            coords = list(union_poly.exterior.coords)
                            points = [Point(x, y) for x, y in coords]
                        elif union_poly.geom_type == 'MultiPolygon':
                            # For MultiPolygon, take the largest polygon
                            largest_poly = max(union_poly.geoms, key=lambda p: p.area)
                            coords = list(largest_poly.exterior.coords)
                            points = [Point(x, y) for x, y in coords]
                        else:
                            # Fallback
                            points = polys[i].points

                        # Combine handles
                        combined_handles = sorted(set(polys[i].handles) | set(polys[j].handles))
                        
                        # Replace the first polygon with the merged one
                        polys[i] = ClosedPolygon(points=points, handles=combined_handles)

                        # Remove the second polygon
                        polys.pop(j)
                        
                        merged_in_pass = True
                        # Restart inner loop since list is modified
                        j = i + 1
                    else:
                        j += 1
                else:
                    j += 1
            i += 1
        
        if not merged_in_pass:
            break
            
    return polys

def is_open_part_inside_closed_part(open_part: PolygonPart, closed_part: ClosedPolygon) -> bool:
    """
    Return True if the open part is inside the closed part, False otherwise.
    """
    points = open_part.points
    shapely_closed_part = Polygon([(p.x, p.y) for p in closed_part.points])
    
    for i in range(len(points)):
        if not shapely_closed_part.contains(shapely.Point(points[i].x, points[i].y)):
            return False
    return True

def _combine_open_parts(part_a: PolygonPart, part_b: PolygonPart, tol: float) -> tuple[bool, PolygonPart]:
    """
    Return a tuple of (True if the parts are combined, the combined part).
    """
    
    a_start= part_a.points[0]
    a_end= part_a.points[-1]
    b_start= part_b.points[0]
    b_end= part_b.points[-1]
    
    if a_start.distance(b_start) <= tol:
        return True, PolygonPart(
            points=list(reversed(part_b.points)) + part_a.points[1:],
            handles=part_a.handles + part_b.handles
        )
    elif a_start.distance(b_end) <= tol:
        return True, PolygonPart(
            points=part_b.points + part_a.points[1:],
            handles=part_a.handles + part_b.handles
        )
    elif a_end.distance(b_start) <= tol:
        return True, PolygonPart(
            points=part_a.points + part_b.points[1:],
            handles=part_a.handles + part_b.handles
        )
    elif a_end.distance(b_end) <= tol:
        return True, PolygonPart(
            points=part_a.points[:-1] + list(reversed(part_b.points)),
            handles=part_a.handles + part_b.handles
        )
    
    return False, None

def combine_polygon_parts(
    open_parts: list[PolygonPart], 
    closed_parts: list[ClosedPolygon], 
    tol: float,
    logger_tag: str = "combine_polygon_parts",
    callback: None = None,
) -> list[ClosedPolygon]:
    """
    Returns a tuple of (list of open polygons, list of closed polygons).
    """
    
    if not open_parts and not closed_parts:
        raise ValueError("Open and closed parts are empty")
    
    # Main processing loop
    while True:
        logger.info("combine_polygon_parts", extra={
            "open_parts": len(open_parts),
            "closed_parts": len(closed_parts),
        })
        
        if callback:
            callback(open_parts, closed_parts)
       
        original_open_part_count = len(open_parts)
        original_close_part_count = len(closed_parts)
    
        # Check if any open parts have become closed
        for open_part in open_parts:
            if open_part.is_closed(tol):
                closed_parts.append(open_part.to_closed_polygon())
                open_parts.remove(open_part)
                run_combine_closed_parts = True
                break
            
        if original_open_part_count != len(open_parts):
            continue
        
        # Try to combine open parts with each other
        combined = False
        n = len(open_parts)
        for i in range(n):
            for j in range(i + 1, n):
                combine, new_part = _combine_open_parts(open_parts[i], open_parts[j], tol)
                if combine:
                    # Remove the two parts that were combined
                    open_parts.pop(j)  # Remove j first (higher index)
                    open_parts.pop(i)  # Then remove i
                    # Add the new combined part
                    open_parts.append(new_part)
                    combined = True
                    break
            if combined:
                break
        
        if original_open_part_count != len(open_parts) or original_close_part_count != len(closed_parts):
            continue
        
        # Try to combine open parts with closed parts
        open_parts_to_remove = []
        for open_part in open_parts:
            for closed_part in closed_parts:
                if is_open_part_inside_closed_part(open_part, closed_part):
                    closed_part.handles.extend(open_part.handles)
                    open_parts_to_remove.append(open_part)
                    break
        
        # Remove open parts that were combined with closed parts
        for part in open_parts_to_remove:
            open_parts.remove(part)
        
        # If we combined open parts with closed parts, continue the loop
        if open_parts_to_remove:
            continue
        
        closed_parts = _combine_nested_polygons(closed_parts, tol)
        if len(closed_parts) != original_close_part_count:
            continue
        
        closed_parts = _combine_intersecting_polygons(closed_parts, tol)
        if len(closed_parts) != original_close_part_count:
            continue
        
        if original_close_part_count != len(closed_parts):
            continue
        
        if open_parts:
            logger.info(f"{logger_tag} - open parts: {[part.handles for part in open_parts]}")
            min_x = open_parts[0].points[0].x
            max_x = open_parts[0].points[0].x
            min_y = open_parts[0].points[0].y
            max_y = open_parts[0].points[0].y
            
            for part in open_parts:
                points = part.points
                for point in points:
                    if point.x < min_x:
                        min_x = point.x
                    if point.x > max_x:
                        max_x = point.x
                    if point.y < min_y:
                        min_y = point.y
                    if point.y > max_y:
                        max_y = point.y
            
            close_polygone = ClosedPolygon(
                points=[Point(min_x, min_y), Point(max_x, min_y), Point(max_x, max_y), Point(min_x, max_y), Point(min_x, min_y)],
                handles=[h for part in open_parts for h in part.handles],
            )
            
            closed_parts.append(close_polygone)
            open_parts = []
            run_combine_closed_parts = True
            continue
        
        break
    
    return closed_parts