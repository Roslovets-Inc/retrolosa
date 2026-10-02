# Map catalogue and integration guide

## Preparation is external (2026-10-02)

The editor and raster-generation scripts live in the independent `retrolosa-georeferencer` repository. Preparation commands in historical notes below must run there. This site only imports prepared materials and validates delivery packages. Original scans are preserved in `data/map-sources/`; editable projects and current reports remain in `data/georeferencing/`. See [preparation boundary](georeferencing.md).

Start here when adding a map manually or with an AI agent. The single historical
catalogue is `src/epochs/catalog.ts` (`EPOCHS`), covering all thirteen epochs.
There are exactly two integration types: **image** and **tiles**.
Run `bun run maps:list` to audit the catalogue and list each map's integration.

## Choose one of two inputs

| Type    | Input                                                                             | Current use                             |
| ------- | --------------------------------------------------------------------------------- | --------------------------------------- |
| `image` | STAC Item + prepared WebP, north-up EPSG:3857                                     | 450, 1195, 1250, 1550, 1777, 1860, 1904 |
| `tiles` | Raster tile delivery configuration, bounds and zoom range; optional STAC overview | 1631, 1680, 1830, 1848, 1875, 1954      |

For tiles, `source` selects delivery rather than introducing another map type:

- `type: "template"`: local or remote URL templates with `{z}`, `{x}`, `{y}`.
  Local templates are application-relative and set `local: true`. Remote ones
  use HTTP(S). The existing IGN 1954 WMTS has compatible matrix numbering.
- `type: "pmtiles"`: remote raster PMTiles, addressed as `pmtiles://https://...`.
- The existing `etat-major://` template is handled by the registered internal
  processing adapter. It is not a separate user-facing import type.

`overview: { image, switchZoom }` is optional on any tile map. Below the threshold
we display the STAC image; at/above it we display the tiles. Current 1631/1875
maps switch at zoom 14; 1680/1830 at zoom 15. There are no `archive` or `overview`
render kinds. Local and remote delivery share one tile integration.

STAC/Projection, PMTiles and WMTS are external specifications. Our typed catalogue,
two render variants, raster profile and overview policy are application contracts.
The tile configuration uses MapLibre/TileJSON-style fields; it is not a full
TileJSON document or a generic TileJSON URL importer.

Tiles currently use 256 px Web Mercator XYZ-compatible grids. Arbitrary WMTS
matrices, inverted TMS rows, WMS, vector PMTiles, 512 px tiles and arbitrary CRS
rasters require preparation or an explicit adapter; replacing a URL is insufficient.
Remote delivery needs CORS; PMTiles also needs HTTP byte-range support.
The current-day vector basemap remains a themed OpenFreeMap MapLibre style in
`src/map/styles.ts`, separate from historical catalogue imports.

## Integration points

| Concern                                                       | Owner                                                      |
| ------------------------------------------------------------- | ---------------------------------------------------------- |
| Stable epoch ID, labels, credits, bearing, image/tiles choice | `src/epochs/catalog.ts`                                    |
| Two typed variants                                            | `src/epochs/types.ts`                                      |
| Registration and format audit                                 | `src/epochs/catalog-contract.ts`                           |
| Image packages                                                | `src/epochs/raster-items.ts`, `data/stac/*.item.json`      |
| STAC grid reader                                              | `src/epochs/stac.ts`                                       |
| Serving/emitting STAC Items beside WebP                       | `raster-assets.config.ts`                                  |
| Delivery adapters to MapLibre                                 | `src/epochs/sources.ts`                                    |
| Descriptions, limitations, document links                     | Lazy `src/epochs/details.ts`, `src/locales/sources-*.json` |
| Protocol registration and lifecycle                           | `src/map/runtime.ts`, `src/map/controller.ts`              |

Adding a map through these inputs needs no UI or controller changes. Keep the
original scans, point projects and GeoTIFFs in preparation storage. Do not import
legacy corner metadata directly into the website for new images.

## Add a map

1. Establish provenance, reuse terms, represented period and alignment limitations.
2. Choose `image` or `tiles`. For an image, prepare the pair described in
   [raster-contract.md](raster-contract.md), put its Item in `data/stac/` and its
   WebP under `public/<item-id>/`. Register the Item in `raster-items.ts` using
   a JSON import with `with { type: "json" }`; delivery is automatic.
3. Add an epoch in chronological order in `catalog.ts`, using the helpers below.
   Required common fields: `id`, `label`, `optionLabel`, `category`, `credit`,
   `sourceUrl`, `attribution`, `bearing`. Preserve existing shared IDs.
4. Add lazy descriptions and EN/FR/RU translations. Keep the distinction between
   represented historical dates, approximate dating and image production dates.
5. Validate and inspect using the commands below.

The ID is a stable numeric timeline anchor, not necessarily an exact date. The
current timeline supports one entry per anchor; multiple maps with the same anchor
require a separate product decision. Reading bearing is camera orientation and
is independent of the prepared image's north-up raster grid.

Examples of the `render` field after registering an example image under `"1800"`:

```ts
// Image.
render: raster("1800");

// Local tiles with an optional small overview image.
render: tiles(
  { type: "template", local: true, tiles: ["example/{z}/{x}/{y}.webp?v=1"] },
  {
    minzoom: 14,
    maxzoom: 17,
    bounds: [1.4, 43.56, 1.49, 43.64],
    overview: { image: raster("1800"), switchZoom: 14 },
  },
);

// Same tile type, delivered from a raster PMTiles archive.
render: tiles({ type: "pmtiles", url: "pmtiles://https://example.org/map.pmtiles" });
```

The helpers return `ImageRender` and `TileRender`. Bounds use west/south/east/north
in degrees. Zoom limits describe source availability, not maximum camera zoom.
An overview and its tiles must depict the same coverage and alignment.
New processing protocols require explicit runtime registration, audit support,
cancellation, bounded caches and failure/retry tests; they are not arbitrary URLs.

## Validation

```sh
bun run maps:list
bun run check
bun run build
bun run maps:validate dist/<item-id>/item.json
bun run test:e2e tests/raster-import.spec.ts
```

The last two commands apply to image packages, including tile overviews. For a new
tile source add a browser scenario covering its template and zoom boundary. Check
source information, translations, phone layout, opacity and shared links. External
provider availability must be tested separately from simulated/offline scenarios.

The catalogue audit rejects duplicate/unordered IDs, missing credits, missing or
unused STAC registrations, mismatched image definitions, unsupported delivery,
bad tile templates and zoom ranges, and overview/detail gaps. STAC schema/hash
checks remain in the package validator and unit tests. These checks do not certify
historical accuracy, remote availability or the contents of an external archive.
Ordinary integration does not regenerate imagery or publish the site.

References: [MapLibre sources](https://maplibre.org/maplibre-style-spec/sources/),
[TileJSON](https://github.com/mapbox/tilejson-spec),
[PMTiles](https://docs.protomaps.com/pmtiles/).
