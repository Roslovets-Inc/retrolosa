import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const [command = "help", ...args] = process.argv.slice(2);
const bun = process.platform === "win32" ? "bun.exe" : "bun";
const commands = {
  install: "Install the exact dependencies from bun.lock",
  doctor: "Check local prerequisites and dependency installation",
  dev: "Start the local development server",
  preview: "Preview the production build locally",
  format: "Format project files",
  "format:check": "Check formatting without changing files",
  lint: "Check TypeScript and React code",
  "lint:fix": "Apply safe lint fixes",
  typecheck: "Check application, tests and configuration types",
  test: "Run offline unit tests with coverage",
  "test:watch": "Watch unit tests",
  "test:e2e": "Run browser tests (internet required)",
  "test:e2e:ui": "Open the browser test runner",
  check: "Run formatting, lint, types and offline tests",
  prep: "Format, apply safe lint fixes, then check",
  build: "Check types and build the site",
  verify: "Run all checks, build and browser tests",
};

function run(argv) {
  const result = spawnSync(bun, argv, { cwd: root, stdio: "inherit" });
  if (result.error) {
    console.error(`Could not start Bun: ${result.error.message}`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

if (command === "help" || command === "--help" || command === "-h") {
  console.log("Usage: bun project <command> [arguments]\n");
  for (const [name, description] of Object.entries(commands)) {
    console.log(`  ${name.padEnd(15)} ${description}`);
  }
  console.log("\nWindows: .\\project.cmd <command> | Unix: sh ./project <command>");
} else if (command === "doctor") {
  const version = spawnSync(bun, ["--version"], { cwd: root, encoding: "utf8" });
  const nodeVersion = spawnSync("node", ["--version"], { cwd: root, encoding: "utf8" });
  const installedNode = nodeVersion.stdout?.trim() ?? "";
  let ok = !version.error && version.status === 0 && !nodeVersion.error && nodeVersion.status === 0;
  console.log(`Node: ${installedNode || "not found"} (required ${manifest.engines.node})`);
  console.log(`Bun: ${version.stdout?.trim() || "not found"} (pinned ${manifest.packageManager})`);
  const [major, minor] = installedNode.replace(/^v/, "").split(".").map(Number);
  if (!Number.isFinite(major) || major < 22 || (major === 22 && minor < 12)) ok = false;
  if (version.stdout?.trim() !== manifest.packageManager.split("@")[1]) {
    console.warn("Use the pinned Bun version for the same environment as CI.");
    ok = false;
  }
  for (const name of [
    "bun.lock",
    "node_modules/typescript",
    "node_modules/oxlint",
    "node_modules/oxfmt",
    "node_modules/vitest",
    "node_modules/@playwright/test",
  ]) {
    const present = existsSync(join(root, name));
    console.log(`${present ? "OK" : "Missing"}: ${name}`);
    ok &&= present;
  }
  if (!ok) console.error("Install the required runtimes and run: bun project install");
  console.log("Browser tests also need Edge on Windows, or: bun x playwright install chromium");
  process.exitCode = ok ? 0 : 1;
} else if (command === "install") {
  run(["install", "--frozen-lockfile", ...args]);
} else if (Object.hasOwn(commands, command)) {
  run(["run", command, ...args]);
} else {
  console.error(`Unknown command: ${command}. Run: bun project help`);
  process.exitCode = 1;
}
