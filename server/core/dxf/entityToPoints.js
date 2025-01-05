/**
 * @param {object} entity  - A parsed DXF entity (from the new library).
 * @param {object} dxfObj  - An instance of Entities (so we can call methods like e.g. res.nurbs(spline)).
 * @param {number} tolerance - The maximum chord length for arcs/circles/ellipses.
 * @returns {Array<{x:number, y:number}>} Approximate list of (x, y) points.
 */
export function entityToPoints(entity, tolerance) {
  if (!entity || !entity.specific) return [];

  // Determine the entity type by examining the keys in 'specific'
  const specificKeys = Object.keys(entity.specific);
  if (specificKeys.length === 0) return [];

  const etype = specificKeys[0].toLowerCase(); // Assuming one key per entity

  switch (etype) {
    case "line":
      return lineToPoints(entity.specific.Line);

    case "lwpolyline":
    case "polyline":
      return polylineToPoints(
        entity.specific.LwPolyline || entity.specific.Polyline
      );

    case "circle":
      return circleToPoints(entity.specific.Circle, tolerance);

    case "arc":
      return arcToPoints(entity.specific.Arc, tolerance);

    case "ellipse":
      return ellipseToPoints(entity.specific.Ellipse, tolerance);

    case "spline":
      return splineToPoints(entity.specific.Spline, tolerance);

    default:
      console.warn(`Unsupported entity type: ${etype}`);
      return [];
  }
}

function lineToPoints(lineEntity) {
  return [
    { x: lineEntity.p1.x, y: lineEntity.p1.y },
    { x: lineEntity.p2.x, y: lineEntity.p2.y },
  ];
}

function polylineToPoints(polylineEntity) {
  if (!polylineEntity.vertices || !Array.isArray(polylineEntity.vertices)) {
    console.warn("Polyline entity has no vertices.");
    return [];
  }

  // Convert vertices to {x, y} format
  return polylineEntity.vertices.map((vertex) => ({
    x: vertex.x,
    y: vertex.y,
  }));
}

function circleToPoints(circleEntity, tolerance) {
  const centerX = circleEntity.center.x;
  const centerY = circleEntity.center.y;
  const r = circleEntity.radius;
  if (r <= 0) return [];

  // Approximate the circle as an arc from 0 to 2π
  return approximateArc2D(centerX, centerY, r, 0, 2 * Math.PI, tolerance);
}

function arcToPoints(arcEntity, tolerance) {
  const centerX = arcEntity.center.x;
  const centerY = arcEntity.center.y;
  const r = arcEntity.radius;
  if (r <= 0) return [];

  // DXF angles are typically in degrees; convert to radians
  let startAngle = degToRad(arcEntity.start_angle);
  let endAngle = degToRad(arcEntity.end_angle);

  // Handle negative or backward sweeps
  let sweep = endAngle - startAngle;
  if (sweep <= 0) {
    sweep += 2 * Math.PI;
  }

  return approximateArc2D(
    centerX,
    centerY,
    r,
    startAngle,
    startAngle + sweep,
    tolerance
  );
}

function ellipseToPoints(ellipseEntity, tolerance) {
  const cx = ellipseEntity.center.x;
  const cy = ellipseEntity.center.y;
  const majorAxis = ellipseEntity.major_axis; // Assuming major_axis is a vector {x, y, z}
  const minorAxisRatio = ellipseEntity.minor_axis_ratio; // Ratio of minor to major axis
  const rotation = ellipseEntity.rotation
    ? degToRad(ellipseEntity.rotation)
    : 0; // Assuming rotation is in degrees

  const majorLength = Math.sqrt(majorAxis.x ** 2 + majorAxis.y ** 2);
  const minorLength = majorLength * minorAxisRatio;

  // DXF might provide start and end angles; default to full ellipse if not specified
  let startAngle = ellipseEntity.start_angle
    ? degToRad(ellipseEntity.start_angle)
    : 0;
  let endAngle = ellipseEntity.end_angle
    ? degToRad(ellipseEntity.end_angle)
    : 2 * Math.PI;

  let sweep = endAngle - startAngle;
  if (sweep <= 0) {
    sweep += 2 * Math.PI;
  }

  return approximateEllipse2D(
    cx,
    cy,
    majorLength,
    minorLength,
    rotation,
    startAngle,
    startAngle + sweep,
    tolerance
  );
}

