import {
  activities,
  assets,
  achievements,
  education,
  events,
  fallbacks,
  jobs,
  stories,
  eventById,
  assetById,
  educationById,
  jobById,
  apkEvents,
  apkJobs,
  apkEducation,
  apkInterviews,
} from "../content/catalog";
import apkCoverage from "../content/apk/coverage.json" with { type: "json" };
import apkSources from "../content/apk/event-sources.json" with { type: "json" };
import apkMajors from "../content/apk/majors.vi.json" with { type: "json" };
import apkCoins from "../content/apk/coins.json" with { type: "json" };
import type { Condition } from "../engine/types";
import { conditionSchema } from "../schema/content";
import assert from "node:assert/strict";
import names from "../content/names.json" with { type: "json" };
import { branchStats } from "./branch-analysis";
import { originById } from "../engine/world";
export function validateContent() {
  assert.equal(names.sourceKind, "original_web");
  assert.equal(names.version, "1.0.0");
  for (const list of [
    names.surnames,
    names.male,
    names.female,
    names.middles.male,
    names.middles.female,
    names.traits,
  ])
    assert(
      list.length &&
        list.every((n) => typeof n === "string" && n.trim() && n.length <= 60),
      "Invalid name/trait catalog",
    );
  assert.equal(
    new Set(names.hometownCatalog.map((h) => h.id)).size,
    names.hometowns.length,
  );
  assert(
    names.hometownCatalog.every(
      (h) => /^home_\d+$/.test(h.id) && names.hometowns.includes(h.name),
    ),
    "Invalid hometown ID",
  );
  for (const [name, list] of Object.entries({
    activities,
    assets,
    achievements,
    education,
    events,
    fallbacks,
    jobs,
    stories,
  })) {
    assert.equal(
      new Set(list.map((x) => x.id)).size,
      list.length,
      `${name}: duplicate ID`,
    );
  }
  function condition(c: Condition) {
    conditionSchema.parse(c);
    if ("origin" in c) assert(originById.has(c.origin));
    if ("all" in c) c.all.forEach(condition);
    if ("any" in c) c.any.forEach(condition);
    if ("not" in c) condition(c.not);
    if ("has" in c) {
      if (c.has === "education")
        assert(educationById.has(c.id), `Unknown education ${c.id}`);
      if (c.has === "job" && c.id !== "any")
        assert(jobById.has(c.id), `Unknown job ${c.id}`);
      if (c.has === "asset")
        assert(
          assetById.has(c.id) ||
            [
              "any",
              "house",
              "vehicle",
              "investment",
              "equipment",
              "luxury",
              "pet",
            ].includes(c.id),
          `Unknown asset ${c.id}`,
        );
    }
  }
  for (const e of [...events, ...fallbacks]) {
    e.conditions.forEach(condition);
    assert(
      e.choices.some((c) => !c.conditions?.length),
      `${e.id}: no unconditional choice`,
    );
    for (const choice of e.choices) {
      choice.conditions?.forEach(condition);
      for (const o of choice.outcomes) {
        if (o.nextEvent) assert(eventById.has(o.nextEvent));
        if (o.schedule) assert(eventById.has(o.schedule.eventId));
      }
    }
  }
  for (const a of activities) {
    a.conditions.forEach(condition);
    assert(a.timeCost >= 1);
  }
  for (const j of jobs) {
    j.origins?.forEach((id) => assert(originById.has(id)));
    assert(educationById.has(j.degree), `${j.id}: missing degree`);
    assert(
      j.ranks.every((r, i) => i === 0 || r.salary >= j.ranks[i - 1].salary),
    );
  }
  for (const e of education)
    e.requires.forEach((id) => assert(educationById.has(id)));
  for (const a of achievements) a.conditions.forEach(condition);
  for (const story of stories) {
    const nodeMap = new Map(story.nodes.map((n) => [n.id, n]));
    assert.equal(nodeMap.size, story.nodes.length);
    assert(nodeMap.has(story.start));
    const seen = new Set<string>();
    const todo = [story.start];
    while (todo.length) {
      const id = todo.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const node = nodeMap.get(id)!;
      assert(node.ending || node.choices.length, `${story.id}/${id}: dead end`);
      for (const c of node.choices) {
        assert(nodeMap.has(c.next), `${story.id}: missing node ${c.next}`);
        todo.push(c.next);
      }
    }
    assert.equal(seen.size, nodeMap.size, `${story.id}: unreachable node`);
    assert(story.nodes.filter((n) => n.ending).length >= 3);
  }
  const counts = {
    lifeEvents: events.filter((e) => e.group !== "career").length,
    careerEvents: events.filter((e) => e.group === "career").length,
    activities: activities.length,
    assets: assets.length,
    education: education.length,
    jobs: jobs.length,
    achievements: achievements.length,
    stories: stories.length,
    nodes: stories.reduce((n, s) => n + s.nodes.length, 0),
    endings: stories.reduce(
      (n, s) => n + s.nodes.filter((n) => n.ending).length,
      0,
    ),
  };
  assert.deepEqual(counts, {
    lifeEvents: 214,
    careerEvents: 144,
    activities: 151,
    assets: 24,
    education: 10,
    jobs: 48,
    achievements: 42,
    stories: 5,
    nodes: 60,
    endings: 15,
  });
  const branches = branchStats();
  assert.equal(apkEvents.length, apkCoverage.playableEvents);
  assert.equal(
    apkEvents.filter((e) => !e.apkRequirements?.trip).length +
      apkCoverage.deferredCore.length,
    apkCoverage.coreRows,
  );
  assert.equal(apkJobs.length, 168);
  assert.equal(apkInterviews.length, apkCoverage.interviewRows);
  assert.equal(
    apkInterviews.reduce(
      (n, q) => n + q.answers.length + (q.defaultAnswer ? 1 : 0),
      0,
    ),
    apkCoverage.interviewAnswers,
  );
  const interviewIds = apkInterviews.flatMap((q) => [
    q.id,
    ...q.answers.map((a) => a.id),
    ...(q.defaultAnswer ? [q.defaultAnswer.id] : []),
  ]);
  assert.equal(new Set(interviewIds).size, interviewIds.length);
  for (const q of apkInterviews) {
    assert(
      ![
        q.question,
        q.cta,
        ...q.answers.map((a) => a.label),
        q.defaultAnswer?.label ?? "",
      ].some((t) => /<[^>]+>|undefined|\\u[0-9a-fA-F]{4}/.test(t)),
    );
  }
  assert.equal(
    apkEvents.filter((e) => e.group === "apk_friend").length,
    apkCoverage.friendRows,
  );
  assert.equal(apkCoins.length, 21);
  assert.equal(apkEducation.length, 5);
  assert.equal(
    new Set([...events, ...fallbacks, ...apkEvents].map((e) => e.id)).size,
    events.length + fallbacks.length + apkEvents.length,
  );
  assert.equal(
    new Set([...jobs, ...apkJobs].map((j) => j.id)).size,
    jobs.length + apkJobs.length,
  );
  assert.equal(apkSources.length, apkEvents.length);
  assert(
    apkSources.every(
      (r) =>
        eventById.get(r.id)?.sourceKind === "apk_translation" && r.record > 0,
    ),
  );
  for (const e of apkEvents) {
    assert.equal(e.sourceKind, "apk_translation");
    assert(e.apkRequirements);
    if (e.apkRequirements.careerId)
      assert(jobById.has(e.apkRequirements.careerId));
    assert(
      e.choices.every(
        (c) => c.outcomes.length === 1 && c.outcomes[0].chance === 1,
      ),
      "Do not invent native outcome probabilities",
    );
  }
  for (const j of apkJobs) {
    assert(j.apkRequirements);
    assert(!j.degree || educationById.has(j.degree));
    assert(
      j.apkRequirements.majors.every((id) =>
        apkMajors.some((m) => m.id === id),
      ),
    );
    assert(
      j.ranks.every((r, i) => i === 0 || r.salary >= j.ranks[i - 1].salary),
    );
  }
  return {
    ...counts,
    averageLeaves: branches.averageLeaves,
    nestedPercent: branches.nestedPercent,
    chains: branches.chains,
    apk: {
      events: apkEvents.length,
      deferredCore: apkCoverage.deferredCore.length,
      jobs: apkJobs.length,
      crypto: apkCoins.length,
      interviews: apkInterviews.length,
      interviewAnswers: apkCoverage.interviewAnswers,
    },
  };
}
if (process.argv[1]?.replaceAll("\\", "/").endsWith("/content.ts"))
  console.log(JSON.stringify(validateContent(), null, 2));
