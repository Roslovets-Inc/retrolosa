import { expect, test } from "@playwright/test";

import { prepareOfflineMaps, waitForApp } from "./ui";

for (const locale of ["en-GB", "fr-FR"]) {
  test.describe(locale, () => {
    test.use({ locale });
    test("timeline dates do not overlap", async ({ page }) => {
      await prepareOfflineMaps(page);
      await page.goto("/");
      await waitForApp(page);
      for (const [date, short, full] of [
        [450, "V", "5th century"],
        [1195, "XII", "12th century"],
        [1250, "XIII", "13th century"],
      ] as const) {
        const tick = page.locator(`.timeline-ticks button[data-period="${date}"]`);
        if (locale === "en-GB") {
          await expect(tick).toHaveText(short);
          await expect(tick).toHaveAccessibleName(full);
          await tick.focus();
          await expect(page.getByRole("tooltip")).toHaveText(full);
          await tick.press("Escape");
        }
      }
      for (const width of [1440, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 844 });
        const labels = page.locator(".timeline-ticks button:visible");
        let right = 0;
        for (const label of await labels.all()) {
          const bounds = (await label.boundingBox())!;
          expect(bounds.x).toBeGreaterThanOrEqual(right + 2);
          right = bounds.x + bounds.width;
        }
        await page.screenshot({ path: `.local/timeline-${locale}-${width}.png` });
      }
    });
  });
}
