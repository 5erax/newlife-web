import { test, expect, type Page } from "@playwright/test";
import { newLife, reduce } from "../../src/engine/game";
import { interviewView } from "../../src/engine/interviews";
import { apkJobs } from "../../src/content/catalog";
import { localPrice } from "../../src/engine/world";
import { cash } from "../../src/ui/format";
import { serialize } from "../../src/engine/save";
import { createAsset, addLog } from "../../src/engine/helpers";
import { stories, apkEvents } from "../../src/content/catalog";
import { advanceQueue } from "../../src/engine/year";
import { nextRandom } from "../../src/engine/rng";
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
test("APK source choices and career catalog survive reload in Vietnamese", async ({
  page,
}) => {
  await start(page);
  const event = apkEvents.find((e) => e.id === "apk_career_11001")!;
  const s = newLife({
    name: "An Việt hóa",
    gender: "female",
    hometown: "Huế",
    birthDate: "2000-01-01",
    origin: "vn",
    seed: 42,
    contentMode: "apk",
  });
  s.age = 30;
  s.stats = { health: 100, happiness: 80, intelligence: 100, looks: 100 };
  s.education.completed = ["edu_upper_secondary", "edu_university"];
  s.education.specialty = "apk_major_accounting";
  s.job = {
    id: event.apkRequirements!.careerId,
    rank: 0,
    years: 0,
    performance: 60,
    salary: 50000000,
  };
  s.yearQueue = [event.id];
  advanceQueue(s);
  await nav(page, ui.saves).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "apk-life.json",
    mimeType: "application/json",
    buffer: Buffer.from(serialize(s)),
  });
  await page
    .getByRole("button", { name: ui.importNewSlot, exact: true })
    .click();
  const text = await page.locator(".event-text").innerText();
  expect(text).not.toMatch(/<[^>]+>/);
  await page.reload();
  await expect(page.locator(".event-text")).toHaveText(text);
  await page.locator("dialog .choice").first().click();
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
  await expect(page.getByText("Thiện tâm:")).toContainText("47/100");
  await nav(page, ui.work).click();
  await expect(page.locator(".section-heading")).toContainText("168 nghề");
  await expect(page.getByText("Hiệu suất 55/100")).toBeVisible();
  await page.getByRole("searchbox", { name: "Tìm nghề" }).fill("gà tây");
  await expect(page.locator(".catalog-list")).toContainText(
    "Nhân viên phân loại giới tính gà tây",
  );
  await expect(page.locator("body")).not.toContainText("undefined");
});
async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(ui.startLife) }).click();
  await expect(page.locator(".game-shell")).toBeVisible();
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
}
test("APK roulette settles native net winnings and preserves its receipt after reload", async ({ page }, testInfo) => {
  await start(page);
  const s = newLife({ name: "An roulette", gender: "female", hometown: "Huế", birthDate: "2000-01-01", seed: 42, contentMode: "apk" });
  s.age = 30;
  s.money = 100000000;
  const outcome = Math.floor(nextRandom(s.rng).value * 13);
  await nav(page, ui.saves).click();
  await page.locator("input[type=file]").setInputFiles({ name: "roulette.json", mimeType: "application/json", buffer: Buffer.from(serialize(s)) });
  await page.getByRole("button", { name: ui.importNewSlot, exact: true }).click();
  await nav(page, ui.activities).click();
  await page.getByRole("button", { name: /Sòng bạc ·/ }).click();
  await page.getByLabel("Trò chơi", { exact: true }).selectOption("roulette");
  await expect(page.getByRole("group", { name: "Chọn ô roulette" }).getByRole("button")).toHaveCount(15);
  await page.getByRole("button", { name: `Cược số ${outcome}`, exact: true }).click();
  await page.getByRole("button", { name: "Quay roulette", exact: true }).click();
  await expect(page.locator(".hand-result")).toContainText(`Kết quả: ${outcome}`);
  await expect(page.locator(".hand-result")).toContainText(`Thắng +${cash(13000, true, s.origin)}`);
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
  const receipt = await page.locator(".hand-result").innerText();
  await page.reload();
  await nav(page, ui.activities).click();
  await page.getByRole("button", { name: /Sòng bạc ·/ }).click();
  await expect(page.locator(".hand-result")).toHaveText(receipt);
  await expect(page.getByText("Lịch sử roulette · 1 lượt", { exact: true })).toBeVisible();
  await page.locator(".casino-table").scrollIntoViewIfNeeded();
  const path = testInfo.outputPath("roulette.png");
  await page.screenshot({ path });
  await testInfo.attach("roulette", { path, contentType: "image/png" });
});
test("all 107 APK stocks render with Vietnamese sectors and buying then selling survives reload", async ({ page }, testInfo) => {
  await start(page);
  const s = newLife({ name: "An cổ phiếu", gender: "female", hometown: "Huế", birthDate: "2000-01-01", seed: 42, contentMode: "apk" });
  s.age = 30;
  s.money = 100000000;
  await nav(page, ui.saves).click();
  await page.locator("input[type=file]").setInputFiles({ name: "stocks.json", mimeType: "application/json", buffer: Buffer.from(serialize(s)) });
  await page.getByRole("button", { name: ui.importNewSlot, exact: true }).click();
  await nav(page, ui.assets).click();
  await page.getByRole("button", { name: /Đầu tư · trái phiếu/ }).click();
  await page.getByLabel("Loại đầu tư", { exact: true }).selectOption("stock");
  await expect(page.locator(".investment-row")).toHaveCount(107);
  const product = page.locator(".investment-row").first();
  await expect(product).toContainText("Ngành:");
  await product.getByRole("button", { name: /^Mua ·/ }).click();
  await expect(product).toContainText("Đang nắm: 1");
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
  await page.reload();
  await nav(page, ui.assets).click();
  await page.getByRole("button", { name: /Đầu tư · trái phiếu/ }).click();
  await page.getByLabel("Loại đầu tư", { exact: true }).selectOption("stock");
  await expect(product).toContainText("Đang nắm: 1");
  await product.scrollIntoViewIfNeeded();
  const path = testInfo.outputPath("stocks.png");
  await page.screenshot({ path });
  await testInfo.attach("stocks", { path, contentType: "image/png" });
  await product.getByRole("button", { name: /^Bán ·/ }).click();
  await expect(product).not.toContainText("Đang nắm:");
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
});
test("APK job interview survives reload and keyboard answer hires with the source salary", async ({
  page,
}, testInfo) => {
  await start(page);
  const s = newLife({
    name: "An phỏng vấn",
    gender: "female",
    hometown: "Huế",
    birthDate: "2000-01-01",
    seed: 42,
    contentMode: "apk",
  });
  s.age = 30;
  s.stats = { health: 100, happiness: 100, intelligence: 100, looks: 100 };
  const job = apkJobs[0];
  // Use a reproducible seed with a passing reply among the sampled choices.
  let preview = reduce(s, { type: "job", id: job.id });
  while (!interviewView(preview).answers.some((a) => a.score >= 4)) {
    s.rng = (s.rng + 1) >>> 0;
    preview = reduce(s, { type: "job", id: job.id });
  }
  const view = interviewView(preview),
    passing = view.answers.findIndex((a) => a.score >= 4);
  await nav(page, ui.saves).click();
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "apk-interview.json",
      mimeType: "application/json",
      buffer: Buffer.from(serialize(s)),
    });
  await page
    .getByRole("button", { name: ui.importNewSlot, exact: true })
    .click();
  await nav(page, ui.work).click();
  await page.getByRole("searchbox", { name: "Tìm nghề" }).fill(job.name);
  await page
    .locator(".catalog-row")
    .filter({ has: page.getByRole("heading", { name: job.name, exact: true }) })
    .getByRole("button", { name: ui.apply, exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Phỏng vấn xin việc" }),
  ).toBeVisible();
  await expect(page.locator("dialog .event-text")).toHaveText(view.question);
  await expect(page.locator("dialog .choice")).toHaveCount(view.answers.length);
  await expect(page.locator(".age-button")).toBeDisabled();
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
  await page.reload();
  await expect(page.locator("dialog .event-text")).toHaveText(view.question);
  for (let i = 0; i < view.answers.length; i++)
    await expect(page.locator("dialog .choice").nth(i)).toContainText(view.answers[i].label);
  const interviewImage = testInfo.outputPath("interview.png");
  await page.screenshot({ path: interviewImage });
  await testInfo.attach("interview-dialog", { path: interviewImage, contentType: "image/png" });
  await page.keyboard.press(String(passing + 1));
  await expect(page.locator("dialog")).toHaveCount(0);
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
  await nav(page, ui.work).click();
  await expect(page.locator(".feature-panel")).toContainText(job.name);
  await expect(page.locator(".feature-panel")).toContainText(cash(localPrice(s, job.ranks[0].salary)));
  await expect(page.locator(".age-button")).toBeEnabled();
});
test("APK camping companion choices survive reload and return to activities", async ({
  page,
}) => {
  await start(page);
  const s = newLife({
    name: "An dã ngoại",
    gender: "female",
    hometown: "Huế",
    birthDate: "2000-01-01",
    seed: 42,
    contentMode: "apk",
  });
  s.age = 30;
  s.money = 100000000;
  createAsset(s, "asset_thucung_02");
  await nav(page, ui.saves).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "apk-trip.json",
    mimeType: "application/json",
    buffer: Buffer.from(serialize(s)),
  });
  await page
    .getByRole("button", { name: ui.importNewSlot, exact: true })
    .click();
  await nav(page, ui.activities).click();
  await page.getByRole("searchbox", { name: "Tìm hoạt động" }).fill("Cắm trại");
  await page
    .getByLabel("Người đồng hành khi Cắm trại")
    .selectOption({ label: "Chó" });
  await page
    .locator(".catalog-row")
    .filter({
      has: page.getByRole("heading", { name: "Cắm trại", exact: true }),
    })
    .getByRole("button")
    .click();
  await expect(page.locator("dialog .event-text")).toBeVisible();
  const text = await page.locator("dialog .event-text").innerText();
  expect(text).not.toMatch(/<[^>]+>/);
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
  await page.reload();
  await expect(page.locator("dialog .event-text")).toHaveText(text);
  await page.locator("dialog .choice").first().click();
  await expect(page.locator("dialog")).toHaveCount(0);
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
  await nav(page, ui.activities).click();
  await page
    .getByRole("searchbox", { name: "Tìm hoạt động" })
    .fill("Du lịch tàu biển");
  await expect(page.locator(".catalog-list")).toContainText("Du lịch tàu biển");
  await expect(page.locator("body")).not.toContainText("undefined");
});
test("APK friend profiles and hostility persist and reconciliation unlocks after rebuilding closeness", async ({
  page,
}) => {
  await start(page);
  const s = newLife({
    name: "An bạn bè",
    gender: "female",
    hometown: "Huế",
    birthDate: "2000-01-01",
    seed: 42,
    contentMode: "apk",
  });
  s.age = 30;
  s.money = 10000000;
  s.relations.push({
    id: "browser_friend",
    name: "Chi kiểm thử",
    gender: "female",
    role: "friend",
    age: 30,
    closeness: 50,
    alive: true,
    trait: "bình dị",
    resources: 1000000,
    parents: [],
    npc: {
      craziness: 80,
      student: false,
      employed: true,
      married: false,
      children: 1,
      enemy: false,
    },
  });
  await nav(page, ui.saves).click();
  await page.locator("input[type=file]").setInputFiles({
    name: "npc-friend.json",
    mimeType: "application/json",
    buffer: Buffer.from(serialize(s)),
  });
  await page
    .getByRole("button", { name: ui.importNewSlot, exact: true })
    .click();
  await nav(page, ui.relationships).click();
  await page.getByRole("button", { name: /Chi kiểm thử/ }).click();
  await expect(page.locator(".relationship-detail")).toContainText(
    "Tính bốc đồng 80/100",
  );
  await expect(page.locator(".relationship-detail")).toContainText(
    "1 người con",
  );
  await page
    .getByRole("button", { name: "Tuyên bố thù địch", exact: true })
    .click();
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
  await page.reload();
  await nav(page, ui.relationships).click();
  await page.getByRole("button", { name: /Chi kiểm thử/ }).click();
  await expect(page.locator(".relationship-detail")).toContainText(
    "Đang thù địch",
  );
  await expect(
    page.getByRole("button", { name: "Xin hỗ trợ", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Hẹn hò", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Làm hòa · gắn bó 40+", exact: true }),
  ).toBeDisabled();
  for (let i = 0; i < 2; i++) {
    await page
      .getByRole("button", { name: "Tặng quà · 200 nghìn", exact: true })
      .click();
    await expect(page.locator(".save-status")).toHaveText(ui.saved);
  }
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: "Trò chuyện", exact: true }).click();
    await expect(page.locator(".save-status")).toHaveText(ui.saved);
  }
  await page
    .getByRole("button", { name: "Làm hòa · gắn bó 40+", exact: true })
    .click();
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
  await expect(page.locator(".relationship-detail")).not.toContainText(
    "Đang thù địch",
  );
  await expect(
    page.getByRole("button", { name: "Hẹn hò", exact: true }),
  ).toBeEnabled();
});
async function resolve(page: Page) {
  for (let i = 0; i < 32 && (await page.locator("dialog").count()); i++) {
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
test("Vietnamese lifestyle options persist and a love invitation survives reload", async ({
  page,
}) => {
  await start(page);
  await importMature(page);
  await nav(page, ui.activities).click();
  await page
    .getByRole("button", { name: /Tâm trí và thể chất.*14 hoạt động/ })
    .click();
  const instrument = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Luyện nhạc cụ", exact: true }),
  });
  await expect(instrument.locator("option")).toHaveCount(25);
  await instrument.locator("select").selectOption("violin");
  await instrument.getByRole("button", { name: ui.perform }).click();
  await expect(instrument).not.toContainText("Kỹ năng: 0/100");
  await page.getByRole("button", { name: /Salon và spa.*6 hoạt động/ }).click();
  const dye = page.locator("article").filter({
    has: page.getByRole("heading", { name: "Nhuộm tóc", exact: true }),
  });
  await dye.locator("select").selectOption("purple");
  await dye.getByRole("button", { name: ui.perform }).click();
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
  await page.reload();
  await expect(
    page.locator('svg:visible path[fill="#8056a8"]').first(),
  ).toBeVisible();
  await nav(page, ui.activities).click();
  await page.getByRole("button", { name: /Tình yêu.*6 hoạt động/ }).click();
  const date = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "Ứng dụng hẹn hò LGBTQ+",
      exact: true,
    }),
  });
  await date.getByRole("button", { name: ui.perform }).click();
  const invitation = await page.locator("dialog").textContent();
  await page.reload();
  await expect(page.locator("dialog")).toHaveText(invitation!);
  await page.getByRole("button", { name: "Từ chối", exact: true }).click();
  await expect(page.locator("dialog")).toHaveCount(0);
});
test("investment purchases survive reload and show historical price changes", async ({
  page,
}) => {
  await start(page);
  await importMature(page);
  await nav(page, ui.assets).click();
  await page.getByRole("button", { name: /Đầu tư · trái phiếu/ }).click();
  await expect(page.locator(".market-health button")).toHaveCount(5);
  const product = page.locator(".investment-row").first();
  await product.getByRole("button", { name: /^Mua ·/ }).click();
  await expect(product).toContainText("Đang nắm: 1");
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
  await page.reload();
  await nav(page, ui.assets).click();
  await page.getByRole("button", { name: /Đầu tư · trái phiếu/ }).click();
  await expect(page.locator(".investment-row").first()).toContainText(
    "Đang nắm: 1",
  );
  await page.locator(".age-button").click();
  await resolve(page);
  await expect(page.locator(".this-year:visible").first()).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Lịch sử giá/ }).first(),
  ).toBeVisible();
});
test("an unfinished blackjack hand survives reload and blocks aging", async ({
  page,
}) => {
  await start(page);
  await importMature(page);
  await nav(page, ui.activities).click();
  await page.getByRole("button", { name: /Sòng bạc ·/ }).click();
  await page.getByRole("button", { name: "Chia bài", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Dừng", exact: true }),
  ).toBeVisible();
  const hand = await page.locator(".casino-table").textContent();
  await expect(page.locator(".age-button")).toBeDisabled();
  await expect(page.locator(".save-status")).toHaveText(ui.saved);
  await page.reload();
  await nav(page, ui.activities).click();
  await page.getByRole("button", { name: /Sòng bạc ·/ }).click();
  await expect(page.locator(".casino-table")).toHaveText(hand!);
  await page.getByRole("button", { name: "Dừng", exact: true }).click();
  await expect(page.locator(".hand-result")).toBeVisible();
  await expect(page.locator(".age-button")).toBeEnabled();
});
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
    page.locator(".catalog-row").filter({
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
