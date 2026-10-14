import { it, expect } from "vitest";
import { newLife, reduce } from "../src/engine/game";
import { rouletteNet, rouletteColor } from "../src/engine/roulette";
import { casinoBetLimit } from "../src/engine/casino";
import { serialize, parseSave } from "../src/engine/save";
import type { RouletteBet } from "../src/engine/types";
const fixture = () => {
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
it("matches the native 0..12 color and net multipliers for every bet/outcome pair", () => {
  const bets: RouletteBet[] = [
    ...Array.from({ length: 13 }, (_, number) => ({
      kind: "number" as const,
      number,
    })),
    { kind: "color", color: "red" },
    { kind: "color", color: "black" },
  ];
  for (let outcome = 0; outcome < 13; outcome++) {
    expect(rouletteColor(outcome)).toBe(
      outcome === 0 ? "none" : outcome % 2 ? "red" : "black",
    );
    for (const bet of bets) {
      const win =
        bet.kind === "number"
          ? bet.number === outcome
          : rouletteColor(outcome) === bet.color;
      expect(rouletteNet(bet, outcome, 1000)).toBe(
        win ? (bet.kind === "number" ? 13000 : 1000) : -1000,
      );
    }
  }
});
it("settles once, records RNG evidence and survives reload without overwriting the input", () => {
  const s = fixture(),
    before = structuredClone(s);
  const next = reduce(s, {
    type: "casinoRoulette",
    bet: 1000,
    selection: { kind: "number", number: 0 },
  });
  const round = next.casino.rouletteHistory.at(-1)!;
  expect(next.money).toBe(s.money + round.net);
  expect(s).toEqual(before);
  const selection = { kind: "number" as const, number: 0 };
  const isolated = reduce(s, { type: "casinoRoulette", bet: 1000, selection });
  selection.number = 12;
  expect(isolated.casino.rouletteHistory[0].selection).toEqual({ kind: "number", number: 0 });
  expect(parseSave(serialize(next))).toEqual(next);
  for (const patch of [
    { net: 999999 },
    { resultNumber: 13 },
    { seedBefore: (round.seedBefore + 1) >>> 0 },
    { selection: { kind: "color", color: "blue" } },
  ]) {
    const data = JSON.parse(serialize(next));
    Object.assign(data.game.casino.rouletteHistory[0], patch);
    expect(() => parseSave(JSON.stringify(data))).toThrow();
  }
});
it("rejects invalid bets, web mode and unavailable funds; allows only safe headroom", () => {
  const s = fixture();
  const action = {
    type: "casinoRoulette" as const,
    bet: 1000,
    selection: { kind: "color" as const, color: "red" as const },
  };
  for (const patch of [{ age: 14 }, { prisonYears: 1 }])
    expect(() => reduce({ ...s, ...patch }, action)).toThrow();
  for (const patch of [{ handsThisYear: 20 }, { bannedUntil: 40 }])
    expect(() => reduce({ ...s, casino: { ...s.casino, ...patch } }, action)).toThrow();
  const playing = reduce(s, { type: "casinoDeal", game: "blackjack", bet: 1000 });
  if (playing.casino.hand) expect(() => reduce(playing, action)).toThrow();
  for (const number of [-1, 13, NaN])
    expect(() =>
      reduce(s, {
        type: "casinoRoulette",
        bet: 1000,
        selection: { kind: "number", number },
      }),
    ).toThrow();
  for (const bet of [-1, 1001, NaN, Number.MAX_SAFE_INTEGER])
    expect(() =>
      reduce(s, {
        type: "casinoRoulette",
        bet,
        selection: { kind: "number", number: 0 },
      }),
    ).toThrow();
  s.flags = s.flags.filter((f) => f !== "apk_mode");
  expect(() =>
    reduce(s, {
      type: "casinoRoulette",
      bet: 1000,
      selection: { kind: "number", number: 0 },
    }),
  ).toThrow();
  s.flags.push("apk_mode");
  s.money = 1000;
  expect(casinoBetLimit(s, "roulette")).toBeLessThan(1000);
  expect(() =>
    reduce(s, {
      type: "casinoRoulette",
      bet: 1000,
      selection: { kind: "color", color: "red" },
    }),
  ).toThrow();
  s.money = 1e15 - 10000;
  expect(casinoBetLimit(s, "roulette")).toBeLessThan(1000);
});
it("migrates previous casino state without changing cards, money or RNG", () => {
  const s = fixture(),
    data = JSON.parse(serialize(s));
  data.game.contentVersion = "1.5.0";
  delete data.game.casino.rouletteHistory;
  const old = parseSave(JSON.stringify(data));
  expect(old.rng).toBe(s.rng);
  expect(old.money).toBe(s.money);
  expect(old.casino.rouletteHistory).toEqual([]);
  expect(old.casino.shoe).toEqual(s.casino.shoe);
});
