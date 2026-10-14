import type { Action, GameState, CasinoHand } from "./types";
import { random } from "./rng";
import { requireGame, money, stat, flag, addLog, MAX_MONEY } from "./helpers";
import { portfolioValue } from "./investments";
import { changeContext } from "./changes";
import { localPrice } from "./world";
import { annualIncome } from "./activity-pricing";
import { rouletteNet } from "./roulette";
import { drawSlots, slotsNet } from "./slots";
import {
  drawKeno,
  kenoNet,
  kenoNumbers,
  drawCraps,
  crapsNet,
} from "./casino-native";

export const emptyCasino = () => ({
  shoe: [] as number[],
  hand: null as CasinoHand | null,
  history: [] as CasinoHand[],
  rouletteHistory: [] as GameState["casino"]["rouletteHistory"],
  slotsHistory: [] as GameState["casino"]["slotsHistory"],
  kenoHistory: [] as GameState["casino"]["kenoHistory"],
  crapsHistory: [] as GameState["casino"]["crapsHistory"],
  handsThisYear: 0,
  winStreak: 0,
  bannedUntil: 0,
});
export function drawCard(s: Pick<GameState, "rng" | "casino">) {
  requireGame(s.casino.shoe.length > 0, "Bộ bài đã hết; không thể rút tiếp.");
  return s.casino.shoe.pop()!;
}
export function shuffleShoe(s: Pick<GameState, "rng" | "casino">) {
  s.casino.shoe = Array.from({ length: 312 }, (_, i) => i % 52);
  for (let i = 311; i > 0; i--) {
    const j = Math.floor(random(s) * (i + 1));
    [s.casino.shoe[i], s.casino.shoe[j]] = [s.casino.shoe[j], s.casino.shoe[i]];
  }
}
export function blackjackScore(cards: number[]) {
  let value = 0,
    aces = 0;
  for (const card of cards) {
    const rank = (card % 13) + 1;
    if (rank === 1) {
      value += 11;
      aces++;
    } else value += Math.min(rank, 10);
  }
  while (value > 21 && aces) {
    value -= 10;
    aces--;
  }
  return { value, soft: aces > 0 };
}
export const bacaoScore = (cards: number[]) =>
  cards.reduce((n, c) => n + ((c % 13) + 1 > 9 ? 0 : (c % 13) + 1), 0) % 10;
