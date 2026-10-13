import type { GameState } from "./types";
import { localPrice } from "./world";
import { money, addLog } from "./helpers";
import { changeContext } from "./changes";

export function tuitionQuote(
  s: GameState,
  cost: number,
  scholarship = s.flags.includes("scholarship"),
) {
  const total = localPrice(s, cost),
    fee = scholarship ? Math.round(total * 0.5) : total;
  const parents = s.relations.filter(
    (r) => r.alive && ["mother", "father", "parent"].includes(r.role),
  );
  const closeness = parents.length
    ? parents.reduce((n, r) => n + r.closeness, 0) / parents.length
    : 0;
  const ratio =
    s.familyWealth === "rich"
      ? Math.min(
          1,
          (0.7 + closeness / 200) * (s.education.score < 40 ? 0.8 : 1),
        )
      : Math.min(
          1,
          s.tuitionRatio *
            (0.75 + closeness / 400) *
            (s.education.score >= 80 ? 1.05 : 0.95),
        );
  const support = s.flags.includes("tuition_support")
    ? Math.min(
        Math.round(fee * ratio),
        parents.reduce((n, r) => n + r.resources, 0),
      )
    : 0;
  return { total, scholarship: total - fee, support, due: fee - support };
}
export function parentalPayment(s: GameState, amount: number, label: string) {
  let remaining = amount;
  for (const r of s.relations.filter(
    (r) => r.alive && ["mother", "father", "parent"].includes(r.role),
  )) {
    const paid = Math.min(remaining, r.resources);
    r.resources -= paid;
    remaining -= paid;
  }
  const paid = amount - remaining;
  if (paid) {
    changeContext(s, "education", label);
    money(s, paid, label);
    addLog(
      s,
      `${label}. Nguồn trợ cấp còn lại đã giảm đúng số tiền này.`,
      "money",
    );
  }
  return paid;
}
export function chargeTuition(
  s: GameState,
  cost: number,
  label: string,
  loan: boolean,
  scholarship: boolean,
) {
  const q = tuitionQuote(s, cost, scholarship);
  parentalPayment(s, q.support, "Cha mẹ trợ cấp học phí");
  changeContext(s, "education", label);
  money(s, -(q.due + q.support), label, loan);
}
