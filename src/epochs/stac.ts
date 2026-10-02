import { readCoordinates } from "./types";
import type { ImageRender } from "./types";

export const PROJECTION_EXTENSION =
  "https://stac-extensions.github.io/projection/v2.0.0/schema.json";
const RADIUS = 6378137;
const LIMIT = Math.PI * RADIUS;

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Expected a STAC object");
  return value as Record<string, unknown>;
}

function numbers(value: unknown, length: number): number[] {
  if (
    !Array.isArray(value) ||
    value.length !== length ||
    value.some((v) => typeof v !== "number" || !Number.isFinite(v))
  )
    throw new Error("Invalid STAC numeric array");
  return value as number[];
}

/** Retrolosa raster profile v1: a local, north-up Web Mercator display asset.
 * This checks rendering invariants; it is not a general STAC schema validator.
 */
export function readStacRaster(value: unknown, itemPath: string): ImageRender {
  const item = object(value);
  const properties = object(item.properties);
  if (
    item.type !== "Feature" ||
    item.stac_version !== "1.1.0" ||
    typeof item.id !== "string" ||
    !item.id ||
    properties["retrolosa:raster_contract"] !== 1 ||
    !Array.isArray(item.stac_extensions) ||
    !item.stac_extensions.includes(PROJECTION_EXTENSION)
  )
    throw new Error("Unsupported STAC raster contract");
  const asset = object(object(item.assets).display);
  if (asset.type !== "image/webp" || asset["proj:code"] !== "EPSG:3857")
    throw new Error("Display asset must be WebP in EPSG:3857; reproject during preparation");
  const [height, width] = numbers(asset["proj:shape"], 2);
  if (![height, width].every((n) => Number.isSafeInteger(n) && n > 0))
    throw new Error("Invalid raster dimensions");
  const [a, b, c, d, e, f] = numbers(asset["proj:transform"], 6);
  if (a <= 0 || e >= 0 || b !== 0 || d !== 0)
    throw new Error("Display grid must be north-up without rotation or shear");
  const coordinates = readCoordinates(
    [
      [0, 0],
      [width, 0],
      [width, height],
      [0, height],
    ].map(([x, y]) => {
      const east = a * x + c;
      const north = e * y + f;
      if (Math.abs(east) > LIMIT || Math.abs(north) > LIMIT)
        throw new Error("Raster extends outside Web Mercator bounds");
      return [
        ((east / RADIUS) * 180) / Math.PI,
        (Math.atan(Math.sinh(north / RADIUS)) * 180) / Math.PI,
      ];
    }),
  );
  // Resolve relative to the Item, then return an application-relative path so
  // sources.ts can apply the deployment base (including GitHub Pages prefixes).
  if (
    typeof asset.href !== "string" ||
    !asset.href ||
    /[?#\\]/.test(asset.href) ||
    asset.href.startsWith("/") ||
    /^[a-z][a-z0-9+.-]*:/i.test(asset.href)
  )
    throw new Error("Display href must be a relative local path without query or fragment");
  const url = new URL(asset.href, new URL(itemPath, "https://retrolosa.invalid/"));
  const revision = properties["retrolosa:revision"];
  if (typeof revision !== "string" || !revision) throw new Error("Missing raster revision");
  return {
    kind: "image",
    path: `${url.pathname.slice(1)}?v=${encodeURIComponent(revision)}`,
    coordinates,
  };
}
