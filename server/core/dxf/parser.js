import { entityToPoints } from "./entityToPoints.js";
import { combineSegmentsIntoPolygons } from "./combineSegmentsIntoPolygons.js";
import { groupInnerPolygons } from "./innercheck.js";

/**
 * @param {Array} dxfEntities
 * @param {number} tolerance
 *
 * @returns {{closed: {polygon: {x: number, y: number}[], originEntities: any[]}[], open: {polygon: {x: number, y: number}[], originEntities: any[]}[]}}
 */
export function parseAndCombine(dxfObject, tolerance) {
  const dxfEntities = dxfObject["__entities"];

  // Convert each entity into { polygon, originEntities, isClosed }
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

  // Separate those that are "already closed"
  const originClose = [];
  let originOpen = [];

  for (const item of allProcessed) {
    if (item.isClosed) {
      originClose.push({
        polygon: item.polygon,
        originEntities: item.originEntities,
      });
    } else {
      originOpen.push({
        polygon: item.polygon,
        originEntities: item.originEntities,
      });
    }
  }

  const { closed, open } = combineSegmentsIntoPolygons(originOpen, 1e-1);

  const allClosed = [...originClose, ...closed];

  const mergedClosed = groupInnerPolygons(allClosed);

  return {
    closed: mergedClosed,
    open: open,
  };
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
 * Simple Euclidean distance
 */
function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}
