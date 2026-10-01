import { test, expect } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";

test("1631 scan loads at overview and overzoom, participates in timeline and sharing", async ({
  page,
}) => {
  await prepareSharing(page);
  const errors: string[] = [];
  const responses: number[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.url().includes("/tavernier-1631/")) responses.push(response.status());
  });
  for (const z of [12, 15.6, 19]) {
    await page.goto(`/#year=1631&lon=1.442&lat=43.602&z=${z}`);
    await page.reload();
    await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({
      timeout: 60000,
    });
    await expect(page.getByRole("button", { name: "Carte de 1631" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
  expect(responses.length).toBeGreaterThan(0);
  expect(responses.every((status) => status === 200)).toBe(true);
  await page.goto("/#year=1631&lon=1.4466&lat=43.5963&z=17&mode=overlay&opacity=55");
  await page.reload();
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });
  await page.screenshot({ path: ".local/1631-nazareth-browser.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#year=1631&lon=1.442&lat=43.602&z=15.6");
  await page.reload();
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });
  await page.screenshot({ path: ".local/1631-mobile.png" });
  await page.getByRole("button", { name: "Frise", exact: true }).click();
  const slider = page.getByRole("slider", { name: "Voyage dans le temps" });
  await expect(slider).toHaveAttribute("min", "450");
  await slider.fill("1655");
  await expect(page.locator(".timeline-value")).toHaveText("1631 → 1680");
  const url = await sharedView(page);
  await page.goto(url);
  await page.reload();
  await expect(slider).toHaveValue("1655");
  await page.getByRole("button", { name: "Époques", exact: true }).click();
  await page.getByRole("checkbox", { name: "XIIIe Reconstruction" }).uncheck();
  await page.getByRole("checkbox", { name: "Ve Reconstruction" }).uncheck();
  await page.getByRole("checkbox", { name: "1550 Héritages du parcellaire" }).uncheck();
  await page.getByRole("checkbox", { name: "1631 Plan · calage approximatif" }).uncheck();
  await expect(slider).toHaveAttribute("min", "1680");
  expect(errors).toEqual([]);
});
