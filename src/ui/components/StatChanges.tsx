import { useEffect, useState } from "react";
import type { Delta, GameState, Stat } from "../../engine/types";
import { STAT_LABELS } from "../../engine/types";
import { cash } from "../format";

export function DeltaChips({
  deltas,
  origin = "vn",
}: {
  deltas: Delta[];
  origin?: string;
}) {
  return (
    <div className="delta-chips">
      {deltas
        .filter((d) => d.after !== d.before)
        .map((d) => (
          <span
            key={d.key}
            className={d.after > d.before ? "delta-up" : "delta-down"}
            title={d.reasons.join(" · ")}
          >
            {d.key === "money" ? "Tiền" : STAT_LABELS[d.key]}{" "}
            {d.after > d.before ? "↑ +" : "↓ −"}
            {d.key === "money"
              ? cash(Math.abs(d.after - d.before), false, origin)
              : Math.abs(d.after - d.before)}
          </span>
        ))}
    </div>
  );
}
export function StatBars({ s }: { s: GameState }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(timer);
  }, [s.id, s.revision]);
  return (
    <>
      {(Object.entries(s.stats) as [Stat, number][]).map(([key, value]) => {
        const delta = s.lastDeltas.find((d) => d.key === key),
          difference = delta ? delta.after - delta.before : 0;
        return (
          <div className={"stat stat-" + key} key={key}>
            <div>
              <span>{STAT_LABELS[key]}</span>
              <strong>
                {value}{" "}
                {visible && difference !== 0 && (
                  <span className="stat-jump" key={s.revision}>
                    {difference > 0 ? "↑ +" : "↓ −"}
                    {Math.abs(difference)}
                  </span>
                )}
              </strong>
            </div>
            <div className="stat-track">
              <progress value={value} max={100} aria-label={STAT_LABELS[key]} />
              {visible && delta && (
                <span
                  className="stat-ghost"
                  style={{
                    left: Math.min(value, delta.before) + "%",
                    width: Math.abs(value - delta.before) + "%",
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
export function ThisYear({ s }: { s: GameState }) {
  return (
    <details className="this-year">
      <summary>
        Năm nay · tuổi {s.age}
        <DeltaChips deltas={s.lastYearDeltas} origin={s.origin} />
      </summary>
      {s.lastYearDeltas.length ? (
        <ul>
          {s.lastYearDeltas.map((d) => (
            <li key={d.key}>
              <strong>{d.key === "money" ? "Tiền" : STAT_LABELS[d.key]}</strong>
              : {d.key === "money" ? cash(d.before, true, s.origin) : d.before}{" "}
              → {d.key === "money" ? cash(d.after, true, s.origin) : d.after}
              <ul>
                {d.reasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          Chưa có thay đổi trong năm này. Nhật ký cũ được giữ; phiên bản trước
          chưa ghi lượng biến động.
        </p>
      )}
    </details>
  );
}
