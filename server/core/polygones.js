import offsetPolygon from "offset-polygon";

export function buildPolygon(originPolygon, offsetDistance, tolerance) {
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

  const removedPoints = removeNearestPoints(result, tolerance);

  return removedPoints;
}

function removeNearestPoints(array, tolerance) {
  let result = [];
  let i = 0;
  while (i < array.length) {
    const point = array[i];
    const nextPoint = array[(i + 1) % array.length];
    if (distance(point, nextPoint) > tolerance) {
      result.push(point);
    }
    i++;
  }
  return result;
}

function distance(point1, point2) {
  return Math.sqrt(
    Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2)
  );
}
