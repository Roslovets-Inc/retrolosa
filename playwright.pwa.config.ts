import { defineConfig } from "@playwright/test";

import config from "./playwright.config.ts";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 5174);
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  ...config,
  testMatch: "pwa.spec.ts",
  projects: [{ name: "pwa-production" }],
  use: { ...config.use, baseURL },
  webServer: {
    command: `bun run preview --port ${port} --strictPort`,
    url: `${baseURL}${process.env.VITE_BASE_PATH || "/"}`,
    reuseExistingServer: false,
    timeout: 30000,
  },
});
