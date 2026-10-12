import { describe, it, expect } from "vitest";
import { nextRandom } from "../src/engine/rng";
import { newLife, reduce } from "../src/engine/game";
import { parseSave, serialize } from "../src/engine/save";
const options = {
  name: "An Nguyễn",
  gender: "female" as const,
  hometown: "Đà Nẵng",
  birthDate: "2000-06-15",
  seed: 42,
};
describe("deterministic life and action boundaries", () => {
  it("continues the same RNG sequence after serialization", () => {
    const first = nextRandom(42);
    const second = nextRandom(first.state);
    expect(nextRandom(JSON.parse(JSON.stringify(first.state)))).toEqual(second);
    expect(first.value).toBeGreaterThanOrEqual(0);
    expect(first.value).toBeLessThan(1);
  });
  it("replays a year and choices identically after restore", () => {
    const original = reduce(newLife(options), { type: "age" });
    const restored = parseSave(serialize(original));
    expect(restored).toEqual(original);
    if (original.pending) {
      const action = {
        type: "choose" as const,
        instanceId: original.pending.instanceId,
        optionId: original.pending.event.choices[0].id,
      };
      expect(reduce(restored, action)).toEqual(reduce(original, action));
    }
  });
  it("does not mutate input when a choice or action is invalid", () => {
    const state = newLife(options);
    const copy = structuredClone(state);
    expect(() =>
      reduce(state, {
        type: "choose",
        instanceId: "missing",
        optionId: "missing",
      }),
    ).toThrow();
    expect(state).toEqual(copy);
  });
  it("rejects a repeated choice and age while pending", () => {
    let state = reduce(newLife(options), { type: "age" });
    expect(state.pending).not.toBeNull();
    expect(() => reduce(state, { type: "age" })).toThrow();
    const action = {
      type: "choose" as const,
      instanceId: state.pending!.instanceId,
      optionId: state.pending!.event.choices[0].id,
    };
    state = reduce(state, action);
    expect(() => reduce(state, action)).toThrow();
  });
  it("refuses hostile or incompatible save data", () => {
    expect(() => parseSave("{}")).toThrow();
    const saved = JSON.parse(serialize(newLife(options)));
    saved.schemaVersion = 99;
    expect(() => parseSave(JSON.stringify(saved))).toThrow();
  });
});
