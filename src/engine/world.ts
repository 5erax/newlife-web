import names from "../content/names.json" with { type: "json" };
import type { GameState } from "./types";
import { pick, random } from "./rng";

export const origins = names.regions;
export const originById = new Map(origins.map((o) => [o.id, o]));
export const FAMILY_LABELS = {
  poor: "Nghèo",
  middle: "Trung bình",
  comfortable: "Khá giả",
  rich: "Giàu",
};
export function drawOrigin(s: { rng: number }, vietnamBias = false) {
  let value =
    random(s) *
    origins.reduce(
      (n, o) =>
        n + o.populationWeight * (o.id === "vn" && vietnamBias ? 20 : 1),
      0,
    );
  return origins.find(
    (o) =>
      (value -= o.populationWeight * (o.id === "vn" && vietnamBias ? 20 : 1)) <
      0,
  )!.id;
}
export function regionalName(
  s: { rng: number },
  origin: string,
  gender: GameState["gender"],
  surname?: string,
) {
  const region = originById.get(origin)!;
  const family = pick(s, region.surnames),
    given = pick(s, gender === "other" ? region.neutral : region[gender]);
  const last = surname ?? family;
  if (origin === "vn") {
    const middles = names.middles[gender === "male" ? "male" : "female"];
    return `${last} ${gender === "other" ? "" : middles[s.rng % middles.length] + " "}${given}`;
  }
  return region.surnameFirst ? `${last} ${given}` : `${given} ${last}`;
}
export const economicScale = (s: Pick<GameState, "origin">) =>
  originById.get(s.origin)!.wealthIndex;
export const localPrice = (s: Pick<GameState, "origin">, value: number) =>
  Math.round(value * economicScale(s));
