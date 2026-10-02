# Rétrolosa

An interactive map of Toulouse through the centuries: ancient and medieval reconstructions,
historical plans, the 1848 État-major map, 1954 aerial photography and the present-day map.
The XII-century partial reconstruction combines Saint-Sernin borough growth,
Romanesque Saint-Étienne and an approximately positioned Narbonnais castle fragment.
Saint-Pierre-des-Cuisines adds building-phase detail within the Saint-Sernin borough.
Undocumented gaps remain transparent; original phase legends are linked from sources.
React 19, TypeScript, Vite 8, MapLibre GL JS 6 and PMTiles 4. The interface is available in English and French.

UI components use Radix Primitives: tooltips, panels, dialogs, checkboxes, mode selection,
the language selector and the opacity slider. Wrappers in `src/ui.tsx` share project styles and colours without
a library-imposed theme. Radix handles focus, keyboard input, dismissal and screen-edge
collisions. The nonlinear timeline and map tools retain their specific behaviour;
place selection opens a styled Radix dropdown directly from the header.

## Language policy

English is the primary development language for all project documentation, including
README, and code comments. The interface, user-facing content and accessibility labels
are available in English and French. The first visit follows the browser language; unsupported
languages fall back to English. The header selector saves an explicit choice locally.
Preserve original source titles, proper names and quoted UI labels where needed.

## License

Copyright (C) 2026 Pavel Roslovets and the Rétrolosa contributors.

The code and original documentation are distributed under the **GNU Affero General Public
License, version 3 or later** (`AGPL-3.0-or-later`). See [LICENSE](LICENSE) and the
[license scope](docs/licensing.md). Use, modification and redistribution, including
commercial use, are allowed under its terms. Derived versions must preserve these freedoms;
a modified version accessible over a network must offer its source code to users.

Maps, photographs, data, fonts and other third-party materials retain their own rights
and terms. The software license does not grant permission to reuse them.

## Getting started

Requirements: Bun 1.4.2 and Node.js 22.12+; `.nvmrc` and CI use Node 24.
Run commands from the repository root.

```sh
bun install --frozen-lockfile
bun run dev
```

Open http://127.0.0.1:5173. Maps require Internet access.
`bun start` and `bun local` are development aliases.

## Commands

| Command               | Purpose                                |
| --------------------- | -------------------------------------- |
| `bun run dev`         | Local development server               |
| `bun run check`       | Formatting, lint, types and unit tests |
| `bun run prep`        | Formatting, lint fixes, then checks    |
| `bun run build`       | Type checking and production build     |
| `bun run preview`     | Preview the production build           |
| `bun run test`        | Vitest with coverage                   |
| `bun run test:watch`  | Vitest in watch mode                   |
| `bun run test:e2e`    | Playwright browser tests               |
| `bun run test:e2e:ui` | Playwright UI                          |
| `bun run verify`      | Checks, build and browser tests        |

Formatting and linting are also available separately: `bun run format`,
`bun run format:check`, `bun run lint`, `bun run lint:fix`, `bun run typecheck`.
Pass arguments directly: `bun run test:e2e tests/share.spec.ts --workers=1`.
Use `bun run test` for Vitest; `bun test` invokes Bun's native runner.

## Quality

The tooling follows PumpRoom-UI: Bun, Oxfmt, Oxlint with the official React Hooks plugin,
and Vitest. Lint warnings fail the checks. Oxfmt enforces LF line endings and excludes
generated maps and data. TypeScript checks the application, tests and configuration.

Vitest covers the catalogue, view transitions, timeline, controllers and worker.
The 100% coverage threshold applies only to `src/timeline.ts` and the modules in
`src/view/`, rather than the whole application. Playwright checks maps, comparison
modes, sharing and mobile behaviour. Some browser tests use real services and need
Internet access; UI and recovery scenarios using `prepareOfflineMaps` simulate external
services. Offline checks work after installing dependencies and the browser.

On Windows, Playwright uses Edge. On Linux and macOS, install Chromium with
`bun x playwright install chromium`. `PLAYWRIGHT_CHANNEL` selects the browser and
`PLAYWRIGHT_PORT` isolates the test server. Reports go in `coverage/`,
`playwright-report/` and `test-results/`; manual screenshots go in `.local/`.

GitHub Actions checks, builds and publishes the site on every push to `main`,
and retains diagnostics for seven days. A failed check or test blocks publication.

## GitHub Pages publication

The single `Deploy to GitHub Pages` workflow (`.github/workflows/pages.yml`) runs
automatically on every push to `main`. It checks the project, builds `dist/` and
publishes with the official GitHub Pages actions. Browser tests run locally;
CI neither runs them nor installs a browser. Manual execution remains available under
**Actions → Deploy to GitHub Pages → Run workflow**, on `main`.
Local commands and dependency installation do not trigger publication.

