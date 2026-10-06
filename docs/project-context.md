# Project context for a new session

## Preparation is external (2026-10-02)

Post-extraction cleanup removed the duplicate preparation-tool archive, old editor
build and empty tool directory. Original scans, annotation projects, current reports and prepared delivery assets remain preserved. `debug.log` is ignored.

The editor and raster-generation scripts live in the independent `retrolosa-georeferencer` repository. Preparation commands in historical notes below must run there. This site only imports prepared materials and validates delivery packages. Original scans are preserved in `data/map-sources/`; editable projects and current reports remain in `data/georeferencing/`. See [preparation boundary](georeferencing.md).

Current catalogue contract: `image | tiles`. Former `archive` and `overview`
variants have been replaced by tile `source` delivery and optional `overview`.
MapLibre source definitions, layer IDs and zoom boundaries are preserved.
See [map-integration.md](map-integration.md) for the current authoring API.

Map integration starts with the [catalogue and integration guide](map-integration.md).
`src/epochs/catalog.ts` is the single historical catalogue; `bun run maps:list`
audits and lists every integration. The typed render contract has exactly two variants: `image` and `tiles`.
Tile delivery selects templates or PMTiles; an optional `overview` supplies a
STAC image below a zoom threshold. The Etat-major adapter remains internal. The current-day basemap remains a MapLibre style.

## All prepared images use STAC (2026-10-02)

All eleven image/overview sources now use `src/epochs/raster-items.ts` and
`readStacRaster`. `raster-assets.config.ts` serves/emits each Item next to its
WebP. Tile-only IGN sources and detail tiles/PMTiles keep their existing protocols.
Five legacy rotated/sheared images have explicit north-up `display.webp`
derivatives; two cadastral PNG overviews have lossless WebP derivatives.
Legacy preparation images and their metadata remain inputs, not viewer imports.
The 1860 user-02 raster is unchanged. See [raster-contract.md](raster-contract.md)
for the migration inventory, reproducible command and validation boundaries.
This supersedes the earlier 1860-only migration notes below.

## Current 1860 source and delivery

The current map is approved revision `2026-10-06-streets-01`, prepared from
the approved `2026-10-02-user-02` baseline with Rue du Taur correspondences. Its editable source is
`data/georeferencing/jourdan-1860.json`; its latest GDAL report is
`data/georeferencing/jourdan-1860-report.json`. Preserve the original scan in
`data/map-sources/jourdan-1860/original.jpg`. The site consumes only
`public/jourdan-1860/map.webp` and `data/stac/jourdan-1860.item.json`.
There are 75 fit points and 32 withheld checks; check RMSE is 15.17 m.
The same 29 inherited checks change from 15.62 m to 15.70 m RMSE; this revision
does not establish an overall accuracy improvement. Esquile remains unresolved
and is excluded from fitting. The tracing and comparison are preserved in
`data/georeferencing/jourdan-1860-street-tracing.json` and
`data/georeferencing/jourdan-1860-comparison.json`. The user accepted the visual alignment against the street overlay on 2026-10-06.
Local regressions at Notre-Dame du Taur and other checks remain recorded.
The approved baseline remains in Git; a local rollback copy is also in
`.local/1860-before-street-review/`. Publication has not been requested.
This measures consistency with manual annotations, not survey accuracy.
Historical revision folders, duplicate previews and obsolete metadata have been
removed. Use Git for future history; commit current source records with each
accepted delivery update. No commit is implied by this cleanup.

## Product and scope

The current public name is **Rétrolosa**, and the package name is `retrolosa`.
The repository has historically been named `toulouse-in-time`. These names and
the local directory name are independent. The app is a static English/French/Russian
map of Toulouse, built with React, TypeScript, Vite, MapLibre, Radix and PMTiles.
There is no application backend or database to migrate.

