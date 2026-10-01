import { expect, test } from "@playwright/test";

import { prepareOfflineMaps, waitForApp } from "./ui";

test("source descriptions and validation reports load only when the sources dialog opens", async ({
  page,
}) => {
  await prepareOfflineMaps(page);
  const requests: string[] = [];
  page.on("request", (request) => requests.push(new URL(request.url()).pathname));
  await page.goto("/#year=1848&time=1848");
  await waitForApp(page);
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 15000 });
  const detailsRequested = () => requests.includes("/src/epochs/details.ts");
  const reportRequested = () => requests.includes("/data/etat-major-validation.json");
  expect(detailsRequested()).toBe(false);
  expect(reportRequested()).toBe(false);

  const trigger = page.getByRole("button", { name: "À propos des cartes", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Cartes et précision" });
  await expect(dialog.getByRole("heading", { name: "Carte de l’état-major · 1848" })).toBeVisible();
  expect(detailsRequested()).toBe(true);
  expect(reportRequested()).toBe(true);
  await expect(dialog).toContainText("contrôles indépendants");
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();

  const detailRequests = requests.filter((path) => path === "/src/epochs/details.ts").length;
  await page.getByRole("slider", { name: "Voyage dans le temps" }).fill("1250");
  await trigger.click();
  await expect(dialog.getByRole("heading", { name: /Toulouse au XIIIe siècle/ })).toBeVisible();
  expect(requests.filter((path) => path === "/src/epochs/details.ts").length).toBe(detailRequests);
});
