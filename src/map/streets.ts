import type { StyleSpecification } from "maplibre-gl";

/** Display tiles are shared with the basemap; editable reference networks need raw OSM snapshots. */
export const STREET_SOURCE_URL = "https://tiles.openfreemap.org/planet";

export type StreetColors = { line: string; text: string; halo: string };

export function streetStyle(colors: StreetColors): StyleSpecification {
  const roads = [
    "motorway",
    "trunk",
    "primary",
    "secondary",
    "tertiary",
    "minor",
    "service",
    "track",
    "path",
  ];
  return {
    version: 8,
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: { streets: { type: "vector", url: STREET_SOURCE_URL } },
    layers: [
      {
        id: "street-halo",
        type: "line",
        source: "streets",
        "source-layer": "transportation",
        filter: [
          "all",
          ["==", ["geometry-type"], "LineString"],
          ["match", ["get", "class"], roads, true, false],
        ],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": colors.halo,
          "line-opacity": 1,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 2, 16, 3.6, 19, 5],
        },
      },
      {
        id: "street-line",
        type: "line",
        source: "streets",
        "source-layer": "transportation",
        filter: [
          "all",
          ["==", ["geometry-type"], "LineString"],
          ["match", ["get", "class"], roads, true, false],
        ],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": colors.line,
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 0.6, 16, 1.2, 19, 2],
        },
      },
      {
        id: "street-name",
        type: "symbol",
        source: "streets",
        "source-layer": "transportation_name",
        minzoom: 13,
        filter: ["all", ["has", "name"], ["match", ["get", "class"], roads, true, false]],
        layout: {
          "symbol-placement": "line",
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 13, 11, 17, 13],
          "text-padding": 4,
        },
        paint: {
          "text-color": colors.text,
          "text-halo-color": colors.halo,
          "text-halo-width": 2,
        },
      },
    ],
  };
}
