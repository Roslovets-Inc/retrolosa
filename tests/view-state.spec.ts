import { expect, test } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";
import { prepareOfflineMaps } from "./ui";

test.beforeEach(async ({ page }) => {
  await prepareSharing(page);
  await prepareOfflineMaps(page);
  const dismiss = page.getByRole("button", { name: "Fermer le message" });
  await page.addLocatorHandler(dismiss, () => dismiss.click(), { noWaitAfter: true });
});

test("legacy views preserve their appearance and share the normalized state", async ({ page }) => {
  for (const [mode, opacity] of [
    ["modern", "0"],
    ["historic", "1"],
    ["time", "1"],
    ["split", "1"],
    ["loupe", "1"],
  ]) {
    await page.goto(`/#mode=${mode}&year=1777&lon=1.442&lat=43.602&z=14`);
    await page.reload();
    await expect(page.locator(".historic-map")).toHaveCSS("opacity", opacity);
    const hash = new URL(await sharedView(page)).hash;
    expect(hash).toContain(`mode=${mode === "split" || mode === "loupe" ? mode : "overlay"}`);
    await page.goto(await sharedView(page));
    await page.reload();
    await expect(page.locator(".historic-map")).toHaveCSS("opacity", opacity);
    await expect(page.getByRole("slider", { name: "Voyage dans le temps" })).toHaveValue("1777");
  }
});

test("removing the active epoch clamps time atomically; empty selection survives sharing", async ({
  page,
}) => {
  await page.goto("/#layers=1631,1777&time=1631&mode=split&opacity=72");
  const timeline = page.getByRole("slider", { name: "Voyage dans le temps" });
  await page.getByRole("button", { name: "Époques", exact: true }).click();
  await page.getByRole("checkbox", { name: "1631 Plan · calage approximatif" }).uncheck();
  await expect(timeline).toHaveValue("1777");
  await expect(timeline).toHaveAttribute("min", "1777");
  await page.getByRole("checkbox", { name: "1777 Plan de Saget" }).uncheck();
  await expect(timeline).toBeDisabled();
  await expect(timeline).toHaveValue(String(new Date().getFullYear()));
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "0");
  await page.keyboard.press("Escape");
  const url = await sharedView(page);
  expect(new URL(url).hash).toContain("layers=&mode=split");
  await page.goto(url);
  await expect(timeline).toBeDisabled();
  await expect(page.locator(".timeline-value")).toHaveText("Actuel");
});

test("credits follow the crossfade, modern endpoint and temporary comparison", async ({ page }) => {
  await page.goto("/#layers=1631,1777&time=1704&mode=split&opacity=72&bearing=53");
  const timeline = page.getByRole("slider", { name: "Voyage dans le temps" });
  const credits = page.locator("footer .map-credits");
  await expect(credits).toContainText("Tavernier");
  await expect(credits).toContainText("Saget");
  await expect(page.locator(".timeline-value")).toHaveText("1631 → 1777");
  await page.locator("main").focus();
  await page.keyboard.down("Space");
  await expect(credits).not.toContainText("Tavernier");
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "0");
  await page.keyboard.up("Space");
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "0.72");
  await expect(page.locator(".divider")).toBeVisible();
  await timeline.fill(String(new Date().getFullYear()));
  await expect(credits).not.toContainText("Saget");
  await expect(credits).not.toContainText("Tavernier");
  await expect(page.locator(".timeline-value")).toHaveText("Actuel");
});

test("every epoch exposes its own source details through the catalogue", async ({ page }) => {
  await page.goto("/");
  for (const [year, title] of [
    ["450", "Toulouse à la fin de l’Antiquité"],
    ["1250", "Toulouse au XIIIe siècle"],
    ["1550", "1550 · Héritages"],
    ["1631", "Plan de Melchior Tavernier"],
    ["1680", "Vers 1680"],
    ["1777", "Plan de Joseph Marie de Saget"],
    ["1830", "Cadastre de 1830"],
    ["1848", "Carte de l’état-major"],
    ["1860", "Plan de Jourdan et Rivière"],
    ["1875", "Inondation des 23–24 juin"],
    ["1904", "Plan de Léon Laffont"],
    ["1954", "Vue aérienne de 1954"],
  ]) {
    await page.getByRole("slider", { name: "Voyage dans le temps" }).fill(year);
    await page.getByRole("button", { name: "À propos des cartes", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Cartes et précision" });
    await expect(dialog.getByRole("heading", { name: new RegExp(title) })).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Ouvrir la carte source" })).toHaveAttribute(
      "href",
      /^https:\/\//,
    );
    await page.keyboard.press("Escape");
  }
});
