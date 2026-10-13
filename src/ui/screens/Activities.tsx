import { useState } from "react";
import type { Action, GameState } from "../../engine/types";
import { activities } from "../../content/catalog";
import { activityReason, activityTargets } from "../../engine/game";
import { activityCost, costTier } from "../../engine/activity-pricing";
import { APK_TRIPS, apkTripCompanions } from "../../engine/apk";
import { Casino } from "./Casino";
import ui from "../../i18n/vi.json" with { type: "json" };
import { cash as displayCash, GROUP_LABELS } from "../format";
export function Activities({
  s,
  dispatch,
  busy,
}: {
  s: GameState;
  dispatch: (a: Action) => void;
  busy: boolean;
}) {
  const cash = (value: number, full = false) =>
    displayCash(value, full, s.origin);
  const [group, setGroup] = useState("all"),
    [search, setSearch] = useState(""),
    [readyOnly, setReadyOnly] = useState(false),
    [targets, setTargets] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<Record<string, string>>({}),
    [genderPreference, setGenderPreference] = useState<
      "male" | "female" | "any"
    >("any");
  const [casinoOpen, setCasinoOpen] = useState(false);
  const [companions, setCompanions] = useState<Record<string, string>>({});
  const list = activities
    .filter(
      (a) =>
        (group === "all" || a.group === group) &&
        a.name
          .toLocaleLowerCase("vi-VN")
          .includes(search.toLocaleLowerCase("vi-VN")) &&
        (!readyOnly || !activityReason(s, a)),
    )
    .filter((a) => s.age >= a.minAge)
    .sort((a, b) => activityCost(s, a) - activityCost(s, b));
  return (
    <section className="screen">
      <button
        className="button subtle"
        onClick={() => setCasinoOpen((v) => !v)}
      >
        {casinoOpen ? "← Trở về hoạt động" : "♠ Sòng bạc · Blackjack & Ba cào"}
      </button>
      {casinoOpen ? (
        <Casino s={s} dispatch={dispatch} busy={busy} />
      ) : (
        <>
          <div className="activity-categories">
            {[
              ["danhvong", "★", "Danh vọng"],
              ["tinhyeu", "♡", "Tình yêu"],
              ["tamtri", "☀", "Tâm trí và thể chất"],
              ["salon", "✿", "Salon và spa"],
            ].map(([id, icon, label]) => (
              <button
                key={id}
                aria-pressed={group === id}
                onClick={() => setGroup(group === id ? "all" : id)}
              >
                <span>{icon}</span>
                <strong>{label}</strong>
                <small>
                  {activities.filter((a) => a.group === id).length} hoạt động
                </small>
              </button>
            ))}
          </div>
          {group === "danhvong" && (
            <div className="feature-panel">
              <h3>
                Danh vọng {s.fame}/100 · Uy tín {s.reputation}/100
              </h3>
              <progress value={s.fame} max={100} aria-label="Danh vọng" />
              <p>
                Viết sách, luyện diễn xuất hoặc theo nghề nghệ thuật để được
                biết đến. Những hợp đồng lớn cần mức nhận diện cao hơn; hành
                động bốc đồng có thể làm mất uy tín.
              </p>
            </div>
          )}
          {group === "tinhyeu" && (
            <label>
              Bạn muốn tìm hiểu
              <select
                value={genderPreference}
                onChange={(e) =>
                  setGenderPreference(e.target.value as typeof genderPreference)
                }
              >
                <option value="any">Không giới hạn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </select>
              <small>
                Ứng dụng LGBTQ+ tìm người cùng giới tính đã chọn cho nhân vật;
                nhân vật “khác” gặp người từ danh sách trung tính.
              </small>
            </label>
          )}
          <div className="section-heading">
            <div>
              <p className="eyebrow">MỘT NĂM CÓ THỂ LÀM GÌ?</p>
              <h2>{ui.activities}</h2>
              <p className="muted">
                {activities.length} cách thử, học, nghỉ ngơi và gặp người khác.
                Miễn phí trước, hiệu quả giảm khi lặp trong năm.
              </p>
            </div>
            <span className="budget">
              ◷ {s.time}/12 {ui.timePoint}
            </span>
          </div>
          {s.illnesses.length > 0 && (
            <div className="feature-panel">
              <h3>Sức khoẻ cần theo dõi</h3>
              {s.illnesses.map((i) => (
                <p key={i.id}>
                  <strong>{i.type}</strong> · mức độ {i.severity}/100 · điều trị{" "}
                  {i.progress}/60 · phát hiện tuổi {i.discoveredAge}
                </p>
              ))}
              <small>
                Chọn hoạt động điều trị và đúng tình trạng ở danh sách bên dưới.
              </small>
            </div>
          )}
          <div className="toolbar">
            <input
              type="search"
              aria-label="Tìm hoạt động"
              placeholder={ui.search}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Nhóm hoạt động"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
            >
              <option value="all">{ui.all}</option>
              {Array.from(new Set(activities.map((a) => a.group))).map((g) => (
                <option key={g} value={g}>
                  {GROUP_LABELS[g]}
                </option>
              ))}
            </select>
            <label className="check">
              <input
                type="checkbox"
                checked={readyOnly}
                onChange={(e) => setReadyOnly(e.target.checked)}
              />
              {ui.readyOnly}
            </label>
          </div>
          {group === "ruiro" && (
            <p className="banner">
              Những lựa chọn hư cấu này có thể mất tiền, sức khoẻ hoặc nhiều năm
              tự do trong game.
            </p>
          )}
          <div className="catalog-list">
            {list.map((a) => {
              const reason = activityReason(s, a);
              const feature = a.feature,
                variants =
                  feature && "options" in feature ? feature.options : undefined;
              const option =
                variants?.find((o) => o.id === options[a.id]) ?? variants?.[0];
              const available = activityTargets(s, a);
              const target =
                available.find((t) => t.id === targets[a.id])?.id ??
                available[0]?.id;
              return (
                <article className="catalog-row" key={a.id}>
                  <div className="row-icon">
                    {a.group === "ruiro"
                      ? "⚠"
                      : a.group === "tinhcam"
                        ? "♡"
                        : a.group === "suckhoe"
                          ? "✚"
                          : "✦"}
                  </div>
                  <div className="row-body">
                    <div className="row-title">
                      <h3>{a.name}</h3>
                      <span className="tag">{GROUP_LABELS[a.group]}</span>
                    </div>
                    <p>{a.description}</p>
                    {variants && (
                      <label>
                        Lựa chọn
                        <select
                          value={option?.id}
                          onChange={(e) =>
                            setOptions((v) => ({
                              ...v,
                              [a.id]: e.target.value,
                            }))
                          }
                        >
                          {variants.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {feature?.type === "practice" && (
                      <p>
                        Kỹ năng: {s.skills[option?.id ?? feature.skill] ?? 0}
                        /100 · tiến trình riêng cho từng lựa chọn
                      </p>
                    )}
                    <div className="row-meta">
                      <span>
                        {a.cost ? cash(activityCost(s, a)) : ui.free} · Bậc{" "}
                        {costTier(s, a)}
                      </span>
                      <span>
                        ◷ {a.timeCost} {ui.timePoint}
                      </span>
                      <span>
                        {s.activityUses[a.id] ?? 0}/{a.maxUsesPerYear} lượt/năm
                      </span>
                    </div>
                    {a.target && available.length > 0 && (
                      <select
                        aria-label={`Chọn đối tượng cho ${a.name}`}
                        value={target}
                        onChange={(e) =>
                          setTargets((v) => ({ ...v, [a.id]: e.target.value }))
                        }
                      >
                        {available.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    )}
                    {reason && <small className="lock-reason">{reason}</small>}
                    {s.flags.includes("apk_mode") && APK_TRIPS[a.id] && (
                      <label>
                        Người đồng hành
                        <select
                          aria-label={`Người đồng hành khi ${a.name}`}
                          value={companions[a.id] ?? ""}
                          onChange={(e) =>
                            setCompanions((v) => ({
                              ...v,
                              [a.id]: e.target.value,
                            }))
                          }
                        >
                          <option value="">Đi một mình</option>
                          {apkTripCompanions(s).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <small>
                          Giải quyết tình huống trong chuyến đi; hiệu ứng được
                          ghi vào nhật ký.
                        </small>
                      </label>
                    )}
                  </div>
                  <button
                    className="button small"
                    disabled={busy || !!reason}
                    onClick={() =>
                      dispatch({
                        type: "activity",
                        id: a.id,
                        targetId: target,
                        companionId: companions[a.id] || undefined,
                        optionId: option?.id,
                        genderPreference,
                      })
                    }
                  >
                    {ui.perform}
                    <span>↗</span>
                  </button>
                </article>
              );
            })}
          </div>
          {!list.length && <p className="empty">{ui.noResults}</p>}
        </>
      )}
    </section>
  );
}
