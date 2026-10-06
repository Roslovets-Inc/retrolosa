import { expect, test } from "@playwright/test";

import { prepareOfflineMaps } from "./ui";

test.beforeEach(async ({ page }) => {
  await prepareOfflineMaps(page);
  await page.goto("/#mode=overlay&time=1777&opacity=60");
});

test("panels dismiss, restore focus and keep keyboard navigation within a modal", async ({
  page,
}) => {
  const epochs = page.getByRole("button", { name: "Époques", exact: true });
  await epochs.press("Enter");
  const panel = page.getByRole("dialog", { name: "Époques visibles", exact: true });
  await expect(panel).toBeVisible();
  const checkbox = panel.getByRole("checkbox", { name: "1875 Inondation" });
  await checkbox.press("Space");
  await expect(checkbox).not.toBeChecked();
  await expect(panel).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel).toHaveCount(0);
  await expect(epochs).toBeFocused();
  await epochs.click();
  const info = page.getByRole("button", { name: "À propos des cartes" });
  await info.click();
  await expect(panel).toHaveCount(0);
  const dialog = page.getByRole("dialog", { name: "Cartes et précision" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", { name: "Cartes de Toulouse", exact: true }),
  ).toBeVisible();
  const close = dialog.getByRole("button", { name: "Fermer les sources" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("link").last()).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(info).toBeFocused();
});

test("comparison and street visibility work with keyboard and pointer on tall and short screens", async ({
  page,
}) => {
  const overlay = page.getByRole("radio", { name: "Superposition", exact: true });
  const split = page.getByRole("radio", { name: "Rideau", exact: true });
  await overlay.focus();
  await page.keyboard.press("ArrowRight");
  await expect(split).toBeFocused();
  await page.keyboard.press("Space");
  await expect(split).toBeChecked();
  const opacity = page.getByRole("slider", { name: "Opacité des rues" });
  await opacity.press("Home");
  await opacity.press("PageUp");
  await expect(opacity).toHaveAttribute("aria-valuenow", "10");
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "1");
  await opacity.press("Space");
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "1");
  for (const height of [960, 600]) {
    await page.setViewportSize({ width: 390, height });
    await expect(opacity).toHaveAttribute("aria-orientation", "vertical");
    const track = page.locator(".ui-slider-track");
    const box = (await track.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(opacity).toHaveAttribute("aria-valuenow", /^(37|38|39)$/);
  }
});
