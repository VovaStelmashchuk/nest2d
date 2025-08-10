#!/usr/bin/env python3
"""
Main module for geometry testing - reads DXF files and converts entities to Shapely objects.
"""

from ast import List
from dataclasses import dataclass
import sys
import os
import argparse
import logging
from pathlib import Path

from core.geometry.build_geometry import build_geometry

import ezdxf
from shapely.plotting import patch_from_polygon

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def process_dxf_file(file_path: str, tolerance: float = 0.01, no_plot: bool = False):
    """
    Process a DXF file and convert entities to Shapely objects.
    """
    try:
        print(f"Processing DXF file: {file_path}")
        
        doc = ezdxf.readfile(file_path)
        print(f"✓ DXF file loaded successfully")
        closed_polygons = build_geometry(doc, tolerance)
        
        if no_plot:
            print(f"Computed {len(closed_polygons)} closed polygons; plotting disabled (--no-plot)")
            return
        
        import matplotlib.pyplot as plt
        
        # Compute the total bounds of all polygons to set the figure size and axis limits
        all_bounds = []
        for poly in closed_polygons:
            geom = poly.geometry
            if geom.is_empty:
                continue
            all_bounds.append(geom.bounds)
        if all_bounds:
            minx = min(b[0] for b in all_bounds)
            miny = min(b[1] for b in all_bounds)
            maxx = max(b[2] for b in all_bounds)
            maxy = max(b[3] for b in all_bounds)
        else:
            minx = miny = 0
            maxx = maxy = 1

        # Set figure size proportional to the bounding box, with a minimum size
        width = maxx - minx
        height = maxy - miny
        min_figsize = 6
        aspect = width / height if height > 0 else 1
        if aspect >= 1:
            figsize = (max(min_figsize, min_figsize * aspect), min_figsize)
        else:
            figsize = (min_figsize, max(min_figsize, min_figsize / aspect))

        import matplotlib.pyplot as plt
        fig, ax = plt.subplots(figsize=figsize)
        for poly in closed_polygons:
            geom = poly.geometry
            handles = poly.handles
            if geom.is_empty:
                print(f"Empty geometry: {handles}")
                continue
            if geom.geom_type == "Polygon":
                x, y = geom.exterior.xy
                ax.fill(x, y, alpha=0.5, edgecolor='black')
                # Place label at centroid
                cx, cy = geom.centroid.x, geom.centroid.y
                #ax.text(cx, cy, str(handles), fontsize=8, ha='center', va='center')
            elif geom.geom_type == "MultiPolygon":
                for part in geom.geoms:
                    x, y = part.exterior.xy
                    ax.fill(x, y, alpha=0.5, edgecolor='black')
                    cx, cy = part.centroid.x, part.centroid.y
                    #ax.text(cx, cy, str(handles), fontsize=8, ha='center', va='center')
         
        ax.set_aspect('equal')
        plt.savefig("dxf_geometry.png")
        
    except Exception as e:
        logger.error(f"Error processing DXF file {file_path}: {e}")
        raise e


def main():
    """Main function to run the geometry module."""
    parser = argparse.ArgumentParser(description="Convert DXF entities to Shapely objects")
    parser.add_argument(
        "dxf_file", 
        type=str, 
        help="Path to the DXF file to process"
    )
    parser.add_argument(
        "--tolerance", 
        type=float, 
        default=0.01, 
        help="Tolerance for curve flattening (default: 0.01)"
    )
    parser.add_argument(
        "--no-plot",
        action="store_true",
        help="Skip plotting (faster for large DXF files)"
    )
    parser.add_argument(
        "--verbose", 
        action="store_true", 
        help="Enable verbose output"
    )
    
    args = parser.parse_args()
    
    if not os.path.exists(args.dxf_file):
        print(f"Error: File {args.dxf_file} does not exist")
        sys.exit(1)
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    process_dxf_file(args.dxf_file, args.tolerance, no_plot=args.no_plot)


main()