import { test, expect } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";
import { prepareOfflineMaps } from "./ui";
test.beforeEach(async ({ page }) => {
  await prepareSharing(page);
  await prepareOfflineMaps(page);
});
test("epoch selection skips disabled sources, survives reload and permits an empty selection", async ({
  page,
}) => {
  const errors: string[] = [];
  const dismiss = page.getByRole("button", { name: "Fermer le message" });
  await page.addLocatorHandler(
    dismiss,
    async () => {
      await dismiss.click();
    },
    { noWaitAfter: true },
  );
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#year=1875&mode=time&time=1875");
  await page.getByRole("button", { name: "Époques", exact: true }).click();
  await page.getByRole("checkbox", { name: "1875 Inondation" }).uncheck();
  await expect(page.locator(".timeline-value")).toHaveText("1860 → 1904");
  await expect(
    page.locator(".timeline-ticks").getByRole("button", { name: "1875", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: ".local/epochs-mobile.png" });
  await expect
    .poll(() => sharedView(page))
    .toMatch(/layers=450%2C1250%2C1550%2C1631%2C1680%2C1777%2C1830%2C1848%2C1860%2C1904%2C1954/);
  await page.goto(await sharedView(page));
  await page.reload();
  await page.getByRole("button", { name: "Époques", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "1875 Inondation" })).not.toBeChecked();
  for (const name of [
    "XIIIe Reconstruction",
    "Ve Reconstruction",
    "1550 Héritages du parcellaire",
    "1631 Plan · calage approximatif",
    "1680 Cadastre",
    "1777 Plan de Saget",
    "1830 Cadastre",
    "1848 État-major · IGN",
    "1860 Plan de Jourdan",
    "1904 Plan de Laffont",
    "1954 Vue aérienne",
  ])
    await page.getByRole("checkbox", { name }).uncheck();
  await expect(page.getByRole("slider", { name: "Voyage dans le temps" })).toBeDisabled();
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "0");
  await expect(page.locator(".timeline-value")).toHaveText("Actuel");
  await page.getByRole("checkbox", { name: "1875 Inondation" }).check();
  await expect(page.getByRole("slider", { name: "Voyage dans le temps" })).toHaveAttribute(
    "min",
    "1875",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("slider", { name: "Voyage dans le temps" }).fill("1875");
  await expect(page.locator(".timeline-value")).toHaveText("1875 · Inondation");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  ).toBeTruthy();
  await page.getByRole("button", { name: "À propos des cartes" }).click();
  expect(await page.locator("body").innerText()).not.toMatch(/[А-Яа-яЁё]/);
  expect(errors).toEqual([]);
});
