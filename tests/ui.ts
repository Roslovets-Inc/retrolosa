import { expect, type Locator, type Page } from "@playwright/test";

export async function waitForApp(page: Page) {
  // Give mounting and expected offline notices their own budget after navigation.
  await expect(page.getByRole("main")).toBeVisible({ timeout: 15000 });
}

export async function prepareOfflineMaps(page: Page) {
  await page.route(/^https:\/\//, async (route) => {
    if (/tiles.openfreemap.org\/styles\/(positron|dark)$/.test(route.request().url()))
      await route.fulfill({ json: { version: 8, sources: {}, layers: [] } });
    else
      await route.fulfill({
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          "base64",
        ),
      });
  });
}

export async function setSlider(slider: Locator, value: number) {
  await slider.press("Home");
  for (let i = 0; i < Math.floor(value / 10); i++) await slider.press("PageUp");
  const arrow =
    (await slider.getAttribute("aria-orientation")) === "vertical" ? "ArrowUp" : "ArrowRight";
  for (let i = 0; i < value % 10; i++) await slider.press(arrow);
}
