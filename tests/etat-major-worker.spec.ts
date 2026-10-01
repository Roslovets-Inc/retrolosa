import { test, expect } from "@playwright/test";

import { prepareOfflineMaps, waitForApp } from "./ui";
test("active worker fetches are cancelled and a fresh worker can render after disposal", async ({
  page,
}) => {
  await prepareOfflineMaps(page);
  let requests = 0;
  let aborted = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  page.on("requestfailed", (request) => {
    if (request.url().includes("LAYER=GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40")) aborted++;
  });
  await page.route("https://data.geopf.fr/wmts?**", async (route) => {
    requests++;
    await gate;
    await route.fulfill({
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  });
  await page.goto("/#year=1250");
  await waitForApp(page);
  try {
    await page.evaluate(async () => {
      const moduleUrl = "/src/etat-major.ts";
      const { loadStateMajorTile } = await import(moduleUrl);
      const controller = new AbortController();
      Object.assign(window, {
        abortTile: () => controller.abort(),
        tileResult: loadStateMajorTile({ url: "etat-major://15/16516/11966" }, controller).then(
          () => "rendered",
          (error: Error) => error.name,
        ),
      });
    });
    await expect.poll(() => requests).toBeGreaterThan(0);
    await page.evaluate(() => (window as unknown as { abortTile: () => void }).abortTile());
    expect(
      await page.evaluate(() => (window as unknown as { tileResult: Promise<string> }).tileResult),
    ).toBe("AbortError");
    await expect.poll(() => aborted).toBeGreaterThan(0);
    release();
    const size = await page.evaluate(async () => {
      const moduleUrl = "/src/etat-major.ts";
      const { loadStateMajorTile, disposeStateMajorTiles } = await import(moduleUrl);
      disposeStateMajorTiles();
      try {
        return (
          await loadStateMajorTile({ url: "etat-major://15/16516/11966" }, new AbortController())
        ).data.byteLength;
      } finally {
        disposeStateMajorTiles();
      }
    });
    expect(size).toBeGreaterThan(0);
  } finally {
    release();
  }
});
