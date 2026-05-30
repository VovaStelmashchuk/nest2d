from datetime import datetime
import io
import math
import os

import ezdxf
import spyrrow

from utils.mongo import db, strip_nest_dxf_bucket
from utils.logger import setup_logger
from core.input_builder import build_input_items

logger = setup_logger("core_stripnesting")

strip_nesting_jobs = db["strip_nesting_job_queue"]

# Total time budget given to the sparrow solver (seconds). Sparrow splits this
# ~80% exploration / ~20% compression. Overridable per environment.
DEFAULT_SOLVE_TIME_SECONDS = int(os.environ.get("STRIP_NEST_TIME", "30"))


def _transform_coords(coords, rotation_deg, tx, ty):
    """Apply spyrrow's placement: rotate `rotation_deg` degrees about the origin,
    then translate by (tx, ty)."""
    rad = math.radians(rotation_deg)
    cos_a = math.cos(rad)
    sin_a = math.sin(rad)
    return [
        (x * cos_a - y * sin_a + tx, x * sin_a + y * cos_a + ty)
        for (x, y) in coords
    ]


def _build_result_drawing(placed_items, items_by_id):
    """Build a single DXF drawing of the nested strip from the placed outlines."""
    new_doc = ezdxf.new()
    msp = new_doc.modelspace()

    for placed in placed_items:
        item = items_by_id.get(placed.id)
        if item is None:
            logger.warning("Placed item has no source item", extra={"id": placed.id})
            continue

        tx, ty = placed.translation
        placed_coords = _transform_coords(item.coords, placed.rotation, tx, ty)
        msp.add_lwpolyline(placed_coords, close=True)

    return new_doc


def _save_dxf_result(owner_id, file_name, drawing):
    text_stream = io.StringIO()
    drawing.write(text_stream)
    data = text_stream.getvalue().encode("utf-8")
    text_stream.close()

    strip_nest_dxf_bucket.upload_from_stream(
        filename=file_name, source=data, metadata={"ownerId": owner_id}
    )


def strip_nesting_process(doc):
    """
    Solve a strip packing job with sparrow (via the spyrrow wrapper).

    Unlike bin packing, strip packing always places every item — the strip
    width grows to fit. The solver minimises that width for the given fixed
    strip height. Parts are not rotated (the strip feature has no rotation
    option), so every item is given a single allowed orientation of 0 degrees.
    """
    slug = doc.get("slug")
    owner_id = doc.get("ownerId")
    files = doc.get("files") or []
    params = doc.get("params") or {}
    height = params.get("height")

    logger.info("Processing strip nesting", extra={"slug": slug, "height": height})

    if height is None or float(height) <= 0:
        raise Exception("Invalid strip height")

    input_items = build_input_items(files)
    if not input_items:
        raise Exception("No items to nest")

    items_by_id = {item.item_id: item for item in input_items}

    spyrrow_items = []
    total_requested = 0
    for item in input_items:
        spyrrow_items.append(
            spyrrow.Item(
                item.item_id,
                item.coords,
                demand=item.count,
                allowed_orientations=[0],  # strip nesting never rotates parts
            )
        )
        total_requested += item.count

    strip_nesting_jobs.update_one(
        {"_id": doc.get("_id")},
        {"$set": {"requested": total_requested, "update_ts": datetime.now()}},
    )

    instance = spyrrow.StripPackingInstance(
        slug if isinstance(slug, str) else "strip",
        strip_height=float(height),
        items=spyrrow_items,
    )
    config = spyrrow.StripPackingConfig(
        total_computation_time=DEFAULT_SOLVE_TIME_SECONDS,
        seed=0,
    )

    logger.info(
        "Solving strip packing",
        extra={"items": len(spyrrow_items), "requested": total_requested},
    )
    solution = instance.solve(config)

    placed_items = solution.placed_items
    total_placed = len(placed_items)
    width = float(solution.width)
    density = getattr(solution, "density", None)

    logger.info(
        "Strip packing solved",
        extra={
            "placed": total_placed,
            "requested": total_requested,
            "width": width,
            "density": density,
        },
    )

    drawing = _build_result_drawing(placed_items, items_by_id)

    dxf_file_name = f"{slug}.dxf"
    _save_dxf_result(owner_id, dxf_file_name, drawing)

    strip_nesting_jobs.update_one(
        {"slug": slug},
        {
            "$set": {
                "dxf_files": [dxf_file_name],
                "width": width,
                "density": density,
                "placed": total_placed,
                "requested": total_requested,
                "update_ts": datetime.now(),
            }
        },
    )
