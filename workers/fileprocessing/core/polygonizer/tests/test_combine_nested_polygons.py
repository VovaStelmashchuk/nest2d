import pytest
from polygonizer.dto import Point, ClosedPolygon
from polygonizer.core import _combine_nested_polygons


class TestCombineNestedPolygons:
    """Test cases for _combine_nested_polygons function"""
    
    def test_no_nested_polygons_returns_unchanged(self):
        """Test that non-nested polygons are returned unchanged"""
        # Two separate squares
        poly1 = ClosedPolygon(
            points=[Point(0, 0), Point(1, 0), Point(1, 1), Point(0, 1), Point(0, 0)],
            handles=["handle1"]
        )
        poly2 = ClosedPolygon(
            points=[Point(2, 2), Point(3, 2), Point(3, 3), Point(2, 3), Point(2, 2)],
            handles=["handle2"]
        )
        
        result = _combine_nested_polygons([poly1, poly2], 0.1)
        
        assert len(result) == 2
        assert result[0] == poly1
        assert result[1] == poly2
    
    def test_nested_polygons_combines_handles(self):
        """Test that nested polygons combine their handles"""
        # Parent square
        parent = ClosedPolygon(
            points=[Point(0, 0), Point(2, 0), Point(2, 2), Point(0, 2), Point(0, 0)],
            handles=["parent_handle"]
        )
        # Child square inside parent
        child = ClosedPolygon(
            points=[Point(0.5, 0.5), Point(1.5, 0.5), Point(1.5, 1.5), Point(0.5, 1.5), Point(0.5, 0.5)],
            handles=["child_handle"]
        )
        
        result = _combine_nested_polygons([parent, child], 0.1)
        
        assert len(result) == 1
        assert result[0] == parent
        assert set(result[0].handles) == {"parent_handle", "child_handle"}
    
    def test_multiple_nested_polygons(self):
        """Test multiple levels of nesting"""
        # Grandparent (largest)
        grandparent = ClosedPolygon(
            points=[Point(0, 0), Point(3, 0), Point(3, 3), Point(0, 3), Point(0, 0)],
            handles=["grandparent_handle"]
        )
        # Parent (medium)
        parent = ClosedPolygon(
            points=[Point(0.5, 0.5), Point(2.5, 0.5), Point(2.5, 2.5), Point(0.5, 2.5), Point(0.5, 0.5)],
            handles=["parent_handle"]
        )
        # Child (smallest)
        child = ClosedPolygon(
            points=[Point(1, 1), Point(2, 1), Point(2, 2), Point(1, 2), Point(1, 1)],
            handles=["child_handle"]
        )
        
        result = _combine_nested_polygons([grandparent, parent, child], 0.1)
        
        assert len(result) == 1
        assert result[0] == grandparent
        expected_handles = {"grandparent_handle", "parent_handle", "child_handle"}
        assert set(result[0].handles) == expected_handles
    
    def test_tolerance_affects_boundary_touching(self):
        """Test that tolerance affects boundary-touching cases"""
        # Parent square
        parent = ClosedPolygon(
            points=[Point(0, 0), Point(2, 0), Point(2, 2), Point(0, 2), Point(0, 0)],
            handles=["parent_handle"]
        )
        # Child square mostly inside parent but extending slightly outside
        child = ClosedPolygon(
            points=[Point(0.1, 0.1), Point(2.1, 0.1), Point(2.1, 1.9), Point(0.1, 1.9), Point(0.1, 0.1)],
            handles=["child_handle"]
        )
        
        # With small tolerance, should not be considered nested
        result_small_tol = _combine_nested_polygons([parent, child], 0.01)
        assert len(result_small_tol) == 2
        
        # With larger tolerance, should be considered nested
        result_large_tol = _combine_nested_polygons([parent, child], 0.5)
        assert len(result_large_tol) == 1
    
    def test_overlapping_polygons_not_nested(self):
        """Test that overlapping but not nested polygons are preserved"""
        # Two overlapping squares
        poly1 = ClosedPolygon(
            points=[Point(0, 0), Point(2, 0), Point(2, 2), Point(0, 2), Point(0, 0)],
            handles=["handle1"]
        )
        poly2 = ClosedPolygon(
            points=[Point(1, 1), Point(3, 1), Point(3, 3), Point(1, 3), Point(1, 1)],
            handles=["handle2"]
        )
        
        result = _combine_nested_polygons([poly1, poly2], 0.1)
        
        assert len(result) == 2
        assert result[0] == poly1
        assert result[1] == poly2
    
    def test_identical_polygons_keeps_one(self):
        """Test that identical polygons are considered nested"""
        poly1 = ClosedPolygon(
            points=[Point(0, 0), Point(1, 0), Point(1, 1), Point(0, 1), Point(0, 0)],
            handles=["handle1"]
        )
        poly2 = ClosedPolygon(
            points=[Point(0, 0), Point(1, 0), Point(1, 1), Point(0, 1), Point(0, 0)],
            handles=["handle2"]
        )
        
        result = _combine_nested_polygons([poly1, poly2], 0.1)
        
        assert len(result) == 1
        assert set(result[0].handles) == {"handle1", "handle2"}
    
    def test_complex_nested_scenario(self):
        """Test a complex scenario with multiple nested and non-nested polygons"""
        # Large outer polygon
        outer = ClosedPolygon(
            points=[Point(0, 0), Point(4, 0), Point(4, 4), Point(0, 4), Point(0, 0)],
            handles=["outer"]
        )
        # Medium polygon inside outer
        middle = ClosedPolygon(
            points=[Point(1, 1), Point(3, 1), Point(3, 3), Point(1, 3), Point(1, 1)],
            handles=["middle"]
        )
        # Small polygon inside middle
        inner = ClosedPolygon(
            points=[Point(1.5, 1.5), Point(2.5, 1.5), Point(2.5, 2.5), Point(1.5, 2.5), Point(1.5, 1.5)],
            handles=["inner"]
        )
        # Separate polygon (not nested)
        separate = ClosedPolygon(
            points=[Point(5, 5), Point(6, 5), Point(6, 6), Point(5, 6), Point(5, 5)],
            handles=["separate"]
        )
        
        result = _combine_nested_polygons([outer, middle, inner, separate], 0.1)
        
        assert len(result) == 2
        # Outer should contain all nested polygons
        outer_result = next(p for p in result if "outer" in p.handles)
        assert set(outer_result.handles) == {"outer", "middle", "inner"}
        # Separate should remain unchanged
        separate_result = next(p for p in result if "separate" in p.handles)
        assert separate_result.handles == ["separate"]
    
    def test_empty_list_returns_empty(self):
        """Test that empty list returns empty list"""
        result = _combine_nested_polygons([], 0.1)
        assert result == []
    
    def test_single_polygon_returns_unchanged(self):
        """Test that single polygon returns unchanged"""
        poly = ClosedPolygon(
            points=[Point(0, 0), Point(1, 0), Point(1, 1), Point(0, 1), Point(0, 0)],
            handles=["handle"]
        )
        
        result = _combine_nested_polygons([poly], 0.1)
        
        assert len(result) == 1
        assert result[0] == poly
    
    def test_irregular_polygons(self):
        """Test with irregular (non-rectangular) polygons"""
        # Irregular parent polygon
        parent = ClosedPolygon(
            points=[Point(0, 0), Point(3, 0), Point(2, 2), Point(1, 3), Point(0, 2), Point(0, 0)],
            handles=["parent"]
        )
        # Regular child polygon inside parent
        child = ClosedPolygon(
            points=[Point(1, 1), Point(2, 1), Point(2, 2), Point(1, 2), Point(1, 1)],
            handles=["child"]
        )
        
        result = _combine_nested_polygons([parent, child], 0.1)
        
        assert len(result) == 1
        assert set(result[0].handles) == {"parent", "child"}
    
    def test_completely_nested_child_polygon(self):
        """Test that a child polygon completely inside the parent is correctly combined"""
        # Parent square
        parent = ClosedPolygon(
            points=[Point(0, 0), Point(2, 0), Point(2, 2), Point(0, 2), Point(0, 0)],
            handles=["parent_handle"]
        )
        # Child square completely inside parent
        child = ClosedPolygon(
            points=[Point(1, 1), Point(2, 1), Point(2, 2), Point(1, 2), Point(1, 1)],
            handles=["child_handle"]
        )
        
        result = _combine_nested_polygons([parent, child], 0.1)
        
        assert len(result) == 1
        assert result[0] == parent
        assert set(result[0].handles) == {"parent_handle", "child_handle"}
        
    def test_pologones_near_zero(self):
        parent = ClosedPolygon(
            points=[Point(0, 0), Point(1, 0), Point(1, 1), Point(0, 1), Point(0, 0)],
            handles=["parent_handle"]
        )
        child = ClosedPolygon(
            points=[Point(0.5, 0.5), Point(1.0, 0.5), Point(1.0, 1.0), Point(0.5, 1.0), Point(0.5, 0.5)],
            handles=["child_handle"]
        )
        
        result = _combine_nested_polygons([parent, child], 0.1)
        
        assert len(result) == 1
        assert result[0] == parent
        
    def test_child_parent_low_tolerance(self):
        parent = ClosedPolygon(
            points=[Point(0.00001, 0.00001), Point(2, 0.00001), Point(1, 1), Point(0.00001, 1), Point(0.00001, 0.00001)],
            handles=["parent_handle"]
        )
        child = ClosedPolygon(
            points=[Point(0.00001, 0.00001), Point(1, 0.00001), Point(1, 1), Point(0.00001, 1), Point(0.00001, 0.00001)],
            handles=["child_handle"]
        )
        
        result = _combine_nested_polygons([parent, child], 0.00001)
        
        assert len(result) == 1
        assert result[0] == parent
        
if __name__ == "__main__":
    pytest.main([__file__, "-v"]) 