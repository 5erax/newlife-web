import { useState } from "react";
import type { GameState } from "../../engine/types";
import ui from "../../i18n/vi.json" with { type: "json" };
export function Journal({ s }: { s: GameState }) {
  const [limit, setLimit] = useState(50);
  const selected = s.log.slice(-limit);
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
      {selected.length < s.log.length && (
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
              {rows.map((row) => (
                <p key={row.id} className={"log-" + row.kind}>
                  {row.kind === "achievement" && (
                    <span className="inline-icon">✦ </span>
                  )}
                  {row.text}
                </p>
              ))}
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
