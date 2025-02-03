import { parseAndCombine } from "../dxf/parser";

/**
 * @param {string} any
 * @returns {{svg: string, error: string}}
 */
export function generateSvg(dxfObject) {
  const polygones = parseAndCombine(dxfObject, 1);

  const svg = createSVGFromPolygons(polygones.closed);
  let error = null;

  if (polygones.open.length > 0) {
    error = "Some polygons are not closed.";
  }
  if (polygones.closed.length === 0) {
    error = "No closed polygons found.";
  }
  return {
    svg: svg,
    error: error,
  };
}

/**
 * @param {Array<{ polygon: Array<{x: number, y: number}>, originEntities: Array<object> }>} closedPolygons
 * @returns {string} - The generated SVG string.
 */
function createSVGFromPolygons(closedPolygons) {
  if (!Array.isArray(closedPolygons)) {
    throw new Error("closedPolygons must be an array");
  }

  if (closedPolygons.length === 0) {
    console.warn("No closed polygons provided.");
  }

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  closedPolygons.forEach(({ polygon }) => {
    polygon.forEach(({ x, y }) => {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    });
  });

  if (minX === Infinity) minX = minY = 0;
  if (maxX === -Infinity) maxX = maxY = 100;

  const padding = Math.max(maxX - minX, maxY - minY) * 0.05; // 5% padding
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const viewBoxWidth = maxX - minX;
  const viewBoxHeight = maxY - minY;

  // Calculate the center for horizontal mirroring
  const centerY = (minY + maxY) / 2;

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${viewBoxWidth}" height="${viewBoxHeight}" viewBox="${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}">\n`;

  closedPolygons.forEach(({ polygon }, index) => {
    if (polygon.length < 3) {
      console.warn(
        `Polygon #${index} has less than 3 points and will be skipped.`
      );
      return;
    }

    const mirroredPolygon = polygon.map(({ x, y }) => ({
      x,
      y: centerY * 2 - y,
    }));

    const mirroredPointsStr = mirroredPolygon
      .map((pt) => `${pt.x},${pt.y}`)
      .join(" ");

    svgContent += `<polygon points="${mirroredPointsStr}" stroke="#000000" fill="none" stroke-width="1"/>\n`;
  });

  closedPolygons.forEach(({ innerPolygons }, _) => {
    if (!innerPolygons || innerPolygons.length === 0) {
      return;
    }
    innerPolygons.forEach((drawInner) => {
      const mirroredPolygon = drawInner.map(({ x, y }) => ({
        x,
        y: centerY * 2 - y,
      }));
      const innerPointsStr = mirroredPolygon
        .map((pt) => `${pt.x},${pt.y}`)
        .join(" ");
      svgContent += `<polygon points="${innerPointsStr}" stroke="#000000" fill="none" stroke-width="1"/>\n`;
    });
  });

  svgContent += `</svg>`;

  return svgContent;
}
