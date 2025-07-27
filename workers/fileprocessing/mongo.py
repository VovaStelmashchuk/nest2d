import gridfs
from pymongo import MongoClient
import os

from logger import setup_logger

logger = setup_logger("mongo")

def create_mongo_client():
    mongo_uri = os.environ.get("MONGO_URI")
    if not mongo_uri:
        logger.error("Error: 'mongoUri' key not found in environment variables.")
        exit(1)

    return MongoClient(mongo_uri)


_client = create_mongo_client()
db = _client.get_default_database()

user_dxf_bucket = gridfs.GridFSBucket(db, bucket_name="userDxf")
user_svg_bucket = gridfs.GridFSBucket(db, bucket_name="userSvg")
valid_dxf_bucket = gridfs.GridFSBucket(db, bucket_name="validDxf")

