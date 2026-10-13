import {
  newLife,
  reduce,
  activityReason,
  activityTargets,
} from "../engine/game";
import {
  activities,
  jobs,
  education,
  events,
  assets,
} from "../content/catalog";
import { jobReason, educationReason } from "../engine/economy";
import { eligible } from "../engine/conditions";
import { nextRandom } from "../engine/rng";
import { serialize, parseSave } from "../engine/save";
import type { Action, GameState } from "../engine/types";
import { pendingChoices } from "../engine/branches";
import assert from "node:assert/strict";
import { branchStats } from "./branch-analysis";
import { localPrice } from "../engine/world";
import { casinoBetLimit, blackjackScore } from "../engine/casino";
import { writeFileSync } from "node:fs";
export function simulateLife(seed: number, strategy = 0) {
  let s = newLife({
    name: "An Mô Phỏng",
    gender: seed % 2 ? "female" : "male",
    hometown: "Đà Nẵng",
    birthDate: "2000-06-15",
    seed,
    origin: "random",
  });
  let botRng = seed ^ 0x12345678;
  let steps = 0;
  const act = (action: Action) => {
    const previous = s;
    s = reduce(s, action);
    const deltas = s.log
      .slice(previous.log.length)
      .filter((r) => r.source !== "summary")
      .flatMap((r) => r.deltas);
    for (const key of [
      "health",
      "happiness",
      "intelligence",
      "looks",
      "money",
    ] as const) {
      const before = key === "money" ? previous.money : previous.stats[key],
        after = key === "money" ? s.money : s.stats[key];
      assert.equal(
        deltas
          .filter((d) => d.key === key)
          .reduce((n, d) => n + d.after - d.before, 0),
        after - before,
        `Missing delta: ${seed}/${s.age}/${action.type}/${key}`,
      );
    }
  };
  while (s.phase !== "dead") {
    assert(++steps < 1000, `Stuck: seed ${seed}, age ${s.age}`);
    if (s.pending) {
      const choices = pendingChoices(s.pending).filter((c) =>
        eligible(s, c.conditions),
      );
      assert(choices.length);
      const next = nextRandom(botRng);
      botRng = next.state;
      const choice =
        strategy === 3
          ? choices[Math.floor(next.value * choices.length)]
          : choices[(strategy + seed) % choices.length];
      act({
        type: "choose",
        instanceId: s.pending.instanceId,
        optionId: choice.id,
      });
      continue;
    }
    if (s.age >= 18 && !s.prisonYears) {
      const offers = jobs
        .filter((j) => !jobReason(s, j.id))
        .sort((a, b) => b.ranks[0].salary - a.ranks[0].salary);
      if (
        offers.length &&
        (!s.job ||
          (offers[0].id !== s.job.id &&
            localPrice(s, offers[0].ranks[0].salary) > s.job.salary))
      )
        act({ type: "job", id: offers[0].id });
      if (strategy === 1 && !s.education.current && s.age < 45) {
        const target = education.find(
          (e) =>
            ["edu_vocational", "edu_university", "edu_postgraduate"].includes(
              e.id,
            ) &&
            !educationReason(s, e.id) &&
            s.money >= e.cost,
        );
        if (target)
          act({ type: "enroll", id: target.id, specialty: "congnghe" });
      }
      if (
        strategy === 2 &&
        s.age === 25 &&
        !s.relations.some(
          (r) => r.alive && (r.role === "lover" || r.role === "spouse"),
        ) &&
        s.money >= 100000
      ) {
        const a = activities.find((x) => x.id === "act_tinhcam_01")!;
        if (!activityReason(s, a)) act({ type: "activity", id: a.id });
      }
      const lover = s.relations.find((r) => r.alive && r.role === "lover");
      if (strategy === 2 && lover) {
        if (lover.closeness >= 65)
          act({ type: "relation", id: lover.id, action: "propose" });
        else act({ type: "relation", id: lover.id, action: "talk" });
      }
      const spouse = s.relations.find((r) => r.alive && r.role === "spouse");
      if (
        strategy === 2 &&
        spouse &&
        s.relations.filter((r) => r.role === "child").length < 2 &&
        s.age >= 28 &&
        s.age < 40 &&
        s.money >= 1000000 &&
        s.time
      )
        act({ type: "relation", id: spouse.id, action: "baby" });
    }
    if (s.age === 30 && !s.prisonYears) {
      const item = assets.find(
        (a) =>
          a.id ===
          (strategy === 2
            ? "asset_thucung_01"
            : strategy === 1
              ? "asset_dautu_01"
              : "asset_xe_01"),
      );
      if (item && s.money >= Math.round(s.market[item.id] * 1.02))
        act({ type: "buy", id: item.id });
    }
    if (
      strategy === 3 &&
      s.age >= 15 &&
      s.age <= 35 &&
      !s.prisonYears &&
      s.age >= s.casino.bannedUntil &&
      casinoBetLimit(s) >= 1000
    ) {
      act({
        type: "casinoDeal",
        game: s.age % 2 ? "blackjack" : "bacao",
        bet: 1000,
      });
      while (s.casino.hand)
        act({
          type:
            blackjackScore(s.casino.hand.player).value < 17
              ? "casinoHit"
              : "casinoStand",
        });
    }
    const aid = activities.find(
      (a) =>
        a.id ===
        (strategy === 3
          ? "act_ruiro_01"
          : strategy === 0
            ? "act_thechat_01"
            : strategy === 1
              ? "act_hoctap_01"
              : "act_giaitri_03"),
    )!;
    if (!activityReason(s, aid)) {
      const targets = activityTargets(s, aid);
      act({ type: "activity", id: aid.id, targetId: targets[0]?.id });
    }
    if (s.age === 40) {
      const restored = parseSave(serialize(s));
      assert.deepEqual(restored, s);
      s = restored;
    }
    act({ type: "age" });
  }
  return s;
}
export function runSimulation(total: number) {
  assert(Number.isInteger(total) && total > 0 && total <= 100000);
  let ageSum = 0,
    early = 0;
  const deaths: number[] = [];
  let choiceDeaths = 0;
  const careers = new Set<string>(),
    owned = new Set<string>();
  const seen = new Set<string>();
  let eventOccurrences = 0,
    repeatedOccurrences = 0,
    maxEventOccurrences = 0;
  const started = performance.now();
  const statTotals = { health: 0, happiness: 0, intelligence: 0, looks: 0 };
  let annualSamples = 0,
    constantLooks20 = 0,
    missingDeltas = 0;
  const looksByAge: Record<
    string,
    { n: number; sum: number; squares: number }
  > = {};
  const branches: Record<string, number> = {};
  for (let i = 0; i < total; i++) {
    const seed = (i * 7919 + 42) >>> 0;
    try {
      const s = simulateLife(seed, i % 4);
      for (const [key, n] of Object.entries(s.caseHistory))
        branches[key] = (branches[key] ?? 0) + n;
      let previousLooks =
          s.log.flatMap((r) => r.deltas).find((d) => d.key === "looks")
            ?.before ?? s.stats.looks,
        streak = 0;
      for (const row of s.log.filter(
        (r) => r.source === "summary" && r.age > 0,
      )) {
        annualSamples++;
        for (const key of Object.keys(
          statTotals,
        ) as (keyof typeof statTotals)[]) {
          const d = row.deltas.find((d) => d.key === key);
          statTotals[key] += d ? Math.abs(d.after - d.before) : 0;
        }
        const value =
          row.deltas.find((d) => d.key === "looks")?.after ?? previousLooks;
        streak = value === previousLooks ? streak + 1 : 0;
        if (streak === 19) constantLooks20++;
        previousLooks = value;
        const band =
          row.age < 6
            ? "0–5"
            : row.age < 12
              ? "6–11"
              : row.age < 18
                ? "12–17"
                : row.age < 30
                  ? "18–29"
                  : row.age < 45
                    ? "30–44"
                    : row.age < 60
                      ? "45–59"
                      : "60+";
        const sample = (looksByAge[band] ??= { n: 0, sum: 0, squares: 0 });
        sample.n++;
        sample.sum += value;
        sample.squares += value * value;
      }
      for (const row of s.log)
        if (row.source !== "summary")
          for (const d of row.deltas) if (!d.reasons.length) missingDeltas++;
      ageSum += s.age;
      deaths.push(s.age);
      if (
        ![
          "Một cuộc đời rất dài",
          "Sức khoẻ suy giảm",
          "Một tai nạn bất ngờ trong game",
          "Một biến cố sức khoẻ rất sớm trong game",
        ].includes(s.deathCause ?? "")
      )
        choiceDeaths++;
      s.assets.forEach((a) => owned.add(a.catalogId));
      if (s.job) careers.add(s.job.id);
      if (s.age < 20) early++;
      Object.keys(s.history).forEach((id) => seen.add(id));
      for (const h of Object.values(s.history)) {
        eventOccurrences += h.count;
        repeatedOccurrences += Math.max(0, h.count - 1);
        maxEventOccurrences = Math.max(maxEventOccurrences, h.count);
      }
      assert(s.phase === "dead");
      assert(s.stats.health >= 0 && s.stats.health <= 100);
      assert(Number.isSafeInteger(s.money));
    } catch (e) {
      throw Error(
        `Simulation seed ${seed}, strategy ${i % 4}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
    if (total >= 1000 && (i + 1) % 1000 === 0)
      console.log(`Completed ${i + 1}/${total} lives.`);
  }
  deaths.sort((a, b) => a - b);
  const report = {
    lives: total,
    crashes: 0,
    stuck: 0,
    meanAge: Number((ageSum / total).toFixed(2)),
    medianAge: deaths[Math.floor(total / 2)],
    earlyDeathPercent: Number(((early / total) * 100).toFixed(2)),
    choiceDeaths,
    careersSeen: careers.size,
    assetsSeen: owned.size,
    fallbacksSeen: [...seen].filter((id) => id.startsWith("fallback_")).length,
    eventsSeen: events.filter((e) => seen.has(e.id)).length,
    eventCount: events.length,
    eventOccurrences,
    repeatedOccurrences,
    repeatedPercent: Number(
      ((100 * repeatedOccurrences) / Math.max(1, eventOccurrences)).toFixed(2),
    ),
    maxEventOccurrences,
    durationSeconds: Number(((performance.now() - started) / 1000).toFixed(2)),
    annualSamples,
    meanAbsoluteAnnualStats: Object.fromEntries(
      Object.entries(statTotals).map(([k, n]) => [
        k,
        Number((n / annualSamples).toFixed(3)),
      ]),
    ),
    looksStandardDeviation: Object.fromEntries(
      Object.entries(looksByAge).map(([k, b]) => [
        k,
        Number(
          Math.sqrt(Math.max(0, b.squares / b.n - (b.sum / b.n) ** 2)).toFixed(
            3,
          ),
        ),
      ]),
    ),
    constantLooks20,
    missingDeltas,
    branchesSeen: Object.keys(branches).length,
  };
  if (process.argv.includes("--report")) {
    if (total >= 10000) {
      assert(
        Object.values(report.meanAbsoluteAnnualStats).every(
          (n) => n >= 3 && n <= 6,
        ),
        "Annual stat changes outside 3–6 target",
      );
      assert(
        Object.values(report.looksStandardDeviation).every((n) => n > 0),
        "Constant appearance population",
      );
      assert(
        report.constantLooks20 === 0,
        "Appearance unchanged for twenty years",
      );
      assert(report.missingDeltas === 0, "Missing reasons for changes");
    }
    writeFileSync(
      "docs/qa/expansion-simulation.json",
      JSON.stringify(report, null, 2) + "\n",
    );
    const keys = branchStats().trees.flatMap((t) => t.caseKeys);
    writeFileSync(
      "docs/qa/branch-coverage.json",
      JSON.stringify(
        {
          lives: total,
          seen: keys.filter((k) => branches[k]).length,
          seenIncludingFallbacks: Object.keys(branches).length,
          total: keys.length,
          unseen: keys.filter((k) => !branches[k]),
          rare: keys.filter((k) => (branches[k] ?? 0) > 0 && branches[k] < 5),
          counts: branches,
        },
        null,
        2,
      ) + "\n",
    );
  }
  return report;
}
if (process.argv[1]?.replaceAll("\\", "/").endsWith("/simulate.ts"))
  console.log(
    JSON.stringify(runSimulation(Number(process.argv[2] ?? 10000)), null, 2),
  );
