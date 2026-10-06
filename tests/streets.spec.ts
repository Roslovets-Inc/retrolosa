import { expect, test } from "@playwright/test";

import { prepareOfflineMaps, waitForApp, setSlider } from "./ui";

for (const viewport of [
  { width: 1440, height: 960 },
  { width: 390, height: 844 },
]) {
  test(`modern streets remain above comparison modes and release on disable (${viewport.width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ colorScheme: "dark" });
    await prepareOfflineMaps(page);
    let requests = 0;
    let fail = true;
    await page.route("https://tiles.openfreemap.org/planet", async (route) => {
      requests++;
      if (fail) await route.fulfill({ status: 503, body: "unavailable" });
      else
        await route.fulfill({
          json: {
            tilejson: "3.0.0",
            tiles: ["https://example.test/streets/{z}/{x}/{y}.pbf"],
            minzoom: 0,
            maxzoom: 14,
          },
        });
    });
    await page.route("https://example.test/streets/**", (route) =>
      route.fulfill({ status: 204, body: "" }),
    );
    await page.goto("/#year=1860&lon=1.442&lat=43.602&z=14");
    await waitForApp(page);
    const slider = page.getByRole("slider", { name: "Opacité des rues", exact: true });
    await expect(page.getByRole("button", { name: "Rues actuelles", exact: true })).toHaveCount(0);
    await expect(slider).toHaveAttribute("aria-orientation", "vertical");
    const overlay = page.locator(".streets-map");
    await expect(slider).toHaveAttribute("aria-valuenow", "0");
    await expect(overlay.locator("canvas")).toHaveCount(0);
    expect(requests).toBe(0);
    await page.getByRole("button", { name: "Afficher les rues", exact: true }).click();
    await expect(slider).toHaveAttribute("aria-valuenow", "80");
    await expect(page.getByRole("alert")).toContainText("Rues actuelles");
    await page.getByRole("button", { name: "Fermer le message", exact: true }).click();
    fail = false;
    await page.getByRole("button", { name: "Réessayer", exact: true }).click();
    await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await expect(overlay.locator("canvas")).toHaveCount(1);
    await expect(overlay).toHaveCSS("pointer-events", "none");
    const streetCanvas = await overlay.locator("canvas").elementHandle();
    const palette = () =>
      page.locator("html").evaluate((root) => {
        const style = getComputedStyle(root);
        return ["--street-line", "--street-text", "--street-halo"].map((key) =>
          style.getPropertyValue(key).trim(),
        );
      });
    const originalPalette = await palette();
    await page.getByRole("button", { name: /^Thème :/ }).click();
    expect(await palette()).not.toEqual(originalPalette);
    expect(await streetCanvas?.evaluate((element) => element.isConnected)).toBe(true);
    await expect(slider).toHaveAttribute("aria-valuenow", "80");
    await setSlider(slider, 35);
    await expect(overlay).toHaveCSS("opacity", "0.35");
    for (const mode of ["Rideau", "Loupe", "Superposition"]) {
      await page.getByRole("radio", { name: mode, exact: true }).click();
      await expect(overlay).toBeVisible();
      await expect(overlay).toHaveCSS("clip-path", "none");
      await expect(overlay).toHaveCSS("opacity", "0.35");
    }
    await page.getByRole("slider", { name: "Voyage dans le temps" }).fill("1250");
    await expect(slider).toHaveAttribute("aria-valuenow", "35");
    await page.screenshot({ path: `.local/streets-${viewport.width}.png` });
    await slider.press("Home");
    await expect(overlay.locator("canvas")).toHaveCount(0);
    await expect(slider).toHaveAttribute("aria-valuenow", "0");
    await setSlider(slider, 60);
    await expect(slider).toHaveAttribute("aria-valuenow", "60");
    await expect(overlay).toHaveCSS("opacity", "0.6");
    await slider.press("Home");
    await expect(slider).toHaveAttribute("aria-valuenow", "0");
    await expect(overlay.locator("canvas")).toHaveCount(0);
    await setSlider(slider, 60);
    await expect(slider).toHaveAttribute("aria-valuenow", "60");
    await expect(page.locator(".historic-map canvas")).toHaveCount(1);
    await page.getByRole("button", { name: "Masquer les rues", exact: true }).click();
    await expect(slider).toHaveAttribute("aria-valuenow", "0");
    await page.getByRole("button", { name: "Afficher les rues", exact: true }).press("Space");
    await expect(slider).toHaveAttribute("aria-valuenow", "60");
    await page.getByRole("button", { name: "Masquer les rues", exact: true }).press("Enter");
    await expect(slider).toHaveAttribute("aria-valuenow", "0");
    await slider.press("ArrowUp");
    await expect(slider).toHaveAttribute("aria-valuenow", "1");
    await slider.press("ArrowDown");
    await expect(slider).toHaveAttribute("aria-valuenow", "0");
    await slider.press("End");
    const thumb = (await slider.boundingBox())!;
    const dragTrack = (await page.locator(".street-controls .ui-slider-track").boundingBox())!;
    await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2);
    await page.mouse.down();
    await page.mouse.move(dragTrack.x + dragTrack.width / 2, dragTrack.y + dragTrack.height - 1, {
      steps: 40,
    });
    await page.mouse.up();
    await expect(slider).toHaveAttribute("aria-valuenow", "0");
    await page.getByRole("button", { name: "Afficher les rues", exact: true }).click();
    await expect(slider).toHaveAttribute("aria-valuenow", "100");
    const track = (await page.locator(".street-controls .ui-slider-track").boundingBox())!;
    await page.mouse.click(track.x + track.width / 2, track.y + track.height * 0.8);
    await expect(slider).toHaveAttribute("aria-valuenow", "0");
    await expect(overlay.locator("canvas")).toHaveCount(0);
  });
}

test("touching the street detent or off icon hides streets without moving the map", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    locale: "fr-FR",
  });
  const page = await context.newPage();
  await prepareOfflineMaps(page);
  await page.route("https://tiles.openfreemap.org/planet", (route) =>
    route.fulfill({
      json: {
        tilejson: "3.0.0",
        tiles: ["https://example.test/streets/{z}/{x}/{y}.pbf"],
        maxzoom: 14,
      },
    }),
  );
  await page.route("https://example.test/streets/**", (route) =>
    route.fulfill({ status: 204, body: "" }),
  );
  await page.goto("/#year=1860&lon=1.442&lat=43.602&z=14");
  await waitForApp(page);
  const slider = page.getByRole("slider", { name: "Opacité des rues", exact: true });
  const address = page.url();
  await slider.press("End");
  const track = (await page.locator(".street-controls .ui-slider-track").boundingBox())!;
  await page.touchscreen.tap(track.x + track.width / 2, track.y + track.height * 0.8);
  await expect(slider).toHaveAttribute("aria-valuenow", "0");
  await expect(page.locator(".streets-map canvas")).toHaveCount(0);
  await page.touchscreen.tap(track.x + track.width / 2, track.y + track.height / 2);
  await expect(slider).toHaveAttribute("aria-valuenow", /^(37|38|39)$/);
  const previous = await slider.getAttribute("aria-valuenow");
  await page.getByRole("button", { name: "Masquer les rues", exact: true }).tap();
  await expect(slider).toHaveAttribute("aria-valuenow", "0");
  await page.getByRole("button", { name: "Afficher les rues", exact: true }).tap();
  await expect(slider).toHaveAttribute("aria-valuenow", previous!);
  expect(page.url()).toBe(address);
  await context.close();
});
