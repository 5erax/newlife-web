import { pendingChoices } from "../src/engine/branches";
import { describe, it, expect } from "vitest";
import {
  newLife,
  reduce,
  activityReason,
  activityTargets,
} from "../src/engine/game";
import { studyYear, jobReason } from "../src/engine/economy";
import { jobs, activities, assets, stories } from "../src/content/catalog";
import { serialize, parseSave } from "../src/engine/save";
const fixture = () => {
  const s = newLife({
    name: "Mai An",
    gender: "female",
    hometown: "Huế",
    birthDate: "2000-03-04",
    seed: 42,
  });
  s.age = 25;
  s.money = 900_000_000;
  s.stats = { health: 95, happiness: 70, intelligence: 95, looks: 90 };
  s.education.completed = [
    "edu_primary",
    "edu_lower_secondary",
    "edu_upper_secondary",
    "edu_vocational",
    "edu_college",
    "edu_university",
    "edu_medical",
    "edu_postgraduate",
  ];
  s.education.score = 95;
  return s;
};
describe("whole systems and trust boundaries", () => {
  it("charges exactly two academic years for a two-year program", () => {
    let s = fixture();
    s.education.current = null;
    s.education.completed = s.education.completed.filter(
      (id) => id !== "edu_vocational",
    );
    s = reduce(s, { type: "enroll", id: "edu_vocational" });
    studyYear(s);
    studyYear(s);
    expect(s.education.current).toBeNull();
    expect(s.ledger.filter((e) => e.label.includes("Học phí"))).toHaveLength(2);
  });
  it("rejects dating a parent even if a caller passes their ID", () => {
    const s = fixture();
    expect(() =>
      reduce(s, {
        type: "relation",
        id: s.relations.find((r) => r.role === "mother")!.id,
        action: "date",
      }),
    ).toThrow();
  });
  it("every job has both a reachable qualified and blocked applicant", () => {
    for (const j of jobs) {
      const s = fixture();
      s.education.specialty = j.industry;
      expect(jobReason(s, j.id)).toBeNull();
      const next = reduce(s, { type: "job", id: j.id });
      expect(next.job?.id).toBe(j.id);
      s.education.completed = [];
      expect(jobReason(s, j.id)).not.toBeNull();
    }
  });
  it("buy then sell cannot create money or apply a sale twice", () => {
    for (const item of assets.filter(
      (x) => x.category !== "pet" && x.price < 800_000_000,
    )) {
      const s = fixture();
      const bought = reduce(s, { type: "buy", id: item.id });
      const id = bought.assets.at(-1)!.instanceId;
      const sold = reduce(bought, { type: "sell", instanceId: id });
      expect(sold.money).toBeLessThan(s.money);
      expect(() => reduce(sold, { type: "sell", instanceId: id })).toThrow();
    }
  });
  it("only permits the exact asset instance category an activity needs", () => {
    let s = reduce(fixture(), { type: "buy", id: "asset_xe_02" });
    s = reduce(s, { type: "buy", id: "asset_nha_01" });
    const a = activities.find((a) => a.id === "act_nhacua_05")!;
    expect(activityReason(s, a)).toBeNull();
    const car = s.assets.find((x) => x.catalogId === "asset_xe_02")!;
    expect(activityTargets(s, a).some((t) => t.id === car.instanceId)).toBe(
      false,
    );
    expect(() =>
      reduce(s, { type: "activity", id: a.id, targetId: car.instanceId }),
    ).toThrow();
  });
  it("walks every reachable story ending without changing life RNG or age", () => {
    for (const story of stories) {
      const paths: { node: string; path: string[] }[] = [
        { node: story.start, path: [] },
      ];
      const seen = new Set<string>();
      while (paths.length) {
        const current = paths.shift()!;
        if (seen.has(current.node)) continue;
        seen.add(current.node);
        const node = story.nodes.find((n) => n.id === current.node)!;
        if (node.ending) {
          let s = reduce(fixture(), { type: "storyStart", id: story.id });
          const age = s.age,
            rng = s.rng;
          for (const id of current.path) {
            s = reduce(s, {
              type: "storyChoice",
              nodeId: s.story!.nodeId,
              choiceId: id,
            });
          }
          expect(s.story?.nodeId).toBe(node.id);
          expect(s.profile.endings[story.id]).toContain(node.ending.id);
          expect(s.age).toBe(age);
          expect(s.rng).toBe(rng);
          expect(parseSave(serialize(s))).toEqual(s);
        }
        for (const c of node.choices)
          paths.push({ node: c.next, path: [...current.path, c.id] });
      }
      expect([...seen].length).toBe(story.nodes.length);
    }
  });
  it("keeps the original state if an activity cannot be afforded", () => {
    const s = fixture();
    s.money = 0;
    const previous = structuredClone(s);
    expect(() =>
      reduce(s, { type: "activity", id: "act_suckhoe_04" }),
    ).toThrow();
    expect(s).toEqual(previous);
  });
  it("round-trips free actions and camel-case counter milestones", () => {
    let s = fixture();
    s = reduce(s, { type: "activity", id: "act_thechat_01" });
    s = reduce(s, { type: "age" });
    while (s.pending)
      s = reduce(s, {
        type: "choose",
        instanceId: s.pending.instanceId,
        optionId: pendingChoices(s.pending).find((c) => !c.conditions?.length)!
          .id,
      });
    expect(parseSave(serialize(s))).toEqual(s);
  });
});
