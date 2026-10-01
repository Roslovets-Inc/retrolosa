import { expect, test } from "vitest";

import { EPOCHS, EPOCH_IDS, getEpoch, isEpochId } from "../../src/epochs/catalog";
import { epochLayerIds, historicalStyle } from "../../src/epochs/sources";
import { readBounds, readCoordinates } from "../../src/epochs/types";

const assets = { baseUrl: "/toulouse-in-time/", origin: "https://example.test" };

test("catalogue has unique, chronological IDs and complete presentation metadata", () => {
  expect(new Set(EPOCH_IDS).size).toBe(EPOCH_IDS.length);
  expect(EPOCH_IDS.map(Number)).toEqual(EPOCH_IDS.map(Number).sort((a, b) => a - b));
  for (const epoch of EPOCHS) {
    expect(isEpochId(epoch.id)).toBe(true);
    expect(getEpoch(epoch.id).label).toBeTruthy();
    expect(new URL(epoch.sourceUrl).protocol).toBe("https:");
    expect(epoch.credit).toBeTruthy();
    expect(epoch.attribution).toBeTruthy();
  }
  expect(isEpochId("invalid")).toBe(false);
});

test("styles use chronological painter order and share each epoch's opacity across its layers", () => {
  const style = historicalStyle({ "1631": 1, "1777": 0.5 }, assets);
  expect(style.layers.map((layer) => layer.id)).toEqual(EPOCH_IDS.flatMap(epochLayerIds));
  for (const layer of style.layers) {
    expect(layer.type).toBe("raster");
    if (layer.type === "raster") {
      expect(style.sources[layer.source]).toBeDefined();
      expect(layer.paint?.["raster-opacity"]).toBe(
        layer.id.endsWith("1631") ? 1 : layer.id.endsWith("1777") ? 0.5 : 0,
      );
    }
  }
});

test("local images and tiles respect deployment paths while remote protocols are preserved", () => {
  const style = historicalStyle({}, assets);
  expect(style.sources["history-1250"]).toMatchObject({
    type: "image",
    url: "/toulouse-in-time/openedition-13c/map.webp",
  });
  expect(style.sources["history-1631"]).toMatchObject({
    tiles: ["https://example.test/toulouse-in-time/tavernier-1631/{z}/{x}/{y}.webp?v=4"],
    minzoom: 14,
    maxzoom: 17,
  });
  expect(style.sources["history-1680"]).toMatchObject({
    url: "pmtiles://https://makina-pmtiles.s3.fr-par.scw.cloud/tolosa-1680.pmtiles",
  });
  expect(style.sources["history-1848"]).toMatchObject({
    tiles: ["etat-major://{z}/{x}/{y}"],
    minzoom: 6,
    maxzoom: 15,
  });
  expect(style.sources["history-1954"]).toMatchObject({ minzoom: 6, maxzoom: 16 });
});

test("overview and detail layers meet at a single zoom boundary", () => {
  const style = historicalStyle({}, assets);
  for (const epoch of EPOCHS) {
    if (epoch.render.kind !== "overview") continue;
    expect(Number.isFinite(epoch.render.switchZoom)).toBe(true);
    const overview = style.layers.find((layer) => layer.id === `overview-${epoch.id}`)!;
    const detail = style.layers.find((layer) => layer.id === `history-${epoch.id}`)!;
    expect(overview.maxzoom).toBe(detail.minzoom);
    if (epoch.render.detail.kind === "tiles") {
      expect(epoch.render.detail.minzoom).toBeLessThanOrEqual(epoch.render.switchZoom);
      expect(epoch.render.detail.maxzoom).toBeGreaterThanOrEqual(epoch.render.switchZoom);
    }
  }
});

test("metadata validation rejects malformed corners and reversed bounds", () => {
  expect(
    readCoordinates([
      [1, 44],
      [2, 44],
      [2, 43],
      [1, 43],
    ]),
  ).toEqual([
    [1, 44],
    [2, 44],
    [2, 43],
    [1, 43],
  ]);
  for (const invalid of [
    [],
    [[1, 2]],
    [
      [NaN, 2],
      [1, 2],
      [1, 2],
      [1, 2],
    ],
    [
      [181, 2],
      [1, 2],
      [1, 2],
      [1, 2],
    ],
    [
      [1, 91],
      [1, 2],
      [1, 2],
      [1, 2],
    ],
    [[1], [1, 2], [1, 2], [1, 2]],
  ])
    expect(() => readCoordinates(invalid)).toThrow();
  expect(readBounds([1, 43, 2, 44])).toEqual([1, 43, 2, 44]);
  for (const invalid of [
    [],
    [2, 43, 1, 44],
    [1, 44, 2, 43],
    [NaN, 43, 2, 44],
    [1, 43, 181, 44],
    [1, 43, 2, 91],
  ])
    expect(() => readBounds(invalid)).toThrow();
});
