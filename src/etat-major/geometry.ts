import alignment from "../etat-major-alignment.json";

let inverseGrid: Float32Array | undefined;

function correctionGrid() {
  if (inverseGrid) return inverseGrid;
  const { width, height, step, normalization, nodes, weights, affine } = alignment.warp;
  const columns = width / step + 1;
  const grid = new Float32Array(columns * (height / step + 1) * 2);
  // Evaluate the fitted spline once. All tiles then sample this same world grid.
  for (let y = 0; y <= height; y += step) {
    for (let x = 0; x <= width; x += step) {
      const px = x / normalization;
      const py = y / normalization;
      let dx = affine[0][0] + px * affine[1][0] + py * affine[2][0];
      let dy = affine[0][1] + px * affine[1][1] + py * affine[2][1];
      for (let i = 0; i < nodes.length; i++) {
        const r2 = (px - nodes[i][0]) ** 2 + (py - nodes[i][1]) ** 2;
        const value = r2 === 0 ? 0 : 0.5 * r2 * Math.log(r2);
        dx += value * weights[i][0];
        dy += value * weights[i][1];
      }
      const index = ((y / step) * columns + x / step) * 2;
      grid[index] = dx;
      grid[index + 1] = dy;
    }
  }
  inverseGrid = grid;
  return grid;
}

export function stateMajorSourcePixel(z: number, x: number, y: number): [number, number] {
  const scale = 2 ** (z - alignment.referenceZoom);
  const global: [number, number] = [
    x - alignment.offsetPixels[0] * scale,
    y - alignment.offsetPixels[1] * scale,
  ];
  const annotationScale = alignment.annotationScale;
  const px = (x / scale - alignment.referenceOriginTiles[0] * 256) / annotationScale;
  const py = (y / scale - alignment.referenceOriginTiles[1] * 256) / annotationScale;
  const { width, height, step } = alignment.warp;
  if (px < 0 || py < 0 || px >= width || py >= height) return global;
  const grid = correctionGrid();
  const columns = width / step + 1;
  const ix = Math.floor(px / step);
  const iy = Math.floor(py / step);
  const fx = px / step - ix;
  const fy = py / step - iy;
  const index = (iy * columns + ix) * 2;
  for (let axis = 0; axis < 2; axis++) {
    const displacement =
      (1 - fy) * ((1 - fx) * grid[index + axis] + fx * grid[index + 2 + axis]) +
      fy *
        ((1 - fx) * grid[index + columns * 2 + axis] + fx * grid[index + columns * 2 + 2 + axis]);
    global[axis] += displacement * annotationScale * scale;
  }
  return global;
}

// Keep the correction in world pixels so it represents the same ground distance at every zoom.
export function stateMajorTileOffsets(z: number, x: number, y: number) {
  const scale = 2 ** (z - alignment.referenceZoom);
  const [dx, dy] = alignment.offsetPixels.map((value) => value * scale);
  let left = x * 256 - dx;
  let top = y * 256 - dy;
  let right = left + 255;
  let bottom = top + 255;
  // Bound every actual sample, then include the adjacent pixels used by bilinear interpolation.
  for (let py = 0; py < 256; py++) {
    for (let px = 0; px < 256; px++) {
      const [sx, sy] = stateMajorSourcePixel(z, x * 256 + px + 0.5, y * 256 + py + 0.5);
      left = Math.min(left, sx - 0.5);
      top = Math.min(top, sy - 0.5);
      right = Math.max(right, sx - 0.5);
      bottom = Math.max(bottom, sy - 0.5);
    }
  }
  const firstX = Math.floor(left / 256);
  const firstY = Math.floor(top / 256);
  const pieces = [];
  for (let col = firstX; col <= Math.floor((Math.floor(right) + 1) / 256); col++) {
    for (let row = firstY; row <= Math.floor((Math.floor(bottom) + 1) / 256); row++) {
      pieces.push({ x: col, y: row });
    }
  }
  return pieces;
}
