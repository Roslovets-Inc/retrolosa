import { expect, test } from "@playwright/test";

test("tooltips support hover, keyboard dismissal and both themes without viewport clipping", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.route(/^https:\/\//, async (route) => {
    if (/tiles.openfreemap.org\/styles\/(positron|dark)$/.test(route.request().url()))
      await route.fulfill({ json: { version: 8, sources: {}, layers: [] } });
    else
      await route.fulfill({
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          "base64",
        ),
      });
  });
  await page.goto("/#time=1777");
  const theme = page.getByRole("button", { name: /^Thème :/ });
  const tooltip = page.locator(".tooltip");
  const accessibleTooltip = page.getByRole("tooltip");
  await expect(page.locator("main [title]")).toHaveCount(0);
  await theme.hover();
  await expect(tooltip).toContainText("Thème : système");
  await expect(theme).toHaveAttribute(
    "aria-describedby",
    (await accessibleTooltip.getAttribute("id")) as string,
  );
  await tooltip.hover();
  await expect(tooltip).toBeVisible();
  await page.mouse.move(600, 400, { steps: 10 });
  await expect(tooltip).toHaveCount(0);
  await page.getByRole("link", { name: "Rétrolosa", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(theme).toBeFocused();
  await expect(tooltip).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tooltip).toHaveCount(0);
  await expect(theme).toBeFocused();
  await expect(theme).not.toHaveAttribute("aria-describedby");
  await theme.press("Enter");
  await expect(tooltip).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const info = page.getByRole("button", { name: "À propos des cartes" });
  await info.hover();
  await expect(accessibleTooltip).toHaveText("À propos des cartes");
  await expect(tooltip).toHaveCSS("background-color", "rgb(250, 249, 242)");
  await theme.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 700 });
    await page.mouse.move(150, 350, { steps: 10 });
    await info.hover();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveCSS("background-color", "rgb(35, 46, 40)");
    const box = (await tooltip.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(8);
    expect(box.x + box.width).toBeLessThanOrEqual(width - 8);
    expect(box.y).toBeGreaterThanOrEqual(8);
    expect(box.y + box.height).toBeLessThanOrEqual(692);
    await page.screenshot({ path: `.local/tooltips-${width}.png` });
  }
  await page.mouse.move(150, 350, { steps: 10 });
  await page.locator("main").focus();
  await expect(tooltip).toHaveCount(0);
  await theme.dispatchEvent("pointerover", { pointerType: "touch" });
  const timeline = page.getByRole("slider", { name: "Voyage dans le temps" });
  await timeline.dispatchEvent("pointerdown", { pointerType: "touch" });
  await timeline.focus();
  await page.waitForTimeout(400);
  await expect(tooltip).toHaveCount(0);
});
