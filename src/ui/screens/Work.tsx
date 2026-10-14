import { localPrice, origins } from "../../engine/world";
import { useState } from "react";
import type { Action, GameState } from "../../engine/types";
import { jobs, jobById, apkJobs } from "../../content/catalog";
import industries from "../../content/industries.json" with { type: "json" };
import { jobReason, sideJobs } from "../../engine/economy";
import ui from "../../i18n/vi.json" with { type: "json" };
import { cash as displayCash } from "../format";
export function Work({
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
  const [industry, setIndustry] = useState("all"),
    [search, setSearch] = useState(""),
    [readyOnly, setReadyOnly] = useState(false),
    [side, setSide] = useState("Phụ quán");
  const [destination, setDestination] = useState("vn");
  const current = s.job ? jobById.get(s.job.id)! : null;
  const catalog = s.flags.includes("apk_mode") ? apkJobs : jobs;
  const offers = catalog.filter(
    (j) =>
      (industry === "all" || j.industry === industry) &&
      j.name
        .toLocaleLowerCase("vi-VN")
        .includes(search.toLocaleLowerCase("vi-VN")) &&
      (!readyOnly || !jobReason(s, j.id)),
  );
  return (
    <section className="screen">
      <div className="section-heading">
        <div>
          <p className="eyebrow">TẠO MỘT HÀNH TRÌNH</p>
          <h2>{ui.work}</h2>
          <p className="muted">
            {catalog.length} nghề trong 12 ngành. Có thể thử lại khi bạn đã học
            thêm.
          </p>
        </div>
      </div>
      {s.flags.includes("apk_mode") && (
        <p className="muted fine">
          Danh mục và điều kiện từ APK. Tiền lương và thăng tiến dùng quy tắc mô
          phỏng của bản web. Các nghề cần hệ đặc biệt chưa chuyển sẽ hiện lý do
          khóa.
        </p>
      )}
      <div className="feature-panel">
        {current && s.job ? (
          <>
            <span className="tag">
              {industries.find((i) => i.id === current.industry)?.name}
            </span>
            <h3>{current.name}</h3>
            <p>
              {current.ranks[s.job.rank].name} · {s.job.years} năm trong nghề
            </p>
            <div className="row-meta">
              <strong>{cash(s.job.salary)}/năm</strong>
              <span>
                {ui.performance} {s.job.performance}/100
              </span>
            </div>
            <div className="button-row">
              <button
                className="button"
                disabled={busy || s.phase !== "ready" || s.time < 2}
                onClick={() => dispatch({ type: "workHard" })}
              >
                {ui.workHard} · 2◷
              </button>
              <button
                className="button subtle"
                disabled={busy || s.phase !== "ready"}
                onClick={() => {
                  if (confirm(ui.confirmQuit)) dispatch({ type: "quit" });
                }}
              >
                {ui.quit}
              </button>
              <button
                className="button subtle"
                disabled={
                  busy || s.phase !== "ready" || s.age < current.retireAge
                }
                onClick={() => dispatch({ type: "retire" })}
              >
                {ui.retire} · {current.retireAge}+
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>{ui.noJob}</h3>
            <p>
              {s.pension
                ? `Trợ cấp hưu: ${cash(s.pension)}/năm.`
                : "Nghề sẽ trả lương từ năm làm việc tiếp theo."}
            </p>
          </>
        )}
      </div>
      <details className="part-time">
        <summary>{ui.partTime} · Mở từ tuổi 13</summary>
        <p>
          Thu nhập theo lượt, tối đa 3 lượt/năm. Mỗi lượt cần 2 điểm thời gian.
        </p>
        <div className="toolbar">
          <select
            value={side}
            aria-label="Chọn việc làm thêm"
            onChange={(e) => setSide(e.target.value)}
          >
            {sideJobs.map((j) => (
              <option key={j.name} value={j.name}>
                {j.name} · {j.minAge}+
              </option>
            ))}
          </select>
          <button
            className="button"
            disabled={
              busy ||
              s.phase !== "ready" ||
              s.age < (sideJobs.find((j) => j.name === side)?.minAge ?? 18) ||
              s.time < 2 ||
              s.prisonYears > 0
            }
            onClick={() => dispatch({ type: "sideJob", id: side })}
          >
            {ui.takeWork}
          </button>
        </div>
      </details>
      <div className="toolbar">
        <input
          type="search"
          aria-label="Tìm nghề"
          placeholder={ui.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Ngành nghề"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        >
          <option value="all">{ui.all}</option>
          {industries.map((i) => (
            <option value={i.id} key={i.id}>
              {i.name}
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
      <div className="catalog-list">
        {offers.map((j) => {
          const reason =
            jobReason(s, j.id) ??
            (j.sourceKind === "apk_translation" && s.time < 1
              ? "Cần 1 điểm thời gian để phỏng vấn."
              : null);
          const active = s.job?.id === j.id;
          return (
            <article className="catalog-row" key={j.id}>
              <span className="row-icon">◇</span>
              <div className="row-body">
                <h3>{j.name}</h3>
                <p>
                  {industries.find((i) => i.id === j.industry)?.name} ·{" "}
                  {j.ranks.length} bậc nghề
                </p>
                <div className="row-meta">
                  <strong>{cash(localPrice(s, j.ranks[0].salary))}/năm</strong>
                  <span>{j.ranks.map((r) => r.name).join(" → ")}</span>
                </div>
                {reason && <small className="lock-reason">{reason}</small>}
              </div>
              <button
                className="button small"
                disabled={busy || s.phase !== "ready" || !!reason || active}
                onClick={() => dispatch({ type: "job", id: j.id })}
              >
                {active ? "Đang làm" : ui.apply}
              </button>
            </article>
          );
        })}
      </div>
      {!offers.length && <p className="empty">{ui.noResults}</p>}
      <details className="part-time">
        <summary>Di cư và bắt đầu công việc ở nơi khác</summary>
        <p>
          Di cư làm bạn nghỉ công việc và chế độ hưu hiện tại. Tài sản đứng tên
          vẫn giữ nơi mua; giá thị trường mua mới và chi phí sinh hoạt đổi theo
          nơi sống.
        </p>
        <div className="toolbar">
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            aria-label="Nơi muốn di cư"
          >
            {origins
              .filter((o) => o.id !== s.origin)
              .map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
          </select>
          <button
            className="button subtle"
            disabled={
              busy ||
              s.phase !== "ready" ||
              s.age < 18 ||
              !!s.prisonYears ||
              destination === s.origin ||
              s.money < localPrice(s, 5000000)
            }
            onClick={() => {
              if (
                confirm(
                  `Chuyển đến ${origins.find((o) => o.id === destination)?.label} và bắt đầu tìm việc lại?`,
                )
              )
                dispatch({ type: "migrate", origin: destination });
            }}
          >
            Di cư · {cash(localPrice(s, 5000000))}
          </button>
        </div>
      </details>
    </section>
  );
}