The places dropdown opens navigation commands directly from the header and
focuses on six major central landmarks and an overview.
Camera rotation persists while scrubbing or changing enabled epochs. The compass
can reset a rotated view to north on any sheet and disables only when both the
camera and the dominant sheet are north-aligned.
Two enabled historical neighbours on each side are prepared in advance, up to
six sheets during a crossfade. Invisible neighbours do not block visible readiness
or contribute credits; the current endpoint retains the last two historical sheets.
Navigation allows zoom 10.5–19 within [1.18, 43.38]–[1.70, 43.86], leaving room
to view wider historical sheets. These camera bounds do not change source coverage.

The app is also installable on iPhone/iPad and Android. `pwa.config.ts` generates
deployment-scoped manifest/service-worker files; `src/pwa.ts` and
`src/components/InstallApp.tsx` handle registration and the localized installation
guide. Icons in `public/icons/` derive from the existing Occitan-cross brand mark.
The production worker caches only the application shell, fonts and icons; maps
still need Internet access. It is disabled in development and never forces a
reload during exploration. Run `bun run build` followed by
`bun run test:e2e --config playwright.pwa.config.ts` for production-worker checks;
retain `VITE_BASE_PATH` for both when testing a prefixed deployment. Physical
iPhone/Android installation remains a separate verification step.

English is the primary development language for project documentation, including
README, code comments and commit messages. The website interface, user-facing
content and accessibility labels support English, French and Russian. Browser language determines
the initial selection, English is the fallback, and the header saves manual choices
through a styled Radix Select with keyboard navigation and theme-aware options.
Keep original source titles, proper names and quoted UI labels when needed for identification.

The catalogue covers thirteen historical epochs: 450, 1195, 1250, 1550, 1631, 1680,
1777, 1830, 1848, 1860, 1875, 1904 and 1954, followed by the current basemap.
Some dates represent modern scholarly reconstructions, not contemporary surveys.
The XII-century layer (`1195`) combines three disconnected fragments: Saint-Sernin
borough growth, selected Romanesque Saint-Étienne features and an approximately
placed Narbonnais castle. Undocumented gaps remain transparent.
Saint-Pierre-des-Cuisines (figure 3) adds XII-century building-phase detail inside
the borough, replacing its coarse church symbol with separately aligned red/light-green
phases. Yellow 1050, teal Late Middle Ages and grey later features are excluded.
1195 is an ordering anchor. Full originals and legends are linked; castle placement has no independent
survey validation. Run `scripts/build-openedition-12c.py` followed by
`scripts/compose-openedition-12c.py` for explicit regeneration. See
`docs/openedition-medieval-layers.md` for checks, masks and remaining work.
Source accuracy and licensing limitations are documented in [sources.md](sources.md)
and [licensing.md](licensing.md). Do not infer accuracy from alignment alone.

The 1860 sheet was locally refined on 2026-10-02 around Parlement / the former
Carmelite block, Brienne / Bazacle, Saint-Aubin and Belfort / Bayard / Jean-Jaures.
Its 75 fitting points and 32 withheld checks are in `data/jourdan-1860-control-points.json`; the previous
40-anchor field is frozen in `data/jourdan-1860-local-baseline.json` for reproducible
comparison. The corrected Riquet / Colombette junction replaces a misidentification.
Pont des Minimes also replaces an original annotation east along the canal
with the actual bridge crossing; its modern reference centre remains unchanged.
The Arnaud-Bernard refinement corrects a misplaced Lascrosses boulevard anchor
and adds five fitting junctions and three withheld observations northwest of
Saint-Sernin. The square retains a larger residual and individual checks can worsen.
Four subsequent anchors constrain Saint-Julien, Salenques and Peyrou, including
the southern Puits-Creuses / Albert-Lautman junction. Two new withheld checks
average 59.2 m before and 18.7 m after against the frozen 40-anchor field.
The Strasbourg continuation adds five fits and three withheld checks. Former
Saint-Loup is matched to Moutons, resolving the western Bayard candidate.
Two close Henri-Beraldi observations use smoothing 500 instead of 4 to keep
the minimum inverse Jacobian above 0.3 near Saint-Sernin.
Terre-Cabade adds the preserved main gate, southwest corner and two approach
junctions. A withheld Saint-Paul junction improves from 159.2 m to 4.1 m against
the frozen 40-anchor field. Later cemetery extensions and the unidentified central
monument symbol are not fitting observations.
Rejected later street cuts and the non-comparable Sabots / Feuga plaza junction
remain recorded. Local independent errors improve, but some existing individual
checks worsen; see the measurements and limits in [sources.md](sources.md).
Explicitly regenerate only this sheet with
`python scripts/build-city-plans.py --plan jourdan-1860` (numpy, scipy, Pillow).
The raster revision in its metadata invalidates cached images. Normal builds do
not regenerate imagery or alter other epochs.
Validation passed `bun run check` (159 unit tests), `bun run build`, and both
`tests/city-plans.spec.ts` browser scenarios, using real local rasters with remote
providers disabled. These checks verify complete sheets, mobile selection,
sources and sharing; the separate generator report evaluates geographic alignment.

