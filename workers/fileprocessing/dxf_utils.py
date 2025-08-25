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
from ezdxf.disassemble import recursive_decompose
from ezdxf.entities import DXFGraphic

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
    
    return new_doc
