import { openDB, type DBSchema } from "idb";
import { z } from "zod";
import type { GameState, Profile } from "../engine/types";
import { profileSchema, validateState } from "../engine/save";
import { estateReceipt } from "../engine/helpers";
import { emptyProfile } from "../engine/game";
export interface Preferences {
  theme: "light" | "dark";
  textSize: number;
  reducedMotion: boolean;
  sound: boolean;
}
export const defaultPreferences: Preferences = {
  theme: "light",
  textSize: 16,
  reducedMotion: false,
  sound: false,
};
const preferencesSchema = z.object({
  theme: z.enum(["light", "dark"]),
  textSize: z.number().int().min(14).max(22),
  reducedMotion: z.boolean(),
  sound: z.boolean(),
});
export interface Slot {
  id: string;
  label: string;
  storageRevision: number;
  game: GameState;
  previous: GameState | null;
  updatedAt: number;
}
interface Database extends DBSchema {
  slots: { key: string; value: Slot };
  metadata: { key: string; value: unknown };
}
let connection: ReturnType<typeof openDB<Database>> | undefined;
function database() {
  return (connection ??= openDB<Database>("newlife-web", 1, {
    upgrade(db) {
      db.createObjectStore("slots", { keyPath: "id" });
      db.createObjectStore("metadata");
    },
    blocking() {
      void connection?.then((db) => db.close());
      connection = undefined;
    },
  }));
}
export function mergeProfile(a: Profile, b: Profile): Profile {
  const endings: Profile["endings"] = {};
  for (const id of new Set([
    ...Object.keys(a.endings),
    ...Object.keys(b.endings),
  ]))
    endings[id] = Array.from(
      new Set([...(a.endings[id] ?? []), ...(b.endings[id] ?? [])]),
    );
  const summaries = new Map(
    [...a.summaries, ...b.summaries].map((s) => [s.lifeId, s]),
  );
  return {
    unlockLives: { ...b.unlockLives, ...a.unlockLives },
    achievements: Array.from(new Set([...a.achievements, ...b.achievements])),
    endings,
    summaries: Array.from(summaries.values()).slice(-100),
    estateReceipts: Array.from(
      new Set([...a.estateReceipts, ...b.estateReceipts]),
    ),
  };
}
export class StaleSlotError extends Error {
  constructor() {
    super(
      "Ô lưu đã được cập nhật ở tab khác. Hãy tải bản mới; bản chưa lưu vẫn có thể xuất ra file.",
    );
  }
}
export async function listSlots() {
  const db = await database();
  return (await db.getAll("slots")).sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function loadSlot(id: string) {
  const db = await database();
  const slot = await db.get("slots", id);
  if (!slot) throw Error("Ô lưu không còn tồn tại.");
  const game = validateState(slot.game);
  const global = profileSchema.parse(
    (await db.get("metadata", "profile")) ?? emptyProfile(),
  );
  return {
    ...slot,
    game: {
      ...game,
      profile: mergeProfile(global ?? emptyProfile(), game.profile),
    },
  };
}
export async function saveSlot(
  id: string,
  label: string,
  game: GameState,
  expectedRevision: number | null,
) {
  const valid = validateState(game);
  const db = await database();
  const tx = db.transaction(["slots", "metadata"], "readwrite");
  const store = tx.objectStore("slots");
  const previous = await store.get(id);
  if ((previous?.storageRevision ?? null) !== expectedRevision) {
    tx.abort();
    await tx.done.catch(() => {});
    throw new StaleSlotError();
  }
  const global = profileSchema.parse(
    (await tx.objectStore("metadata").get("profile")) ?? emptyProfile(),
  );
  const claims = new Set(
    previous?.game.relations
      .filter((r) => r.role === "child")
      .map((r) => estateReceipt(previous.game.estate.id, r.id)),
  );
  const incoming = valid.profile.estateReceipts.filter(
    (receipt) =>
      claims.has(receipt) &&
      !previous?.game.profile.estateReceipts.includes(receipt),
  );
  if (
    previous &&
    valid.id !== previous.game.id &&
    incoming.some((receipt) => global.estateReceipts.includes(receipt))
  ) {
    tx.abort();
    await tx.done.catch(() => {});
    throw new Error(
      "Di sản này đã được nhận ở một ô khác. Hãy tải lại bản lưu.",
    );
  }
  try {
    valid.profile = profileSchema.parse(mergeProfile(global, valid.profile));
  } catch {
    tx.abort();
    await tx.done.catch(() => {});
    throw new Error(
      "Hồ sơ sau khi gộp vượt giới hạn; ô lưu đang có được giữ nguyên.",
    );
  }
  const slot: Slot = {
    id,
    label: label.trim().slice(0, 100) || valid.name,
    storageRevision: (previous?.storageRevision ?? 0) + 1,
    game: valid,
    previous: previous?.game ?? null,
    updatedAt: Date.now(),
  };
  await store.put(slot);
  await tx.objectStore("metadata").put(valid.profile, "profile");
  await tx.done;
  return slot;
}
export async function removeSlot(id: string) {
  const db = await database();
  await db.delete("slots", id);
}
export async function exportRawSlot(id: string) {
  const slot = await (await database()).get("slots", id);
  if (!slot) throw Error("Ô lưu không còn tồn tại.");
  return JSON.stringify(
    {
      format: "newlife-save",
      schemaVersion: slot.game.schemaVersion,
      game: slot.game,
    },
    null,
    2,
  );
}
export async function renameSlot(
  id: string,
  label: string,
  expectedRevision: number,
) {
  const current = await loadSlot(id);
  return saveSlot(id, label, current.game, expectedRevision);
}
export async function restorePrevious(id: string, expectedRevision: number) {
  const current = await loadSlot(id);
  if (!current.previous) throw Error("Ô này chưa có bản trước.");
  return saveSlot(
    id,
    current.label,
    validateState(current.previous),
    expectedRevision,
  );
}
export async function getPreferences() {
  const db = await database();
  const raw = await db.get("metadata", "preferences");
  const result = preferencesSchema.safeParse(raw);
  return result.success ? result.data : defaultPreferences;
}
export async function setPreferences(value: Preferences) {
  const db = await database();
  await db.put("metadata", preferencesSchema.parse(value), "preferences");
}
export async function getProfile() {
  const db = await database();
  return profileSchema.parse(
    (await db.get("metadata", "profile")) ?? emptyProfile(),
  );
}
export async function clearData() {
  const db = await database();
  const tx = db.transaction(["slots", "metadata"], "readwrite");
  await tx.objectStore("slots").clear();
  await tx.objectStore("metadata").clear();
  await tx.done;
}
export function download(text: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
