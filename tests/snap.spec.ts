import { test, expect } from "@playwright/test";

import { timelinePosition } from "../src/timeline";
test("timeline snaps close to each source and releases for dragging and keyboard", async ({
  page,
}) => {
  await page.goto("/#mode=time&time=1830");
  await page.evaluate(() => document.fonts.ready);
  const slider = page.getByRole("slider", { name: "Voyage dans le temps" });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const box = (await slider.boundingBox())!;
    const today = new Date().getFullYear();
    // Native range positions account for the 16px thumb.
    const x = (year: number) =>
      box.x +
      8 +
      (box.width - 16) *
        timelinePosition(year, [450, 1250, 1550, 1631, 1680, 1777, 1830, 1875, 1954, today]);
    for (const year of [450, 1250, 1550, 1631, 1680, 1777, 1830, 1875, 1954, today]) {
      const nearby = year === today ? year - 3 : year + 3;
      await page.mouse.move(x(nearby), box.y + box.height / 2);
      await page.mouse.down();
      await expect(slider).toHaveValue(String(year));
      await page.mouse.up();
    }
    await page.mouse.move(x(1954), box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(x(1900), box.y + box.height / 2, { steps: 10 });
    await page.mouse.up();
    expect(Math.abs(Number(await slider.inputValue()) - 1900)).toBeLessThan(3);
    await page
      .locator(".timeline-ticks")
      .getByRole("button", { name: "1954", exact: true })
      .click();
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await expect(slider).toHaveValue("1955");
  }
});
