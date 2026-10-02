import type {
  RasterLayerSpecification,
  SourceSpecification,
  StyleSpecification,
} from "maplibre-gl";

import { EPOCHS, getEpoch } from "./catalog";
import type { EpochId } from "./catalog";
import type { ImageRender, TileRender } from "./types";

export interface AssetContext {
  baseUrl: string;
  origin: string;
}
export function epochLayerIds(id: EpochId): string[] {
  const epoch = getEpoch(id);
  return epoch.render.kind === "tiles" && epoch.render.overview
    ? [`overview-${id}`, `history-${id}`]
    : [`history-${id}`];
}

function source(
  render: ImageRender | TileRender,
  attribution: string,
  assets: AssetContext,
): SourceSpecification {
  if (render.kind === "image")
    return {
      type: "image",
      url: `${assets.baseUrl}${render.path}`,
      coordinates: render.coordinates,
    };
  const delivery = render.source;
  return {
    type: "raster",
    tileSize: 256,
    attribution,
    ...(delivery.type === "pmtiles"
      ? { url: delivery.url }
      : {
          tiles: delivery.tiles.map((tile) =>
            delivery.local ? `${assets.origin}${assets.baseUrl}${tile}` : tile,
          ),
        }),
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
      data: ImageRender | TileRender,
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
    if (render.kind === "tiles" && render.overview) {
      add(`overview-${epoch.id}`, render.overview.image, { maxzoom: render.overview.switchZoom });
      add(`history-${epoch.id}`, render, { minzoom: render.overview.switchZoom });
    } else add(`history-${epoch.id}`, render);
  }
  return style;
}

/** Install contributing sheets and a bounded set of transparent neighbours at this zoom. */
export function activeHistoricalStyle(
  opacities: Readonly<Partial<Record<EpochId, number>>>,
  assets: AssetContext,
  zoom: number,
  prepared: readonly EpochId[] = [],
): StyleSpecification {
  const style = historicalStyle(opacities, assets);
  style.layers = style.layers.filter(
    (layer) =>
      layer.type === "raster" &&
      (Number(layer.paint?.["raster-opacity"]) > 0 ||
        prepared.includes(layer.source.split("-").at(-1) as EpochId)) &&
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
