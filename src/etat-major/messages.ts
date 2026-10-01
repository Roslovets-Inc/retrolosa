export interface TileCoordinates {
  z: number;
  x: number;
  y: number;
}
export type TileRequest =
  | { type: "render"; id: number; tile: TileCoordinates }
  | { type: "abort"; id: number };
export type TileResponse =
  | { type: "result"; id: number; data: ArrayBuffer }
  | { type: "error"; id: number; error: { name: string; message: string; status?: number } };
export function parseTileUrl(url: string): TileCoordinates {
  const match = /^etat-major:\/\/(\d+)\/(\d+)\/(\d+)$/.exec(url);
  if (!match) throw new Error("Invalid state-major tile URL");
  const [z, x, y] = match.slice(1).map(Number);
  if (z < 6 || z > 15) throw new Error("Unsupported state-major zoom");
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y) || x >= 2 ** z || y >= 2 ** z)
    throw new Error("Invalid state-major tile coordinates");
  return { z, x, y };
}
