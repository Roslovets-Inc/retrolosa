import { test, expect } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";
test.beforeEach(async ({ page }) => prepareSharing(page));

test("location opt-in, tracking on both maps, stop and outside coverage", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ longitude: 1.449, latitude: 43.599, accuracy: 12 });
  await page.goto("/");
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });
  await expect(page.locator(".location-dot")).toHaveCount(0);
  await page.getByRole("button", { name: "Me localiser", exact: true }).click();
  await expect(page.locator(".location-dot")).toHaveCount(2);
  await expect(page.locator(".location-notice")).toContainText("précision estimée : 12 m");
  await expect.poll(() => sharedView(page)).toMatch(/lat=43.599000/);
  await context.setGeolocation({ longitude: 1.4488, latitude: 43.5992, accuracy: 10 });
  await expect.poll(() => sharedView(page)).toMatch(/lat=43.599200/);
  await page.getByRole("button", { name: "Cartes", exact: true }).click();
  await page.getByRole("button", { name: "Rideau", exact: true }).click();
  await page.getByRole("button", { name: "Superposition", exact: true }).click();
  await page.getByRole("slider", { name: "Opacité de la carte historique" }).fill("100");
  await expect(page.locator(".historic-map .location-dot")).toBeVisible();
  await page.getByRole("button", { name: "Désactiver la localisation", exact: true }).click();
  await expect(page.locator(".location-dot")).toHaveCount(0);
  await context.setGeolocation({ longitude: 2.35, latitude: 48.85 });
  await page.getByRole("button", { name: "Me localiser", exact: true }).click();
  await expect(page.locator(".location-notice")).toContainText("en dehors du centre de Toulouse");
  await expect(page.locator(".location-dot")).toHaveCount(0);
});

test("denied location explains how to retry", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.geolocation.watchPosition = (_success, error) => {
      setTimeout(
        () =>
          error?.({
            code: 1,
            message: "Denied",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          }),
        0,
      );
      return 1;
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Me localiser", exact: true }).click();
  await expect(page.locator(".location-notice")).toContainText("Autorisez la géolocalisation");
  await expect(page.getByRole("button", { name: "Me localiser", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
});
