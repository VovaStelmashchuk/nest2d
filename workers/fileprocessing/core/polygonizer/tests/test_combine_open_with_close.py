import pytest
from polygonizer.dto import Point, PolygonPart, ClosedPolygon
from polygonizer.core import combine_polygon_parts


class TestCombineOpenWithClose:
    """Test cases for combining open and closed polygons"""

    def test_open_line_inside_closed_polygon_is_merged(self):
        """Test that an open line inside a closed polygon gets its handle merged."""
        closed_part = ClosedPolygon(
            points=[Point(0, 0), Point(1, 0), Point(1, 1), Point(0, 1), Point(0, 0)],
            handles=["closed1"]
        )
        open_part = PolygonPart(
            points=[Point(0.25, 0.25), Point(0.75, 0.75)],
            handles=["open1"]
        )

        open_result, closed_result = combine_polygon_parts([open_part], [closed_part], 0.1)

        # The open part is inside the closed polygon, so it should be merged into the closed polygon's handles
        assert len(open_result) == 0
        assert len(closed_result) == 1
        assert set(closed_result[0].handles) == {"closed1", "open1"}
