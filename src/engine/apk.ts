import type { GameState, LifeEvent, ApkEventRequirements } from "./types";
import { random, pick } from "./rng";
import { originById, origins, regionalName, localPrice } from "./world";
import { requireGame } from "./helpers";
import { assetById } from "../content/catalog";
import { npcProfile } from "./npc";

export const APK_TRIPS: Record<
  string,
  NonNullable<ApkEventRequirements["trip"]>
> = {
  act_dulich_04: "hike",
  act_dulich_05: "camp",
  act_dulich_08: "vacation",
  act_dulich_10: "cruise",
};
export function apkTripCompanions(s: GameState) {
  return [
    ...s.relations
      .filter((p) => p.alive && (p.role !== "friend" || !npcProfile(p).enemy))
      .map((p) => ({
        id: p.id,
        name: p.name,
        kind:
          p.role === "friend"
            ? "friend"
            : ["lover", "spouse"].includes(p.role)
              ? "lover"
              : "family",
      })),
    ...s.assets
      .filter(
        (a) =>
          a.alive &&
          assetById.get(a.catalogId)?.category === "pet" &&
          a.condition > 0,
      )
      .map((a) => ({
        id: a.instanceId,
        name: assetById.get(a.catalogId)!.name,
        kind: a.catalogId === "asset_thucung_02" ? "dog" : "pet",
      })),
  ];
}

export function apkFriend(s: GameState, r: ApkEventRequirements) {
  return s.relations.find((p) => {
    if (
      !p.alive ||
      p.role !== "friend" ||
      p.age < (r.friendMinAge ?? 0) ||
      p.age > (r.friendMaxAge ?? 200) ||
      (r.friendGender &&
        r.friendGender !== "any" &&
        p.gender !== r.friendGender)
    )
      return false;
    const npc = npcProfile(p);
    return (
      npc.craziness >= (r.friendMinCraziness ?? 0) &&
      (!r.friendJob || npc.employed) &&
      (!r.friendStudent || npc.student) &&
      (!r.friendChild || npc.children > 0) &&
      (!r.friendMarried || npc.married) &&
      npc.enemy === (r.friendEnemy ?? false)
    );
  });
}
export function apkEventAllowed(
  s: GameState,
  e: LifeEvent,
  trip = s.pending?.trip,
) {
  if (e.sourceKind !== "apk_translation") return true;
  const r = e.apkRequirements;
  if (!r || !s.flags.includes("apk_mode")) return false;
  if (r.trip) {
    if (!trip || APK_TRIPS[trip.activityId] !== r.trip || e.group !== "manual")
      return false;
    const companion = apkTripCompanions(s).find(
      (p) => p.id === trip.companionId,
    );
    if (trip.companionId && !companion) return false;
    if (
      r.companions &&
      (!companion ||
        !r.companions.some(
          (kind) =>
            kind === companion.kind ||
            (kind === "pet" && companion.kind === "dog"),
        ))
    )
      return false;
  } else if (trip) return false;
  const parents = s.relations.filter(
    (p) => p.alive && ["mother", "father", "parent"].includes(p.role),
  );
  const lover = s.relations.find(
    (p) => p.alive && ["lover", "spouse"].includes(p.role),
  );
  return (
    (r.gender === "any" || r.gender === s.gender) &&
    (!r.student || !!s.education.current) &&
    (!r.job || !!s.job) &&
    (!r.parents || parents.length >= 2) &&
    (!r.parent || parents.length > 0) &&
    (!r.lover || !!lover) &&
    (!r.noLover || !lover) &&
    (r.loverGender === "any" || lover?.gender === r.loverGender) &&
    (!r.friend || !!apkFriend(s, r)) &&
    (!r.orphan || parents.length === 0) &&
    (r.prison ? s.prisonYears > 0 : s.prisonYears === 0) &&
    (!r.careerId || s.job?.id === r.careerId)
  );
}

