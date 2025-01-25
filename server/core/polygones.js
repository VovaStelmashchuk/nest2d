import offsetPolygon from "offset-polygon";

export function buildPolygon(originPolygon, offsetDistance) {
  if (
    originPolygon[0].x === originPolygon[originPolygon.length - 1].x &&
    originPolygon[0].y === originPolygon[originPolygon.length - 1].y
  ) {
    originPolygon.pop();
  }

  const ensureClockwise = (polygonPoints) => {
    const signedArea = polygonPoints.reduce((area, point, index) => {
      const nextPoint = polygonPoints[(index + 1) % polygonPoints.length];
      return area + (point.x * nextPoint.y - nextPoint.x * point.y);
    }, 0);
    return signedArea > 0 ? polygonPoints : [...polygonPoints].reverse();
  };

  const polygon = ensureClockwise(
    originPolygon.map((point) => ({
      x: point.x,
      y: point.y,
    }))
  );

  const offsetPolygonResult = offsetPolygon(polygon, offsetDistance);

  const result = offsetPolygonResult.map((point) => {
    return [point.x, point.y];
  });

  return result;
}
