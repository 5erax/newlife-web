import type { Delta, GameState } from "./types";

const contexts = new WeakMap<GameState, { source: string; reason: string; row?: number }>();
export function changeContext(s: GameState, source: string, reason: string) {
  contexts.set(s, {source, reason});
}
export function mergeDelta(list: Delta[], delta: Delta) {
  const existing = list.find(d => d.key === delta.key);
  if (existing) {
    existing.after += delta.after - delta.before;
    for (const reason of delta.reasons) if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
  } else list.push(structuredClone(delta));
}
export function recordChange(s: GameState, key: Delta["key"], before: number, after: number, reason?: string) {
  if (before === after) return;
  const context = contexts.get(s) ?? {source:"life", reason: s.log.at(-1)?.text ?? "Diễn biến cuộc đời"};
  contexts.set(s, context);
  const delta: Delta = {key, before, after, reasons:[reason ?? context.reason]};
  mergeDelta(s.lastDeltas, delta);
  mergeDelta(s.lastYearDeltas, delta);
  if (context.row === undefined) {
    context.row = s.log.length;
    s.log.push({id:`${s.id}_${s.actionSerial}_${s.log.length}`, age:s.age, kind:key === "money" ? "money" : "life", text:context.reason, source:context.source, deltas:[]});
  }
  mergeDelta(s.log[context.row].deltas, delta);
}
export function closeYear(s: GameState) {
  s.log.push({id:`${s.id}_${s.actionSerial}_${s.log.length}`, age:s.age, kind:"life", source:"summary", text:`Tổng kết tuổi ${s.age}`, deltas:structuredClone(s.lastYearDeltas)});
  s.lastYearDeltas = [];
}
