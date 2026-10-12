import type { GameState, Stat, Role, Relation, Metric } from "./types";
import { assets, assetById } from "../content/catalog";
import names from "../content/names.json" with { type: "json" };
import { pick, random } from "./rng";
export function identityDigest(text: string) {
  return Array.from({ length: 4 }, (_, lane) => {
    let h = (2166136261 ^ Math.imul(lane + 1, 2654435761)) >>> 0;
    for (const char of text)
      h = Math.imul(h ^ char.charCodeAt(0), 16777619) >>> 0;
    return h.toString(16).padStart(8, "0");
  }).join("");
}
export const estateReceipt = (estateId: string, childId: string) =>
  "receipt_" + identityDigest(estateId + ":" + childId);
export const MAX_MONEY = 1_000_000_000_000_000;
export const clamp = (value: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value));
export function requireGame(ok: unknown, message: string): asserts ok {
  if (!ok) throw new Error(message);
}
export function addLog(
  s: GameState,
  text: string,
  kind: GameState["log"][number]["kind"] = "life",
) {
  s.log.push({
    id: `${s.id}_${s.actionSerial}_${s.log.length}`,
    age: s.age,
    text,
    kind,
  });
}
export function stat(s: GameState, key: Stat, delta: number) {
  s.stats[key] = clamp(s.stats[key] + delta);
}
export function flag(s: GameState, key: string, value = true) {
  s.flags = s.flags.filter((x) => x !== key);
  if (value) s.flags.push(key);
}
export function count(s: GameState, key: string, delta = 1) {
  requireGame(
    !["__proto__", "constructor", "prototype"].includes(key),
    "Bộ đếm không hợp lệ.",
  );
  s.counters[key] = (s.counters[key] ?? 0) + delta;
  requireGame(Number.isSafeInteger(s.counters[key]), "Bộ đếm vượt giới hạn.");
  for (const threshold of [1, 2, 3, 5, 10, 15, 20])
    if (s.counters[key] >= threshold)
      flag(s, `milestone_${key.toLowerCase()}_${threshold}`);
}
export function money(
  s: GameState,
  amount: number,
  label: string,
  mandatory = false,
) {
  if (amount === 0) return;
  requireGame(
    Number.isSafeInteger(amount) && Math.abs(amount) <= MAX_MONEY,
    "Số tiền không hợp lệ.",
  );
  const after = s.money + amount;
  requireGame(after <= MAX_MONEY, "Số dư đã chạm giới hạn của game.");
  if (after < 0) {
    requireGame(mandatory, "Bạn chưa đủ tiền cho lựa chọn này.");
    const shortfall = -after;
    const owed = s.debts.reduce((n, d) => n + d.balance, 0);
    const allowed = Math.max(0, Math.min(shortfall, 30_000_000 - owed));
    if (allowed) {
      const existing = s.debts.find((d) => d.id === "living");
      if (existing) existing.balance += allowed;
      else s.debts.push({ id: "living", balance: allowed, rate: 0.05 });
    }
    if (allowed < shortfall) {
      count(s, "unpaid", shortfall - allowed);
      stat(s, "happiness", -5);
      addLog(
        s,
        "Một khoản chi chưa thanh toán làm bạn cần thu xếp lại cuộc sống.",
        "money",
      );
    }
    s.money = 0;
  } else s.money = after;
  s.ledger.push({
    id: `${s.id}_${s.actionSerial}_${s.ledger.length}`,
    age: s.age,
    amount,
    label,
  });
  if (amount > 0) count(s, "earned", amount);
  if (s.money > (s.counters.saved ?? 0)) s.counters.saved = s.money;
}
export function personName(s: GameState, gender: "male" | "female" = "female") {
  return `${pick(s, names.surnames)} ${pick(s, gender === "male" ? names.male : names.female)}`;
}
export function makePerson(s: GameState, role: Role, age: number): Relation {
  requireGame(
    s.relations.length < 250,
    "Đã đạt giới hạn người trong hồ sơ cuộc đời.",
  );
  const draw = random(s),
    gender =
      role === "mother"
        ? "female"
        : role === "father"
          ? "male"
          : draw < 0.5
            ? "male"
            : "female";
  return {
    id: `${s.id}_person_${++s.actionSerial}`,
    name: personName(s, gender),
    gender: role === "mother" ? "female" : role === "father" ? "male" : gender,
    role,
    age,
    closeness: role === "friend" ? 45 : 70,
    alive: true,
    trait: pick(s, names.traits),
    resources: Math.round(1_000_000 + random(s) * 100_000_000),
    parents: [],
  };
}
export function relation(s: GameState, id?: string, roles?: Role[]) {
  return s.relations.find(
    (r) =>
      r.alive && (!id || r.id === id) && (!roles || roles.includes(r.role)),
  );
}
export function netWorth(s: GameState) {
  return (
    s.money +
    s.assets
      .filter((a) => a.alive)
      .reduce((n, a) => n + a.value * a.quantity, 0) -
    s.debts.reduce((n, d) => n + d.balance, 0)
  );
}
export function metric(s: GameState, key: Metric): number {
  if (key in s.stats) return s.stats[key as Stat];
  if (key === "age") return s.age;
  if (key === "money") return s.money;
  if (key === "netWorth") return netWorth(s);
  if (key === "schoolScore")
    return s.education.current?.score ?? s.education.score;
  if (key === "jobRank") return s.job?.rank ?? 0;
  if (key === "children")
    return s.relations.filter((r) => r.role === "child").length;
  if (key === "stories")
    return Object.values(s.profile.endings).filter((e) => e.length > 0).length;
  if (key === "activityGroups")
    return Object.keys(s.counters).filter((k) => k.startsWith("group_")).length;
  return s.counters[key] ?? 0;
}
export function ownAsset(s: GameState, id?: string, category?: string) {
  return s.assets.find(
    (a) =>
      a.alive &&
      (!id || a.instanceId === id) &&
      (!category || assetById.get(a.catalogId)?.category === category),
  );
}
export function createAsset(s: GameState, catalogId: string, quantity = 1) {
  requireGame(
    s.assets.length < 500 && s.assets.filter((a) => a.alive).length < 200,
    "Đã đạt giới hạn tài sản trong cuộc đời.",
  );
  const item = assetById.get(catalogId);
  requireGame(item, "Không tìm thấy tài sản.");
  const owned = {
    instanceId: `${s.id}_asset_${++s.actionSerial}`,
    catalogId,
    age: 0,
    condition: 100,
    value: s.market[catalogId] ?? item.price,
    quantity,
    primary:
      item.category === "house" && !s.assets.some((a) => a.primary && a.alive),
    alive: true,
    lost: false,
    bond: 50,
  };
  s.assets.push(owned);
  if (owned.primary) s.housing = "owned";
  return owned;
}
export function initialMarket() {
  return Object.fromEntries(assets.map((a) => [a.id, a.price]));
}
