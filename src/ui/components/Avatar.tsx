import type { GameState } from "../../engine/types";
import { HAIR_COLORS } from "../../engine/lifestyle";
export function Avatar({
  age = 0,
  happiness = 70,
  gender = "other",
  small = false,
  appearance,
}: {
  age?: number;
  happiness?: number;
  gender?: string;
  small?: boolean;
  appearance?: GameState["appearance"];
}) {
  const hair =
    HAIR_COLORS[appearance?.hairColor ?? ""] ??
    (age >= 60 ? "#e2e1db" : age >= 30 ? "#514846" : "#343434");
  const style = appearance?.hairStyle ?? "natural";
  const background = age < 6 ? "#fff0b9" : age < 18 ? "#d9efda" : "#d8eeee";
  return (
    <svg
      className={small ? "avatar small" : "avatar"}
      viewBox="0 0 120 120"
      data-gender={gender}
      aria-hidden="true"
    >
      <rect x="0" y="0" width="120" height="120" rx="30" fill={background} />
      <path
        d="M20 123C23 82 97 82 100 123"
        fill={age < 18 ? "#eaaa54" : "#418b91"}
      />
      <path d="M47 85L60 99L73 85" fill="#f5e8cc" />
      <ellipse
        cx="60"
        cy="52"
        rx={age < 6 ? 29 : 27}
        ry="32"
        fill={appearance?.tanned ? "#d8ac88" : "#f1c8a6"}
      />
      <path
        d={
          style === "buzz"
            ? "M34 35C39 15 81 15 86 35L80 31C68 24 52 24 40 31Z"
            : style === "curly"
              ? "M31 45Q18 34 31 22Q35 7 49 15Q60 4 73 15Q90 10 91 30Q104 46 87 56L80 40L70 29L49 30L38 48Z"
              : style === "bob"
                ? "M30 68C18 9 100 8 90 68L80 69L80 34L40 34L40 69Z"
                : (style === "long" ||
                      (style === "natural" && gender === "female")) &&
                    age >= 6
                  ? "M31 61C19 1 102 2 89 66L83 77L81 39C65 42 54 21 45 33L35 73Z"
                  : "M33 40C21 0 98 2 88 42C74 33 64 27 58 34C48 40 46 35 33 40Z"
        }
        fill={hair}
      />
      {age < 6 && (
        <path
          d="M52 19Q76 6 66 25"
          fill="none"
          stroke={hair}
          strokeWidth="6"
          strokeLinecap="round"
        />
      )}
      <ellipse cx="49" cy="53" rx="3" ry="4" fill="#35322e" />
      <ellipse cx="72" cy="53" rx="3" ry="4" fill="#35322e" />
      <ellipse cx="40" cy="64" rx="6" ry="3" fill="#e9a694" opacity=".65" />
      <ellipse cx="80" cy="64" rx="6" ry="3" fill="#e9a694" opacity=".65" />
      <path
        d={
          happiness < 30
            ? "M50 73Q61 65 71 73"
            : happiness < 60
              ? "M53 70L69 70"
              : "M49 68Q60 83 72 68"
        }
        stroke="#a24a43"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {age >= 60 && (
        <g fill="none" stroke="#666c67" strokeWidth="2">
          <rect x="39" y="47" width="20" height="15" rx="5" />
          <rect x="64" y="47" width="20" height="15" rx="5" />
          <path d="M59 52H64M44 74L39 72M78 73L83 71" />
        </g>
      )}
    </svg>
  );
}
