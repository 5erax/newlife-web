import rawPools from "../content/pools/daily.json" with { type: "json" };
import { caseOutcomeSchema } from "../schema/content";
import type { Choice, CaseOutcome, GameState } from "./types";
import { eligible } from "./conditions";
import { random } from "./rng";
import { requireGame } from "./helpers";

export const pools: Record<string, CaseOutcome[]> = Object.fromEntries(
  Object.entries(rawPools).map(([id, list]) => [
    id,
    list.map((c) => caseOutcomeSchema.parse(c)),
  ]),
);
export function expandCases(choice: Choice): CaseOutcome[] {
  return (choice.cases ?? []).flatMap((c) => {
    if (!("pool" in c)) return [c];
    requireGame(pools[c.pool], `Không có kho trường hợp ${c.pool}.`);
    const total = pools[c.pool].reduce((n, p) => n + p.weight, 0);
    return pools[c.pool].map((p) => ({
      ...p,
      weight: (c.weight * p.weight) / total,
    }));
  });
}
export const pendingChoices = (pending: NonNullable<GameState["pending"]>) =>
  pending.node?.choices ?? pending.event.choices;
export const pendingText = (pending: NonNullable<GameState["pending"]>) =>
  pending.node?.text ?? pending.event.text;
export function chooseCase(s: GameState, choice: Choice) {
  const list = expandCases(choice)
    .map((outcome, index) => ({ outcome, index }))
    .filter((c) => eligible(s, c.outcome.requires));
  requireGame(list.length, "Không có trường hợp phù hợp với hoàn cảnh.");
  let value = random(s) * list.reduce((n, c) => n + c.outcome.weight, 0);
  const selected =
    list.find((c) => (value -= c.outcome.weight) < 0) ?? list.at(-1)!;
  const text = selected.outcome.variants
    ? selected.outcome.variants[
        Math.floor(random(s) * selected.outcome.variants.length)
      ]
    : selected.outcome.text;
  return { ...selected, text };
}
export function resolvedNode(pending: NonNullable<GameState["pending"]>) {
  let choices = pending.event.choices,
    node: CaseOutcome | undefined;
  for (const step of pending.node?.path ?? []) {
    const choice = choices.find((c) => c.id === step.choiceId);
    requireGame(choice, "Đường đi sự kiện không tồn tại.");
    node = expandCases(choice)[step.caseIndex];
    requireGame(node?.choices, "Đường đi không dẫn đến lựa chọn tiếp.");
    choices = node.choices;
  }
  return node;
}
