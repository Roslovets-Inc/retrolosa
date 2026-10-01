import { test, expect } from "@playwright/test";

test("population follows time, historical maps and mobile layout without map network", async ({
  page,
}) => {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) => route.abort());
  await page.goto("/#mode=time&time=1600");
  const counter = page.locator(".population-counter");
  const slider = page.getByRole("slider", { name: "Voyage dans le temps" });
  await expect(counter).toContainText("45 000".replace(" ", "\u202f"));
  await slider.fill("1610");
  await expect(counter).toContainText("44 000".replace(" ", "\u202f"));
  await slider.fill(String(new Date().getFullYear()));
  await expect(counter).not.toContainText("Données 2023");
  await expect(counter).toContainText("515 000".replace(" ", "\u202f"));

  await page.locator(".timeline-ticks").getByRole("button", { name: "1830", exact: true }).click();
  await expect(counter).toContainText("1830");
  await expect(counter).toContainText("59 000".replace(" ", "\u202f"));
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(counter).toBeVisible();
  const box = (await counter.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThan(390);
  // Offline map errors are expected; dismiss the notice before testing the counter.
  const dismiss = page.getByRole("button", { name: "Fermer le message" });
  if (await dismiss.isVisible()) await dismiss.click();
  await page.screenshot({ path: ".local/population-mobile.png" });
  await counter.locator(".population-value").click();
  await expect(page.getByRole("heading", { name: "Population de Toulouse" })).toBeVisible();
});
