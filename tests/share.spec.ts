import { test, expect } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";
test("address stays stable while sharing captures and restores the current view", async ({
  page,
}) => {
  await prepareSharing(page);
  await page.goto("/#lon=1.44954&lat=43.597678&z=16.7&year=1875");
  const original = page.url();
  await expect(page.getByText("Cartes chargées", { exact: true })).toBeVisible({ timeout: 60000 });
  await page.getByRole("button", { name: "Lieux", exact: true }).click();
  await page.getByRole("combobox").selectOption({ label: "Saint-Cyprien" });
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Cartes", exact: true }).click();
  await page.getByRole("button", { name: "Rideau", exact: true }).click();
  await page.getByRole("button", { name: "Superposition", exact: true }).click();
  await page.getByRole("slider", { name: "Opacité de la carte historique" }).fill("42");
  await page.getByRole("button", { name: "Époques", exact: true }).click();
  await page.getByRole("checkbox", { name: "1830 Cadastre" }).uncheck();
  await page.getByRole("button", { name: "Fermer le choix des époques" }).click();
  expect(page.url()).toBe(original);
  const overlay = await sharedView(page);
  expect(page.url()).toBe(original);
  const params = new URLSearchParams(new URL(overlay).hash.slice(1));
  expect(params.get("lon")).toBe("1.431500");
  expect(params.get("lat")).toBe("43.599000");
  expect(params.get("z")).toBe("15.60");
  expect(params.get("mode")).toBe("overlay");
  expect(params.get("opacity")).toBe("42");
  expect(params.get("layers")).toBe("450,1250,1550,1631,1680,1777,1860,1875,1904,1954");
  await page.goto(overlay);
  await page.reload();
  await expect(page.locator(".historic-map")).toHaveCSS("opacity", "0.42");
  await expect(page.getByRole("button", { name: "Carte de 1875" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "Carte de 1830" })).toHaveCount(0);
  await page.getByRole("button", { name: "Frise", exact: true }).click();
  await page.getByRole("slider", { name: "Voyage dans le temps" }).fill("1850");
  const timeline = await sharedView(page);
  await page.goto(timeline);
  await page.reload();
  await expect(page.getByRole("slider", { name: "Voyage dans le temps" })).toHaveValue("1850");
  await expect(page.locator(".timeline-value")).toHaveText("1777 → 1860");
  await page.getByRole("button", { name: "Cartes", exact: true }).click();
  await page.getByRole("button", { name: "Rideau", exact: true }).click();
  await page.getByRole("slider", { name: "Limite de comparaison" }).focus();
  await page.keyboard.press("Home");
  for (let i = 0; i < 36; i++) await page.keyboard.press("ArrowRight");
  const split = await sharedView(page);
  await page.goto(split);
  await page.reload();
  await expect(page.locator(".historic-map")).toHaveCSS("clip-path", "inset(0px 28% 0px 0px)");
});
test("native sharing cancellation preserves the address and blocked clipboard exposes a copyable link", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        (window as any).nativeShareData = data;
        throw new DOMException("Cancelled", "AbortError");
      },
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw new DOMException("Denied", "NotAllowedError");
        },
      },
    });
  });
  await page.goto("/");
  const original = page.url();
  await page.getByRole("button", { name: "Partager la vue", exact: true }).click();
  expect(await page.evaluate(() => (window as any).nativeShareData.url)).toContain("mode=overlay");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.evaluate(() =>
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined }),
  );
  await page.getByRole("button", { name: "Partager la vue", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Lien de partage" })).toHaveValue(/year=1250/);
  expect(page.url()).toBe(original);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
