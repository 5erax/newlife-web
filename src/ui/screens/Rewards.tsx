import type { GameState } from "../../engine/types";
import { achievements } from "../../content/catalog";
import medals from "../../content/medals.json" with { type: "json" };
import ui from "../../i18n/vi.json" with { type: "json" };
import { metric } from "../../engine/helpers";
export function Rewards({ s }: { s: GameState }) {
  return (
    <section className="screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">NHỮNG DẤU MỐC ĐÃ QUA</p>
          <h2>{ui.achievements}</h2>
          <p className="muted">
            Giữ qua những cuộc đời mới, không phải một bảng chấm điểm cuộc sống.
          </p>
        </div>
        <span className="budget">{s.profile.achievements.length}/40</span>
      </div>
      <div className="achievement-list">
        {achievements.map((a) => {
          const unlocked = s.profile.achievements.includes(a.id);
          return (
            <article
              className={"achievement " + (unlocked ? "unlocked" : "")}
              key={a.id}
            >
              <span className="achievement-symbol">{unlocked ? "✦" : "◇"}</span>
              <div>
                <h3>{a.name}</h3>
                <p>{a.description}</p>
                {!unlocked &&
                  a.conditions
                    .filter((c) => "field" in c)
                    .map(
                      (c, i) =>
                        "field" in c && (
                          <small key={i}>
                            Đời này:{" "}
                            {metric(s, c.field).toLocaleString("vi-VN")} /{" "}
                            {c.value.toLocaleString("vi-VN")}
                          </small>
                        ),
                    )}
                <small>
                  {unlocked ? ui.unlockedAchievement : ui.lockedAchievement}
                </small>
                {unlocked && s.profile.unlockLives?.[a.id] && (
                  <small>
                    Đạt lần đầu:{" "}
                    {s.profile.summaries.find(
                      (x) => x.lifeId === s.profile.unlockLives?.[a.id],
                    )?.name ??
                      (s.profile.unlockLives[a.id] === s.id
                        ? s.name
                        : "Một đời trước")}
                  </small>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <h3 className="subheading">{ui.medals} trong đời này</h3>
      <div className="button-row">
        {medals.map((m) => (
          <div
            className={"medal " + (s.medals.includes(m.id) ? "earned" : "")}
            key={m.id}
          >
            <span>✦</span>
            <strong>{m.name}</strong>
            <small>{m.source}</small>
          </div>
        ))}
      </div>
      {s.profile.summaries.length > 0 && (
        <>
          <h3 className="subheading">Những cuộc đời được giữ lại</h3>
          {s.profile.summaries
            .slice()
            .reverse()
            .map((summary) => (
              <div className="summary-row" key={summary.lifeId}>
                <strong>{summary.name}</strong>
                <span>{summary.age} tuổi</span>
                <span>{summary.title}</span>
              </div>
            ))}
        </>
      )}
    </section>
  );
}
