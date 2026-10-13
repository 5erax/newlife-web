import { useState } from "react";
import type { Action, GameState, Relation } from "../../engine/types";
import { ROLE_LABELS } from "../../engine/types";
import ui from "../../i18n/vi.json" with { type: "json" };
import { Avatar } from "../components/Avatar";
import { npcProfile } from "../../engine/npc";
const buttons: [Extract<Action, { type: "relation" }>["action"], string][] = [
  ["talk", "Trò chuyện"],
  ["gift", "Tặng quà · 200 nghìn"],
  ["support", "Xin hỗ trợ"],
  ["apologize", "Xin lỗi"],
  ["argue", "Tranh cãi"],
];
export function Relations({
  s,
  dispatch,
  busy,
}: {
  s: GameState;
  dispatch: (a: Action) => void;
  busy: boolean;
}) {
  const [mode, setMode] = useState("living"),
    [selected, setSelected] = useState<string | null>(null),
    [heir, setHeir] = useState("");
  const list = s.relations.filter(
    (r) => mode === "all" || (mode === "living" ? r.alive : !r.alive),
  );
  const person = s.relations.find((r) => r.id === selected);
  const profile =
    person?.role === "friend" && s.flags.includes("apk_mode")
      ? npcProfile(person)
      : undefined;
  const active = s.phase === "ready" && !s.prisonYears && s.time > 0;
  function act(
    r: Relation,
    action: Extract<Action, { type: "relation" }>["action"],
  ) {
    if (
      ["breakup", "divorce"].includes(action) &&
      !confirm(
        "Kết thúc quan hệ tình cảm với " +
          r.name +
          "? Tài sản đứng tên riêng được giữ.",
      )
    )
      return;
    dispatch({ type: "relation", id: r.id, action });
  }
  return (
    <section className="screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">KHÔNG AI CHỈ LỚN LÊN MỘT MÌNH</p>
          <h2>{ui.relationships}</h2>
          <p className="muted">
            Gia đình, bạn bè và những người làm câu chuyện khác đi.
          </p>
        </div>
      </div>
      <div className="toolbar">
        <div className="segmented">
          {[
            ["living", "Đang trong đời"],
            ["remembered", "Ký ức"],
            ["all", "Tất cả"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={mode === id}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="people-list">
        {list.map((r) => (
          <button
            className={"person-card " + (selected === r.id ? "selected" : "")}
            key={r.id}
            onClick={() => setSelected(selected === r.id ? null : r.id)}
          >
            <Avatar
              small
              age={r.age}
              happiness={r.closeness}
              gender={r.gender}
            />
            <span>
              <strong>{r.name}</strong>
              <small>
                {r.role === "friend" &&
                s.flags.includes("apk_mode") &&
                npcProfile(r).enemy
                  ? "Thù địch"
                  : ROLE_LABELS[r.role]}{" "}
                · {r.age} tuổi · {r.alive ? r.trait : "Được nhớ"}
              </small>
              <progress
                value={r.closeness}
                max={100}
                aria-label={ui.relationshipLevel}
              />
            </span>
            <span className="person-bond">
              {r.closeness}
              <small>/100</small>
            </span>
          </button>
        ))}
      </div>
      {!list.length && <p className="empty">{ui.emptyRelations}</p>}
      {person && (
        <div className="feature-panel relationship-detail">
          <span className="tag">{ROLE_LABELS[person.role]}</span>
          <h3>{person.name}</h3>
          {!person.alive ? (
            <p>Những kỷ niệm còn trong nhật ký. Người này đã qua đời.</p>
          ) : (
            <>
              <p>
                Gắn bó {person.closeness}/100 · {person.trait}
              </p>
              {profile && (
                <div>
                  <p>
                    Tính bốc đồng {profile.craziness}/100 ·{" "}
                    {profile.student ? "Đang học" : "Không đang học"} ·{" "}
                    {profile.employed ? "Có việc làm" : "Không có việc làm"}
                  </p>
                  <p>
                    {profile.married ? "Đã kết hôn" : "Chưa kết hôn"} ·{" "}
                    {profile.children} người con ·{" "}
                    {profile.enemy ? "Đang thù địch" : "Bạn bè"}
                  </p>
                  <button
                    className="button small subtle"
                    disabled={
                      busy ||
                      !active ||
                      s.age < 6 ||
                      (profile.enemy && person.closeness < 40)
                    }
                    onClick={() =>
                      dispatch({
                        type: "friendship",
                        id: person.id,
                        action: profile.enemy ? "reconcile" : "declareEnemy",
                      })
                    }
                  >
                    {profile.enemy
                      ? "Làm hòa · gắn bó 40+"
                      : "Tuyên bố thù địch"}
                  </button>
                </div>
              )}
              <div className="button-row">
                {buttons.map(([action, label]) => (
                  <button
                    className="button small subtle"
                    key={action}
                    disabled={
                      busy ||
                      !active ||
                      (action === "gift" && s.money < 200000) ||
                      (action === "support" && !!profile?.enemy)
                    }
                    onClick={() => act(person, action)}
                  >
                    {label}
                  </button>
                ))}
                {person.role === "friend" &&
                  person.age >= 18 &&
                  s.age >= 18 && (
                    <button
                      className="button small"
                      disabled={
                        busy ||
                        !active ||
                        !!profile?.enemy ||
                        !!profile?.married ||
                        s.relations.some(
                          (r) =>
                            r.alive && ["lover", "spouse"].includes(r.role),
                        )
                      }
                      onClick={() => act(person, "date")}
                    >
                      Hẹn hò
                    </button>
                  )}
                {person.role === "lover" && (
                  <>
                    <button
                      className="button small"
                      disabled={busy || !active || person.closeness < 65}
                      onClick={() => act(person, "propose")}
                    >
                      Cầu hôn · gắn bó 65+
                    </button>
                    <button
                      className="button small subtle"
                      disabled={busy || !active}
                      onClick={() => act(person, "breakup")}
                    >
                      Chia tay
                    </button>
                  </>
                )}
                {person.role === "spouse" && (
                  <>
                    <button
                      className="button small"
                      disabled={busy || !active || s.money < 1000000}
                      onClick={() => act(person, "baby")}
                    >
                      Kế hoạch có con · 1 triệu
                    </button>
                    <button
                      className="button small subtle"
                      disabled={busy || !active}
                      onClick={() => act(person, "divorce")}
                    >
                      Ly hôn
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}
      {s.age >= 18 && s.phase !== "dead" && (
        <details className="part-time">
          <summary>{ui.will} & nhận nuôi</summary>
          <p>{ui.willHint}</p>
          <div className="toolbar">
            <select
              aria-label="Người nhận di chúc"
              value={heir}
              onChange={(e) => setHeir(e.target.value)}
            >
              <option value="">{ui.choose}</option>
              {s.relations
                .filter((r) => r.alive)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} · {ROLE_LABELS[r.role]}
                  </option>
                ))}
            </select>
            <button
              className="button"
              disabled={busy || !active || !heir}
              onClick={() =>
                dispatch({ type: "will", shares: { [heir]: 100 } })
              }
            >
              {ui.setWill}
            </button>
            <button
              className="button subtle"
              disabled={
                busy ||
                !active ||
                s.money < 1000000 ||
                !s.relations.some((r) => r.alive)
              }
              onClick={() =>
                dispatch({
                  type: "relation",
                  id: s.relations.find((r) => r.alive)!.id,
                  action: "adoptChild",
                })
              }
            >
              Nhận nuôi · 1 triệu
            </button>
          </div>
        </details>
      )}
    </section>
  );
}
