import { it, expect } from "vitest";
import { newLife, reduce } from "../src/engine/game";
import { parseSave, serialize } from "../src/engine/save";
import { events } from "../src/content/catalog";
const base = () =>
  newLife({
    name: "An",
    gender: "female",
    hometown: "Huế",
    birthDate: "2000-01-01",
    seed: 42,
  });
it("keeps the exact nested case through reload and rejects the previous button", () => {
  let s = base();
  const event = events.find((e) =>
    e.choices.some((c) => c.cases?.some((o) => "choices" in o)),
  )!;
  s.age = event.minAge;
  s.phase = "awaiting_choice";
  s.pending = { instanceId: "test_nested", event };
  let nested;
  for (let seed = 0; seed < 1000; seed++) {
    s.rng = seed;
    const n = reduce(s, {
      type: "choose",
      instanceId: "test_nested",
      optionId: event.choices[0].id,
    });
    if (n.pending?.node) {
      nested = n;
      break;
    }
  }
  expect(nested?.pending?.node).toBeTruthy();
  const restored = parseSave(serialize(nested!));
  expect(restored).toEqual(nested);
  expect(() =>
    reduce(restored, {
      type: "choose",
      instanceId: "test_nested",
      optionId: event.choices[0].id,
    }),
  ).toThrow();
});
it("saves an unfinished blackjack hand and settles it exactly once", () => {
  let s = base();
  s.age = 15;
  s.money = 1000000;
  for (let seed = 0; seed < 100; seed++) {
    s.rng = seed;
    const next = reduce(s, {
      type: "casinoDeal",
      game: "blackjack",
      bet: 1000,
    });
    if (next.casino.hand) {
      s = next;
      break;
    }
  }
  expect(s.casino.hand).toBeTruthy();
  const restored = parseSave(serialize(s));
  const broken = structuredClone(s);
  broken.casino.shoe = [];
  expect(() => serialize(broken)).toThrow();
  expect(() => reduce(restored, { type: "age" })).toThrow();
  expect(() =>
    reduce(restored, { type: "activity", id: "act_ruiro_01" }),
  ).toThrow();
  expect(() => reduce(restored, { type: "askTuition" })).toThrow();
  const settled = reduce(restored, { type: "casinoStand" });
  expect(settled.casino.hand).toBeNull();
  expect(settled.casino.history).toHaveLength(1);
  expect(() => reduce(settled, { type: "casinoStand" })).toThrow();
});
it("a manual tuition conversation does not roll annual mortality", () => {
  let s = base();
  s.age = 70;
  s.stats.health = 0;
  s.rng = 0;
  s = reduce(s, { type: "askTuition" });
  s = reduce(s, {
    type: "choose",
    instanceId: s.pending!.instanceId,
    optionId: "accept",
  });
  expect(s.phase).toBe("ready");
  expect(s.age).toBe(70);
  expect(s.deathCause).toBeNull();
});
