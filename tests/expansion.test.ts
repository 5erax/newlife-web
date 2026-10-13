import { describe, it, expect } from "vitest";
import { newLife, reduce } from "../src/engine/game";
import { serialize, parseSave } from "../src/engine/save";

const options = {
  name: "An",
  gender: "female" as const,
  hometown: "Huế",
  birthDate: "2000-01-01",
  seed: 42,
};
describe("visible and persisted changes", () => {
  it("explains every actual stat and cash change without mutating old logs", () => {
    const s = newLife(options),
      original = structuredClone(s);
    const next = reduce(s, { type: "age" });
    for (const key of [
      "health",
      "happiness",
      "intelligence",
      "looks",
      "money",
    ] as const) {
      const before = key === "money" ? s.money : s.stats[key];
      const after = key === "money" ? next.money : next.stats[key];
      const sum = next.log
        .slice(s.log.length)
        .filter((r) => r.source !== "summary")
        .flatMap((r) => r.deltas)
        .filter((d) => d.key === key)
        .reduce((n, d) => n + d.after - d.before, 0);
      expect(sum, key).toBe(after - before);
    }
    expect(s).toEqual(original);
    expect(parseSave(serialize(next))).toEqual(next);
    expect(next.lastYearDeltas.length).toBeGreaterThan(0);
  });
  it("upgrades old saves while keeping the pending event and RNG", () => {
    const s = reduce(newLife(options), { type: "age" });
    const saved = JSON.parse(serialize(s));
    delete saved.game.lastYearDeltas;
    delete saved.game.lastDeltas;
    for (const row of saved.game.log) {
      delete row.deltas;
      delete row.source;
    }
    const restored = parseSave(JSON.stringify(saved));
    expect(restored.pending).toEqual(s.pending);
    expect(restored.rng).toBe(s.rng);
    expect(restored.log.every((r) => Array.isArray(r.deltas))).toBe(true);
  });
});
