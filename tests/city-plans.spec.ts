import { expect, test } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";

for (const plan of [
  {
    year: "1860",
    name: "jourdan-1860",
    width: 4096,
    height: 3272,
    heading: "Plan de Jourdan et Rivière · vers 1860",
  },
  {
    year: "1904",
    name: "laffont-1904",
    width: 3661,
    height: 4461,
    heading: "Plan de Léon Laffont · 1904",
  },
]) {
  test(`${plan.year} preserves its complete sheet, sources and shared selection`, async ({
    page,
  }) => {
    await prepareSharing(page);
    if (plan.year === "1860") {
      const itemResponse = await page.request.get("/jourdan-1860/item.json");
      expect(itemResponse.ok()).toBe(true);
      const item = await itemResponse.json();
      expect(item.assets.display["proj:code"]).toBe("EPSG:3857");
      expect(item.assets.display["proj:shape"]).toEqual([plan.height, plan.width]);
      expect(item.assets.display.href).toBe("map.webp");
    }
    await page.route(/^https:\/\//, async (route) => {
      if (route.request().url().includes("tiles.openfreemap.org/styles/positron")) {
        await route.fulfill({ json: { version: 8, sources: {}, layers: [] } });
      } else {
        await route.abort();
      }
    });
    const raster = page.waitForResponse((response) =>
      new URL(response.url()).pathname.endsWith(
        `${plan.name}/${plan.year === "1904" ? "display.webp" : "map.webp"}`,
      ),
    );
    await page.goto(
      `/#year=${plan.year}&mode=time&time=${plan.year}&lon=1.442&lat=43.602&z=14&opacity=100`,
    );
    expect((await raster).ok()).toBe(true);
    const slider = page.getByRole("slider", { name: "Voyage dans le temps" });
    await expect(slider).toHaveValue(plan.year);
    const pixels = await page.evaluate(async (name) => {
      const image = new Image();
      image.src = `/${name}/${name === "laffont-1904" ? "display.webp" : "map.webp"}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
      let missing = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] !== 255) missing++;
      return { width: canvas.width, height: canvas.height, missing };
    }, plan.name);
    expect({ width: pixels.width, height: pixels.height }).toEqual({
      width: plan.width,
      height: plan.height,
    });
    if (plan.year === "1860") {
      // A north-up GDAL grid has transparent margins around the warped sheet.
      // Exact approved raster bytes and geographic bounds are checked in current-1860.test.ts.
      expect(pixels.missing).toBeGreaterThan(0);
      expect(pixels.missing).toBeLessThan(plan.width * plan.height);
    } else {
      expect(pixels.missing).toBeGreaterThan(0);
      expect(pixels.missing).toBeLessThan(plan.width * plan.height);
    }
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      const dismiss = page.getByRole("button", { name: "Fermer le message", exact: true });
      if (await dismiss.isVisible()) await dismiss.click();

      await expect(
        page.locator(`.timeline-ticks button[data-period="${plan.year}"]`),
      ).toHaveAttribute("aria-pressed", "true");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({ path: `.local/${plan.name}-${width}.png` });

      await expect(slider).toHaveValue(plan.year);
    }
    await page.getByRole("button", { name: "À propos des cartes" }).click();
    await expect(page.getByRole("heading", { name: plan.heading })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Voir le plan complet", exact: true }),
    ).toHaveAttribute("href", `/${plan.name}/original.jpg`);
    await page.getByRole("button", { name: "Fermer les sources" }).click();
    await page.goto(await sharedView(page));
    await page.reload();
    await expect(slider).toHaveValue(plan.year);
  });
}
