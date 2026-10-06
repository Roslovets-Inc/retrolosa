import { test, expect } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";
test.beforeEach(async ({ page }) => prepareSharing(page));
test("1875 flood tiles, timeline and mobile controls", async ({ page }) => {
  const errors: string[] = [];
  const tiles: number[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.url().includes("/flood-1875/")) tiles.push(r.status());
  });
  await page.goto("/#lon=1.4315&lat=43.599&z=15.6&year=1875");
  await expect(
    page.locator(".timeline-ticks").getByRole("button", { name: "1875", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => tiles.includes(200), { timeout: 60000 }).toBeTruthy();
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });

  await page.getByRole("radio", { name: "Rideau", exact: true }).click();
  await page.getByRole("radio", { name: "Superposition", exact: true }).click();
  await page.screenshot({ path: ".local/1875-desktop.png" });

  await page.getByRole("radio", { name: "Rideau", exact: true }).click();
  await page.getByRole("radio", { name: "Superposition", exact: true }).click();
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "1");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".local/1875-mobile.png" });

  const slider = page.getByRole("slider", { name: "Voyage dans le temps" });
  for (const [value, label] of [
    ["1875", "1875 · Inondation"],
    ["1900", "1875 → 1954"],
    ["1850", "1830 → 1875"],
  ]) {
    await slider.fill(value);
    await expect(page.locator(".timeline-value")).toHaveText(label);
  }
  await slider.fill("1875");
  await expect.poll(() => sharedView(page)).toMatch(/time=1875/);
  await page.goto(await sharedView(page));
  await page.reload();
  await expect(slider).toHaveValue("1875");
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });
  await page.screenshot({ path: ".local/1875-timeline.png" });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(tiles.every((s) => s === 200)).toBeTruthy();
});
test("1875 overview and overzoom load without missing tiles", async ({ page }) => {
  const failures: string[] = [];
  page.on("response", (r) => {
    if (r.url().includes("/flood-1875/") && r.status() !== 200) failures.push(r.url());
  });
  for (const z of [12, 18]) {
    await page.goto("/#lon=1.4315&lat=43.599&z=" + z + "&year=1875");
    await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({
      timeout: 60000,
    });
    await expect(page.getByRole("alert")).toHaveCount(0);
  }
  expect(failures).toEqual([]);
});
