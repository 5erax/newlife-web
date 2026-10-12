import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { newLife, reduce } from "../src/engine/game";
import { finishLife } from "../src/engine/year";
import { parseSave, serialize, validateState } from "../src/engine/save";
import {
  clearData,
  loadSlot,
  restorePrevious,
  saveSlot,
} from "../src/ui/storage";
const fixture = (seed = 42) => {
  const s = newLife({
    name: "An",
    gender: "other",
    hometown: "Huế",
    birthDate: "2000-01-01",
    seed,
  });
  s.age = 50;
  s.money = 100000000;
  s.relations.push({
    id: "child_test",
    name: "Bình",
    gender: "female",
    role: "child",
    age: 20,
    closeness: 80,
    alive: true,
    trait: "vui",
    resources: 0,
    parents: [s.id],
  });
  return s;
};
describe("release regressions", () => {
  beforeEach(clearData);
  it("does not carry newborn death settlement into a living child", () => {
    const s = fixture(182);
    finishLife(s, "Thử");
    const next = reduce(s, { type: "continueChild", id: "child_test" });
    expect(next.phase).toBe("ready");
    expect(next.estate.settled).toBe(false);
    expect(() => validateState(next)).not.toThrow();
  });
  it("gives distinct children distinct life and estate identities", () => {
    const s = fixture();
    s.relations.push({
      ...s.relations.find((r) => r.id === "child_test")!,
      id: "child_second",
      name: "Chi",
    });
    finishLife(s, "Thử");
    const a = reduce(s, { type: "continueChild", id: "child_test" }),
      b = reduce(s, { type: "continueChild", id: "child_second" });
    expect(a.id).not.toBe(b.id);
    expect(a.estate.id).not.toBe(b.estate.id);
    expect(parseSave(serialize(a))).toEqual(a);
  });
  it("never commits a global profile that exceeds the schema after merging", async () => {
    const a = fixture(),
      b = fixture();
    a.profile.estateReceipts = Array.from(
      { length: 1001 },
      (_, i) => "receipt_a_" + i,
    );
    b.profile.estateReceipts = Array.from(
      { length: 1001 },
      (_, i) => "receipt_b_" + i,
    );
    await saveSlot("a", "A", a, null);
    await expect(saveSlot("b", "B", b, null)).rejects.toThrow(/giới hạn/);
    expect((await loadSlot("a")).game.profile.estateReceipts).toHaveLength(
      1001,
    );
  });
  it("rejects unsettled deaths and unknown or excessive estate distributions", () => {
    const s = fixture();
    finishLife(s, "Thử");
    s.estate.settled = false;
    expect(() => validateState(s)).toThrow();
    s.estate.settled = true;
    s.estate.distributions = { missing: 1 };
    expect(() => validateState(s)).toThrow();
    s.estate.distributions = { child_test: 100000001 };
    expect(() => validateState(s)).toThrow();
  });
  it("allows distinct estates after global receipts have been merged", async () => {
    const a = fixture(),
      b = fixture();
    b.id = "life_other";
    b.estate.id = "estate_other";
    b.relations.find((r) => r.role === "child")!.id = "child_other";
    finishLife(a, "Thử");
    finishLife(b, "Thử");
    await saveSlot("a", "A", a, null);
    await saveSlot("b", "B", b, null);
    const loadedB = await loadSlot("b");
    await saveSlot(
      "b",
      "Con B",
      reduce(loadedB.game, { type: "continueChild", id: "child_other" }),
      1,
    );
    const loadedA = await loadSlot("a");
    await expect(
      saveSlot(
        "a",
        "Con A",
        reduce(loadedA.game, { type: "continueChild", id: "child_test" }),
        1,
      ),
    ).resolves.toBeDefined();
  });
  it("settles a restored life even when its old summary is global", async () => {
    const s = fixture();
    await saveSlot("one", "An", s, null);
    const dead = structuredClone(s);
    finishLife(dead, "Thử nghiệm");
    await saveSlot("one", "An", dead, 1);
    const restored = await restorePrevious("one", 2);
    finishLife(restored.game, "Kết thúc mới");
    expect(restored.game.phase).toBe("dead");
    expect(restored.game.estate.settled).toBe(true);
    expect(
      restored.game.profile.summaries.filter((x) => x.lifeId === s.id),
    ).toHaveLength(1);
    expect(() => validateState(restored.game)).not.toThrow();
  });
  it("rejects a second inheritance claim across distinct slots", async () => {
    const s = fixture();
    finishLife(s, "Thử nghiệm");
    await saveSlot("one", "An", s, null);
    await saveSlot("two", "An", s, null);
    const a = await loadSlot("one"),
      b = await loadSlot("two");
    const next = reduce(a.game, { type: "continueChild", id: "child_test" });
    await saveSlot("one", "Con", next, 1);
    await expect(
      saveSlot(
        "two",
        "Con",
        reduce(b.game, { type: "continueChild", id: "child_test" }),
        1,
      ),
    ).rejects.toThrow(/di sản/i);
    expect((await loadSlot("two")).game.phase).toBe("dead");
  });
  it("preserves a child’s gender, calendar year and family roles", () => {
    const s = fixture();
    finishLife(s, "Thử nghiệm");
    const next = reduce(s, { type: "continueChild", id: "child_test" });
    expect(next.gender).toBe("female");
    expect(next.birthDate).toBe("2030-01-01");
    expect(next.relations.find((r) => r.id === s.id)?.role).toBe("parent");
    expect(next.relations.find((r) => r.role === "grandmother")).toBeDefined();
    expect(parseSave(serialize(next))).toEqual(next);
  });
  it("rejects invalid dates and unsafe aggregate wealth", () => {
    const s = fixture();
    s.birthDate = "2000-02-31";
    expect(() => validateState(s)).toThrow();
    s.birthDate = "2000-01-01";
    s.money = 1e15;
    s.assets.push({
      instanceId: "test_asset",
      catalogId: "asset_nha_01",
      age: 0,
      condition: 100,
      value: 1e15,
      quantity: 1000,
      primary: true,
      alive: true,
      lost: false,
      bond: 0,
    });
    expect(() => validateState(s)).toThrow();
  });
});