// shortcut: vocabulary and neutral pronouns use the web world's names; expand when native tag resolution is verified.
export function apkPresentation(s: GameState) {
  const pending = s.pending;
  requireGame(pending, "Không có sự kiện đang chờ.");
  if (pending.event.sourceKind !== "apk_translation") return pending.event;
  requireGame(
    Number.isInteger(pending.templateSeed),
    "Thiếu seed của nội dung Việt hóa.",
  );
  const rng = { rng: pending.templateSeed! };
  const companion = apkTripCompanions(s).find(
    (p) => p.id === pending.trip?.companionId,
  );
  const parent = s.relations.find(
    (p) => p.alive && ["mother", "father", "parent"].includes(p.role),
  );
  const friend = apkFriend(s, pending.event.apkRequirements!);
  const lover = s.relations.find(
    (p) => p.alive && ["lover", "spouse"].includes(p.role),
  );
  const values: Record<string, string> = {
    "hero-name": s.name,
    city: s.hometown,
    country: originById.get(s.origin)!.label,
    "country-other": pick(
      rng,
      origins.filter((o) => o.id !== s.origin),
    ).label,
    parent: parent?.name ?? "cha mẹ",
    "parent-possessive": parent?.name ?? "cha mẹ",
    friend: friend?.name ?? "người bạn",
    "friend-possessive": friend?.name ?? "người bạn",
    lover: lover?.name ?? "người yêu",
    "lover-possessive": lover?.name ?? "người yêu",
    teacher: "giáo viên của bạn",
    classmate: "một người bạn cùng lớp",
    coworker: "một đồng nghiệp",
    "co-worker": "một đồng nghiệp",
    "random-first-name-male": regionalName(rng, s.origin, "male"),
    "random-first-name-female": regionalName(rng, s.origin, "female"),
    "random-person": regionalName(rng, s.origin, "other"),
    "random-person-indefinite": "một người lạ",
    musician: "một nhạc sĩ",
    "musician-indefinite": "một nhạc sĩ",
    celebrity: "một ngôi sao nổi tiếng",
    "celebrity-female": "một nữ ngôi sao",
    "celebrity-male": "một nam ngôi sao",
    "body-part": pick(rng, ["cánh tay", "chân", "vai"]),
    "car-type": pick(rng, ["xe thể thao", "xe gia đình", "xe bán tải"]),
    restaurant: pick(rng, [
      "một quán ăn gần nhà",
      "một nhà hàng ven sông",
      "một quán cà phê",
    ]),
    action: pick(rng, ["hát thật to", "nhảy múa", "kể chuyện cười"]),
    "circumstance-public": pick(rng, [
      "đang đi dạo",
      "đang mua sắm",
      "đang chờ xe buýt",
    ]),
    drug: "một chất kích thích",
    "drug-illegal": "một chất cấm",
    insult: "đồ ngốc",
    pronoun: "người ấy",
    "outdoor-companion": companion?.name ?? "người đồng hành",
    "outdoor-location":
      pending.trip?.activityId === "act_dulich_04"
        ? "đường mòn trên núi"
        : "khu cắm trại",
    "vacation-destination": "điểm đến của chuyến du lịch",
    "vacation-cruise": "chuyến du lịch bằng tàu biển",
    pet: companion?.name ?? "thú cưng",
    " pet": companion?.name ?? "thú cưng",
    alcohol: "đồ uống có cồn",
    rb: "",
    rb1: "",
    rb2: "",
  };
  let alternatives = 0;
  function render(text: string): string {
    let output = "";
    for (let offset = 0; offset < text.length; ) {
      if (text[offset] !== "<") {
        output += text[offset++];
        continue;
      }
      const start = ++offset;
      let depth = 1;
      while (offset < text.length && depth) {
        if (text[offset] === "<") depth++;
        if (text[offset] === ">") depth--;
        offset++;
      }
      requireGame(depth === 0, "Biến nội dung chưa đóng.");
      const tag = text.slice(start, offset - 1),
        parts: string[] = [];
      let from = 0,
        nested = 0;
      for (let i = 0; i < tag.length; i++) {
        if (tag[i] === "<") nested++;
        else if (tag[i] === ">") nested--;
        else if (tag[i] === "/" && !nested) {
          parts.push(tag.slice(from, i));
          from = i + 1;
        }
      }
      parts.push(tag.slice(from));
      if (parts.length > 1) {
        const chosen = render(pick(rng, parts));
        alternatives++;
        if (alternatives === 1) values.rb = values.rb1 = chosen;
        values[`rb${alternatives}`] = chosen;
        output += chosen;
        continue;
      }
      if (/^(num|currency)\d+-\d+$/.test(tag)) {
        if (!(tag in values)) {
          const [, type, lo, hi] = /^(num|currency)(\d+)-(\d+)$/.exec(tag)!;
          const value =
            Number(lo) +
            Math.floor(random(rng) * (Number(hi) - Number(lo) + 1));
          values[tag] =
            type === "currency"
              ? localPrice(s, value * 1000).toLocaleString("vi-VN") +
                " đơn vị tiền game"
              : String(value);
        }
        output += values[tag];
        continue;
      }
      requireGame(
        tag in values && !!values[tag],
        `Chưa hỗ trợ biến nội dung ${tag}.`,
      );
      output += values[tag];
    }
    return output.replace(/\s+([.,!?;:])/g, "$1").trim();
  }
  const event = pending.event;
  return {
    ...event,
    text: render(event.text),
    choices: event.choices.map((c) => ({
      ...c,
      label: render(c.label),
      outcomes: c.outcomes.map((o) => ({ ...o, text: render(o.text) })),
    })),
  };
}
