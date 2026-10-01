import type { AddProtocolAction } from "maplibre-gl";

import alignment from "./etat-major-alignment.json";

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

export const loadStateMajorTile: AddProtocolAction = async (params, abortController) => {
  const match = /^etat-major:\/\/(\d+)\/(\d+)\/(\d+)$/.exec(params.url);
  if (!match) throw new Error("Invalid state-major tile URL");
  const [, zoom, col, row] = match;
  const z = Number(zoom);
  if (z < 6 || z > 15) throw new Error("Unsupported state-major zoom");
  const canvas = new OffscreenCanvas(256, 256);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to align state-major tiles");
  // Decode all pieces before drawing, and release bitmaps even if one request fails.
  const results = await Promise.allSettled(
    stateMajorTileOffsets(z, Number(col), Number(row)).map(async (piece) => {
      const url = `https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM_6_15&TILEMATRIX=${z}&TILEROW=${piece.y}&TILECOL=${piece.x}`;
      const response = await fetch(url, { signal: abortController.signal });
      if (!response.ok) throw new Error(`IGN state-major tile: ${response.status}`);
      return { ...piece, bitmap: await createImageBitmap(await response.blob()) };
    }),
  );
  try {
    abortController.signal.throwIfAborted();
    const pieces = results.map((result) => {
      if (result.status === "rejected") throw result.reason;
      return result.value;
    });
    const firstX = Math.min(...pieces.map((piece) => piece.x));
    const firstY = Math.min(...pieces.map((piece) => piece.y));
    const originX = firstX * 256;
    const originY = firstY * 256;
    const mosaic = new OffscreenCanvas(
      (Math.max(...pieces.map((piece) => piece.x)) - firstX + 1) * 256,
      (Math.max(...pieces.map((piece) => piece.y)) - firstY + 1) * 256,
    );
    const mosaicContext = mosaic.getContext("2d");
    if (!mosaicContext) throw new Error("Unable to assemble state-major tiles");
    for (const { bitmap, x, y } of pieces) {
      mosaicContext.drawImage(bitmap, x * 256 - originX, y * 256 - originY, 256, 256);
    }
    // Sample a shared world-coordinate inverse; adjacent tiles use exactly the same mapping.
    const input = mosaicContext.getImageData(0, 0, mosaic.width, mosaic.height).data;
    const output = context.createImageData(256, 256);
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const [worldX, worldY] = stateMajorSourcePixel(
          z,
          Number(col) * 256 + x + 0.5,
          Number(row) * 256 + y + 0.5,
        );
        const sx = worldX - originX - 0.5;
        const sy = worldY - originY - 0.5;
        const ix = Math.floor(sx);
        const iy = Math.floor(sy);
        const fx = sx - ix;
        const fy = sy - iy;
        const index = (iy * mosaic.width + ix) * 4;
        const destination = (y * 256 + x) * 4;
        for (let channel = 0; channel < 4; channel++) {
          output.data[destination + channel] =
            (1 - fy) * ((1 - fx) * input[index + channel] + fx * input[index + 4 + channel]) +
            fy *
              ((1 - fx) * input[index + mosaic.width * 4 + channel] +
                fx * input[index + mosaic.width * 4 + 4 + channel]);
        }
      }
    }
    context.putImageData(output, 0, 0);
    return { data: await (await canvas.convertToBlob({ type: "image/png" })).arrayBuffer() };
  } finally {
    for (const result of results) {
      if (result.status === "fulfilled") result.value.bitmap.close();
    }
  }
};
