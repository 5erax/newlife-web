import { random } from "./rng";
import { MAX_MONEY, requireGame } from "./helpers";
const symbols = "ABCDEF";
export const SLOT_COMBINATIONS = [...symbols].flatMap((a) =>
  [...symbols].flatMap((b) => [...symbols].map((c) => a + b + c)),
);
// ARM64/metadata proof: docs/qa/apk-slots-native.json. These are gross payout multipliers.
const table: Record<string, [number, number]> = {
  AAA: [20, 1],
  BBB: [18, 1],
  CCC: [15, 1],
  DDD: [12, 2],
  EEE: [10, 2],
  FFF: [8, 2],
  ABC: [6, 4],
  FED: [3, 4],
};
function outcome(value: string) {
  requireGame(/^[ABCDEF]{3}$/.test(value), "Biểu tượng máy xèng không hợp lệ.");
  if (table[value])
    return {
      symbols: value,
      multiplier: table[value][0],
      group: table[value][1],
    };
  for (const [symbol, multiplier] of [
    ["A", 5],
    ["B", 4],
    ["C", 3],
  ] as const)
    if ([...value].filter((c) => c === symbol).length === 2)
      return { symbols: value, multiplier, group: 3 };
  return { symbols: value, multiplier: 0, group: 0 };
}
const combinations = SLOT_COMBINATIONS.map(outcome);
export function slotsMultiplier(value: string) {
  return outcome(value).multiplier;
}
export function slotsNet(value: string, bet: number) {
  requireGame(
    Number.isSafeInteger(bet) &&
      bet >= 1000 &&
      bet % 100 === 0 &&
      bet <= Math.floor(MAX_MONEY / 19),
    "Cược máy xèng không hợp lệ.",
  );
  return bet * (slotsMultiplier(value) - 1);
}
export function drawSlots(s: { rng: number }) {
  let group = 0;
  if (random(s) < Math.fround(0.15)) {
    const weights = [0.04, 0.06, 0.6, 0.3].map(Math.fround);
    const draw = random(s) * weights.reduce((n, v) => Math.fround(n + v), 0);
    let total = 0;
    group = 4;
    for (let i = 0; i < weights.length; i++) {
      total = Math.fround(total + weights[i]);
      if (draw < total) {
        group = i + 1;
        break;
      }
    }
  }
  const pool = combinations.filter((r) => r.group === group);
  return { ...pool[Math.floor(random(s) * pool.length)] };
}
