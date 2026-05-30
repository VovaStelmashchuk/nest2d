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
        logger.error("Error: 'MONGO_URI' key not found in environment variables.")
        raise Exception("Mongo connection failed")

    return MongoClient(mongo_uri)


_client : MongoClient = create_mongo_client()
db = _client.get_default_database()

# Source bucket holding the user uploaded strip DXF files. The polygon outlines
# used for nesting are read from the `polygonParts` field of the
# `strip_user_dxf_files` collection (attached by the stripfileprocessing worker),
# so this bucket is only needed if a future change rebuilds original geometry.
strip_user_dxf_bucket = gridfs.GridFSBucket(db, bucket_name="stripUserDxf")

# Result bucket — kept separate from the bin nesting bucket (nestDxf) so the
# strip application stays fully independent. The strip app works with DXF only;
# no SVG is generated.
strip_nest_dxf_bucket = gridfs.GridFSBucket(db, bucket_name="stripNestDxf")
