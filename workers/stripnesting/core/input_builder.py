from utils.mongo import db
from utils.logger import setup_logger

logger = setup_logger("strip_input_builder")

strip_user_dxf_files = db["strip_user_dxf_files"]


class InputItem:
    """One nesting item: a single closed polygon outline that must be placed
    `count` times on the strip."""

    def __init__(self, item_id, file_slug, coords, handles, count):
        self.item_id = item_id
        self.file_slug = file_slug
        self.coords = coords
        self.handles = handles
        self.count = count


def _close_ring(coords):
    """spyrrow expects the outer boundary as an explicitly closed ring."""
    if len(coords) >= 1 and coords[0] != coords[-1]:
        return coords + [coords[0]]
    return coords


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
                )
            )
            next_id += 1

    logger.info("Built strip nesting items", extra={"count": len(input_items)})
    return input_items
