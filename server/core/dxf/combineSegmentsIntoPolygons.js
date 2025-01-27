/**
 * Merge all open segments into one or more polygons if possible.
 * Preserves originEntities for each edge.
 *
 * @param {Array} originOpen  - Array of objects, each like:
 *     {
 *       polygon: [ {x, y}, {x, y}, ... ],   // Usually 2 points (a line segment)
 *       originEntities: [ ... ]            // references to original DXF entities
 *     }
 * @param {number} tolerance
 *
 * @returns {{
 *   closed: Array<{ polygon: Array<{x,y}>, originEntities: any[] }>,
 *   open:   Array<{ polygon: Array<{x,y}>, originEntities: any[] }>
 * }}
 */
export function combineSegmentsIntoPolygons(originOpen, tolerance = 1e-7) {
  //
  // 1) Convert each object in originOpen to "edges"
  //
  //    Example: if .polygon = [p1, p2], that's 1 edge.
  //             if .polygon = [p1, p2, p3], that's 2 edges, etc.
  //
  const allEdges = [];
  for (const item of originOpen) {
    const pts = item.polygon;
    // Each consecutive pair of points is one edge
    for (let i = 0; i < pts.length - 1; i++) {
      allEdges.push({
        p1: pts[i],
        p2: pts[i + 1],
        originEntities: item.originEntities || [],
      });
    }
  }

  //
  // 2) Build an undirected adjacency graph
  //
  const { graph, edgeOrigins } = buildGraph(allEdges, tolerance);

  //
  // 3) Walk the graph to form closed or open chains
  //
  const visitedEdges = new Set();
  const closed = [];
  const open = [];

  for (const nodeKey of graph.keys()) {
    const neighbors = graph.get(nodeKey) || [];
    for (const neighborKey of neighbors) {
      const edgeKey = makeEdgeKey(nodeKey, neighborKey);
      if (visitedEdges.has(edgeKey)) {
        // Edge already consumed by a chain
        continue;
      }

      // Attempt to walk a chain from nodeKey -> neighborKey
      const chain = walkChain(
        nodeKey,
        neighborKey,
        graph,
        visitedEdges,
        edgeOrigins,
        tolerance
      );

      // Decide if chain is closed
      if (isClosedLoop(chain.points, tolerance)) {
        closed.push({
          polygon: chain.points,
          originEntities: chain.origins,
        });
      } else {
        open.push({
          polygon: chain.points,
          originEntities: chain.origins,
        });
      }
    }
  }

  // remove dublicates points from closed polygons
  closed.forEach((polygon) => {
    polygon.polygon = polygon.polygon.filter(
      (point, index, self) =>
        index ===
        self.findIndex(
          (t) => t.x === point.x && t.y === point.y
        )
    );
  });

  return { closed, open };
}

/**
 * Build adjacency & track the origin entities for each undirected edge.
 *
 * - edges: Array of { p1, p2, originEntities }
 * - graph: Map<pointKey, Set<pointKey>>
 * - edgeOrigins: Map<"A->B", Array<originEntities>>  (for both directions)
 */
function buildGraph(edges, tolerance) {
  const graph = new Map(); // pointKey -> set of neighbor pointKeys
  const edgeOrigins = new Map(); // "A->B" -> array of originEntities

  function addNode(k) {
    if (!graph.has(k)) graph.set(k, new Set());
  }

  function addEdge(k1, k2, origins) {
    graph.get(k1).add(k2);
    graph.get(k2).add(k1);

    const e1 = makeEdgeKey(k1, k2);
    const e2 = makeEdgeKey(k2, k1);
    if (!edgeOrigins.has(e1)) edgeOrigins.set(e1, []);
    if (!edgeOrigins.has(e2)) edgeOrigins.set(e2, []);

    // accumulate the originEntities
    edgeOrigins.get(e1).push(...origins);
    edgeOrigins.get(e2).push(...origins);
  }

  for (const e of edges) {
    const k1 = snapPointKey(e.p1, tolerance);
    const k2 = snapPointKey(e.p2, tolerance);

    addNode(k1);
    addNode(k2);

    addEdge(k1, k2, e.originEntities);
  }

  return { graph, edgeOrigins };
}

