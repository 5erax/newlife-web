import assert from "node:assert/strict";
import type { Condition, Choice, LifeEvent } from "../engine/types";
import { expandCases } from "../engine/branches";
import { events, eventById } from "../content/catalog";
import { originById } from "../engine/world";

export function simpleImpossible(conditions: Condition[]): boolean {
  const flat = conditions.flatMap((c) => ("all" in c ? c.all : [c]));
  const flags = new Map<string, boolean>(),
    origins = new Set<string>();
  const bounds = new Map<
    string,
    { low: number; high: number; exclude: Set<number> }
  >();
  for (const c of flat) {
    if ("origin" in c) {
      origins.add(c.origin);
      if (!originById.has(c.origin)) return true;
    }
    if ("flag" in c) {
      if (flags.has(c.flag) && flags.get(c.flag) !== c.is) return true;
      flags.set(c.flag, c.is);
    }
    if ("field" in c) {
      const b = bounds.get(c.field) ?? {
        low: ["health", "looks", "intelligence", "happiness", "age"].includes(
          c.field,
        )
          ? 0
          : -Infinity,
        high: ["health", "looks", "intelligence", "happiness"].includes(c.field)
          ? 100
          : c.field === "age"
            ? 150
            : Infinity,
        exclude: new Set<number>(),
      };
      if (c.op === ">=") b.low = Math.max(b.low, c.value);
      if (c.op === ">") b.low = Math.max(b.low, c.value + 1);
      if (c.op === "<=") b.high = Math.min(b.high, c.value);
      if (c.op === "<") b.high = Math.min(b.high, c.value - 1);
      if (c.op === "==") {
        b.low = Math.max(b.low, c.value);
        b.high = Math.min(b.high, c.value);
      }
      if (c.op === "!=") b.exclude.add(c.value);
      bounds.set(c.field, b);
    }
  }
  return (
    origins.size > 1 ||
    [...bounds.values()].some(
      (b) => b.low > b.high || (b.low === b.high && b.exclude.has(b.low)),
    )
  );
}
export function analyzeEvent(event: LifeEvent) {
  let leaves = 0,
    nested = false,
    maxDepth = 0;
  const caseKeys: string[] = [];
  function visit(
    choices: Choice[],
    path: { choiceId: string; caseIndex: number }[],
    depth: number,
  ) {
    assert(depth <= 32, `${event.id}: excessive depth`);
    maxDepth = Math.max(maxDepth, depth);
    assert(choices.length >= 2, `${event.id}: fewer than two choices`);
    assert(
      new Set(choices.map((c) => c.id)).size === choices.length,
      `${event.id}: duplicate choices`,
    );
    assert(
      choices.some((c) => !c.conditions?.length),
      `${event.id}: all choices conditional`,
    );
    for (const choice of choices) {
      const cases = expandCases(choice);
      assert(
        choice.cases && choice.cases.length >= 2 && choice.cases.length <= 5,
        `${event.id}/${choice.id}: expected 2–5 authored cases`,
      );
      assert(
        cases.some((o) => !o.requires?.length),
        `${event.id}/${choice.id}: no unconditional outcome`,
      );
      assert(
        !simpleImpossible(choice.conditions ?? []),
        `${event.id}: impossible choice`,
      );
      cases.forEach((o, index) => {
        assert(o.weight > 0 && Number.isFinite(o.weight));
        assert(
          !simpleImpossible(o.requires ?? []),
          `${event.id}: impossible case`,
        );
        const key = [
          event.id,
          ...path.map((p) => p.choiceId + "_" + p.caseIndex),
          choice.id,
          index,
        ].join("_");
        caseKeys.push(key);
        if (o.nextEvent)
          assert(eventById.has(o.nextEvent), `${key}: unknown nextEvent`);
        if (o.schedule)
          assert(eventById.has(o.schedule.eventId), `${key}: unknown schedule`);
        if (o.choices) {
          nested = true;
          visit(
            o.choices,
            [...path, { choiceId: choice.id, caseIndex: index }],
            depth + 1,
          );
        } else {
          leaves++;
          assert(
            o.effects.some((e) => "stat" in e) || o.nextEvent || o.schedule,
            `${key}: no effect or next step`,
          );
        }
      });
    }
  }
  visit(event.choices, [], 1);
  return { id: event.id, leaves, paths: leaves, maxDepth, nested, caseKeys };
}
export function branchStats() {
  const trees = events.map(analyzeEvent),
    chains = new Map<string, LifeEvent[]>();
  for (const e of events)
    if (e.chainId) {
      const list = chains.get(e.chainId) ?? [];
      list.push(e);
      chains.set(e.chainId, list);
    }
  assert(chains.size >= 20, "At least 20 chains required");
  for (const [id, list] of chains) {
    list.sort((a, b) => a.stage! - b.stage!);
    assert(list.length >= 3 && list.length <= 8);
    assert(
      list.every((e, i) => e.stage === i + 1),
      `${id}: stages discontinuous`,
    );
    assert(list.at(-1)?.chainEnd, `${id}: missing end`);
    function transitions(
      choices: Choice[],
      previous: string[] = [],
    ): string[][] {
      return choices.flatMap((c) =>
        expandCases(c).flatMap((o) => {
          const next = [
            ...previous,
            ...(o.schedule ? [o.schedule.eventId] : []),
            ...(o.nextEvent ? [o.nextEvent] : []),
          ];
          return o.choices ? transitions(o.choices, next) : [next];
        }),
      );
    }
    list.forEach((e, i) => {
      const paths = transitions(e.choices);
      if (i === list.length - 1)
        assert(
          paths.every((p) => !p.length),
          `${id}: ending continues`,
        );
      else
        assert(
          paths.every(
            (next) =>
              next.length &&
              next.every(
                (n) => list.find((x) => x.id === n)?.stage! > e.stage!,
              ),
          ),
          `${id}: path without forward exit`,
        );
    });
  }
  const averageLeaves = trees.reduce((n, t) => n + t.leaves, 0) / trees.length,
    nestedPercent = (100 * trees.filter((t) => t.nested).length) / trees.length;
  assert(averageLeaves >= 6);
  assert(nestedPercent >= 30);
  return {
    averageLeaves: Number(averageLeaves.toFixed(2)),
    nestedPercent: Number(nestedPercent.toFixed(2)),
    maxDepth: Math.max(...trees.map((t) => t.maxDepth)),
    chains: chains.size,
    trees,
  };
}
