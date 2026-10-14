import type { RouletteBet } from "./types";
import { requireGame, MAX_MONEY } from "./helpers";
export function rouletteColor(number: number): "none" | "red" | "black" {
  requireGame(
    Number.isInteger(number) && number >= 0 && number <= 12,
    "Roulette chỉ có số từ 0 đến 12.",
  );
  return number === 0 ? "none" : number % 2 ? "red" : "black";
}
// Verified ARM64: RouletteUtils lookup [13,1,13]; OnSpinDone records +bet*multiplier or -bet as session net.
export function rouletteNet(
  selection: RouletteBet,
  number: number,
  bet: number,
) {
  const color = rouletteColor(number);
  requireGame(
    Number.isSafeInteger(bet) &&
      bet >= 1000 &&
      bet % 100 === 0 &&
      bet <= Math.floor(MAX_MONEY / 13),
    "Cược roulette không hợp lệ.",
  );
  requireGame(
    selection &&
      (selection.kind === "number"
        ? Number.isInteger(selection.number) &&
          selection.number >= 0 &&
          selection.number <= 12
        : selection.kind === "color" &&
          ["red", "black"].includes(selection.color)),
    "Lựa chọn roulette không hợp lệ.",
  );
  const win =
    selection.kind === "number"
      ? selection.number === number
      : selection.color === color;
  return win ? bet * (selection.kind === "number" ? 13 : 1) : -bet;
}
