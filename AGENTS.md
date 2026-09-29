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

When publication is not explicitly requested, complete the work locally and report the result without deploying. Do not enable automatic publication on push. This project rule overrides any skill's default instruction to publish after edits.

## Development workflow

- Use Bun 1.4.2 as the package manager. Keep `bun.lock` as the single lockfile; do not create npm, pnpm or Yarn lockfiles.
- Use `bun project help` for the supported commands. The equivalent Windows entry points are `project.cmd` and `project.ps1`; Unix users can run `sh ./project`.
- After code changes, run `bun project check`. For changes affecting the browser, run relevant tests with `bun project test:e2e <test file>`; for a complete verification use `bun project verify`.
- Prefer the smallest relevant test set during development. Network-dependent E2E failures must be reported separately from offline checks.
- Format with Oxfmt and lint with Oxlint. Fix the underlying issue; use a narrow, explained suppression only for an intentional exception.
- Keep the user interface and accessibility labels in French; use English code comments.
- Keep unit tests under `tests/unit/*.test.ts` and Playwright scenarios under `tests/*.spec.ts`.
- Do not edit generated raster assets as part of routine formatting or web builds. Asset generation is an explicit separate operation.
- GitHub Actions mirrors local checks. Development commands, CI and dependency installation must never publish the site automatically.
