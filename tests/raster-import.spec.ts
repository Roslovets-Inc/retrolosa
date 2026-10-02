import { expect, test } from "@playwright/test";

import { RASTER_ITEMS } from "../src/epochs/raster-items";
import { prepareOfflineMaps } from "./ui";

for (const [epoch, item] of Object.entries(RASTER_ITEMS)) {
  test(`${epoch} imports its STAC package and displays the prepared image`, async ({ page }) => {
    await prepareOfflineMaps(page);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const path = `/${item.id}/${item.assets.display.href}`;
    const loaded = page.waitForResponse((response) => new URL(response.url()).pathname === path);
    await page.goto(
      `/#year=${epoch}&layers=${epoch}&mode=time&time=${epoch}&lon=1.442&lat=43.602&z=13&opacity=100`,
    );
    expect((await loaded).ok()).toBe(true);
    await expect(page.getByRole("slider", { name: "Voyage dans le temps" })).toHaveValue(epoch);
    const response = await page.request.get(`/${item.id}/item.json`);
    expect(response.ok()).toBe(true);
    expect(await response.json()).toEqual(item);
    const size = await page.evaluate(async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();
      return [image.naturalHeight, image.naturalWidth];
    }, path);
    expect(size).toEqual(item.assets.display["proj:shape"]);
    expect(errors).toEqual([]);
  });
}
