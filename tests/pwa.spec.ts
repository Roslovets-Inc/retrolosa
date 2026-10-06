import { expect, test } from "@playwright/test";

import { prepareOfflineMaps, waitForApp } from "./ui";

const base = process.env.VITE_BASE_PATH || "/";
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.addEventListener(
      "beforeinstallprompt",
      (event) => {
        // Real browser installability timing must not decide which guide the UI tests exercise.
        if (event.isTrusted) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      },
      { capture: true },
    );
  });
  await prepareOfflineMaps(page);
});

test("installation metadata and icons use the deployment scope", async ({ page, request }) => {
  await page.goto(base);
  await waitForApp(page);
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    `${base}manifest.webmanifest`,
  );
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    "content",
    /viewport-fit=cover/,
  );
  await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute(
    "content",
    "default",
  );
  const response = await request.get(`${base}manifest.webmanifest`);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    id: base,
    start_url: base,
    scope: base,
    display: "standalone",
    lang: "en",
  });
  for (const icon of manifest.icons) {
    expect(icon.src.startsWith(base)).toBe(true);
    const image = await request.get(icon.src);
    expect(image.ok()).toBe(true);
    const bytes = await image.body();
    expect(bytes.subarray(1, 4).toString()).toBe("PNG");
    const size = Number(icon.sizes.split("x")[0]);
    expect(bytes.readUInt32BE(16)).toBe(size);
    expect(bytes.readUInt32BE(20)).toBe(size);
  }
  const apple = await request.get(`${base}icons/apple-touch-icon.png`);
  expect((await apple.body()).readUInt32BE(16)).toBe(180);
});

test("mobile installation guide supports both phones, dark mode and keyboard dismissal", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  const trigger = page.getByRole("button", { name: "Installer Rétrolosa", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Installer Rétrolosa" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("Safari");
  await expect(dialog).toContainText("connexion Internet");
  await page.screenshot({ path: ".local/pwa-iphone.png" });
  await page.getByRole("button", { name: "Android", exact: true }).click();
  await expect(dialog).toContainText("Chrome");
  await expect(dialog).not.toContainText("Safari");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.getByRole("button", { name: /^Thème :/ }).click();
  await page.getByRole("button", { name: /^Thème :/ }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await trigger.click();
  await page.screenshot({ path: ".local/pwa-android-dark.png" });
  for (const [width, height] of [
    [320, 568],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    const box = (await dialog.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole("button", { name: "Fermer l’installation" }).click();
    const controls = await page.locator(".header-right").boundingBox();
    const brand = await page.locator(".brand").boundingBox();
    expect(controls!.x).toBeGreaterThanOrEqual(brand!.x + brand!.width);
    await trigger.click();
  }
});

test("native install prompt is used once and dismissal keeps the manual guide available", async ({
  page,
}) => {
  await page.goto(base);
  await waitForApp(page);
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        document.documentElement.dataset.installPrompts = "1";
      },
      userChoice: Promise.resolve({ outcome: "dismissed" }),
    });
    window.dispatchEvent(event);
  });
  await page.getByRole("button", { name: "Installer Rétrolosa", exact: true }).click();
  const install = page.getByRole("button", { name: "Installer l’application", exact: true });
  await expect(install).toBeVisible();
  await install.click();
  await expect(page.locator("html")).toHaveAttribute("data-install-prompts", "1");
  await expect(install).toHaveCount(0);
  await expect(page.getByRole("dialog")).toContainText("quand vous le souhaitez");
  await expect(page.getByRole("button", { name: "iPhone / iPad" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(page.getByRole("button", { name: "Installer Rétrolosa", exact: true })).toHaveCount(
    0,
  );
});

test("installed iPhone hides installation and preserves the map controls", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "standalone", { get: () => true }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await waitForApp(page);
  await expect(page.getByRole("button", { name: "Installer Rétrolosa", exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByRole("slider", { name: "Voyage dans le temps" })).toBeVisible();
  await page.screenshot({ path: ".local/pwa-standalone.png" });
});

test("production shell launches offline without caching maps", async ({ page, context }, info) => {
  test.skip(
    info.project.name !== "pwa-production",
    "Service workers are deliberately disabled in development.",
  );
  await page.goto(`${base}#time=1777`);
  await waitForApp(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) =>
        navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), {
          once: true,
        }),
      );
    }
  });
  const cached = await page.evaluate(async () => {
    const names = (await caches.keys()).filter((name) => name.startsWith("retrolosa-shell-"));
    const cache = await caches.open(names[0]);
    return (await cache.keys()).map((request) => new URL(request.url).pathname);
  });
  expect(cached).toContain(`${base}index.html`);
  expect(cached.some((path) => /SourcesDialog.*\.js$/.test(path))).toBe(true);
  expect(cached.some((path) => /\.(webp|jpg|pmtiles)$/.test(path))).toBe(false);
  expect(cached.every((path) => path.startsWith(base))).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await waitForApp(page);
  await expect(page.getByText("Vous êtes hors connexion.", { exact: false })).toBeVisible();
  await expect(page.locator(".timeline-value")).toContainText("1777");
  await page.getByRole("button", { name: "À propos des cartes", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Saget");
  await context.setOffline(false);
  await page.keyboard.press("Escape");
  await expect(page.locator(".offline-notice")).toHaveCount(0);
});

test("iOS standalone startup selects a contained viewport and preserves app bounds", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "standalone", { get: () => true });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await waitForApp(page);
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute(
    "content",
    "width=device-width, initial-scale=1.0, viewport-fit=auto",
  );
  await expect(page.locator('meta[name="apple-mobile-web-app-status-bar-style"]')).toHaveAttribute(
    "content",
    "default",
  );
  const app = (await page.locator("main").boundingBox())!;
  expect(app.y).toBe(0);
  expect(app.y + app.height).toBe(844);
  const header = (await page.locator(".masthead").boundingBox())!;
  expect(header.y).toBe(0);
  const footer = (await page.locator("footer").boundingBox())!;
  expect(footer.y + footer.height).toBe(844);
});
