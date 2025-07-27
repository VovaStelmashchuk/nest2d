import time
import traceback
import threading
from datetime import datetime
from utils.logger import setup_logger
from utils.mongo import db, _client
from pymongo import ReturnDocument
from core.main import process_file

logger = setup_logger("main_fileprocessing")
logger.info("Starting new file processing worker")

try:
    db.command('ping')
    logger.info("Database connection successful")

except Exception as e:
    logger.error(f"Database connection failed: {e}")
    raise e

user_dxf_files = db["user_dxf_files"]

current_doc_id = None

def keep_alive_worker():
    global current_doc_id
    
    while True:
        if current_doc_id:
            try:
                user_dxf_files.update_one(
                    {"_id": current_doc_id},
                    {"$set": {"update_ts": datetime.now()}}
                )
                logger.debug(f"Updated keep-alive for document {current_doc_id}")
            except Exception as e:
                logger.error(f"Failed to update keep-alive: {e}")
        
        time.sleep(10)

keepalive_thread = threading.Thread(target=keep_alive_worker, daemon=True)
keepalive_thread.start()

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
    
    current_doc_id = doc["_id"]
    
    try:
        process_file(doc)
        
        user_dxf_files.update_one(
            {"_id": doc["_id"]},
            {"$set": {"processingStatus": "completed"}}
        )
        
    except Exception as e:
        logger.error("Error in project processing", extra={"error": str(e), "traceback": traceback.format_exc()})
        user_dxf_files.update_one(
            {"_id": doc["_id"]},
            {"$set": {"processingStatus": "error",
                      "processingError": str(e)}}
        )
    finally:
        current_doc_id = None