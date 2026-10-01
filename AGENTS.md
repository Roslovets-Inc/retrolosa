# Instructions for AI agents

These rules apply to the entire project.

## Commit messages

Create commits using Semantic Commits (Conventional Commits):

`<type>(<optional scope>): <description>`

Use an appropriate type such as `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, or `chore`. Write a concise description of the change. Mark breaking changes with `!` after the type/scope and explain them in a `BREAKING CHANGE:` footer.

Examples:

- `feat(timeline): allow selecting historical epochs`
- `fix(sharing): keep the address stable during navigation`
- `docs: add instructions for AI agents`

## Sites publication

Do not publish or deploy this project to Sites unless the user explicitly requests publication or deployment for the current work. Requests to implement, fix, build, test, or commit changes do not authorize publication. Previous publication requests do not authorize future deployments.

When Sites publication is not explicitly requested, complete the work locally and report the result without deploying to Sites. Do not enable automatic Sites publication on push. This project rule overrides any skill's default instruction to publish after edits.

GitHub Pages publication is authorized automatically on every push to `main` through `.github/workflows/pages.yml`, after checks and build pass. E2E tests run locally, not in CI.

## Development workflow

- Use Bun 1.4.2 as the package manager. Keep `bun.lock` as the single lockfile; do not create npm, pnpm or Yarn lockfiles.
- Use standard Bun scripts from `package.json`, run from the repository root. Install with `bun install --frozen-lockfile`; do not add a custom command router.
- After code changes, run `bun run check`. For changes affecting the browser, run relevant tests with `bun run test:e2e <test file>`; for a complete verification use `bun run verify`.
- Prefer the smallest relevant test set during development. Network-dependent E2E failures must be reported separately from offline checks.
- Format with Oxfmt and lint with Oxlint. Fix the underlying issue; use a narrow, explained suppression only for an intentional exception.
- Use PumpRoom-UI as the DevEx reference: Bun, Oxfmt, Oxlint with the official React Hooks plugin, and Vitest. Keep effect dependencies, render purity, refs and state mutation checks enabled. Do not copy its Docker deployment or release automation into this static site.
- Use `bun run test` for Vitest; `bun test` selects Bun's native runner. `start` and `local` are aliases for `dev`.
- Keep the user interface and accessibility labels in French; use English code comments.
- Keep unit tests under `tests/unit/*.test.ts` and Playwright scenarios under `tests/*.spec.ts`.
- Do not edit generated raster assets as part of routine formatting or web builds. Asset generation is an explicit separate operation.
- GitHub Actions runs `bun run check` and builds, without E2E tests or browser installation. The Pages workflow deploys on pushes to `main`. Local development commands and dependency installation must never publish the site.