/**
 * Converts a NURBS spline entity to an array of (x, y) points using adaptive sampling based on tolerance.
 *
 * @param {object} splineEntity - A parsed DXF spline entity from the new library.
 * @param {number} tolerance - The maximum allowed chord length between consecutive points.
 * @returns {Array<{x: number, y: number}>} An array of points approximating the spline.
 */
export function splineToPoints(splineEntity, tolerance = 1.0) {
  // Extract NURBS parameters from the spline entity
  const degree = splineEntity.degree;
  const controlPoints = splineEntity.control_points; // Array of {x, y, z}
  const knotVector = splineEntity.knot_vector; // Array of numbers
  const weights = splineEntity.weights; // Array of numbers (same length as controlPoints)

  // Validate the presence of necessary NURBS parameters
  if (
    typeof degree !== "number" ||
    !Array.isArray(controlPoints) ||
    !Array.isArray(knotVector) ||
    !Array.isArray(weights) ||
    controlPoints.length !== weights.length
  ) {
    console.warn("Spline entity is missing required NURBS parameters.");
    return [];
  }

  const numControlPoints = controlPoints.length;
  const numKnots = knotVector.length;

  // Ensure the knot vector is valid for the given degree and number of control points
  if (numKnots !== numControlPoints + degree + 1) {
    console.warn(
      "Invalid knot vector length for the given degree and number of control points."
    );
    return [];
  }

  /**
   * Evaluates the NURBS spline at a given parameter t using de Boor's algorithm.
   *
   * @param {number} t - The parameter value at which to evaluate the spline.
   * @returns {{x: number, y: number, z: number}} The point on the spline at parameter t.
   */
  function evaluateNURBS(t) {
    // Find the knot span where t resides
    const span = findKnotSpan(t, degree, knotVector, numControlPoints);

    // Compute the basis functions for the current span
    const N = basisFunctions(span, t, degree, knotVector);

    // Initialize numerator and denominator for rational NURBS
    let numerator = { x: 0, y: 0, z: 0 };
    let denominator = 0;

    // Accumulate the weighted control points
    for (let i = 0; i <= degree; i++) {
      const idx = span - degree + i;
      const wN = weights[idx] * N[i];
      numerator.x += wN * controlPoints[idx].x;
      numerator.y += wN * controlPoints[idx].y;
      numerator.z += wN * controlPoints[idx].z;
      denominator += wN;
    }

    // Avoid division by zero
    if (denominator === 0) {
      console.warn("Denominator in NURBS evaluation is zero.");
      return { x: 0, y: 0, z: 0 };
    }

    // Compute the final point by dividing the numerator by the denominator
    return {
      x: numerator.x / denominator,
      y: numerator.y / denominator,
      z: numerator.z / denominator,
    };
  }

  /**
   * Finds the knot span index for a given parameter t.
   *
   * @param {number} t - The parameter value.
   * @param {number} degree - The degree of the spline.
   * @param {Array<number>} knots - The knot vector.
   * @param {number} numControlPoints - The number of control points.
   * @returns {number} The knot span index.
   */
  function findKnotSpan(t, degree, knots, numControlPoints) {
    const n = numControlPoints - 1;

    // Special case when t is the last knot
    if (t === knots[n + 1]) {
      return n;
    }

    // Binary search to find the correct knot span
    let low = degree;
    let high = n + 1;
    let mid = Math.floor((low + high) / 2);

    while (t < knots[mid] || t >= knots[mid + 1]) {
      if (t < knots[mid]) {
        high = mid;
      } else {
        low = mid;
      }
      mid = Math.floor((low + high) / 2);
    }

    return mid;
  }

  /**
   * Computes the non-zero basis functions for a given knot span and parameter t.
   *
   * @param {number} span - The knot span index.
   * @param {number} t - The parameter value.
   * @param {number} degree - The degree of the spline.
   * @param {Array<number>} knots - The knot vector.
   * @returns {Array<number>} The array of basis function values.
   */
  function basisFunctions(span, t, degree, knots) {
    const N = new Array(degree + 1).fill(0);
    const left = new Array(degree + 1).fill(0);
    const right = new Array(degree + 1).fill(0);

    N[0] = 1.0;

    for (let j = 1; j <= degree; j++) {
      left[j] = t - knots[span + 1 - j];
      right[j] = knots[span + j] - t;
      let saved = 0.0;

      for (let r = 0; r < j; r++) {
        const temp = N[r] / (right[r + 1] + left[j - r]);
        N[r] = saved + right[r + 1] * temp;
        saved = left[j - r] * temp;
      }

      N[j] = saved;
    }

    return N;
  }

  /**
   * Recursively samples the spline between parameters t0 and t1.
   *
   * @param {number} t0 - The starting parameter.
   * @param {number} t1 - The ending parameter.
   * @param {{x: number, y: number, z: number}} p0 - The point at t0.
   * @param {{x: number, y: number, z: number}} p1 - The point at t1.
   */
  function sample(t0, t1, p0, p1) {
    const tm = (t0 + t1) / 2;
    const pm = evaluateNURBS(tm);

    // Compute the midpoint of the chord between p0 and p1
    const chordMid = {
      x: (p0.x + p1.x) / 2,
      y: (p0.y + p1.y) / 2,
      z: (p0.z + p1.z) / 2,
    };

    // Calculate the deviation (distance) between the actual midpoint and chord midpoint
    const dx = pm.x - chordMid.x;
    const dy = pm.y - chordMid.y;
    const dz = pm.z - chordMid.z;
    const deviation = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // If deviation exceeds tolerance, subdivide further
    if (deviation > tolerance) {
      sample(t0, tm, p0, pm);
      sample(tm, t1, pm, p1);
    } else {
      // Accept the endpoint p1
      points.push({ x: p1.x, y: p1.y });
    }
  }

  /**
   * Approximates the spline by adaptive sampling.
   *
   * @returns {Array<{x: number, y: number}>} The array of sampled points.
   */
  function approximateSpline() {
    const points = [];

    // Define the valid parameter range based on the knot vector and degree
    const tMin = knotVector[degree];
    const tMax = knotVector[knotVector.length - degree - 1];

    // Evaluate the starting and ending points
    const pStart = evaluateNURBS(tMin);
    const pEnd = evaluateNURBS(tMax);

    // Initialize with the starting point
    points.push({ x: pStart.x, y: pStart.y });

    // Begin recursive sampling
    sample(tMin, tMax, pStart, pEnd);

    return points;
  }

  // Perform the approximation and return the points
  return approximateSpline();
}

