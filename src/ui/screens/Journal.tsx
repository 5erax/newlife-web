import { useState } from "react";
import type { GameState } from "../../engine/types";
import ui from "../../i18n/vi.json" with { type: "json" };
import { DeltaChips } from "../components/StatChanges";
export function Journal({ s }: { s: GameState }) {
  const [limit, setLimit] = useState(50);
  const [filter, setFilter] = useState("all");
  const filtered = s.log.filter(
    (r) =>
      filter === "all" ||
      (filter === "health"
        ? r.deltas.some((d) => d.key === "health")
        : filter === "money"
          ? r.kind === "money" || r.deltas.some((d) => d.key === "money")
          : filter === "relationship"
            ? r.kind === "relationship" ||
              ["relation", "relationship"].includes(r.source)
            : [
                "economy",
                "job",
                "quit",
                "retire",
                "workHard",
                "sideJob",
              ].includes(r.source)),
  );
  const selected = filtered.slice(-limit);
  const groups = new Map<number, typeof selected>();
  for (const row of selected) {
    const list = groups.get(row.age) ?? [];
    list.push(row);
    groups.set(row.age, list);
  }
  return (
    <section className="journal-paper">
      <header className="paper-head">
        <div>
          <p className="eyebrow">
            CÂU CHUYỆN CỦA {s.name.toLocaleUpperCase("vi-VN")}
          </p>
          <h2>{ui.journal} cuộc đời</h2>
        </div>
        <span className="stamp">
          {new Date(s.birthDate + "T00:00:00Z").getUTCFullYear() + s.age}
        </span>
      </header>
      <div className="toolbar">
        <label>
          Lọc nhật ký{" "}
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setLimit(50);
            }}
          >
            {[
              ["all", "Tất cả"],
              ["health", "Sức khoẻ"],
              ["money", "Tiền bạc"],
              ["relationship", "Quan hệ"],
              ["career", "Sự nghiệp"],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {s.prisonYears > 0 && (
        <div className="banner">
          {ui.prison}: còn {s.prisonYears} năm. Bạn vẫn có thể đọc sách và chăm
          sức khoẻ.
        </div>
      )}
      {s.illnesses.length > 0 && (
        <div className="banner gentle">
          Bạn đang có {s.illnesses.length} tình trạng sức khoẻ cần chăm sóc. Mở
          Hoạt động → Sức khoẻ để theo dõi.
        </div>
      )}
      {selected.length < filtered.length && (
        <button
          className="button subtle more-log"
          onClick={() => setLimit((n) => n + 100)}
        >
          {ui.more} ↑
        </button>
      )}
      <div className="timeline">
        {Array.from(groups).map(([age, rows]) => (
          <article className="year-entry" key={age}>
            <div className="year-label">
              <span>{age}</span>
              <small>{ui.years}</small>
            </div>
            <div className="year-content">
              {rows.map((row) =>
                row.source === "summary" ? (
                  <details className="year-summary" key={row.id}>
                    <summary>{row.text}</summary>
                    <DeltaChips deltas={row.deltas} origin={s.origin} />
                    {row.deltas.map((d) => (
                      <p key={d.key}>{d.reasons.join(" · ")}</p>
                    ))}
                  </details>
                ) : (
                  <div key={row.id} className={"log-" + row.kind}>
                    <p>
                      {row.kind === "achievement" && (
                        <span className="inline-icon">✦ </span>
                      )}
                      {row.text}
                    </p>
                    <DeltaChips deltas={row.deltas} origin={s.origin} />
                  </div>
                ),
              )}
            </div>
          </article>
        ))}
      </div>
      <div className="paper-end">
        {s.phase === "dead"
          ? "Một câu chuyện được giữ lại."
          : "Trang tiếp theo vẫn đang chờ…"}
        <span>✦</span>
      </div>
    </section>
  );
}