The same timeline works with overlay, curtain and loupe. It skips unchecked
epochs and uses evenly spaced historical ticks, with extra room before the present
label. Calendar-year interpolation remains linear within each interval. It
preserves the calendar year when comparison tools change, and snaps
pointer input near source dates. Camera, theme, location, population and curated
events are part of the experience. Sharing explicitly creates an address;
ordinary interactions do not continuously rewrite the URL.

## Where to change things

The preparation editor was extracted to `retrolosa-georeferencer` on 2026-10-02.
Run `bun run dev` and `bun run build` in that independent repository. The site
has no Leaflet or Python preparation dependency. Its source scans, annotation
projects and current reports remain here; the new editor includes a separate
approved user-02 example snapshot. See [georeferencing.md](georeferencing.md).

Mobile layout uses a viewport-fixed application with maps continuing beneath
the footer safe area. The population card sits just below the header, with
milestones always visible on phones as on desktop. The shared timeline keeps
its current-date announcement screen-reader-only, shows every enabled date in
two rows on narrow screens, and highlights selected dates at every width.
See `tests/mobile-layout.spec.ts` for viewport and non-overlap checks.

| Area                                                   | Entry points                                                     |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| Epochs and rendering variants                          | `src/epochs/catalog.ts`, `types.ts`, `sources.ts`                |
| Source descriptions                                    | `src/epochs/details.ts`, lazy `src/components/SourcesDialog.tsx` |
| Persistent view and legacy URL compatibility           | `src/view/state.ts`                                              |
| Blending, credits, orientation and prepared neighbours | `src/view/presentation.ts`, `src/timeline.ts`                    |
| Application composition                                | `src/main.tsx`, `src/components/`                                |
| Renderers and required-resource status                 | `src/map/controller.ts`, `loading.ts`, `useMaps.ts`              |
| Map protocols and workers                              | `src/map/runtime.ts`, `src/etat-major.ts`, `src/etat-major/`     |
| Theme and optional geolocation                         | `src/theme.ts`, `public/theme-init.js`, `src/useLocation.ts`     |
| UI primitives and styles                               | `src/ui.tsx`, `src/style.css` and its four imported stylesheets  |
| Population and milestones                              | `src/population.ts`, `src/city-events.ts`, `src/CityWidget.tsx`  |
| Georeferencing inputs and generated outputs            | `data/`, `scripts/`, `src/*.json`, `public/`                     |

Keep view calculations pure. The controller owns MapLibre lifecycle; UI receives
commands and data. Historical crossfades keep the older sheet opaque and fade
the newer sheet over it. Adjacent enabled epochs stay prepared with exactly zero
opacity when invisible; readiness and credits consider only contributing sources.
Removing a neighbour at a snapped date reintroduces a noticeable scrubbing delay.

