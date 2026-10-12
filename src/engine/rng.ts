export function nextRandom(state: number): { state: number; value: number } {
  const next = (state + 0x6d2b79f5) >>> 0;
  let x = Math.imul(next ^ (next >>> 15), next | 1);
  x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
  return { state: next, value: ((x ^ (x >>> 14)) >>> 0) / 4294967296 };
}
export function random(state: { rng: number }): number {
  const next = nextRandom(state.rng);
  state.rng = next.state;
  return next.value;
}
export function pick<T>(state: { rng: number }, list: readonly T[]): T {
  if (!list.length) throw Error("Danh sách ngẫu nhiên trống.");
  return list[Math.floor(random(state) * list.length)];
}
