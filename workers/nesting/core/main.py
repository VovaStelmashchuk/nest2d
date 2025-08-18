import sys
import os
from pathlib import Path

# Add the parent directory to the path to import jagua_wrapper
sys.path.append(str(Path(__file__).parent.parent))

from jagua_wrapper import JaguaWrapper
from utils.logger import setup_logger

logger = setup_logger("core_nesting")

def nesting_process(doc):
    logger.info("Processing nesting", extra={"doc": doc["slug"]})
    
    slug = doc.get("slug")
    files = doc.get("files")
    params = doc.get("params")
    width = params.get("width")
    height = params.get("height")
    tolerance = params.get("tolerance", 0.001)
    space = params.get("space", 0.0)
    sheet_count = params.get("sheetCount", 1)
    
    try:
        # Initialize jagua-rs wrapper
        jagua = JaguaWrapper()
        
        # Try to build jagua-rs if not available, but don't fail if it doesn't work
        if not jagua.jagua_path and not jagua.use_python_fallback:
            logger.info("jagua-rs not built, attempting to build...")
            if jagua.build_jagua():
                logger.info("jagua-rs built successfully, using Rust implementation")
            else:
                logger.warning("Failed to build jagua-rs, using Python fallback")
        
        # Convert files to parts format expected by jagua-rs
        parts = []
        for file_info in files:
            # This is a simplified example - you'll need to adapt based on your file format
            part = {
                "id": file_info.get("id", "unknown"),
                "geometry": file_info.get("geometry", []),  # SVG path data or coordinates
                "quantity": file_info.get("quantity", 1)
            }
            parts.append(part)
        
        # Solve the nesting problem
        if height is None or height <= 0:
            # Strip packing problem
            logger.info(f"Solving strip packing with width {width}")
            solution = jagua.solve_strip_packing(
                parts=parts,
                strip_width=width,
                tolerance=tolerance,
                space=space
            )
        else:
            # Bin packing problem
            logger.info(f"Solving bin packing with dimensions {width}x{height}")
            solution = jagua.solve_bin_packing(
                parts=parts,
                bin_width=width,
                bin_height=height,
                tolerance=tolerance,
                space=space
            )
        
        # Log which implementation was used
        if jagua.use_python_fallback:
            logger.info("Nesting solved using Python fallback implementation")
        else:
            logger.info("Nesting solved using jagua-rs Rust implementation")
        
        logger.info("Nesting solved successfully", extra={"solution": solution})
        
        # Here you would process the solution and save results
        # For now, just log the solution
        return solution
        
    except Exception as e:
        logger.error(f"Error in nesting process: {e}")
        raise Exception(f"Nesting failed: {str(e)}")