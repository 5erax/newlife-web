import type { Action, GameState } from "../../engine/types";
import { Modal } from "./Modal";
import { Avatar } from "./Avatar";
export function LoveDialog({
  s,
  dispatch,
  busy,
}: {
  s: GameState;
  dispatch: (a: Action) => void;
  busy: boolean;
}) {
  const offer = s.loveOffer!;
  return (
    <Modal mandatory title="Một lời mời gặp mặt">
      <p>
        Tất cả nhân vật dưới đây đều trưởng thành. Bạn có thể từ chối; cuộc gặp
        chỉ diễn ra khi mọi người cùng đồng ý.
      </p>
      <div className="people-list">
        {offer.people.map((person, i) => (
          <article className="person-card" key={person.id}>
            <Avatar small age={person.age} gender={person.gender} />
            <div>
              <strong>{person.name}</strong>
              <p>
                {person.age} tuổi · {person.trait}
              </p>
              <small>
                {offer.consent[i]
                  ? "Đồng ý tìm hiểu và gặp mặt"
                  : "Chưa muốn tiếp tục cuộc gặp"}
              </small>
            </div>
          </article>
        ))}
      </div>
      <div className="button-row">
        <button
          className="button primary"
          disabled={busy || !offer.consent.every(Boolean)}
          onClick={() =>
            dispatch({ type: "loveResolve", id: offer.id, accept: true })
          }
        >
          {["hookup", "threesome"].includes(offer.mode)
            ? "Đồng ý cuộc gặp riêng tư"
            : "Bắt đầu hẹn hò"}
        </button>
        <button
          className="button subtle"
          disabled={busy}
          onClick={() =>
            dispatch({ type: "loveResolve", id: offer.id, accept: false })
          }
        >
          Từ chối
        </button>
      </div>
    </Modal>
  );
}
