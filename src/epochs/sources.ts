import type {
  RasterLayerSpecification,
  SourceSpecification,
  StyleSpecification,
} from "maplibre-gl";

import { EPOCHS, getEpoch } from "./catalog";
import type { EpochId } from "./catalog";
import type { ArchiveRender, ImageRender, TileRender } from "./types";

export interface AssetContext {
  baseUrl: string;
  origin: string;
}
export function epochLayerIds(id: EpochId): string[] {
  const epoch = getEpoch(id);
  return epoch.render.kind === "overview" ? [`overview-${id}`, `history-${id}`] : [`history-${id}`];
}

function source(
  render: ImageRender | TileRender | ArchiveRender,
  attribution: string,
  assets: AssetContext,
): SourceSpecification {
  if (render.kind === "image")
    return {
      type: "image",
      url: `${assets.baseUrl}${render.path}`,
      coordinates: render.coordinates,
    };
  if (render.kind === "archive")
    return { type: "raster", url: render.url, tileSize: 256, attribution };
  return {
    type: "raster",
    tileSize: 256,
    attribution,
    tiles: render.tiles.map((tile) =>
      render.local ? `${assets.origin}${assets.baseUrl}${tile}` : tile,
    ),
    ...(render.minzoom === undefined ? {} : { minzoom: render.minzoom }),
    ...(render.maxzoom === undefined ? {} : { maxzoom: render.maxzoom }),
    ...(render.bounds === undefined ? {} : { bounds: render.bounds }),
  };
}

export function historicalStyle(
  opacities: Readonly<Partial<Record<EpochId, number>>>,
  assets: AssetContext,
): StyleSpecification {
  const style: StyleSpecification = { version: 8, sources: {}, layers: [] };
  for (const epoch of EPOCHS) {
    const render = epoch.render;
    const add = (
      id: string,
      data: ImageRender | TileRender | ArchiveRender,
      limits: { minzoom?: number; maxzoom?: number } = {},
    ) => {
      style.sources[id] = source(data, epoch.attribution, assets);
      const layer: RasterLayerSpecification = {
        id,
        type: "raster",
        source: id,
        ...limits,
        paint: {
          "raster-opacity": opacities[epoch.id] ?? 0,
          "raster-opacity-transition": { duration: 0 },
          "raster-fade-duration": 0,
        },
      };
      style.layers.push(layer);
    };
    if (render.kind === "overview") {
      add(`overview-${epoch.id}`, render.image, { maxzoom: render.switchZoom });
      add(`history-${epoch.id}`, render.detail, { minzoom: render.switchZoom });
    } else add(`history-${epoch.id}`, render);
  }
  return style;
}

/** Only the contributing sheets at this zoom need sources or network requests. */
export function activeHistoricalStyle(
  opacities: Readonly<Partial<Record<EpochId, number>>>,
  assets: AssetContext,
  zoom: number,
): StyleSpecification {
  const style = historicalStyle(opacities, assets);
  style.layers = style.layers.filter(
    (layer) =>
      layer.type === "raster" &&
      Number(layer.paint?.["raster-opacity"]) > 0 &&
      (layer.minzoom === undefined || zoom >= layer.minzoom) &&
      (layer.maxzoom === undefined || zoom < layer.maxzoom),
  );
  const sources = new Set(
    style.layers.flatMap((layer) => ("source" in layer ? [layer.source] : [])),
  );
  style.sources = Object.fromEntries(
    Object.entries(style.sources).filter(([id]) => sources.has(id)),
  );
  return style;
}
