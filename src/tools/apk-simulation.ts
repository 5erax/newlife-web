import { simulateLife } from "./simulate";
import { validateState } from "../engine/save";
import assert from "node:assert/strict";
const total = Number(process.argv[2] ?? 1000);
assert(Number.isInteger(total) && total > 0 && total <= 100000);
const seen = new Set<string>();
let sourceOccurrences = 0,
  totalAge = 0;
for (let seed = 1; seed <= total; seed++) {
  const s = simulateLife(seed, seed % 4, "apk");
  validateState(s);
  assert.equal(s.phase, "dead");
  for (const [id, h] of Object.entries(s.history))
    if (id.startsWith("apk_")) {
      seen.add(id);
      sourceOccurrences += h.count;
    }
  totalAge += s.age;
}
console.log(
  JSON.stringify(
    {
      lives: total,
      strategies: 4,
      failures: 0,
      sourceEventsSeen: seen.size,
      sourceOccurrences,
      averageAge: totalAge / total,
    },
    null,
    2,
  ),
);
