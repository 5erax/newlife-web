import { describe, it, expect } from "vitest";
import { validateContent } from "../src/tools/content";
import { nextRandom } from "../src/engine/rng";
import { newLife } from "../src/engine/game";
import { deathChance } from "../src/engine/year";
import { title } from "../src/engine/year";
import titles from "../src/content/titles.json" with { type: "json" };
import { chooseOutcome } from "../src/engine/conditions";
describe("content and probability boundaries", () => {
  it("has a deterministic reachable winner for all ten titles", () => {
    for (const candidate of titles) {
      const s = newLife({
        name: "An",
        gender: "other",
        hometown: "Huế",
        birthDate: "2000-01-01",
        seed: 42,
      });
      s.stats = { health: 0, happiness: 0, intelligence: 0, looks: 0 };
      s.relations = [];
      s.flags = [];
      s.counters = {};
      if (candidate.flag) s.flags = [candidate.flag];
      else if (candidate.metric === "children")
        s.relations = Array.from({ length: candidate.min ?? 0 }, (_, i) => ({
          id: "title_child_" + i,
          name: "Con",
          role: "child",
          age: 0,
          alive: true,
          closeness: 50,
          trait: "vui",
          resources: 0,
          parents: [],
        }));
      else if (candidate.metric === "age") s.age = candidate.min ?? 0;
      else if (candidate.metric === "netWorth") s.money = candidate.min ?? 0;
      else if (candidate.metric && candidate.metric in s.stats)
        s.stats[candidate.metric as keyof typeof s.stats] = candidate.min ?? 0;
      else if (candidate.metric)
        s.counters[candidate.metric] = candidate.min ?? 0;
      expect(title(s), candidate.id).toBe(candidate.name);
      expect(title(s)).toBe(title(structuredClone(s)));
    }
  });
  it("has all authored catalog entries and reachable story endings", () => {
    expect(validateContent().lifeEvents).toBe(150);
  });
  it("never sets baseline death risk to zero at perfect health", () => {
    expect(deathChance(75, 100)).toBeCloseTo(deathChance(75, 50) * 0.5);
    expect(deathChance(75, 0)).toBeCloseTo(deathChance(75, 50) * 2);
  });
  it("rejects probabilities that would make outcome selection undefined", () => {
    const s = newLife({
      name: "An",
      gender: "other",
      hometown: "Huế",
      birthDate: "2000-01-01",
      seed: 14,
    });
    expect(() =>
      chooseOutcome(s, [{ chance: 0.4, text: "Sai", effects: [] }]),
    ).toThrow();
  });
  it("keeps the uint32 generator in range across edge seeds", () => {
    for (const seed of [0, 1, 42, 4294967295]) {
      let state = seed;
      for (let i = 0; i < 1000; i++) {
        const r = nextRandom(state);
        expect(r.value).toBeGreaterThanOrEqual(0);
        expect(r.value).toBeLessThan(1);
        state = r.state;
      }
    }
  });
});
