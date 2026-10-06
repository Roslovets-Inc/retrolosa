import { test, expect } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";
import { prepareOfflineMaps } from "./ui";

test("one timeline serves every comparison tool and fits mobile widths", async ({ page }) => {
  await prepareSharing(page);
  await prepareOfflineMaps(page);
  const dismiss = page.getByRole("button", { name: "Fermer le message" });
  await page.addLocatorHandler(
    dismiss,
    async () => {
      await dismiss.click();
    },
    { noWaitAfter: true },
  );
  await page.goto("/#mode=time&time=1777");
  const panel = page.locator(".control-panel");
  const epochs = panel.getByRole("button", { name: "Époques", exact: true });
  const timeline = page.getByRole("slider", { name: "Voyage dans le temps" });
  const transparency = page.getByRole("slider", { name: "Opacité de la carte historique" });
  const layer = page.locator(".historic-map");
  await expect(page.locator(".mode-buttons, .year-selector")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Frise", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Cartes", exact: true })).toHaveCount(0);
  await expect(page.locator(".masthead").getByRole("button", { name: "Époques" })).toHaveCount(0);
  await expect(transparency).toHaveCount(0);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 700 });
    const height = (await panel.boundingBox())!.height;
    const scale = page.locator(".maplibregl-ctrl-scale");
    await expect(scale).toBeVisible();
    const scaleBox = (await scale.boundingBox())!;
    const dockBox = (await page.locator(".control-dock").boundingBox())!;
    if (scaleBox.x + scaleBox.width > dockBox.x) {
      expect(scaleBox.y + scaleBox.height).toBeLessThanOrEqual(dockBox.y - 8);
      expect(dockBox.y - scaleBox.y).toBeLessThan(40);
    }
    expect(scaleBox.x).toBeGreaterThanOrEqual(0);
    expect(scaleBox.x + scaleBox.width).toBeLessThanOrEqual(width);
    await expect(epochs).toBeVisible();
    await epochs.click();
    const menu = page.getByRole("group", { name: "Époques visibles" });
    await expect(menu).toBeVisible();
    const menuBox = (await page
      .getByRole("dialog", { name: "Époques visibles", exact: true })
      .boundingBox())!;
    const epochBox = (await epochs.boundingBox())!;
    expect(menuBox.y).toBeGreaterThanOrEqual(44);
    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(epochBox.y);
    expect(menuBox.x).toBeGreaterThanOrEqual(0);
    expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `.local/timeline-epochs-${width}.png` });
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await epochs.click();
    await page.getByRole("button", { name: "Fermer le choix des époques" }).click({
      position: { x: 1, y: 1 },
    });
    await expect(menu).toHaveCount(0);
    for (const tool of ["Superposition", "Rideau", "Loupe"]) {
      await page.getByRole("radio", { name: tool, exact: true }).click();
      await expect(timeline).toHaveValue("1777");
      await expect(timeline).toBeVisible();
      await expect(transparency).toHaveCount(0);
      await expect(layer).toHaveCSS("opacity", "1");
      expect((await panel.boundingBox())!.height).toBe(height);
      const tools = (await page.locator(".comparison-switch").boundingBox())!;
      const track = (await page.locator(".timeline-range").boundingBox())!;
      expect(tools.y + tools.height).toBeLessThanOrEqual(track.y);
      const dock = (await page.locator(".control-dock").boundingBox())!;
      expect(dock.x).toBeGreaterThanOrEqual(0);
      expect(dock.x + dock.width).toBeLessThanOrEqual(width);
      for (const button of await page.locator(".comparison-switch button").all()) {
        const box = (await button.boundingBox())!;
        expect(box.x + box.width).toBeLessThanOrEqual(dock.x + dock.width);
      }
      await timeline.fill("1600");
      await expect(page.locator(".population-value")).toContainText("45\u202f000");
      await timeline.fill("1777");
    }
    await page.screenshot({ path: `.local/unified-controls-${width}.png` });
  }
  await expect(layer).toHaveCSS("clip-path", /circle\(/);
  const url = await sharedView(page);
  expect(url).toContain("mode=loupe&time=1777");
  await page.goto(url);
  await page.reload();
  await expect(timeline).toHaveValue("1777");
  await expect(page.getByRole("radio", { name: "Loupe", exact: true })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  const hold = page.getByRole("button", { name: "Maintenir pour comparer avec la carte actuelle" });
  await hold.press("Enter");
  await expect(layer).toHaveCSS("opacity", "1");
  await expect(layer).toHaveCSS("clip-path", /circle\(/);
  await page.getByRole("radio", { name: "Rideau", exact: true }).click();
  const divider = page.getByRole("slider", { name: "Limite de comparaison", exact: true });
  await divider.press("Home");
  await divider.press("ArrowRight");
  await expect(layer).toHaveCSS("clip-path", "inset(0px 98% 0px 0px)");
});

test("legacy current-map links preserve transparency and keep the timeline available", async ({
  page,
}) => {
  await prepareOfflineMaps(page);
  await page.goto("/#mode=modern");
  await expect(page.getByRole("radio", { name: "Superposition", exact: true })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.getByRole("slider", { name: "Opacité de la carte historique" })).toHaveCount(0);
  await page.getByRole("slider", { name: "Voyage dans le temps" }).fill("1777");
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "1");
  await page.goto("/#mode=modern");
  await page.reload();
  await expect(page.getByRole("slider", { name: "Voyage dans le temps" })).toBeVisible();
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "0");
});

test("credits follow the visible blend while every source remains available in the dialog", async ({
  page,
}) => {
  await prepareOfflineMaps(page);
  const dismiss = page.getByRole("button", { name: "Fermer le message" });
  await page.addLocatorHandler(dismiss, () => dismiss.click(), { noWaitAfter: true });
  await page.goto("/#time=1631&mode=overlay");
  const footer = page.locator("footer");
  const timeline = page.getByRole("slider", { name: "Voyage dans le temps" });
  await expect(footer.getByRole("link", { name: "Tavernier", exact: true })).toBeVisible();
  await expect(footer.getByRole("link")).toHaveCount(3);
  await timeline.fill("1650");
  await expect(footer.getByRole("link")).toHaveCount(4);
  await expect(footer).toContainText("Tavernier");
  await expect(footer).toContainText("Toulouse Métropole / Makina Corpus");
  await timeline.fill("1680");
  await expect(footer).not.toContainText("Tavernier");
  await expect(footer.getByRole("link")).toHaveCount(3);
  await timeline.fill(String(new Date().getFullYear()));
  await expect(footer.getByRole("link")).toHaveCount(2);
  await expect(footer.getByRole("link", { name: "OpenMapTiles", exact: true })).toBeVisible();
  await expect(footer.getByRole("link", { name: "OpenStreetMap", exact: true })).toHaveAttribute(
    "href",
    "https://www.openstreetmap.org/copyright",
  );
  await page.getByRole("button", { name: "À propos des cartes" }).click();
  const dialog = page.getByRole("dialog", { name: "Cartes et précision" });
  await expect(dialog.locator(".source-credits a")).toHaveCount(13);
  await expect(dialog.locator(".source-credits")).toContainText("F. Callède / Inrap");
  await expect(dialog.locator(".source-credits")).toContainText("Archives municipales de Toulouse");
  await expect(dialog.getByRole("link", { name: "OpenFreeMap", exact: true })).toBeVisible();
});
