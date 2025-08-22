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
        doc, auditor = recover.readfile(dxf_path)
    except IOError:
        logger.error(f"Could not find or read file: {dxf_path}")
        return None
    except ezdxf.DXFStructureError:
        logger.error(f"File '{dxf_path}' is severely corrupt and cannot be loaded.")
        return None

    return doc