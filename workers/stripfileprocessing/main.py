import time
import traceback
import threading
import signal
import sys
from utils.logger import setup_logger
from utils import db
from core.main import process_file

logger = setup_logger("main_stripfileprocessing")
logger.info("Starting strip file processing worker")

keep_alive_interval = 10

current_doc_id = None
shutdown_requested = False

def signal_handler(signum, frame):
    """Handle graceful shutdown signals"""
    global current_doc_id, shutdown_requested

    logger.info(f"Received {signum} signal, initiating graceful shutdown")

    shutdown_requested = True

    if current_doc_id:
        try:
            logger.info(f"Resetting current job {current_doc_id} to pending status")
            set_status(current_doc_id, "pending")
            logger.info(f"Successfully reset job {current_doc_id} to pending")
        except Exception as e:
            logger.error(f"Failed to reset job {current_doc_id}: {e}")
    else:
        logger.info("No current job to reset")

    logger.info("Graceful shutdown completed")
    sys.exit(0)

signal.signal(signal.SIGTERM, signal_handler)

try:
    db.execute("SELECT 1")
    logger.info("Database connection successful")
except Exception as e:
    logger.error(f"Database connection failed: {e}")
    raise e

def set_status(doc_id, status, error=None):
    db.execute(
        "UPDATE strip_user_dxf_files SET processing_status = %s, processing_error = %s WHERE id = %s",
        (status, error, doc_id),
    )

def keep_alive_worker():
    global current_doc_id

    while not shutdown_requested:
        if current_doc_id:
            try:
                db.execute(
                    "UPDATE strip_user_dxf_files SET update_ts = now() WHERE id = %s",
                    (current_doc_id,),
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
    try:
        doc = db.claim_next("strip_user_dxf_files", "processing_status")
    except Exception as e:
        # e.g. the app has not created the schema yet
        logger.error("Failed to claim next file", extra={"error": str(e)})
        time.sleep(5)
        continue

    if doc is None:
        time.sleep(5)
        continue

    current_doc_id = doc["id"]

    try:
        result = process_file(doc)

        if result:
            set_status(current_doc_id, "completed")
        else:
            set_status(current_doc_id, "pending")

    except Exception as e:
        logger.error("Error in strip file processing", extra={"error": str(e), "traceback": traceback.format_exc()})
        set_status(current_doc_id, "error", str(e))
    finally:
        current_doc_id = None