export function dealHand(
  s: Pick<GameState, "rng" | "casino" | "age" | "actionSerial" | "id">,
  game: CasinoHand["game"],
  bet: number,
): CasinoHand {
  const seedBefore = s.rng;
  if (s.casino.shoe.length < 40) shuffleShoe(s);
  const player = [drawCard(s), drawCard(s)],
    dealer = [drawCard(s), drawCard(s)];
  if (game === "bacao") {
    player.push(drawCard(s));
    dealer.push(drawCard(s));
  }
  return {
    id: `${s.id}_hand_${s.actionSerial}`,
    game,
    bet,
    player,
    dealer,
    age: s.age,
    seedBefore,
    status: "playing",
    net: 0,
    result: "",
  };
}
export function dealerPlay(
  s: Pick<GameState, "rng" | "casino">,
  hand: CasinoHand,
) {
  while (blackjackScore(hand.dealer).value < 17) hand.dealer.push(drawCard(s));
}
export function handReturn(hand: CasinoHand) {
  if (hand.game === "bacao") {
    const p = bacaoScore(hand.player),
      d = bacaoScore(hand.dealer);
    return p === d ? hand.bet : p > d ? Math.round(hand.bet * 1.94) : 0;
  }
  const p = blackjackScore(hand.player).value,
    d = blackjackScore(hand.dealer).value;
  const pb = p === 21 && hand.player.length === 2,
    db = d === 21 && hand.dealer.length === 2;
  if (pb || db) return pb && db ? hand.bet : pb ? hand.bet * 2.5 : 0;
  if (p > 21) return 0;
  return d > 21 || p > d ? hand.bet * 2 : p === d ? hand.bet : 0;
}
export function casinoBetLimit(
  s: GameState,
  game:
    | "roulette"
    | "slots"
    | "keno"
    | "craps"
    | "blackjack"
    | "bacao" = "blackjack",
) {
  const headroom =
    MAX_MONEY -
    s.money -
    portfolioValue(s) -
    s.assets
      .filter((a) => a.alive)
      .reduce((n, a) => n + a.value * a.quantity, 0);
  return Math.max(
    0,
    Math.floor(
      Math.min(
        s.money / 10,
        localPrice(s, s.age < 18 ? 20000 : 5000000),
        annualIncome(s) * 0.02,
        headroom /
          (game === "slots"
            ? 19
            : game === "roulette"
              ? 13
              : game === "keno"
                ? 3
                : game === "craps"
                  ? 1
                  : 1.5),
      ) / 100,
    ) * 100,
  );
}
function settle(s: GameState) {
  const hand = s.casino.hand!;
  if (hand.game === "blackjack" && blackjackScore(hand.player).value <= 21)
    dealerPlay(s, hand);
  const returned = handReturn(hand);
  hand.net = returned - hand.bet;
  hand.status = "settled";
  hand.result =
    hand.net > 0 ? "Thắng" : hand.net < 0 ? "Thua" : "Hoà · trả cược";
  changeContext(
    s,
    "casino",
    `${hand.game === "blackjack" ? "Blackjack" : "Ba cào"}: ${hand.result}.`,
  );
  money(s, returned, "Sòng bạc hoàn trả cược và tiền thắng");
  recordCasinoEffects(s, hand.net, hand.bet, s.casino.history.at(-1)?.net ?? 0);
  addLog(
    s,
    `${hand.game === "blackjack" ? "Blackjack" : "Ba cào"}: ${hand.result}. Lịch sử giữ lá bài, cược và seed để xem lại.`,
    "event",
  );
  s.casino.history.push(hand);
  s.casino.history = s.casino.history.slice(-100);
  s.casino.hand = null;
}
function recordCasinoEffects(
  s: GameState,
  net: number,
  bet: number,
  previousNet: number,
) {
  stat(s, "happiness", net > 0 ? 2 : net < 0 ? -3 : 0);
  const chasing = net < 0 && previousNet < 0;
  s.counters.gambling_addiction = Math.min(
    100,
    (s.counters.gambling_addiction ?? 0) + 1 + (chasing ? 2 : 0),
  );
  s.counters.gambling_wagered = Math.min(
    MAX_MONEY,
    (s.counters.gambling_wagered ?? 0) + bet,
  );
  if ((s.counters.gambling_wagered ?? 0) >= 5000000) flag(s, "high_roller");
  if ((s.counters.gambling_addiction ?? 0) >= 50) flag(s, "gambling_addict");
  s.casino.winStreak = net > 0 ? s.casino.winStreak + 1 : 0;
  if (s.casino.winStreak >= 5) {
    s.casino.bannedUntil = s.age + 2;
    addLog(
      s,
      "Nhà cái nghi ngờ chuỗi thắng và mời bạn rời bàn đến hai năm sau.",
      "event",
    );
  }
  if (s.age < 18 && random(s) < 0.15) {
    stat(s, "happiness", -6);
    for (const r of s.relations.filter(
      (r) => r.alive && ["mother", "father"].includes(r.role),
    ))
      r.closeness = Math.max(0, r.closeness - 8);
    addLog(
      s,
      "Người lớn phát hiện bạn vào sòng khi chưa trưởng thành; lòng tin bị ảnh hưởng.",
      "relationship",
    );
  }
}
export function casinoAction(s: GameState, a: Action) {
  if (
    ![
      "casinoDeal",
      "casinoHit",
      "casinoStand",
      "casinoRoulette",
      "casinoSlots",
      "casinoKeno",
      "casinoCraps",
    ].includes(a.type)
  )
    return false;
  requireGame(
    s.age >= 15 && !s.prisonYears && s.age >= s.casino.bannedUntil,
    "Sòng mở từ 15 tuổi, khi tự do và không bị mời ra.",
  );
  if (a.type === "casinoKeno" || a.type === "casinoCraps") {
    const game = a.type === "casinoKeno" ? "keno" : "craps";
    requireGame(
      s.flags.includes("apk_mode") &&
        !s.casino.hand &&
        s.casino.handsThisYear < 20,
      "Trò chơi thuộc bộ APK; cần kết thúc ván hiện tại và còn lượt năm nay.",
    );
    requireGame(
      Number.isSafeInteger(a.bet) &&
        a.bet >= 1000 &&
        a.bet % 100 === 0 &&
        a.bet <= casinoBetLimit(s, game),
      "Tiền cược vượt hạn mức hoặc không hợp lệ.",
    );
    const seedBefore = s.rng;
    changeContext(
      s,
      "casino",
      game === "keno" ? "Kết quả Keno." : "Kết quả xúc xắc.",
    );
    let net: number;
    if (a.type === "casinoKeno") {
      kenoNumbers(a.numbers);
      const numbers = [...a.numbers],
        drawn = drawKeno(s, numbers);
      net = kenoNet(numbers, drawn, a.bet);
      recordCasinoEffects(s, net, a.bet, s.casino.kenoHistory.at(-1)?.net ?? 0);
      s.casino.kenoHistory.push({
        id: `${s.id}_keno_${s.actionSerial}`,
        numbers,
        drawn,
        bet: a.bet,
        net,
        age: s.age,
        seedBefore,
      });
      s.casino.kenoHistory = s.casino.kenoHistory.slice(-100);
    } else {
      const rolls = drawCraps(s);
      net = crapsNet(rolls, a.bet);
      recordCasinoEffects(
        s,
        net,
        a.bet,
        s.casino.crapsHistory.at(-1)?.net ?? 0,
      );
      s.casino.crapsHistory.push({
        id: `${s.id}_craps_${s.actionSerial}`,
        rolls,
        bet: a.bet,
        net,
        age: s.age,
        seedBefore,
      });
      s.casino.crapsHistory = s.casino.crapsHistory.slice(-100);
    }
    money(s, net, game === "keno" ? "Kết quả Keno" : "Kết quả xúc xắc");
    s.casino.handsThisYear++;
    addLog(
      s,
      `${game === "keno" ? "Keno" : "Xúc xắc"}: ${net > 0 ? "thắng" : "thua"}.`,
      "event",
    );
  } else if (a.type === "casinoSlots") {
    requireGame(
      s.flags.includes("apk_mode") &&
        !s.casino.hand &&
        s.casino.handsThisYear < 20,
      "Máy xèng thuộc bộ APK; cần kết thúc ván hiện tại và còn lượt năm nay.",
    );
    requireGame(
      Number.isSafeInteger(a.bet) &&
        a.bet >= 1000 &&
        a.bet % 100 === 0 &&
        a.bet <= casinoBetLimit(s, "slots"),
      "Cược máy xèng vượt hạn mức hoặc không hợp lệ.",
    );
    const seedBefore = s.rng,
      result = drawSlots(s),
      net = slotsNet(result.symbols, a.bet);
    changeContext(s, "casino", `Máy xèng: ${result.symbols}.`);
    money(s, net, "Kết quả máy xèng");
    recordCasinoEffects(s, net, a.bet, s.casino.slotsHistory.at(-1)?.net ?? 0);
    s.casino.slotsHistory.push({
      id: `${s.id}_slots_${s.actionSerial}`,
      bet: a.bet,
      symbols: result.symbols,
      net,
      age: s.age,
      seedBefore,
    });
    s.casino.slotsHistory = s.casino.slotsHistory.slice(-100);
    s.casino.handsThisYear++;
    addLog(
      s,
      `Máy xèng ra ${result.symbols}: ${net > 0 ? "thắng" : "thua"}.`,
      "event",
    );
  } else if (a.type === "casinoRoulette") {
    requireGame(
      s.flags.includes("apk_mode") &&
        !s.casino.hand &&
        s.casino.handsThisYear < 20,
      "Roulette thuộc bộ APK; cần kết thúc ván đang chơi và còn lượt năm nay.",
    );
    requireGame(
      Number.isSafeInteger(a.bet) &&
        a.bet >= 1000 &&
        a.bet % 100 === 0 &&
        a.bet <= casinoBetLimit(s, "roulette"),
      "Cược roulette vượt hạn mức hoặc không hợp lệ.",
    );
    rouletteNet(a.selection, 0, a.bet);
    const seedBefore = s.rng,
      resultNumber = Math.floor(random(s) * 13),
      net = rouletteNet(a.selection, resultNumber, a.bet);
    changeContext(s, "casino", `Roulette ra số ${resultNumber}.`);
    money(s, net, "Kết quả roulette");
    recordCasinoEffects(
      s,
      net,
      a.bet,
      s.casino.rouletteHistory.at(-1)?.net ?? 0,
    );
    s.casino.rouletteHistory.push({
      id: `${s.id}_roulette_${s.actionSerial}`,
      bet: a.bet,
      selection: { ...a.selection },
      resultNumber,
      net,
      age: s.age,
      seedBefore,
    });
    s.casino.rouletteHistory = s.casino.rouletteHistory.slice(-100);
    s.casino.handsThisYear++;
    addLog(
      s,
      `Roulette ra số ${resultNumber}: ${net > 0 ? "thắng" : "thua"}.`,
      "event",
    );
  } else if (a.type === "casinoDeal") {
    requireGame(
      !s.casino.hand && s.casino.handsThisYear < 20,
      "Kết thúc ván đang chơi hoặc đợi năm mới (tối đa 20 ván/năm).",
    );
    requireGame(
      a.game === "blackjack" || a.game === "bacao",
      "Trò bài không hợp lệ.",
    );
    requireGame(
      Number.isSafeInteger(a.bet) &&
        a.bet >= 1000 &&
        a.bet % 100 === 0 &&
        a.bet <= casinoBetLimit(s),
      "Cược từ 1.000 đơn vị nội bộ, bội 100 và trong hạn mức hiển thị.",
    );
    changeContext(s, "casino", "Đặt cược ở sòng bạc hư cấu.");
    money(s, -a.bet, "Đặt cược sòng bạc");
    s.casino.handsThisYear++;
    s.casino.hand = dealHand(s, a.game, a.bet);
    const h = s.casino.hand;
    if (
      a.game === "bacao" ||
      blackjackScore(h.player).value === 21 ||
      blackjackScore(h.dealer).value === 21
    )
      settle(s);
  } else {
    const h = s.casino.hand;
    requireGame(
      h && h.game === "blackjack" && h.status === "playing",
      "Không có ván blackjack đang chờ.",
    );
    if (a.type === "casinoHit") {
      requireGame(h.player.length < 22, "Đã rút quá nhiều lá.");
      h.player.push(drawCard(s));
      if (blackjackScore(h.player).value >= 21) settle(s);
    } else settle(s);
  }
  return true;
}
