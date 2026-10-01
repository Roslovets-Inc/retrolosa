import { test, expect } from "@playwright/test";

import { timelinePosition } from "../src/timeline";
import { prepareOfflineMaps, waitForApp } from "./ui";

test("snapping to an epoch keeps its neighbours warm without repeated image requests", async ({
  page,
}) => {
  await prepareOfflineMaps(page);
  let requests = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/openedition-1550/map.webp", async (route) => {
    requests++;
    await gate;
    await route.continue();
  });
  await page.goto("/#year=1250&time=1250");
  await waitForApp(page);
  try {
    await expect.poll(() => requests).toBe(1);
    await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({
      timeout: 15000,
    });
  } finally {
    release();
  }
  const slider = page.getByRole("slider", { name: "Voyage dans le temps" });
  const box = (await slider.boundingBox())!;
  const dates = await page
    .locator(".timeline-ticks button")
    .evaluateAll((elements) =>
      elements.map((element) => Number(element.getAttribute("data-period"))),
    );
  const move = async (time: number) => {
    await page.mouse.move(
      box.x + 8 + timelinePosition(time, dates) * (box.width - 16),
      box.y + box.height / 2,
    );
    await expect(slider).toHaveValue(String(time));
  };
  await move(1250);
  await page.mouse.down();
  await move(1370);
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 15000 });
  await move(1250);
  await move(1370);
  await move(1550);
  await move(1370);
  await page.mouse.up();
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 15000 });
  expect(requests).toBe(1);
});

test("retry restores a failed active image without recreating the page or losing the camera", async ({
  page,
}) => {
  await prepareOfflineMaps(page);
  await page.setViewportSize({ width: 390, height: 844 });
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
  await page.getByRole("button", { name: "Fermer le message", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByText("Chargement incomplet des cartes", { exact: true })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Réessayer", exact: true })).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: "Réessayer", exact: true }).click();
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("alert")).toHaveCount(0);
  expect(requests).toBe(2);
  expect(page.url()).toBe(address);
  expect(await canvas!.evaluate((element) => element.isConnected)).toBe(true);
});

for (const map of ["modern", "historic"] as const) {
  test(`${map} WebGL loss and restoration update status without replacing the canvas`, async ({
    page,
  }) => {
    await prepareOfflineMaps(page);
    await page.goto("/#year=1250&lon=1.442&lat=43.602&z=14");
    await waitForApp(page);
    await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({
      timeout: 15000,
    });
    const canvas = await page
      .locator(map === "modern" ? ".map:not(.historic-map) canvas" : ".historic-map canvas")
      .elementHandle();
    expect(canvas).not.toBeNull();
    const address = page.url();
    const context = await canvas!.evaluateHandle((element) => {
      const gl = (element as HTMLCanvasElement).getContext("webgl2")!;
      const extension = gl.getExtension("WEBGL_lose_context");
      if (!extension) throw new Error("WEBGL_lose_context is required for this scenario");
      return { extension, canvas: element };
    });
    await context.evaluate(async ({ extension, canvas: element }) => {
      await new Promise<void>((resolve) => {
        element.addEventListener("webglcontextlost", () => resolve(), { once: true });
        extension.loseContext();
      });
    });
    await expect(page.getByText("Affichage des cartes interrompu", { exact: true })).toHaveCount(1);
    await expect(page.getByText("Cartes chargées", { exact: true })).toHaveCount(0);
    await expect(page.getByText(/En attente de la restauration graphique/)).toBeVisible();
    await context.evaluate(({ extension }) => extension.restoreContext());
    await context.dispose();
    await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/En attente de la restauration graphique/)).toHaveCount(0);
    expect(page.url()).toBe(address);
    expect(await canvas!.evaluate((element) => element.isConnected)).toBe(true);
  });
}

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
