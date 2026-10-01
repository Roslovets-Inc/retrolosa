import { test, expect } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";

test("medieval raster preserves the whole source map including its legend", async ({ page }) => {
  await page.goto("/openedition-13c/figure-06.jpg");
  const result = await page.evaluate(async () => {
    const image = new Image();
    image.src = "/openedition-13c/map.webp";
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    let missingPixels = 0;
    for (let index = 3; index < data.length; index += 4) {
      if (data[index] !== 255) missingPixels++;
    }
    return missingPixels;
  });
  expect(result).toBe(0);
});

test("medieval reconstruction loads, identifies its period and restores shared settings", async ({
  page,
}) => {
  await prepareSharing(page);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#year=1250&layers=1250,1631&lon=1.442&lat=43.602&z=15&mode=overlay&opacity=55");
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });
  await expect(
    page.locator(".timeline-ticks").getByRole("button", { name: "XIIIe", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const asset = await page.request.get("/openedition-13c/map.webp");
  expect(asset.ok()).toBe(true);
  expect((await asset.body()).length).toBeGreaterThan(500000);
  await page.screenshot({ path: ".local/medieval-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".local/medieval-mobile.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "À propos des cartes" }).click();
  await expect(
    page.getByText("Toulouse au XIIIe siècle · reconstruction", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Ouvrir la carte source" })).toHaveAttribute(
    "href",
    "https://books.openedition.org/psorbonne/3296",
  );
  await expect(
    page.getByRole("link", { name: "Voir le dessin complet et sa légende" }),
  ).toHaveAttribute("href", "/openedition-13c/figure-06.jpg");
  await page.getByRole("button", { name: "Fermer les sources" }).click();

  const slider = page.getByRole("slider", { name: "Voyage dans le temps" });
  await expect(slider).toHaveAttribute("min", "1250");
  await slider.fill("1250");
  await expect(slider).toHaveAttribute("aria-valuetext", "XIIIe");
  await page.goto(await sharedView(page));
  await page.reload();
  await expect(slider).toHaveValue("1250");
  await page.getByRole("button", { name: "Époques", exact: true }).click();
  await page.getByRole("checkbox", { name: "XIIIe Reconstruction" }).uncheck();
  await expect(slider).toHaveAttribute("min", "1631");
  expect(errors).toEqual([]);
});

test("defaults select the first enabled period and superposition while shared options take precedence", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.locator(".timeline-ticks").getByRole("button", { name: "XIIIe", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.locator(".timeline-ticks").getByRole("button", { name: "XIIIe", exact: true }),
  ).toHaveText("XIIIe");
  await expect(page.getByRole("radio", { name: "Superposition", exact: true })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.getByRole("radio", { name: "Rideau", exact: true })).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await page.goto("/#layers=1830,1954");
  await page.reload();
  await expect(
    page.locator(".timeline-ticks").getByRole("button", { name: "1830", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/#year=1680&mode=split");
  await page.reload();
  await expect(
    page.locator(".timeline-ticks").getByRole("button", { name: "1680", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("radio", { name: "Rideau", exact: true })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});
