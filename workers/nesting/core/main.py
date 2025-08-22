from datetime import datetime
import json
import subprocess
import sys
import os
import io
from pathlib import Path
from utils.mongo import valid_dxf_bucket, dxf_result_bucket, svg_result_bucket
from utils.mongo import db
from core.nesting_input_builder import build_input_json, build_item
from dxf.dxf_utils import read_dxf
from core.svg_generator import create_svg_from_doc
from ezdxf.document import Drawing
import ezdxf
from ezdxf import xref
import math
import io
from ezdxf.math import Matrix44
from shapely.geometry import Polygon

sys.path.append(str(Path(__file__).parent.parent))

from utils.logger import setup_logger

logger = setup_logger("core_nesting")

class Transform:
    def __init__(self, file_slug: str, handles, x, y, angle):
        self.file_slug = file_slug
        self.handles = handles
        self.x = x
        self.y = y
        self.angle = angle

    def __str__(self) -> str:
        return f"Transform -> File(Parts): {self.file_slug}, Handles: {self.handles}, X: {self.x}, Y: {self.y}, Angle: {self.angle}"
    
class ResultContainer:
    def __init__(self, container_id, transforms):
        self.container_id = container_id
        self.transforms = transforms
    
    def __str__(self) -> str:
        return f"ResultContainer -> Container(ID): {self.container_id}, Transforms: {self.transforms}"
    
def convert_files_to_input_items(files, space):
    input_items = []
    id = 0
    for file in files:
        file_slug = file.get("slug")
        count = file.get("count")
        
        user_dxf_file = db["user_dxf_files"].find_one({"slug": file_slug})
        plogonParts = user_dxf_file.get("polygonParts")
        for part in plogonParts:
            coords = part.get("coordinates")
            handles = part.get("handles")
            
            shapely_polygon = Polygon(coords)
            buffered_polygon = shapely_polygon.buffer(space)
            buffered_polygon_coords = list(buffered_polygon.exterior.coords)
            
            item = {
                'id': id,
                'file_slug': file_slug,
                'coords': buffered_polygon_coords,
                'handles': handles,
                'count': count
            }
            
            id += 1
        
            input_items.append(item)
    
    return input_items


def save_dxf_result(owner_id, file_name, drawing):
    dxf_copy_text_stream = io.StringIO()
    drawing.write(dxf_copy_text_stream)
    dxf_copy_text = dxf_copy_text_stream.getvalue()
    dxf_copy_text_stream.close()
    
    dxf_copy_bytes = dxf_copy_text.encode('utf-8')
    
    dxf_result_bucket.upload_from_stream(filename=file_name, source=dxf_copy_bytes, metadata={"ownerId": owner_id})
    
def save_svg_result(owner_id, file_name, drawing):
    svg_string = create_svg_from_doc(drawing, 0.001)
    svg_bytes = io.BytesIO(svg_string.encode("utf-8"))
    svg_result_bucket.upload_from_stream(filename=file_name, source=svg_bytes, metadata={"ownerId": owner_id})

def build_result_dxf_files(owner_id, slug, result_containers):
    """
    Iterates through containers, builds a combined/transformed DXF for each,
    and saves the result.
    """
    print(f"Starting build process for slug: {slug}")
   
    dxf_files = []
    svg_files = []
    for result_container in result_containers:
        dxf_file_name = f"{slug}_part_{result_container.container_id}.dxf"
        
        new_drawing = build_part(result_container.transforms)
        
        logger.info("Saving combined file", extra={"file_name": dxf_file_name})
        save_dxf_result(owner_id, dxf_file_name, new_drawing)
        dxf_files.append(dxf_file_name)
        
        svg_file_name = f"{slug}_part_{result_container.container_id}.svg"
        save_svg_result(owner_id, svg_file_name, new_drawing)
        svg_files.append(svg_file_name)
        
    db["nesting_jobs"].update_one(
        {"slug": slug},
        {
            "$set": {
                "dxf_files": dxf_files,
                "svg_files": svg_files,
                "update_ts": datetime.now()
            },
        }
    )
 
