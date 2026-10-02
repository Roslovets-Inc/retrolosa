# Project context for a new session

This document is a handoff for a developer or AI agent without the previous chat.
Paths are relative to the repository root. Read `AGENTS.md` for working rules and
`README.md` for commands; [architecture.md](architecture.md) explains the implementation.
Source and configuration take precedence over this dated snapshot.

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

The same timeline works with overlay, curtain and loupe. It skips unchecked
epochs and uses evenly spaced historical ticks, with extra room before the present
label. Calendar-year interpolation remains linear within each interval. It
preserves the calendar year when comparison tools change, and snaps
pointer input near source dates. Camera, theme, location, population and curated
events are part of the experience. Sharing explicitly creates an address;
ordinary interactions do not continuously rewrite the URL.

## Where to change things

Mobile layout uses a viewport-fixed application with maps continuing beneath
the footer safe area. The population card sits just below the header, with
milestones initially collapsed on phones. The compact timeline exposes its
selected date and uses one sparse label row. See `tests/mobile-layout.spec.ts`
for viewport, expansion and non-overlap checks.

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
