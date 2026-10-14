import { useEffect } from "react";
import type { Action, GameState } from "../../engine/types";
import { interviewView } from "../../engine/interviews";
import { Modal } from "./Modal";
import { cash } from "../format";
import { localPrice } from "../../engine/world";
export function InterviewDialog({
  s,
  dispatch,
  busy,
}: {
  s: GameState;
  dispatch: (a: Action) => void;
  busy: boolean;
}) {
  const offer = s.jobInterview!,
    view = interviewView(s);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (busy || (e.target as HTMLElement).closest("input,textarea,select"))
        return;
      const answer = view.answers[Number(e.key) - 1];
      if (answer) {
        e.preventDefault();
        dispatch({
          type: "interviewAnswer",
          id: offer.id,
          answerId: answer.id,
        });
      }
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [busy, dispatch, offer.id, view.answers]);
  return (
    <Modal mandatory title="Phỏng vấn xin việc">
      <p className="tag">Bộ Việt hóa từ APK</p>
      <p>
        {view.job.name} · {cash(localPrice(s, view.job.ranks[0].salary))}/năm
      </p>
      <p className="event-text">{view.question}</p>
      <p className="muted">{view.cta}</p>
      <div className="choice-list">
        {view.answers.map((answer, i) => (
          <button
            className="choice"
            key={answer.id}
            disabled={busy}
            onClick={() =>
              dispatch({
                type: "interviewAnswer",
                id: offer.id,
                answerId: answer.id,
              })
            }
          >
            <span className="choice-number">{i + 1}</span>
            <span>{answer.label}</span>
            <span>→</span>
          </button>
        ))}
      </div>
      <button
        className="button subtle"
        disabled={busy}
        onClick={() =>
          dispatch({ type: "interviewAnswer", id: offer.id, answerId: null })
        }
      >
        Rút hồ sơ ứng tuyển
      </button>
      <p className="fine muted">
        Phím số để chọn. Công việc hiện tại được giữ đến khi bạn trúng tuyển.
      </p>
    </Modal>
  );
}
