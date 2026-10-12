import { useState } from "react";
import type { Action, GameState } from "../../engine/types";
import { education, educationById } from "../../content/catalog";
import industryData from "../../content/industries.json" with { type: "json" };
import { educationReason } from "../../engine/economy";
import ui from "../../i18n/vi.json" with { type: "json" };
import { cash } from "../format";
export function Education({
  s,
  dispatch,
  busy,
}: {
  s: GameState;
  dispatch: (a: Action) => void;
  busy: boolean;
}) {
  const [specialty, setSpecialty] = useState("congnghe"),
    [loan, setLoan] = useState(false);
  const current = s.education.current;
  return (
    <section className="screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CỨ TIẾP TỤC HỌC</p>
          <h2>{ui.education}</h2>
          <p className="muted">
            Một bằng cấp mở những cơ hội mới; một sở thích cũng vậy.
          </p>
        </div>
        <span className="budget">
          {ui.score}: {current?.score ?? s.education.score}/100
        </span>
      </div>
      <div className="feature-panel">
        <h3>{ui.currentStudy}</h3>
        {current ? (
          <>
            <strong>{educationById.get(current.id)?.name}</strong>
            <p>
              Năm {current.year + 1}/{educationById.get(current.id)?.years} ·
              Điểm {current.score}/100
            </p>
            <progress
              value={current.year}
              max={educationById.get(current.id)?.years}
              aria-label={ui.progress}
            />
            <button
              className="button subtle"
              disabled={busy || s.phase !== "ready"}
              onClick={() => {
                if (confirm(ui.confirmDropout)) dispatch({ type: "dropout" });
              }}
            >
              {ui.dropout}
            </button>
          </>
        ) : (
          <p>{ui.notStudying}</p>
        )}
        <div className="degree-tags">
          {s.education.completed.map((id) => (
            <span className="tag" key={id}>
              ✓ {educationById.get(id)?.name}
            </span>
          ))}
        </div>
      </div>
      <div className="toolbar">
        <label>
          {ui.specialty}
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          >
            {industryData.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={loan}
            onChange={(e) => setLoan(e.target.checked)}
          />
          {ui.loan}
        </label>
      </div>
      <div className="catalog-list">
        {education.map((p) => {
          const reason = educationReason(s, p.id);
          return (
            <article className="catalog-row" key={p.id}>
              <span className="row-icon">▤</span>
              <div className="row-body">
                <h3>{p.name}</h3>
                <div className="row-meta">
                  <span>{p.years} năm</span>
                  <span>Từ {p.minAge} tuổi</span>
                  <span>{p.cost ? cash(p.cost) + "/năm" : ui.free}</span>
                </div>
                <p>
                  {p.requires.length
                    ? "Yêu cầu: " +
                      p.requires
                        .map((id) => educationById.get(id)?.name)
                        .join(", ")
                    : "Có thể bắt đầu khi đủ tuổi."}
                </p>
                {reason && <small className="lock-reason">{reason}</small>}
              </div>
              <button
                className="button small"
                disabled={busy || s.phase !== "ready" || !!reason}
                onClick={() =>
                  dispatch({ type: "enroll", id: p.id, specialty, loan })
                }
              >
                {ui.enroll}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
