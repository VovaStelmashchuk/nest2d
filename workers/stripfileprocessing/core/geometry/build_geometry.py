from dataclasses import dataclass
from typing import List, Dict, Tuple

from .dxf_parser import convert_entity_to_shapely

from ezdxf.document import Drawing
# Use the top-level shapely (2.0) functions — `shapely.ops.unary_union` does not
# support the `grid_size` argument.
from shapely import set_precision, unary_union
from shapely.geometry import Polygon, LineString, Point
from shapely.ops import polygonize

from utils.logger import setup_logger

logger = setup_logger("build_geometry")

# Coordinate grid used to make near-coincident vertices exactly equal. This makes
# noding/polygonize robust (closes hairline gaps at corners) and lets unary_union
# reliably dissolve the shared edges of faces that an internal line split apart.
# Far below the flattening tolerance, so it does not affect contour accuracy.
GRID_SIZE = 1e-4

# Parts whose contours are this close (mm) or closer are merged into one polygon.
MERGE_DISTANCE = 0.1


def _merge_near_polygons(polygons: List[Polygon], distance: float) -> List[Polygon]:
    """
    Merge polygons that lie within `distance` of each other into single polygons.

    Polygons are clustered by proximity (union-find over pairwise distance). Each
    cluster of more than one polygon is welded into a single outer contour with a
    morphological close (buffer out then in, mitre joins to keep corners sharp).
    Isolated polygons are returned untouched so their contours stay exact.
    """
    count = len(polygons)
    if count <= 1:
        return polygons

    parent = list(range(count))

    def find(node):
        while parent[node] != node:
            parent[node] = parent[parent[node]]
            node = parent[node]
        return node

    def union(a, b):
        root_a, root_b = find(a), find(b)
        if root_a != root_b:
            parent[root_a] = root_b

    for i in range(count):
        for j in range(i + 1, count):
            if polygons[i].distance(polygons[j]) <= distance:
                union(i, j)

    clusters = {}
    for i in range(count):
        clusters.setdefault(find(i), []).append(i)

    result: List[Polygon] = []
    for indices in clusters.values():
        if len(indices) == 1:
            result.append(polygons[indices[0]])
            continue

        group_union = unary_union([polygons[k] for k in indices])
        # Bridge the sub-distance gaps so the cluster becomes one solid polygon.
        bridged = (
            group_union
            .buffer(distance, join_style="mitre", mitre_limit=5.0)
            .buffer(-distance, join_style="mitre", mitre_limit=5.0)
        )
        for geom in getattr(bridged, "geoms", [bridged]):
            if geom.geom_type == "Polygon" and not geom.is_empty:
                result.append(Polygon(geom.exterior))

    return result

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


def build_geometry(
    drawing: Drawing,
    tolerance: float,
    original_footprints: List[Tuple[str, Point]],
) -> List[ClosedPolygon]:
    """
    Build accurate part contours from a DXF drawing.

    Unlike the convex-hull based approach, this follows the real geometry:
      * Closed entities become polygons directly.
      * Open entities (lines, arcs, splines, ...) are flattened to line segments,
        noded together and polygonized to recover the faces they enclose.
      * Overlapping / touching faces are merged into one body per disjoint part.
      * Each body keeps the outer contour only (interior detail like grain lines,
        notches and leader lines is dropped) while preserving the concave outline.

    Original DXF handles are preserved via `original_footprints`: each is the
    (handle, bounding-box centre) of an *original* entity from the uploaded file
    (captured before blocks/dimensions were decomposed and text was removed).
    Every footprint that falls inside a body has its handle attached to that
    body's ClosedPolygon — so text labels, dimensions and blocks travel with the
    part even though they do not contribute to the contour.
    """
    msp = drawing.modelspace()

    closed_polys: List[Polygon] = []
    open_lines: List[LineString] = []

    for entity in msp:
        try:
            dxf_geometry = convert_entity_to_shapely(entity, tolerance)
        except Exception as e:
            logger.error("Error converting entity", extra={
                "entity": entity.dxftype(),
                "handle": entity.dxf.handle,
                "error": str(e),
            })
            raise e

        if dxf_geometry is None:
            continue

        geometry = dxf_geometry.geometry

        if isinstance(geometry, Polygon):
            if not geometry.is_empty and geometry.area > 1e-10:
                closed_polys.append(geometry)
        elif isinstance(geometry, LineString):
            if not geometry.is_empty:
                open_lines.append(geometry)
        # Point geometries carry no area and are ignored for contour building.

    # Recover faces enclosed by the open linework.
    if open_lines:
        merged_lines = unary_union(open_lines)
        # Snap coordinates to a fine grid so coincident endpoints become exactly
        # equal — this nodes the linework robustly and closes hairline corner gaps
        # without perturbing edges that faces share (which `snap` would break).
        merged_lines = set_precision(merged_lines, GRID_SIZE)
        noded = unary_union(merged_lines)
        recovered_faces = list(polygonize(noded))
        logger.info("Recovered faces from open linework", extra={"len": len(recovered_faces)})
        closed_polys.extend(recovered_faces)

    if not closed_polys:
        logger.info("No closed polygons found")
        return []

    # buffer(0) repairs self-intersections / winding before merging.
    cleaned = [poly.buffer(0) for poly in closed_polys if not poly.is_empty]
    # grid_size makes the overlay robust so faces that an internal line split into
    # several pieces are dissolved back into a single body per part.
    merged = unary_union(cleaned, grid_size=GRID_SIZE)

    bodies = list(getattr(merged, "geoms", [merged]))

    # Outer contour only — drop interior rings but keep the concave outline.
    silhouettes = [
        Polygon(body.exterior)
        for body in bodies
        if body.geom_type == "Polygon" and not body.is_empty
    ]

    # Merge parts whose contours are within MERGE_DISTANCE of each other.
    silhouettes = _merge_near_polygons(silhouettes, MERGE_DISTANCE)

    result: List[ClosedPolygon] = []
    for silhouette in silhouettes:
        # The silhouette is the part's outer contour as a *solid* region
        # (interior rings dropped), so every original entity that belongs to the
        # part — the outline, plus holes, notches, grain lines, logos, text and
        # dimensions sitting inside it — has its bounding-box centre within this
        # solid. Parts are disjoint, so a centre belongs to at most one part.
        probe = silhouette.buffer(max(tolerance, 1e-6))

        handles = [
            handle
            for (handle, point) in original_footprints
            if point is not None and not point.is_empty and probe.intersects(point)
        ]

        result.append(ClosedPolygon(geometry=silhouette, handles=handles))

    logger.info("Computed closed polygons", extra={"len": len(result)})

    return result
