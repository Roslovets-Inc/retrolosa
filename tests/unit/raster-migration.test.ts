import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import Ajv from "ajv";
import { expect, test } from "vitest";

import inputs from "../../data/stac/migration-inputs.json";
import report from "../../data/stac/migration-report.json";
import profile from "../../data/stac/raster-v1.schema.json";
import schemas from "../../data/stac/vendor/schemas.json";
import { EPOCHS } from "../../src/epochs/catalog";
import { RASTER_ITEMS } from "../../src/epochs/raster-items";
import { readStacRaster } from "../../src/epochs/stac";

test("every image and overview uses a validated STAC package with matching bytes", () => {
  const ajv = new Ajv({ allErrors: true, unknownFormats: "ignore" });
  for (const [url, schema] of Object.entries(schemas)) ajv.addSchema(schema, url);
  const imageEpochs = EPOCHS.filter(
    (epoch) => epoch.render.kind === "image" || Boolean(epoch.render.overview),
  );
  expect(imageEpochs.map((epoch) => epoch.id)).toEqual(Object.keys(RASTER_ITEMS));
  for (const item of Object.values(RASTER_ITEMS)) {
    for (const schema of [
      "https://schemas.stacspec.org/v1.1.0/item-spec/json-schema/item.json",
      "https://stac-extensions.github.io/projection/v2.0.0/schema.json",
      profile,
    ])
      expect(ajv.validate(schema, item), `${item.id}: ${JSON.stringify(ajv.errors)}`).toBe(true);
    const render = readStacRaster(item, `${item.id}/item.json`);
    const bytes = readFileSync(`public/${render.path.split("?")[0]}`);
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      item.properties["retrolosa:raster_sha256"],
    );
    const epoch = imageEpochs.find(
      (e) => e.id === Object.entries(RASTER_ITEMS).find(([, v]) => v === item)![0],
    )!;
    expect(epoch.render.kind === "tiles" ? epoch.render.overview!.image : epoch.render).toEqual(
      render,
    );
  }
});

test("normalization preserves full geographic coverage and original preparation inputs", () => {
  expect(report).toHaveLength(inputs.length);
  for (const entry of inputs) {
    const row = report.find((r) => r.id === entry.id)!;
    expect(createHash("sha256").update(readFileSync(entry.image)).digest("hex")).toBe(entry.sha256);
    expect(row.cornerResidualMetres).toBeLessThan(0.001);
    expect(Math.abs(row.alphaAreaRatio - 1)).toBeLessThan(0.001);
    const item = Object.values(RASTER_ITEMS).find((v) => v.id === entry.id)!;
    const [west, south, east, north] = item.bbox;
    for (const [lon, lat] of entry.coordinates) {
      expect(lon).toBeGreaterThanOrEqual(west - 1e-10);
      expect(lon).toBeLessThanOrEqual(east + 1e-10);
      expect(lat).toBeGreaterThanOrEqual(south - 1e-10);
      expect(lat).toBeLessThanOrEqual(north + 1e-10);
    }
    if (!row.rotated && entry.image.endsWith(".webp")) expect(row.rasterSha256).toBe(entry.sha256);
  }
});
