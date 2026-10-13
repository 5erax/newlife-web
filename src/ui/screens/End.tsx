import type { Action, GameState } from "../../engine/types";
import ui from "../../i18n/vi.json" with { type: "json" };
import { cash as displayCash } from "../format";
import { Avatar } from "../components/Avatar";
export function End({
  s,
  onNew,
  dispatch,
  busy,
}: {
  s: GameState;
  onNew: () => void;
  dispatch: (a: Action) => void;
  busy: boolean;
}) {
  const cash = (value: number, full = false) =>
    displayCash(value, full, s.origin);
  const summary = s.profile.summaries.find((x) => x.lifeId === s.id);
  const children = s.relations.filter(
    (r) =>
      r.alive &&
      r.role === "child" &&
      !s.profile.estateReceipts.includes(`${s.estate.id}_${r.id}`),
  );
  return (
    <section className="end-life">
      <div className="end-decoration">✦</div>
      <p className="eyebrow">MỘT CÂU CHUYỆN ĐƯỢC GIỮ LẠI</p>
      <h2>{ui.lifeOver}</h2>
      <Avatar
        age={s.age}
        happiness={s.stats.happiness}
        gender={s.gender}
        appearance={s.appearance}
      />
      <h3>{s.name}</h3>
      <p>
        {s.age} tuổi · {s.deathCause}
      </p>
      <div className="title-ribbon">
        ✦ {summary?.title ?? "Bình dị mà đáng nhớ"} ✦
      </div>
      <div className="end-facts">
        <div>
          <small>{ui.netWorth}</small>
          <strong>{cash(summary?.netWorth ?? 0)}</strong>
        </div>
        <div>
          <small>Người con trong đời</small>
          <strong>{summary?.children ?? 0}</strong>
        </div>
        <div>
          <small>{ui.medals}</small>
          <strong>{s.medals.length}</strong>
        </div>
      </div>
      <p className="muted">
        {summary?.job}. Mọi điều đã trải qua vẫn còn trong nhật ký.
      </p>
      <button className="button primary" onClick={onNew} disabled={busy}>
        {ui.newLife} →
      </button>
      {children.length > 0 && (
        <section className="child-next">
          <h3>{ui.childLife}</h3>
          <p className="muted">
            Bắt đầu ở tuổi hiện tại của con, giữ các quan hệ đã biết và phần di
            sản đúng người.
          </p>
          {children.map((child) => (
            <button
              className="recent-life"
              key={child.id}
              disabled={busy}
              onClick={() => dispatch({ type: "continueChild", id: child.id })}
            >
              <Avatar small age={child.age} gender={child.gender} />
              <span>
                <strong>{child.name}</strong>
                <small>
                  {child.age} tuổi · Di sản{" "}
                  {cash(s.estate.distributions[child.id] ?? 0)}
                </small>
              </span>
              <span>→</span>
            </button>
          ))}
        </section>
      )}
    </section>
  );
}
