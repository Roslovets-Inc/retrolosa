# Prepared raster contract v1

## Preparation is external (2026-10-02)

The editor and raster-generation scripts live in the independent `retrolosa-georeferencer` repository. Preparation commands in historical notes below must run there. This site only imports prepared materials and validates delivery packages. Original scans are preserved in `data/map-sources/`; editable projects and current reports remain in `data/georeferencing/`. See [preparation boundary](georeferencing.md).

The delivery boundary between preparation and Retrolosa is two colocated files:
`item.json` (STAC Item 1.1.0 with Projection 2.0.0) and `map.webp`. The 1860 map
delivers this contract at `jourdan-1860/`. Its canonical Item is
`data/stac/jourdan-1860.item.json`; `raster-assets.config.ts` serves/emits that
same file beside `public/jourdan-1860/map.webp`, without a second editable copy.
All eleven image and overview sources now follow this contract through
`src/epochs/raster-items.ts`.
Tile services and PMTiles retain their existing rendering contracts.

## Display asset

`assets.display` contains a relative `href`, `type: image/webp`, the `visual` role,
`proj:code: EPSG:3857`, `proj:shape: [height, width]` and a six-number
`proj:transform: [a, b, c, d, e, f]`. Pixel-edge coordinates map to projected metres:
`X = a*x + b*y + c`, `Y = d*x + e*y + f`.
The profile requires north-up grids: `a > 0`, `e < 0`, `b = d = 0`.
The transform covers the complete raster including transparent margins. The
image has an alpha channel; pixels without source data are transparent.
Do not infer the raster grid from the footprint or swap width and height.

STAC `geometry` and `bbox` describe the geographic coverage in longitude/latitude.
The packager uses the full rectangular raster extent, including its transparent
margin. Rendering uses the projection grid, not the footprint. Keep both consistent.
Relative image addresses resolve against the Item location. The v1 website
profile accepts local assets without query strings or fragments; its adapter adds
the revision query and the existing source builder applies the deployment base.

## Metadata and dates

Use standard STAC fields for title, description, dates and provenance links.
Additional properties are allowed. The local profile defines:

| Property                    | Meaning                                                                 |
| --------------------------- | ----------------------------------------------------------------------- |
| `retrolosa:raster_contract` | Required integer `1`                                                    |
| `retrolosa:revision`        | Required nonempty revision; changes whenever the display raster changes |
| `retrolosa:raster_sha256`   | Required SHA-256 of the delivered WebP bytes                            |
| `retrolosa:date_precision`  | Required `day`, `year`, `approximate-year` or `interval`                |
| `retrolosa:fit_point_count` | Optional number of fitting landmarks                                    |
| `retrolosa:check_points`    | Optional manual diagnostics: name and errorMetres; not survey accuracy  |

For a year, use `datetime: null` and start/end timestamps enclosing that year.
For approximately dated maps, mark `approximate-year`: that interval is the
nominal catalogue year, not a claim that the historical uncertainty is bounded
by its first and last day. Preserve the approximate wording in descriptions.
Never invent a survey day or infer the map date from file timestamps.
Epoch ordering, reading bearing, translated descriptions and painter order remain
in the application catalogue/lazy content. STAC does not replace the editor project.

## Preparation and delivery

In the standalone `retrolosa-georeferencer` repository, run `bun run georef:warp`.
Then package its matching GeoTIFF and WebP with descriptive metadata. The following
commands and example description path belong to that preparation repository:

```sh
bun run georef:package --tif .local/georef-output/map.tif --webp .local/georef-output/map.webp --description data/georeferencing/jourdan-1860-description.json --out .local/raster-package
bun run georef:validate .local/raster-package/item.json
```

The description input supplies `id`, `properties` and `links`; the standalone tool's
1860 description is an example, not a template to reuse unchanged for another map.
Refresh its revision, dates and optional check report when preparing a new result.
The packager reads the TIFF grid, checks CRS, orientation, dimensions and alpha,
and copies WebP bytes without re-encoding. Supply TIFF/WebP from the same warp:
matching dimensions alone cannot establish that unrelated images depict the same grid.
It writes only to a separate output directory. The validator checks official STAC,
Projection and local schemas, rendering invariants and the image hash offline.

