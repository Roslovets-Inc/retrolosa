# Exploration architecture

## Epochs and sources

`src/epochs/catalog.ts` describes epochs in chronological order, providing labels,
credits, orientations and sources. This is also painter order: a newer map is drawn
above its predecessor. `details.ts` contains provenance text and document links.
It is imported by the lazily loaded source-dialog content, never by the catalogue.
`getEpochDetails(id)` provides the description; `getEpoch(id)` remains limited to
presentation and rendering data. `Record<EpochId, EpochDetails>` requires a description
for every catalogue epoch.

Available control-point counts come from metadata. The catalogue explicitly imports
the coordinates, bounds, revisions and addresses needed by maps. Descriptions import
only fields used in their text; complete annotations are unnecessary for rendering.
Geographic files remain the shared sources, without copying their values into a
second catalogue.

`types.ts` defines rendering variants: image, tiles, PMTiles archive, and overview
image followed by a detailed source. Imported coordinates and bounds are validated
before use.

`sources.ts` translates the catalogue into a MapLibre style. Deployment path and
origin are explicit parameters; this module does not read `location`.
`epochLayerIds` provides layer identifiers, so opacity handling does not depend
on a particular epoch.

The XII-century epoch (`1195`) uses the existing image renderer for a transparent
composite of three disconnected regions (figures 9, 4 and 11), with separately
aligned Saint-Pierre-des-Cuisines detail (figure 3) inside the borough. Each is aligned
separately during explicit generation; no renderer/module boundary changes are
needed. Regions without evidence remain transparent. Full originals and phase
legends stay in the lazy sources links. The raster revision changes its asset URL
to avoid stale imagery. Castle placement is explicitly approximate and unvalidated.

To add an epoch:

1. Explicitly prepare assets and their geographic metadata.
2. Add provenance text in `details.ts` and the definition in chronological order
   in the catalogue.
3. Choose an existing rendering variant with appropriate bounds and zooms.
4. Run `bun run check` and relevant browser scenarios.

## State and presentation

`src/view/state.ts` contains persistent view state and transitions. The reducer
updates epochs and time in a single transition. Normalization sorts and deduplicates
epochs and bounds numeric values. An empty selection represents the current city.
Re-enabling an epoch preserves the selected time; visitors can then select that
epoch on the timeline.

The URL fragment is read once at startup with `parseViewState`.
Navigation and shared-camera validation use the same Toulouse-area bounds
([1.18, 43.38]–[1.70, 43.86]) and zoom range (10.5–19). The renderer may enforce
a higher minimum zoom to keep the viewport within those bounds. This extra margin
allows wider historical sheets to fit without changing their source coverage.
`serializeViewState` produces a sharing link from state and the live camera,
without changing the address. Legacy `modern`, `historic` and `time` modes remain
compatible. The historical `year` field is retained in links. The current year is
an explicit parameter of calculation functions.

Historical timeline stops use equal visual gaps, with a 1.5-times wider final
interval to fit the present-day label. Calendar-year interpolation remains linear
inside each interval; changing spacing does not change dates or blending.

`src/view/presentation.ts` calculates active layers, opacities, the dominant epoch,
labels, credits and orientation. Between historical maps, the preceding sheet stays
opaque while the next fades in above it: their coefficients must not be normalized
to sum to one. Towards the current city, the last historical map fades out.
At the endpoint, no historical credit is displayed.
The selected camera bearing lives in view state and persists through timeline,
epoch-selection and opacity changes. Only the compass changes it; a rotated view
can return to north even when the dominant sheet has no reading angle.

Temporary comparison actions are separate from shared state. They change presentation
without replacing the selected mode, opacity or time. They do not rotate the camera
on every press and release.

## Map lifecycle

`src/map/controller.ts` owns both renderers, synchronization and subscriptions.
`useMaps.ts` connects their lifecycle to React; a partial startup failure releases
resources already created. Coordinates have their own subscription in
`Coordinates.tsx`, without rerendering the entire application.

