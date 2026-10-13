import { useState } from "react";
import type { Action, GameState, CasinoHand } from "../../engine/types";
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
  const [game, setGame] = useState<CasinoHand["game"]>("blackjack"),
    [bet, setBet] = useState(1000);
  const h = s.casino.hand ?? s.casino.history.at(-1),
    max = casinoBetLimit(s),
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
            value={game}
            disabled={!!s.casino.hand}
            onChange={(e) => setGame(e.target.value as typeof game)}
          >
            <option value="blackjack">Blackjack</option>
            <option value="bacao">Ba cào</option>
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
            bet % 100 !== 0
          }
          onClick={() => dispatch({ type: "casinoDeal", game, bet })}
        >
          Chia bài
        </button>
      </div>
      {h && (
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
