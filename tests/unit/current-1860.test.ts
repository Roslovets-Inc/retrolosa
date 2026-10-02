import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { expect, test } from "vitest";

import report from "../../data/georeferencing/jourdan-1860-report.json";
import project from "../../data/georeferencing/jourdan-1860.json";
import item from "../../data/stac/jourdan-1860.item.json";
import { getEpoch } from "../../src/epochs/catalog";
import { readStacRaster } from "../../src/epochs/stac";

test("current editable project matches the original and GDAL report", () => {
  const original = readFileSync("data/map-sources/jourdan-1860/original.jpg");
  expect(createHash("sha256").update(original).digest("hex")).toBe(project.image.sha256);
  expect(report.sourceSha256).toBe(project.image.sha256);
  expect(report.transform).toBe(project.transform);
  const enabled = project.points.filter((point) => point.enabled);
  expect(new Set(project.points.map((point) => point.id)).size).toBe(project.points.length);
  expect(report.points.map(({ id, role }) => ({ id, role }))).toEqual(
    enabled.map(({ id, role }) => ({ id, role })),
  );
  expect(report.fitCount).toBe(enabled.filter((point) => point.role === "fit").length);
  expect(report.checkCount).toBe(enabled.filter((point) => point.role === "check").length);
});

test("current delivery matches the report and catalogue", () => {
  expect(item.properties["retrolosa:fit_point_count"]).toBe(report.fitCount);
  expect(item.properties["retrolosa:check_points"]).toEqual(
    report.points
      .filter((point) => point.role === "check")
      .map((point) => ({
        name: point.name,
        errorMetres: Math.round(point.forwardErrorMetres * 10) / 10,
      })),
  );
  expect(item.assets.display["proj:shape"]).toEqual([report.height, report.width]);
  expect(
    createHash("sha256").update(readFileSync("public/jourdan-1860/map.webp")).digest("hex"),
  ).toBe(item.properties["retrolosa:raster_sha256"]);
  expect(getEpoch("1860").render).toEqual(readStacRaster(item, "jourdan-1860/item.json"));
});
