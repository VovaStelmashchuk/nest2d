import time
import traceback
import threading
import signal
import sys
from datetime import datetime
from utils.logger import setup_logger
from utils.mongo import db
from pymongo import ReturnDocument
from core.main import process_file

logger = setup_logger("main_stripfileprocessing")
logger.info("Starting strip file processing worker")

keep_alive_interval = 10

current_doc_id = None
shutdown_requested = False

strip_user_dxf_files = db["strip_user_dxf_files"]

def signal_handler(signum, frame):
    """Handle graceful shutdown signals"""
    global current_doc_id, shutdown_requested

    logger.info(f"Received {signum} signal, initiating graceful shutdown")

    shutdown_requested = True

    if current_doc_id:
        try:
            logger.info(f"Resetting current job {current_doc_id} to pending status")
            strip_user_dxf_files.update_one(
                {"_id": current_doc_id},
                {"$set": {"processingStatus": "pending"}}
            )
            logger.info(f"Successfully reset job {current_doc_id} to pending")
        except Exception as e:
            logger.error(f"Failed to reset job {current_doc_id}: {e}")
    else:
        logger.info("No current job to reset")

    logger.info("Graceful shutdown completed")
    sys.exit(0)

signal.signal(signal.SIGTERM, signal_handler)

try:
    db.command('ping')
    logger.info("Database connection successful")
except Exception as e:
    logger.error(f"Database connection failed: {e}")
    raise e

def keep_alive_worker():
    global current_doc_id

    while not shutdown_requested:
        if current_doc_id:
            try:
                strip_user_dxf_files.update_one(
                    {"_id": current_doc_id},
                    {"$set": {"update_ts": datetime.now()}}
                )
                logger.debug(f"Updated keep-alive for document {current_doc_id}")
            except Exception as e:
                logger.error(f"Failed to update keep-alive: {e}")

        time.sleep(keep_alive_interval)

keepalive_thread = threading.Thread(target=keep_alive_worker, daemon=True)
keepalive_thread.start()

logger.info("Strip file processing worker started")

while not shutdown_requested:
    logger.info("Strip worker try to find new files to process")
    doc = strip_user_dxf_files.find_one_and_update(
        {"processingStatus": "pending"},
        {"$set": {"processingStatus": "processing"}},
        return_document=ReturnDocument.AFTER
    )

    if doc is None:
        time.sleep(5)
        continue

    current_doc_id = doc["_id"]

    try:
        strip_user_dxf_files.update_one(
            {"_id": current_doc_id},
            {"$set": {"update_ts": datetime.now()}}
        )
        result = process_file(doc)

        if result:
            strip_user_dxf_files.update_one(
                {"_id": current_doc_id},
                {"$set": {"processingStatus": "completed"}}
            )
        else:
            strip_user_dxf_files.update_one(
                {"_id": current_doc_id},
                {"$set": {"processingStatus": "pending"}}
            )

    except Exception as e:
        logger.error("Error in strip file processing", extra={"error": str(e), "traceback": traceback.format_exc()})
        strip_user_dxf_files.update_one(
            {"_id": current_doc_id},
            {"$set": {"processingStatus": "error",
                      "processingError": str(e)}}
        )
    finally:
        current_doc_id = None
