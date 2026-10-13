import { it, expect } from "vitest";
import { newLife, reduce } from "../src/engine/game";
import { parseSave, serialize } from "../src/engine/save";
import { investmentYear, portfolioValue } from "../src/engine/investments";
const fixture = () => {
  const s = newLife({
    name: "An",
    gender: "female",
    hometown: "Huế",
    birthDate: "2000-01-01",
    seed: 42,
  });
  s.age = 25;
  s.money = 100000000;
  return s;
};
it("buy then sell loses spread and cannot sell the same holding twice", () => {
  const s = fixture(),
    id = s.investments.instruments.find((i) => i.group === "stock")!.id;
  const bought = reduce(s, { type: "investmentBuy", id, units: 1000 });
  expect(portfolioValue(bought)).toBeGreaterThan(0);
  expect(bought.money).toBeLessThan(s.money);
  const sold = reduce(bought, { type: "investmentSell", id, units: 1000 });
  expect(sold.money).toBeLessThan(s.money);
  expect(() =>
    reduce(sold, { type: "investmentSell", id, units: 1000 }),
  ).toThrow();
  expect(parseSave(serialize(sold))).toEqual(sold);
});
it("replays future prices and listings after saving", () => {
  const s = fixture(),
    restored = parseSave(serialize(s));
  s.age++;
  restored.age++;
  investmentYear(s);
  investmentYear(restored);
  expect(restored).toEqual(s);
  expect(
    s.investments.instruments.every((i) => Number.isSafeInteger(i.price)),
  ).toBe(true);
});
it("crypto can boom by tens of thousands percent and can lose everything", () => {
  let boom = false,
    ruin = false,
    listed = false;
  for (let seed = 0; seed < 200 && (!boom || !ruin || !listed); seed++) {
    const s = fixture();
    s.rng = seed;
    const before = s.investments.instruments
      .filter((i) => i.group === "crypto")
      .map((i) => ({ ...i }));
    investmentYear(s);
    boom ||= before.some(
      (i) =>
        s.investments.instruments.find((n) => n.id === i.id)!.price / i.price >=
        100,
    );
    ruin ||= s.investments.instruments.some(
      (i) => i.group === "crypto" && i.price === 0,
    );
    listed ||= s.investments.instruments.length > before.length + 26;
  }
  expect(boom && ruin && listed).toBe(true);
});
it("rejects overspending, negative units and impossible imported prices without mutation", () => {
  const s = fixture(),
    id = s.investments.instruments[0].id,
    copy = structuredClone(s);
  expect(() => reduce(s, { type: "investmentBuy", id, units: -1 })).toThrow();
  expect(() =>
    reduce(s, { type: "investmentBuy", id, units: 100000000000 }),
  ).toThrow();
  expect(s).toEqual(copy);
  const broken = structuredClone(s);
  broken.investments.instruments[0].price = -5;
  expect(() => serialize(broken)).toThrow();
});
it("has reachable multi-year crypto returns above 30000 percent", () => {
  let seen = false;
  for (let seed = 0; seed < 300 && !seen; seed++) {
    const s = fixture();
    s.rng = seed;
    for (let year = 0; year < 3; year++) {
      s.age++;
      investmentYear(s);
    }
    seen = s.investments.instruments.some(
      (i) =>
        i.group === "crypto" &&
        i.listedAge === 0 &&
        i.price / i.initialPrice >= 301,
    );
  }
  expect(seen).toBe(true);
});
it("rejects imported bond face values that would overflow at maturity", () => {
  const s = fixture(),
    bond = s.investments.instruments[0];
  bond.initialPrice = 1e11;
  bond.price = 1;
  bond.history[0].price = 1;
  s.investments.positions.push({
    id: bond.id,
    units: 1e12,
    costBasis: 1e9,
    maturityAge: 28,
  });
  expect(() => serialize(s)).toThrow("Giá trị vị thế vượt giới hạn");
  s.investments.positions = [];
  expect(() =>
    reduce(s, { type: "investmentBuy", id: bond.id, units: 1e10 }),
  ).toThrow("Giá trị vị thế vượt giới hạn");
});
it("keeps valid cumulative accounting boundaries exportable after income and maturity", () => {
  let s = reduce(fixture(), {
    type: "investmentBuy",
    id: "inv_bond_1",
    units: 1000,
  });
  s.investments.dividends = 1e15;
  s.investments.realized = -1e15;
  s.age = 27;
  expect(parseSave(serialize(s))).toEqual(s);
  s = reduce(s, { type: "age" });
  expect(s.investments.dividends).toBe(1e15);
  expect(s.investments.realized).toBeGreaterThanOrEqual(-1e15);
  expect(parseSave(serialize(s))).toEqual(s);
});
