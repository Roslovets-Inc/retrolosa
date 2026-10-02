import { expect, test, type Page } from "@playwright/test";

import { prepareOfflineMaps, waitForApp } from "./ui";

async function chooseLanguage(page: Page, label: string, language: "en" | "fr" | "ru") {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page
    .getByRole("option", {
      name: { en: "English", fr: "Français", ru: "Русский" }[language],
      exact: true,
    })
    .click();
}

test.beforeEach(async ({ page }) => {
  await prepareOfflineMaps(page);
});

for (const [locale, language, label] of [
  ["en-GB", "en", "Language"],
  ["fr-CA", "fr", "Langue"],
  ["ru-RU", "ru", "Язык"],
  ["ru-KZ", "ru", "Язык"],
  ["de-DE", "en", "Language"],
] as const) {
  test(`browser locale ${locale} selects ${language}`, async ({ browser }) => {
    const context = await browser.newContext({ locale });
    const page = await context.newPage();
    await prepareOfflineMaps(page);
    await page.goto("/");
    await waitForApp(page);
    await expect(page.locator("html")).toHaveAttribute("lang", language);
    await expect(page.getByRole("combobox", { name: label, exact: true })).toHaveAttribute(
      "data-value",
      language,
    );
    await expect(
      page.getByRole("button", {
        name: { en: "About the maps", fr: "À propos des cartes", ru: "О картах" }[language],
      }),
    ).toBeVisible();
    await context.close();
  });
}

