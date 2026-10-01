import { stateMajorTileOffsets, stateMajorSourcePixel } from "./geometry";
import type { TileCoordinates } from "./messages";
export async function renderStateMajorTile(
  tile: TileCoordinates,
  signal: AbortSignal,
): Promise<ArrayBuffer> {
  const { z } = tile;
  signal.throwIfAborted();
  const canvas = new OffscreenCanvas(256, 256);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to align state-major tiles");
  // Decode all pieces before drawing, and release bitmaps even if one request fails.
  const results = await Promise.allSettled(
    stateMajorTileOffsets(z, tile.x, tile.y).map(async (piece) => {
      const url = `https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM_6_15&TILEMATRIX=${z}&TILEROW=${piece.y}&TILECOL=${piece.x}`;
      const response = await fetch(url, { signal: signal });
      if (!response.ok)
        throw Object.assign(new Error(`IGN state-major tile: ${response.status}`), {
          status: response.status,
        });
      return { ...piece, bitmap: await createImageBitmap(await response.blob()) };
    }),
  );
  try {
    signal.throwIfAborted();
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
      if (y % 32 === 0) {
        // Let cancellation messages run between batches of pixel samples.
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        signal.throwIfAborted();
      }
      for (let x = 0; x < 256; x++) {
        const [worldX, worldY] = stateMajorSourcePixel(
          z,
          tile.x * 256 + x + 0.5,
          tile.y * 256 + y + 0.5,
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
    const data = await (await canvas.convertToBlob({ type: "image/png" })).arrayBuffer();
    signal.throwIfAborted();
    return data;
  } finally {
    for (const result of results) {
      if (result.status === "fulfilled") result.value.bitmap.close();
    }
  }
}
