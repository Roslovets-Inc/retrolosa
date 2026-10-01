import { test, expect } from "@playwright/test";

import { prepareOfflineMaps, waitForApp } from "./ui";

test("adjacent corrected tiles share IGN fetches and reuse compressed images on a repeat", async ({
  page,
}) => {
  await prepareOfflineMaps(page);
  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("LAYER=GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40"))
      requests.push(request.url());
  });
  await page.goto("/#year=1250");
  await waitForApp(page);
  const result = await page.evaluate(async () => {
    const moduleUrl = "/src/etat-major.ts";
    const { loadStateMajorTile, stateMajorTileOffsets, disposeStateMajorTiles } = await import(
      moduleUrl
    );
    const tiles = [
      [15, 16516, 11966],
      [15, 16517, 11966],
    ];
    const pieces = tiles.map(
      ([z, x, y]) => stateMajorTileOffsets(z, x, y) as { x: number; y: number }[],
    );
    const unique = new Set(pieces.flatMap((items) => items.map(({ x, y }) => `${x}/${y}`))).size;
    try {
      const outputs = await Promise.all(
        tiles.map(([z, x, y]) =>
          loadStateMajorTile({ url: `etat-major://${z}/${x}/${y}` }, new AbortController()),
        ),
      );
      const repeat = await loadStateMajorTile(
        { url: "etat-major://15/16516/11966" },
        new AbortController(),
      );
      return {
        unique,
        unshared: pieces.flat().length,
        sizes: [...outputs, repeat].map((output) => output.data.byteLength),
      };
    } finally {
      disposeStateMajorTiles();
    }
  });
  expect(result.unique).toBeLessThan(result.unshared);
  expect(requests).toHaveLength(result.unique);
  expect(new Set(requests).size).toBe(result.unique);
  expect(result.sizes.every((size) => size > 0)).toBe(true);
});
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
