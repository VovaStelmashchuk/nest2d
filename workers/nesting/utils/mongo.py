import gridfs
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

from .logger import setup_logger

logger = setup_logger("mongo")

def create_mongo_client():
    mongo_uri = os.environ.get("MONGO_URI")
    if not mongo_uri:
        logger.error("Error: 'mongoUri' key not found in environment variables.")
        raise Exception("Mongo connection failed")

    return MongoClient(mongo_uri)


_client : MongoClient = create_mongo_client()
db = _client.get_default_database()

user_dxf_bucket = gridfs.GridFSBucket(db, bucket_name="userDxf")
valid_dxf_bucket = gridfs.GridFSBucket(db, bucket_name="validDxf")

user_dxf_files_svg_bucket = gridfs.GridFSBucket(db, bucket_name="userDxfFilesSvg")


svg_result_bucket = gridfs.GridFSBucket(db, bucket_name="nestSvg")
dxf_result_bucket = gridfs.GridFSBucket(db, bucket_name="nestDxf")

