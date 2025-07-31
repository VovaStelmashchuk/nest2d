import pytest
from polygonizer.core import _combine_intersecting_polygons
from polygonizer.dto import ClosedPolygon, Point
from shapely.geometry import Polygon as ShapelyPolygon


class TestCombineIntersectingPolygons:
    """Test cases for _combine_intersecting_polygons method"""

    def test_no_intersecting_polygons_returns_unchanged(self):
        """Test that non-intersecting polygons are returned unchanged"""
        poly1 = ClosedPolygon(
            points=[Point(0, 0), Point(1, 0), Point(1, 1), Point(0, 1), Point(0, 0)],
            handles=["poly1"]
        )
        poly2 = ClosedPolygon(
            points=[Point(2, 0), Point(3, 0), Point(3, 1), Point(2, 1), Point(2, 0)],
            handles=["poly2"]
        )
        
        result = _combine_intersecting_polygons([poly1, poly2], 0.1)
        
        assert len(result) == 2
        assert result[0] == poly1
        assert result[1] == poly2

    def test_partially_overlapping_polygons(self):
        """Test polygons that overlap partially are combined correctly."""
        poly1 = ClosedPolygon(
            points=[Point(0, 0), Point(2, 0), Point(2, 2), Point(0, 2), Point(0, 0)],
            handles=["poly1"]
        )
        poly2 = ClosedPolygon(
            points=[Point(1, 1), Point(3, 1), Point(3, 3), Point(1, 3), Point(1, 1)],
            handles=["poly2"]
        )
        
        result = _combine_intersecting_polygons([poly1, poly2], 0.1)
        
        assert len(result) == 1
        assert set(result[0].handles) == {"poly1", "poly2"}

        # Check for geometric equality
        result_shp = ShapelyPolygon([(p.x, p.y) for p in result[0].points])
        shp1 = ShapelyPolygon([(p.x, p.y) for p in poly1.points])
        shp2 = ShapelyPolygon([(p.x, p.y) for p in poly2.points])
        expected_union_shp = shp1.union(shp2)

        assert result_shp.equals_exact(expected_union_shp, tolerance=1e-6)

    def test_touching_polygons_with_tolerance(self):
        """Test polygons that touch at boundaries with tolerance"""
        poly1 = ClosedPolygon(
            points=[
                Point(0.01, 0.01),
                Point(1, 0.01),
                Point(1, 1),
                Point(0.01, 1),
                Point(0.01, 0.01)
            ],
            handles=["poly1"]
        )
        poly2 = ClosedPolygon(
            points=[Point(1, 0), Point(2, 0), Point(2, 1), Point(1, 1), Point(1, 0)],
            handles=["poly2"]
        )
        
        # With zero tolerance, touching should not combine
        result_zero_tol = _combine_intersecting_polygons([poly1, poly2], 0)
        assert len(result_zero_tol) == 2
        
        # With larger tolerance, should be considered intersecting
        result_large_tol = _combine_intersecting_polygons([poly1, poly2], 0.1)
        assert len(result_large_tol) == 1

    def test_multiple_intersecting_polygons(self):
        """Test multiple polygons that all intersect with each other"""
        poly1 = ClosedPolygon(
            points=[Point(0, 0), Point(2, 0), Point(2, 2), Point(0, 2), Point(0, 0)],
            handles=["poly1"]
        )
        poly2 = ClosedPolygon(
            points=[Point(1, 1), Point(3, 1), Point(3, 3), Point(1, 3), Point(1, 1)],
            handles=["poly2"]
        )
        poly3 = ClosedPolygon(
            points=[Point(0.5, 0.5), Point(2.5, 0.5), Point(2.5, 2.5), Point(0.5, 2.5), Point(0.5, 0.5)],
            handles=["poly3"]
        )
        
        result = _combine_intersecting_polygons([poly1, poly2, poly3], 0.1)
        
        assert len(result) == 1
        assert set(result[0].handles) == {"poly1", "poly2", "poly3"}

    def test_complex_intersection_scenario(self):
        """Test a complex scenario with multiple intersection groups"""
        # Group 1: intersecting polygons
        poly1 = ClosedPolygon(
            points=[Point(0, 0), Point(2, 0), Point(2, 2), Point(0, 2), Point(0, 0)],
            handles=["poly1"]
        )
        poly2 = ClosedPolygon(
            points=[Point(1, 1), Point(3, 1), Point(3, 3), Point(1, 3), Point(1, 1)],
            handles=["poly2"]
        )
        
        # Group 2: separate intersecting polygons
        poly3 = ClosedPolygon(
            points=[Point(5, 5), Point(7, 5), Point(7, 7), Point(5, 7), Point(5, 5)],
            handles=["poly3"]
        )
        poly4 = ClosedPolygon(
            points=[Point(6, 6), Point(8, 6), Point(8, 8), Point(6, 8), Point(6, 6)],
            handles=["poly4"]
        )
        
        # Isolated polygon
        poly5 = ClosedPolygon(
            points=[Point(10, 10), Point(11, 10), Point(11, 11), Point(10, 11), Point(10, 10)],
            handles=["poly5"]
        )
        
        result = _combine_intersecting_polygons([poly1, poly2, poly3, poly4, poly5], 0.1)
        
        # Should have 3 groups: combined group1, combined group2, isolated poly5
        assert len(result) == 3
        
        # Find the combined groups
        handles_sets = [set(p.handles) for p in result]
        assert {"poly1", "poly2"} in handles_sets
        assert {"poly3", "poly4"} in handles_sets
        assert {"poly5"} in handles_sets

    def test_identical_polygons_keeps_one(self):
        """Test that identical polygons are combined into one"""
        poly1 = ClosedPolygon(
            points=[Point(0, 0), Point(1, 0), Point(1, 1), Point(0, 1), Point(0, 0)],
            handles=["poly1"]
        )
        poly2 = ClosedPolygon(
            points=[Point(0, 0), Point(1, 0), Point(1, 1), Point(0, 1), Point(0, 0)],
            handles=["poly2"]
        )
        
        result = _combine_intersecting_polygons([poly1, poly2], 0.1)
        
        assert len(result) == 1
        assert set(result[0].handles) == {"poly1", "poly2"}

    def test_single_polygon_returns_unchanged(self):
        """Test that single polygon is returned unchanged"""
        poly = ClosedPolygon(
            points=[Point(0, 0), Point(1, 0), Point(1, 1), Point(0, 1), Point(0, 0)],
            handles=["poly"]
        )
        
        result = _combine_intersecting_polygons([poly], 0.1)
        
        assert len(result) == 1
        assert result[0] == poly

    def test_irregular_polygons(self):
        """Test with irregular (non-rectangular) polygons"""
        # Irregular polygon 1
        poly1 = ClosedPolygon(
            points=[Point(0, 0), Point(3, 0), Point(2, 2), Point(1, 3), Point(0, 2), Point(0, 0)],
            handles=["poly1"]
        )
        # Regular polygon 2 that intersects with poly1
        poly2 = ClosedPolygon(
            points=[Point(1, 1), Point(3, 1), Point(3, 3), Point(1, 3), Point(1, 1)],
            handles=["poly2"]
        )
        
        result = _combine_intersecting_polygons([poly1, poly2], 0.1)
        
        assert len(result) == 1
        assert set(result[0].handles) == {"poly1", "poly2"}

    def test_polygons_with_shared_edges(self):
        """Test polygons that share edges are combined"""
        poly1 = ClosedPolygon(
            points=[Point(0, 0), Point(2, 0), Point(2, 2), Point(0, 2), Point(0, 0)],
            handles=["poly1"]
        )
        poly2 = ClosedPolygon(
            points=[Point(2, 0), Point(4, 0), Point(4, 2), Point(2, 2), Point(2, 0)],
            handles=["poly2"]
        )
        
        result = _combine_intersecting_polygons([poly1, poly2], 0.1)
        
        assert len(result) == 1
        assert set(result[0].handles) == {"poly1", "poly2"}
        
        result_shp = ShapelyPolygon([(p.x, p.y) for p in result[0].points])
        shp1 = ShapelyPolygon([(p.x, p.y) for p in poly1.points])
        shp2 = ShapelyPolygon([(p.x, p.y) for p in poly2.points])
        expected_union_shp = shp1.union(shp2)

        assert result_shp.equals_exact(expected_union_shp, tolerance=1e-6)

    def test_polygons_with_corner_touching(self):
        """Test polygons that touch only at corners"""
        poly1 = ClosedPolygon(
            points=[Point(0, 0), Point(1, 0), Point(1, 1), Point(0, 1), Point(0, 0)],
            handles=["poly1"]
        )
        poly2 = ClosedPolygon(
            points=[Point(1, 1), Point(2, 1), Point(2, 2), Point(1, 2), Point(1, 1)],
            handles=["poly2"]
        )
        
        # With zero tolerance, corner-touching should not combine
        result_zero_tol = _combine_intersecting_polygons([poly1, poly2], 0)
        assert len(result_zero_tol) == 2
        
        # With larger tolerance, should be considered intersecting
        result_large_tol = _combine_intersecting_polygons([poly1, poly2], 0.1)
        assert len(result_large_tol) == 1

    def test_polygons_near_zero_coordinates(self):
        """Test polygons with coordinates very close to zero"""
        poly1 = ClosedPolygon(
            points=[Point(0.00001, 0.00001), Point(1, 0.00001), Point(1, 1), Point(0.00001, 1), Point(0.00001, 0.00001)],
            handles=["poly1"]
        )
        poly2 = ClosedPolygon(
            points=[Point(0.5, 0.5), Point(1.5, 0.5), Point(1.5, 1.5), Point(0.5, 1.5), Point(0.5, 0.5)],
            handles=["poly2"]
        )
        
        result = _combine_intersecting_polygons([poly1, poly2], 0.00001)
        
        assert len(result) == 1
        assert set(result[0].handles) == {"poly1", "poly2"}


if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 