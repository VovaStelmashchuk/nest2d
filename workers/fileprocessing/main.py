import time
import traceback
from utils.logger import setup_logger
from utils.mongo import db, _client

logger = setup_logger("main_fileprocessing")
logger.info("Starting new file processing worker")

try:
    db.command('ping')
    logger.info("Database connection successful")

except Exception as e:
    logger.error(f"Database connection failed: {e}")
    raise e

user_dxf_files = db["user_dxf_files"]

while True:
    logger.info("Worker file processing try to find new files to process")
    doc = user_dxf_files.find_one_and_update(
        {"processingStatus": "pending"},
        {"$set": {"processingStatus": "processing"}},
        return_document=ReturnDocument.AFTER
    )
    
    if doc is None:
        time.sleep(5)
        continue
    
    try:
        doJobProject(doc)
    except Exception as e:
        logger.error("Error in project processing", extra={"error": str(e), "traceback": traceback.format_exc()})
        user_dxf_files.update_one(
            {"_id": doc["_id"]},
            {"$set": {"processingStatus": "error",
                      "processingError": str(e)}}
        )