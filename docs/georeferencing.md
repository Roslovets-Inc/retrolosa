# Map preparation boundary

The browser editor and all map-generation scripts have moved to the independent `retrolosa-georeferencer` project (locally `D:/PROJECTS/retrolosa-georeferencer`). Run `bun run dev` there; the editor remains at port 5175. This application has no editor or Python preparation dependency.

## Preserved source records

- `data/map-sources/`: immutable original scans and figures. Public copies remain for existing source links.
- `data/georeferencing/`: current annotation projects and latest GDAL reports.
- Other `data/*control-points.json`, baselines and reports: historical preparation evidence.
- `public/` plus `data/stac/`: reviewed delivery assets consumed by the site.

The current 1860 project is `data/georeferencing/jourdan-1860.json`, approved revision `2026-10-06-streets-01` (based on approved `2026-10-02-user-02`). The new editor includes an independent snapshot for demonstration; there is no automatic synchronization between repositories.

## Import a reviewed result

1. Export the edited project from the standalone editor and generate/review the raster there.
2. Preserve the original, project and report in this repository's source records.
3. Copy the reviewed WebP and STAC Item into the locations defined by the [raster contract](raster-contract.md). Increment the revision and verify the image hash.
4. Run `bun run maps:validate <path/to/item.json>` on the colocated delivery package, `bun run maps:list`, `bun run check` and relevant browser tests.

The site imports prepared pixels; it does not warp an annotation project. See [map integration](map-integration.md).

Keep one current project and report per map. Version accepted changes in Git together with the delivery update; do not create manual revision folders or commit generated previews. The STAC Item is the authoritative delivery metadata.
