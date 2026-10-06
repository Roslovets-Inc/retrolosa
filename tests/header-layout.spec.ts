import { expect, test } from "@playwright/test";

import { prepareOfflineMaps, waitForApp } from "./ui";

for (const locale of ["en-GB", "fr-FR", "ru-RU"]) {
  test.describe(locale, () => {
    test.use({ locale });
    test("header controls remain inside the header at compact breakpoints", async ({ page }) => {
      await prepareOfflineMaps(page);
      await page.goto("/");
      await waitForApp(page);
      for (const width of [320, 360, 380, 390, 400, 401, 420, 480, 481, 510, 600, 768]) {
        await page.setViewportSize({ width, height: 844 });
        const brand = (await page.locator(".brand").boundingBox())!;
        const controls = (await page.locator(".header-right").boundingBox())!;
        expect(brand.x + brand.width).toBeLessThanOrEqual(controls.x);
        expect(controls.x + controls.width).toBeLessThanOrEqual(width - 10);
        let previousRight = controls.x;
        for (const control of await page.locator(".header-right button").all()) {
          await expect(control).toBeVisible();
          const box = (await control.boundingBox())!;
          expect(box.x).toBeGreaterThanOrEqual(previousRight);
          expect(box.x + box.width).toBeLessThanOrEqual(width - 10);
          previousRight = box.x + box.width;
        }
      }
      await page.setViewportSize({ width: 401, height: 844 });
      const language = page.locator(".language-selector [role='combobox']");
      await expect(language.locator(".ui-select-value")).toHaveCount(1);
      await expect(language.locator(".ui-select-value")).toBeHidden();
      await expect(language.locator(".ui-select-icon")).toBeVisible();
      await expect(page.locator(".language-selector > svg")).toHaveCount(0);
      await page.setViewportSize({ width: 768, height: 844 });
      await expect(language.locator(".ui-select-value")).toBeVisible();
      await expect(language.locator(".ui-select-icon")).toBeVisible();
      await page.setViewportSize({ width: 401, height: 844 });
      await language.locator(".ui-select-icon").click();
      const nextLanguage = locale === "en-GB" ? "fr" : "en";
      await page
        .getByRole("option", { name: nextLanguage === "fr" ? "Français" : "English", exact: true })
        .click();
      await expect(page.locator("html")).toHaveAttribute("lang", nextLanguage);
      await page.reload();
      await waitForApp(page);
      await expect(language).toHaveAttribute("data-value", nextLanguage);
      await page.screenshot({ path: `.local/header-${locale}-401.png` });
    });
  });
}