The IGN worker shares downloads with bounded concurrency and a bounded Blob LRU.
Cancellation must respect other consumers, and disposal must release workers,
listeners and bitmaps. The cache budget does not bound all transient rendering memory.
`idle` does not clear failed requests. Closing an error keeps a retry command.
WebGL loss is separate from network failure, and MapLibre handles context restoration.
The sources dialog has a static shell and a local error boundary; recovery reloads
the app after serializing the current view and camera.

## Verification and handoff baseline

On 2026-10-01 the architecture refactoring and its reported regressions were
completed. The latest implementation checkpoint is commit `f2fc375` (prepared
neighbours); `26377cc` covers map retry/WebGL recovery and `ea8796f` covers the
lazy sources failure boundary. These are historical checkpoints, not a branch
or absolute path that a new session should assume.

The latest implementation passed `bun run check` with 147 unit tests and
`bun run build`. Eleven browser scenarios in `map-loading`, `compact`,
`source-loading` and `orientation` passed. The neighbour scenario was subsequently
checked with the mouse held down across snapped dates. The user also manually
confirmed general functionality before reporting the scrubbing regression.
This is a dated baseline, not proof that later edits or real providers still work.

Use the smallest relevant set, for example:

```sh
bun run check
bun run test:e2e tests/map-loading.spec.ts tests/source-loading.spec.ts tests/compact.spec.ts
```

The above browser scenarios simulate external map providers. `tests/ui.ts`
provides `prepareOfflineMaps` and `waitForApp`; simulated responses do not validate
real IGN, OpenFreeMap or PMTiles availability. Other scenarios, including some
État-major checks, use real services. Report provider failures separately.
`bun run verify` runs the full browser suite and can require Internet.

Run Playwright commands sequentially to avoid collisions in shared reports.
Finish an E2E run before editing app code: Vite hot reload can interrupt a gesture.
Do not stop an existing server without determining whether it belongs to your work.
Use `PLAYWRIGHT_PORT` for another checkout/server when necessary.
Coverage thresholds apply only to `src/timeline.ts` and `src/view/**/*.ts`.

No confirmed issue from the final architecture audit remains open. Further work
is to validate real services separately, measure rendering latency and memory on
mobile hardware, and continue the source research in [map-backlog.md](map-backlog.md).
The need for a new optimization must come from measurements. Source-rights
uncertainties remain documented; software refactoring does not resolve them.

## Moving the checkout

1. Stop processes you started before moving their working directory. Preserve
   uncommitted and untracked work; inspect Git status first.
2. Move the complete checkout, including `.git`, to retain local commits and
   history. A new clone contains only commits available from its remote, not
   unpublished local commits. This documentation task does not itself push them.
3. Keep `.local/` separately if original scans or manual investigation artifacts
   are needed. It is ignored by Git and is not required for normal builds.
   Some explicit raster generators require originals there and cannot be
   reproduced from a fresh clone alone. Check their inputs before running them.
4. In the destination, open the repository root and run
   `bun install --frozen-lockfile`, then `bun run check` and `bun run build`.
   Reinstall dependencies if the operating system or runtime changes. Generated
   reports and `dist/` can be recreated; raster generation is a separate operation.
5. Update editor/Codex project paths and any external local shortcuts. Discover
   the new checkout in the new session instead of copying an old drive path.

No tracked application/configuration file was found to depend on the previous
absolute Windows checkout path. Scripts use the repository root or relative
paths. Run standard Bun commands from that root.

## Renaming without losing compatibility

A local folder rename does not require renaming the product or epoch assets.
If the product or GitHub repository is renamed later, review the relevant scope:

- Product identity: `package.json`, `index.html`, `src/components/Header.tsx`,
  `README.md`, `docs/licensing.md`, `docs/style-guide.html`, and name assertions
  in `tests/pages.spec.ts` and `tests/tooltips.spec.ts`. Keep author and license
  notices intact. Update `bun.lock` through Bun if its package metadata changes.
