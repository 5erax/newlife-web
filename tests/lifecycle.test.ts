import { describe, it, expect } from "vitest";
import { newLife, reduce } from "../src/engine/game";
import { education, events } from "../src/content/catalog";
import { eligible } from "../src/engine/conditions";
import { operate } from "../src/engine/relations";
import { startYear, finishLife, advanceQueue } from "../src/engine/year";
import { parseSave, serialize } from "../src/engine/save";
const settle = (s: ReturnType<typeof newLife>) => {
  for (let i = 0; s.pending && i < 32; i++)
    s = reduce(s, {
      type: "choose",
      instanceId: s.pending.instanceId,
      optionId: s.pending.event.choices.find((c) => eligible(s, c.conditions))!
        .id,
    });
  return s;
};
describe("complete life traces and recovery", () => {
  it("studies, works, buys a home, starts a family and continues another generation", () => {
    let s = newLife({
      name: "An",
      gender: "female",
      hometown: "Huế",
      birthDate: "2000-01-01",
      seed: 42,
    });
    s.age = 18;
    s.money = 3000000000;
    s.stats = { health: 100, happiness: 80, intelligence: 100, looks: 90 };
    s.education.score = 95;
    s.education.completed = [
      "edu_primary",
      "edu_lower_secondary",
      "edu_upper_secondary",
    ];
    s = reduce(s, {
      type: "enroll",
      id: "edu_university",
      specialty: "congnghe",
    });
    for (let i = 0; i < 4; i++) {
      s = settle(reduce(s, { type: "age" }));
      expect(s.phase).toBe("ready");
    }
    expect(s.education.completed).toContain("edu_university");
    s = reduce(s, { type: "job", id: "job_congnghe_01" });
    s = reduce(s, { type: "buy", id: "asset_nha_01" });
    operate(s, "friend");
    const friend = s.relations.find((r) => r.role === "friend")!;
    s = reduce(s, { type: "relation", id: friend.id, action: "date" });
    s = reduce(s, { type: "relation", id: friend.id, action: "talk" });
    s = reduce(s, { type: "relation", id: friend.id, action: "talk" });
    s = reduce(s, { type: "relation", id: friend.id, action: "propose" });
    s = reduce(s, { type: "relation", id: friend.id, action: "baby" });
    const child = s.relations.find((r) => r.role === "child")!;
    s = reduce(s, { type: "will", shares: { [child.id]: 100 } });
    const restored = parseSave(serialize(s));
    expect(restored).toEqual(s);
    finishLife(s, "Kết thúc trace");
    const next = reduce(s, { type: "continueChild", id: child.id });
    expect(next.age).toBe(child.age);
    expect(next.money).toBe(s.estate.distributions[child.id]);
    expect(next.relations.find((r) => r.id === friend.id)?.role).toBe("father");
    expect(parseSave(serialize(next))).toEqual(next);
    next.age = 30;
    operate(next, "adoptChild");
    const grandchild = next.relations.find((r) => r.role === "child")!;
    next.age = 30;
    finishLife(next, "Thế hệ hai");
    const third = reduce(next, { type: "continueChild", id: grandchild.id });
    expect(third.profile.estateReceipts).toHaveLength(2);
    expect(parseSave(serialize(third))).toEqual(third);
  });
  it("recovers from prison and illness, preserving state across reload", () => {
    let s = newLife({
      name: "An",
      gender: "other",
      hometown: "Huế",
      birthDate: "2000-01-01",
      seed: 42,
    });
    s.age = 30;
    operate(s, "illness", 1);
    const id = s.illnesses[0].id;
    operate(s, "treat", 30, id);
    s = parseSave(serialize(s));
    expect(s.illnesses[0].progress).toBe(30);
    operate(s, "treat", 30, id);
    expect(s.illnesses).toHaveLength(0);
    operate(s, "prison", 2);
    s = settle(reduce(s, { type: "age" }));
    expect(s.prisonYears).toBe(1);
    s = settle(reduce(parseSave(serialize(s)), { type: "age" }));
    expect(s.prisonYears).toBe(0);
    expect(s.flags).toContain("recovered_record");
  });
  it("uses a replacement when a scheduled relationship is no longer available", () => {
    const s = newLife({
      name: "An",
      gender: "other",
      hometown: "Huế",
      birthDate: "2000-01-01",
      seed: 42,
    });
    s.age = 32;
    s.relations.forEach((r) => (r.alive = false));
    s.yearQueue = ["midlife_16", "@random"];
    advanceQueue(s);
    expect(s.pending?.event.id).not.toBe("midlife_16");
    expect(s.log.some((l) => l.text.includes("hoàn cảnh"))).toBe(true);
  });
  it("migrates a prior envelope without touching the original and rejects unsafe keys", () => {
    const s = newLife({
      name: "An",
      gender: "other",
      hometown: "Huế",
      birthDate: "2000-01-01",
      seed: 42,
    });
    const raw = JSON.parse(serialize(s));
    raw.schemaVersion = 0;
    raw.game.schemaVersion = 0;
    delete raw.game.market;
    delete raw.game.profile.estateReceipts;
    const text = JSON.stringify(raw);
    expect(parseSave(text).schemaVersion).toBe(1);
    expect(JSON.stringify(raw)).toBe(text);
    expect(() =>
      parseSave(
        '{"format":"newlife-save","schemaVersion":1,"game":{"__proto__":{}}}',
      ),
    ).toThrow(/an toàn/);
  });
});