def build_part(transforms):
    """
    Creates a single new DXF drawing by fetching, transforming, and combining
    entities from a list of transform operations.
    """
    new_doc = ezdxf.new()
    new_msp = new_doc.modelspace()

    for transform in transforms:
        try:
            source_doc, entities_to_process = get_entities_from_dxf_file(
                transform.file_slug, transform.handles
            )
            
            if not entities_to_process:
                logger.warning("No entities found in file", extra={"file_slug": transform.file_slug})
                continue
            required_layers = {entity.dxf.layer for entity in entities_to_process}
            
            loader = ezdxf.xref.Loader(source_doc, new_doc)
            
            if required_layers:
                loader.load_layers(list(required_layers))
            
            loader.execute()

            rotationMatrix = Matrix44.z_rotate(transform.angle)
            translationMatrix = Matrix44.translate(transform.x, transform.y, 0)
            matrix = rotationMatrix * translationMatrix

            for entity in entities_to_process:
                new_entity = entity.copy()
                new_entity.transform(matrix)
                new_msp.add_entity(new_entity)
            
            logger.info(
                "Entities from file moved to file", 
                extra={"file_slug": transform.file_slug, "count": len(entities_to_process)}
            )

        except Exception as e:
            logger.error("Error processing transform", extra={"file_slug": transform.file_slug, "error": e})
            raise e
   
    return new_doc

dxf_document_cache = {}

def get_entities_from_dxf_file(dxf_file_slug, handles):
    """
    Opens a DXF file and returns the doc object and a list of entities 
    matching the given handles.
    """
    if dxf_file_slug in dxf_document_cache:
        doc = dxf_document_cache[dxf_file_slug]
    else:
        dxf_file = valid_dxf_bucket.open_download_stream_by_name(filename=dxf_file_slug)
        doc = read_dxf(dxf_file)
        dxf_document_cache[dxf_file_slug] = doc
        
    msp = doc.modelspace()
    
    handle_set = set(handles)
    
    entities = []
    for entity in msp:
        if entity.dxf.handle in handle_set:
            entities.append(entity)
            
    return doc, entities

def nesting_process(doc):
    logger.info("Processing nesting", extra={"doc": doc["slug"]})
    dxf_document_cache.clear()
    
    slug = doc.get("slug")
    files = doc.get("files")
    params = doc.get("params")
    width = params.get("width")
    height = params.get("height")
    space = params.get("space")
    bin_count = params.get("sheetCount")
    owner_id = doc.get("ownerId")
   
    input_items = convert_files_to_input_items(files, space)
    jaguar_items = []
   
    total_requested_count = 0
    for item in input_items:
        count = item.get("count")
        jaguar_item = build_item(item.get("id"), count, item.get("coords"))
        total_requested_count += count
        jaguar_items.append(jaguar_item)
        
    db["nesting_jobs"].update_one(
        {"_id": doc.get("_id")},
        {
            "$set": {
                "requested": total_requested_count,
                "update_ts": datetime.now()
            },
        }
    )
        
    input_json = build_input_json(bin_count, width, height, jaguar_items)
    input_json_as_string : str = json.dumps(input_json)
    
    result = subprocess.run(
        ['lbf'],
        input=input_json_as_string,
        capture_output=True,
        text=True,
        timeout=3600
    )
    
    if result.returncode != 0:
        logger.error("❌ lbf failed with return code:", result.returncode)
        logger.error("Error output:")
        logger.error(result.stderr)
        raise Exception("❌ lbf failed with return code:", result.returncode)
        
    logger.info("✅ lbf executed successfully!")
    
    output = json.loads(result.stdout)
    logger.info("Solution:")
    
    solution = output.get("solution")
    logger.info(solution)
    
    layouts = solution.get("layouts")
    
    result_containers = []
    total_placed_count = 0
    
    container_id_increment = 1
    
    for layout in layouts:
        transforms = []
        placedItems = layout.get("placed_items")
        container_id = container_id_increment
        container_id_increment += 1
        for item in placedItems:
            item_id = item.get("item_id")
            transformation = item.get("transformation")
            rotation = transformation.get("rotation")
            translation = transformation.get("translation")
            x = translation[0]
            y = translation[1]
            
            file_slug = next(item for item in input_items if item.get("id") == item_id).get("file_slug")
            handles = next(item for item in input_items if item.get("id") == item_id).get("handles")
            
            transforms.append(Transform(file_slug, handles, x, y, rotation))
            total_placed_count += 1
        
        result_containers.append(ResultContainer(container_id, transforms))
        
    is_all_placed = total_placed_count == total_requested_count
    
    db["nesting_jobs"].update_one(
        { "slug": slug },
        {
            "$set": {
                "placed": total_placed_count,
                "layoutCount": len(layouts),
                "update_ts": datetime.now()
            },
        }
    )
    
    if not is_all_placed:
        db["nesting_jobs"].update_one(
            { "slug": slug },
            { 
                "$set": { 
                    "status": "error",
                    "finishedAt": datetime.now(),
                    "update_ts": datetime.now(),
                    "information": "Not all items could be placed in the nesting job"
                } 
            },
        )
        raise Exception("Not all items could be placed in the nesting job")
    
    build_result_dxf_files(owner_id, slug, result_containers)