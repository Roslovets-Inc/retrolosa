import { test, expect } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";
test.beforeEach(async ({ page }) => prepareSharing(page));
test("1954 aerial tiles, shared view and four-period timeline work on mobile", async ({ page }) => {
  const errors: string[] = [];
  const tiles: number[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().includes("LAYER=ORTHOIMAGERY.EDUGEO.TOULOUSE1954")) tiles.push(r.status());
  });
  await page.goto("/#lon=1.44954&lat=43.597678&z=16.7&year=1954");
  await expect(page.getByRole("button", { name: "Carte de 1954" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect.poll(() => tiles.includes(200), { timeout: 60000 }).toBeTruthy();
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });
  await page.getByRole("button", { name: "Cartes", exact: true }).click();
  await page.getByRole("button", { name: "Rideau", exact: true }).click();
  await page.getByRole("button", { name: "Superposition", exact: true }).click();
  await page.getByRole("slider", { name: "Opacité de la carte historique" }).fill("100");
  await page.screenshot({ path: ".local/1954-desktop.png" });
  await page.getByRole("button", { name: "Cartes", exact: true }).click();
  await page.getByRole("button", { name: "Rideau", exact: true }).click();
  await page.getByRole("button", { name: "Superposition", exact: true }).click();
  await page.getByRole("slider", { name: "Opacité de la carte historique" }).fill("50");
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "0.5");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".local/1954-mobile.png" });
  await page.getByRole("button", { name: "Frise", exact: true }).click();
  const slider = page.getByRole("slider", { name: "Voyage dans le temps" });
  for (const [value, label] of [
    ["1892", "1875 → 1954"],
    ["1954", "1954"],
    ["1990", "1954 → Actuel"],
    ["1680", "1680"],
    ["1830", "1830"],
  ]) {
    await slider.fill(value);
    await expect(page.locator(".timeline-value")).toHaveText(label);
  }
  await slider.fill("1954");
  await page.screenshot({ path: ".local/1954-time-mobile.png" });
  await expect.poll(() => sharedView(page)).toMatch(/time=1954/);
  await page.goto(await sharedView(page));
  await page.reload();
  await expect(slider).toHaveValue("1954");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(tiles.every((status) => status === 200)).toBeTruthy();
});
