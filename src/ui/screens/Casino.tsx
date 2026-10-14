import { useState } from "react";
import type {
  Action,
  GameState,
  CasinoHand,
  RouletteBet,
} from "../../engine/types";
import { rouletteColor } from "../../engine/roulette";
import { slotsMultiplier } from "../../engine/slots";
import {
  blackjackScore,
  bacaoScore,
  casinoBetLimit,
} from "../../engine/casino";
import { cash } from "../format";
const cardLabel = (card: number) =>
  `${["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][card % 13]}${["♠", "♥", "♦", "♣"][Math.floor(card / 13)]}`;
function Cards({
  cards,
  hidden = false,
}: {
  cards: number[];
  hidden?: boolean;
}) {
  return (
    <div className="playing-cards">
      {cards.map((c, i) => (
        <span
          key={i}
          className={
            !hidden && [1, 2].includes(Math.floor(c / 13)) ? "red-card" : ""
          }
        >
          {hidden && i === 1 ? "?" : cardLabel(c)}
        </span>
      ))}
    </div>
  );
}
export function Casino({
  s,
  dispatch,
  busy,
}: {
  s: GameState;
  dispatch: (a: Action) => void;
  busy: boolean;
}) {
  const [game, setGame] = useState<CasinoHand["game"] | "roulette" | "slots">(
      s.casino.hand?.game ??
        (s.casino.slotsHistory.length
          ? "slots"
          : s.casino.rouletteHistory.length
            ? "roulette"
            : "blackjack"),
    ),
    [bet, setBet] = useState(1000);
  const [rouletteSelection, setRouletteSelection] = useState<RouletteBet>({
    kind: "number",
    number: 0,
  });
  const round = s.casino.rouletteHistory.at(-1);
  const slotRound = s.casino.slotsHistory.at(-1);
  const h = s.casino.hand ?? s.casino.history.at(-1),
    max = casinoBetLimit(s, game),
    ready =
      s.phase === "ready" &&
      s.age >= 15 &&
      !s.prisonYears &&
      s.age >= s.casino.bannedUntil;
  return (
    <section className="screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">MỘT VÁN BÀI, MỘT RỦI RO</p>
          <h2>Sòng bạc</h2>
          <p className="muted">
            Tiền hư cấu trong game · từ 15 tuổi · {s.casino.handsThisYear}/20
            ván năm nay.
          </p>
        </div>
      </div>
      {s.age < 15 && <p className="banner">Mở từ 15 tuổi.</p>}
      {s.age < 18 && s.age >= 15 && (
        <p className="banner">
          Chưa trưởng thành: người lớn có thể phát hiện và lòng tin bị ảnh
          hưởng.
        </p>
      )}
      {s.age < s.casino.bannedUntil && (
        <p className="banner">
          Bạn bị mời ra đến tuổi {s.casino.bannedUntil} sau chuỗi thắng.
        </p>
      )}
      <p>
        Thói quen cờ bạc: {s.counters.gambling_addiction ?? 0}/100. Chơi nhiều
        hoặc đuổi thua làm tâm trạng và quan hệ giảm theo năm.
      </p>
      <div className="toolbar">
        <label>
          Trò chơi
          <select
            aria-label="Trò chơi"
            value={game}
            disabled={!!s.casino.hand}
            onChange={(e) => setGame(e.target.value as typeof game)}
          >
            <option value="blackjack">Blackjack</option>
            <option value="bacao">Ba cào</option>
            {s.flags.includes("apk_mode") && (
              <option value="roulette">Roulette · 13 ô</option>
            )}
            {s.flags.includes("apk_mode") && (
              <option value="slots">Máy xèng</option>
            )}
          </select>
        </label>
        <label>
          Cược · đơn vị nội bộ
          <input
            type="number"
            min={1000}
            max={max}
            step={100}
            value={bet}
            disabled={!!s.casino.hand}
            onChange={(e) => setBet(Number(e.target.value))}
          />
          <small>
            {cash(bet, true, s.origin)} · tối đa {max.toLocaleString("vi-VN")} (
            {cash(max, false, s.origin)})
          </small>
        </label>
        <button
          className="button"
          disabled={
            busy ||
            !ready ||
            !!s.casino.hand ||
            s.casino.handsThisYear >= 20 ||
            bet > max ||
            bet < 1000 ||
            !Number.isSafeInteger(bet) ||
            bet % 100 !== 0
          }
          onClick={() =>
            dispatch(
              game === "slots"
                ? { type: "casinoSlots", bet }
                : game === "roulette"
                  ? {
                      type: "casinoRoulette",
                      bet,
                      selection: rouletteSelection,
                    }
                  : { type: "casinoDeal", game, bet },
            )
          }
        >
          {game === "slots"
            ? "Quay máy xèng"
            : game === "roulette"
              ? "Quay roulette"
              : "Chia bài"}
        </button>
      </div>
      {game === "slots" && (
        <div className="casino-table">
          <h3>Máy xèng · ba biểu tượng</h3>
          <div
            className="playing-cards"
            role="group"
            aria-label="Kết quả máy xèng"
          >
            {[...(slotRound?.symbols ?? "···")].map((symbol, i) => (
              <span key={i} aria-label={`Biểu tượng ${i + 1}: ${symbol}`}>
                {symbol}
              </span>
            ))}
          </div>
          {slotRound && (
            <p className="hand-result">
              {slotRound.net > 0 ? "Thắng +" : "Thua −"}
              {cash(Math.abs(slotRound.net), true, s.origin)} · trả thưởng tổng{" "}
              {slotsMultiplier(slotRound.symbols)} lần cược
            </p>
          )}
          <p>
            Cơ hội ra tổ hợp thắng khoảng 15%. Kết quả được chọn theo nhóm có
            trọng số; các ô không quay độc lập.
          </p>
          <details>
            <summary>Bảng thưởng · tổng trả gồm tiền cược</summary>
            <p>
              AAA: 20 lần · BBB: 18 · CCC: 15 · DDD: 12 · EEE: 10 · FFF: 8 ·
              ABC: 6 · FED: 3.
            </p>
            <p>
              Đúng hai A: 5 lần · đúng hai B: 4 · đúng hai C: 3, ở bất kỳ vị trí
              nào. Các tổ hợp khác không trả thưởng.
            </p>
            <p>
              Lãi/lỗ ròng = tiền cược × (hệ số trả − 1). Ví dụ cược 1.000, ra
              AAA nhận tổng 20.000 và lãi 19.000; thua mất 1.000.
            </p>
          </details>
          <details>
            <summary>
              Lịch sử máy xèng · {s.casino.slotsHistory.length} lượt
            </summary>
            {s.casino.slotsHistory
              .slice()
              .reverse()
              .map((r) => (
                <p key={r.id}>
                  Tuổi {r.age} · {r.symbols} · cược{" "}
                  {cash(r.bet, true, s.origin)} · {r.net > 0 ? "+" : "−"}
                  {cash(Math.abs(r.net), true, s.origin)}
                </p>
              ))}
          </details>
        </div>
      )}
      {game === "roulette" && (
        <div className="casino-table">
          <h3>Roulette · số 0 đến 12</h3>
          <div className="button-row" role="group" aria-label="Chọn ô roulette">
            {Array.from({ length: 13 }, (_, number) => (
              <button
                className={
                  "button small roulette-number " +
                  (rouletteSelection.kind === "number" &&
                  rouletteSelection.number === number
                    ? "primary"
                    : "subtle")
                }
                key={number}
                data-color={rouletteColor(number)}
                aria-label={`Cược số ${number}`}
                aria-pressed={
                  rouletteSelection.kind === "number" &&
                  rouletteSelection.number === number
                }
                disabled={busy}
                onClick={() => setRouletteSelection({ kind: "number", number })}
              >
                {number}
              </button>
            ))}
            <button
              className="button small"
              aria-pressed={
                rouletteSelection.kind === "color" &&
                rouletteSelection.color === "red"
              }
              disabled={busy}
              onClick={() =>
                setRouletteSelection({ kind: "color", color: "red" })
              }
            >
              Cược đỏ
            </button>
            <button
              className="button small"
              aria-pressed={
                rouletteSelection.kind === "color" &&
                rouletteSelection.color === "black"
              }
              disabled={busy}
              onClick={() =>
                setRouletteSelection({ kind: "color", color: "black" })
              }
            >
              Cược đen
            </button>
          </div>
          <p>
            Đã chọn:{" "}
            {rouletteSelection.kind === "number"
              ? `số ${rouletteSelection.number}`
              : rouletteSelection.color === "red"
                ? "đỏ"
                : "đen"}
            .
          </p>
          <p>
            Số lẻ đỏ, số chẵn đen; 0 không có màu. Thắng cược số lãi 13 lần
            cược, thắng cược màu lãi 1 lần; thua mất cược.
          </p>
          {round && (
            <p className="hand-result">
              Kết quả: {round.resultNumber} ·{" "}
              {rouletteColor(round.resultNumber) === "none"
                ? "không màu"
                : rouletteColor(round.resultNumber) === "red"
                  ? "đỏ"
                  : "đen"}{" "}
              · {round.net > 0 ? "Thắng +" : "Thua −"}
              {cash(Math.abs(round.net), true, s.origin)}
            </p>
          )}
          <details>
            <summary>
              Lịch sử roulette · {s.casino.rouletteHistory.length} lượt
            </summary>
            {s.casino.rouletteHistory
              .slice()
              .reverse()
              .map((r) => (
                <p key={r.id}>
                  Tuổi {r.age} · cược{" "}
                  {r.selection.kind === "number"
                    ? `số ${r.selection.number}`
                    : r.selection.color === "red"
                      ? "đỏ"
                      : "đen"}{" "}
                  · ra {r.resultNumber} · {r.net > 0 ? "+" : "−"}
                  {cash(Math.abs(r.net), true, s.origin)}
                </p>
              ))}
          </details>
        </div>
      )}
      {h && game !== "roulette" && game !== "slots" && (
        <div className="casino-table">
          <h3>{h.game === "blackjack" ? "Blackjack" : "Ba cào"}</h3>
          <p>
            Nhà cái{" "}
            {h.status === "settled"
              ? `· ${h.game === "blackjack" ? blackjackScore(h.dealer).value : bacaoScore(h.dealer)} điểm`
              : "· một lá úp"}
          </p>
          <Cards cards={h.dealer} hidden={h.status === "playing"} />
          <p>
            Bạn ·{" "}
            {h.game === "blackjack"
              ? blackjackScore(h.player).value
              : bacaoScore(h.player)}{" "}
            điểm
          </p>
          <Cards cards={h.player} />
          {s.casino.hand ? (
            <div className="button-row">
              <button
                className="button"
                disabled={busy || !ready}
                onClick={() => dispatch({ type: "casinoHit" })}
              >
                Rút thêm
              </button>
              <button
                className="button primary"
                disabled={busy || !ready}
                onClick={() => dispatch({ type: "casinoStand" })}
              >
                Dừng
              </button>
            </div>
          ) : (
            <p className="hand-result">
              {h.result} · {h.net >= 0 ? "+" : "−"}
              {cash(Math.abs(h.net), true, s.origin)}
            </p>
          )}
        </div>
      )}
      <details className="part-time">
        <summary>Luật bàn</summary>
        <p>
          Sáu bộ bài dùng chung. Blackjack: A tính 1 hoặc 11, hình tính 10; nhà
          cái dừng ở mọi 17, kể cả 17 mềm. Blackjack tự nhiên trả lãi 3:2; thắng
          thường 1:1, hoà trả cược. Bản này dùng rút/dừng, chưa có gấp cược hoặc
          tách bài; không gán lợi thế 0,5% cho bộ luật này.
        </p>
        <p>
          Ba cào: A=1, 2–9 theo số; 10/J/Q/K=0. Tổng lấy dư 10. Không có “ba
          hình”. Hoà trả cược; thắng nhận lãi 94% cược, thua mất cược. Phí 6%
          phần thắng tạo lợi thế nhà cái khoảng 2–4%, được kiểm bằng mô phỏng.
        </p>
        <p>
          Cược tối đa bằng mức nhỏ nhất của 10% tiền hiện có, 2% thu nhập chuẩn
          và trần theo tuổi. Tối đa 20 ván/năm. Bấm tăng tuổi sau khi kết thúc
          ván.
        </p>
      </details>
      <details className="part-time">
        <summary>Lịch sử 100 ván gần nhất · xem lại lá bài</summary>
        {s.casino.history
          .slice()
          .reverse()
          .map((row) => (
            <details key={row.id}>
              <summary>
                Tuổi {row.age} ·{" "}
                {row.game === "blackjack" ? "Blackjack" : "Ba cào"} ·{" "}
                {row.result} · {cash(row.net, true, s.origin)}
              </summary>
              <p>
                Bạn: {row.player.map(cardLabel).join(" ")} · Nhà cái:{" "}
                {row.dealer.map(cardLabel).join(" ")}
              </p>
              <small>
                Cược {row.bet} · seed trước ván {row.seedBefore}
              </small>
            </details>
          ))}
      </details>
    </section>
  );
}
