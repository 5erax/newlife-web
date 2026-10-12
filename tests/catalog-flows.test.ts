import { describe, it, expect } from "vitest";
import {
  activities,
  assets,
  events,
  fallbacks,
  jobs,
  education,
  achievements,
  stories,
} from "../src/content/catalog";
import {
  newLife,
  reduce,
  activityTargets,
  activityReason,
} from "../src/engine/game";
import { createAsset, flag } from "../src/engine/helpers";
import { meets } from "../src/engine/conditions";
import { nextRandom } from "../src/engine/rng";
import { economicYear, studyYear } from "../src/engine/economy";
import { achievementCheck } from "../src/engine/year";
import { parseSave, serialize } from "../src/engine/save";
import type { Condition, GameState, Role } from "../src/engine/types";
function fixture() {
  const s = newLife({
    name: "An kiểm thử",
    gender: "female",
    hometown: "Huế",
    birthDate: "2000-01-01",
    seed: 42,
  });
  s.age = 35;
  s.money = 100_000_000_000;
  s.stats = { health: 95, happiness: 95, intelligence: 95, looks: 95 };
  s.education.score = 95;
  s.education.completed = education.map((e) => e.id);
  s.relations = [];
  for (const role of [
    "mother",
    "father",
    "sibling",
    "friend",
    "lover",
    "spouse",
    "child",
  ] as Role[])
    s.relations.push({
      id: "fixture_" + role,
      name: role,
      role,
      age: role === "child" ? 10 : 40,
      closeness: 90,
      alive: true,
      trait: "vui",
      resources: 10000000,
      parents: [],
    });
  s.illnesses = [
    {
      id: "fixture_illness",
      type: "cảm",
      severity: 30,
      discoveredAge: 30,
      progress: 0,
    },
  ];
  for (const item of assets) createAsset(s, item.id);
  return s;
}
function satisfy(s: GameState, c: Condition, invert = false) {
  if ("all" in c) {
    c.all.forEach((x) => satisfy(s, x, invert));
    return;
  }
  if ("any" in c) {
    satisfy(s, c.any[0], invert);
    return;
  }
  if ("not" in c) {
    satisfy(s, c.not, !invert);
    return;
  }
  if ("flag" in c) {
    flag(s, c.flag, invert ? !c.is : c.is);
    return;
  }
  if ("has" in c) {
    const want = !invert;
    if (c.has === "job")
      s.job = want
        ? {
            id: c.id === "any" ? jobs[0].id : c.id,
            rank: 0,
            years: 10,
            performance: 90,
            salary: 10000000,
          }
        : null;
    if (c.has === "education")
      s.education.completed = want
        ? Array.from(new Set([...s.education.completed, c.id]))
        : s.education.completed.filter((x) => x !== c.id);
    if (c.has === "role" && !want)
      s.relations = s.relations.filter((r) => r.role !== c.id);
    if (c.has === "illness" && !want) s.illnesses = [];
    return;
  }
  const delta = c.op === ">" ? 1 : c.op === "<" ? -1 : 0;
  const value = invert ? 0 : c.value + delta;
  if (c.field in s.stats) s.stats[c.field as keyof GameState["stats"]] = value;
  else if (c.field === "age") s.age = value;
  else if (c.field === "money") s.money = value;
  else if (c.field === "jobRank" && s.job) s.job.rank = value;
  else if (c.field === "schoolScore") s.education.score = value;
  else s.counters[c.field] = value;
}
function seedFor(low: number, high: number) {
  for (let seed = 0; seed < 100000; seed++) {
    const r = nextRandom(seed).value;
    if (r >= low && r < high) return seed;
  }
  throw Error("Không tìm thấy seed cho kết quả");
}
describe("all authored content can execute and save", () => {
  it("executes every event choice and every probabilistic outcome", () => {
    let count = 0;
    for (const event of [...events, ...fallbacks])
      for (const choice of event.choices) {
        let low = 0;
        for (const outcome of choice.outcomes) {
          const s = fixture();
          s.age = Math.max(event.minAge, Math.min(35, event.maxAge));
          event.conditions.forEach((c) => satisfy(s, c));
          choice.conditions?.forEach((c) => satisfy(s, c));
          expect(meets(s, { all: event.conditions }), event.id).toBe(true);
          s.rng = seedFor(low, low + outcome.chance);
          low += outcome.chance;
          s.phase = "awaiting_choice";
          s.pending = { instanceId: "fixture_event", event };
          s.yearQueue = [];
          const result = reduce(s, {
            type: "choose",
            instanceId: "fixture_event",
            optionId: choice.id,
          });
          expect(
            result.log.some((row) => row.text.includes(outcome.text)),
            event.id + "/" + choice.id,
          ).toBe(true);
          expect(
            () => parseSave(serialize(result)),
            event.id + "/" + choice.id,
          ).not.toThrow();
          count++;
        }
      }
    expect(count).toBe(593);
  });
  it("executes all 108 activities and their outcomes with valid targets", () => {
    for (const a of activities) {
      let low = 0;
      for (const outcome of a.outcomes) {
        const s = fixture();
        s.age = Math.max(35, a.minAge);
        a.conditions.forEach((c) => satisfy(s, c));
        if (a.id === "act_thucung_08") {
          s.assets
            .filter((x) => x.catalogId.startsWith("asset_thucung"))
            .forEach((x) => (x.lost = true));
          flag(s, "pet_lost");
        }
        s.rng = seedFor(low, low + outcome.chance);
        low += outcome.chance;
        expect(activityReason(s, a), a.id).toBeNull();
        const result = reduce(s, {
          type: "activity",
          id: a.id,
          targetId: activityTargets(s, a)[0]?.id,
        });
        expect(
          result.log.some((row) => row.text.includes(outcome.text)),
          a.id,
        ).toBe(true);
        expect(() => parseSave(serialize(result)), a.id).not.toThrow();
      }
    }
  });
  it("graduates each program and awards the military service medal once", () => {
    for (const e of education) {
      let s = fixture();
      s.education.completed = s.education.completed.filter((x) => x !== e.id);
      s.education.current = null;
      s = reduce(s, { type: "enroll", id: e.id, specialty: "congnghe" });
      for (let year = 0; year < e.years; year++) {
        s.age++;
        studyYear(s);
      }
      expect(s.education.completed, e.id).toContain(e.id);
      expect(s.education.current, e.id).toBeNull();
    }
    const s = fixture(),
      j = jobs.find((j) => j.industry === "quandoi")!;
    s.job = {
      id: j.id,
      rank: 0,
      years: 19,
      performance: 90,
      salary: j.ranks[0].salary,
    };
    s.counters.serviceYears = 19;
    economicYear(s);
    economicYear(s);
    expect(s.medals.filter((x) => x === "medal_service")).toHaveLength(1);
  });
  it("unlocks each achievement once and records its first life", () => {
    for (const a of achievements) {
      const s = fixture();
      a.conditions.forEach((c) => satisfy(s, c));
      s.profile.endings = Object.fromEntries(
        stories.map((story) => [
          story.id,
          [story.nodes.find((n) => n.ending)!.ending!.id],
        ]),
      );
      for (let i = 0; i < 12; i++) s.counters["group_fixture_" + i] = 1;
      achievementCheck(s);
      achievementCheck(s);
      expect(
        s.profile.achievements.filter((id) => id === a.id),
        a.id,
      ).toHaveLength(1);
      expect(s.profile.unlockLives?.[a.id]).toBe(s.id);
      expect(() => parseSave(serialize(s))).not.toThrow();
    }
  });
  it("buys each asset from the shop and sells eligible instances exactly once", () => {
    for (const item of assets) {
      const s = fixture();
      s.assets = [];
      const bought = reduce(s, { type: "buy", id: item.id });
      expect(bought.assets).toHaveLength(1);
      expect(bought.money).toBeLessThan(s.money);
      if (item.category !== "pet") {
        const sold = reduce(bought, {
          type: "sell",
          instanceId: bought.assets[0].instanceId,
        });
        expect(sold.money).toBeLessThan(s.money);
        expect(() =>
          reduce(sold, {
            type: "sell",
            instanceId: bought.assets[0].instanceId,
          }),
        ).toThrow();
      } else
        expect(() =>
          reduce(bought, {
            type: "sell",
            instanceId: bought.assets[0].instanceId,
          }),
        ).toThrow();
    }
  });
});
