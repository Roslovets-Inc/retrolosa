import { expect, test } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";

test("late Antiquity uses a period label, preserves the complete raster and shares its selection", async ({
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
    response.url().endsWith("openedition-antiquite/map.webp"),
  );
  await page.goto("/#year=450&mode=time&time=450&lon=1.442&lat=43.602&z=14.3&opacity=100");
  expect((await raster).ok()).toBe(true);
  const slider = page.getByRole("slider", { name: "Voyage dans le temps" });
  await expect(slider).toHaveAttribute("min", "450");
  await expect(slider).toHaveAttribute("aria-valuetext", "Ve");
  await expect(
    page.locator(".timeline-ticks").getByRole("button", { name: "Ve siècle", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".timeline-ticks")).not.toContainText("450");
  const missing = await page.evaluate(async () => {
    const image = new Image();
    image.src = "/openedition-antiquite/map.webp";
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let missingPixels = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] !== 255) missingPixels++;
    return { missingPixels, width: canvas.width, height: canvas.height };
  });
  expect(missing).toEqual({ missingPixels: 0, width: 2007, height: 2660 });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    if (await page.getByRole("button", { name: "Fermer le message", exact: true }).isVisible()) {
      await page.getByRole("button", { name: "Fermer le message", exact: true }).click();
    }

    await expect(
      page.locator(".timeline-ticks").getByRole("button", { name: "Ve siècle", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    const dock = (await page.locator(".control-dock").boundingBox())!;
    expect(dock.x).toBeGreaterThanOrEqual(0);
    expect(dock.x + dock.width).toBeLessThanOrEqual(width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `.local/antiquity-${width}.png` });

    await expect(slider).toHaveAttribute("aria-valuetext", "Ve");
  }
  await page.getByRole("button", { name: "À propos des cartes" }).click();
  await expect(
    page.getByRole("heading", { name: "Toulouse à la fin de l’Antiquité · reconstruction" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Voir le dessin complet et sa légende" }),
  ).toHaveAttribute("href", "/openedition-antiquite/figure-01.jpg");
  await page.getByRole("button", { name: "Fermer les sources" }).click();
  await page.goto(await sharedView(page));
  await page.reload();
  await expect(slider).toHaveValue("450");
  await expect(slider).toHaveAttribute("aria-valuetext", "Ve");
});
