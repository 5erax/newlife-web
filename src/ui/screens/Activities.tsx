import { useState } from "react";
import type { Action, GameState } from "../../engine/types";
import { activities } from "../../content/catalog";
import { activityReason, activityTargets } from "../../engine/game";
import ui from "../../i18n/vi.json" with { type: "json" };
import { cash, GROUP_LABELS } from "../format";
export function Activities({
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
    [readyOnly, setReadyOnly] = useState(false),
    [targets, setTargets] = useState<Record<string, string>>({});
  const list = activities.filter(
    (a) =>
      (group === "all" || a.group === group) &&
      a.name
        .toLocaleLowerCase("vi-VN")
        .includes(search.toLocaleLowerCase("vi-VN")) &&
      (!readyOnly || !activityReason(s, a)),
  );
  return (
    <section className="screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">MỘT NĂM CÓ THỂ LÀM GÌ?</p>
          <h2>{ui.activities}</h2>
          <p className="muted">
            108 cách thử, học, nghỉ ngơi và gặp người khác.
          </p>
        </div>
        <span className="budget">
          ◷ {s.time}/12 {ui.timePoint}
        </span>
      </div>
      {s.illnesses.length > 0 && (
        <div className="feature-panel">
          <h3>Sức khoẻ cần theo dõi</h3>
          {s.illnesses.map((i) => (
            <p key={i.id}>
              <strong>{i.type}</strong> · mức độ {i.severity}/100 · điều trị{" "}
              {i.progress}/60 · phát hiện tuổi {i.discoveredAge}
            </p>
          ))}
          <small>
            Chọn hoạt động điều trị và đúng tình trạng ở danh sách bên dưới.
          </small>
        </div>
      )}
      <div className="toolbar">
        <input
          type="search"
          aria-label="Tìm hoạt động"
          placeholder={ui.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Nhóm hoạt động"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
        >
          <option value="all">{ui.all}</option>
          {Array.from(new Set(activities.map((a) => a.group))).map((g) => (
            <option key={g} value={g}>
              {GROUP_LABELS[g]}
            </option>
          ))}
        </select>
        <label className="check">
          <input
            type="checkbox"
            checked={readyOnly}
            onChange={(e) => setReadyOnly(e.target.checked)}
          />
          {ui.readyOnly}
        </label>
      </div>
      {group === "ruiro" && (
        <p className="banner">
          Những lựa chọn hư cấu này có thể mất tiền, sức khoẻ hoặc nhiều năm tự
          do trong game.
        </p>
      )}
      <div className="catalog-list">
        {list.map((a) => {
          const reason = activityReason(s, a);
          const available = activityTargets(s, a);
          const target =
            available.find((t) => t.id === targets[a.id])?.id ??
            available[0]?.id;
          return (
            <article className="catalog-row" key={a.id}>
              <div className="row-icon">
                {a.group === "ruiro"
                  ? "⚠"
                  : a.group === "tinhcam"
                    ? "♡"
                    : a.group === "suckhoe"
                      ? "✚"
                      : "✦"}
              </div>
              <div className="row-body">
                <div className="row-title">
                  <h3>{a.name}</h3>
                  <span className="tag">{GROUP_LABELS[a.group]}</span>
                </div>
                <p>{a.description}</p>
                <div className="row-meta">
                  <span>{a.cost ? cash(a.cost) : ui.free}</span>
                  <span>
                    ◷ {a.timeCost} {ui.timePoint}
                  </span>
                  <span>
                    {s.activityUses[a.id] ?? 0}/{a.maxUsesPerYear} lượt/năm
                  </span>
                </div>
                {a.target && available.length > 0 && (
                  <select
                    aria-label={`Chọn đối tượng cho ${a.name}`}
                    value={target}
                    onChange={(e) =>
                      setTargets((v) => ({ ...v, [a.id]: e.target.value }))
                    }
                  >
                    {available.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}
                {reason && <small className="lock-reason">{reason}</small>}
              </div>
              <button
                className="button small"
                disabled={busy || !!reason}
                onClick={() =>
                  dispatch({ type: "activity", id: a.id, targetId: target })
                }
              >
                {ui.perform}
                <span>↗</span>
              </button>
            </article>
          );
        })}
      </div>
      {!list.length && <p className="empty">{ui.noResults}</p>}
    </section>
  );
}
