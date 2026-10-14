import { it, expect } from "vitest";
import { newLife, reduce } from "../src/engine/game";
import stocks from "../src/content/apk/stocks.json" with { type: "json" };
import { serialize, parseSave } from "../src/engine/save";
import { emptyInvestments } from "../src/engine/investments";
const fixture = () =>
  newLife({
    name: "An",
    gender: "female",
    hometown: "Huế",
    birthDate: "2000-01-01",
    seed: 42,
    contentMode: "apk",
  });
it("lists all 107 source stocks in eight sectors and trades every one safely", () => {
  expect(stocks).toHaveLength(107);
  expect(new Set(stocks.map((i) => i.ticker)).size).toBe(107);
  expect(new Set(stocks.map((i) => i.sector)).size).toBe(8);
  const s = fixture();
  s.age = 30;
  s.money = 100000000;
  const listed = s.investments.instruments.filter((i) => i.group === "stock");
  expect(listed).toHaveLength(107);
  for (const stock of stocks) {
    expect(listed.find((i) => i.id === stock.id)?.initialPrice).toBe(
      stock.initialPrice,
    );
    expect(stock.initialPrice).toBeGreaterThanOrEqual(stock.minPriceUSD * 1000);
    expect(stock.initialPrice).toBeLessThanOrEqual(stock.maxPriceUSD * 1000);
    const bought = reduce(s, {
      type: "investmentBuy",
      id: stock.id,
      units: 1000,
    });
    expect(parseSave(serialize(bought)).investments).toEqual(
      bought.investments,
    );
    const sold = reduce(bought, {
      type: "investmentSell",
      id: stock.id,
      units: 1000,
    });
    expect(sold.money).toBeLessThan(s.money);
    expect(sold.investments.positions).toHaveLength(0);
  }
});
it("keeps old saved portfolios and web-mode catalogs unchanged without drawing RNG", () => {
  const s = fixture();
  s.investments = emptyInvestments(false);
  const json = JSON.parse(serialize(s));
  json.game.contentVersion = "1.5.0";
  const loaded = parseSave(JSON.stringify(json));
  expect(loaded.investments).toEqual(s.investments);
  expect(loaded.rng).toBe(s.rng);
  expect(
    emptyInvestments(false).instruments.some((i) =>
      i.id.startsWith("apk_stock_"),
    ),
  ).toBe(false);
});
