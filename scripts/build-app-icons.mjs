import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

// Explicit icon generation from the existing brand mark; never run during a web build.
const mark = readFileSync(new URL("../public/favicon.svg", import.meta.url), "utf8");
const artwork = mark.slice(mark.indexOf("  <g"), mark.lastIndexOf("</svg>"));
const directory = new URL("../public/icons/", import.meta.url);
mkdirSync(directory, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL ?? (process.platform === "win32" ? "msedge" : undefined),
});
try {
  for (const [name, size, scale] of [
    ["icon-192.png", 192, 0.78],
    ["icon-512.png", 512, 0.78],
    ["icon-maskable-512.png", 512, 0.64],
    ["apple-touch-icon.png", 180, 0.78],
  ]) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    const inset = (64 - 64 * scale) / 2;
    await page.setContent(
      `<html><body style="margin:0;background:#2f4b40"><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64"><rect width="64" height="64" fill="#2f4b40"/><g transform="translate(${inset} ${inset}) scale(${scale})">${artwork}</g></svg></body></html>`,
    );
    await page.screenshot({ path: fileURLToPath(new URL(name, directory)) });
    await page.close();
  }
} finally {
  await browser.close();
}
