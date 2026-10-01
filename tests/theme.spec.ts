import { expect, test } from "@playwright/test";

test("appearance follows the system, persists overrides and preserves the historical view", async ({
  page,
}) => {
  const styles: string[] = [];
  await page.emulateMedia({ colorScheme: "dark" });
  await page.route(/^https:\/\//, async (route) => {
    const url = route.request().url();
    if (/tiles.openfreemap.org\/styles\/(positron|dark)$/.test(url)) {
      styles.push(url);
      await route.fulfill({
        json: {
          version: 8,
          sources: {},
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": url.endsWith("dark") ? "#171f1c" : "#efece3" },
            },
          ],
        },
      });
    } else
      await route.fulfill({
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          "base64",
        ),
      });
  });
  const dismiss = page.getByRole("button", { name: "Fermer le message" });
  await page.addLocatorHandler(dismiss, () => dismiss.click(), { noWaitAfter: true });
  await page.goto("/#mode=loupe&time=1777&opacity=60&lon=1.44&lat=43.6&z=15");
  const theme = page.getByRole("button", { name: /^Thème :/ });
  const root = page.locator("html");
  await expect(theme).toHaveAccessibleName("Thème : système. Passer au thème clair");
  await expect(root).toHaveAttribute("data-theme", "dark");
  await expect.poll(() => styles.at(-1)).toContain("/dark");
  const originalUrl = page.url();
  const history = page.locator(".historic-map");
  const canvas = page.locator(".map:not(.historic-map) canvas");
  const initialCanvas = await canvas.elementHandle();
  await theme.click();
  await expect(root).toHaveAttribute("data-theme", "light");
  await expect.poll(() => styles.at(-1)).toContain("/positron");
  await expect(page.getByRole("slider", { name: "Voyage dans le temps" })).toHaveValue("1777");
  await expect(history).toHaveCSS("opacity", "0.6");
  await expect(history).toHaveCSS("filter", "none");
  await expect(history).toHaveCSS("clip-path", /circle\(/);
  expect(page.url()).toBe(originalUrl);
  expect(await initialCanvas?.evaluate((element) => element.isConnected)).toBe(true);
  await page.reload();
  await expect(theme).toHaveAccessibleName("Thème : clair. Passer au thème sombre");
  await expect(root).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "light" });
  await theme.press("Enter");
  await expect(theme).toHaveAccessibleName("Thème : sombre. Passer au thème système");
  await expect(root).toHaveAttribute("data-theme", "dark");
  await theme.press("Space");
  await expect(theme).toHaveAccessibleName("Thème : système. Passer au thème clair");
  await expect(root).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(root).toHaveAttribute("data-theme", "dark");
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 700 });
    const header = page.locator(".masthead");
    const brand = (await header.locator(".brand").boundingBox())!;
    const controls = (await header.locator(".header-right").boundingBox())!;
    expect(brand.x + brand.width).toBeLessThanOrEqual(controls.x);
    expect(controls.x + controls.width).toBeLessThanOrEqual(width);
    await expect(theme).toBeVisible();
    await page.screenshot({ path: `.local/theme-dark-${width}.png` });
  }
});

test("system appearance is applied before React loads when storage is unavailable", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get: () => {
        throw new Error("Storage unavailable");
      },
    });
  });
  await page.route("**/src/main.tsx", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "system");
});
