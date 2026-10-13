import type { GameState } from "./types";
import { originById, localPrice } from "./world";
import { money, stat, count, addLog, requireGame } from "./helpers";
import { changeContext } from "./changes";
export function migrate(s: GameState, origin: string, mandatory = false) {
  requireGame(
    s.age >= 18 &&
      !s.prisonYears &&
      originById.has(origin) &&
      origin !== s.origin,
    "Chưa thể di cư đến nơi này.",
  );
  changeContext(
    s,
    "migration",
    `Di cư đến ${originById.get(origin)!.label}, bắt đầu lại công việc và nhịp sống.`,
  );
  money(s, -localPrice(s, 5000000), "Di cư và giấy tờ", mandatory);
  const oldScale = originById.get(s.origin)!.wealthIndex;
  s.origin = origin;
  s.hometown = originById.get(origin)!.hometown;
  s.job = null;
  s.pension = 0;
  // Tài sản đã sở hữu giữ giá trị; bảng mua mới phản ánh nơi sống mới.
  for (const id of Object.keys(s.market))
    s.market[id] = Math.round(
      (s.market[id] * originById.get(origin)!.wealthIndex) / oldScale,
    );
  stat(s, "happiness", -6);
  stat(s, "intelligence", 4);
  count(s, "migrations");
  addLog(
    s,
    `Bạn chuyển đến ${originById.get(origin)!.label}. Bạn cần tìm công việc mới và thích nghi nơi sống.`,
    "event",
  );
}
