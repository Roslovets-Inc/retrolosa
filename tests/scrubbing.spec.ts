import { test, expect } from "@playwright/test";

import { prepareSharing, sharedView } from "./sharing";
test.beforeEach(async ({ page }) => prepareSharing(page));

test("rapid scrubbing survives browser history rate limits", async ({ page }) => {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  await page.addInitScript(() => {
    const replace = history.replaceState.bind(history);
    let count = 0;
    history.replaceState = (...args) => {
      if (++count > 30) throw new DOMException("Too many calls to History API", "SecurityError");
      return replace(...args);
    };
  });
  await page.goto("/#lon=1.44954&lat=43.597678&z=16.7");
  await page.getByRole("button", { name: "Frise", exact: true }).click();
  const slider = page.getByRole("slider", { name: "Voyage dans le temps" });
  await slider.evaluate(async (element) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    for (let i = 0; i < 100; i++) {
      setter.call(element, String(1680 + ((i * 29) % 347)));
      element.dispatchEvent(new Event("input", { bubbles: true }));
      await new Promise(requestAnimationFrame);
    }
  });
  await expect(slider).toBeVisible();
  await slider.fill("1830");
  await expect(page.locator(".timeline-value")).toHaveText("1830");
  await expect.poll(() => sharedView(page)).toMatch(/time=1830/);
  await expect(page.getByRole("button", { name: "Cartes", exact: true })).toBeVisible();
  expect(failures).toEqual([]);
});

test("rejected history writes never blank the application", async ({ page }) => {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  await page.addInitScript(() => {
    history.replaceState = () => {
      throw new DOMException("History writes blocked", "SecurityError");
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Frise", exact: true }).click();
  await page.getByRole("slider", { name: "Voyage dans le temps" }).fill("1900");
  await page.waitForTimeout(700);
  await expect(page.locator(".timeline-value")).toContainText("1875 → 1954");
  await page.getByRole("button", { name: "Cartes", exact: true }).click();
  await page.getByRole("button", { name: "Rideau", exact: true }).click();
  await page.getByRole("button", { name: "Carte de 1830" }).click();
  await expect(page.getByRole("button", { name: "Carte de 1830" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(failures).toEqual([]);
});
