import { expect, test } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";

test("compass cycles, preserves position and shares its orientation", async ({ page }) => {
  await prepareSharing(page);
  // Remote layers are intentionally offline; their notice must not cover controls.
  const dismiss = page.getByRole("button", { name: "Fermer le message" });
  await page.addLocatorHandler(
    dismiss,
    async () => {
      await dismiss.click();
    },
    { noWaitAfter: true },
  );
  await page.route(/^https:\/\//, async (route) => {
    if (route.request().url().includes("tiles.openfreemap.org/styles/positron")) {
      await route.fulfill({ json: { version: 8, sources: {}, layers: [] } });
    } else await route.abort();
  });
  await page.goto("/#year=1777&mode=time&time=1777&lon=1.442&lat=43.602&z=14&opacity=100");
  const compass = page.getByRole("button", { name: /^Orientation :/ });
  for (const bearing of [53, 0]) {
    await compass.click();
    await expect(compass).toHaveAttribute("data-bearing", String(bearing));
    await expect
      .poll(async () => new URL(await sharedView(page)).hash)
      .toContain(`bearing=${bearing}`);
  }
  await compass.click();
  const url = await sharedView(page);
  expect(url).toContain("lon=1.442000&lat=43.602000&z=14.00");
  await page.goto(url);
  await page.reload();
  await expect(compass).toHaveAttribute("data-bearing", "53");
  await page.getByRole("button", { name: "Vue d’ensemble de Toulouse" }).click();
  await expect.poll(async () => new URL(await sharedView(page)).hash).toContain("bearing=53");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(compass).toBeVisible();
  const box = (await compass.boundingBox())!;
  const eye = (await page.locator(".compare-hold").boundingBox())!;
  expect(box.y + box.height).toBeLessThan(eye.y);
  await page.screenshot({ path: ".local/orientation-mobile.png" });
  await compass.press("Enter");
  await expect(compass).toHaveAttribute("data-bearing", "0");
  const slider = page.getByRole("slider", { name: "Voyage dans le temps" });
  await slider.fill("1631");
  await expect(compass).toHaveAttribute("data-bearing", "0");
  await compass.click();
  await expect(compass).toHaveAttribute("data-bearing", "84");
  await slider.fill("1656");
  await expect(compass).toHaveAttribute("data-bearing", "0");
  await expect(compass).toBeDisabled();
  await slider.fill("1730");
  await expect(compass).toHaveAttribute("data-bearing", "53");
  await expect(compass).toBeEnabled();
  await slider.fill("1860");
  await expect(compass).toHaveAttribute("data-bearing", "0");
  await expect(compass).toBeDisabled();
  await slider.fill("1777");
  await expect(compass).toHaveAttribute("data-bearing", "53");
  await compass.click();
  await slider.fill("1631");
  await expect(compass).toHaveAttribute("data-bearing", "0");
  await compass.click();

  await page.locator(".timeline-ticks").getByRole("button", { name: "1777", exact: true }).click();
  await expect(compass).toHaveAttribute("data-bearing", "53");
  await page.locator(".timeline-ticks").getByRole("button", { name: "1904", exact: true }).click();
  await expect(compass).toBeDisabled();
  await expect(compass).toHaveAttribute("data-bearing", "0");
});