- Theme persistence: `retrolosa-theme` is read both by `src/theme.ts` and
  `public/theme-init.js`. Keep it for preference compatibility, or explicitly
  migrate it in both places. The theme-change event is separate from the folder name.
- GitHub identity: inspect Git remotes and update the source repository link in
  `docs/licensing.md` if the remote changes. Do not bulk-replace third-party map
  addresses, historical asset filenames or documented source credits.
- Pages base path: the workflow gets it from `actions/configure-pages`; Vite
  reads `VITE_BASE_PATH`, defaulting to `/`. Use the new repository path rather
  than embedding a folder name into app code. The non-root paths in
  `tests/unit/epochs.test.ts` are fixtures testing portability, not a runtime setting.
- Recheck a non-root build, local assets, fonts, workers, source-dialog loading,
  brand navigation and shared URLs. Keep the same `VITE_BASE_PATH` for both
  build and preview. Most E2E scenarios navigate `/`; do not expect the entire
  suite to work unchanged when their server is mounted under a prefix.

For example, in PowerShell, replace `/nouveau-depot/` with the intended prefix:

```powershell
$env:VITE_BASE_PATH = "/nouveau-depot/"
bun run build
bun run preview --port 5174
```

Open `http://127.0.0.1:5174/nouveau-depot/`. Stop your preview afterward and
remove the temporary setting with `Remove-Item Env:VITE_BASE_PATH` before a
normal root-path build. There is no deployment in these commands. Publication
rules remain in `AGENTS.md`; renaming or moving a checkout does not publish it.

## Modern streets overlay (2026-10-06)

The viewer now offers an optional modern street network above all historical maps.
The compact street visibility control, labels and accessibility text support EN/FR/RU.
The vertical slider replaces the historical-opacity control below the eye button.
Zero hides streets; positive values enable them without a separate activation button.
The bottom 20% of slider travel snaps to off, with a shaded detent. Tapping the
street icon toggles streets, restoring the last committed positive opacity (initially 80%). Keyboard increments leave off immediately. The historical-opacity slider was removed:
new views use 100%, with legacy URL opacity preserved until historical navigation.
It starts disabled and is a session setting, outside shared URLs. The controller
creates/releases a separate transparent renderer on toggle and tracks its failures,
retry and graphics-context availability separately. OpenFreeMap vector tiles serve
transportation geometry and street names; see architecture.md. These display tiles
are not a saved reference graph for the separate georeferencer.
Dedicated street colour tokens extend the forest-green design palette. Light mode
uses emerald/ivory annotations; dark mode uses mint/deep-green annotations.
Contrasting opaque halos help lines and names remain legible over varied map content,
while the slider fades the complete overlay. Theme changes update paint in place.

Validation: `bun run check` passes (169 unit tests), as does `bun run build`.
Chrome browser checks pass for streets, loupe, mobile layout, loading and compact
controls, plus ten localization scenarios. The existing styled-language-menu
keyboard scenario fails when Home/Enter leaves French selected; the same failure
was reproduced on unchanged commit `76cde70` in Chrome. It remains separate work.
A real OpenFreeMap check loaded street geometry and names without console errors
on the 1860 map at desktop and mobile sizes. Physical-device performance is unmeasured.

## Installed iOS viewport (2026-10-06)

An iOS 27 screenshot showed header overlap with system glass and a bottom gap.
The screenshot also predates the latest local controls; no new deployment was made.
WebKit bug 301994 confirms an iOS 27 installed-app geometry regression, but the
exact device cause cannot be established from the screenshot alone.
The installation status bar now uses `default`; `theme-init.js` selects
`viewport-fit=auto` before first paint only for `navigator.standalone` (iOS).
Regular Safari retains `cover`, and other platforms retain safe-area handling.
This is a conservative workaround awaiting physical iOS 27 validation; it does
not claim to remove system-rendered glass. Existing installations may require
reinstallation after deployment because iOS can retain installation metadata.
