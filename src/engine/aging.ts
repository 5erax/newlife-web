import type { GameState, Stat } from "./types";
import { random } from "./rng";
import { stat } from "./helpers";
import { changeContext } from "./changes";

export function stochasticRound(s: GameState, value: number) {
  const floor = Math.floor(value);
  return floor + (random(s) < value - floor ? 1 : 0);
}
export function annualStats(s: GameState) {
  changeContext(s, "aging", "Cơ thể, tâm trạng và việc học thay đổi theo tuổi.");
  const noise = () => Math.floor(random(s) * 3) - 1;
  const band = s.age < 6 ? [-1,2] : s.age < 12 ? [-2,2] : s.age < 18 ? [-5,5.6] : s.age < 30 ? [-1,2] : s.age < 45 ? [-2,0.5] : s.age < 60 ? [-3,0] : [-4,-1];
  const lifestyle = ["smoking","drinking","late_nights"].filter(f => s.flags.includes(f)).length;
  const care = Math.min(1, (s.counters.healthy_activities ?? 0) / 10);
  const lowMood = s.stats.happiness < 25 ? 1 : 0;
  const looks = band[0] + random(s) * (band[1] - band[0]) + (s.stats.health > 80 ? 0.4 : s.stats.health < 30 ? -1.5 : 0) + (s.stats.happiness > 80 ? 0.3 : -lowMood) - lifestyle * 0.5;
  stat(s, "looks", stochasticRound(s, looks) + noise());
  const previous = s.counters.previous_looks ?? s.stats.looks;
  if (!s.flags.includes("lock_looks") && (s.counters.looks_streak ?? 0) >= 18 && s.stats.looks === previous) {
    changeContext(s, "aging", "Một thay đổi nhỏ về vóc dáng và diện mạo sau nhiều năm.");
    stat(s, "looks", s.stats.looks === 100 ? -1 : 1);
  }
  changeContext(s, "aging", "Sức khoẻ, nhịp sinh hoạt và khả năng tập trung trong năm.");
  stat(s, "health", stochasticRound(s, (random(s) - 0.5) * 6 + care - (s.age < 30 ? 0 : s.age < 60 ? 0.5 : 1.2) - lifestyle) + noise());
  const baseline = Math.max(0, Math.min(100, s.happinessBaseline + s.modifiers.reduce((n,m) => n + (m.happinessBaseline ?? 0),0)));
  stat(s, "happiness", stochasticRound(s, (baseline - s.stats.happiness) * 0.16) + noise());
  stat(s, "intelligence", stochasticRound(s, (random(s) - 0.5) * 5 + (s.education.current ? 1.5 : s.age > 60 && !(s.activityUses.act_hoctap_01 || s.activityUses.act_library) ? -0.8 : 0)) + noise());
  for (const m of s.modifiers) {
    changeContext(s, "modifier", `${m.label} · còn ${m.remaining} năm`);
    for (const [key, value] of Object.entries(m.stats)) stat(s, key as Stat, value!);
    m.remaining--;
  }
  s.modifiers = s.modifiers.filter(m => m.remaining > 0);
}
