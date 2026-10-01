import { test, expect } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";

test("state-major correction keeps fractional tile seams opaque and cancels requests", async ({
  page,
}) => {
  await page.route(/^https:\/\//, (route) => route.abort());
  await page.goto("/");
  const fixtureBytes = await page.evaluate(async () => {
    const canvas = new OffscreenCanvas(256, 256);
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#397bad";
    context.fillRect(0, 0, 256, 256);
    return Array.from(
      new Uint8Array(await (await canvas.convertToBlob({ type: "image/png" })).arrayBuffer()),
    );
  });
  await page.route("https://data.geopf.fr/wmts?**", (route) =>
    route.fulfill({ body: Buffer.from(fixtureBytes), contentType: "image/png" }),
  );
  const result = await page.evaluate(async () => {
    const moduleUrl = "/src/etat-major.ts";
    const { loadStateMajorTile } = await import(moduleUrl);
    const fixture = new OffscreenCanvas(256, 256);
    const context = fixture.getContext("2d")!;
    const alphas: number[] = [];
    for (const [z, x, y] of [
      [6, 32, 23],
      [15, 16516, 11966],
      [15, 16517, 11966],
    ]) {
      const { data } = await loadStateMajorTile(
        { url: `etat-major://${z}/${x}/${y}` },
        new AbortController(),
      );
      const bitmap = await createImageBitmap(new Blob([data], { type: "image/png" }));
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      const pixels = context.getImageData(0, 0, 256, 256).data;
      alphas.push(Math.min(...Array.from(pixels).filter((_value, index) => index % 4 === 3)));
    }
    const cancelled = new AbortController();
    cancelled.abort();
    let aborted = false;
    try {
      await loadStateMajorTile({ url: "etat-major://15/16515/11965" }, cancelled);
    } catch (error) {
      aborted = error instanceof DOMException && error.name === "AbortError";
    }
    return { alphas, aborted };
  });
  expect(result).toEqual({ alphas: [255, 255, 255], aborted: true });
});

test("1848 state-major loads IGN tiles and follows the timeline, sources and shared view", async ({
  page,
}) => {
  await prepareSharing(page);
  let tiles = 0;
  await page.route(/^https:\/\//, async (route) => {
    const url = new URL(route.request().url());
    if (/^\/styles\/(positron|dark)$/.test(url.pathname)) {
      await route.fulfill({ json: { version: 8, sources: {}, layers: [] } });
    } else if (url.searchParams.get("LAYER") === "GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40") {
      expect(url.searchParams.get("TILEMATRIXSET")).toBe("PM_6_15");
      expect(Number(url.searchParams.get("TILEMATRIX"))).toBeLessThanOrEqual(15);
      tiles++;
      await route.fulfill({
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          "base64",
        ),
        contentType: "image/png",
        headers: { "access-control-allow-origin": "*" },
      });
    } else await route.abort();
  });
  await page.goto("/#year=1848&time=1848&mode=overlay&z=14");
  const slider = page.getByRole("slider", { name: "Voyage dans le temps" });
  await expect(slider).toHaveValue("1848");
  await expect(slider).toHaveAttribute("aria-valuetext", "1848 · État-major");
  await expect.poll(() => tiles).toBeGreaterThan(0);
  await expect(page.locator("footer")).toContainText("IGN · État-major 1848");
  await expect(page.locator(".orientation-button")).toHaveAttribute("data-bearing", "0");
  const url = await sharedView(page);
  expect(url).toContain("year=1848");
  expect(url).toContain("time=1848");
  await page.goto(url);
  await expect(slider).toHaveValue("1848");
  await page.getByRole("button", { name: "À propos des cartes" }).click();
  const dialog = page.getByRole("dialog", { name: "Cartes et précision" });
  await expect(dialog.getByRole("heading", { name: "Carte de l’état-major · 1848" })).toBeVisible();
  await expect(dialog).toContainText("230 NO");
  await expect(dialog).toContainText("compléments ultérieurs");
  await expect(dialog).toContainText("Licence Ouverte 2.0");
  await page.getByRole("button", { name: "Fermer les sources" }).click();
  await slider.fill("1850");
  await expect(slider).toHaveAttribute("aria-valuetext", "1848 → 1860");
  await page.getByRole("button", { name: "Époques", exact: true }).click();
  await page.getByRole("checkbox", { name: "1848 État-major · IGN" }).uncheck();
  await page.keyboard.press("Escape");
  await expect(slider).toHaveAttribute("aria-valuetext", "1830 → 1860");
  await expect(page.locator("footer")).not.toContainText("État-major");
  await expect(page.locator(".timeline-ticks").getByRole("button", { name: "1848" })).toHaveCount(
    0,
  );
});

test("live IGN state-major tiles render at the verified 1848 epoch", async ({ page }) => {
  let requested = 0;
  let received = 0;
  const failures: string[] = [];
  const isStateMajor = (url: string) => url.includes("LAYER=GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40");
  page.on("request", (request) => {
    if (isStateMajor(request.url())) requested++;
  });
  page.on("requestfailed", (request) => {
    if (isStateMajor(request.url())) failures.push(request.failure()?.errorText ?? "Failed tile");
  });
  page.on("response", (response) => {
    if (
      isStateMajor(response.url()) &&
      response.ok() &&
      response.headers()["content-type"]?.startsWith("image/")
    )
      received++;
    else if (isStateMajor(response.url())) failures.push(String(response.status()));
  });
  await page.route(/^https:\/\//, async (route) => {
    const url = new URL(route.request().url());
    if (/^\/styles\/(positron|dark)$/.test(url.pathname))
      await route.fulfill({ json: { version: 8, sources: {}, layers: [] } });
    else if (url.searchParams.get("LAYER") === "GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40")
      await route.continue();
    else await route.abort();
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#year=1848&time=1848&mode=overlay&opacity=100&lon=1.444&lat=43.604&z=13.6");
  await expect.poll(() => received, { timeout: 30000 }).toBeGreaterThan(0);
  await expect.poll(() => received === requested, { timeout: 30000 }).toBe(true);
  expect(failures).toEqual([]);
  // Other historical services are deliberately blocked; their combined loading status is irrelevant.
  const dismiss = page.getByRole("button", { name: "Fermer le message" });
  if (await dismiss.isVisible()) await dismiss.click();
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "1");
  await page.screenshot({ path: ".local/etat-major-1848-mobile.png" });
});