Keep the validated Item under `data/stac/` and its image under `public/`.
Register the Item in `src/epochs/raster-items.ts` and select it from
`src/epochs/catalog.ts`. The Vite plugin automatically delivers registered Items
at `<item.id>/item.json`. The built output contains the portable
two-file pair; validate it with `bun run maps:validate dist/jourdan-1860/item.json`.
Keep original scans, point projects, reports and GeoTIFF in preparation storage.
They are not needed by the viewer. Ordinary builds never generate imagery.

## Integration and verification

`src/epochs/stac.ts` converts the four raster edge corners to longitude/latitude
once during catalogue initialization. MapLibre rendering and controller lifecycle
are unchanged. Unsupported grids fail explicitly; arbitrary input projections
must be reprojected during preparation, not by merely converting their corners.

The 1860 migration preserves revision `2026-10-02-user-02` and identical WebP
bytes. Its preceding custom metadata is archived with that revision, solely as
a regression reference. Tests compare all corners within 1e-10 degrees, the
image hash, manual diagnostics and deployment-prefixed URLs. Browser checks load
the actual local image and exercise the source panel and shared selection.

`data/stac/raster-v1.schema.json` is a local application profile, not a published
STAC extension. Only the official Projection URL is listed in `stac_extensions`.
Custom prefixed properties are valid without claiming a registered extension.

References: [STAC Item 1.1.0](https://github.com/radiantearth/stac-spec/blob/v1.1.0/item-spec/item-spec.md),
[Projection 2.0.0](https://github.com/stac-extensions/projection/tree/v2.0.0).

## Complete image migration

Eleven epochs have STAC display assets: 450, 1195, 1250, 1550, 1631, 1680,
1777, 1830, 1860, 1875 and 1904. Each is a north-up WebP in EPSG:3857.
The 1631/1875 overviews still switch to local tiles at zoom 14; the 1680/1830
overviews still switch to remote PMTiles at zoom 15. The 1848 and 1954 epochs
are tile-only services, outside this prepared-image contract. Camera reading
bearings remain catalogue metadata and are independent of raster grid rotation.

`data/stac/migration-inputs.json` freezes the ten pre-migration image hashes,
four geographic corners, dates and descriptive metadata. Their existing files
remain intact as reproducible preparation inputs and for old direct URLs.
`data/stac/migration-report.json` records normalization transforms, output hashes,
corner closure error and alpha coverage. Run explicitly:

```sh
bun run georef:migrate --out .local/stac-migration
```

The command stages packages without changing inputs or website assets. It refuses
changed source hashes and non-affine corner frames. Review changed inputs rather
than using a stale inventory after regenerating a legacy map. For new maps, prefer
`georef:warp` and `georef:package` instead of the legacy migration command.

Five former rotated grids (450, 1250, 1550, 1777, 1904) were resampled with GDAL
bilinear interpolation into north-up `display.webp` derivatives. The finest
principal-axis source resolution is retained, and the full transformed rectangle
fits inside the output. Encoding is lossless after this necessary resampling;
this does not mean the interpolated pixels are identical to the originals.
Alpha-weighted coverage changes are under 0.001% in the recorded run. These are
conversion checks, not new historical georeferencing accuracy measurements.
Two PNG cadastral overviews were converted losslessly. Other WebP bytes, including
the manually corrected 1860 image, remain identical. Fully opaque WebP images may
omit an explicit alpha channel; missing image areas must still be transparent.

Translated descriptions read their diagnostic fields from STAC. The historical
`src/*.json` preparation metadata is retained for legacy generators and regression
baselines; the catalogue and source details no longer import it for these images.
Ordinary builds only package metadata and copy prepared assets. They never warp.

Unit tests validate every Item against offline official schemas and the profile,
match display bytes to hashes, check original input integrity and full geographic
coverage, and retain the 1860 approval regression. `tests/raster-import.spec.ts`
loads all eleven real local images and their served STAC Items with external
providers simulated. Existing detail-source protocols and zoom boundaries are
covered by catalogue and view tests.
