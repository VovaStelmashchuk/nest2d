from __future__ import annotations

from dataclasses import dataclass
from typing import List
from shapely.geometry import Point
from shapely.geometry import Polygon
from shapely.geometry import LineString

@dataclass(slots=True)
class ClosedPolygon:
    points: List[Point]
    handles: List[str]
    _geometry_cache: Polygon = None
    
    @property
    def geometry(self) -> Polygon:
        if self._geometry_cache is None:
            self._geometry_cache = Polygon(self.points)
        return self._geometry_cache
    
@dataclass(slots=True)
class PolygonPart:
    points: List[Point]
    handles: List[str]
   
    @property
    def geometry(self) -> Polygon:
        line = LineString(self.points)
        buffer = line.buffer(0.1)
        return buffer
    
    def is_valid(self) -> bool:
        return len(self.points) >= 2 
    
    def is_closed(self, tol: float) -> bool:
        return self.is_valid() and (self.points[0].distance(self.points[-1]) <= tol)
    
    def to_closed_polygon(self) -> ClosedPolygon:
        return ClosedPolygon(points=self.points, handles=self.handles)