Epochs contributing to the selected date and two enabled neighbours on each side are
installed: at most five at an exact date, six between dates. At the current date,
the last two historical epochs are prepared. Neighbours have exactly zero opacity
and contribute neither credits nor visible loading status. This prepares sources
in both directions and avoids recreating images whenever a snapped date is crossed.
A neighbouring source may still wait for the network if movement outpaces its first
load; distant epochs remain unloaded. For an overview/detail source, only the
rendering appropriate to the zoom is present. Opacity changes and movement within
the same zoom interval do not recreate retained sources. During temporary comparison,
historical sources remain available but do not block visible status.

`loading.ts` tracks required resources and failures separately. An `idle` event
never clears an error. Success for the same request or a retry clears it; disabled
sources no longer block the view. “Réessayer” replaces failed historical sources
or reloads the current style, preserving renderers, camera and comparison state.

The État-major protocol (`src/etat-major.ts`) validates addresses and delegates tiles
to `etat-major/client.ts`. The worker starts on first demand: it loads IGN images,
assembles neighbours and resamples pixels. Pure geometry remains in `geometry.ts`,
with the same alignment and neighbourhood checks. PNG results are transferred by
`ArrayBuffer`, without copying the buffer.

Every request has an identifier and cancellation signal. The client immediately
rejects a cancelled request; the worker receives cancellation and checks the signal
between row batches. Bitmaps are closed in `finally`. Map disposal terminates the
worker, rejects pending requests and removes subscriptions. Worker failure allows
a new worker on the next attempt; source errors retain their HTTP status.

`etat-major/source-tiles.ts` shares IGN downloads between corrected tiles.
The queue limits downloads to six at once. A cancelled consumer leaves the shared
request; only the last consumer's departure cancels the download or removes the
queued task.

The LRU cache retains compressed images (`Blob`), with limits of 64 entries and
8 MiB. Decoded bitmaps always belong to each render and are closed after use.
Failed responses and undecodable images are not reused. This budget covers the
cache, rather than temporary resampling buffers. Worker termination also releases
its cache.

## Interface and styles

`main.tsx` composes components and retains shared state, global shortcuts and map
services. `src/components/` separates responsibilities:

- `Header` handles places, theme and sharing, cleaning up the confirmation timer.
  The application supplies the link from its current view. Places opens a styled
  Radix dropdown of navigation commands directly, without a nested native selector.
- `MapViewport` owns loupe position and gestures, and displays the curtain.
- `MapTools` exposes location, zoom, orientation and opacity.
- `ComparisonPanel` handles timeline gestures and epoch/mode choices.
- `SourcesPanel` retains the dialog shell, focus and error boundary in the initial
  code. `SourcesContent`, exported by `SourcesDialog.tsx`, presents documents and
  credits; its module loads on first opening.

The application retains one open-panel selection (`places`, `epochs` or none).
Local component state does not duplicate persistent view state or participate in
the sharing link.

`style.css` is the single entry point for project styles: `colors.css` for colours,
`base.css` for global rules, `app.css` for the application and responsive variants,
and `ui.css` for Radix primitives. Disabled buttons share the `--disabled` theme
colour and subtle background in `base.css`; hover effects apply only to enabled
buttons. `compact.css` and rules for the previous screen were removed. Remaining
rules retain their cascade order; declarations already
overridden by an identical later rule were removed.

Documentation and code comments use English. Interface text and accessibility labels
support English and French through i18next and react-i18next. `src/i18n.ts` initializes
bundled UI resources in `src/locales/`, uses the browser language with English fallback,
and synchronizes the document language and description. Only explicit header choices
are stored under `retrolosa-language`; unavailable storage does not block selection.
The language selector uses the styled Radix Select wrapper in `src/ui.tsx`, with
theme tokens, keyboard navigation, dismissal and focus return.
`i18n-labels.ts` translates catalogue and view labels at the UI boundary, preserving
the pure view model and shared URL format. Historical milestones have localized prose.
Source descriptions and the `sources` translation namespace remain in the lazy source
module. Translation keys and interpolation placeholders must match across languages.
Existing browser scenarios explicitly use French; `tests/i18n.spec.ts` also covers
English, regional detection, fallback, persistence, lazy content and mobile storage failure.

