import { expect, test } from "@playwright/test";

test("local assets and navigation work under the deployment base path", async ({
  page,
  request,
}) => {
  const basePath = process.env.VITE_BASE_PATH || "/";
  const failedAssets: string[] = [];
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.hostname === "127.0.0.1" && response.status() >= 400) {
      failedAssets.push(url.pathname);
    }
  });
  await page.route(/^https:\/\//, (route) => route.abort());
  await page.goto(basePath);
  await expect(page).toHaveTitle("Rétrolosa");
  await expect(page.getByRole("link", { name: "Rétrolosa" })).toHaveAttribute("href", basePath);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('16px "Golos Text"'))).toBe(true);
  const fontStylesheet = await request.get(`${basePath}fonts/fonts.css`);
  expect(fontStylesheet.ok()).toBe(true);
  expect(await fontStylesheet.text()).toContain("url(./font-");
  for (const asset of [
    "fonts/font-4.woff2",
    "openedition-13c/display.webp",
    "openedition-antiquite/display.webp",
    "openedition-antiquite/figure-01.jpg",
    "openedition-13c/figure-06.jpg",
    "openedition-1550/display.webp",
    "openedition-1550/figure-07.jpg",
    "openedition-1550/figure-08.jpg",
    "tavernier-1631/overview.webp",
    "saget-1777/display.webp",
    "jourdan-1860/map.webp",
    "jourdan-1860/original.jpg",
    "laffont-1904/map.webp",
    "laffont-1904/original.jpg",
    "saget-1777/original.jpg",
    "flood-1875/overview.webp",
    "history-overview.png",
    "history-overview-1830.png",
  ]) {
    const response = await request.get(`${basePath}${asset}`);
    expect(response.ok(), asset).toBe(true);
    expect(response.headers()["content-type"], asset).toMatch(/^(image\/|font\/)/);
  }
  expect(failedAssets).toEqual([]);
});
