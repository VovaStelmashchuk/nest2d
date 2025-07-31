import pytest
from shapely.geometry import Polygon as ShapelyPolygon
from polygonizer.core import combine_polygon_parts
from polygonizer.dto import PolygonPart, Point, ClosedPolygon


class TestCombinePolygonParts:
    """Test cases for combine_polygon_parts function"""
    
    def test_empty_inputs_raises_error(self):
        """Test that empty open and closed parts raises ValueError"""
        with pytest.raises(ValueError, match="Open and closed parts are empty"):
            combine_polygon_parts([], [], 0.1)
    
    def test_only_closed_parts_returns_unchanged(self):
        """Test that when only closed parts are provided, they are returned unchanged"""
        closed_part1 = ClosedPolygon(
            points=[Point(0, 0), Point(1, 0), Point(1, 1), Point(0, 1), Point(0, 0)],
            handles=["handle1"]
        )
        closed_part2 = ClosedPolygon(
            points=[Point(2, 2), Point(3, 2), Point(3, 3), Point(2, 3), Point(2, 2)],
            handles=["handle2"]
        )
        
        open, close = combine_polygon_parts([], [closed_part1, closed_part2], 0.1)
        
        assert len(open) == 0
        assert len(close) == 2
        assert close[0] == closed_part1
        assert close[1] == closed_part2

    def test_two_close_polygone_intersect(self): 
        poly_1 = ClosedPolygon(
            points=[Point(0, 0), Point(1, 0), Point(1, 1), Point(0, 1), Point(0, 0)],
            handles=["poly_1"]
        )
        poly_2 = ClosedPolygon(
            points=[Point(0.5, 0.5), Point(1.5, 0.5), Point(1.5, 1.5), Point(0.5, 1.5), Point(0.5, 0.5)],
            handles=["poly_2"]
        )
        
        open, close = combine_polygon_parts([], [poly_1, poly_2], 0.1)
        
        assert len(open) == 0
        assert len(close) == 1
        assert set(close[0].handles) == {"poly_1", "poly_2"}
        
        result_shapely = ShapelyPolygon([(p.x, p.y) for p in close[0].points])
        
        expected_points = [
            Point(0, 0), Point(1, 0), Point(1, 0.5), Point(1.5, 0.5), Point(1.5, 1.5), Point(0.5, 1.5), Point(0.5, 1), Point(0, 1), Point(0, 0)
        ]
        expected_shapely = ShapelyPolygon([(p.x, p.y) for p in expected_points])
        
        assert result_shapely.equals(expected_shapely)
        
    def test_open_line_inside_closed_polygon(self):
        """Test that open line inside closed polygon is returned unchanged"""
        closed_part = ClosedPolygon(
            points=[Point(0, 0), Point(1, 0), Point(1, 1), Point(0, 1), Point(0, 0)],
            handles=["handle1"]
        )
        open_part = PolygonPart(
            points=[Point(0.25, 0.25), Point(0.25, 0.5)],
            handles=["handle2"]
        )
        
        open, close = combine_polygon_parts([open_part], [closed_part], 0.1)
        
        assert len(open) == 0
        assert len(close) == 1
        assert close[0] == closed_part
        assert set(close[0].handles) == {"handle1", "handle2"}
        
        
    def test_open_lines_form_rectangle(self):
        """Test that open lines form a rectangle"""
        open_part_1 = PolygonPart(
            points=[Point(0, 0), Point(1, 0)],
            handles=["handle1"]
        )
        open_part_2 = PolygonPart(
            points=[Point(1, 0), Point(1, 1)],
            handles=["handle2"]
        )
        open_part_3 = PolygonPart(
            points=[Point(1, 1), Point(0, 1)],
            handles=["handle3"]
        )
        open_part_4 = PolygonPart(
            points=[Point(0, 1), Point(0, 0)],
            handles=["handle4"]
        )
        
        open, close = combine_polygon_parts([open_part_1, open_part_2, open_part_3, open_part_4], [], 0.1)
        
        assert len(open) == 0
        assert len(close) == 1
        assert set(close[0].handles) == {"handle1", "handle2", "handle3", "handle4"}
        
        result_shapely = ShapelyPolygon([(p.x, p.y) for p in close[0].points])
        
        expected_points = [
            Point(0, 0), Point(1, 0), Point(1, 1), Point(0, 1), Point(0, 0)
        ]
        expected_shapely = ShapelyPolygon([(p.x, p.y) for p in expected_points])
        
        assert result_shapely.equals(expected_shapely)
        
if __name__ == "__main__":
    pytest.main([__file__]) 