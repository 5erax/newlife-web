import { useCallback, useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import type { Action, GameState, NewLifeOptions } from "../engine/types";
import { StatBars, ThisYear } from "./components/StatChanges";
import { newLife, reduce } from "../engine/game";
import { serialize } from "../engine/save";
import { netWorth } from "../engine/helpers";
import { jobById } from "../content/catalog";
import { originById, FAMILY_LABELS } from "../engine/world";
import ui from "../i18n/vi.json" with { type: "json" };
import { cash as displayCash, ageLabel } from "./format";
import { Avatar } from "./components/Avatar";
import { EventDialog } from "./components/EventDialog";
import { LoveDialog } from "./components/LoveDialog";
import { Start } from "./screens/Start";
import { Journal } from "./screens/Journal";
import { Education } from "./screens/Education";
import { Work } from "./screens/Work";
import { Activities } from "./screens/Activities";
import { Assets } from "./screens/Assets";
import { Relations } from "./screens/Relations";
import { Stories } from "./screens/Stories";
import { Rewards } from "./screens/Rewards";
import { Saves } from "./screens/Saves";
import { Settings } from "./screens/Settings";
import { End } from "./screens/End";
import {
  clearData,
  defaultPreferences,
  download,
  getPreferences,
  getProfile,
  listSlots,
  loadSlot,
  mergeProfile,
  removeSlot,
  renameSlot,
  restorePrevious,
  saveSlot,
  setPreferences,
  StaleSlotError,
  type Preferences,
  type Slot,
} from "./storage";
const navigation = [
  ["journal", "◎", ui.journal],
  ["education", "▤", ui.education],
  ["work", "◇", ui.work],
  ["activities", "✦", ui.activities],
  ["assets", "⌂", ui.assets],
  ["relationships", "♡", ui.relationships],
  ["stories", "◷", ui.stories],
  ["achievements", "⚑", ui.achievements],
  ["saves", "▣", ui.saves],
  ["settings", "⚙", ui.settings],
] as const;
type Tab = (typeof navigation)[number][0];
const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
export default function App() {
  const [game, setGame] = useState<GameState | null>(null),
    [slots, setSlots] = useState<Slot[]>([]),
    [tab, setTab] = useState<Tab>("journal"),
    [creating, setCreating] = useState(false),
    [offlinePrepared, setOfflinePrepared] = useState(false),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState(""),
    [unsaved, setUnsaved] = useState(false),
    [readOnly, setReadOnly] = useState(false),
    [preferences, setPrefs] = useState(defaultPreferences);
  const gameRef = useRef<GameState | null>(null),
    slotId = useRef<string | null>(null),
    storageRevision = useRef<number | null>(null),
    label = useRef(""),
    lock = useRef(false),
    audio = useRef<AudioContext | null>(null);
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError() {
      setNotice(
        "Chưa chuẩn bị được offline. Bạn vẫn có thể chơi và xuất file khi đang online.",
      );
    },
  });
  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      void navigator.serviceWorker.ready.then((reg) => {
        if (reg.active) setOfflinePrepared(true);
      });
    }
  }, []);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (unsaved) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);
  const installSlot = useCallback((slot: Slot) => {
    slotId.current = slot.id;
    storageRevision.current = slot.storageRevision;
    label.current = slot.label;
    gameRef.current = slot.game;
    setGame(slot.game);
    setUnsaved(false);
    setReadOnly(false);
    setCreating(false);
  }, []);
  const refresh = useCallback(async () => setSlots(await listSlots()), []);
  const load = useCallback(
    async (id: string) => {
      if (lock.current) return;
      if (
        unsaved &&
        !confirm("Có tiến trình chưa lưu. Bạn đã xuất file và muốn mở ô khác?")
      )
        return;
      lock.current = true;
      setBusy(true);
      try {
        installSlot(await loadSlot(id));
        setTab("journal");
        setNotice("Đã mở đúng bản lưu gần nhất.");
      } catch (e) {
        setNotice(message(e));
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [installSlot, unsaved],
  );
  useEffect(() => {
    let disposed = false;
    void (async () => {
      try {
        const [all, prefs] = await Promise.all([listSlots(), getPreferences()]);
        if (disposed) return;
        setSlots(all);
        setPrefs(prefs);
        if (all[0]) installSlot(await loadSlot(all[0].id));
      } catch (e) {
        if (!disposed) setNotice("Không mở được lưu trữ: " + message(e));
      } finally {
        if (!disposed) setLoading(false);
      }
    })();
    return () => {
      disposed = true;
    };
  }, [installSlot]);
  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.dataset.motion = preferences.reducedMotion
      ? "reduce"
      : "normal";
    document.documentElement.style.setProperty(
      "--base-size",
      preferences.textSize + "px",
    );
  }, [preferences]);
  const dispatch = useCallback(
    async (a: Action) => {
      if (lock.current || readOnly || !gameRef.current) return;
      lock.current = true;
      setBusy(true);
      setNotice("");
      try {
        const next = reduce(gameRef.current, a);
        gameRef.current = next;
        setGame(next);
        if (a.type === "continueChild") setTab("journal");
        if (preferences.sound && a.type === "choose") {
          try {
            audio.current ??= new AudioContext();
            void audio.current.resume();
            const oscillator = audio.current.createOscillator(),
              gain = audio.current.createGain();
            gain.gain.value = 0.04;
            oscillator.frequency.value = 600;
            oscillator.connect(gain);
            gain.connect(audio.current.destination);
            oscillator.start();
            gain.gain.exponentialRampToValueAtTime(
              0.001,
              audio.current.currentTime + 0.12,
            );
            oscillator.stop(audio.current.currentTime + 0.12);
          } catch {
            audio.current = null;
          }
        }
        try {
          const saved = await saveSlot(
            slotId.current!,
            label.current,
            next,
            storageRevision.current,
          );
          storageRevision.current = saved.storageRevision;
          gameRef.current = saved.game;
          setGame(saved.game);
          setUnsaved(false);
          await refresh();
        } catch (e) {
          setUnsaved(true);
          if (e instanceof StaleSlotError) setReadOnly(true);
          setNotice(ui.notSaved + ": " + message(e));
        }
      } catch (e) {
        setNotice(message(e));
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [preferences.sound, readOnly, refresh],
  );
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest("input,textarea,select,button,dialog")
      )
        return;
      if (
        e.key === "Enter" &&
        gameRef.current?.phase === "ready" &&
        !gameRef.current.casino.hand &&
        !gameRef.current.loveOffer &&
        !creating
      ) {
        e.preventDefault();
        void dispatch({ type: "age" });
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [dispatch, creating]);
  async function create(options: NewLifeOptions) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const profile = await getProfile();
      const next = newLife(
        { ...options, id: "life_" + crypto.randomUUID().replaceAll("-", "") },
        profile,
      );
      const id = crypto.randomUUID();
      const saved = await saveSlot(id, next.name, next, null);
      installSlot(saved);
      setTab("journal");
      await refresh();
      setNotice("Cuộc đời mới đã được tạo trong một ô riêng.");
    } catch (e) {
      setNotice(message(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function slotOperation(operation: () => Promise<unknown>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await operation();
      await refresh();
    } catch (e) {
      setNotice(message(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function imported(next: GameState, name: string) {
    await slotOperation(async () => {
      const profile = await getProfile();
      next.profile = mergeProfile(profile, next.profile);
      const saved = await saveSlot(crypto.randomUUID(), name, next, null);
      installSlot(saved);
      setTab("journal");
      setNotice("Đã nhập vào ô mới; các ô trước vẫn được giữ.");
    });
  }
  async function savePrefs(p: Preferences) {
    await slotOperation(async () => {
      await setPreferences(p);
      setPrefs(p);
      setNotice("Đã lưu cài đặt.");
    });
  }
  const cash = (value: number, full = false) =>
    displayCash(value, full, game?.origin);
  const shared = game
    ? {
        s: game,
        dispatch: (a: Action) => void dispatch(a),
        busy: busy || readOnly,
      }
    : null;
  let content;
  if (game && shared) {
    switch (tab) {
      case "journal":
        content =
          game.phase === "dead" ? (
            <End {...shared} onNew={() => setCreating(true)} />
          ) : (
            <Journal s={game} />
          );
        break;
      case "education":
        content = <Education {...shared} />;
        break;
      case "work":
        content = <Work {...shared} />;
        break;
      case "activities":
        content = <Activities {...shared} />;
        break;
      case "assets":
        content = <Assets {...shared} />;
        break;
      case "relationships":
        content = <Relations {...shared} />;
        break;
      case "stories":
        content = <Stories {...shared} />;
        break;
      case "achievements":
        content = <Rewards s={game} />;
        break;
      case "saves":
        content = (
          <Saves
            {...shared}
            slots={slots}
            currentId={slotId.current}
            onLoad={(id) => void load(id)}
            onError={setNotice}
            onImport={(next, name) => void imported(next, name)}
            onRemove={(id) =>
              void slotOperation(async () => {
                await removeSlot(id);
                if (id === slotId.current) {
                  gameRef.current = null;
                  setGame(null);
                  slotId.current = null;
                  storageRevision.current = null;
                }
              })
            }
            onRename={(id, name) =>
              void slotOperation(async () => {
                const current = await loadSlot(id);
                const renamed =
                  id === slotId.current && gameRef.current
                    ? await saveSlot(
                        id,
                        name,
                        gameRef.current,
                        storageRevision.current,
                      )
                    : await renameSlot(id, name, current.storageRevision);
                if (id === slotId.current) installSlot(renamed);
              })
            }
            onRestore={(id) =>
              void slotOperation(async () => {
                const current = await loadSlot(id);
                installSlot(await restorePrevious(id, current.storageRevision));
                setTab("journal");
              })
            }
          />
        );
        break;
      case "settings":
        content = (
          <Settings
            preferences={preferences}
            onSave={(p) => void savePrefs(p)}
            busy={busy}
            offlineReady={offlineReady || offlinePrepared}
            needRefresh={needRefresh}
            onUpdate={() => {
              if (
                game.pending ||
                game.loveOffer ||
                game.casino.hand ||
                busy ||
                unsaved
              ) {
                setNotice(
                  "Hãy chọn xong sự kiện và lưu thành công hoặc xuất bản chưa lưu trước khi cập nhật.",
                );
                return;
              }
              void updateServiceWorker(true);
            }}
            onClear={() =>
              void slotOperation(async () => {
                await clearData();
                gameRef.current = null;
                slotId.current = null;
                storageRevision.current = null;
                setGame(null);
                setPrefs(defaultPreferences);
                setNotice("Đã xoá dữ liệu trên trình duyệt này.");
              })
            }
          />
        );
    }
  }
  if (loading)
    return (
      <main className="loading-screen">
        <span className="brand-mark">
          N<span>✦</span>
        </span>
        <p>{ui.loading}</p>
      </main>
    );
  return (
    <>
      {!game || creating ? (
        <>
          <Start
            slots={slots}
            onCreate={(o) => void create(o)}
            onLoad={(id) => void load(id)}
            busy={busy}
          />
          {game && creating && (
            <button
              className="cancel-create button subtle"
              onClick={() => setCreating(false)}
            >
              ← Quay về cuộc đời đang chơi
            </button>
          )}
        </>
      ) : (
        <div className="game-shell">
          <header className="app-header">
            <button
              className="brand"
              onClick={() => setTab("journal")}
              aria-label="NewLife · về nhật ký"
            >
              <span className="brand-mark">
                N<span>✦</span>
              </span>
              <span>
                <strong>{ui.brand}</strong>
                <small>{ui.tagline}</small>
              </span>
            </button>
            <div className="header-status">
              <span
                className={"save-status " + (unsaved ? "warning" : "")}
                role="status"
              >
                {busy ? ui.saving : unsaved ? ui.notSaved : ui.saved}
              </span>
              <button
                className="button small subtle"
                disabled={busy}
                onClick={() => setCreating(true)}
              >
                ＋ {ui.newLife}
              </button>
            </div>
          </header>
          <div className="game-grid">
            <nav className="side-nav" aria-label="Các phần cuộc đời">
              {navigation.map(([id, icon, text]) => (
                <button
                  key={id}
                  className={tab === id ? "active" : ""}
                  aria-current={tab === id ? "page" : undefined}
                  onClick={() => setTab(id)}
                >
                  <span>{icon}</span>
                  <span>{text}</span>
                </button>
              ))}
              <div className="nav-foot">
                <span>✦</span>
                <p>
                  {offlineReady || offlinePrepared
                    ? ui.offlineReady
                    : ui.localNote}
                </p>
                <small>v1.1.0</small>
              </div>
            </nav>
            <main className="game-main">
              <div className="mobile-stats">
                <StatBars s={game} />
                <ThisYear s={game} />
              </div>
              {readOnly && (
                <div className="banner">
                  <strong>{ui.readOnly}</strong>
                  <p>{ui.memoryHint}</p>
                  <button
                    className="button small"
                    onClick={() => void load(slotId.current!)}
                  >
                    {ui.reloadSave}
                  </button>
                  <button
                    className="button small subtle"
                    onClick={() =>
                      download(
                        serialize(game),
                        `newlife-unsaved-${game.id}.json`,
                      )
                    }
                  >
                    {ui.export}
                  </button>
                </div>
              )}
              {content}
            </main>
            <aside className="profile-panel">
              <div className="profile-top">
                <span className="eyebrow">CUỘC ĐỜI HIỆN TẠI</span>
                <Avatar
                  age={game.age}
                  happiness={game.stats.happiness}
                  gender={game.gender}
                  appearance={game.appearance}
                />
                <h2>{game.name}</h2>
                <p>
                  {game.age} {ui.years} · {ageLabel(game.age)}
                </p>
                <small>
                  {game.hometown} · {originById.get(game.origin)?.label}
                </small>
                <small>
                  {FAMILY_LABELS[game.familyWealth]} · Danh vọng {game.fame}/100
                </small>
              </div>
              <div className="stats-list">
                <StatBars s={game} />
                <ThisYear s={game} />
              </div>
              <div className="balance-panel">
                <span>{ui.balance}</span>
                <strong title={cash(game.money, true)}>
                  {cash(game.money)}
                </strong>
                <small>
                  {ui.netWorth} · {cash(netWorth(game))}
                </small>
              </div>
              <div className="current-role">
                <span>◇</span>
                <p>
                  {game.job
                    ? jobById.get(game.job.id)?.name
                    : game.education.current
                      ? "Đang học"
                      : game.flags.includes("retired")
                        ? "Đã nghỉ hưu"
                        : game.age < 6
                          ? "Tuổi thơ đang lớn"
                          : "Một hành trình riêng"}
                </p>
              </div>
              <p className="profile-note">{ui.statsHint}</p>
            </aside>
          </div>
          <footer className="age-dock">
            <div className="dock-profile">
              <Avatar
                small
                age={game.age}
                happiness={game.stats.happiness}
                gender={game.gender}
                appearance={game.appearance}
              />
              <span>
                <strong>{game.name}</strong>
                <small>
                  {game.age} {ui.years} · {cash(game.money)}
                </small>
              </span>
            </div>
            <span className="time-label">
              ◷ {game.time}/12 <small>{ui.timePoint}</small>
            </span>
            <button
              className="age-button"
              disabled={
                busy ||
                readOnly ||
                game.phase !== "ready" ||
                !!game.casino.hand ||
                !!game.loveOffer
              }
              onClick={() => void dispatch({ type: "age" })}
            >
              <span className="plus">＋</span>
              <span>
                {game.phase === "dead"
                  ? "Câu chuyện đã khép lại"
                  : game.pending
                    ? "Chọn sự kiện trước"
                    : game.casino.hand
                      ? "Kết thúc ván bài trước"
                      : game.loveOffer
                        ? "Trả lời lời mời trước"
                        : busy
                          ? ui.saving
                          : ui.ageUp}
                <small>
                  {game.phase === "ready"
                    ? `Sang tuổi ${game.age + 1}`
                    : "Nhật ký đã giữ những gì bạn chọn"}
                </small>
              </span>
              <span>→</span>
            </button>
          </footer>
        </div>
      )}
      {notice && (
        <div className={"toast " + (unsaved ? "error" : "")} role="status">
          <span>{notice}</span>
          <button aria-label={ui.close} onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
      {game?.pending && !creating && !readOnly && (
        <EventDialog
          key={game.pending.instanceId}
          s={game}
          busy={busy}
          dispatch={(a) => void dispatch(a)}
        />
      )}
      {game?.loveOffer && !creating && !readOnly && (
        <LoveDialog s={game} busy={busy} dispatch={(a) => void dispatch(a)} />
      )}
    </>
  );
}
