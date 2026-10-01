import { test, expect } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";
import { setSlider } from "./ui";
test.beforeEach(async ({ page }) => prepareSharing(page));
test("1830 loads real tiles, preserves view and comparison, survives reload and zoom out", async ({
  page,
  context,
}) => {
  const failures: string[] = [];
  let received1830 = false;
  page.on("response", (r) => {
    if (r.url().includes("tolosa-1830.pmtiles") && r.status() === 206) received1830 = true;
  });
  page.on("pageerror", (e) => failures.push(e.message));
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ longitude: 1.44954, latitude: 43.597678, accuracy: 10 });
  await page.goto("/#lon=1.44954&lat=43.597678&z=16.7");
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });

  await page.getByRole("radio", { name: "Rideau", exact: true }).click();
  await page.getByRole("radio", { name: "Superposition", exact: true }).click();
  await setSlider(page.getByRole("slider", { name: "Opacité de la carte historique" }), 42);
  await page.locator(".timeline-ticks").getByRole("button", { name: "1830", exact: true }).click();
  await expect.poll(() => received1830).toBeTruthy();
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "0.42");
  await expect
    .poll(() => sharedView(page))
    .toMatch(/lon=1.449540?&lat=43.597678&z=16.70?&year=1830/);

  await page.getByRole("radio", { name: "Rideau", exact: true }).click();
  await page.getByRole("radio", { name: "Superposition", exact: true }).click();
  await setSlider(page.getByRole("slider", { name: "Opacité de la carte historique" }), 100);
  await page.screenshot({ path: ".local/1830-desktop.png" });
  await page.getByRole("button", { name: "Me localiser", exact: true }).click();
  await expect(page.locator(".location-dot")).toHaveCount(2);
  await page.locator(".timeline-ticks").getByRole("button", { name: "1680", exact: true }).click();
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });
  await expect(page.locator(".location-dot")).toHaveCount(2);
  await page.locator(".timeline-ticks").getByRole("button", { name: "1830", exact: true }).click();
  await page.goto(await sharedView(page));
  await page.reload();
  await expect(
    page.locator(".timeline-ticks").getByRole("button", { name: "1830", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: ".local/1830-mobile.png" });
  await page.goto("/#lon=1.442&lat=43.602&z=13&year=1830");
  await page.goto(await sharedView(page));
  await page.reload();
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.screenshot({ path: ".local/1830-overview.png" });
  expect(failures).toEqual([]);
});