## Installed application

`pwa.config.ts` is a Vite plugin that serves the manifest in development and emits
the manifest and service worker during production builds. Identity, launch URL,
scope and icon addresses follow the configured deployment base. Static manifest
metadata uses English; the in-app installation guide follows the selected interface
language. The cache revision includes emitted shell contents, manifest and static
fonts/icons. The worker
precaches only HTML, bundled JavaScript/CSS, local fonts, theme initialization and
icons; it never caches historical imagery, originals or external map providers.
Lazy modules stay deferred in React, but their production files are precached so
the sources dialog can also open after an offline launch.
Navigation tries the network and falls back to the precached HTML on failure.
Known shell assets use their revision cache. Other requests retain normal browser
network behaviour. Shell matching ignores response `Vary` headers because these
same-origin assets are fixed by the revision; a server's `Vary: Origin` must not
prevent offline module loading. Activation removes only older Rétrolosa shell caches for the
same deployment scope; it neither calls `skipWaiting` nor reloads an active map.

`src/pwa.ts` registers the production worker after page load and owns installation
and connectivity hooks. `InstallApp` in the header provides an optional localized
dialog, a one-use native install prompt when available, and manual iPhone/Android
instructions otherwise. Installed standalone windows hide the install action.
`App` displays a connectivity notice; map loading and retry remain the controller's
responsibility. Offline shell availability does not imply offline map availability.

The viewport includes `viewport-fit=cover`. Header/footer dimensions and map-control
offsets include safe-area insets in `app.css`. The top inset has a dark background
so iOS's translucent status bar remains legible with either app theme.
The application is fixed to the viewport edges rather than sized by `100dvh`;
maps extend beneath the transparent footer and bottom safe area. Mobile population
milestones collapse initially, and the 120 px comparison panel shows the selected
date above a single sparse row of timeline labels. `tests/mobile-layout.spec.ts`
checks viewport coverage, card placement, expansion and control separation.
The install dialog uses existing
Radix focus/dismissal primitives and project colour tokens in both themes.
`scripts/build-app-icons.mjs` explicitly renders PNG icons from the existing SVG
brand mark, including an Android mask-safe variant and an Apple touch icon.
It is separate from ordinary builds and map generators.

`tests/pwa.spec.ts` covers metadata, icon dimensions, mobile layouts, manual and
native installation flows, dismissal, standalone detection and production offline
launch. `playwright.pwa.config.ts` runs it against a built preview, including under
`VITE_BASE_PATH`; normal development tests omit the worker-specific scenario.
Device installation and operating-system splash screens require physical-device
verification; desktop emulation does not verify iOS or Android system UI.

