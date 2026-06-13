from utils.mongo import db
from utils.logger import setup_logger

logger = setup_logger("strip_input_builder")

strip_user_dxf_files = db["strip_user_dxf_files"]


class InputItem:
    """One nesting item: a single closed polygon outline that must be placed
    `count` times on the strip."""

    def __init__(self, item_id, file_slug, coords, handles, count, angle):
        self.item_id = item_id
        self.file_slug = file_slug
        self.coords = coords
        self.handles = handles
        self.count = count
        # Allowed orientations (degrees) for this part, e.g. [0] or [0, 180].
        self.angle = angle


def _close_ring(coords):
    """spyrrow expects the outer boundary as an explicitly closed ring."""
    if len(coords) >= 1 and coords[0] != coords[-1]:
        return coords + [coords[0]]
    return coords


def _sanitize_angle(angle):
    """Strip nesting only supports keeping a part as-is or flipping it 180°.

    Accepts the per-file `angle` stored on the job document and returns a clean
    list of allowed orientations, falling back to [0] when nothing valid is set
    (keeps behaviour stable for jobs enqueued before the feature existed)."""
    if not isinstance(angle, (list, tuple)):
        return [0.0]
    allowed = []
    for value in angle:
        try:
            number = float(value)
        except (TypeError, ValueError):
            continue
        if number in (0.0, 180.0) and number not in allowed:
            allowed.append(number)
    return allowed or [0.0]


def build_input_items(files):
    """
    Build the list of nesting items for a strip nesting job.

    For every file referenced by the job, the `polygonParts` (computed by the
    stripfileprocessing worker and stored on the `strip_user_dxf_files`
    document) are loaded. Every part becomes its own item whose demand equals
    the file count.
    """
    input_items = []
    next_id = 0

    for file in files:
        file_slug = file.get("slug")
        count = file.get("count", 0)
        if not file_slug or count <= 0:
            continue

        angle = _sanitize_angle(file.get("angle"))

        strip_file = strip_user_dxf_files.find_one({"slug": file_slug})
        if strip_file is None:
            raise Exception(f"Strip file not found: {file_slug}")

        polygon_parts = strip_file.get("polygonParts") or []
        if not polygon_parts:
            raise Exception(
                f"Strip file '{file_slug}' has no polygonParts "
                "(has the stripfileprocessing worker processed it?)"
            )

        for part in polygon_parts:
            raw_coords = part.get("coordinates") or []
            coords = [(float(p[0]), float(p[1])) for p in raw_coords]
            if len(coords) < 3:
                continue

            input_items.append(
                InputItem(
                    item_id=str(next_id),
                    file_slug=file_slug,
                    coords=_close_ring(coords),
                    handles=part.get("handles", []),
                    count=count,
                    angle=angle,
                )
            )
            next_id += 1

    logger.info("Built strip nesting items", extra={"count": len(input_items)})
    return input_items
