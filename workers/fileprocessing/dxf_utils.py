import tempfile
import uuid
import ezdxf
from ezdxf.document import Drawing
from gridfs.synchronous.grid_file import GridOut
from ezdxf.audit import Auditor
from ezdxf.explode import explode_entity
from ezdxf import recover
from utils.logger import setup_logger
from ezdxf.render.hatching import hatch_entity 

logger = setup_logger("dxf_utils")

def read_dxf(dxf_stream: GridOut) -> Drawing:
    """
    Reads a DXF stream and returns the modelspace without entities TEXT and MTEXT.

    Parameters:
        dxf_stream: The DXF string to process.

    Returns:
        Modelspace: The modelspace of the DXF document.
    """
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        temp_file.write(dxf_stream.read())
        temp_file_path = temp_file.name

    return read_dxf_file(temp_file_path)

def read_dxf_file(dxf_path: str) -> Drawing | None:
    """
    Reads a DXF file and performs several cleaning operations.

    - Handles corrupt files with duplicate handles by auditing and fixing them.
    - Removes all TEXT and MTEXT entities.
    - Explodes complex entities like HATCH, INSERT (blocks), and DIMENSIONS into
      simpler geometric primitives (lines, arcs, etc.).

    Args:
        dxf_path: The file path to the DXF document.

    Returns:
        The modified ezdxf Drawing object, or None if the file cannot be loaded.
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

    text_entities = msp.query("TEXT MTEXT IMAGE")
    if text_entities:
        for text_entity in text_entities:
            msp.delete_entity(text_entity)
        logger.info(f"Removed {len(text_entities)} TEXT/MTEXT/IMAGE entities.")

    # Loop until there are no INSERT or HATCH entities left in the modelspace
    insert_hatch_loop_iterations = 0
    while True:
        insert_hatch_loop_iterations += 1
        logger.info(f"Insert/Hatch loop iteration {insert_hatch_loop_iterations}.")
        
        inserts = msp.query("INSERT")
        hatches = msp.query("HATCH")
        if not inserts and not hatches:
            break

        if inserts:
            logger.info("Found complex INSERT entities to explode.", extra={"count": len(inserts)})
            for entity in list(inserts):  # list() to avoid issues if msp changes during iteration
                try:
                    exploded_entities = explode_entity(entity)
                    for new_entity in exploded_entities:
                        msp.add_entity(new_entity)
                    msp.delete_entity(entity)
                except Exception as e:
                    logger.error("Failed to explode entity", extra={"entity_type": entity.dxftype(), "error": e})
                    raise e

        if hatches:
            logger.info(f"Found {len(hatches)} HATCH entities to convert to lines.")
            for hatch in list(hatches):  # list() to avoid issues if msp changes during iteration
                try:
                    for line in hatch_entity(hatch):
                        msp.add_line(line.start, line.end, dxfattribs=hatch.graphic_properties())
                    msp.delete_entity(hatch)
                except Exception as e:
                    logger.error(f"Failed to convert HATCH (handle #{hatch.dxf.handle}): {e}")
                    raise e


    logger.info(f"Successfully processed '{dxf_path}'.")
    return doc