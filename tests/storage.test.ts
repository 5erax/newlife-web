import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { newLife, reduce } from "../src/engine/game";
import {
  clearData,
  saveSlot,
  loadSlot,
  listSlots,
  restorePrevious,
  StaleSlotError,
} from "../src/ui/storage";
const fixture = () =>
  newLife({
    name: "An",
    gender: "other",
    hometown: "Huế",
    birthDate: "2000-01-01",
    seed: 42,
  });
describe("IndexedDB commit and stale tab protection", () => {
  beforeEach(async () => {
    await clearData();
  });
  it("restores the exact event awaiting a choice", async () => {
    const game = reduce(fixture(), { type: "age" });
    const slot = await saveSlot("one", "Một đời", game, null);
    expect((await loadSlot("one")).game).toEqual(game);
    expect(slot.storageRevision).toBe(1);
  });
  it("rejects an older tab without overwriting the newer save", async () => {
    const first = await saveSlot("one", "An", fixture(), null);
    const next = reduce(first.game, { type: "age" });
    await saveSlot("one", "An", next, first.storageRevision);
    await expect(
      saveSlot("one", "Old", first.game, first.storageRevision),
    ).rejects.toBeInstanceOf(StaleSlotError);
    expect((await loadSlot("one")).game.age).toBe(1);
  });
  it("retains a previous snapshot while storage revision keeps increasing", async () => {
    const first = await saveSlot("one", "An", fixture(), null);
    const next = await saveSlot(
      "one",
      "An",
      reduce(first.game, { type: "age" }),
      1,
    );
    const restored = await restorePrevious("one", next.storageRevision);
    expect(restored.game.age).toBe(0);
    expect(restored.storageRevision).toBe(3);
  });
  it("adds a new imported slot without deleting an existing life", async () => {
    await saveSlot("one", "First", fixture(), null);
    await saveSlot("two", "Second", fixture(), null);
    expect(await listSlots()).toHaveLength(2);
  });
});