/**
 * Attempt to walk along the graph from (startKey -> nextKey).
 *
 * Instead of stopping when there's more than 1 neighbor,
 * we handle corners with 2 neighbors (typical polygon corners).
 * If we manage to return to startKey with at least 3 edges, we have a closed loop.
 *
 * Returns:
 * {
 *   points: [ { x, y }, ... ],   // visited in order
 *   origins: [ ... ]            // all originEntities from used edges
 * }
 */
function walkChain(
  startKey,
  nextKey,
  graph,
  visitedEdges,
  edgeOrigins,
  tolerance
) {
  // This array will store the chain of points in order
  const chainPoints = [parsePoint(startKey)];
  // This accumulates all originEntities from used edges
  const chainOrigins = [];

  // We'll keep track of the "previous" node as well
  let currentKey = startKey;
  let prevKey = null;

  // Helper to "use" an edge from A->B
  function useEdge(aKey, bKey) {
    // Mark visited
    const eKey = makeEdgeKey(aKey, bKey);
    visitedEdges.add(eKey);
    // Collect originEntities
    const theseOrigins = edgeOrigins.get(eKey) || [];
    chainOrigins.push(...theseOrigins);

    // Push the new point's coordinates
    chainPoints.push(parsePoint(bKey));

    // Advance
    prevKey = aKey;
    currentKey = bKey;
  }

  // First step: use startKey->nextKey
  useEdge(startKey, nextKey);

  // Then keep going
  while (true) {
    const neighbors = Array.from(graph.get(currentKey) || []);
    // Filter out edges we've already used
    const unusedNeighbors = neighbors.filter(
      (n) => !visitedEdges.has(makeEdgeKey(currentKey, n))
    );

    // If no unused neighbors => dead end
    if (unusedNeighbors.length === 0) {
      break;
    }

    // If there's exactly 1 unused neighbor AND it is the original startKey,
    // we can close the loop if we have at least 3 edges
    if (unusedNeighbors.length === 1) {
      const maybeClose = unusedNeighbors[0];
      if (maybeClose === startKey && chainPoints.length >= 3) {
        // We can close the polygon
        useEdge(currentKey, startKey);
        break;
      }
    }

    // If there's exactly 1 unused neighbor and it's NOT the startKey,
    // then we continue the chain
    if (unusedNeighbors.length === 1) {
      const nextNode = unusedNeighbors[0];
      useEdge(currentKey, nextNode);
      continue;
    }

    // If there are exactly 2 unused neighbors, that typically means
    // a polygon corner: the node has 2 edges (the one we came from, and the one we go to).
    // We pick the neighbor that isn't our previous node, if possible.
    if (unusedNeighbors.length === 2) {
      // If we haven't visited either edge, skip the one that leads back to prevKey
      // (unless prevKey is also the startKey in a small shape).
      const [n1, n2] = unusedNeighbors;
      // We'll try n1 if it's not prevKey, else n2
      let nextNode = n1 !== prevKey ? n1 : n2;
      // If both are not prevKey, or both are prevKey, it's ambiguous -> break
      // But typically for a rectangle corner, exactly one will be the old node
      if (n1 !== prevKey && n2 !== prevKey) {
        // Branching? We'll just pick n1 arbitrarily
        nextNode = n1;
      } else if (n1 === prevKey && n2 === prevKey) {
        // We are basically stuck
        break;
      }

      useEdge(currentKey, nextNode);
      continue;
    }

    // If there's more than 2 neighbors, we have a branching node.
    // We'll stop here for simplicity. (A more advanced approach would do a full DFS.)
    break;
  }

  return {
    points: chainPoints,
    origins: chainOrigins,
  };
}

/**
 * Check if chainPoints form a closed loop: first & last point within tolerance,
 * at least 3 edges.
 */
function isClosedLoop(points, tolerance) {
  if (points.length < 4) {
    // If we only have 3 points, that's 2 edges, not enough for a polygon
    return false;
  }
  const first = points[0];
  const last = points[points.length - 1];
  return distance(first, last) <= tolerance;
}

/**
 * Snap a numeric point to a string key, rounding to ~7 decimals.
 */
function snapPointKey(pt, tolerance) {
  const rx = +pt.x.toFixed(7);
  const ry = +pt.y.toFixed(7);
  return `${rx},${ry}`;
}

function parsePoint(key) {
  const [xs, ys] = key.split(",").map(Number);
  return { x: xs, y: ys };
}

function makeEdgeKey(a, b) {
  return a + "->" + b;
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}
