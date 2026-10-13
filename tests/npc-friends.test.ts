import { describe, it, expect } from "vitest";
import { newLife, reduce } from "../src/engine/game";
import { npcProfile, npcYear } from "../src/engine/npc";
import { apkFriend } from "../src/engine/apk";
import { apkEvents } from "../src/content/catalog";
import { parseSave, serialize } from "../src/engine/save";
import { advanceQueue } from "../src/engine/year";
import { apkPresentation } from "../src/engine/apk";
import type { Relation } from "../src/engine/types";
const options = {
  name: "An",
  gender: "female" as const,
  hometown: "Huế",
  birthDate: "2000-01-01",
  seed: 42,
  contentMode: "apk" as const,
};
const friend = (): Relation => ({
  id: "friend_test",
  name: "Chi",
  gender: "female",
  role: "friend",
  age: 30,
  closeness: 50,
  alive: true,
  trait: "bình dị",
  resources: 1000000,
  parents: [],
});
describe("NPC friends", () => {
  it("keeps a full imported NPC family within the save limit through later milestones", () => {
    const s = newLife(options),
      p = friend();
    p.age = 18;
    p.npc = { ...npcProfile(p), married: true, children: 250 };
    s.relations.push(p);
    for (let age = 19; age <= 60; age++) {
      p.age = age;
      npcYear(s, p);
    }
    expect(p.npc.children).toBe(250);
    expect(() => parseSave(serialize(s))).not.toThrow();
  });
  it("keeps school/work current during romance and does not replay past family milestones after separation", () => {
    let s = newLife(options);
    s.age = 30;
    const p = friend();
    p.age = 20;
    p.npc = { ...npcProfile(p), married: false, children: 0 };
    s.relations.push(p);
    s = reduce(s, { type: "relation", id: p.id, action: "date" });
    const love = s.relations.at(-1)!;
    for (let age = 21; age <= 30; age++) {
      love.age = age;
      npcYear(s, love);
    }
    expect(love.npc!.student).toBe(false);
    expect(love.npc!.employed).toBe(true);
    expect(love.npc!.married).toBe(false);
    expect(love.npc!.children).toBe(0);
    s = reduce(s, { type: "relation", id: p.id, action: "breakup" });
    const ex = s.relations.at(-1)!;
    expect(npcProfile(parseSave(serialize(s)).relations.at(-1)!)).toEqual(
      ex.npc,
    );
    ex.age = 75;
    ex.npc!.married = false;
    ex.npc!.children = 1;
    npcYear(s, ex);
    expect(ex.npc!.married).toBe(false);
    expect(ex.npc!.children).toBe(1);
  });
  it("upgrades 1.3 pending content without changing RNG and rejects malformed NPC attributes", () => {
    const s = newLife(options);
    s.age = 30;
    s.relations.push(friend());
    const oldEvent = apkEvents.find(
      (e) =>
        e.group === "apk_friend" &&
        !e.apkRequirements!.friendMinCraziness &&
        !e.apkRequirements!.friendJob &&
        !e.apkRequirements!.friendStudent &&
        !e.apkRequirements!.friendChild &&
        !e.apkRequirements!.friendMarried &&
        !e.apkRequirements!.friendEnemy &&
        e.minAge <= 30 &&
        e.maxAge >= 30 &&
        (e.apkRequirements!.friendMaxAge ?? 200) >= 30,
    )!;
    s.yearQueue = [oldEvent.id];
    advanceQueue(s);
    const data = JSON.parse(serialize(s));
    data.game.contentVersion = "1.3.0";
    const migrated = parseSave(JSON.stringify(data));
    expect(migrated.rng).toBe(s.rng);
    expect(migrated.money).toBe(s.money);
    expect(apkPresentation(migrated)).toEqual(apkPresentation(s));
    const valid = { ...npcProfile(friend()), children: 25 };
    migrated.relations.at(-1)!.npc = valid;
    expect(() => parseSave(serialize(migrated))).not.toThrow();
    for (const patch of [
      { craziness: -1 },
      { craziness: 101 },
      { children: -1 },
      { children: 251 },
      { enemy: 1 },
      { student: "yes" },
    ]) {
      const bad = JSON.parse(serialize(migrated));
      Object.assign(bad.game.relations.at(-1).npc, patch);
      expect(() => parseSave(JSON.stringify(bad))).toThrow();
    }
  });
  it("logs the first school milestone of a legacy friend without a saved NPC profile", () => {
    const s = newLife(options),
      p = friend();
    p.age = 6;
    npcYear(s, p);
    expect(p.npc!.student).toBe(true);
    expect(s.log.some((r) => r.text.includes("Chi bắt đầu học tập"))).toBe(
      true,
    );
  });
  it("ports all 37 source rows and binds Friend Impact to the matching person across reload", () => {
    const list = apkEvents.filter((e) => e.group === "apk_friend");
    expect(list).toHaveLength(37);
    for (const event of list) {
      const s = newLife(options),
        r = event.apkRequirements!;
      s.age = event.minAge;
      s.gender = r.gender === "any" ? "female" : r.gender;
      const matching = {
        ...friend(),
        id: "friend_matching",
        age: r.friendMinAge ?? s.age,
        gender:
          r.friendGender === "any" || !r.friendGender
            ? ("female" as const)
            : r.friendGender,
        npc: {
          craziness: r.friendMinCraziness ?? 50,
          employed: !!r.friendJob,
          student: !!r.friendStudent,
          children: r.friendChild ? 1 : 0,
          married: !!r.friendMarried,
          enemy: !!r.friendEnemy,
        },
      };
      s.relations.push(
        {
          ...friend(),
          id: "friend_other",
          npc: { ...matching.npc, enemy: !matching.npc.enemy },
        },
        matching,
      );
      s.yearQueue = [event.id];
      advanceQueue(s);
      const view = apkPresentation(s);
      expect(apkFriend(s, r)?.id, event.id).toBe(matching.id);
      if (event.text.includes("<friend"))
        expect(view.text, event.id).toContain(matching.name);
      const saved = parseSave(serialize(s));
      expect(apkPresentation(saved), event.id).toEqual(view);
      for (const choice of view.choices) {
        const result = reduce(saved, {
          type: "choose",
          instanceId: saved.pending!.instanceId,
          optionId: choice.id,
        });
        const delta = choice.outcomes[0].effects
          .filter((e) => "apkAttribute" in e && e.apkAttribute === "friend")
          .reduce((sum, e) => sum + ("delta" in e ? e.delta : 0), 0);
        expect(
          result.relations.find((p) => p.id === "friend_matching")!.closeness,
          choice.id,
        ).toBe(Math.min(100, Math.max(0, 50 + delta)));
        expect(
          result.relations.find((p) => p.id === "friend_other")!.closeness,
          choice.id,
        ).toBe(50);
        expect(() => parseSave(serialize(result)), choice.id).not.toThrow();
      }
    }
  });
  it("keeps an NPC's prior children after dating and separation", () => {
    let s = newLife(options);
    s.age = 30;
    const p = friend();
    p.npc = { ...npcProfile(p), married: false, children: 2 };
    s.relations.push(p);
    s = reduce(s, { type: "relation", id: p.id, action: "date" });
    s = reduce(s, { type: "relation", id: p.id, action: "breakup" });
    expect(npcProfile(s.relations.at(-1)!).children).toBe(2);
    expect(npcProfile(parseSave(serialize(s)).relations.at(-1)!).children).toBe(2);
  });
  it("preserves actual family history when an ex-spouse becomes a friend", () => {
    let s = newLife(options);
    s.age = 30;
    s.money = 10000000;
    s.relations.push({
      ...friend(),
      role: "spouse",
      npc: {
        craziness: 30,
        employed: true,
        student: false,
        children: 0,
        married: true,
        enemy: false,
      },
    });
    s = reduce(s, { type: "relation", id: "friend_test", action: "baby" });
    s = reduce(s, { type: "relation", id: "friend_test", action: "divorce" });
    const ex = s.relations.find((p) => p.id === "friend_test")!;
    expect(ex.role).toBe("friend");
    expect(npcProfile(ex).married).toBe(false);
    expect(npcProfile(ex).children).toBe(1);
  });
  it("initializes older friends deterministically without consuming gameplay RNG or changing web mode", () => {
    const s = newLife(options),
      p = friend(),
      before = s.rng;
    s.relations.push(p);
    const first = npcProfile(p);
    expect(npcProfile(p)).toEqual(first);
    expect(p.npc).toBeUndefined();
    const restored = parseSave(serialize(s));
    expect(npcProfile(restored.relations.at(-1)!)).toEqual(first);
    expect(restored.rng).toBe(before);
    s.flags = s.flags.filter((f) => f !== "apk_mode");
    npcYear(s, p);
    expect(p.npc).toBeUndefined();
    expect(s.rng).toBe(before);
  });
  it("checks every source friend attribute against the same living person", () => {
    const s = newLife(options),
      p = friend(),
      req = {
        ...apkEvents.find((e) => e.group === "apk_friend")!.apkRequirements!,
        friendMinAge: 18,
        friendMaxAge: 100,
        friendMinCraziness: 60,
        friendJob: true,
        friendStudent: true,
        friendChild: true,
        friendMarried: true,
        friendEnemy: true,
      };
    p.npc = {
      craziness: 60,
      employed: true,
      student: true,
      children: 1,
      married: true,
      enemy: true,
    };
    s.relations.push(p);
    expect(apkFriend(s, req)?.id).toBe(p.id);
    for (const [field, value] of [
      ["craziness", 59],
      ["employed", false],
      ["student", false],
      ["children", 0],
      ["married", false],
      ["enemy", false],
    ] as const) {
      const changed = structuredClone(s);
      Object.assign(changed.relations.at(-1)!.npc!, { [field]: value });
      expect(apkFriend(changed, req), field).toBeUndefined();
    }
    p.alive = false;
    expect(apkFriend(s, req)).toBeUndefined();
  });
  it("declares hostility, blocks dating/support and reconciles only after rebuilding closeness", () => {
    const original = newLife(options);
    original.age = 30;
    original.relations.push(friend());
    let s = reduce(original, {
      type: "friendship",
      id: "friend_test",
      action: "declareEnemy",
    });
    expect(npcProfile(s.relations.at(-1)!).enemy).toBe(true);
    expect(s.time).toBe(11);
    expect(original.time).toBe(12);
    expect(() =>
      reduce(s, { type: "relation", id: "friend_test", action: "date" }),
    ).toThrow(/thù địch/);
    expect(() =>
      reduce(s, { type: "relation", id: "friend_test", action: "support" }),
    ).toThrow(/thù địch/);
    expect(() =>
      reduce(s, { type: "friendship", id: "friend_test", action: "reconcile" }),
    ).toThrow(/40/);
    s.relations.at(-1)!.closeness = 40;
    s = reduce(s, {
      type: "friendship",
      id: "friend_test",
      action: "reconcile",
    });
    expect(npcProfile(parseSave(serialize(s)).relations.at(-1)!).enemy).toBe(
      false,
    );
    expect(() =>
      reduce(s, {
        type: "friendship",
        id: original.relations[0].id,
        action: "declareEnemy",
      }),
    ).toThrow();
  });
  it("updates school/work/family over years while preserving hostility and consuming no random draws", () => {
    const s = newLife(options),
      p = friend();
    p.age = 10;
    p.npc = { ...npcProfile(p), craziness: 80, enemy: true };
    const before = s.rng;
    expect(p.npc.student).toBe(true);
    for (let age = 11; age <= 75; age++) {
      p.age = age;
      npcYear(s, p);
    }
    expect(p.npc.student).toBe(false);
    expect(p.npc.employed).toBe(false);
    expect(p.npc.enemy).toBe(true);
    expect(p.npc.craziness).toBe(80);
    expect(s.rng).toBe(before);
  });
});
