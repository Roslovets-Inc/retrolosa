import { test, expect } from "@playwright/test";

import { prepareOfflineMaps, waitForApp } from "./ui";

test("phone layout fills the viewport and keeps population and timeline compact", async ({
  page,
}) => {
  await prepareOfflineMaps(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#year=1860&mode=overlay");
  await waitForApp(page);
  const header = (await page.locator(".masthead").boundingBox())!;
  const widget = page.locator(".population-counter");
  const card = (await widget.boundingBox())!;
  expect(card.y - header.y - header.height).toBe(14);
  await expect(widget.getByRole("group")).toBeVisible();
  await expect(
    widget.getByRole("button", { name: "Repères historiques", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".timeline-current")).toHaveText("1860");
  await expect(page.locator(".timeline-current")).toHaveCSS("position", "absolute");
  await expect(page.locator(".timeline-current")).toHaveCSS("clip", "rect(0px, 0px, 0px, 0px)");
  for (const [width, height] of [
    [600, 844],
    [510, 844],
    [390, 844],
    [320, 568],
    [390, 700],
  ]) {
    await page.setViewportSize({ width, height });
    const main = (await page.locator("main").boundingBox())!;
    const map = (await page.locator(".map").first().boundingBox())!;
    const panel = (await page.locator(".control-panel").boundingBox())!;
    expect(main.y + main.height).toBe(height);
    expect(map.y + map.height).toBe(height);
    const credits = (await page.locator(".map-credits").boundingBox())!;
    expect(credits.y + credits.height).toBeCloseTo(height, 1);
    expect(credits.x).toBe(0);
    expect(credits.width).toBe(width);
    expect(panel.height).toBeLessThanOrEqual(120);
    expect(panel.x + panel.width / 2).toBeCloseTo(width / 2, 1);
    const zoom = (await page.locator(".zoom-controls").boundingBox())!;
    const opacity = (await page.locator(".overlay-controls").boundingBox())!;
    expect(opacity.y - zoom.y - zoom.height).toBeLessThanOrEqual(16);
    expect(opacity.y + opacity.height).toBeLessThan(panel.y);
    const ticks = await page.locator(".timeline-ticks button:visible").all();
    expect(ticks).toHaveLength(await page.locator(".timeline-ticks button").count());
    const rightByRow = new Map<number, number>();
    for (const tick of ticks) {
      const box = (await tick.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(rightByRow.get(box.y) ?? 0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      rightByRow.set(box.y, box.x + box.width);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.screenshot({ path: ".local/mobile-layout.png" });
  await page.setViewportSize({ width: 1440, height: 960 });
  const desktopCredits = (await page.locator(".map-credits").boundingBox())!;
  expect(desktopCredits.y + desktopCredits.height).toBeCloseTo(960, 1);
  expect(desktopCredits.x).toBe(0);
  expect(desktopCredits.width).toBe(1440);
});