Platform references: [MDN installation requirements](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
and [Apple's iPhone web-app installation guide](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios).

## Verification and current limits

Catalogue and view contracts are tested under Node without starting React or MapLibre.
Mandatory 100% coverage applies to `timeline.ts` and `src/view/` modules.
`tests/view-state.spec.ts` scenarios verify their browser integration with simulated
external services.

État-major tests separately cover annotation/report consistency, every landmark,
independent checks, tile neighbours and absence of folds. Point counts can change
without disabling geometric checks.

Controller tests simulate MapLibre to verify transitions, layer order and resource
cleanup. `tests/map-loading.spec.ts` checks recovery after network failure and
absence of requests to distant archives. The dragging scenario holds the pointer
down, crosses a snapped date repeatedly and verifies that a neighbour downloads
only once. Its first download is delayed to check that it starts early without
blocking the already visible map. Tests using real map services remain separate.

Sharing, comparison and loupe scenarios use simulated external services: they verify
UI gestures and state without depending on a map provider's availability.

`SourceTiles` tests check sharing, consumer cancellation, queuing, LRU budgets and
retries after failure. The worker scenario measures actual requests: for the tested
tile pair, six distinct IGN images replace ten separate downloads, and a second
render reuses them without additional downloads. IGN services are simulated there.

`tests/source-loading.spec.ts` verifies that descriptions and the État-major
validation report are not requested at startup, then appear when sources open.
A second epoch reuses the loaded module. Description unit tests check catalogue
coverage, interpolated text and links; the view scenario checks every epoch.

Vite separates MapLibre, UI dependencies and application code so library caches
survive UI changes. MapLibre remains necessary for initial display: splitting does
not remove its cost. Workers and dynamic modules respect the deployment path
configured by `VITE_BASE_PATH`.

Responsive variants remain explicit in `app.css`; any cascade reorganization must
preserve control dimensions, focus and accessibility.

## Refactoring results and remaining work

The catalogue, view transitions, presentation, map controller and tile processing
now have distinct responsibilities. Components in `src/components` depend on
neither `MapController` nor MapLibre. `MapTools` receives explicit commands;
`Coordinates` receives a subscription function and a value reader. These dependencies
are composed in `main.tsx`. Geolocation remains a MapLibre adapter in `useLocation`.
View actions shared with panels belong to the view model.

Descriptions load on demand; IGN images are shared with bounded concurrency and cache.
These limits do not cover decoded-image or temporary-canvas memory. The 100% coverage
checks concern only the three timeline and view-state files, rather than the whole project.

The local audit on 2026-10-01 reproduced the following issues in headless Edge with
simulated map services:

1. **P1 fixed — Dialog module failure.** An HTTP 503 response for `SourcesDialog.tsx`
   removed the entire `<main>`. The `SourcesPanel` shell now remains in the initial
   code, preserving the dialog, focus and dismissal during loading or failure.
   A local error boundary protects deferred content. The message offers continuing
   on the map or reloading the application after serializing the current view and
   camera into the address. Reloading renews module loading, including after a
   deployment replaces files; merely recreating `lazy` does not guarantee another
   download of an already rejected import. `tests/source-loading.spec.ts` simulates
   HTTP 503, checks dismissal and focus return, changes the date, then restores
   the module before reloading. The dialog remains protected if the service is
   still unavailable. All five local `source-loading` and `ui` scenarios pass,
   including dismissal during a pending import. An additional check against
   `bun run build` output simulates the same 503 for the production chunk and
   confirms recovery after reload.
2. **P2 fixed — Retry after dismissing an error.** A 503 response for
   `openedition-13c/map.webp` displays an alert. “Fermer le message” also removed
   the only “Réessayer” button while the store retained the failed resource.
   A “Réessayer” command now remains available above comparison controls when
   errors are hidden. The mobile `map-loading` scenario dismisses the alert and
   restores the image without replacing the canvas or changing the address.
3. **P2 fixed — Status during graphics-context loss.** After loading,
   `WEBGL_lose_context.loseContext()` on the current map left “Cartes chargées”
   displayed while `isContextLost()` was true. The controller now tracks
   `webglcontextlost` and `webglcontextrestored`. The store retains network
   errors separately and reports `unavailable` only if a required map has lost
   its context. A visible message indicates pending graphics restoration;
   after restoration, status waits for style and source loading. MapLibre restores
   its own context and style. The controller avoids accessing the destroyed style,
   applies historical changes after restoration and defers modern theme changes.
   Browser scenarios actually trigger loss and restoration on both maps; unit
   tests also cover hidden sources, retained errors and subscription cleanup.

The two P2 fixes were verified with `bun run check` (145 unit tests), eight
`map-loading`, `compact` and `ui` scenarios, and `bun run build`.

Dependency-change verification includes `bun run check` (143 unit tests), five
`orientation`, `ui` and `compact` scenarios, and `bun run build`.
An additional browser check verifies both geolocation markers and their removal
when tracking stops. These offline checks do not validate actual IGN, OpenFreeMap
or remote PMTiles availability. Those services remain to be checked separately,
and memory and rendering time must be measured on mobile hardware before further
performance work is justified.
