import { test, expect } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";
test.beforeEach(async ({ page }) => prepareSharing(page));
test("continuous timeline preserves view, endpoints, keyboard peek and shared state", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/#lon=1.44954&lat=43.597678&z=16.7");
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });
  await page.getByRole("button", { name: "Frise", exact: true }).click();
  const slider = page.getByRole("slider", { name: "Voyage dans le temps" });
  await expect(slider).toBeVisible();
  await expect(page.getByRole("slider", { name: "Limite de comparaison" })).toHaveCount(0);
  await slider.fill("1755");
  await expect(page.locator(".timeline-value")).toHaveText("1680 → 1830");
  await expect.poll(() => sharedView(page)).toMatch(/mode=time&time=1755/);
  await page.screenshot({ path: ".local/time-midpoint.png" });
  await slider.fill("1830");
  await expect(page.locator(".timeline-value")).toHaveText("1830");
  await page.screenshot({ path: ".local/time-1830.png" });
  const today = new Date().getFullYear();
  await slider.fill(String(today));
  await expect(page.locator(".timeline-value")).toHaveText("Actuel");
  await page.screenshot({ path: ".local/time-today.png" });
  await slider.fill("1755");
  await expect.poll(() => sharedView(page)).toMatch(/time=1755/);
  await page.goto(await sharedView(page));
  await page.reload();
  await expect(slider).toHaveValue("1755");
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });
  await page.locator("main").focus();
  await page.keyboard.down("Space");
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "0");
  await page.keyboard.up("Space");
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Rideau", exact: true }).click();
  await expect(page.getByRole("group", { name: "Époque historique" })).toBeVisible();
  await page.getByRole("button", { name: "Frise", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".local/time-mobile.png" });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(errors).toEqual([]);
});
