import { test, expect } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";
test.beforeEach(async ({ page }) => prepareSharing(page));
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
  await page.getByRole("button", { name: "Superposer", exact: true }).click();
  const panel = await page.locator(".control-panel").boundingBox();
  expect(panel!.height).toBeLessThan(110);
  const zoom = await page.locator(".zoom-controls").boundingBox();
  expect(zoom!.y + zoom!.height).toBeLessThan(panel!.y);
  await page.screenshot({ path: ".local/compact-overlay.png" });
  await page.getByRole("button", { name: "Frise", exact: true }).click();
  expect((await page.locator(".control-panel").boundingBox())!.height).toBeLessThan(150);
  await page.screenshot({ path: ".local/compact-time.png" });
  await page.getByRole("button", { name: "Lieux", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("combobox")).toHaveCount(0);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
});
