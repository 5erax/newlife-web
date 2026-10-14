import { random } from "./rng";
import { MAX_MONEY, requireGame } from "./helpers";

export function kenoNumbers(numbers: number[], count = 3) {
  requireGame(
    Array.isArray(numbers) &&
      numbers.length === count &&
      new Set(numbers).size === count &&
      Array.from(numbers).every(
        (n) => Number.isSafeInteger(n) && n >= 1 && n <= 20,
      ),
    "Keno cần ba số khác nhau từ 1 đến 20; kết quả gồm sáu bóng khác nhau.",
  );
}
function validBet(bet: number, multiplier: number) {
  requireGame(
    Number.isSafeInteger(bet) &&
      bet >= 1000 &&
      bet % 100 === 0 &&
      bet <= Math.floor(MAX_MONEY / multiplier),
    "Tiền cược không hợp lệ.",
  );
}
export function kenoNet(numbers: number[], drawn: number[], bet: number) {
  kenoNumbers(numbers);
  kenoNumbers(drawn, 6);
  validBet(bet, 3);
  const matches = numbers.filter((n) => drawn.includes(n)).length;
  return bet * (matches || -1);
}
export function drawKeno(s: { rng: number }, numbers: number[]) {
  kenoNumbers(numbers);
  const drawn: number[] = [];
  // shortcut: casino web hiện dùng HouseWinRate0; cập nhật khi xác minh cấu hình casino native.
  for (let attempts = 0; drawn.length < 6 && attempts < 1000; attempts++) {
    const n = Math.floor(random(s) * 20) + 1;
    if (!drawn.includes(n)) drawn.push(n);
  }
  requireGame(drawn.length === 6, "Không tạo được kết quả Keno hợp lệ.");
  return drawn;
}
export function crapsResult(dice: number[]) {
  requireGame(
    Array.isArray(dice) &&
      dice.length === 2 &&
      Array.from(dice).every(
        (n) => Number.isSafeInteger(n) && n >= 1 && n <= 6,
      ),
    "Xúc xắc cần hai mặt từ 1 đến 6.",
  );
  const sum = dice[0] + dice[1];
  return [7, 11].includes(sum)
    ? "win"
    : [2, 3, 12].includes(sum)
      ? "lose"
      : "reroll";
}
export function crapsNet(rolls: number[][], bet: number) {
  validBet(bet, 1);
  requireGame(
    Array.isArray(rolls) && rolls.length > 0 && rolls.length <= 1000,
    "Lịch sử lắc không hợp lệ.",
  );
  requireGame(
    Array.from(rolls.slice(0, -1)).every((d) => crapsResult(d) === "reroll"),
    "Ván xúc xắc đã kết thúc trước lần lắc cuối.",
  );
  const result = crapsResult(rolls.at(-1)!);
  requireGame(result !== "reroll", "Ván xúc xắc chưa kết thúc.");
  return bet * (result === "win" ? 1 : -1);
}
export function drawCraps(s: { rng: number }) {
  const rolls: number[][] = [];
  // shortcut: tự lắc tiếp các tổng trung gian, thay bằng từng lượt khi cần mô phỏng thao tác native.
  for (let attempts = 0; attempts < 1000; attempts++) {
    const dice = [Math.floor(random(s) * 6) + 1, Math.floor(random(s) * 6) + 1];
    rolls.push(dice);
    if (crapsResult(dice) !== "reroll") return rolls;
  }
  throw new Error("Không tạo được ván xúc xắc kết thúc.");
}
