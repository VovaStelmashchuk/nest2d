import tempfile
import uuid
from typing import List, Tuple
import ezdxf
import ezdxf.bbox
from ezdxf.document import Drawing
from gridfs.synchronous.grid_file import GridOut
from ezdxf.audit import Auditor
from ezdxf.explode import explode_entity
from ezdxf import recover
from utils.logger import setup_logger
from ezdxf.render.hatching import hatch_entity
from ezdxf.disassemble import recursive_decompose
from ezdxf.entities import DXFGraphic
from shapely.geometry import Point

logger = setup_logger("dxf_utils")

# (handle, footprint) for an original DXF entity. The footprint is the entity's
# bounding-box centre, used downstream to decide which part contains it.
OriginalFootprint = Tuple[str, Point]


def _extract_original_footprints(msp) -> List[OriginalFootprint]:
    """
    Capture every original top-level entity's handle and bounding-box centre.

    This runs on the *untouched* modelspace — before TEXT/MTEXT are deleted and
    before blocks/dimensions are decomposed — so the handles are exactly those
    the user sees in their CAD program. Every entity type is covered (text,
    dimensions, blocks, leaders, ...) because we only need a representative point
    per entity, not a flattened outline. The point is later tested against each
    part's contour so the original handle is attached to the part that contains
    it.
    """
    footprints: List[OriginalFootprint] = []
    for entity in msp:
        handle = getattr(entity.dxf, "handle", None)
        if handle is None:
            continue
        try:
            box = ezdxf.bbox.extents([entity])
            if not box.has_data:
                continue
            center = box.center
            footprints.append((handle, Point(center.x, center.y)))
        except Exception:
            # An entity whose extents cannot be computed simply gets no footprint
            # and is skipped for handle assignment.
            continue
    return footprints


def read_dxf(dxf_stream: GridOut) -> Tuple[Drawing, List[OriginalFootprint]]:
    """
    Reads a DXF stream and returns the cleaned geometry drawing together with the
    original entities' (handle, bounding-box centre) footprints.

    Parameters:
        dxf_stream: The DXF string to process.

    Returns:
        A tuple of (cleaned Drawing for contour building, original footprints for
        handle assignment).
    """
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        temp_file.write(dxf_stream.read())
        temp_file_path = temp_file.name

    return read_dxf_file(temp_file_path)

def read_dxf_file(dxf_path: str) -> Tuple[Drawing, List[OriginalFootprint]] | None:
    """
    Reads a DXF file and performs several cleaning operations.

    - Handles corrupt files with duplicate handles by auditing and fixing them.
    - Captures the original entities' handles + footprints *before* any cleaning,
      so handles can later be matched back to the original uploaded DXF.
    - Removes all TEXT and MTEXT entities (from the geometry drawing only).
    - Explodes complex entities like HATCH, INSERT (blocks), and DIMENSIONS into
      simpler geometric primitives (lines, arcs, etc.).

    Args:
        dxf_path: The file path to the DXF document.

    Returns:
        A tuple of (cleaned Drawing, original footprints), or None if the file
        cannot be loaded.
    """
    try:
        # 1. Load the document. ezdxf will attempt to fix minor errors on load.
        doc, auditor = recover.readfile(dxf_path)
    except IOError:
        logger.error(f"Could not find or read file: {dxf_path}")
        return None
    except ezdxf.DXFStructureError:
        logger.error(f"File '{dxf_path}' is severely corrupt and cannot be loaded.")
        return None

    if auditor.has_errors:
        logger.warning("Auditor found and fixed errors in document.", extra={"count": len(auditor.errors)})

    msp = doc.modelspace()

    # Capture original handles + footprints before any entity is deleted or the
    # drawing is decomposed into primitives (which re-numbers handles).
    original_footprints = _extract_original_footprints(msp)
    logger.info("Captured original entity footprints", extra={"count": len(original_footprints)})

    text_entities = msp.query("TEXT MTEXT IMAGE SOLID")
    if text_entities:
        for text_entity in text_entities:
            msp.delete_entity(text_entity)
        logger.info(f"Removed {len(text_entities)} TEXT/MTEXT/IMAGE entities.")
        
    new_doc = ezdxf.new()
    new_msp = new_doc.modelspace()
    
    flattened_entities = list(recursive_decompose(msp))
    
    for entity in flattened_entities:
        if isinstance(entity, DXFGraphic):
            new_entity = entity.copy()
            new_msp.add_entity(new_entity)
                
    logger.info(f"Successfully processed.")
    
    hatches = new_msp.query("HATCH")
    if hatches:
        logger.info(f"Found {len(hatches)} HATCH entities to convert to lines.")
        for hatch in hatches:  
            try:
                for line in hatch_entity(hatch):
                    new_msp.add_line(line.start, line.end, dxfattribs=hatch.graphic_properties())
                new_msp.delete_entity(hatch)
            except Exception as e:
                logger.error(f"Failed to convert HATCH (handle #{hatch.dxf.handle}): {e}")
                raise e
            
    exist_hatches = new_msp.query("HATCH")
    logger.info(f"After for loop, there are {len(exist_hatches)} HATCH entities to convert to lines.")
    logger.info(f"Successfully processed '{dxf_path}'.")

    return new_doc, original_footprints
