import { expect, test } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";

test("Saget 1777 preserves the full plan, sources and shared selection", async ({ page }) => {
  await prepareSharing(page);
  await page.route(/^https:\/\//, async (route) => {
    if (route.request().url().includes("tiles.openfreemap.org/styles/positron")) {
      await route.fulfill({ json: { version: 8, sources: {}, layers: [] } });
    } else {
      await route.abort();
    }
  });
  const raster = page.waitForResponse((response) => response.url().endsWith("saget-1777/map.webp"));
  await page.goto("/#year=1777&mode=time&time=1777&lon=1.442&lat=43.602&z=14&opacity=100");
  expect((await raster).ok()).toBe(true);
  const slider = page.getByRole("slider", { name: "Voyage dans le temps" });
  await expect(slider).toHaveAttribute("aria-valuetext", "1777");
  const pixels = await page.evaluate(async () => {
    const image = new Image();
    image.src = "/saget-1777/map.webp";
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
  });
  expect(pixels).toEqual({ width: 4096, height: 2807, missing: 0 });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    const dismiss = page.getByRole("button", { name: "Fermer le message", exact: true });
    if (await dismiss.isVisible()) await dismiss.click();

    await expect(
      page.locator(".timeline-ticks").getByRole("button", { name: "1777", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `.local/saget-${width}.png` });

    await expect(slider).toHaveValue("1777");
  }
  await page.getByRole("button", { name: "À propos des cartes" }).click();
  await expect(
    page.getByRole("heading", { name: "Plan de Joseph Marie de Saget · 1777" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Voir le plan complet et sa légende" }),
  ).toHaveAttribute("href", "/saget-1777/original.jpg");
  await page.getByRole("button", { name: "Fermer les sources" }).click();
  await page.goto(await sharedView(page));
  await page.reload();
  await expect(slider).toHaveValue("1777");
});