After uploading the repository to GitHub, select **Settings → Pages → Build and
deployment → Source → GitHub Actions**. The `github-pages` environment protection
rules must allow the `main` branch.

GitHub Pages supplies the base path to Vite through `VITE_BASE_PATH`; maps, fonts and
links also work under the repository path. To reproduce this build locally, set
`VITE_BASE_PATH=/repository-name/` before `bun run build`, retain the same variable
for `bun run preview`, and open that path. Replace `repository-name` with the actual
repository name. Local builds use `/` by default.

## Dependencies and conventions

`bun.lock` is the only lockfile. Add dependencies with `bun add` or `bun add --dev`,
then include `package.json` and `bun.lock`. `bunfig.toml` pins new versions and requires
a minimum release age of five days. Agent rules and Semantic / Conventional Commits are
defined in [AGENTS.md](AGENTS.md). Sites publication requires an explicit request for
the changes concerned.

## Installing on a phone

Rétrolosa is an installable progressive web app. Open **Installer Rétrolosa** in
the header for the installation guide in the selected language. On iPhone/iPad, use Safari's Share
menu, choose **Sur l’écran d’accueil**, and keep **Ouvrir comme app web** enabled
when offered. On Android, use the app's installation button when available, or
Chrome's **Installer l’application / Ajouter à l’écran d’accueil** menu.
The installed app launches in its own window with the existing Occitan-cross icon.
Installation requires HTTPS (localhost is allowed for development).

The production service worker caches the application shell, bundled code, fonts
and icons. After the first successful online load, the interface can reopen offline;
maps still need Internet access. Historical rasters, original scans, PMTiles archives
and external map services are not stored by the service worker. An offline notice
explains this limitation. Updates activate after existing app windows close, without
forcing a reload during exploration. Service workers are disabled in development.

The manifest, worker scope and icon URLs follow `VITE_BASE_PATH`. After a build,
test the production app with:

```sh
bun run build
bun run test:e2e --config playwright.pwa.config.ts
```

For a prefixed build, keep `VITE_BASE_PATH` set for both commands. Tests simulate
map providers and check the production worker's offline shell. Desktop browser tests
do not replace installation checks on a physical iPhone and Android phone.
App icons are committed; explicitly regenerate them from `public/favicon.svg` with
`bun scripts/build-app-icons.mjs` (requires Playwright's browser). Web builds never
regenerate icons or map imagery.

## Exploring maps

Continuous timeline, curtain, transparent overlay and current view. Unchecked epochs
are skipped by the timeline. Holding the eye button shows current streets with a faint
historical overlay. Geolocation is optional. Navigation is limited to Toulouse;
resetting the overview shows the centre. Sharing explicitly creates a link without
changing the address.

The 1631 Tavernier plan is a Municipal Archives scan aligned with 22 ground landmarks.
Four independent checks around Nazareth and Salin show errors of 8–39 metres; they
do not represent citywide accuracy. The 1680/1830 cadastres are modern renderings by
Makina Corpus / Toulouse Métropole. The 1875 flood plan is a manually aligned scan.
The 1954 photograph comes from IGN / Edugéo; the current basemap from OpenFreeMap / OSM.

See [sources and accuracy](docs/sources.md) and [remaining maps](docs/map-backlog.md).
Python generators are separate from the web build; prepared assets are included in the repository.

## Documentation and project handoff

When working in a new chat or after moving the repository, start with [AGENTS.md](AGENTS.md),
[project context](docs/project-context.md) and [architecture](docs/architecture.md).
The context describes contracts to preserve, recent validation, remaining work and the
procedure for moving or renaming the checkout. Documented paths are repository-relative.

| Document                                                           | Contents                                                        |
| ------------------------------------------------------------------ | --------------------------------------------------------------- |
| [Architecture](docs/architecture.md)                               | Modules, timeline, sources, workers, loading and error recovery |
| [Sources](docs/sources.md)                                         | Map provenance, alignment and accuracy limits                   |
| [OpenEdition reconstructions](docs/openedition-medieval-layers.md) | Inventory and selection of ancient and medieval figures         |
| [Orientation](docs/orientation.md)                                 | North, reading orientation and synchronization                  |
| [Population](docs/population.md)                                   | Estimates, interpolation and data boundaries                    |
| [City widget](docs/city-widget.md)                                 | Events and limitations of built-up area measurements            |
| [Map backlog](docs/map-backlog.md)                                 | Research into new sources, with integration dates               |
| [Licensing](docs/licensing.md)                                     | Code license and separate third-party resource terms            |
| [Style guide](docs/style-guide.html)                               | Visual reference; runtime styles remain in `src/`               |
