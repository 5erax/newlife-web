import { describe, it, expect } from "vitest";
import { newLife } from "../src/engine/game";
import { validateContent } from "../src/tools/content";
describe("fictional name and family catalog", () => {
  it("has valid hometown identities and reproducible full names", () => {
    expect(() => validateContent()).not.toThrow();
    const options = {
      name: "An",
      gender: "other" as const,
      hometown: "Huế",
      birthDate: "2000-01-01",
      seed: 42,
    };
    const s = newLife(options);
    expect(s).toEqual(newLife(options));
    expect(s.relations.every((r) => r.name.split(" ").length === 3)).toBe(true);
  });
  it("keeps family ages and independent IDs across 10000 births", () => {
    const seen = new Set<string>();
    let siblings = 0;
    for (let i = 0; i < 10000; i++) {
      const s = newLife({
        name: "An",
        gender: "other",
        hometown: "Huế",
        birthDate: "2000-01-01",
        seed: (i * 7919 + 42) >>> 0,
      });
      for (const r of s.relations) {
        expect(seen.has(r.id)).toBe(false);
        seen.add(r.id);
        if (r.role === "mother") expect(r.age).toBeGreaterThanOrEqual(24);
        if (r.role === "father") expect(r.age).toBeGreaterThanOrEqual(25);
        if (r.role === "sibling") {
          siblings++;
          expect(r.age).toBeGreaterThanOrEqual(1);
          expect(r.age).toBeLessThanOrEqual(8);
        }
      }
    }
    expect(siblings).toBeGreaterThan(6000);
    expect(siblings).toBeLessThan(7000);
  });
});
