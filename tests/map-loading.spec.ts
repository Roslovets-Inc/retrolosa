import { test, expect } from "@playwright/test";

import { prepareOfflineMaps, waitForApp } from "./ui";

test("retry restores a failed active image without recreating the page or losing the camera", async ({
  page,
}) => {
  await prepareOfflineMaps(page);
  let fail = true;
  let requests = 0;
  await page.route("**/openedition-13c/map.webp", async (route) => {
    requests++;
    if (fail) await route.fulfill({ status: 503, body: "unavailable" });
    else await route.continue();
  });
  await page.goto("/#year=1250&lon=1.442&lat=43.602&z=14");
  await waitForApp(page);
  await expect(page.getByRole("alert")).toContainText(
    "Chargement incomplet de la carte historique",
  );
  await expect(page.getByText("Cartes chargées", { exact: true })).toHaveCount(0);
  const canvas = await page.locator(".historic-map canvas").elementHandle();
  const address = page.url();
  fail = false;
  await page.getByRole("button", { name: "Réessayer", exact: true }).click();
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(requests).toBe(2);
  expect(page.url()).toBe(address);
  expect(await canvas!.evaluate((element) => element.isConnected)).toBe(true);
});

test("inactive archives are not fetched and switching epochs resets loading", async ({ page }) => {
  await prepareOfflineMaps(page);
  const archives: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes(".pmtiles")) archives.push(request.url());
  });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/openedition-1550/map.webp", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/#year=1250");
  await waitForApp(page);
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 15000 });
  await page.getByRole("slider", { name: "Voyage dans le temps" }).fill("1550");
  await expect(page.getByText("Chargement des cartes…", { exact: true })).toHaveCount(1);
  release();
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 15000 });
  expect(archives).toEqual([]);
});
