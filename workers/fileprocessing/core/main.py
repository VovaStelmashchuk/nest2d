import io
from utils.logger import setup_logger
from utils.mongo import user_dxf_bucket, valid_dxf_bucket, user_dxf_files_svg_bucket
from dxf_utils import read_dxf
from utils.mongo import db
from ezdxf.document import Drawing
from core.svg_generator import create_svg_from_doc
from core.polygonizer.main import close_polygon_from_dxf

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

def _make_svg_file(drawing, doc):
    if doc.get("isSvgFileExist", False):
        return
    
    logger = setup_logger("svg_file_maker")
    flattening = doc["flattening"]
    owner_id = doc["ownerId"]
    
    slug = doc["slug"]
    svg_slug = slug.removesuffix('.dxf') + '-origin.svg'
    
    logger.info("Making svg file", extra={"flattening": flattening, "file_slug": doc["slug"]})
    
    svg_string = create_svg_from_doc(drawing, flattening)
    svg_bytes = io.BytesIO(svg_string.encode("utf-8"))
    
    user_dxf_files_svg_bucket.upload_from_stream(filename=svg_slug, source=svg_bytes, metadata={"ownerId": owner_id})
    
    db["user_dxf_files"].update_one(
        {"_id": doc["_id"]},
        {"$set": {
            "isSvgFileExist": True,
            "svgFileSlug": svg_slug
        }}
    )

def process_file(doc):
    logger = setup_logger("core_fileprocessing")
    logger.info("Processing file", extra={"doc": doc})
    
    dxf_copy_drawing = _make_dxf_copy(doc)
    
    _make_svg_file(dxf_copy_drawing, doc)
    
    tolerance = doc["flattening"]
    
    closed_polygons = close_polygon_from_dxf(dxf_copy_drawing, tolerance, "dxf_polygonizer")
    print(closed_polygons)
    