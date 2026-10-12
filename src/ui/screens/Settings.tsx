import { useState } from "react";
import type { Preferences } from "../storage";
import ui from "../../i18n/vi.json" with { type: "json" };
export function Settings({
  preferences,
  onSave,
  onClear,
  busy,
  offlineReady,
  needRefresh,
  onUpdate,
}: {
  preferences: Preferences;
  onSave: (p: Preferences) => void;
  onClear: () => void;
  busy: boolean;
  offlineReady: boolean;
  needRefresh: boolean;
  onUpdate: () => void;
}) {
  const [draft, setDraft] = useState(preferences),
    [persisted, setPersisted] = useState<string>("");
  return (
    <section className="screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CHƠI THEO NHỊP CỦA BẠN</p>
          <h2>{ui.settings}</h2>
        </div>
        <span className="tag">v1.0.0</span>
      </div>
      <div className="settings-grid">
        <form
          className="feature-panel"
          onSubmit={(e) => {
            e.preventDefault();
            onSave(draft);
          }}
        >
          <h3>Hiển thị và âm thanh</h3>
          <label>
            {ui.theme}
            <select
              value={draft.theme}
              onChange={(e) =>
                setDraft((p) => ({
                  ...p,
                  theme: e.target.value as Preferences["theme"],
                }))
              }
            >
              <option value="light">{ui.light}</option>
              <option value="dark">{ui.dark}</option>
            </select>
          </label>
          <label>
            {ui.textSize} · {draft.textSize}px
            <input
              type="range"
              min={14}
              max={22}
              step={1}
              value={draft.textSize}
              onChange={(e) =>
                setDraft((p) => ({ ...p, textSize: Number(e.target.value) }))
              }
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={draft.reducedMotion}
              onChange={(e) =>
                setDraft((p) => ({ ...p, reducedMotion: e.target.checked }))
              }
            />
            {ui.reduceMotion}
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={draft.sound}
              onChange={(e) =>
                setDraft((p) => ({ ...p, sound: e.target.checked }))
              }
            />
            {ui.sound}
          </label>
          <button className="button" disabled={busy}>
            {ui.savePreferences}
          </button>
        </form>
        <section className="feature-panel">
          <h3>Offline & bản sao</h3>
          <span className="pill">
            {offlineReady ? ui.offlineReady : ui.offlinePreparing}
          </span>
          <p>{ui.offlineHint}</p>
          <p>{ui.backupHint}</p>
          {needRefresh && (
            <button className="button" disabled={busy} onClick={onUpdate}>
              {ui.update}
            </button>
          )}
          <button
            className="button subtle"
            onClick={async () => {
              try {
                const granted = await navigator.storage?.persist?.();
                setPersisted(
                  granted
                    ? "Trình duyệt đang ưu tiên giữ dữ liệu. Bản sao file vẫn cần thiết."
                    : "Trình duyệt chưa ưu tiên lưu lâu dài. Hãy xuất file định kỳ.",
                );
              } catch {
                setPersisted(
                  "Không kiểm tra được lưu trữ. Hãy giữ bản sao file.",
                );
              }
            }}
          >
            Ưu tiên giữ dữ liệu
          </button>
          {persisted && <p role="status">{persisted}</p>}
        </section>
      </div>
      <section className="feature-panel">
        <h3>Về bản web này</h3>
        <p>{ui.contentNote}</p>
        <p>
          150 sự kiện đời thường, 144 sự kiện nghề, 48 nghề, 108 hoạt động, 24
          tài sản, 40 thành tích và 5 truyện. Tất cả dùng nội dung tự viết và
          hình SVG tự tạo.
        </p>
        <a
          className="text-link"
          href="https://github.com/5erax/newlife-web"
          target="_blank"
          rel="noreferrer"
        >
          {ui.supportProject} ↗
        </a>
      </section>
      <div className="danger-zone">
        <h3>{ui.deleteAll}</h3>
        <p className="muted">
          Dọn cache để cập nhật không cần xoá các cuộc đời. Nút này xoá cả ô
          lưu, thành tích và cài đặt.
        </p>
        <button
          className="button danger"
          disabled={busy}
          onClick={() => {
            if (confirm(ui.confirmClear)) onClear();
          }}
        >
          {ui.deleteAll}
        </button>
      </div>
    </section>
  );
}
