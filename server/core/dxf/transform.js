/**
 * Deeply clones an object using structuredClone or a fallback.
 * @param {object} obj - The object to clone.
 * @returns {object} - The deep cloned object.
 */
function deepClone(obj) {
  if (typeof structuredClone === "function") {
    return structuredClone(obj);
  }
  // Fallback if structuredClone is not available
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Applies an in-place transform to a copy of the given entity and returns the transformed copy.
 * The transform is:
 *    1) Rotate around (0,0) by 'angle' radians.
 *    2) Translate by (dx, dy).
 *
 * @param {object} entity - The DXF entity object (with entity.specific).
 * @param {{ x: number, y: number, angle: number }} transform - The transform parameters.
 * @returns {object} - The transformed copy of the entity.
 */
export function transformEntity(entity, transform) {
  if (!entity || !entity.specific) return null;

  // Clone the entity to ensure the original object is not modified
  const entityCopy = deepClone(entity);

  const { x: dx, y: dy, angle } = transform;

  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  function applyTransform(pt) {
    const rx = pt.x * cosA - pt.y * sinA;
    const ry = pt.x * sinA + pt.y * cosA;
    pt.x = rx + dx;
    pt.y = ry + dy;
  }

  const specificKeys = Object.keys(entityCopy.specific);
  if (specificKeys.length === 0) return entityCopy;
  const type = specificKeys[0].toLowerCase();

  switch (type) {
    case "line": {
      const line = entityCopy.specific.Line;
      if (line && line.p1 && line.p2) {
        applyTransform(line.p1);
        applyTransform(line.p2);
      }
      break;
    }

    case "lwpolyline":
    case "polyline": {
      const poly =
        entityCopy.specific.LwPolyline || entityCopy.specific.Polyline;
      if (poly && Array.isArray(poly.vertices)) {
        for (const v of poly.vertices) {
          applyTransform(v);
        }
      }
      break;
    }

    case "circle": {
      const circle = entityCopy.specific.Circle;
      if (circle && circle.center) {
        applyTransform(circle.center);
      }
      break;
    }

    case "arc": {
      const arc = entityCopy.specific.Arc;
      if (arc && arc.center) {
        applyTransform(arc.center);
        const deltaDeg = toDegrees(angle);
        arc.start_angle += deltaDeg;
        arc.end_angle += deltaDeg;
      }
      break;
    }

    case "ellipse": {
      const ellipse = entityCopy.specific.Ellipse;
      if (ellipse && ellipse.center) {
        applyTransform(ellipse.center);
        const deltaDeg = toDegrees(angle);
        ellipse.rotation = (ellipse.rotation || 0) + deltaDeg;

        if (typeof ellipse.start_angle === "number") {
          ellipse.start_angle += deltaDeg;
        }
        if (typeof ellipse.end_angle === "number") {
          ellipse.end_angle += deltaDeg;
        }
      }
      break;
    }

    case "spline": {
      const spline = entityCopy.specific.Spline;
      if (spline && Array.isArray(spline.control_points)) {
        for (const cp of spline.control_points) {
          applyTransform(cp);
        }
      }
      break;
    }

    default:
      console.warn(`Unsupported entity type: ${type}`);
      break;
  }

  return entityCopy;
}

function toDegrees(rad) {
  return (rad * 180) / Math.PI;
}
