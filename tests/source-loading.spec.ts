import { expect, test } from "@playwright/test";

import { prepareOfflineMaps, waitForApp } from "./ui";

test("sources can close while their module is still loading", async ({ page }) => {
  await prepareOfflineMaps(page);
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/src/components/SourcesDialog.tsx*", async (route) => {
    await pending;
    await route.continue();
  });
  await page.goto("/#year=1250&time=1250");
  await waitForApp(page);
  const trigger = page.getByRole("button", { name: "À propos des cartes", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Cartes et précision" });
  try {
    await expect(dialog.getByRole("status")).toHaveText("Chargement des sources…");
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  } finally {
    release();
  }
  await trigger.click();
  await expect(dialog.getByRole("heading", { name: /Toulouse au XIIIe siècle/ })).toBeVisible();
});

test("a failed sources module preserves the map and reload restores the current view", async ({
  page,
}) => {
  await prepareOfflineMaps(page);
  let unavailable = true;
  let requests = 0;
  await page.route("**/src/components/SourcesDialog.tsx*", async (route) => {
    requests++;
    if (unavailable) await route.fulfill({ status: 503, body: "Unavailable" });
    else await route.continue();
  });
  await page.goto("/#year=1250&time=1250");
  await waitForApp(page);
  const trigger = page.getByRole("button", { name: "À propos des cartes", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Cartes et précision" });
  await expect(dialog.getByRole("alert")).toContainText("continuer à explorer");
  await expect(page.getByRole("main")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await page.getByRole("slider", { name: "Voyage dans le temps" }).fill("1550");
  await trigger.click();
  await expect(dialog.getByRole("alert")).toBeVisible();
  unavailable = false;
  await Promise.all([
    page.waitForEvent("load"),
    dialog.getByRole("button", { name: "Recharger l’application" }).click(),
  ]);
  await waitForApp(page);
  await expect(page.getByRole("slider", { name: "Voyage dans le temps" })).toHaveValue("1550");
  await trigger.click();
  await expect(dialog.getByRole("heading", { name: /1550/ })).toBeVisible();
  expect(requests).toBe(2);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

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
