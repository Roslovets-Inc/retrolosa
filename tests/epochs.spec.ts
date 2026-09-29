import { test, expect } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";
test.beforeEach(async ({ page }) => prepareSharing(page));
test("epoch selection skips disabled sources, survives reload and permits an empty selection", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#year=1875&mode=time&time=1875");
  await page.getByRole("button", { name: "Époques", exact: true }).click();
  await page.getByRole("checkbox", { name: "1875 Inondation" }).uncheck();
  await expect(page.locator(".timeline-value")).toHaveText("1830 → 1954");
  await expect(
    page.locator(".timeline-ticks").getByRole("button", { name: "1875", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: ".local/epochs-mobile.png" });
  await expect.poll(() => sharedView(page)).toMatch(/layers=1680%2C1830%2C1954/);
  await page.goto(await sharedView(page));
  await page.reload();
  await page.getByRole("button", { name: "Époques", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "1875 Inondation" })).not.toBeChecked();
  for (const name of ["1680 Cadastre", "1830 Cadastre", "1954 Vue aérienne"])
    await page.getByRole("checkbox", { name }).uncheck();
  await expect(page.getByRole("slider", { name: "Voyage dans le temps" })).toBeDisabled();
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "0");
  await expect(page.locator(".timeline-value")).toHaveText("Actuel");
  await page.getByRole("checkbox", { name: "1875 Inondation" }).check();
  await expect(page.getByRole("slider", { name: "Voyage dans le temps" })).toHaveAttribute(
    "min",
    "1875",
  );
  await page.getByRole("button", { name: "Fermer le choix des époques" }).click();
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
