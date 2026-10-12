import type { Action, GameState } from "../../engine/types";
import { stories } from "../../content/catalog";
import ui from "../../i18n/vi.json" with { type: "json" };
export function Stories({
  s,
  dispatch,
  busy,
}: {
  s: GameState;
  dispatch: (a: Action) => void;
  busy: boolean;
}) {
  const active = s.story
    ? stories.find((story) => story.id === s.story!.storyId)
    : undefined;
  const node = active?.nodes.find((n) => n.id === s.story!.nodeId);
  if (active && node)
    return (
      <section className="screen story-screen">
        <div className="story-top">
          <button
            className="button subtle"
            onClick={() => dispatch({ type: "storyClose" })}
            disabled={busy}
          >
            ← {ui.backStories}
          </button>
          <span className="tag">{s.story!.turns} lượt</span>
        </div>
        <span className="story-symbol">{active.icon}</span>
        <p className="eyebrow">
          {node.ending ? "MỘT KẾT THÚC" : "MỘT CÂU CHUYỆN KHÁC"}
        </p>
        <h2>{active.name}</h2>
        <article className="story-paper">
          <p>{node.text}</p>
          {node.ending ? (
            <>
              <div className="ending-stamp">✦ {node.ending.name}</div>
              <p className="fine muted">{ui.storyEnding}</p>
              <button
                className="button primary"
                disabled={busy}
                onClick={() => {
                  dispatch({ type: "storyClose" });
                }}
              >
                {ui.backStories}
              </button>
            </>
          ) : (
            <div className="choice-list">
              {node.choices
                .filter(
                  (c) => !c.requires || s.story!.flags.includes(c.requires),
                )
                .map((choice, i) => (
                  <button
                    className="choice"
                    key={choice.id}
                    disabled={busy}
                    onClick={() =>
                      dispatch({
                        type: "storyChoice",
                        nodeId: node.id,
                        choiceId: choice.id,
                      })
                    }
                  >
                    <span className="choice-number">{i + 1}</span>
                    <span>{choice.label}</span>
                    <span>→</span>
                  </button>
                ))}
            </div>
          )}
        </article>
      </section>
    );
  return (
    <section className="screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">RẼ KHỎI NHỮNG NGÀY THƯỜNG</p>
          <h2>{ui.storyCollection}</h2>
          <p className="muted">
            Năm truyện tự viết. Mỗi truyện có ba kết thúc để tìm thấy.
          </p>
        </div>
      </div>
      <div className="story-list">
        {stories.map((story, i) => (
          <article className="story-card" key={story.id}>
            <span className="story-index">0{i + 1}</span>
            <span className="story-icon">{story.icon}</span>
            <div>
              <h3>{story.name}</h3>
              <p>{story.description}</p>
              <div
                className="ending-dots"
                aria-label={`${s.profile.endings[story.id]?.length ?? 0}/3 kết thúc`}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={
                      (s.profile.endings[story.id]?.length ?? 0) > i
                        ? "found"
                        : ""
                    }
                  >
                    ✦
                  </span>
                ))}
                <small>
                  {s.profile.endings[story.id]?.length ?? 0}/3 kết thúc
                </small>
              </div>
              <button
                className="button"
                disabled={busy}
                onClick={() => dispatch({ type: "storyStart", id: story.id })}
              >
                {ui.playStory} →
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
