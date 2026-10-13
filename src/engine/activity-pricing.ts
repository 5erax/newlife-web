import type { Activity, GameState } from "./types";
import { localPrice } from "./world";
export const annualIncome = (s: GameState) =>
  s.job?.salary ?? (s.pension || localPrice(s, s.age < 18 ? 240000 : 60000000));
export function activityCost(s: GameState, a: Activity) {
  if (!a.cost) return 0;
  return s.age < 18
    ? Math.max(
        1,
        Math.round(Math.min(localPrice(s, a.cost), annualIncome(s) * 0.008)),
      )
    : localPrice(s, a.cost);
}
export function costTier(s: GameState, a: Activity) {
  const cost = activityCost(s, a),
    ratio = cost / annualIncome(s);
  return !cost
    ? 0
    : ratio < 0.01
      ? 1
      : ratio <= 0.05
        ? 2
        : ratio <= 0.2
          ? 3
          : 4;
}
