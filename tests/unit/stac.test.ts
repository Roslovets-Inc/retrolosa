import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import Ajv from "ajv";
import { expect, test } from "vitest";

import item from "../../data/stac/jourdan-1860.item.json";
import profile from "../../data/stac/raster-v1.schema.json";
import schemas from "../../data/stac/vendor/schemas.json";
import { historicalStyle } from "../../src/epochs/sources";
import { readStacRaster } from "../../src/epochs/stac";

test("1860 conforms to official STAC, Projection and local profile schemas offline", () => {
  const ajv = new Ajv({ allErrors: true, schemaId: "auto", unknownFormats: "ignore" });
  for (const [url, schema] of Object.entries(schemas)) ajv.addSchema(schema, url);
  for (const schema of [
    "https://schemas.stacspec.org/v1.1.0/item-spec/json-schema/item.json",
    "https://stac-extensions.github.io/projection/v2.0.0/schema.json",
    profile,
  ])
    expect(ajv.validate(schema, item), JSON.stringify(ajv.errors)).toBe(true);
});

test("STAC preserves the full raster extent and resolves prefixed delivery", () => {
  const raster = readStacRaster(item, "jourdan-1860/item.json");
  const [west, south, east, north] = item.bbox;
  const corners = [
    [west, north],
    [east, north],
    [east, south],
    [west, south],
  ];
  raster.coordinates.forEach((point, i) =>
    point.forEach((v, j) => expect(v).toBeCloseTo(corners[i][j], 10)),
  );
  expect(
    createHash("sha256").update(readFileSync("public/jourdan-1860/map.webp")).digest("hex"),
  ).toBe(item.properties["retrolosa:raster_sha256"]);
  const source = historicalStyle(
    { "1860": 1 },
    { baseUrl: "/nested/", origin: "https://example.org" },
  ).sources["history-1860"];
  expect(source).toMatchObject({
    type: "image",
    url: `/nested/${raster.path}`,
    coordinates: raster.coordinates,
  });
});

test("unsupported grids fail instead of silently shifting the map", () => {
  for (const change of [
    { "proj:code": "EPSG:4326" },
    { "proj:shape": [4096, 0] },
    { "proj:shape": [1.5, 3] },
    { "proj:transform": [2, 1, 0, 0, -2, 0] },
    { "proj:transform": [2, 0, 0, 0, 2, 0] },
    { "proj:transform": [2, 0, Infinity, 0, -2, 0] },
    { "proj:transform": [2, 0, 1e9, 0, -2, 0] },
    { href: "https://example.org/map.webp" },
    { href: "/map.webp" },
    { href: "map.webp?version=1" },
    { type: "image/tiff" },
  ]) {
    const candidate = structuredClone(item);
    Object.assign(candidate.assets.display, change);
    expect(() => readStacRaster(candidate, "map/item.json")).toThrow();
  }
  expect(() => readStacRaster(null, "item.json")).toThrow();
  expect(() => readStacRaster({ ...item, stac_version: "0.9.0" }, "item.json")).toThrow();
});
