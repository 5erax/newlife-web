import type { GameState, Effect } from "./types";
import { stat, money, count, flag, relation, requireGame } from "./helpers";
import { operate } from "./relations";
export function applyEffects(s: GameState, list: Effect[], targetId?: string) {
  for (const e of list) {
    if ("apkAttribute" in e) {
      if (e.apkAttribute === "job") {
        requireGame(s.job, "Cần đang làm đúng nghề của tình huống.");
        s.job.performance = Math.max(
          0,
          Math.min(100, s.job.performance + e.delta),
        );
      } else if (e.apkAttribute === "friend") {
        const target = relation(s, targetId, ["friend"]);
        requireGame(target, "Người bạn của tình huống không còn phù hợp.");
        target.closeness = Math.max(
          0,
          Math.min(100, target.closeness + e.delta),
        );
      } else {
        const key = "apk_" + e.apkAttribute;
        s.counters[key] = Math.max(
          0,
          Math.min(100, (s.counters[key] ?? 50) + e.delta),
        );
      }
    } else if ("modifier" in e) {
      s.modifiers = s.modifiers.filter((m) => m.id !== e.modifier.id);
      requireGame(s.modifiers.length < 40, "Đã có quá nhiều hậu quả kéo dài.");
      s.modifiers.push(structuredClone(e.modifier));
    } else if ("stat" in e) stat(s, e.stat, e.delta);
    else if ("money" in e) money(s, e.money, "Hậu quả lựa chọn", true);
    else if ("counter" in e) count(s, e.counter, e.delta);
    else if ("flag" in e) flag(s, e.flag, e.set);
    else if ("relation" in e) {
      const target =
        e.relation.role === "target"
          ? relation(s, targetId)
          : relation(s, undefined, [e.relation.role]);
      requireGame(target, "Người liên quan không còn phù hợp.");
      target.closeness = Math.max(
        0,
        Math.min(100, target.closeness + e.relation.delta),
      );
    } else if ("operation" in e) operate(s, e.operation, e.value, targetId);
    else if ("award" in e) {
      if (!s.medals.includes(e.award)) s.medals.push(e.award);
    } else if ("death" in e) {
      s.deathCause = e.death;
      s.phase = "dead";
      break;
    }
  }
}
