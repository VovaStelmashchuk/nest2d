import { entityToPoints } from "./entityToPoints.js";

/**
 * @param {Array} dxfEntities
 * @param {number} tolerance
 *
 * @returns {{closed: {polygon: {x: number, y: number}[], originEntities: any[]}[], open: {polygon: {x: number, y: number}[], originEntities: any[]}[]}}
 */
export function parseAndCombine(dxfObject, tolerance) {
  const dxfEntities = dxfObject["__entities"];

  const allProcessed = dxfEntities.map((ent) => {
    const points = entityToPoints(ent, tolerance);
    const isClosed =
      isInherentlyClosed(ent) || isClosedPolygon(points, tolerance);
    return {
      polygon: points,
      originEntities: [ent],
      isClosed,
    };
  });

  const closed = [];
  let open = [];

  for (const item of allProcessed) {
    if (item.isClosed) {
      closed.push({
        polygon: item.polygon,
        originEntities: item.originEntities,
      });
    } else {
      open.push({
        polygon: item.polygon,
        originEntities: item.originEntities,
      });
    }
  }

  let mergedSomething = true;
  while (mergedSomething) {
    const result = mergeOpenPolygons(open, tolerance);
    open = result.openPolygons;
    const newlyClosed = result.newlyClosed;

    if (newlyClosed.length > 0) {
      closed.push(...newlyClosed);
      mergedSomething = true;
    } else {
      mergedSomething = false;
    }
  }

  return { closed, open };
}

/**
 * Determines if a DXF entity is inherently closed based on its type.
 * Inherently closed entities include:
 *   - Circle
 *   - LwPolyline or Polyline with 'isClosed' property set to true
 *
 * @param {object} entity - A parsed DXF entity from the new library.
 * @returns {boolean} - Returns true if the entity is inherently closed; otherwise, false.
 */
function isInherentlyClosed(entity) {
  if (!entity || !entity.specific) return false;

  // Determine the entity type by examining the keys in 'specific'
  const specificKeys = Object.keys(entity.specific);
  if (specificKeys.length === 0) return false;

  const etype = specificKeys[0].toLowerCase(); // Assuming one key per entity

  // Check for inherently closed entity types
  if (etype === "circle") {
    return true;
  }

  if (etype === "lwpolyline" || etype === "polyline") {
    const polyline = entity.specific.LwPolyline || entity.specific.Polyline;
    if (polyline.flags === 1) {
      return true;
    }
  }

  return false;
}

/**
 * Determines if a polygon is closed by verifying:
 *   - It has at least three points.
 *   - The distance between the first and last points is within the specified tolerance.
 *
 * @param {Array<{x: number, y: number}>} points - An array of points defining the polygon.
 * @param {number} tolerance - The maximum allowed distance between the first and last points to consider the polygon closed.
 * @returns {boolean} - Returns true if the polygon is closed; otherwise, false.
 */
function isClosedPolygon(points, tolerance) {
  if (!points || points.length < 3) return false;
  const first = points[0];
  const last = points[points.length - 1];
  return distance(first, last) <= tolerance;
}

/**
 * Calculates the Euclidean distance between two points.
 *
 * Assumes that the function `distance` is already defined elsewhere in your codebase.
 *
 * @param {{x: number, y: number}} pointA - The first point.
 * @param {{x: number, y: number}} pointB - The second point.
 * @returns {number} - The distance between pointA and pointB.
 */

/**
 * Merge open polygons that share endpoints (within tolerance).
 * If a merge forms a closed loop, it goes into `newlyClosed`.
 *
 * Returns:
 * {
 *   openPolygons: [ ... ],   // still open after merges
 *   newlyClosed:  [ ... ]    // newly closed polygons
 * }
 */
function mergeOpenPolygons(openPolygons, tolerance) {
  const used = new Array(openPolygons.length).fill(false);
  const newlyClosed = [];
  const resultOpen = [];

  for (let i = 0; i < openPolygons.length; i++) {
    if (used[i]) continue;
    let current = openPolygons[i];
    let mergedHappened = true;

    while (mergedHappened) {
      mergedHappened = false;
      // Try to merge current with any other polygon j
      for (let j = i + 1; j < openPolygons.length; j++) {
        if (used[j]) continue;
        const candidate = openPolygons[j];

        const merged = tryMergePolygons(current, candidate, tolerance);
        if (merged) {
          // We have a new merged polygon
          current = merged;
          used[j] = true;
          mergedHappened = true;

          // Check if newly closed
          if (isClosedPolygon(current.polygon, tolerance)) {
            newlyClosed.push({
              polygon: current.polygon,
              originEntities: current.originEntities,
            });
            used[i] = true; // current is no longer open
            break;
          }
        }
      }
    }

    // If after all merges, it's still open, keep it
    if (!used[i] && !isClosedPolygon(current.polygon, tolerance)) {
      resultOpen.push(current);
      used[i] = true;
    }
  }

  return { openPolygons: resultOpen, newlyClosed };
}

/**
 * Attempts to merge polyA with polyB by matching endpoints.
 * Returns a new merged polygon object or null if not mergeable.
 */
function tryMergePolygons(polyA, polyB, tolerance) {
  const aPts = polyA.polygon;
  const bPts = polyB.polygon;
  if (!aPts.length || !bPts.length) return null;

  const aStart = aPts[0];
  const aEnd = aPts[aPts.length - 1];
  const bStart = bPts[0];
  const bEnd = bPts[bPts.length - 1];

  //
  // Case 1: A-end ~ B-start
  //
  if (distance(aEnd, bStart) <= tolerance) {
    // Merge -> A + B (minus B's first point)
    const mergedPoints = [...aPts, ...bPts.slice(1)];
    const mergedOrigins = [...polyA.originEntities, ...polyB.originEntities];
    return { polygon: mergedPoints, originEntities: mergedOrigins };
  }

  //
  // Case 2: A-end ~ B-end => reverse B
  //
  if (distance(aEnd, bEnd) <= tolerance) {
    const bReversed = [...bPts].reverse();
    // Merge -> A + reversed(B minus first)
    const mergedPoints = [...aPts, ...bReversed.slice(1)];
    const mergedOrigins = [...polyA.originEntities, ...polyB.originEntities];
    return { polygon: mergedPoints, originEntities: mergedOrigins };
  }

  //
  // Case 3: B-end ~ A-start => B + A
  //
  if (distance(bEnd, aStart) <= tolerance) {
    // Merge -> B + A (minus A's first)
    const mergedPoints = [...bPts, ...aPts.slice(1)];
    const mergedOrigins = [...polyB.originEntities, ...polyA.originEntities];
    return { polygon: mergedPoints, originEntities: mergedOrigins };
  }

  //
  // Case 4: B-start ~ A-start => reverse A or B
  //
  if (distance(bStart, aStart) <= tolerance) {
    // Let’s reverse A, then do B + reversed(A minus first)
    const aReversed = [...aPts].reverse();
    const mergedPoints = [...bPts, ...aReversed.slice(1)];
    const mergedOrigins = [...polyB.originEntities, ...polyA.originEntities];
    return { polygon: mergedPoints, originEntities: mergedOrigins };
  }

  return null; // no match
}

/**
 * Simple Euclidean distance
 */
function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}
