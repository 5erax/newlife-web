import { useEffect } from "react";
import type { Action, GameState } from "../../engine/types";
import { eligible } from "../../engine/conditions";
import ui from "../../i18n/vi.json" with { type: "json" };
import { Modal } from "./Modal";
import { pendingChoices, pendingText } from "../../engine/branches";
import { apkPresentation } from "../../engine/apk";
export function EventDialog({
  s,
  dispatch,
  busy,
}: {
  s: GameState;
  dispatch: (a: Action) => void;
  busy: boolean;
}) {
  const pending = s.pending!;
  const view =
    pending.event.sourceKind === "apk_translation" ? apkPresentation(s) : null;
  const choices = view?.choices ?? pendingChoices(pending);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (busy || (e.target as HTMLElement).closest("input,textarea,select"))
        return;
      const index = Number(e.key) - 1;
      const choice = choices[index];
      if (choice && eligible(s, choice.conditions)) {
        e.preventDefault();
        dispatch({
          type: "choose",
          instanceId: pending.instanceId,
          optionId: choice.id,
        });
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [s, busy, dispatch, pending, choices]);
  return (
    <Modal mandatory title={ui.chooseToContinue}>
      <p className="event-age">TUỔI {s.age} · MỘT NGÃ RẼ</p>
      {view && <p className="tag">Bộ Việt hóa từ APK</p>}
      <p className="event-text">{view?.text ?? pendingText(pending)}</p>
      <div className="choice-list">
        {choices.map((choice, i) => {
          const allowed = eligible(s, choice.conditions);
          return (
            <button
              className="choice"
              key={choice.id}
              autoFocus={i === 0}
              disabled={busy || !allowed}
              onClick={() =>
                dispatch({
                  type: "choose",
                  instanceId: pending.instanceId,
                  optionId: choice.id,
                })
              }
            >
              <span className="choice-number">{i + 1}</span>
              <span>
                {choice.label}
                {!allowed && <small>{ui.locked}</small>}
              </span>
              <span>→</span>
            </button>
          );
        })}
      </div>
      <p className="fine muted">
        Lựa chọn sẽ được ghi lại và tự lưu. Phím số để chọn.
      </p>
    </Modal>
  );
}
