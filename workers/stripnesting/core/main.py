from datetime import datetime
import io
import math
import os
import tempfile

import ezdxf
from ezdxf import recover, xref
from ezdxf.math import Matrix44
import spyrrow

from utils.mongo import db, strip_nest_dxf_bucket, strip_user_dxf_bucket
from utils.logger import setup_logger
from core.input_builder import build_input_items

logger = setup_logger("core_stripnesting")

# Cache of origin DXF documents keyed by file slug. Cleared at the start of each
# job so memory does not grow and stale documents are never reused.
_origin_doc_cache = {}

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


def _load_origin_doc(file_slug):
    """Load (and cache) the user's original strip DXF for a file slug.

    Loaded with `recover.readfile` — the same loader the stripfileprocessing
    worker used when it captured the part handles — so the entity handles match
    exactly what is stored in `polygonParts`.
    """
    if file_slug in _origin_doc_cache:
        return _origin_doc_cache[file_slug]

    stream = strip_user_dxf_bucket.open_download_stream_by_name(file_slug)
    with tempfile.NamedTemporaryFile(suffix=".dxf", delete=False) as tmp:
        tmp.write(stream.read())
        tmp_path = tmp.name

    doc, _auditor = recover.readfile(tmp_path)
    _origin_doc_cache[file_slug] = doc
    return doc


def _get_origin_entities(file_slug, handles):
    """Return the origin document and the entities whose handles match `handles`."""
    doc = _load_origin_doc(file_slug)
    handle_set = set(handles)
    entities = [e for e in doc.modelspace() if e.dxf.handle in handle_set]
    return doc, entities


def _build_result_drawing(placed_items, items_by_id):
    """
    Build the nested-strip DXF from the placed parts.

    The strip solver only decides *where* each part goes (rotation + translation).
    The geometry itself is reconstructed from the original uploaded DXF: every
    handle attached to the placed part is looked up in the origin file and the
    real entity (outline, holes, grain lines, text, dimensions, ...) is copied,
    transformed by the placement and added to the result — mirroring how the bin
    nesting worker builds its output. Parts whose origin entities cannot be found
    fall back to drawing the silhouette outline so nothing silently disappears.
    """
    new_doc = ezdxf.new()
    new_msp = new_doc.modelspace()

    for placed in placed_items:
        item = items_by_id.get(placed.id)
        if item is None:
            logger.warning("Placed item has no source item", extra={"id": placed.id})
            continue

        tx, ty = placed.translation
        matrix = Matrix44.z_rotate(math.radians(placed.rotation)) * Matrix44.translate(tx, ty, 0)

        source_doc, entities = _get_origin_entities(item.file_slug, item.handles)

        if not entities:
            logger.warning(
                "No origin entities for placed part; drawing silhouette only",
                extra={"file_slug": item.file_slug, "handles": item.handles},
            )
            placed_coords = _transform_coords(item.coords, placed.rotation, tx, ty)
            new_msp.add_lwpolyline(placed_coords, close=True)
            continue

        # Bring the source layers across so copied entities keep their layer.
        required_layers = {entity.dxf.layer for entity in entities}
        loader = xref.Loader(source_doc, new_doc)
        if required_layers:
            loader.load_layers(list(required_layers))
        loader.execute()

        for entity in entities:
            new_entity = entity.copy()
            new_entity.transform(matrix)
            new_msp.add_entity(new_entity)

        logger.info(
            "Placed part from origin entities",
            extra={"file_slug": item.file_slug, "entity_count": len(entities)},
        )

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

    _origin_doc_cache.clear()

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
