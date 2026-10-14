import { expect, it } from "vitest";
import {
  drawKeno,
  drawCraps,
  kenoNet,
  crapsNet,
  crapsResult,
} from "../src/engine/casino-native";
import { newLife, reduce } from "../src/engine/game";
import { parseSave, serialize } from "../src/engine/save";
import kenoProof from "../docs/qa/apk-keno-native.json" with { type: "json" };
import { portfolioBreakdown, portfolioValue } from "../src/engine/investments";
import type { Action } from "../src/engine/types";
import crapsProof from "../docs/qa/apk-craps-native.json" with { type: "json" };
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
it("accounts for fractional holdings and empty groups without inventing returns", () => {
  const s = adult(),
    stock = s.investments.instruments.find((i) => i.group === "stock")!,
    coin = s.investments.instruments.find((i) => i.group === "crypto")!;
  stock.price = 4000;
  coin.price = 1000;
  s.investments.positions = [
    { id: stock.id, units: 1250, costBasis: 4000 },
    { id: coin.id, units: 250, costBasis: 500 },
  ];
  const groups = portfolioBreakdown(s);
  expect(groups.reduce((n, g) => n + g.value, 0)).toBe(portfolioValue(s));
  expect(groups.find((g) => g.group === "stock")).toMatchObject({
    value: 5000,
    cost: 4000,
    profit: 1000,
  });
  expect(groups.find((g) => g.group === "crypto")).toMatchObject({
    value: 250,
    cost: 500,
    profit: -250,
  });
  expect(groups.find((g) => g.group === "bond")).toMatchObject({
    value: 0,
    cost: 0,
    profit: 0,
  });
});
it("matches Keno native payouts and rejects invalid selected/drawn numbers", () => {
  for (const f of kenoProof.settlementFixtures) {
    if (f.bet < 1000) continue;
    const drawn = [1, 2, 3]
      .slice(0, f.matches)
      .concat([4, 5, 6, 7, 8, 9].slice(0, 6 - f.matches));
    expect(kenoNet([1, 2, 3], drawn, f.bet)).toBe(f.lastWinnings);
  }
  for (const numbers of [
    [],
    [1, 2],
    [1, 1, 2],
    [0, 2, 3],
    [1, 2, 21],
    [1, 2, 3.5],
  ])
    expect(() => drawKeno({ rng: 42 }, numbers)).toThrow();
  expect(() => kenoNet([1, 2, 3], [1, 1, 2, 3, 4, 5], 1000)).toThrow();
});
it("uses APK Craps rules rather than a point game, and replays seeded outcomes", () => {
  for (const f of crapsProof.fixtures)
    expect(crapsResult(f.dice)).toBe(f.result);
  for (let a = 1; a <= 6; a++)
    for (let b = 1; b <= 6; b++)
      expect(crapsResult([a, b])).toBe(
        [7, 11].includes(a + b)
          ? "win"
          : [2, 3, 12].includes(a + b)
            ? "lose"
            : "reroll",
      );
  expect(
    crapsNet(
      [
        [2, 2],
        [3, 3],
        [3, 4],
      ],
      1000,
    ),
  ).toBe(1000);
  expect(
    crapsNet(
      [
        [2, 2],
        [1, 1],
      ],
      1000,
    ),
  ).toBe(-1000);
  for (const rolls of [
    [],
    [[0, 7]],
    [
      [3, 4],
      [1, 1],
    ],
    [[2, 2]],
  ])
    expect(() => crapsNet(rolls, 1000)).toThrow();
  for (let seed = 1; seed <= 2000; seed++) {
    const s = { rng: seed },
      twin = { rng: seed };
    expect(drawKeno(s, [1, 2, 3])).toEqual(drawKeno(twin, [1, 2, 3]));
    expect(drawCraps(s)).toEqual(drawCraps(twin));
    expect(s.rng).toBe(twin.rng);
  }
});
it("settles both games once, protects saves, and migrates 1.7 without changing holdings", () => {
  let s = adult();
  const before = s.money;
  s = reduce(s, { type: "casinoKeno", bet: 1000, numbers: [1, 2, 3] });
  s = reduce(s, { type: "casinoCraps", bet: 1000 });
  expect(s.casino.handsThisYear).toBe(2);
  expect(s.money).toBe(
    before + s.casino.kenoHistory[0].net + s.casino.crapsHistory[0].net,
  );
  expect(parseSave(serialize(s))).toEqual(s);
  for (const corrupt of ["keno", "craps"] as const) {
    const bad = structuredClone(s);
    if (corrupt === "keno") bad.casino.kenoHistory[0].drawn[0] = 21;
    else bad.casino.crapsHistory[0].net++;
    expect(() => parseSave(serialize(bad))).toThrow();
  }
  const old = adult(),
    raw = JSON.parse(serialize(old));
  raw.game.contentVersion = "1.7.0";
  delete raw.game.casino.kenoHistory;
  delete raw.game.casino.crapsHistory;
  const upgraded = parseSave(JSON.stringify(raw));
  expect(upgraded.investments).toEqual(old.investments);
  expect(upgraded.rng).toBe(old.rng);
  expect(upgraded.casino.kenoHistory).toEqual([]);
  const underage = adult();
  underage.age = 14;
  expect(() => reduce(underage, { type: "casinoCraps", bet: 1000 })).toThrow();
  expect(() =>
    reduce(old, { type: "casinoKeno", bet: NaN, numbers: [1, 2, 3] }),
  ).toThrow();
  for (const action of [
    { type: "casinoKeno", bet: 1000, numbers: [1, 2, 3] },
    { type: "casinoCraps", bet: 1000 },
  ] as Action[]) {
    for (const patch of [
      { prisonYears: 1 },
      { flags: [] },
      { casino: { ...old.casino, handsThisYear: 20 } },
      { casino: { ...old.casino, bannedUntil: 40 } },
    ])
      expect(() => reduce({ ...old, ...patch }, action)).toThrow();
    for (const bet of [-1, 1001, Infinity, Number.MAX_SAFE_INTEGER])
      expect(() => reduce(old, { ...action, bet } as Action)).toThrow();
  }
  const selection = [1, 2, 3],
    settled = reduce(old, {
      type: "casinoKeno",
      bet: 1000,
      numbers: selection,
    });
  selection[0] = 20;
  expect(settled.casino.kenoHistory[0].numbers).toEqual([1, 2, 3]);
  expect(old.casino.kenoHistory).toEqual([]);
});
