from core.main import setup_logger

logger = setup_logger("core_nesting")

def nesting_process(doc):
    logger.info("Processing nesting", extra={"doc": doc["slug"]})
    
    slug = doc.get("slug")
    files = doc.get("files")
    params = doc.get("params")
    width = params.get("width")
    height = params.get("height")
    tolerance = params.get("tolerance")
    space = params.get("space")
    sheet_count = params.get("sheetCount")
    
    raise Exception("Not implemented")