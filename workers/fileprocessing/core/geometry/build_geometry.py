from ast import List
from dataclasses import dataclass
from dxf_parser import DxfEntityGeometry
from dxf_parser import convert_entity_to_shapely

from shapely.geometry.base import BaseGeometry
from ezdxf.document import Drawing

from typing import List, Tuple, Union
from dataclasses import dataclass
import geopandas as gpd
from geopandas.tools import sjoin
import networkx as nx
from ezdxf.document import Drawing
from shapely.geometry import Polygon, MultiPolygon
from shapely.geometry.base import BaseGeometry
from shapely.ops import unary_union
from ezdxf.math import Vec3


@dataclass(slots=True, frozen=True)
class ClosedPolygon:
    geometry: Polygon
    handles: List[str]
    
def merge_dxf_entities_into_polygons(dxf_entities: List[DxfEntityGeometry]) -> List[ClosedPolygon]:
    """
    Merges intersecting DxfEntityGeometry objects into a list of ClosedPolygon objects
    using an efficient, vectorized approach.
    """
    if not dxf_entities:
        return []

    # 1. Convert the list of DxfEntityGeometry into a GeoDataFrame
    geometries = [d.geometry for d in dxf_entities]
    handles = [d.handle for d in dxf_entities]
    
    gdf = gpd.GeoDataFrame(
        data={'handle': handles},
        geometry=geometries,
        crs="EPSG:4326"
    )
    
    # 2. Find intersecting pairs using sjoin
    intersecting_pairs = sjoin(gdf, gdf, how='inner', predicate='intersects')
    intersecting_pairs = intersecting_pairs[intersecting_pairs.index != intersecting_pairs.index_right]

    # 3. Build a graph from the intersecting pairs
    G = nx.from_pandas_edgelist(intersecting_pairs.reset_index(), source='index', target='index_right')
    
    # 4. Find all connected components in the graph
    components = list(nx.connected_components(G))
    
    merged_polygons: List[ClosedPolygon] = []

    # 5. Merge geometries and handles for each component
    for component_indices in components:
        component_parts = gdf.loc[list(component_indices)]
        
        merged_geom = unary_union(component_parts['geometry'])
        
        # Collect all handles from the component
        combined_handles = list(component_parts['handle'].unique())
            
        if isinstance(merged_geom, MultiPolygon):
            # For MultiPolygon, find the largest part and take its exterior
            largest_polygon = max(merged_geom.geoms, key=lambda p: p.area)
            exterior_polygon = Polygon(largest_polygon.exterior)
            merged_polygons.append(ClosedPolygon(geometry=exterior_polygon, handles=combined_handles))
        elif isinstance(merged_geom, Polygon):
            # For a single Polygon, just take its exterior
            exterior_polygon = Polygon(merged_geom.exterior)
            merged_polygons.append(ClosedPolygon(geometry=exterior_polygon, handles=combined_handles))


    return merged_polygons

def build_geometry(drawing: Drawing, tolerance: float = 0.01) -> List[ClosedPolygon]:
    msp = drawing.modelspace() 
    
    dxf_geometries: List[DxfEntityGeometry] = []
    
    for entity in msp:
        try:
            dxf_geometry: DxfEntityGeometry = convert_entity_to_shapely(entity, tolerance)
            original_shapely_geometry = dxf_geometry.geometry
            buffered_shapely_geometry = original_shapely_geometry.buffer(tolerance)
            dxf_geometries.append(DxfEntityGeometry(geometry=buffered_shapely_geometry, handle=dxf_geometry.handle))
        except Exception as e:
            print(f"Error converting entity {entity.dxftype()} (handle: {entity.dxf.handle}): {e}")
            continue
        
    closed_polygons = merge_dxf_entities_into_polygons(dxf_geometries)
     
    return closed_polygons



    