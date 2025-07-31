import pytest
from polygonizer.core import _combine_open_parts
from polygonizer.dto import PolygonPart, Point


class TestCombineOpenParts:
    """Test cases for _combine_open_parts method."""
    
    def test_combine_start_to_start(self):
        """Test combining two parts where part_a start connects to part_b start."""
        part_a = PolygonPart(
            points=[Point(0, 0), Point(1, 0)],
            handles=["part_a"]
        )
        part_b = PolygonPart(
            points=[Point(0, 0), Point(0, 1)],
            handles=["part_b"]
        )
        
        combined, result = _combine_open_parts(part_a, part_b, 0.1)
        
        assert combined is True
        assert result.handles == ["part_a", "part_b"]
        expected_points = [
            Point(0, 1), Point(0, 0), Point(1, 0)
        ]
        assert result.points == expected_points
    
    def test_combine_start_to_end(self):
        """Test combining two parts where part_a start connects to part_b end."""
        part_a = PolygonPart(
            points=[Point(0, 0), Point(5, 0)],
            handles=["part_a"]
        )
        part_b = PolygonPart(
            points=[Point(1, 0), Point(0, 0)],  
            handles=["part_b"]
        )
        
        combined, result = _combine_open_parts(part_a, part_b, 0.1)
        
        assert combined is True
        assert result.handles == ["part_a", "part_b"]
        expected_points = [
            Point(1, 0), Point(0, 0), Point(5, 0)
        ]
        assert result.points == expected_points
    
    def test_combine_end_to_start(self):
        """Test combining two parts where part_a end connects to part_b start."""
        part_a = PolygonPart(
            points=[Point(0, 0), Point(1, 0)],
            handles=["part_a"]
        )
        part_b = PolygonPart(
            points=[Point(1, 0), Point(5, 0)],
            handles=["part_b"]
        )
        
        combined, result = _combine_open_parts(part_a, part_b, 0.1)
        
        assert combined is True
        assert result.handles == ["part_a", "part_b"]
        expected_points = [
            Point(0, 0), Point(1, 0), Point(5, 0)
        ]
        assert len(result.points) == len(expected_points)
        assert result.points == expected_points
    
    def test_combine_end_to_end(self):
        """Test combining two parts where part_a end connects to part_b end."""
        part_a = PolygonPart(
            points=[Point(4, 0), Point(0, 0)],
            handles=["part_a"]
        )
        part_b = PolygonPart(
            points=[Point(5, 0), Point(0, 0)],  
            handles=["part_b"]
        )
        
        combined, result = _combine_open_parts(part_a, part_b, 0.1)
        
        assert combined is True
        assert result.handles == ["part_a", "part_b"]
        expected_points = [
            Point(4, 0), Point(0, 0), Point(5, 0)
        ]
        assert len(result.points) == len(expected_points)
        assert result.points == expected_points
    