import type { GameState, Stat } from "./types";
import { random } from "./rng";
import { stat } from "./helpers";
import { changeContext } from "./changes";
import { activities } from "../content/catalog";

export function stochasticRound(s: GameState, value: number) {
  const floor = Math.floor(value);
  return floor + (random(s) < value - floor ? 1 : 0);
}
export function annualStats(s: GameState) {
  changeContext(
    s,
    "aging",
    "Cơ thể, tâm trạng và việc học thay đổi theo tuổi.",
  );
  const noise = () => Math.floor(random(s) * 3) - 1;
  const band =
    s.age < 6
      ? [-1, 2]
      : s.age < 12
        ? [-2, 2]
        : s.age < 18
          ? [-5, 5.6]
          : s.age < 30
            ? [-1, 2]
            : s.age < 45
              ? [-2, 0.5]
              : s.age < 60
                ? [-3, 0]
                : [-4, -1];
  const lifestyle = ["smoking", "drinking", "late_nights"].filter((f) =>
    s.flags.includes(f),
  ).length;
  const care = Math.min(
    1,
    activities
      .filter(
        (a) =>
          ["thechat", "suckhoe"].includes(a.group) ||
          a.id === "act_gym_training",
      )
      .reduce((n, a) => n + (s.activityUses[a.id] ?? 0), 0) / 3,
  );
  const lowMood = s.stats.happiness < 25 ? 1 : 0;
  const looks =
    band[0] +
    random(s) * (band[1] - band[0]) +
    (s.stats.health > 80 ? 0.4 : s.stats.health < 30 ? -1.5 : 0) +
    (s.stats.happiness > 80 ? 0.3 : -lowMood) -
    lifestyle * 0.5;
  stat(s, "looks", stochasticRound(s, looks) + noise());
  const previous = s.counters.previous_looks ?? s.stats.looks;
  if (
    !s.flags.includes("lock_looks") &&
    (s.counters.looks_streak ?? 0) >= 18 &&
    s.stats.looks === previous
  ) {
    changeContext(
      s,
      "aging",
      "Một thay đổi nhỏ về vóc dáng và diện mạo sau nhiều năm.",
    );
    stat(s, "looks", s.stats.looks === 100 ? -1 : 1);
  }
  changeContext(
    s,
    "aging",
    "Sức khoẻ, nhịp sinh hoạt và khả năng tập trung trong năm.",
  );
  stat(
    s,
    "health",
    stochasticRound(
      s,
      (random(s) - 0.5) * 6 +
        care -
        (s.age < 30 ? 0 : s.age < 60 ? 0.5 : 1.2) -
        lifestyle,
    ) + noise(),
  );
  const baseline = Math.max(
    0,
    Math.min(
      100,
      s.happinessBaseline +
        s.modifiers.reduce((n, m) => n + (m.happinessBaseline ?? 0), 0),
    ),
  );
  stat(
    s,
    "happiness",
    stochasticRound(s, (baseline - s.stats.happiness) * 0.16) + noise(),
  );
  const learning = activities.some(
    (a) =>
      ["hoctap", "tamtri"].includes(a.group) &&
      s.activityUses[a.id] &&
      a.outcomes.some((o) =>
        o.effects.some((e) => "stat" in e && e.stat === "intelligence"),
      ),
  );
  stat(
    s,
    "intelligence",
    stochasticRound(
      s,
      (random(s) - 0.5) * 5 +
        (s.education.current ? 1.5 : s.age > 60 && !learning ? -0.8 : 0),
    ) + noise(),
  );
  for (const m of s.modifiers) {
    changeContext(s, "modifier", `${m.label} · còn ${m.remaining} năm`);
    for (const [key, value] of Object.entries(m.stats))
      stat(s, key as Stat, value!);
    m.remaining--;
  }
  s.modifiers = s.modifiers.filter((m) => m.remaining > 0);
  const educationBonus = Math.min(20, s.education.completed.length * 3),
    targets = {
      health: 80 - Math.max(0, s.age - 30) * 0.35,
      intelligence:
        Math.min(90, (s.counters.birth_intelligence ?? 50) + educationBonus) -
        Math.max(0, s.age - 60) * 0.2,
      looks:
        Math.min(
          85,
          (s.counters.birth_looks ?? 50) + (s.age >= 12 && s.age < 30 ? 8 : 0),
        ) -
        Math.max(0, s.age - 30) * 0.45,
    };
  for (const key of ["health", "intelligence", "looks"] as const) {
    const favorable =
      random(s) <
      Math.max(0.2, Math.min(0.8, 0.5 + (targets[key] - s.stats[key]) / 100));
    const reason =
      key === "health"
        ? favorable
          ? "Nhịp vận động và nghỉ ngơi năm nay giúp cơ thể hồi phục."
          : "Một năm sinh hoạt lệch nhịp khiến cơ thể dễ mệt hơn."
        : key === "intelligence"
          ? favorable
            ? "Bạn gặp kiến thức mới và có những tháng tập trung tốt."
            : "Những tháng thiếu tập trung làm khả năng ghi nhớ và xử lý giảm tạm thời."
          : favorable
            ? "Vóc dáng và vẻ tươi tắn thay đổi sau những tháng bạn chăm chút bản thân."
            : "Những tháng mệt mỏi và thay đổi vóc dáng làm diện mạo kém tươi tắn hơn.";
    changeContext(s, "year_context", reason);
    stat(s, key, favorable ? 6 : -6);
  }
  if (s.flags.some((f) => f.startsWith("diet_"))) {
    changeContext(
      s,
      "lifestyle",
      "Thói quen ăn uống bạn đã chọn hỗ trợ nhịp sống trong game.",
    );
    stat(s, "health", 1);
  }
}