test("switching updates content, keeps the map and view, and survives reload", async ({ page }) => {
  await page.goto("/#year=450&time=1993&mode=split");
  await waitForApp(page);
  const initialURL = page.url();
  const canvases = await page.locator("canvas").elementHandles();
  await chooseLanguage(page, "Langue", "en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("slider", { name: "Time travel", exact: true })).toHaveValue("1993");
  await expect(page.getByRole("button", { name: "1993 · The first metro" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Curtain", exact: true })).toHaveAttribute(
    "data-state",
    "on",
  );
  expect(page.url()).toBe(initialURL);
  await page.getByRole("button", { name: "Places", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: "Entire city centre", exact: true })).toHaveCount(
    1,
  );
  await page.keyboard.press("Escape");
  for (const canvas of canvases)
    expect(await canvas.evaluate((element) => element.isConnected)).toBe(true);
  await page.getByRole("button", { name: "1993 · The first metro" }).click();
  await expect(page.locator(".city-event-detail")).toContainText("26 June 1993");
  await page.reload();
  await waitForApp(page);
  await expect(page.getByRole("combobox", { name: "Language", exact: true })).toHaveAttribute(
    "data-value",
    "en",
  );
  await chooseLanguage(page, "Language", "fr");
  await expect(page.getByRole("slider", { name: "Voyage dans le temps", exact: true })).toHaveValue(
    "1993",
  );
});

test("lazy sources and install guide switch languages", async ({ page }) => {
  await page.goto("/#year=1195&time=1195");
  await waitForApp(page);
  await chooseLanguage(page, "Langue", "en");
  await page.getByRole("button", { name: "About the maps" }).click();
  await expect(
    page.getByRole("heading", { name: "Toulouse in the 12th century · three reconstructed areas" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("do not guarantee historical accuracy");
  await expect(page.getByRole("dialog")).not.toContainText("{{");
  await page.getByRole("button", { name: "Close sources" }).click();
  await chooseLanguage(page, "Language", "fr");
  await page.getByRole("button", { name: "À propos des cartes" }).click();
  await expect(
    page.getByRole("heading", { name: "Toulouse au XIIe siècle · trois secteurs reconstruits" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fermer les sources" }).click();
  await chooseLanguage(page, "Langue", "en");
  await page.getByRole("button", { name: "Install Rétrolosa", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Add to Home Screen");
});

test("Russian selection preserves the view, persists, and translates deferred content", async ({
  page,
}) => {
  await page.goto("/#year=1195&time=1993&mode=split");
  await waitForApp(page);
  const initialURL = page.url();
  const canvases = await page.locator("canvas").elementHandles();
  await chooseLanguage(page, "Langue", "ru");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "Исследуйте Тулузу сквозь века: от исторических карт до современных улиц.",
  );
  await expect(
    page.getByRole("slider", { name: "Путешествие во времени", exact: true }),
  ).toHaveValue("1993");
  await expect(page.getByRole("radio", { name: "Шторка", exact: true })).toHaveAttribute(
    "data-state",
    "on",
  );
  expect(page.url()).toBe(initialURL);
  for (const canvas of canvases)
    expect(await canvas.evaluate((element) => element.isConnected)).toBe(true);
  await page.getByRole("button", { name: "1993 · Первая линия метро" }).click();
  await expect(page.locator(".city-event-detail")).toContainText("26 июня 1993 года");
  await page.reload();
  await waitForApp(page);
  await expect(page.getByRole("combobox", { name: "Язык", exact: true })).toHaveAttribute(
    "data-value",
    "ru",
  );
  await page.getByRole("button", { name: "Места", exact: true }).click();
  await expect(
    page.getByRole("menuitem", { name: "Весь центр города", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.goto("/#year=1195&time=1195");
  // Shared view fragments are read only at startup, not on same-document navigation.
  await page.reload();
  await waitForApp(page);
  await page.getByRole("button", { name: "О картах", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Тулуза в XII веке · три реконструированных участка" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toContainText("не гарантируют исторической достоверности");
  await expect(page.getByRole("dialog")).not.toContainText("{{");
  await page.getByRole("button", { name: "Закрыть источники" }).click();
  await page.getByRole("button", { name: "Установить Rétrolosa", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("На экран «Домой»");
  await page.getByRole("button", { name: "Android", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Добавить на главный экран");
});

test("mobile selector fits and works with blocked storage", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Storage blocked", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage blocked", "SecurityError");
    };
  });
  await page.goto("/");
  await waitForApp(page);
  const selector = page.getByRole("combobox", { name: "Langue", exact: true });
  await expect(selector).toBeVisible();
  await chooseLanguage(page, "Langue", "en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await chooseLanguage(page, "Language", "ru");
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("combobox", { name: "Язык", exact: true })).toContainText("Русский");
  const bounds = await page.locator(".header-right").boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  await page.screenshot({ path: ".local/i18n-mobile.png" });
});

test("active map failures and location markers update when the language changes", async ({
  page,
}) => {
  await page.route("**/openedition-13c/display.webp*", (route) => route.fulfill({ status: 503 }));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: {
        watchPosition: (success: PositionCallback) => {
          window.setTimeout(
            () =>
              success({
                coords: { longitude: 1.4436, latitude: 43.604, accuracy: 12 },
              } as GeolocationPosition),
            0,
          );
          return 1;
        },
        clearWatch: () => {},
      },
    });
  });
  await page.goto("/#year=1250&time=1250");
  await waitForApp(page);
  await expect(page.getByRole("alert")).toContainText("Chargement incomplet");
  await page.getByRole("button", { name: "Me localiser", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "Ma position · précision estimée : 12 m", exact: true }),
  ).toHaveCount(2);
  await chooseLanguage(page, "Langue", "en");
  await expect(page.getByRole("alert")).toContainText(
    "historical map could not fully load · 13th c. · Reconstruction",
  );
  await expect(
    page.getByRole("img", { name: "My position · estimated accuracy: 12 m", exact: true }),
  ).toHaveCount(2);
  await expect(page.locator(".location-notice")).toContainText("Location tracking active");
  await chooseLanguage(page, "Language", "ru");
  await expect(page.getByRole("alert")).toContainText(
    "Не удалось полностью загрузить карту: историческая · XIII век · Реконструкция",
  );
  await expect(
    page.getByRole("img", { name: "Моё местоположение · оценка точности: 12 м", exact: true }),
  ).toHaveCount(2);
  await expect(page.locator(".location-notice")).toContainText(
    "Отслеживание местоположения включено",
  );
});

test("styled language menu supports keyboard selection and dismissal in both themes", async ({
  page,
}) => {
  await page.goto("/");
  await waitForApp(page);
  const trigger = page.getByRole("combobox", { name: "Langue", exact: true });
  await trigger.focus();
  await trigger.press("Enter");
  await expect(page.getByRole("listbox")).toBeVisible();
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const englishTrigger = page.getByRole("combobox", { name: "Language", exact: true });
  await expect(englishTrigger).toBeFocused();
  for (const theme of ["light", "dark"]) {
    await page.evaluate(
      (value) => document.documentElement.setAttribute("data-theme", value),
      theme,
    );
    await englishTrigger.click();
    await expect(page.locator(".ui-select-content")).toBeVisible();
    await expect(page.getByRole("option", { name: "English", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.screenshot({ path: ".local/language-menu-" + theme + ".png" });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(englishTrigger).toBeFocused();
  }
});
