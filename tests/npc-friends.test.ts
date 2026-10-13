import { describe, it, expect } from "vitest";
import { newLife, reduce } from "../src/engine/game";
import { npcProfile, npcYear } from "../src/engine/npc";
import { apkFriend } from "../src/engine/apk";
import { apkEvents } from "../src/content/catalog";
import { parseSave, serialize } from "../src/engine/save";
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
