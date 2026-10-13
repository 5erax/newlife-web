import { describe, it, expect } from "vitest";
import { newLife, reduce } from "../src/engine/game";
import { apkEvents } from "../src/content/catalog";
import { eligibleEvents } from "../src/engine/year";
import { apkPresentation } from "../src/engine/apk";
import { parseSave, serialize } from "../src/engine/save";
import { apkEventAllowed, apkTripCompanions } from "../src/engine/apk";
import { createAsset } from "../src/engine/helpers";
import coverage from "../src/content/apk/coverage.json" with { type: "json" };

const adult = () => {
  const s = newLife({
    name: "An",
    gender: "female",
    hometown: "Huế",
    birthDate: "2000-01-01",
    seed: 42,
    contentMode: "apk",
  });
  s.age = 30;
  s.money = 100000000;
  return s;
};
describe("APK trip scenarios", () => {
  it("records the malformed native impact without guessing its sign", () => {
    expect(coverage.unverifiedEffects).toEqual([
      {
        table: "a16_outdoor-hiking-dumb-scenario-enc",
        record: 27,
        field: "Enjoyment Impact 1",
        raw: "1-",
        webValue: 0,
        status: "unverified_native_neutral_web_override",
      },
    ]);
    expect(
      apkEvents.find((e) => e.id === "apk_hike_27")!.choices[0].outcomes[0]
        .effects,
    ).toContainEqual({ stat: "happiness", delta: 0 });
  });
  it("excludes deceased pets from the menu, activity and save-import guards", () => {
    const s = adult();
    createAsset(s, "asset_thucung_02");
    const dog = s.assets[0];
    dog.alive = false;
    dog.condition = 30;
    expect(apkTripCompanions(s).some((p) => p.id === dog.instanceId)).toBe(
      false,
    );
    expect(() =>
      reduce(s, {
        type: "activity",
        id: "act_dulich_05",
        companionId: dog.instanceId,
      }),
    ).toThrow(/đồng hành/);
    s.pending = {
      event: apkEvents.find((e) => e.id === "apk_camp_4")!,
      instanceId: "trip_instance",
      templateSeed: 42,
      trip: { activityId: "act_dulich_05", companionId: dog.instanceId },
    };
    s.phase = "awaiting_choice";
    expect(() => parseSave(serialize(s))).toThrow(/Hoàn cảnh/);
  });
  it("opens an activity-specific choice and resumes the same year without another mortality roll or charge", () => {
    const start = adult();
    const s = reduce(start, { type: "activity", id: "act_dulich_05" });
    expect(s.pending?.event.apkRequirements?.trip).toBe("camp");
    expect(eligibleEvents(start).some((e) => e.group === "manual")).toBe(false);
    const view = apkPresentation(s);
    const restored = parseSave(serialize(s));
    expect(apkPresentation(restored)).toEqual(view);
    const end = reduce(restored, {
      type: "choose",
      instanceId: restored.pending!.instanceId,
      optionId: view.choices[0].id,
    });
    expect(end.phase).toBe("ready");
    expect(end.age).toBe(30);
    expect(end.time).toBe(9);
    expect(end.money).toBe(s.money);
    expect(start.time).toBe(12);
  });
  it("rejects a nonexistent companion before spending money or time, and preserves old web mode", () => {
    const s = adult();
    expect(() =>
      reduce(s, {
        type: "activity",
        id: "act_dulich_05",
        companionId: "missing",
      }),
    ).toThrow(/đồng hành/);
    expect(s.time).toBe(12);
    s.flags = s.flags.filter((f) => f !== "apk_mode");
    const end = reduce(s, { type: "activity", id: "act_dulich_05" });
    expect(end.pending).toBeNull();
    expect(end.phase).toBe("ready");
  });
  it("includes all 124 source rows and rejects forged trip context on import", () => {
    expect(apkEvents.filter((e) => e.apkRequirements?.trip)).toHaveLength(124);
    const s = reduce(adult(), { type: "activity", id: "act_dulich_05" });
    const bad = JSON.parse(serialize(s));
    bad.game.pending.trip.activityId = "act_dulich_04";
    expect(() => parseSave(JSON.stringify(bad))).toThrow();
    const old = adult();
    const oldFile = JSON.parse(serialize(old));
    oldFile.game.contentVersion = "1.2.0";
    const migrated = parseSave(JSON.stringify(oldFile));
    expect(migrated.rng).toBe(old.rng);
    expect(migrated.flags).toContain("apk_mode");
    expect(migrated.money).toBe(old.money);
  });
  it("resolves every trip row and choice, binds the companion, and preserves effects on reload", () => {
    const activity = {
      vacation: "act_dulich_08",
      cruise: "act_dulich_10",
      camp: "act_dulich_05",
      hike: "act_dulich_04",
    };
    for (const e of apkEvents.filter((e) => e.apkRequirements?.trip)) {
      const s = adult(),
        r = e.apkRequirements!;
      s.age = Math.max(s.age, e.minAge);
      s.relations.push({
        id: "trip_friend",
        name: "Bạn Chi",
        role: "friend",
        gender: "female",
        age: 30,
        alive: true,
        closeness: 50,
        trait: "bình dị",
        resources: 0,
        parents: [],
      });
      createAsset(s, "asset_thucung_02");
      let companionId: string | undefined;
      if (r.companions?.includes("friend")) companionId = "trip_friend";
      else if (r.companions?.some((c) => ["dog", "pet"].includes(c)))
        companionId = s.assets[0].instanceId;
      else if (r.companions?.includes("family"))
        companionId = s.relations[0].id;
      else if (r.companions?.includes("lover")) {
        s.relations.push({
          ...s.relations.at(-1)!,
          id: "trip_lover",
          name: "Người yêu Bảo",
          role: "lover",
        });
        companionId = "trip_lover";
      }
      const trip = {
        activityId: activity[r.trip!],
        ...(companionId ? { companionId } : {}),
      };
      expect(apkEventAllowed(s, e, trip), e.id).toBe(true);
      expect(apkEventAllowed(s, e), e.id + ": no context").toBe(false);
      s.pending = {
        event: e,
        instanceId: "trip_instance",
        templateSeed: 42,
        trip,
      };
      s.phase = "awaiting_choice";
      const view = apkPresentation(s);
      expect(JSON.stringify(view), e.id).not.toMatch(/<[^>]+>/);
      expect(apkPresentation(parseSave(serialize(s))), e.id).toEqual(view);
      for (const c of view.choices) {
        const end = reduce(s, {
          type: "choose",
          instanceId: "trip_instance",
          optionId: c.id,
        });
        expect(end.phase, e.id).toBe("ready");
        expect(end.pending).toBeNull();
        expect(() => parseSave(serialize(end)), e.id).not.toThrow();
        for (const effect of c.outcomes[0].effects) {
          if ("stat" in effect)
            expect(end.stats[effect.stat], c.id).toBe(
              Math.min(100, Math.max(0, s.stats[effect.stat] + effect.delta)),
            );
        }
      }
    }
  });
});
