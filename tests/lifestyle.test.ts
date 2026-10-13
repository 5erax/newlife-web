import { describe, it, expect } from "vitest";
import { newLife, reduce } from "../src/engine/game";
import { activities } from "../src/content/catalog";
import { serialize, parseSave } from "../src/engine/save";
import { regionalName, origins } from "../src/engine/world";
import { Avatar } from "../src/ui/components/Avatar";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { tuitionQuote } from "../src/engine/tuition";
import { educationById } from "../src/content/catalog";
const fixture = () => {
  const s = newLife({
    name: "An",
    gender: "female",
    hometown: "Huế",
    birthDate: "2000-01-01",
    seed: 42,
  });
  s.age = 25;
  s.money = 100000000;
  s.fame = 70;
  return s;
};
describe("Vietnamese lifestyle and identities", () => {
  it("contains all requested activities, instruments and martial arts", () => {
    for (const [group, count] of [
      ["danhvong", 5],
      ["tinhyeu", 6],
      ["tamtri", 14],
      ["salon", 6],
    ] as const)
      expect(activities.filter((a) => a.group === group)).toHaveLength(count);
    const instrument = activities.find(
        (a) => a.id === "act_instrument",
      )!.feature!,
      martial = activities.find((a) => a.id === "act_martial")!.feature!;
    expect("options" in instrument && instrument.options).toHaveLength(25);
    expect("options" in martial && martial.options).toHaveLength(6);
  });
  it("retains separate practice skills and visible hair choices after reload", () => {
    let s = fixture();
    s = reduce(s, {
      type: "activity",
      id: "act_instrument",
      optionId: "violin",
    });
    s = reduce(s, {
      type: "activity",
      id: "act_instrument",
      optionId: "piano",
    });
    expect(s.skills.violin).toBeGreaterThan(0);
    expect(s.skills.piano).toBeGreaterThan(0);
    s = reduce(s, { type: "activity", id: "act_dye", optionId: "blue" });
    s = reduce(s, { type: "activity", id: "act_stylist", optionId: "curly" });
    const restored = parseSave(serialize(s));
    expect(restored.appearance.hairColor).toBe("blue");
    expect(restored.appearance.hairStyle).toBe("curly");
    expect(
      renderToStaticMarkup(
        createElement(Avatar, {
          gender: s.gender,
          age: s.age,
          appearance: s.appearance,
        }),
      ),
    ).toContain("#366eb5");
  });
  it("keeps adult dating choices and consent through reload without duplicate partners", () => {
    const s = fixture();
    let offer = reduce(s, { type: "activity", id: "act_love_lgbtq" });
    expect(
      offer.loveOffer!.people.every(
        (p) => p.age >= 18 && p.gender === "female",
      ),
    ).toBe(true);
    offer = parseSave(serialize(offer));
    expect(() => reduce(offer, { type: "age" })).toThrow();
    const id = offer.loveOffer!.id;
    const accepted = offer.loveOffer!.consent.every(Boolean);
    const result = reduce(offer, { type: "loveResolve", id, accept: accepted });
    expect(result.loveOffer).toBeNull();
    expect(() =>
      reduce(result, { type: "loveResolve", id, accept: true }),
    ).toThrow();
    s.age = 17;
    expect(() =>
      reduce(s, { type: "activity", id: "act_love_hookup" }),
    ).toThrow();
    expect(() =>
      reduce(s, { type: "activity", id: "act_love_threesome" }),
    ).toThrow();
  });
  it("has no name/gender/avatar or parent-role mismatches across 10000 regional births", () => {
    let mismatches = 0;
    for (let i = 0; i < 10000; i++) {
      const region = origins[i % origins.length],
        gender = (["male", "female", "other"] as const)[i % 3],
        rng = { rng: (i * 7919) >>> 0 },
        name = regionalName(rng, region.id, gender);
      const list = gender === "other" ? region.neutral : region[gender];
      if (!list.some((n) => name.split(" ").includes(n))) mismatches++;
      const s = newLife({
        name,
        gender,
        origin: region.id,
        hometown: region.hometown,
        birthDate: "2000-01-01",
        seed: (i * 7919) >>> 0,
      });
      if (
        !renderToStaticMarkup(
          createElement(Avatar, { age: 22, gender: s.gender }),
        ).includes(`data-gender="${gender}"`)
      )
        mismatches++;
      for (const r of s.relations) {
        if (
          (r.role === "mother" && r.gender !== "female") ||
          (r.role === "father" && r.gender !== "male")
        )
          mismatches++;
        if (
          !r.gender ||
          !region[r.gender === "other" ? "neutral" : r.gender].some((n) =>
            r.name.split(" ").includes(n),
          )
        )
          mismatches++;
      }
    }
    expect(mismatches).toBe(0);
  }, 30000);
  it("tuition support consumes living parents' real resources once and stops when exhausted", () => {
    let s = fixture();
    s.age = 18;
    s.education.completed = [
      "edu_primary",
      "edu_lower_secondary",
      "edu_upper_secondary",
    ];
    s.education.score = 70;
    s.familyWealth = "rich";
    s.tuitionRatio = 1;
    s.flags.push("tuition_support");
    s.relations.forEach((r) => (r.resources = 50000000));
    const quote = tuitionQuote(
        s,
        educationById.get("edu_university")!.cost,
        false,
      ),
      before = s.relations
        .filter((r) => ["mother", "father"].includes(r.role))
        .reduce((n, r) => n + r.resources, 0);
    s = reduce(s, {
      type: "enroll",
      id: "edu_university",
      specialty: "congnghe",
    });
    expect(
      before -
        s.relations
          .filter((r) => ["mother", "father"].includes(r.role))
          .reduce((n, r) => n + r.resources, 0),
    ).toBe(quote.support);
    s.relations.forEach((r) => (r.resources = 0));
    expect(tuitionQuote(s, 24000000, false).support).toBe(0);
    s.relations.forEach((r) => (r.alive = false));
    expect(tuitionQuote(s, 24000000, false).support).toBe(0);
  });
});
