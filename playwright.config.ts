import { defineConfig } from "@playwright/test";

const ci = Boolean(process.env.CI);
const port = Number(process.env.PLAYWRIGHT_PORT ?? 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PLAYWRIGHT_PORT must be an integer between 1 and 65535.");
}
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 90000,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  workers: 2,
  use: {
    baseURL,
    channel:
      process.env.PLAYWRIGHT_CHANNEL ?? (process.platform === "win32" ? "msedge" : undefined),
    headless: true,
    viewport: { width: 1440, height: 960 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { args: ["--enable-webgl", "--ignore-gpu-blocklist"] },
  },
  webServer: {
    command: `bun run dev --port ${port}`,
    url: baseURL,
    reuseExistingServer: !ci,
    timeout: 30000,
  },
  reporter: ci
    ? [["list"], ["html", { open: "never" }], ["junit", { outputFile: "test-results/results.xml" }]]
    : "list",
});
