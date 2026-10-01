import { test, expect } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";
import { prepareOfflineMaps, setSlider } from "./ui";
test.beforeEach(async ({ page }) => {
  await prepareSharing(page);
  await prepareOfflineMaps(page);
});
test("compact mobile controls keep the map clear and places collapse after selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto("/");
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });
  await expect(page.locator(".intro")).toHaveCount(0);
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await page.getByRole("button", { name: "Lieux", exact: true }).click();
  await expect(page.getByRole("combobox")).toBeVisible();
  await page.getByRole("combobox").selectOption("1");
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await expect.poll(() => sharedView(page)).toMatch(/lat=43.599782/);

  await page.getByRole("radio", { name: "Superposition", exact: true }).click();
  const panel = await page.locator(".control-panel").boundingBox();
  expect(panel!.height).toBeLessThanOrEqual(132);
  const zoom = await page.locator(".zoom-controls").boundingBox();
  expect(zoom!.y + zoom!.height).toBeLessThan(panel!.y);
  await page.screenshot({ path: ".local/compact-overlay.png" });

  expect((await page.locator(".control-panel").boundingBox())!.height).toBeLessThan(150);
  await page.screenshot({ path: ".local/compact-time.png" });
  await page.getByRole("button", { name: "Lieux", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("combobox")).toHaveCount(0);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
});

test("historical tab unifies opacity modes and preserves legacy shared views", async ({ page }) => {
  await page.goto("/#mode=historic&opacity=42&year=1680");
  await expect(page.locator(".comparison-switch button")).toHaveCount(3);
  const tab = page.getByRole("radio", { name: "Superposition", exact: true });
  const slider = page.getByRole("slider", { name: "Opacité de la carte historique" });
  await expect(tab).toHaveAttribute("aria-checked", "true");
  await expect(slider).toHaveAttribute("aria-valuenow", "100");
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "1");
  await setSlider(slider, 35);

  await tab.click();
  await expect(slider).toHaveAttribute("aria-valuenow", "35");
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "0.35");
  const url = await sharedView(page);
  expect(new URLSearchParams(new URL(url).hash.slice(1)).get("mode")).toBe("overlay");
  await page.goto(url);
  await page.reload();
  await expect(tab).toHaveAttribute("aria-checked", "true");
  await expect(slider).toHaveAttribute("aria-valuenow", "35");
});
