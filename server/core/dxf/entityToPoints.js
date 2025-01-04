/**
 * @param {object} entity  - A parsed DXF entity (from autocad-dxf library).
 * @param {object} dxfObj  - An instance of Entities (so we can call e.g. res.nurbs(spline)).
 * @param {number} tolerance - The maximum chord length for arcs/circles/ellipses.
 * @returns {Array<{x:number, y:number}>} Approximate list of (x, y) points.
 */
export function entityToPoints(entity, dxfObj, tolerance = 1.0) {
  if (!entity || !entity.etype) return [];

  const etype = entity.etype.toLowerCase();

  switch (etype) {
    case "line":
      return lineToPoints(entity);

    case "lwpolyline":
    case "polyline":
      return polylineToPoints(entity);

    case "circle":
      return circleToPoints(entity, tolerance);

    case "arc":
      return arcToPoints(entity, tolerance);

    case "ellipse":
      return ellipseToPoints(entity, tolerance);

    case "spline":
      return splineToPoints(entity, dxfObj, tolerance);

    default:
      return [];
  }
}

function lineToPoints(entity) {
  return [
    { x: entity.start_x, y: entity.start_y },
    { x: entity.end_x, y: entity.end_y },
  ];
}

function polylineToPoints(entity) {
  return entity.vertices || [];
}

function circleToPoints(entity, tolerance) {
  const centerX = entity.x;
  const centerY = entity.y;
  const r = entity.radius;
  if (r <= 0) return [];

  // We'll approximate it as a single arc from angle=0 to 2π
  return approximateArc2D(centerX, centerY, r, 0, 2 * Math.PI, tolerance);
}

function arcToPoints(entity, tolerance) {
  const centerX = entity.x;
  const centerY = entity.y;
  const r = entity.radius;
  if (r <= 0) return [];

  // DXF angles are in degrees -> convert to radians
  let startAngle = degToRad(entity.start_angle);
  let endAngle = degToRad(entity.end_angle);

  // arcs can wrap "backwards" if end < start.
  let totalAngle = endAngle - startAngle;
  if (totalAngle < 0) {
    totalAngle += 2 * Math.PI; // handle negative, "backwards" arcs
  }

  return approximateArc2D(
    centerX,
    centerY,
    r,
    startAngle,
    startAngle + totalAngle,
    tolerance
  );
}

function ellipseToPoints(entity, tolerance) {
  // Typically a DXF ellipse might have:
  //  x, y, major_axis_ratio, axis_ratio, etc.
  //  Some also store start_angle, end_angle in radians already,
  //  plus a rotation.
  // In practice, ellipse entities can be more complex.
  // We'll do a basic approach.

  // If your entity has a custom key naming,
  // adapt it accordingly.
  // For example, some contain:
  //  center_x, center_y, major_axis, minor_axis, rotation,
  //  start_angle, end_angle
  const cx = entity.x || 0;
  const cy = entity.y || 0;
  const majorR = entity.major_axis || 0;
  const minorR = entity.minor_axis || 0;
  const rotation = degToRad(entity.rotation || 0);

  // start/end angles in degrees or radians?
  // Check if the library returns them in degrees or radians.
  // We'll assume degrees for consistency with arcs:
  let startAngle = degToRad(entity.start_angle || 0);
  let endAngle = degToRad(entity.end_angle || 360);

  let totalAngle = endAngle - startAngle;
  if (totalAngle < 0) totalAngle += 2 * Math.PI;

  return approximateEllipse2D(
    cx,
    cy,
    majorR,
    minorR,
    rotation,
    startAngle,
    startAngle + totalAngle,
    tolerance
  );
}

function splineToPoints(entity, dxfObj, tolerance) {
  // Use the library to get NURBS data
  const splineData = dxfObj.nurbs(entity);

  // `splineData` typically has an array of intervals
  // and the polynomial coefficients for each interval.
  // You would sample each interval from param=0..1 (or from knot to knot)
  // subdividing until chord length < tolerance.

  // For brevity, let's just return the control points.
  // Real usage: implement an adaptive approach.
  const ctrlPoints = splineData.control_points;
  if (!ctrlPoints) return [];

  // Convert them to {x, y}.  (Ignoring z for 2D.)
  const points = ctrlPoints.map((pt) => ({
    x: pt.x || 0,
    y: pt.y || 0,
  }));

  return points;
}

