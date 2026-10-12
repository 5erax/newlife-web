import { test, expect, type Page } from "@playwright/test";
import { newLife } from "../../src/engine/game";
import { serialize } from "../../src/engine/save";
import { createAsset, addLog } from "../../src/engine/helpers";
import { stories } from "../../src/content/catalog";
import ui from "../../src/i18n/vi.json" with { type: "json" };
const nav = (page: Page, label: string) =>
  page.locator("nav").getByRole("button", { name: new RegExp(label + "$") });
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const original = crypto.getRandomValues.bind(crypto);
    crypto.getRandomValues = ((array: Uint32Array<ArrayBuffer>) => {
      if (array instanceof Uint32Array && array.length === 1) {
        array[0] = 42;
        return array;
      }
      return original(array);
    }) as typeof crypto.getRandomValues;
  });
});
async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(ui.startLife) }).click();
  await expect(page.locator(".game-shell")).toBeVisible();
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
}
async function resolve(page: Page) {
  for (let i = 0; i < 5 && (await page.locator("dialog").count()); i++) {
    await page.locator("dialog .choice:not(:disabled)").first().click();
    await expect(page.locator(".save-status")).toHaveText(ui.saved);
  }
}
async function importMature(page: Page) {
  const s = newLife({
    name: "Nguyễn Tên Rất Dài Có Dấu & <script> chỉ là văn bản",
    gender: "female",
    hometown: "Đà Nẵng",
    birthDate: "2000-01-01",
    seed: 42,
  });
  s.age = 35;
  s.money = 20_000_000_000;
  s.education.completed = [
    "edu_primary",
    "edu_lower_secondary",
    "edu_upper_secondary",
    "edu_university",
  ];
  s.education.score = 95;
  s.education.specialty = "congnghe";
  s.stats = { health: 95, happiness: 90, intelligence: 95, looks: 90 };
  for (const id of ["asset_nha_01", "asset_xe_02", "asset_thucung_01"])
    createAsset(s, id);
  for (let i = 0; i < 550; i++)
    addLog(s, "Một ngày thử nghiệm với một dòng nhật ký dài.");
  await nav(page, ui.saves).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "mature.json",
    mimeType: "application/json",
    buffer: Buffer.from(serialize(s)),
  });
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: ui.importNewSlot, exact: true })
    .click();
  await expect(page.locator(".dock-profile")).toContainText(s.name);
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
  return s;
}
test("pending choice survives reload, keyboard choice and rapid age clicks", async ({
  page,
}) => {
  await start(page);
  await page.locator(".age-button").dblclick();
  await expect(page.getByRole("dialog")).toBeVisible();
  const text = await page.locator("dialog").textContent();
  await page.reload();
  await expect(page.locator("dialog")).toHaveText(text!);
  await page.keyboard.press("1");
  await resolve(page);
  await expect(page.locator(".dock-profile")).toContainText("1 tuổi");
  await nav(page, ui.saves).click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: ui.export, exact: true })
    .first()
    .click();
  expect((await download).suggestedFilename()).toMatch(/tuoi-1/);
});
test("all screens render, extreme data stays within mobile and desktop viewports", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await importMature(page);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const label of [
      ui.journal,
      ui.education,
      ui.work,
      ui.activities,
      ui.assets,
      ui.relationships,
      ui.stories,
      ui.achievements,
      ui.saves,
      ui.settings,
    ]) {
      await nav(page, label).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${label}/${width}`,
      ).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});
test("all five stories remain playable offline after installation", async ({
  page,
  context,
}) => {
  await start(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.locator(".game-shell")).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator(".game-shell")).toBeVisible();
  await nav(page, ui.stories).click();
  await expect(page.locator(".story-card")).toHaveCount(5);
  for (const story of stories) {
    await page
      .locator(".story-card")
      .filter({
        has: page.getByRole("heading", { name: story.name, exact: true }),
      })
      .getByRole("button")
      .click();
    await expect(page.locator(".story-paper")).toBeVisible();
    await page.locator(".story-paper .choice").first().click();
    await page.locator(".story-top button").click();
  }
  await context.setOffline(false);
});
test("an older tab cannot overwrite a newer choice", async ({
  page,
  context,
}) => {
  await start(page);
  const old = await context.newPage();
  await old.goto("/");
  await expect(old.locator(".game-shell")).toBeVisible();
  await page.locator(".age-button").click();
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
  await old.locator(".age-button").click();
  await expect(old.locator(".banner")).toContainText(ui.readOnly);
  await expect(old.locator(".age-button")).toBeDisabled();
  await page.reload();
  await expect(page.getByRole("dialog")).toBeVisible();
});
test("a rejected import leaves the existing slot untouched", async ({
  page,
}) => {
  await start(page);
  await nav(page, ui.saves).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"format":"newlife-save","schemaVersion":999}'),
  });
  await expect(page.locator(".toast")).toContainText("Phiên bản file");
  await expect(page.locator(".save-card")).toHaveCount(1);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
test("failed autosave can be exported and renaming preserves the unsaved action", async ({
  page,
}) => {
  await start(page);
  await importMature(page);
  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (
        (window as unknown as { rejectSave: boolean }).rejectSave &&
        this.name === "slots"
      )
        throw new DOMException("Injected quota failure", "QuotaExceededError");
      return original.apply(this, args as Parameters<typeof original>);
    };
    (window as unknown as { rejectSave: boolean }).rejectSave = true;
  });
  await nav(page, ui.activities).click();
  const activity = page
    .locator(".catalog-row")
    .filter({ has: page.getByRole("heading", { name: "Đi bộ", exact: true }) });
  await activity.getByRole("button").click();
  await expect(page.locator(".save-status")).toHaveText(ui.notSaved);
  await nav(page, ui.saves).click();
  const downloaded = page.waitForEvent("download");
  await page
    .getByRole("button", { name: ui.export, exact: true })
    .first()
    .click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toContain("tuoi-35");
  await page.evaluate(() => {
    (window as unknown as { rejectSave: boolean }).rejectSave = false;
  });
  page.once("dialog", (dialog) => dialog.accept("Giữ tiến trình"));
  await page
    .locator(".save-card.current")
    .getByRole("button", { name: ui.rename, exact: true })
    .click();
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
  await page.reload();
  await nav(page, ui.activities).click();
  await expect(
    page
      .locator(".catalog-row")
      .filter({
        has: page.getByRole("heading", { name: "Đi bộ", exact: true }),
      }),
  ).toContainText("1/");
});
test("dark theme and largest text remain usable and persist", async ({
  page,
}) => {
  await start(page);
  await importMature(page);
  await nav(page, ui.settings).click();
  await page.getByLabel(ui.theme).selectOption("dark");
  await page.getByRole("slider").focus();
  await page.keyboard.press("End");
  await page
    .getByRole("button", { name: ui.savePreferences, exact: true })
    .click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(
    await page
      .locator("html")
      .evaluate((e) =>
        (e as HTMLElement).style.getPropertyValue("--base-size"),
      ),
  ).toBe("22px");
  for (const label of [ui.journal, ui.assets, ui.activities, ui.saves]) {
    await nav(page, label).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

