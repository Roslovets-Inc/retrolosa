import { test, expect } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";

test("compact modes share transparency, preserve comparison shape and have equal heights", async ({
  page,
}) => {
  await prepareSharing(page);
  await page.goto("/#mode=time");
  const panel = page.locator(".control-panel");
  const transparency = page.getByRole("slider", { name: "Opacité de la carte historique" });
  const layer = page.locator(".historic-map");
  await expect(page.locator(".mode-buttons button")).toHaveCount(2);
  const height = (await panel.boundingBox())!.height;
  await expect(page.getByRole("slider", { name: "Voyage dans le temps" })).toBeVisible();
  await expect(page.locator(".timeline-value")).toHaveClass(/sr-only/);
  await transparency.fill("60");
  await expect(layer).toHaveCSS("opacity", "0.6");
  for (const tab of ["Cartes", "Frise"]) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    expect((await panel.boundingBox())!.height).toBe(height);
    await expect(transparency).toHaveValue("60");
    await expect(layer).toHaveCSS("opacity", "0.6");
  }
  await page.getByRole("button", { name: "Cartes", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Position du rideau" })).toHaveCount(0);
  await page.getByRole("button", { name: "Loupe", exact: true }).click();
  await expect(layer).toHaveCSS("clip-path", /circle\(/);
  await transparency.fill("0");
  await expect(layer).toHaveCSS("opacity", "0");
  await expect(page.getByRole("button", { name: "Déplacer la loupe historique" })).toHaveCount(0);
  await page.getByRole("button", { name: "Frise", exact: true }).click();
  await page.getByRole("button", { name: "Cartes", exact: true }).click();
  await expect(page.getByRole("button", { name: "Loupe", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await transparency.fill("75");
  const url = await sharedView(page);
  await page.goto(url);
  await expect(transparency).toHaveValue("75");
  await expect(layer).toHaveCSS("opacity", "0.75");
  await expect(layer).toHaveCSS("clip-path", /circle\(/);
  await page.screenshot({ path: ".local/controls-desktop.png" });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 700 });
    for (const tab of ["Cartes", "Frise"]) {
      await page.getByRole("button", { name: tab, exact: true }).click();
      const dock = (await page.locator(".control-dock").boundingBox())!;
      expect(dock.x).toBeGreaterThanOrEqual(0);
      expect(dock.x + dock.width).toBeLessThanOrEqual(width);
      if (tab === "Cartes") {
        const switchBox = (await page.locator(".comparison-switch").boundingBox())!;
        const panelBox = (await panel.boundingBox())!;
        expect(switchBox.x + switchBox.width).toBeLessThanOrEqual(panelBox.x + panelBox.width);
        expect(switchBox.y + switchBox.height).toBeLessThanOrEqual(panelBox.y + panelBox.height);
        const modeBox = (await page.locator(".mode-buttons").boundingBox())!;
        const yearsBox = (await page.locator(".year-selector").boundingBox())!;
        expect(modeBox.x + modeBox.width).toBeLessThanOrEqual(switchBox.x);
        expect(yearsBox.y).toBeGreaterThanOrEqual(switchBox.y + switchBox.height);
        for (const button of await page.locator(".year-selector button").all()) {
          const epochBox = (await button.boundingBox())!;
          expect(epochBox.x).toBeGreaterThanOrEqual(panelBox.x);
          expect(epochBox.x + epochBox.width).toBeLessThanOrEqual(panelBox.x + panelBox.width);
        }
        await page.screenshot({ path: `.local/controls-cards-mobile-${width}.png` });
      }
      const box = (await transparency.boundingBox())!;
      expect(box.x).toBeGreaterThan(
        (await panel.boundingBox())!.x + (await panel.boundingBox())!.width,
      );
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBeTruthy();
    }
    await page.screenshot({ path: `.local/controls-mobile-${width}.png` });
  }
});

test("legacy current-map links open with full transparency", async ({ page }) => {
  await page.goto("/#mode=modern");
  await expect(page.getByRole("button", { name: "Cartes", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("slider", { name: "Opacité de la carte historique" })).toHaveValue(
    "0",
  );
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "0");
});
