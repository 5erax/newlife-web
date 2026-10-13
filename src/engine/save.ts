import { z } from "zod";
import type { GameState } from "./types";
import { CONTENT_VERSION } from "./types";
import {
  eventSchema,
  idSchema,
  roleSchema,
  choiceSchema,
} from "../schema/content";
import legacyEvents from "../content/legacy-events.json" with { type: "json" };
import { resolvedNode } from "./branches";
import { apkEventAllowed, apkPresentation } from "./apk";
import {
  assetById,
  educationById,
  jobById,
  eventById,
  achievements,
  stories,
} from "../content/catalog";
import medalData from "../content/medals.json" with { type: "json" };
import { initialMarket, requireGame, MAX_MONEY, netWorth } from "./helpers";
import { origins } from "./world";
import {
  emptyCasino,
  blackjackScore,
  handReturn,
  casinoBetLimit,
} from "./casino";
import {
  emptyAppearance,
  HAIR_COLORS,
  HAIR_STYLES,
  NAIL_STYLES,
} from "./lifestyle";
import { investmentSchema } from "../schema/investments";
import { portfolioValue, valueForUnits } from "./investments";
const integer = z.number().int().min(0).max(MAX_MONEY);
const score = z.number().int().min(0).max(100);
const ids = z.array(idSchema).max(2000);
const record = z.record(z.string().min(1).max(150), integer);
const deltaSchema = z.object({
  key: z.enum(["health", "happiness", "intelligence", "looks", "money"]),
  before: z.number().int().min(-MAX_MONEY).max(MAX_MONEY),
  after: z.number().int().min(-MAX_MONEY).max(MAX_MONEY),
  reasons: z.array(z.string().min(1).max(5000)).max(1000),
});
const cards = z.array(z.number().int().min(0).max(51));
const handSchema = z.object({
  id: idSchema,
  game: z.enum(["blackjack", "bacao"]),
  bet: integer.min(1000).refine((n) => n % 100 === 0),
  player: cards.min(2).max(22),
  dealer: cards.min(2).max(22),
  age: integer.max(150),
  seedBefore: integer.max(4294967295),
  status: z.enum(["playing", "settled"]),
  net: z.number().int().min(-MAX_MONEY).max(MAX_MONEY),
  result: z.string().max(100),
});
const relationSchema = z
  .object({
    gender: z.enum(["male", "female", "other"]).optional(),
    id: idSchema,
    name: z.string().min(1).max(100),
    role: roleSchema,
    age: integer.max(200),
    closeness: score,
    alive: z.boolean(),
    trait: z.string().max(100),
    resources: integer,
    parents: ids,
  })
  .transform((r) => ({
    ...r,
    gender:
      r.gender ??
      (r.role === "mother" || r.role === "grandmother"
        ? ("female" as const)
        : r.role === "father" || r.role === "grandfather"
          ? ("male" as const)
          : ("other" as const)),
  }));
