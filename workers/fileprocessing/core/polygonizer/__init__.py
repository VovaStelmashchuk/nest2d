"""
Polygonizer module for processing DXF files and extracting polygons.
"""

from .core import combine_polygon_parts
from .dto import PolygonPart, Point, ClosedPolygon

__all__ = [
    'combine_polygon_parts',
    'PolygonPart', 
    'Point', 
    'ClosedPolygon'
]

__version__ = "0.1.0" 