/****************************************************
 * HELPER: Approximate an arc from angleStart..angleEnd
 * so that each chord has length <= tolerance.
 ****************************************************/
function approximateArc2D(cx, cy, radius, angleStart, angleEnd, tolerance) {
  const points = [];
  if (radius <= 0) return points;

  let sweep = angleEnd - angleStart;
  // ensure positive sweep
  if (sweep < 0) {
    sweep += 2 * Math.PI;
  }

  // If tolerance is too big or radius is too small,
  // we might do just 2 points. But let's keep it robust:
  // chord length = 2*r*sin(θ/2) <= tolerance
  // => θ <= 2 * arcsin( tolerance/(2*r) )
  // We'll clamp so we don't exceed the sweep.
  const angleStep = getMaxAngleStep(radius, tolerance);
  const steps = Math.max(1, Math.ceil(sweep / angleStep));

  for (let i = 0; i <= steps; i++) {
    const theta = angleStart + (sweep * i) / steps;
    points.push({
      x: cx + radius * Math.cos(theta),
      y: cy + radius * Math.sin(theta),
    });
  }

  return points;
}

/****************************************************
 * HELPER: Approximate an elliptical arc from angleStart..angleEnd
 ****************************************************/
function approximateEllipse2D(
  cx,
  cy,
  majorR,
  minorR,
  rotation,
  angleStart,
  angleEnd,
  tolerance
) {
  const points = [];
  if (majorR <= 0 || minorR <= 0) return points;

  let sweep = angleEnd - angleStart;
  if (sweep < 0) {
    sweep += 2 * Math.PI;
  }

  // For an ellipse, the chord length depends on local curvature.
  // We'll do a simpler approach: approximate an "effective radius"
  // as the larger of (majorR, minorR), then do the same chord-based method.
  // This is *not* perfect (the minor axis side might be oversampled or undersampled).
  // If you need a more precise approach, consider the local curvature formula
  // for ellipses. For typical usage, this is usually "good enough."

  const maxRadius = Math.max(majorR, minorR);
  const angleStep = getMaxAngleStep(maxRadius, tolerance);
  const steps = Math.max(1, Math.ceil(sweep / angleStep));

  // param angle goes from angleStart..angleEnd
  // Then for each angle 'α', we get a point:
  //   px = majorR*cos(α)
  //   py = minorR*sin(α)
  // Then rotate by 'rotation' about center (cx, cy).
  // So final coords:
  //   x = cx + (px*cos(rotation) - py*sin(rotation))
  //   y = cy + (px*sin(rotation) + py*cos(rotation))

  for (let i = 0; i <= steps; i++) {
    const α = angleStart + (sweep * i) / steps;
    const px = majorR * Math.cos(α);
    const py = minorR * Math.sin(α);

    const xr = px * Math.cos(rotation) - py * Math.sin(rotation);
    const yr = px * Math.sin(rotation) + py * Math.cos(rotation);

    points.push({
      x: cx + xr,
      y: cy + yr,
    });
  }

  return points;
}

/****************************************************
 * HELPER: Get maximum angle step so chord <= tolerance
 * chord = 2 * r * sin(θ/2) <= tolerance
 * => θ <= 2 * arcsin(tolerance / (2*r))
 ****************************************************/
function getMaxAngleStep(radius, tolerance) {
  if (radius <= 0) return 0; // degenerate
  if (tolerance <= 0) {
    // fallback: maybe 1 degree in radians
    return Math.PI / 180;
  }
  // clamp the ratio to avoid domain errors
  const ratio = Math.min(1, tolerance / (2 * radius));
  const theta = 2 * Math.asin(ratio);
  // If ratio is small, theta in radians might be tiny
  // We'll impose an upper bound, e.g., 30° in radians
  // for extremely large tolerance
  return Math.min(theta, (30 * Math.PI) / 180);
}

/****************************************************
 * HELPER: Convert degrees to radians
 ****************************************************/
function degToRad(deg) {
  return (deg * Math.PI) / 180;
}