const gameSchema = z.object({
  schemaVersion: z.literal(1),
  contentVersion: z.literal(CONTENT_VERSION),
  id: idSchema,
  revision: integer,
  rng: integer.max(4294967295),
  phase: z.enum(["ready", "awaiting_choice", "dead"]),
  age: integer.max(150),
  name: z.string().min(1).max(80),
  gender: z.enum(["male", "female", "other"]),
  hometown: z.string().min(1).max(100),
  origin: z
    .enum(origins.map((o) => o.id) as [string, ...string[]])
    .default("vn"),
  familySurname: z.string().max(100).default(""),
  familyWealth: z
    .enum(["poor", "middle", "comfortable", "rich"])
    .default("middle"),
  tuitionRatio: z.number().min(0).max(1).default(0.4),
  fame: score.default(0),
  reputation: score.default(50),
  skills: z.record(idSchema, score).default({}),
  appearance: z
    .object({
      hairColor: z.enum(["natural", ...Object.keys(HAIR_COLORS)] as [
        string,
        ...string[],
      ]),
      hairStyle: z.enum(HAIR_STYLES as [string, ...string[]]),
      nails: z.enum(NAIL_STYLES as [string, ...string[]]),
      tanned: z.boolean(),
    })
    .default(emptyAppearance),
  loveOffer: z
    .object({
      id: idSchema,
      mode: z.enum([
        "date",
        "app",
        "lgbtq",
        "celebrity",
        "hookup",
        "threesome",
      ]),
      people: z.array(relationSchema).min(1).max(2),
      consent: z.array(z.boolean()).min(1).max(2),
    })
    .nullable()
    .default(null),
  investments: investmentSchema,
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  stats: z.object({
    health: score,
    happiness: score,
    intelligence: score,
    looks: score,
  }),
  money: integer,
  lastDeltas: z.array(deltaSchema).max(5).default([]),
  lastYearDeltas: z.array(deltaSchema).max(5).default([]),
  happinessBaseline: score.default(55),
  modifiers: z
    .array(
      z.object({
        id: idSchema,
        label: z.string().min(1).max(300),
        remaining: integer.min(1).max(120),
        stats: z.object({
          health: z.number().int().min(-25).max(25).optional(),
          happiness: z.number().int().min(-25).max(25).optional(),
          intelligence: z.number().int().min(-25).max(25).optional(),
          looks: z.number().int().min(-25).max(25).optional(),
        }),
        happinessBaseline: z.number().int().min(-50).max(50).optional(),
      }),
    )
    .max(40)
    .default([]),
  education: z.object({
    completed: ids,
    current: z
      .object({
        id: idSchema,
        year: integer.max(10),
        score: score,
        specialty: z.string().max(100),
      })
      .nullable(),
    score: score,
    specialty: z.string().max(100),
  }),
  job: z
    .object({
      id: idSchema,
      rank: integer.max(30),
      years: integer.max(150),
      performance: score,
      salary: integer,
    })
    .nullable(),
  sideJob: z.string().max(100).nullable(),
  pension: integer,
  assets: z
    .array(
      z.object({
        instanceId: idSchema,
        origin: z
          .enum(origins.map((o) => o.id) as [string, ...string[]])
          .default("vn"),
        catalogId: idSchema,
        age: integer.max(150),
        condition: score,
        value: integer,
        quantity: integer.min(1).max(1000),
        primary: z.boolean(),
        alive: z.boolean(),
        lost: z.boolean(),
        bond: score,
      }),
    )
    .max(500),
  market: record,
  housing: z.enum(["family", "rent", "owned"]),
  relations: z.array(relationSchema).max(250),
  illnesses: z
    .array(
      z.object({
        id: idSchema,
        type: z.string().min(1).max(100),
        severity: score,
        discoveredAge: integer.max(150),
        progress: integer.max(200),
      }),
    )
    .max(20),
  flags: ids,
  counters: record,
  history: z.record(
    idSchema,
    z.object({ count: integer.max(300), lastAge: integer.max(150) }),
  ),
  caseHistory: z
    .record(
      z
        .string()
        .regex(/^[a-z0-9_]+$/)
        .max(1000),
      integer.max(300),
    )
    .default({}),
  casino: z
    .object({
      shoe: cards.max(312),
      hand: handSchema.nullable(),
      history: z.array(handSchema).max(100),
      handsThisYear: integer.max(20),
      winStreak: integer.max(20),
      bannedUntil: integer.max(300),
    })
    .default(emptyCasino),
  pending: z
    .object({
      templateSeed: integer.max(4294967295).optional(),
      instanceId: idSchema,
      event: eventSchema,
      node: z
        .object({
          text: z.string().min(1).max(2000),
          choices: z.array(choiceSchema).min(2).max(6),
          path: z
            .array(
              z.object({ choiceId: idSchema, caseIndex: integer.max(100) }),
            )
            .min(1)
            .max(32),
        })
        .optional(),
    })
    .nullable(),
  yearQueue: z.array(z.string().max(100)).max(32),
  scheduled: z
    .array(z.object({ eventId: idSchema, age: integer.max(300) }))
    .max(128),
  time: integer.max(12),
  activityUses: record,
  actionSerial: integer,
  ledger: z
    .array(
      z.object({
        age: integer.max(150),
        id: idSchema,
        amount: z.number().int().min(-MAX_MONEY).max(MAX_MONEY),
        label: z.string().max(300),
      }),
    )
    .max(30000),
  debts: z
    .array(
      z.object({
        id: idSchema,
        balance: integer.max(30000000),
        rate: z.number().min(0).max(1),
      }),
    )
    .max(20),
  prisonYears: integer.max(1000),
  medals: ids,
  log: z
    .array(
      z.object({
        id: idSchema,
        age: integer.max(150),
        kind: z.enum([
          "life",
          "event",
          "money",
          "relationship",
          "achievement",
          "death",
        ]),
        text: z.string().min(1).max(5000),
        deltas: z.array(deltaSchema).max(5).default([]),
        source: z.string().min(1).max(100).default("legacy"),
      }),
    )
    .max(10000),
  deathCause: z.string().max(300).nullable(),
  estate: z.object({
    id: idSchema,
    settled: z.boolean(),
    shares: z.record(idSchema, z.number().min(0).max(100)),
    received: ids,
    distributions: record,
  }),
  profile: z.object({
    unlockLives: z.record(idSchema, idSchema).optional(),
    achievements: ids,
    endings: z.record(idSchema, ids),
    summaries: z
      .array(
        z.object({
          lifeId: idSchema,
          name: z.string().max(100),
          age: integer.max(150),
          cause: z.string().max(300),
          title: z.string().max(100),
          netWorth: z.number().int().min(-MAX_MONEY).max(MAX_MONEY),
          children: integer.max(100),
          job: z.string().max(100),
          medals: ids,
        }),
      )
      .max(100),
    estateReceipts: ids,
  }),
  story: z
    .object({
      storyId: idSchema,
      nodeId: idSchema,
      flags: ids,
      turns: integer.max(64),
      rng: integer.max(4294967295),
    })
    .nullable(),
});
export const profileSchema = gameSchema.shape.profile;
function references(s: GameState) {
  const market = s.investments;
  requireGame(
    new Set(market.instruments.map((i) => i.id)).size ===
      market.instruments.length &&
      new Set(market.positions.map((p) => p.id)).size ===
        market.positions.length,
    "ID đầu tư bị trùng.",
  );
  requireGame(
    market.positions.every(
      (p) =>
        market.instruments.some((i) => i.id === p.id) &&
        (p.maturityAge === undefined ||
          market.instruments.find((i) => i.id === p.id)?.group === "bond"),
    ) &&
      Object.keys(market.traded).every((id) =>
        market.instruments.some((i) => i.id === id),
      ),
    "Vị thế tham chiếu sản phẩm không tồn tại.",
  );
  requireGame(
    market.instruments.every(
      (i) =>
        (i.status === "active") === i.price > 0 &&
        i.listedAge <= s.age &&
        i.history.at(-1)?.price === i.price &&
        i.history.every(
          (h, n) => h.age <= s.age && (n === 0 || h.age > i.history[n - 1].age),
        ),
    ),
    "Lịch sử hoặc trạng thái giá không nhất quán.",
  );
  for (const p of market.positions) {
    const instrument = market.instruments.find((i) => i.id === p.id)!;
    if (instrument.group === "bond")
      valueForUnits(instrument.initialPrice, p.units);
  }
  requireGame(
    s.relations.every(
      (r) =>
        (r.role !== "mother" && r.role !== "grandmother") ||
        r.gender === "female",
    ) &&
      s.relations.every(
        (r) =>
          (r.role !== "father" && r.role !== "grandfather") ||
          r.gender === "male",
      ),
    "Vai trò cha/mẹ không khớp giới tính.",
  );
  if (s.loveOffer) {
    const offer = s.loveOffer;
    requireGame(
      s.phase === "ready" &&
        s.age >= 18 &&
        !s.casino.hand &&
        offer.people.length === offer.consent.length &&
        offer.people.length === (offer.mode === "threesome" ? 2 : 1) &&
        offer.people.every(
          (r) =>
            r.alive &&
            r.age >= 18 &&
            r.role === "friend" &&
            !s.relations.some((p) => p.id === r.id),
        ) &&
        new Set(offer.people.map((p) => p.id)).size === offer.people.length,
      "Lời mời gặp mặt không hợp lệ.",
    );
  }
  const multiplicities = new Map<number, number>();
  for (const c of [
    ...s.casino.shoe,
    ...(s.casino.hand?.player ?? []),
    ...(s.casino.hand?.dealer ?? []),
  ])
    multiplicities.set(c, (multiplicities.get(c) ?? 0) + 1);
  requireGame(
    [...multiplicities.values()].every((n) => n <= 6),
    "Bộ bài không thuộc sáu bộ chuẩn.",
  );
  if (s.casino.hand) {
    const h = s.casino.hand;
    requireGame(
      s.phase === "ready" &&
        s.age >= 15 &&
        h.age === s.age &&
        h.status === "playing" &&
        h.game === "blackjack" &&
        h.dealer.length === 2 &&
        blackjackScore(h.player).value < 21 &&
        h.net === 0 &&
        s.casino.shoe.length + h.player.length + h.dealer.length >= 40 &&
        h.bet <= casinoBetLimit({ ...s, money: s.money + h.bet }),
      "Ván bài đang chờ không hợp lệ.",
    );
  }
  requireGame(
    s.casino.history.every(
      (h) =>
        h.status === "settled" &&
        h.net === handReturn(h) - h.bet &&
        (h.game !== "bacao" ||
          (h.player.length === 3 && h.dealer.length === 3)),
    ),
    "Lịch sử ván bài không khớp lá bài/cược.",
  );
  const date = new Date(s.birthDate + "T00:00:00Z");
  requireGame(
    !Number.isNaN(date.valueOf()) &&
      date.toISOString().slice(0, 10) === s.birthDate &&
      date.getUTCFullYear() >= 1900,
    "Ngày sinh trong file không hợp lệ.",
  );
  const wealth =
    s.money +
    portfolioValue(s) +
    s.assets
      .filter((a) => a.alive)
      .reduce((sum, a) => sum + a.value * a.quantity, 0);
  requireGame(
    Number.isSafeInteger(wealth) && wealth <= MAX_MONEY,
    "Tổng tài sản vượt giới hạn an toàn.",
  );
  requireGame(
    s.education.completed.every((id) => educationById.has(id)) &&
      (!s.education.current || educationById.has(s.education.current.id)),
    "Bằng hoặc chương trình trong file không còn được hỗ trợ.",
  );
  requireGame(
    !s.job ||
      (jobById.has(s.job.id) &&
        s.job.rank < jobById.get(s.job.id)!.ranks.length),
    "Nghề hoặc bậc nghề không tồn tại.",
  );
  requireGame(
    s.assets.every((a) => assetById.has(a.catalogId)),
    "Một tài sản trong file không tồn tại.",
  );
  requireGame(
    [...assetById.keys()].every(
      (id) => Number.isSafeInteger(s.market[id]) && s.market[id] > 0,
    ),
    "Bảng giá thị trường không đầy đủ.",
  );
  requireGame(
    Object.keys(s.history).every((id) => eventById.has(id)) &&
      s.yearQueue.every((id) => id === "@random" || eventById.has(id)) &&
      s.scheduled.every((e) => eventById.has(e.eventId)),
    "File tham chiếu một sự kiện không tồn tại.",
  );
  requireGame(
    (s.phase === "awaiting_choice") === !!s.pending,
    "Trạng thái chờ lựa chọn không nhất quán.",
  );
  if (s.pending) {
    requireGame(
      s.pending.event.sourceKind !== "apk_translation" ||
        (s.flags.includes("apk_mode") &&
          Number.isInteger(s.pending.templateSeed) &&
          !s.pending.node),
      "Sự kiện Việt hóa thiếu seed hoặc không đúng bộ nội dung.",
    );
    const known = eventById.get(s.pending.event.id);
    const legacy = legacyEvents.find((e) => e.id === s.pending!.event.id);
    requireGame(
      known &&
        (JSON.stringify(known) === JSON.stringify(s.pending.event) ||
          (!!legacy &&
            JSON.stringify(eventSchema.parse(legacy)) ===
              JSON.stringify(s.pending.event) &&
            !s.pending.node)),
      "Sự kiện đang chờ không khớp phiên bản nội dung.",
    );
    if (s.pending.node) {
      const node = resolvedNode(s.pending);
      requireGame(
        node &&
          JSON.stringify(node.choices) ===
            JSON.stringify(s.pending.node.choices) &&
          [node.text, ...(node.variants ?? [])].includes(s.pending.node.text),
        "Lựa chọn lồng không khớp đường đi đã lưu.",
      );
    }
    if (s.pending.event.sourceKind === "apk_translation") {
      requireGame(
        apkEventAllowed(s, s.pending.event),
        "Hoàn cảnh không phù hợp với sự kiện Việt hóa.",
      );
      apkPresentation(s);
    }
  }
  requireGame(
    s.phase !== "dead" || (!!s.deathCause && !s.pending),
    "Trạng thái kết thúc không hợp lệ.",
  );
  requireGame(
    (s.phase === "dead") === s.estate.settled,
    "Trạng thái kết toán di sản không nhất quán.",
  );
  const shares = Object.entries(s.estate.shares);
  requireGame(
    shares.every(([id]) => s.relations.some((r) => r.id === id)) &&
      (!shares.length ||
        Math.abs(shares.reduce((sum, [, ratio]) => sum + ratio, 0) - 100) <
          1e-8),
    "Di chúc có người nhận hoặc tỉ lệ không hợp lệ.",
  );
  requireGame(
    Object.keys(s.estate.distributions).every((id) =>
      s.relations.some((r) => r.id === id),
    ) &&
      Object.values(s.estate.distributions).reduce((sum, n) => sum + n, 0) <=
        Math.max(0, Math.floor(netWorth(s) * 0.98)),
    "Phân chia di sản không hợp lệ.",
  );
  for (const list of [
    s.relations.map((r) => r.id),
    s.assets.map((a) => a.instanceId),
    s.illnesses.map((i) => i.id),
    s.flags,
    s.profile.achievements,
  ])
    requireGame(
      new Set(list).size === list.length,
      "Có ID bị trùng trong file.",
    );
  requireGame(
    s.assets.filter((a) => a.alive && a.primary).length <= 1,
    "Có nhiều nơi ở chính.",
  );
  requireGame(
    s.profile.achievements.every((id) =>
      achievements.some((a) => a.id === id),
    ) && s.medals.every((id) => medalData.some((m) => m.id === id)),
    "Phần thưởng trong file không được hỗ trợ.",
  );
  for (const [id, endings] of Object.entries(s.profile.endings)) {
    const story = stories.find((x) => x.id === id);
    requireGame(
      story &&
        endings.every((ending) =>
          story.nodes.some((n) => n.ending?.id === ending),
        ),
      "Kết thúc truyện trong file không hợp lệ.",
    );
  }
  if (s.story) {
    const story = stories.find((x) => x.id === s.story!.storyId);
    requireGame(
      story && story.nodes.some((n) => n.id === s.story!.nodeId),
      "Nút truyện đang chơi không tồn tại.",
    );
  }
}
export function validateState(value: unknown): GameState {
  const frames: { value: unknown; depth: number }[] = [{ value, depth: 0 }];
  let visited = 0;
  while (frames.length) {
    const frame = frames.pop()!;
    requireGame(
      ++visited < 300000 && frame.depth <= 64,
      "Dữ liệu quá sâu hoặc có quá nhiều đối tượng.",
    );
    if (frame.value && typeof frame.value === "object")
      for (const [key, item] of Object.entries(frame.value)) {
        requireGame(
          !["__proto__", "constructor", "prototype"].includes(key),
          "Thuộc tính không an toàn.",
        );
        if (item && typeof item === "object")
          frames.push({ value: item, depth: frame.depth + 1 });
      }
  }
  if (
    value &&
    typeof value === "object" &&
    "contentVersion" in value &&
    ["1.0.0", "1.1.0"].includes(String(value.contentVersion))
  )
    value = { ...value, contentVersion: CONTENT_VERSION };
  const parsed = gameSchema.safeParse(value);
  requireGame(
    parsed.success,
    "File lưu không hợp lệ: " +
      (parsed.error?.issues
        .slice(0, 3)
        .map((i) => i.path.join(".") + " " + i.message)
        .join("; ") ?? ""),
  );
  const s: GameState = parsed.data;
  requireGame(
    ["karma", "discipline", "behavior", "respect"].every(
      (key) =>
        s.counters["apk_" + key] === undefined ||
        s.counters["apk_" + key] <= 100,
    ),
    "Chỉ số bổ sung của bộ Việt hóa vượt 100.",
  );
  references(s);
  return s;
}
export function serialize(state: GameState) {
  return JSON.stringify(
    { format: "newlife-save", schemaVersion: 1, game: validateState(state) },
    null,
    2,
  );
}
export function parseSave(text: string): GameState {
  requireGame(text.length <= 10_000_000, "File vượt giới hạn 10 MB.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw Error("File không phải JSON hợp lệ.");
  }
  requireGame(
    parsed && typeof parsed === "object" && !Array.isArray(parsed),
    "File lưu không hợp lệ.",
  );
  const container = parsed as Record<string, unknown>;
  requireGame(
    container.format === "newlife-save",
    "File không phải bản lưu NewLife.",
  );
  requireGame(
    container.schemaVersion === 0 || container.schemaVersion === 1,
    "Phiên bản file không được hỗ trợ. Hãy dùng phiên bản ứng dụng phù hợp.",
  );
  const frames: unknown[] = [parsed];
  let steps = 0;
  while (frames.length) {
    requireGame(++steps < 200000, "File có quá nhiều đối tượng.");
    const next = frames.pop();
    if (next && typeof next === "object") {
      for (const [key, value] of Object.entries(next)) {
        requireGame(
          !["__proto__", "constructor", "prototype"].includes(key),
          "File chứa tên thuộc tính không an toàn.",
        );
        if (value && typeof value === "object") frames.push(value);
      }
    }
  }
  if (container.schemaVersion === 0) {
    requireGame(
      container.game && typeof container.game === "object",
      "Bản lưu cũ thiếu dữ liệu game.",
    );
    const game = structuredClone(container.game) as Record<string, unknown>;
    const profile = game.profile as Record<string, unknown> | undefined;
    game.schemaVersion = 1;
    if (!game.market) game.market = initialMarket();
    if (profile && !profile.estateReceipts) profile.estateReceipts = [];
    container.game = game;
  }
  return validateState(container.game);
}
