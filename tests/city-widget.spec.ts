import { test, expect } from "@playwright/test";

test("historical milestones appear only after their date and open readable details", async ({
  page,
}) => {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) => route.abort());
  const dismiss = page.getByRole("button", { name: "Fermer le message" });
  await page.addLocatorHandler(
    dismiss,
    async () => {
      await dismiss.click();
    },
    { noWaitAfter: true },
  );
  await page.goto("/#mode=time&time=1680");
  const widget = page.getByRole("region", { name: "Toulouse à cette époque" });
  const slider = page.getByRole("slider", { name: "Voyage dans le temps" });
  await expect(widget.getByRole("button", { name: /1681/ })).toHaveCount(0);
  await slider.fill("1681");
  const canal = widget.getByRole("button", { name: "1681 · Inauguration du canal du Midi" });
  await canal.click();
  await expect(canal).toHaveAttribute("aria-expanded", "true");
  await expect(widget.getByRole("heading")).toHaveText("1681 · Inauguration du canal du Midi");
  await expect(widget.locator(".city-event-detail")).toContainText("1684");
  await expect(widget.getByRole("link", { name: "Source" })).toHaveAttribute(
    "href",
    "https://archives.toulouse.fr/canal-du-midi/",
  );
  await page.keyboard.press("Escape");
  await expect(widget.getByRole("heading")).toHaveCount(0);
  for (const [year, title, detail, source] of [
    [1218, "Le siège de Toulouse", "Simon de Montfort", "archives.toulouse.fr"],
    [1348, "La Peste Noire", "15 à 30 %", "chu-toulouse.fr"],
    [1562, "Les guerres de Religion", "massacre de protestants", "archives.toulouse.fr"],
    [1628, "La peste de 1628–1631", "10 000 morts", "chu-toulouse.fr"],
  ] as const) {
    const milestone = widget.getByRole("button", { name: `${year} · ${title}`, exact: true });
    await slider.fill(String(year - 1));
    await expect(milestone).toHaveCount(0);
    await slider.fill(String(year));
    await milestone.click();
    await expect(milestone).toHaveAttribute("aria-expanded", "true");
    await expect(widget.getByRole("heading")).toHaveText(`${year} · ${title}`);
    await expect(widget.locator(".city-event-detail")).toContainText(detail);
    await expect(widget.getByRole("link", { name: "Source" })).toHaveAttribute(
      "href",
      new RegExp(source.replaceAll(".", "\\.")),
    );
    await slider.fill(String(year - 1));
    await expect(widget.getByRole("heading")).toHaveCount(0);
  }
  await slider.fill("1875");
  await expect(widget.locator(".city-events button")).toHaveCount(3);
  await page.setViewportSize({ width: 320, height: 700 });
  await widget.getByRole("button", { name: "Repères historiques", exact: true }).click();
  await widget.getByRole("button", { name: "1875 · La grande crue" }).click();
  await expect(widget.getByRole("heading")).toContainText("La grande crue");
  const box = (await widget.boundingBox())!;
  expect(box.x + box.width).toBeLessThanOrEqual(320);
  expect(box.y + box.height).toBeLessThan((await page.locator(".control-dock").boundingBox())!.y);
  await page.screenshot({ path: ".local/city-widget-mobile.png" });
  await slider.fill("450");
  await expect(widget.getByRole("heading")).toHaveCount(0);
  await expect(widget.locator(".city-events button")).toHaveCount(1);
});
