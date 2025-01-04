import Entities from "autocad-dxf";
import { entityToPoints } from "./entityToPoints.js";

/**
 * @param {string} dxfString
 * @param {number} tolerance
 *
 * @returns {{closed: {polygon: {x: number, y: number}[], originEntities: any[]}[], open: {polygon: {x: number, y: number}[], originEntities: any[]}[]}}
 */
export function parseAndCombine(dxfString, tolerance) {
  const dxfObj = new Entities(dxfString, tolerance);
  const rawEntities = dxfObj.entities || [];

  const lines = [];
  rawEntities.forEach((ent) => {
    if (ent.etype === "LINE") {
      lines.push({
        start_x: ent.start_x,
        start_y: ent.start_y,
        end_x: ent.end_x,
        end_y: ent.end_y,
      });
    }
  });

  const allProcessed = rawEntities.map((ent) => {
    const points = entityToPoints(ent, dxfObj, tolerance);
    const isClosed =
      isInherentlyClosed(ent) || isClosedPolygon(points, tolerance);
    return {
      polygon: points,
      originEntities: [ent], // keep track of which entity/ies form this polygon
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
 * Checks if an entity (based on its 'etype' or properties) is inherently closed:
 *   - circle
 *   - lwpolyline/polyline with `type==="Closed"`
 */
function isInherentlyClosed(entity) {
  if (!entity || !entity.etype) return false;
  const etype = entity.etype.toLowerCase();

  // Circles => definitely closed
  if (etype === "circle") {
    return true;
  }

  // "Closed" polylines
  if (
    (etype === "polyline" || etype === "lwpolyline") &&
    entity.type === "Closed"
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if a polygon is "closed" by verifying:
 *   - length >= 3
 *   - first point is within 'tolerance' distance of last point
 */
function isClosedPolygon(points, tolerance) {
  if (!points || points.length < 3) return false;
  const first = points[0];
  const last = points[points.length - 1];
  return distance(first, last) <= tolerance;
}

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
