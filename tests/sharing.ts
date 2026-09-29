import { type Page } from "@playwright/test";
export async function prepareSharing(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as any).sharedUrl = text;
        },
      },
    });
  });
}
export async function sharedView(page: Page) {
  await page.getByRole("button", { name: "Partager la vue", exact: true }).click();
  return await page.evaluate(() => (window as any).sharedUrl as string);
}
