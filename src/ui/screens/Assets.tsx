import { localPrice } from "../../engine/world";
import { useState } from "react";
import type { Action, GameState } from "../../engine/types";
import { assets, assetById } from "../../content/catalog";
import ui from "../../i18n/vi.json" with { type: "json" };
import { cash as displayCash, GROUP_LABELS } from "../format";
import { netWorth } from "../../engine/helpers";
export function Assets({
  s,
  dispatch,
  busy,
}: {
  s: GameState;
  dispatch: (a: Action) => void;
  busy: boolean;
}) {
  const cash = (value: number, full = false) =>
    displayCash(value, full, s.origin);
  const [investmentView, setInvestmentView] = useState(false);
  const [mode, setMode] = useState("owned"),
    [group, setGroup] = useState("all");
  const owned = s.assets.filter((a) => a.alive);
  const active = s.phase === "ready" && !s.prisonYears;
  return (
    <section className="screen">
      <button
        className="button subtle"
        onClick={() => setInvestmentView((v) => !v)}
      >
        {investmentView
          ? "← Tài sản và sổ tiền"
          : "↗ Đầu tư · trái phiếu, cổ phiếu, quỹ và tiền mã hoá"}
      </button>
      {investmentView ? (
        <Investments s={s} dispatch={dispatch} busy={busy} />
      ) : (
        <>
          <div className="section-heading">
            <div>
              <p className="eyebrow">GIÁ TRỊ ĐI CÙNG TRÁCH NHIỆM</p>
              <h2>{ui.assets}</h2>
              <p className="muted">
                {ui.netWorth}: {cash(netWorth(s))} · Nợ{" "}
                {cash(s.debts.reduce((n, d) => n + d.balance, 0))}
              </p>
            </div>
            <span className="budget">{cash(s.money)}</span>
          </div>
          <div className="feature-panel compact">
            <div>
              <h3>{ui.currentHousing}</h3>
              <p>
                {s.housing === "family"
                  ? ui.familyHousing
                  : s.housing === "rent"
                    ? ui.rentedHousing
                    : ui.ownHousing}
              </p>
            </div>
            <button
              className="button subtle"
              disabled={busy || !active || s.age < 18 || s.money < localPrice(s, 2000000)}
              onClick={() => dispatch({ type: "rent" })}
            >
              {ui.rent} · {cash(localPrice(s, 2000000))} đặt cọc
            </button>
          </div>
          <div className="toolbar">
            <div className="segmented">
              <button
                aria-pressed={mode === "owned"}
                onClick={() => setMode("owned")}
              >
                {ui.owned} ({owned.length})
              </button>
              <button
                aria-pressed={mode === "shop"}
                onClick={() => setMode("shop")}
              >
                {ui.shop} (24)
              </button>
            </div>
            <select
              aria-label="Nhóm tài sản"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
              <option value="all">{ui.all}</option>
              {[
                "house",
                "vehicle",
                "investment",
                "equipment",
                "luxury",
                "pet",
              ].map((g) => (
                <option key={g} value={g}>
                  {GROUP_LABELS[g]}
                </option>
              ))}
            </select>
          </div>
          {mode === "owned" ? (
            <div className="catalog-list">
              {owned
                .filter(
                  (a) =>
                    group === "all" ||
                    assetById.get(a.catalogId)?.category === group,
                )
                .map((a) => {
                  const item = assetById.get(a.catalogId)!;
                  return (
                    <article className="catalog-row" key={a.instanceId}>
                      <span className="row-icon">
                        {item.category === "pet"
                          ? "♧"
                          : item.category === "house"
                            ? "⌂"
                            : "◇"}
                      </span>
                      <div className="row-body">
                        <h3>
                          {item.name} {a.quantity > 1 && `× ${a.quantity}`}
                        </h3>
                        <p>
                          {a.age} năm ·{" "}
                          {item.category === "pet"
                            ? `Sức khoẻ ${a.condition}/100 · Gắn bó ${a.bond}/100${a.lost ? " · Thất lạc" : ""}`
                            : `Độ bền ${a.condition}/100`}
                        </p>
                        <div className="row-meta">
                          <span>
                            {ui.value}: {cash(a.value * a.quantity)}
                          </span>
                          <span>
                            {ui.upkeep}:{" "}
                            {cash(localPrice(s, item.upkeep * a.quantity))}
                          </span>
                          {a.primary && (
                            <span className="tag">{ui.primary}</span>
                          )}
                        </div>
                      </div>
                      <div className="row-actions">
                        {item.category === "house" && !a.primary && (
                          <button
                            className="button small"
                            disabled={busy || !active}
                            onClick={() =>
                              dispatch({
                                type: "primary",
                                instanceId: a.instanceId,
                              })
                            }
                          >
                            {ui.setPrimary}
                          </button>
                        )}
                        {item.category !== "pet" && (
                          <button
                            className="button small subtle"
                            disabled={busy || !active}
                            onClick={() => {
                              if (confirm(ui.confirmSell))
                                dispatch({
                                  type: "sell",
                                  instanceId: a.instanceId,
                                });
                            }}
                          >
                            {ui.sell} ·{" "}
                            {cash(Math.round(a.value * a.quantity * 0.92))}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              {!owned.length && <p className="empty">{ui.noAssets}</p>}
            </div>
          ) : (
            <>
              <p className="fine muted">
                Phí mua 2%, phí bán 8%. Giá thị trường chỉ thay đổi khi sang năm
                mới.
              </p>
              <div className="catalog-list">
                {assets
                  .filter((a) => group === "all" || a.category === group)
                  .map((item) => {
                    const price = Math.round(s.market[item.id] * 1.02);
                    return (
                      <article className="catalog-row" key={item.id}>
                        <span className="row-icon">
                          {item.category === "house"
                            ? "⌂"
                            : item.category === "pet"
                              ? "♧"
                              : "◇"}
                        </span>
                        <div className="row-body">
                          <h3>{item.name}</h3>
                          <p>
                            {GROUP_LABELS[item.category]} · Từ {item.minAge}{" "}
                            tuổi
                          </p>
                          <div className="row-meta">
                            <strong>{cash(price)}</strong>
                            <span>
                              Duy trì {cash(localPrice(s, item.upkeep))}/năm
                            </span>
                          </div>
                          {s.age < item.minAge && (
                            <small className="lock-reason">
                              Cần từ {item.minAge} tuổi.
                            </small>
                          )}
                        </div>
                        <button
                          className="button small"
                          disabled={
                            busy ||
                            !active ||
                            s.age < item.minAge ||
                            s.money < price
                          }
                          onClick={() => dispatch({ type: "buy", id: item.id })}
                        >
                          {ui.buy}
                        </button>
                      </article>
                    );
                  })}
              </div>
            </>
          )}
          <details className="part-time">
            <summary>Sổ tiền · {s.ledger.length} giao dịch</summary>
            <div className="ledger">
              {s.ledger
                .slice(-30)
                .reverse()
                .map((row) => (
                  <div key={row.id}>
                    <span>
                      Tuổi {row.age} · {row.label}
                    </span>
                    <strong className={row.amount > 0 ? "positive" : ""}>
                      {row.amount > 0 ? "+" : ""}
                      {cash(row.amount)}
                    </strong>
                  </div>
                ))}
            </div>
          </details>
        </>
      )}
    </section>
  );
}
import { Investments } from "./Investments";
