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
