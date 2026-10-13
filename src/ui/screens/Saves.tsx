import { useState, useRef } from "react";
import type { GameState } from "../../engine/types";
import type { Slot } from "../storage";
import { download, exportRawSlot } from "../storage";
import { parseSave, serialize } from "../../engine/save";
import ui from "../../i18n/vi.json" with { type: "json" };
import { cash } from "../format";
import { Modal } from "../components/Modal";
interface Props {
  s: GameState;
  slots: Slot[];
  currentId: string | null;
  busy: boolean;
  onLoad: (id: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, label: string) => void;
  onRestore: (id: string) => void;
  onImport: (s: GameState, label: string) => void;
  onError: (message: string) => void;
}
export function Saves({
  s,
  slots,
  currentId,
  busy,
  onLoad,
  onRemove,
  onRename,
  onRestore,
  onImport,
  onError,
}: Props) {
  const file = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<GameState | null>(null),
    [label, setLabel] = useState("");
  async function openFile(selected: File) {
    try {
      if (selected.size > 10_000_000) throw Error("File vượt giới hạn 10 MB.");
      const game = parseSave(await selected.text());
      setPreview(game);
      setLabel(game.name + " · nhập");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Không đọc được file.");
    } finally {
      if (file.current) file.current.value = "";
    }
  }
  return (
    <section className="screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">GIỮ LẠI CÂU CHUYỆN</p>
          <h2>{ui.saves}</h2>
          <p className="muted">{ui.backupHint}</p>
        </div>
      </div>
      <div className="feature-panel">
        <h3>Bản đang mở · {s.name}</h3>
        <p>
          {s.age} tuổi · {cash(s.money, false, s.origin)} ·{" "}
          {s.phase === "dead"
            ? "Đã kết thúc"
            : s.pending
              ? "Có lựa chọn đang chờ"
              : "Sẵn sàng tiếp tục"}
        </p>
        <div className="button-row">
          <button
            className="button"
            onClick={() => {
              try {
                download(serialize(s), `newlife-${s.id}-tuoi-${s.age}.json`);
              } catch (e) {
                onError(String(e));
              }
            }}
          >
            {ui.export}
          </button>
          <button
            className="button subtle"
            disabled={busy}
            onClick={() => file.current?.click()}
          >
            {ui.import}
          </button>
        </div>
        <input
          ref={file}
          hidden
          type="file"
          accept=".json,application/json"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) void openFile(selected);
          }}
        />
      </div>
      <h3 className="subheading">
        {ui.savedLives} ({slots.length})
      </h3>
      <div className="save-list">
        {slots.map((slot) => (
          <article
            className={"save-card " + (slot.id === currentId ? "current" : "")}
            key={slot.id}
          >
            <div>
              <span className="tag">
                {slot.id === currentId ? "Đang mở" : "Đã lưu"}
              </span>
              <h3>{slot.label}</h3>
              <p>
                {slot.game.name} · {slot.game.age} tuổi ·{" "}
                {cash(slot.game.money, false, slot.game.origin)}
              </p>
              <small>{new Date(slot.updatedAt).toLocaleString("vi-VN")}</small>
            </div>
            <div className="button-row">
              <button
                className="button small subtle"
                disabled={busy}
                onClick={() =>
                  void exportRawSlot(slot.id)
                    .then((text) =>
                      download(text, `newlife-raw-${slot.id}.json`),
                    )
                    .catch((e) =>
                      onError(e instanceof Error ? e.message : String(e)),
                    )
                }
              >
                Xuất dữ liệu gốc
              </button>
              <button
                className="button small"
                disabled={busy}
                onClick={() => onLoad(slot.id)}
              >
                {ui.continue}
              </button>
              <button
                className="button small subtle"
                onClick={() =>
                  download(serialize(slot.game), `newlife-${slot.game.id}.json`)
                }
              >
                {ui.export}
              </button>
              <button
                className="button small subtle"
                disabled={busy}
                onClick={() => {
                  const next = prompt(ui.newSlotLabel, slot.label);
                  if (next?.trim()) onRename(slot.id, next);
                }}
              >
                {ui.rename}
              </button>
              <button
                className="button small subtle"
                disabled={busy || !slot.previous}
                onClick={() => {
                  if (
                    confirm(
                      "Phục hồi ô này về bản trước? Bản đang có sẽ trở thành bản dự phòng.",
                    )
                  )
                    onRestore(slot.id);
                }}
              >
                {ui.restore}
              </button>
              <button
                className="button small danger"
                disabled={busy}
                onClick={() => {
                  if (confirm(ui.confirmDelete)) onRemove(slot.id);
                }}
              >
                {ui.delete}
              </button>
            </div>
          </article>
        ))}
      </div>
      {!slots.length && <p className="empty">{ui.noSaves}</p>}
      <p className="fine muted">{ui.restoreHint}</p>
      {preview && (
        <Modal title={ui.importPreview} onClose={() => setPreview(null)}>
          <p>
            <strong>{preview.name}</strong> · {preview.age} tuổi ·{" "}
            {cash(preview.money, false, preview.origin)}
          </p>
          <p className="muted">
            Ô đang có sẽ được giữ nguyên. Bản nhập tạo một ô riêng.
          </p>
          <label>
            {ui.newSlotLabel}
            <input
              value={label}
              maxLength={100}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>
          <button
            className="button primary full"
            disabled={busy || !label.trim()}
            onClick={() => {
              onImport(preview, label);
              setPreview(null);
            }}
          >
            {ui.importNewSlot}
          </button>
        </Modal>
      )}
    </section>
  );
}
