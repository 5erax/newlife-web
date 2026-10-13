import { newLife } from "../engine/game";
import {
  blackjackScore,
  dealHand,
  drawCard,
  dealerPlay,
  handReturn,
} from "../engine/casino";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
export function simulateCasino(rounds = 200000) {
  assert(Number.isInteger(rounds) && rounds >= 1000 && rounds <= 1000000);
  const result: Record<string, { rounds: number; houseEdgePercent: number }> =
    {};
  for (const game of ["blackjack", "bacao"] as const) {
    const s = newLife({
      name: "An",
      gender: "other",
      hometown: "Huế",
      birthDate: "2000-01-01",
      seed: 137,
    });
    s.age = 25;
    let net = 0;
    for (let n = 0; n < rounds; n++) {
      s.actionSerial++;
      const hand = dealHand(s, game, 10000);
      if (game === "blackjack") {
        const up = Math.min(10, (hand.dealer[0] % 13) + 1) || 11;
        while (
          blackjackScore(hand.player).value < 21 &&
          !(
            blackjackScore(hand.dealer).value === 21 && hand.dealer.length === 2
          )
        ) {
          const { value, soft } = blackjackScore(hand.player);
          const stand = soft
            ? value >= 19 || (value === 18 && up >= 2 && up <= 8)
            : value >= 17 ||
              (value >= 13 && up >= 2 && up <= 6) ||
              (value === 12 && up >= 4 && up <= 6);
          if (stand) break;
          hand.player.push(drawCard(s));
        }
        if (blackjackScore(hand.player).value <= 21) dealerPlay(s, hand);
      }
      net += handReturn(hand) - hand.bet;
    }
    result[game] = {
      rounds,
      houseEdgePercent: Number(((-100 * net) / (rounds * 10000)).toFixed(3)),
    };
  }
  return result;
}
if (process.argv[1]?.replaceAll("\\", "/").endsWith("/casino-simulation.ts")) {
  const report = simulateCasino(Number(process.argv[2] ?? 200000));
  assert(
    report.bacao.houseEdgePercent >= 2 && report.bacao.houseEdgePercent <= 4,
    "Ba cào chưa đạt khoảng lợi thế 2–4%.",
  );
  assert(
    report.blackjack.houseEdgePercent > 0,
    "Blackjack không được trở thành nguồn lời chắc chắn.",
  );
  writeFileSync(
    "docs/qa/casino-simulation.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
}
