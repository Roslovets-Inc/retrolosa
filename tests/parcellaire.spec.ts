import { expect, test } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";

test("1550 combines both parcel colors, preserves its legend and restores shared selection", async ({
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
    response.url().endsWith("openedition-1550/map.webp"),
  );
  await page.goto("/#year=1550&layers=1250,1550&lon=1.442&lat=43.602&z=14.5&opacity=100");
  expect((await raster).ok()).toBe(true);
  await expect(page.getByRole("button", { name: "Carte de 1550" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const colors = await page.evaluate(async () => {
    const image = new Image();
    image.src = "/openedition-1550/map.webp";
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, 2200);
    let red = 0,
      blue = 0,
      missing = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > data[i + 1] + 25 && data[i] > data[i + 2] + 20) red++;
      if (data[i + 2] > data[i] + 25 && data[i + 2] > data[i + 1] + 15) blue++;
      if (data[i + 3] !== 255) missing++;
    }
    return { red, blue, missing };
  });
  expect(colors.red).toBeGreaterThan(20000);
  expect(colors.blue).toBeGreaterThan(20000);
  expect(colors.missing).toBe(0);
  if (await page.getByRole("button", { name: "Fermer le message", exact: true }).isVisible()) {
    await page.getByRole("button", { name: "Fermer le message", exact: true }).click();
  }
  await page.screenshot({ path: ".local/parcellaire-1550-desktop.png" });
  await page.getByRole("button", { name: "À propos des cartes" }).click();
  await expect(
    page.getByRole("heading", { name: "1550 · Héritages du parcellaire" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Figure 7 · Héritages antiques" })).toHaveAttribute(
    "href",
    "/openedition-1550/figure-07.jpg",
  );
  await expect(page.getByRole("link", { name: "Figure 8 · Héritages médiévaux" })).toHaveAttribute(
    "href",
    "/openedition-1550/figure-08.jpg",
  );
  await page.getByRole("button", { name: "Fermer les sources" }).click();
  await page.goto(await sharedView(page));
  await page.reload();
  await expect(page.getByRole("button", { name: "Carte de 1550" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("button", { name: "Carte de 1550" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (await page.getByRole("button", { name: "Fermer le message", exact: true }).isVisible()) {
    await page.getByRole("button", { name: "Fermer le message", exact: true }).click();
  }
  await page.screenshot({ path: ".local/parcellaire-1550-mobile.png" });
  await page.getByRole("button", { name: "Frise", exact: true }).click();
  await page.getByRole("slider", { name: "Voyage dans le temps" }).fill("1550");
  await expect(page.getByRole("slider", { name: "Voyage dans le temps" })).toHaveAttribute(
    "aria-valuetext",
    "1550 · Héritages du parcellaire",
  );
  await page.getByRole("button", { name: "Époques", exact: true }).click();
  if (await page.getByRole("button", { name: "Fermer le message", exact: true }).isVisible()) {
    await page.getByRole("button", { name: "Fermer le message", exact: true }).click();
  }
  await page.getByRole("checkbox", { name: "1550 Héritages du parcellaire" }).uncheck();
  await expect(
    page.locator(".timeline-ticks").getByRole("button", { name: "1550", exact: true }),
  ).toHaveCount(0);
});
