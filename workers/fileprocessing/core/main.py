import io
from utils.logger import setup_logger
from utils.mongo import user_dxf_bucket, valid_dxf_bucket
from dxf_utils import read_dxf
from utils.mongo import db
from ezdxf.document import Drawing

def _make_dxf_copy(doc) -> Drawing:
    logger = setup_logger("dxf_copy_maker")
    dxf_file_slug = doc["slug"]
    user_id = doc["ownerId"]
    
    logger.info("Making dxf copy", extra={"dxf_file_slug": dxf_file_slug})
    
    try:
        grid_out = valid_dxf_bucket.open_download_stream_by_name(dxf_file_slug)
        dxf_copy_drawing = read_dxf(grid_out)
        logger.info("Dxf copy already exists", extra={"dxf_file_slug": dxf_file_slug})
        
        db["user_dxf_files"].update_one(
            {"_id": doc["_id"]},
            {"$set": {"isDxfCopyExist": True}}
        )
        
        return dxf_copy_drawing
    except:
        pass
    
    grid_out = user_dxf_bucket.open_download_stream_by_name(dxf_file_slug)
    
    dxf_copy = read_dxf(grid_out)
    
    dxf_copy_text_stream = io.StringIO()
    dxf_copy.write(dxf_copy_text_stream)
    dxf_copy_text = dxf_copy_text_stream.getvalue()
    dxf_copy_text_stream.close()
    
    dxf_copy_bytes = dxf_copy_text.encode('utf-8')
    
    valid_dxf_bucket.upload_from_stream(filename=dxf_file_slug, source=dxf_copy_bytes, metadata={"ownerId": user_id})
    
    logger.info("Dxf copy made", extra={"dxf_file_slug": dxf_file_slug})
    
    db["user_dxf_files"].update_one(
        {"_id": doc["_id"]},
        {"$set": {"isDxfCopyExist": True}}
    )
    
    return dxf_copy

def process_file(doc):
    logger = setup_logger("core_fileprocessing")
    logger.info("Processing file", extra={"doc": doc})
    
    dxf_copy_drawing = _make_dxf_copy(doc)
    