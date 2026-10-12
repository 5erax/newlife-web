import { useState } from "react";
import type { NewLifeOptions } from "../../engine/types";
import type { Slot } from "../storage";
import names from "../../content/names.json" with { type: "json" };
import ui from "../../i18n/vi.json" with { type: "json" };
import { Avatar } from "../components/Avatar";
export function Start({
  slots,
  onCreate,
  onLoad,
  busy,
}: {
  slots: Slot[];
  onCreate: (options: NewLifeOptions) => void;
  onLoad: (id: string) => void;
  busy: boolean;
}) {
  const [name, setName] = useState("Minh An"),
    [gender, setGender] = useState<"male" | "female" | "other">("other"),
    [hometown, setHometown] = useState("Đà Nẵng"),
    [birthDate, setBirthDate] = useState("2000-06-15");
  function randomize() {
    const ints = crypto.getRandomValues(new Uint32Array(4));
    setGender(ints[0] % 2 ? "female" : "male");
    const list = ints[0] % 2 ? names.female : names.male;
    setName(
      `${names.surnames[ints[1] % names.surnames.length]} ${list[ints[2] % list.length]}`,
    );
    setHometown(names.hometowns[ints[3] % names.hometowns.length]);
  }
  return (
    <main className="start-page">
      <header className="start-brand">
        <span className="brand-mark">
          N<span>✦</span>
        </span>
        <div>
          <h1>{ui.brand}</h1>
          <p>{ui.tagline}</p>
        </div>
        <span className="pill">{ui.localNote}</span>
      </header>
      <div className="start-layout">
        <section className="start-intro">
          <p className="eyebrow">MỘT TRANG GIẤY MỚI</p>
          <h2>{ui.firstLifeTitle}</h2>
          <p className="intro-copy">{ui.firstLifeText}</p>
          <div className="illustrated-life">
            <Avatar age={0} />
            <span className="dotted-line" />
            <Avatar age={22} gender={gender} />
            <span className="dotted-line" />
            <Avatar age={72} gender={gender} />
          </div>
          <div className="life-note">
            <span>✦</span>
            <p>
              Không có đáp án cho một cuộc đời hoàn hảo.
              <br />
              Có những câu chuyện đáng sống lại.
            </p>
          </div>
          {slots.length > 0 && (
            <section className="recent-lives">
              <h3>{ui.recentLives}</h3>
              {slots.slice(0, 3).map((slot) => (
                <button
                  className="recent-life"
                  key={slot.id}
                  onClick={() => onLoad(slot.id)}
                  disabled={busy}
                >
                  <Avatar small age={slot.game.age} gender={slot.game.gender} />
                  <span>
                    <strong>{slot.game.name}</strong>
                    <small>
                      {slot.game.age} {ui.years} · {slot.label}
                    </small>
                  </span>
                  <span className="arrow">↗</span>
                </button>
              ))}
            </section>
          )}
        </section>
        <section className="create-card">
          <span className="small-number">01 / BẮT ĐẦU</span>
          <h2>{ui.createOwn}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onCreate({
                name,
                gender,
                hometown,
                birthDate,
                seed: crypto.getRandomValues(new Uint32Array(1))[0],
              });
            }}
          >
            <label>
              {ui.name}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                autoComplete="off"
              />
            </label>
            <div className="form-row">
              <label>
                {ui.gender}
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as typeof gender)}
                >
                  <option value="other">{ui.other}</option>
                  <option value="female">{ui.female}</option>
                  <option value="male">{ui.male}</option>
                </select>
              </label>
              <label>
                {ui.birthDate}
                <input
                  type="date"
                  value={birthDate}
                  min="1900-01-01"
                  max="2100-12-31"
                  required
                  onChange={(e) => setBirthDate(e.target.value)}
                />
              </label>
            </div>
            <label>
              {ui.hometown}
              <input
                value={hometown}
                list="hometowns"
                onChange={(e) => setHometown(e.target.value)}
                required
                maxLength={100}
              />
              <datalist id="hometowns">
                {names.hometownCatalog.map((n) => (
                  <option key={n.id} value={n.name} />
                ))}
              </datalist>
            </label>
            <button
              type="button"
              className="button subtle"
              onClick={randomize}
              disabled={busy}
            >
              ↻ {ui.randomCharacter}
            </button>
            <button className="button primary full" disabled={busy}>
              {busy ? ui.saving : ui.startLife}
              <span>→</span>
            </button>
          </form>
          <p className="muted fine">{ui.backupHint}</p>
        </section>
      </div>
      <footer className="start-footer">
        <span>NewLife Web · 1.0.0</span>
        <span>Những cuộc đời nhỏ, những lựa chọn lớn.</span>
      </footer>
    </main>
  );
}
