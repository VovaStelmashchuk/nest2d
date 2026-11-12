import math
import time
import traceback
import threading
import signal
import sys
from datetime import datetime
from utils.logger import setup_logger
from utils import db
from core.main import nesting_process

logger = setup_logger("main_nesting")
logger.info("Starting new nesting worker")

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
            db.execute(
                "UPDATE nesting_jobs SET status = 'pending' WHERE id = %s",
                (current_doc_id,),
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
    db.execute("SELECT 1")
    logger.info("Database connection successful")

except Exception as e:
    logger.error(f"Database connection failed: {e}")
    raise e

def keep_alive_worker():
    global current_doc_id

    while not shutdown_requested:
        if current_doc_id:
            try:
                db.execute(
                    "UPDATE nesting_jobs SET update_ts = now() WHERE id = %s",
                    (current_doc_id,),
                )
                logger.debug(f"Updated keep-alive for document {current_doc_id}")
            except Exception as e:
                logger.error(f"Failed to update keep-alive: {e}")

        time.sleep(keep_alive_interval)

keepalive_thread = threading.Thread(target=keep_alive_worker, daemon=True)
keepalive_thread.start()

while not shutdown_requested:
    logger.info("Worker nesting try to find new files to process")
    try:
        doc = db.claim_next("nesting_jobs", "status")
    except Exception as e:
        # e.g. the app has not created the schema yet
        logger.error("Failed to claim next job", extra={"error": str(e)})
        time.sleep(5)
        continue

    if doc is None:
        time.sleep(5)
        continue

    current_doc_id = doc["id"]

    try:
        start_at = datetime.now()
        db.execute(
            "UPDATE nesting_jobs SET start_at = now() WHERE id = %s",
            (current_doc_id,),
        )

        nesting_process(doc)

        time_taken = datetime.now() - start_at
        time_taken_minutes = math.ceil(time_taken.total_seconds() / 60)

        db.execute(
            """
            UPDATE nesting_jobs
            SET status = 'done', finished_at = now(), update_ts = now(), time_taken = %s
            WHERE id = %s
            """,
            (time_taken_minutes, current_doc_id),
        )

        db.execute(
            "UPDATE users SET nesting_count = nesting_count + 1 WHERE id = %s",
            (doc["owner_id"],),
        )
    except Exception as e:
        logger.error("Error in project processing", extra={"error": str(e), "traceback": traceback.format_exc()})
        db.execute(
            """
            UPDATE nesting_jobs
            SET status = 'error', error = %s, update_ts = now(), finished_at = now()
            WHERE id = %s
            """,
            (str(e), current_doc_id),
        )
    finally:
        current_doc_id = None
