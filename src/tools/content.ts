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
} from "../content/catalog";
import type { Condition } from "../engine/types";
import { conditionSchema } from "../schema/content";
import assert from "node:assert/strict";
export function validateContent() {
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
    lifeEvents: 150,
    careerEvents: 144,
    activities: 108,
    assets: 24,
    education: 10,
    jobs: 48,
    achievements: 40,
    stories: 5,
    nodes: 60,
    endings: 15,
  });
  return counts;
}
if (process.argv[1]?.replaceAll("\\", "/").endsWith("/content.ts"))
  console.log(JSON.stringify(validateContent(), null, 2));
