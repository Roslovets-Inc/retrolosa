import { test, expect } from "@playwright/test";

import { prepareOfflineMaps, waitForApp } from "./ui";
test.beforeEach(async ({ page }) => prepareOfflineMaps(page));
test("hold comparison restores split, overlay and timeline on release or cancellation", async ({
  page,
}) => {
  await page.goto("/#year=1875&lon=1.4315&lat=43.599&z=15.6&mode=split");
  await waitForApp(page);
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });
  const button = page.getByRole("button", {
    name: "Maintenir pour comparer avec la carte actuelle",
  });
  const layer = page.locator(".historic-map");
  const hold = async () => {
    await button.hover();
    await page.mouse.down();
    await expect(layer).toHaveCSS("opacity", "0.2");
    await expect(layer).toHaveCSS("clip-path", "none");
  };
  await hold();
  await page.mouse.move(100, 300);
  await page.mouse.up();
  await expect(layer).toHaveCSS("opacity", "1");
  await expect(page.locator(".divider")).toBeVisible();

  await page.getByRole("radio", { name: "Rideau", exact: true }).click();
  await page.getByRole("radio", { name: "Superposition", exact: true }).click();
  await hold();
  await page.mouse.up();
  await expect(layer).toHaveCSS("opacity", "1");

  const time = page.getByRole("slider", { name: "Voyage dans le temps" });
  await time.fill("1850");
  await page.setViewportSize({ width: 390, height: 844 });
  await hold();
  await page.screenshot({ path: ".local/compare-mobile.png" });
  await button.dispatchEvent("pointercancel");
  await expect(layer).toHaveCSS("opacity", "1");
  await page.mouse.up();
  await expect(time).toHaveValue("1850");
  await button.focus();
  await page.keyboard.down("Enter");
  await expect(layer).toHaveCSS("opacity", "0.2");
  await page.keyboard.up("Enter");
  await expect(layer).toHaveCSS("opacity", "1");
  await hold();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(layer).toHaveCSS("opacity", "1");
  await page.mouse.up();
  await expect(page.getByRole("alert")).toHaveCount(0);
});
