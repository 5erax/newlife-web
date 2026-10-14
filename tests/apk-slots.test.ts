import { it, expect } from "vitest";
import {
  drawSlots,
  slotsMultiplier,
  slotsNet,
  SLOT_COMBINATIONS,
} from "../src/engine/slots";
import proof from "../docs/qa/apk-slots-native.json" with { type: "json" };
import { newLife, reduce } from "../src/engine/game";
import { serialize, parseSave } from "../src/engine/save";
const adult = () => {
  const s = newLife({
    name: "An",
    gender: "female",
    hometown: "Huế",
    birthDate: "2000-01-01",
    seed: 42,
    contentMode: "apk",
  });
  s.age = 30;
  s.money = 100000000;
  return s;
};
it("matches all 216 symbol payouts with native evidence, including gross minus stake", () => {
  expect(SLOT_COMBINATIONS).toHaveLength(216);
  let wins = 0;
  for (const symbols of SLOT_COMBINATIONS) {
    let expected =
      proof.table.find((r) => r.symbols === symbols)?.multiplier ?? 0;
    for (const symbol of ["A", "B", "C"] as const)
      if ([...symbols].filter((c) => c === symbol).length === 2)
        expected = proof.pairMultipliers[symbol];
    expect(slotsMultiplier(symbols), symbols).toBe(expected);
    expect(slotsNet(symbols, 1000), symbols).toBe((expected - 1) * 1000);
    if (expected) wins++;
  }
  expect(wins).toBe(53);
  expect(slotsNet("ABC", 1000)).toBe(5000);
  expect(slotsNet("FED", 1000)).toBe(2000);
  for (const invalid of ["", "AB", "ZZZ", "AAAA"])
    expect(() => slotsMultiplier(invalid)).toThrow();
});
it("uses reproducible weighted wins rather than independent reels", () => {
  const s = { rng: 42 },
    twin = { rng: 42 };
  let wins = 0;
  const groups = [0, 0, 0, 0, 0];
  for (let i = 0; i < 50000; i++) {
    const result = drawSlots(s);
    expect(drawSlots(twin)).toEqual(result);
    expect(result.multiplier).toBe(slotsMultiplier(result.symbols));
    if (result.multiplier) {
      wins++;
      groups[result.group]++;
    }
  }
  expect(wins / 50000).toBeGreaterThan(0.14);
  expect(wins / 50000).toBeLessThan(0.16);
  for (let group = 1; group <= 4; group++)
    expect(
      Math.abs(groups[group] / wins - proof.weights[group - 1]),
    ).toBeLessThan(0.02);
});
it("settles cash once and rejects forged receipts while preserving older saves", () => {
  const s = adult(),
    before = structuredClone(s);
  const next = reduce(s, { type: "casinoSlots", bet: 1000 });
  expect(s).toEqual(before);
  const receipt = next.casino.slotsHistory[0];
  expect(next.money).toBe(s.money + receipt.net);
  expect(next.casino.handsThisYear).toBe(1);
  expect(parseSave(serialize(next))).toEqual(next);
  for (const patch of [
    { net: 12345 },
    { symbols: "ZZZ" },
    { symbols: receipt.symbols === "AAA" ? "BBB" : "AAA" },
  ]) {
    const data = JSON.parse(serialize(next));
    Object.assign(data.game.casino.slotsHistory[0], patch);
    expect(() => parseSave(JSON.stringify(data))).toThrow();
  }
  for (const patch of [
    { age: 14 },
    { prisonYears: 1 },
    { flags: s.flags.filter((f) => f !== "apk_mode") },
  ])
    expect(() =>
      reduce({ ...s, ...patch }, { type: "casinoSlots", bet: 1000 }),
    ).toThrow();
  for (const bet of [NaN, -1, 1001, Number.MAX_SAFE_INTEGER])
    expect(() => reduce(s, { type: "casinoSlots", bet })).toThrow();
  for (const patch of [{ handsThisYear: 20 }, { bannedUntil: 40 }])
    expect(() =>
      reduce(
        { ...s, casino: { ...s.casino, ...patch } },
        { type: "casinoSlots", bet: 1000 },
      ),
    ).toThrow();
  const data = JSON.parse(serialize(s));
  data.game.contentVersion = "1.6.0";
  delete data.game.casino.slotsHistory;
  const restored = parseSave(JSON.stringify(data));
  expect(restored.rng).toBe(s.rng);
  expect(restored.investments).toEqual(s.investments);
  expect(restored.casino.slotsHistory).toEqual([]);
});
