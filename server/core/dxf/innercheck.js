/**
 * Takes an array of polygon objects {polygon, originEntities}
 * and merges any polygons that are entirely inside another polygon.
 *
 * @param {Array} polygons
 * @returns {Array} A new array of polygons after merging
 */
export function groupInnerPolygons(polygons) {
  const nestedIndices = new Set();

  for (let i = 0; i < polygons.length; i++) {
    const polyA = polygons[i];

    for (let j = 0; j < polygons.length; j++) {
      if (i === j) continue;

      const polyB = polygons[j];

      // Check if polyA is fully inside polyB
      if (isPolygonInsidePolygon(polyA.polygon, polyB.polygon)) {
        // Move polyA's entities into polyB
        polyB.originEntities.push(...polyA.originEntities);
        if (!polyB.innerPolygons) {
          polyB.innerPolygons = [];
        }
        polyB.innerPolygons.push(polyA.polygon);

        // Mark polyA for removal (since it’s merged)
        nestedIndices.add(i);
        // Once merged, no need to check other polygons for polyA
        break;
      }
    }
  }

  // Filter out polygons that got merged into others
  const mergedPolygons = polygons.filter((_, idx) => !nestedIndices.has(idx));
  return mergedPolygons;
}

/**
 * Checks if polygon A is fully inside polygon B.
 * Here we simply check that *every* vertex of A is in B.
 *
 * @param {{x:number,y:number}[]} polygonA
 * @param {{x:number,y:number}[]} polygonB
 * @returns {boolean}
 */
function isPolygonInsidePolygon(polygonA, polygonB) {
  // Simple approach: verify every vertex of A is inside B
  return polygonA.every((point) => isPointInPolygon(point, polygonB));
}

/**
 * Ray-casting test to check if a given point is inside a polygon.
 * polygon is assumed to be an array of {x, y}.
 *
 * @param {{x:number,y:number}} pt
 * @param {{x:number,y:number}[]} polygon
 * @returns {boolean} true if inside, false otherwise
 */
function isPointInPolygon(pt, polygon) {
  let c = false;
  // For each edge of the polygon
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const pi = polygon[i];
    const pj = polygon[j];

    // Check if the ray crosses this edge
    const intersect =
      pi.y > pt.y !== pj.y > pt.y &&
      pt.x < ((pj.x - pi.x) * (pt.y - pi.y)) / (pj.y - pi.y) + pi.x;

    if (intersect) c = !c;
  }
  return c;
}
