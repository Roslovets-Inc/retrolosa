import { readStacRaster } from "./stac";
import { readBounds } from "./types";
import type { EpochDefinition, EpochRender, ImageRender } from "./types";

export function integrationName(render: EpochRender): string {
  if (render.kind === "image") return "STAC / WebP";
  const delivery =
    render.source.type === "pmtiles"
      ? "PMTiles"
      : render.source.tiles.every((url) => url.startsWith("etat-major://"))
        ? "Etat-major adapter"
        : render.source.local
          ? "local XYZ"
          : "remote XYZ / compatible WMTS";
  return `Tiles (${delivery})${render.overview ? " + STAC overview" : ""}`;
}

/** Audit authoring inputs without coupling catalogue data to the map controller. */
export function validateCatalog(
  epochs: readonly EpochDefinition[],
  items: Readonly<Record<string, unknown>>,
): void {
  const usedItems = new Set<string>();
  const ids = new Set<string>();
  let previous = -Infinity;
  const assert = (condition: boolean, message: string) => {
    if (!condition) throw new Error(message);
  };
  const image = (render: ImageRender, id: string) => {
    const item = items[id];
    assert(Boolean(item), `${id}: image requires a registered STAC Item`);
    const itemId = (item as { id: string }).id;
    assert(/^[a-z0-9][a-z0-9-]*$/.test(itemId), `${id}: invalid Item delivery directory`);
    const expected = readStacRaster(item, `${itemId}/item.json`);
    assert(JSON.stringify(render) === JSON.stringify(expected), `${id}: image differs from STAC`);
    usedItems.add(id);
  };
  const validateRender = (render: EpochRender, id: string): void => {
    if (render.kind === "image") return image(render, id);
    assert(render.kind === "tiles", `${id}: unsupported integration kind`);
    if (render.overview) {
      image(render.overview.image, id);
      const zoom = render.overview.switchZoom;
      assert(
        Number.isFinite(zoom) && zoom >= 0 && zoom <= 24,
        `${id}: invalid overview switch zoom`,
      );
      assert(
        (render.minzoom ?? 0) <= zoom && (render.maxzoom ?? 24) >= zoom,
        `${id}: gap between overview and detail`,
      );
    }
    if (render.source.type === "pmtiles") {
      assert(
        /^pmtiles:\/\/https?:\/\//.test(render.source.url),
        `${id}: expected a remote raster PMTiles archive`,
      );
    } else {
      assert(render.source.tiles.length > 0, `${id}: missing tile template`);
      for (const url of render.source.tiles) {
        assert(
          ["{z}", "{x}", "{y}"].every((token) => url.includes(token)),
          `${id}: missing XYZ placeholders`,
        );
        assert(
          render.source.local
            ? !/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(url) && !url.split("/").includes("..")
            : /^(https?:\/\/|etat-major:\/\/)/.test(url),
          `${id}: unsupported tile address or protocol`,
        );
      }
    }
    const min = render.minzoom ?? 0;
    const max = render.maxzoom ?? 24;
    assert(
      Number.isInteger(min) && Number.isInteger(max) && min >= 0 && max <= 24 && min <= max,
      `${id}: invalid tile zoom range`,
    );
    if (render.bounds) readBounds(render.bounds);
  };
  for (const epoch of epochs) {
    assert(
      /^\d+$/.test(epoch.id) && Number(epoch.id) > previous && !ids.has(epoch.id),
      `Duplicate, non-numeric or unordered epoch: ${epoch.id}`,
    );
    previous = Number(epoch.id);
    ids.add(epoch.id);
    assert(
      [epoch.label, epoch.optionLabel, epoch.category, epoch.credit, epoch.attribution].every(
        (v) => typeof v === "string" && v.trim().length > 0,
      ),
      `${epoch.id}: incomplete metadata`,
    );
    assert(/^https?:\/\//.test(epoch.sourceUrl), `${epoch.id}: missing provenance URL`);
    assert(Number.isFinite(epoch.bearing), `${epoch.id}: invalid reading bearing`);
    validateRender(epoch.render, epoch.id);
  }
  assert(
    Object.keys(items).every((id) => usedItems.has(id)),
    "Unreferenced STAC Item in raster registry",
  );
  const itemIds = Object.values(items).map((item) => (item as { id: string }).id);
  assert(new Set(itemIds).size === itemIds.length, "Duplicate STAC delivery directory");
}
