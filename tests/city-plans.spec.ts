import { expect, test } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";

for (const plan of [
  {
    year: "1860",
    name: "jourdan-1860",
    width: 4096,
    height: 3136,
    heading: "Plan de Jourdan et Rivière · vers 1860",
  },
  {
    year: "1904",
    name: "laffont-1904",
    width: 3361,
    height: 4096,
    heading: "Plan de Léon Laffont · 1904",
  },
]) {
  test(`${plan.year} preserves its complete sheet, sources and shared selection`, async ({
    page,
  }) => {
    await prepareSharing(page);
    await page.route(/^https:\/\//, async (route) => {
      if (route.request().url().includes("tiles.openfreemap.org/styles/positron")) {
        await route.fulfill({ json: { version: 8, sources: {}, layers: [] } });
      } else {
        await route.abort();
      }
    });
    const raster = page.waitForResponse((response) =>
      response.url().endsWith(`${plan.name}/map.webp`),
    );
    await page.goto(
      `/#year=${plan.year}&mode=time&time=${plan.year}&lon=1.442&lat=43.602&z=14&opacity=100`,
    );
    expect((await raster).ok()).toBe(true);
    const slider = page.getByRole("slider", { name: "Voyage dans le temps" });
    await expect(slider).toHaveValue(plan.year);
    const pixels = await page.evaluate(async (name) => {
      const image = new Image();
      image.src = `/${name}/map.webp`;
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
    expect(pixels).toEqual({ width: plan.width, height: plan.height, missing: 0 });
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      const dismiss = page.getByRole("button", { name: "Fermer le message", exact: true });
      if (await dismiss.isVisible()) await dismiss.click();
      await page.getByRole("button", { name: "Cartes", exact: true }).click();
      await expect(
        page.getByRole("button", { name: `Carte de ${plan.year}`, exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({ path: `.local/${plan.name}-${width}.png` });
      await page.getByRole("button", { name: "Frise", exact: true }).click();
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
