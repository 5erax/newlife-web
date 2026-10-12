import type { GameState, LifeEvent } from "./types";
import {
  events,
  eventById,
  fallbacks,
  achievements,
  jobById,
} from "../content/catalog";
import balance from "../content/balance.json" with { type: "json" };
import titleData from "../content/titles.json" with { type: "json" };
import { eligible } from "./conditions";
import { economicYear, studyYear } from "./economy";
import { random } from "./rng";
import {
  addLog,
  count,
  flag,
  metric,
  netWorth,
  requireGame,
  stat,
} from "./helpers";
export function achievementCheck(s: GameState) {
  for (const a of achievements) {
    if (!s.profile.achievements.includes(a.id) && eligible(s, a.conditions)) {
      s.profile.achievements.push(a.id);
      s.profile.unlockLives ??= {};
      s.profile.unlockLives[a.id] = s.id;
      addLog(s, `Thành tích mới: ${a.name}.`, "achievement");
    }
  }
}
export function deathChance(age: number, health: number) {
  const base = balance.mortality.find((b) => age <= b.maxAge)?.base ?? 0.5;
  return Math.min(
    1,
    base * 2 ** ((balance.healthMidpoint - health) / balance.healthScale),
  );
}
export function title(s: GameState) {
  let best = "Bình dị mà đáng nhớ",
    score = 0;
  for (const candidate of titleData) {
    const n = candidate.flag
      ? s.flags.includes(candidate.flag)
        ? 2
        : 0
      : candidate.metric === "age" && candidate.min === 0
        ? 0
        : metric(s, candidate.metric as Parameters<typeof metric>[1]) /
          Math.max(1, candidate.min ?? 1);
    if (n >= 1 && n > score) {
      score = n;
      best = candidate.name;
    }
  }
  return best;
}
export function finishLife(s: GameState, cause: string) {
  if (s.phase === "dead" && s.estate.settled) return;
  s.phase = "dead";
  s.deathCause = cause;
  s.pending = null;
  s.yearQueue = [];
  s.story = null;
  const worth = netWorth(s);
  const live = s.relations.filter((r) => r.alive);
  let shares = Object.entries(s.estate.shares).filter(([id]) =>
    live.some((r) => r.id === id),
  );
  if (!shares.length) {
    const children = live.filter((r) => r.role === "child");
    shares = children.map((r) => [r.id, 100 / children.length]);
  }
  const estateValue = Math.max(0, Math.floor(worth * 0.98));
  const total = shares.reduce((n, [, ratio]) => n + ratio, 0);
  s.estate.distributions = Object.fromEntries(
    shares.map(([id, ratio]) => [
      id,
      Math.floor((estateValue * ratio) / (total || 100)),
    ]),
  );
  s.estate.settled = true;
  const summary = {
    lifeId: s.id,
    name: s.name,
    age: s.age,
    cause,
    title: title(s),
    netWorth: worth,
    children: s.relations.filter((r) => r.role === "child").length,
    job: s.job
      ? jobById.get(s.job.id)!.name
      : s.flags.includes("retired")
        ? "Đã nghỉ hưu"
        : "Một hành trình riêng",
    medals: [...s.medals],
  };
  s.profile.summaries = s.profile.summaries.filter((x) => x.lifeId !== s.id);
  s.profile.summaries.push(summary);
  if (s.profile.summaries.length > 100) s.profile.summaries.shift();
  addLog(
    s,
    `Cuộc đời của ${s.name} khép lại ở tuổi ${s.age}: ${cause}.`,
    "death",
  );
  achievementCheck(s);
}
export function eligibleEvents(s: GameState) {
  return events.filter((e) => eventAllowed(s, e));
}
export function eventAllowed(s: GameState, event: LifeEvent) {
  const history = s.history[event.id];
  return (
    s.age >= event.minAge &&
    s.age <= event.maxAge &&
    eligible(s, event.conditions) &&
    (!history ||
      (!event.once &&
        history.count < event.maxOccurrences &&
        s.age - history.lastAge >= event.cooldownYears)) &&
    event.choices.some((c) => eligible(s, c.conditions))
  );
}
function randomEvent(s: GameState) {
  const pool = eligibleEvents(s);
  if (!pool.length)
    return fallbacks.find((e) => s.age >= e.minAge && s.age <= e.maxAge)!;
  let value = random(s) * pool.reduce((n, e) => n + e.weight, 0);
  for (const e of pool) {
    value -= e.weight;
    if (value < 0) return e;
  }
  return pool[pool.length - 1];
}
export function advanceQueue(s: GameState) {
  while (s.yearQueue.length) {
    const id = s.yearQueue.shift()!;
    const event = id === "@random" ? randomEvent(s) : eventById.get(id);
    requireGame(event, "Nhánh sự kiện không tồn tại.");
    if (id !== "@random" && !eventAllowed(s, event)) {
      addLog(s, "Một cuộc hẹn không còn phù hợp vì hoàn cảnh đã thay đổi.");
      continue;
    }
    const history = s.history[event.id];
    s.history[event.id] = { count: (history?.count ?? 0) + 1, lastAge: s.age };
    s.pending = { instanceId: `${s.id}_event_${++s.actionSerial}`, event };
    s.phase = "awaiting_choice";
    return;
  }
  s.pending = null;
  if (s.phase === "dead") {
    finishLife(s, s.deathCause ?? "Một biến cố trong cuộc đời");
    return;
  }
  if (s.age >= 120 || random(s) < deathChance(s.age, s.stats.health)) {
    finishLife(
      s,
      s.age >= 120
        ? "Một cuộc đời rất dài"
        : s.age >= 60 || s.stats.health < 35
          ? "Sức khoẻ suy giảm"
          : "Một tai nạn bất ngờ trong game",
    );
  } else {
    s.phase = "ready";
    achievementCheck(s);
  }
}
export function startYear(s: GameState) {
  requireGame(
    s.phase === "ready",
    "Hãy giải quyết lựa chọn đang chờ trước khi tăng tuổi.",
  );
  s.age++;
  s.time = 12;
  s.activityUses = {};
  s.sideJob = null;
  s.counters.chainSteps = 0;
  const wasPrison = s.prisonYears > 0;
  for (const r of s.relations.filter((r) => r.alive)) {
    r.age++;
    if (r.role === "child" && r.age === 18) {
      flag(s, "adult_child");
      addLog(s, `${r.name} đã trưởng thành.`, "relationship");
    }
    if (r.age >= 120 || random(s) < deathChance(r.age, 65)) {
      r.alive = false;
      addLog(
        s,
        `${r.name}, ${r.role === "mother" ? "mẹ" : r.role === "father" ? "cha" : "một người thân quen"} của bạn, đã qua đời.`,
        "relationship",
      );
      stat(s, "happiness", -6);
      if (r.role === "spouse") flag(s, "married", false);
    }
  }
  if (s.relations.some((r) => r.alive && r.role === "spouse"))
    count(s, "marriageYears");
  if (s.relations.some((r) => r.alive && r.role === "friend"))
    count(s, "friend_years");
  if (s.age >= 30) {
    if (random(s) < (s.age < 50 ? 0.3 : s.age < 70 ? 0.8 : 1))
      stat(s, "health", -(s.age >= 70 ? 2 : 1));
    if (random(s) < (s.age < 50 ? 0.2 : s.age < 70 ? 0.4 : 0.6))
      stat(s, "looks", -1);
  }
  for (const disease of s.illnesses) {
    stat(s, "health", -Math.max(1, Math.round(disease.severity / 12)));
    disease.severity = Math.min(100, disease.severity + 2);
  }
  economicYear(s);
  if (!wasPrison) studyYear(s);
  if (wasPrison) {
    s.prisonYears--;
    if (!s.prisonYears) {
      addLog(s, "Bạn đã ra tù. Bạn có thể học, tìm việc và xây lại nhịp sống.");
      flag(s, "recovered_record");
    } else
      addLog(
        s,
        `Bạn còn ${s.prisonYears} năm thụ án. Những hoạt động bên ngoài chưa mở.`,
      );
    stat(s, "happiness", -2);
  }
  const due = s.scheduled.filter((e) => e.age <= s.age);
  s.scheduled = s.scheduled.filter((e) => e.age > s.age);
  s.yearQueue = [
    ...due.map((e) => e.eventId),
    "@random",
    ...(random(s) < 0.55 ? ["@random"] : []),
    ...(random(s) < 0.15 ? ["@random"] : []),
  ];
  advanceQueue(s);
}
