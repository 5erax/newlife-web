import type { GameState, Condition, Outcome } from "./types";
import { assetById } from "../content/catalog";
import { metric, requireGame } from "./helpers";
import { random } from "./rng";
export function meets(s: GameState, c: Condition): boolean {
  if ("all" in c) return c.all.every((x) => meets(s, x));
  if ("any" in c) return c.any.some((x) => meets(s, x));
  if ("not" in c) return !meets(s, c.not);
  if ("flag" in c) return s.flags.includes(c.flag) === c.is;
  if ("has" in c) {
    switch (c.has) {
      case "job":
        return !!s.job && (c.id === "any" || s.job.id === c.id);
      case "education":
        return s.education.completed.includes(c.id);
      case "asset":
        return s.assets.some(
          (a) =>
            a.alive &&
            (c.id === "any" ||
              a.catalogId === c.id ||
              assetById.get(a.catalogId)?.category === c.id),
        );
      case "illness":
        return s.illnesses.some(
          (i) => c.id === "any" || i.type === c.id || i.id === c.id,
        );
      case "role":
        return s.relations.some((r) => r.alive && r.role === c.id);
    }
  }
  const n = metric(s, c.field);
  switch (c.op) {
    case ">=":
      return n >= c.value;
    case "<=":
      return n <= c.value;
    case ">":
      return n > c.value;
    case "<":
      return n < c.value;
    case "==":
      return n === c.value;
    case "!=":
      return n !== c.value;
  }
}
export const eligible = (s: GameState, list: Condition[] = []) =>
  list.every((c) => meets(s, c));
export function chooseOutcome(s: GameState, list: Outcome[]): Outcome {
  requireGame(
    list.length && Math.abs(list.reduce((n, o) => n + o.chance, 0) - 1) < 1e-8,
    "Xác suất nội dung không hợp lệ.",
  );
  let value = random(s);
  for (const item of list) {
    value -= item.chance;
    if (value < 0) return item;
  }
  return list[list.length - 1];
}
