import { test, expect } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";
test.beforeEach(async ({ page }) => prepareSharing(page));
test("navigation stays around Toulouse and overview fits desktop and mobile", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#lon=1.44954&lat=43.597678&z=2&mode=modern");
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Zoom arrière", exact: true }).click();
  await page.waitForTimeout(700);
  let params = new URLSearchParams(new URL(await sharedView(page)).hash.slice(1));
  expect(Number(params.get("z"))).toBeGreaterThanOrEqual(11.5);
  await page.goto("/#lon=1.55&lat=43.73&z=18&mode=modern");
  await page.reload();
  for (let i = 0; i < 3; i++) {
    await page.mouse.move(1100, 400);
    await page.mouse.down();
    await page.mouse.move(100, 850, { steps: 8 });
    await page.mouse.up();
  }
  params = new URLSearchParams(new URL(await sharedView(page)).hash.slice(1));
  expect(Number(params.get("lon"))).toBeLessThanOrEqual(1.57);
  expect(Number(params.get("lat"))).toBeLessThanOrEqual(43.75);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByRole("button", { name: "Vue d’ensemble de Toulouse", exact: true }).click();
    await page.waitForTimeout(1200);
    params = new URLSearchParams(new URL(await sharedView(page)).hash.slice(1));
    expect(Number(params.get("lon"))).toBeCloseTo(1.442, 3);
    expect(Number(params.get("lat"))).toBeCloseTo(43.602, 3);
    expect(Number(params.get("z"))).toBeLessThan(15);
    await page.screenshot({ path: ".local/toulouse-overview-" + width + ".png" });
  }
  await page.goto("/#lon=1.442&lat=43.602&z=40&mode=modern");
  await page.reload();
  params = new URLSearchParams(new URL(await sharedView(page)).hash.slice(1));
  expect(Number(params.get("z"))).toBeLessThanOrEqual(19);
  await page.goto("/#lon=0&lat=0&z=2&mode=modern");
  await page.reload();
  params = new URLSearchParams(new URL(await sharedView(page)).hash.slice(1));
  expect(Number(params.get("lon"))).toBeCloseTo(1.442, 3);
  expect(errors).toEqual([]);
});
