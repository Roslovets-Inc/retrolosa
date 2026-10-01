import { test, expect } from "@playwright/test";

test("loupe follows dragging and keyboard input and restores after comparison", async ({
  page,
}) => {
  await page.goto("/#mode=loupe&year=1875");
  const glass = page.getByRole("button", { name: "Déplacer la loupe historique" });
  const layer = page.locator(".historic-map");
  await expect(glass).toBeVisible();
  await expect(layer).toHaveCSS("clip-path", /circle\(/);
  const initial = (await glass.boundingBox())!;
  await glass.hover();
  await page.mouse.down();
  await page.mouse.move(initial.x + initial.width / 2 + 100, initial.y + initial.height / 2 + 60);
  await page.mouse.up();
  const dragged = (await glass.boundingBox())!;
  expect(dragged.x).toBeCloseTo(initial.x + 100, 0);
  expect(dragged.y).toBeCloseTo(initial.y + 60, 0);
  await glass.focus();
  await page.keyboard.press("ArrowLeft");
  expect((await glass.boundingBox())!.x).toBeCloseTo(dragged.x - 10, 0);
  await page.locator(".timeline-ticks").getByRole("button", { name: "1830", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Voyage dans le temps" })).toHaveValue("1830");
  const compare = page.getByRole("button", {
    name: "Maintenir pour comparer avec la carte actuelle",
  });
  await compare.focus();
  await page.keyboard.down("Enter");
  await expect(glass).toHaveCount(0);
  await expect(layer).toHaveCSS("clip-path", "none");
  await page.keyboard.up("Enter");
  await expect(glass).toBeVisible();
  await expect(layer).toHaveCSS("clip-path", /circle\(/);
  await page.getByRole("radio", { name: "Rideau", exact: true }).click();
  await expect(glass).toHaveCount(0);
  await expect(page.locator(".divider")).toBeVisible();
});

test("mobile loupe handles touch dragging and cancellation", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/#mode=loupe");
  const glass = page.getByRole("button", { name: "Déplacer la loupe historique" });
  await expect(glass).toBeVisible();
  const before = (await glass.boundingBox())!;
  expect(before.width).toBe(180);
  const session = await context.newCDPSession(page);
  const point = { x: before.x + 90, y: before.y + 90 };
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: point.x + 35, y: point.y + 50 }],
  });
  await session.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
  const after = (await glass.boundingBox())!;
  expect(after.x).toBeCloseTo(before.x + 35, 0);
  expect(after.y).toBeCloseTo(before.y + 50, 0);
  await glass.dispatchEvent("pointermove", { pointerId: 1, clientX: 0, clientY: 0 });
  expect((await glass.boundingBox())!.x).toBeCloseTo(after.x, 0);
  await page.screenshot({ path: ".local/loupe-mobile.png" });
  await context.close();
});
