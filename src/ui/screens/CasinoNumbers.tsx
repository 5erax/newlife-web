import { useState } from "react";
import type { Action, GameState } from "../../engine/types";
import { cash } from "../format";
export function CasinoNumbers({
  s,
  game,
  bet,
  disabled,
  dispatch,
}: {
  s: GameState;
  game: "keno" | "craps";
  bet: number;
  disabled: boolean;
  dispatch: (a: Action) => void;
}) {
  const [numbers, setNumbers] = useState<number[]>(
    s.casino.kenoHistory.at(-1)?.numbers ?? [1, 2, 3],
  );
  const keno = s.casino.kenoHistory.at(-1),
    craps = s.casino.crapsHistory.at(-1);
  return (
    <div className="casino-table">
      <h3>{game === "keno" ? "Keno · chọn ba số" : "Craps · xúc xắc"}</h3>
      {game === "keno" ? (
        <>
          <div className="keno-grid" role="group" aria-label="Chọn số Keno">
            {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={
                  "button small " + (numbers.includes(n) ? "primary" : "subtle")
                }
                aria-pressed={numbers.includes(n)}
                disabled={
                  disabled || (!numbers.includes(n) && numbers.length === 3)
                }
                onClick={() =>
                  setNumbers(
                    numbers.includes(n)
                      ? numbers.filter((v) => v !== n)
                      : [...numbers, n].sort((a, b) => a - b),
                  )
                }
              >
                {n}
              </button>
            ))}
          </div>
          <p>
            Đã chọn {numbers.length}/3: {numbers.join(" · ") || "chưa chọn số"}.
          </p>
          <button
            className="button primary"
            disabled={disabled || numbers.length !== 3}
            onClick={() =>
              dispatch({ type: "casinoKeno", bet, numbers: [...numbers] })
            }
          >
            Bốc bóng Keno
          </button>
          <p>
            Sáu bóng khác nhau từ 1–20. Trúng 1/2/3 số: lãi 1/2/3 lần tiền cược;
            không trúng mất cược.
          </p>
          {keno && (
            <div aria-live="polite" data-testid="keno-result">
              <p>Đã cược: {keno.numbers.join(" · ")}</p>
              <p>Bóng: {keno.drawn.join(" · ")}</p>
              <strong>
                Trúng{" "}
                {keno.numbers.filter((n) => keno.drawn.includes(n)).length} số ·
                Lãi/lỗ ròng {keno.net > 0 ? "+" : "−"}
                {cash(Math.abs(keno.net), true, s.origin)}
              </strong>
            </div>
          )}
          <details>
            <summary>Lịch sử Keno · {s.casino.kenoHistory.length} lượt</summary>
            {s.casino.kenoHistory
              .slice()
              .reverse()
              .map((r) => (
                <p key={r.id}>
                  Tuổi {r.age} · chọn {r.numbers.join(", ")} · bóng{" "}
                  {r.drawn.join(", ")} · {cash(r.net, true, s.origin)}
                </p>
              ))}
          </details>
        </>
      ) : (
        <>
          <button
            className="button primary"
            disabled={disabled}
            onClick={() => dispatch({ type: "casinoCraps", bet })}
          >
            Lắc xúc xắc
          </button>
          <p>
            Tổng 7 hoặc 11: lãi một lần tiền cược. Tổng 2, 3 hoặc 12: mất cược.
            Tổng khác tự lắc tiếp đến khi ván kết thúc.
          </p>
          {craps && (
            <div aria-live="polite" data-testid="craps-result">
              <p>{craps.rolls.length} lần lắc</p>
              <ol>
                {craps.rolls.map((d, i) => (
                  <li key={i}>
                    {d[0]} + {d[1]} = {d[0] + d[1]}
                    {i < craps.rolls.length - 1
                      ? " · lắc tiếp"
                      : craps.net > 0
                        ? " · thắng"
                        : " · thua"}
                  </li>
                ))}
              </ol>
              <strong>
                Lãi/lỗ ròng {craps.net > 0 ? "+" : "−"}
                {cash(Math.abs(craps.net), true, s.origin)}
              </strong>
            </div>
          )}
          <details>
            <summary>
              Lịch sử xúc xắc · {s.casino.crapsHistory.length} lượt
            </summary>
            {s.casino.crapsHistory
              .slice()
              .reverse()
              .map((r) => (
                <p key={r.id}>
                  Tuổi {r.age} · {r.rolls.length} lần lắc ·{" "}
                  {cash(r.net, true, s.origin)}
                </p>
              ))}
          </details>
        </>
      )}
    </div>
  );
}
