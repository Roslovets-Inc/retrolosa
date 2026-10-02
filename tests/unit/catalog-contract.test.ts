import { expect, test } from "vitest";

import { EPOCHS } from "../../src/epochs/catalog";
import { integrationName, validateCatalog } from "../../src/epochs/catalog-contract";
import { RASTER_ITEMS } from "../../src/epochs/raster-items";
import type { EpochDefinition, EpochRender } from "../../src/epochs/types";

test("every current historical map uses an explicit supported integration", () => {
  expect(() => validateCatalog(EPOCHS, RASTER_ITEMS)).not.toThrow();
  expect(EPOCHS.map((epoch) => integrationName(epoch.render))).not.toContain("");
});

test("a raster PMTiles archive can be integrated without an overview image", () => {
  const epoch: EpochDefinition = {
    ...EPOCHS[0],
    render: {
      kind: "tiles",
      source: { type: "pmtiles", url: "pmtiles://https://example.org/map.pmtiles" },
    },
  };
  expect(() => validateCatalog([epoch], {})).not.toThrow();
  expect(integrationName(epoch.render)).toBe("Tiles (PMTiles)");
});

test("catalogue rejects broken authoring contracts before maps are published", () => {
  const audit = (mutate: (epochs: EpochDefinition[]) => void) => {
    const epochs: EpochDefinition[] = structuredClone([...EPOCHS]);
    mutate(epochs);
    expect(() => validateCatalog(epochs, RASTER_ITEMS)).toThrow();
  };
  audit((epochs) => epochs.reverse());
  audit((epochs) => {
    epochs[1].id = epochs[0].id;
  });
  audit((epochs) => {
    epochs[0].attribution = "";
  });
  audit((epochs) => {
    epochs[0].render = {
      kind: "image",
      path: "wrong.webp",
      coordinates: [
        [0, 1],
        [1, 1],
        [1, 0],
        [0, 0],
      ],
    };
  });
  const invalidRenders: EpochRender[] = [
    { kind: "tiles", source: { type: "template", tiles: ["https://example.org/{x}/{y}.png"] } },
    { kind: "tiles", source: { type: "template", local: true, tiles: ["/tiles/{z}/{x}/{y}.png"] } },
    { kind: "tiles", source: { type: "template", tiles: ["unregistered://{z}/{x}/{y}"] } },
    {
      kind: "tiles",
      source: { type: "template", tiles: ["https://example.org/{z}/{x}/{y}"] },
      minzoom: 17,
      maxzoom: 14,
    },
    { kind: "tiles", source: { type: "pmtiles", url: "https://example.org/map.pmtiles" } },
  ];
  for (const render of invalidRenders)
    audit((epochs) => {
      epochs[8].render = structuredClone(render);
    });
  audit((epochs) => {
    const render = epochs.find((epoch) => epoch.id === "1631")!.render;
    if (render.kind === "tiles" && render.overview) render.overview.switchZoom = 10;
  });
  expect(() => validateCatalog(EPOCHS, {})).toThrow("registered STAC");
  expect(() => validateCatalog(EPOCHS, { ...RASTER_ITEMS, unused: RASTER_ITEMS["1860"] })).toThrow(
    "Unreferenced",
  );
});
