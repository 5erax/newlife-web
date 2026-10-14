import { useState } from "react";
import type { Action, GameState, InvestmentGroup } from "../../engine/types";
import {
  INVESTMENT_LABELS,
  portfolioValue,
  marketCapacity,
  tradeQuote,
  valueForUnits,
  apkStockById,
  APK_STOCK_SECTORS,
} from "../../engine/investments";
import { cash } from "../format";
function Sparkline({ values, label }: { values: number[]; label: string }) {
  const min = Math.min(...values),
    range = Math.max(...values) - min || 1;
  const points = values
    .map(
      (v, i) =>
        `${(i / Math.max(1, values.length - 1)) * 250},${65 - ((v - min) / range) * 55}`,
    )
    .join(" ");
  return (
    <svg
      className="market-chart"
      viewBox="0 0 250 75"
      role="img"
      aria-label={label}
    >
      <path d="M0 65H250" stroke="currentColor" opacity=".2" />
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}
export function Investments({
  s,
  dispatch,
  busy,
}: {
  s: GameState;
  dispatch: (a: Action) => void;
  busy: boolean;
}) {
  const [group, setGroup] = useState("all"),
    [search, setSearch] = useState(""),
    [amounts, setAmounts] = useState<Record<string, string>>({}),
    [showClosed, setShowClosed] = useState(false);
  const money = (value: number, full = false) => cash(value, full, s.origin),
    value = portfolioValue(s),
    cost = s.investments.positions.reduce((n, p) => n + p.costBasis, 0),
    profit = s.investments.realized + value - cost + s.investments.dividends,
    ready =
      s.age >= 18 &&
      s.phase === "ready" &&
      !s.prisonYears &&
      !s.casino.hand &&
      !s.loveOffer &&
      !s.jobInterview;
  const list = s.investments.instruments.filter(
    (i) =>
      (group === "all" || i.group === group) &&
      i.name
        .toLocaleLowerCase("vi-VN")
        .includes(search.toLocaleLowerCase("vi-VN")) &&
      (showClosed ||
        i.status === "active" ||
        s.investments.positions.some((p) => p.id === i.id)),
  );
  return (
    <section className="screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">NHỮNG CON SỐ KHÔNG ĐỨNG YÊN</p>
          <h2>Đầu tư</h2>
          <p className="muted">
            Thị trường hư cấu trong game · giao dịch từ 18 tuổi · tiền lưu theo
            đơn vị nội bộ.
          </p>
        </div>
        <span className="budget">Tiền mặt {money(s.money)}</span>
      </div>
      {s.flags.includes("apk_mode") && (
        <p className="muted fine">
          Danh mục coin và cổ phiếu từ APK. Giá, thanh khoản và biến động dùng mô hình thị
          trường hư cấu của bản web.
        </p>
      )}
      <div className="investment-summary">
        <div>
          <small>Giá trị đang nắm</small>
          <strong>{money(value)}</strong>
        </div>
        <div>
          <small>Giá vốn đang nắm</small>
          <strong>{money(cost)}</strong>
        </div>
        <div>
          <small>Lãi/lỗ đã chốt</small>
          <strong>{money(s.investments.realized)}</strong>
        </div>
        <div>
          <small>Tổng lãi/lỗ và thu nhập</small>
          <strong>
            {money(profit)}{" "}
            {s.investments.invested > 0 && (
              <small>
                (
                {((100 * profit) / s.investments.invested).toLocaleString(
                  "vi-VN",
                  { maximumFractionDigits: 2 },
                )}
                % vốn đã giao dịch)
              </small>
            )}
          </strong>
        </div>
      </div>
      {s.investments.history.length > 1 && (
        <Sparkline
          values={s.investments.history.map((h) => h.value)}
          label="Giá trị danh mục theo năm"
        />
      )}
      <div className="market-health">
        {(Object.keys(INVESTMENT_LABELS) as InvestmentGroup[]).map((g) => (
          <button
            key={g}
            aria-pressed={group === g}
            onClick={() => setGroup(group === g ? "all" : g)}
          >
            <strong>{INVESTMENT_LABELS[g]}</strong>
            <small>Tâm lý thị trường {s.investments.health[g]}/100</small>
            <progress
              value={s.investments.health[g]}
              max={100}
              aria-label={INVESTMENT_LABELS[g] + " · tâm lý thị trường"}
            />
          </button>
        ))}
      </div>
      <details className="part-time" open>
        <summary>Tin thị trường và công cụ</summary>
        <div className="button-row">
          {[
            ["news", "Đọc tin"],
            ["advisor", "Gặp cố vấn · có phí"],
            ["opinion", "Nghe một ý kiến"],
          ].map(([mode, label]) => (
            <button
              key={mode}
              className="button small subtle"
              disabled={
                busy || !ready || !s.time || !!s.activityUses["market_" + mode]
              }
              onClick={() =>
                dispatch({
                  type: "marketResearch",
                  mode: mode as "news" | "advisor" | "opinion",
                })
              }
            >
              {label}
            </button>
          ))}
        </div>
        {s.investments.news
          .slice(-8)
          .reverse()
          .map((n, i) => (
            <p key={i}>
              Tuổi {n.age} · {n.text}
            </p>
          ))}
        <small>
          Tin phản ánh việc đã xảy ra; không tiết lộ giá tương lai. Coin mới có
          thể tăng mạnh hoặc thất bại hoàn toàn.
        </small>
      </details>
      <div className="toolbar">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm sản phẩm"
          aria-label="Tìm sản phẩm đầu tư"
        />
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          aria-label="Loại đầu tư"
        >
          <option value="all">Tất cả</option>
          {Object.entries(INVESTMENT_LABELS).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
        <label className="check">
          <input
            type="checkbox"
            checked={showClosed}
            onChange={(e) => setShowClosed(e.target.checked)}
          />
          Cả sản phẩm đã thất bại
        </label>
      </div>
      <div className="catalog-list">
        {list.map((i) => {
          const held = s.investments.positions.find((p) => p.id === i.id),
            units = Math.round(Number(amounts[i.id] ?? "1") * 1000),
            valid = Number.isSafeInteger(units) && units >= 1 && units <= 1e12;
          let buy = 0,
            sell = 0,
            quoted = false;
          try {
            if (valid) {
              buy = tradeQuote(i, units, true).total;
              sell = tradeQuote(i, units, false).total;
              quoted = true;
            }
          } catch {
            quoted = false;
          }
          const old = i.history.at(-2)?.price ?? i.price,
            change = old ? (i.price / old - 1) * 100 : 0,
            allTime = (i.price / i.initialPrice - 1) * 100;
          return (
            <article className="investment-row" key={i.id}>
              <div className="row-title">
                <h3>
                  {i.name} <small>({i.ticker})</small>
                </h3>
                <span className="tag">{INVESTMENT_LABELS[i.group]}</span>
              </div>
              {apkStockById.has(i.id) && (
                <p>
                  Ngành: {APK_STOCK_SECTORS[apkStockById.get(i.id)!.sector]}
                </p>
              )}
              <div className="investment-price">
                <strong>{money(i.price, true)}</strong>
                <span>
                  {change >= 0 ? "↑ +" : "↓ "}
                  {change.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}
                  % năm gần nhất · {allTime >= 0 ? "+" : ""}
                  {allTime.toLocaleString("vi-VN", {
                    maximumFractionDigits: 1,
                  })}
                  % từ niêm yết
                </span>
              </div>
              {i.history.length > 1 && (
                <Sparkline
                  values={i.history.map((h) => h.price)}
                  label={`Lịch sử giá ${i.name}`}
                />
              )}
              <p>
                Rủi ro {i.risk}/100 · Mức chú ý {i.trendiness}/100 · Thanh khoản
                còn {money(marketCapacity(s, i))}/năm.
              </p>
              {held && (
                <p>
                  <strong>
                    Đang nắm: {(held.units / 1000).toLocaleString("vi-VN")} ·
                    giá vốn {money(held.costBasis)} · giá trị{" "}
                    {money(valueForUnits(i.price, held.units))}
                  </strong>
                  {held.maturityAge !== undefined &&
                    ` · đáo hạn tuổi ${held.maturityAge}`}
                </p>
              )}
              {i.group === "bond" && (
                <p>
                  Lãi suất mô phỏng {(i.yieldRate * 100).toFixed(1)}% mệnh
                  giá/năm · kỳ hạn {i.termYears} năm sau khi mua · có rủi ro
                  không thanh toán.
                </p>
              )}
              {i.status === "delisted" && (
                <p className="lock-reason">
                  Đã mất giá trị. Bán/xoá vị thế ghi nhận khoản lỗ; sản phẩm này
                  không tự hồi sinh.
                </p>
              )}
              <div className="toolbar">
                <label>
                  Số lượng · bước 0,001
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={amounts[i.id] ?? "1"}
                    onChange={(e) =>
                      setAmounts((v) => ({ ...v, [i.id]: e.target.value }))
                    }
                    aria-label={`Số lượng ${i.ticker}`}
                  />
                </label>
                <button
                  className="button small"
                  disabled={
                    busy ||
                    !ready ||
                    !quoted ||
                    i.status !== "active" ||
                    buy > s.money ||
                    marketCapacity(s, i) <
                      (quoted ? tradeQuote(i, units, true).principal : 0) ||
                    (!!held && i.group === "bond")
                  }
                  onClick={() =>
                    dispatch({ type: "investmentBuy", id: i.id, units })
                  }
                >
                  Mua · {money(buy)}
                </button>
                <button
                  className="button small subtle"
                  disabled={
                    busy ||
                    !ready ||
                    !quoted ||
                    !held ||
                    units > held.units ||
                    (i.price > 0 &&
                      marketCapacity(s, i) <
                        (quoted ? tradeQuote(i, units, false).principal : 0))
                  }
                  onClick={() =>
                    dispatch({ type: "investmentSell", id: i.id, units })
                  }
                >
                  {i.price ? "Bán" : "Xoá ghi lỗ"} · {money(sell)}
                </button>
                {held && (
                  <button
                    className="button small subtle"
                    onClick={() =>
                      setAmounts((v) => ({
                        ...v,
                        [i.id]: String(held.units / 1000),
                      }))
                    }
                  >
                    Toàn bộ vị thế
                  </button>
                )}
              </div>
              <small>
                Phí mỗi chiều 1%. Giá trị thực hiện có làm tròn theo đơn vị nội
                bộ.
              </small>
            </article>
          );
        })}
      </div>
      {!list.length && <p className="empty">Không có sản phẩm phù hợp.</p>}
    </section>
  );
}
