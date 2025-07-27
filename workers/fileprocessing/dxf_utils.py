import tempfile
import uuid
import ezdxf
from ezdxf.document import Drawing
from gridfs.synchronous.grid_file import GridOut
from ezdxf.disassemble import recursive_decompose
from utils.logger import setup_logger

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

def read_dxf_file(dxf_path: str) -> Drawing:
    doc = ezdxf.readfile(dxf_path)
    msp = doc.modelspace()

    text_entities = [entity for entity in msp if entity.dxftype() in ("TEXT", "MTEXT")]
    
    for entity in text_entities:
        msp.delete_entity(entity)
        
    new_doc = ezdxf.new(dxfversion=doc.dxfversion)
    new_msp = new_doc.modelspace()
    
    for layer in doc.layers:
        if layer.dxf.name not in new_doc.layers:
            new_layer = new_doc.layers.add(name=layer.dxf.name)
            new_layer.dxf.color = layer.dxf.color
            new_layer.dxf.linetype = layer.dxf.linetype
            new_layer.dxf.lineweight = layer.dxf.lineweight
        else:
            existing_layer = new_doc.layers.get(layer.dxf.name)
            existing_layer.dxf.color = layer.dxf.color
            existing_layer.dxf.linetype = layer.dxf.linetype
            existing_layer.dxf.lineweight = layer.dxf.lineweight
            
    entities = recursive_decompose(msp)
    
    # Copy all entities (except text entities which were already removed)
    for entity in entities:
        try:
            new_entity = entity.copy()
            new_entity.dxf.handle = uuid.uuid4().hex[:8].upper()
            new_msp.add_entity(new_entity.copy())
        except Exception as e:
            logger.warning("Warning: Could not copy entity", extra={
                "entity_type": entity.dxftype(),
                "handle": getattr(entity.dxf, 'handle', 'unknown'),
                "error": e
            })
            continue
    
    return new_doc