/****************************************************
 * HELPER: Approximate an arc from angleStart..angleEnd
 * so that each chord has length <= tolerance.
 ****************************************************/
function approximateArc2D(cx, cy, radius, angleStart, angleEnd, tolerance) {
  const points = [];
  if (radius <= 0) return points;

  let sweep = angleEnd - angleStart;
  if (sweep <= 0) {
    sweep += 2 * Math.PI;
  }

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
  if (sweep <= 0) {
    sweep += 2 * Math.PI;
  }

  const maxRadius = Math.max(majorR, minorR);
  const angleStep = getMaxAngleStep(maxRadius, tolerance);
  const steps = Math.max(1, Math.ceil(sweep / angleStep));

  for (let i = 0; i <= steps; i++) {
    const alpha = angleStart + (sweep * i) / steps;
    const px = majorR * Math.cos(alpha);
    const py = minorR * Math.sin(alpha);

    // Apply rotation
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
  const ratio = Math.min(1, tolerance / (2 * radius));
  const theta = 2 * Math.asin(ratio);
  return Math.min(theta, (30 * Math.PI) / 180); // Cap at 30 degrees
}

/****************************************************
 * HELPER: Convert degrees to radians
 ****************************************************/
function degToRad(deg) {
  return (deg * Math.PI) / 180;
}
