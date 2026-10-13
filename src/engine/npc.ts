import type { GameState, Relation, NpcProfile } from "./types";
import { identityDigest, requireGame, addLog, stat } from "./helpers";
import { changeContext } from "./changes";

// shortcut: NPC life milestones use a stable identity seed; replace with native rules only when verified.
function baseline(p: Relation): NpcProfile {
  const seed = parseInt(identityDigest(p.id).slice(0, 8), 16);
  const graduation = 21 + (seed % 4),
    retirement = 65 + (seed % 5);
  const marriage = 22 + (seed % 16),
    parenthood = marriage + 2 + (seed % 4);
  const student = p.age >= 6 && p.age < graduation;
  const married = p.age >= marriage && seed % 5 !== 0;
  return {
    craziness: seed % 101,
    student,
    employed:
      p.age >= 16 &&
      p.age < retirement &&
      seed % 5 !== 0 &&
      (!student || seed % 3 === 0),
    married,
    children:
      married && p.age >= parenthood
        ? p.age >= parenthood + 3 && seed % 3 === 0
          ? 2
          : 1
        : 0,
    enemy: false,
  };
}
export function npcProfile(p: Relation): NpcProfile {
  return p.npc ?? baseline(p);
}
export function npcYear(s: GameState, p: Relation) {
  if (
    !s.flags.includes("apk_mode") ||
    !p.alive ||
    !["friend", "lover", "spouse"].includes(p.role)
  )
    return;
  const past = baseline({ ...p, age: Math.max(0, p.age - 1) }),
    next = baseline(p);
  const knownChildren = s.relations.filter(
    (r) => r.role === "child" && r.parents.includes(p.id),
  ).length;
  const previous =
    p.npc ??
    (p.role === "friend"
      ? past
      : { ...past, married: p.role === "spouse", children: knownChildren });
  const married =
    p.role === "friend"
      ? previous.married || (next.married && !past.married)
      : p.role === "spouse";
  p.npc = {
    ...next,
    craziness: previous.craziness,
    enemy: previous.enemy,
    married,
    children:
      p.role === "friend"
        ? Math.min(
            250,
            previous.children +
              (married ? Math.max(0, next.children - past.children) : 0),
          )
        : Math.max(previous.children, knownChildren),
  };
  if (previous.student !== p.npc.student)
    addLog(
      s,
      `${p.name} ${p.npc.student ? "bắt đầu học tập" : "kết thúc giai đoạn học tập"}.`,
      "relationship",
    );
  if (previous.employed !== p.npc.employed)
    addLog(
      s,
      `${p.name} ${p.npc.employed ? "bắt đầu đi làm" : "ngừng công việc hiện tại"}.`,
      "relationship",
    );
  if (!previous.married && p.npc.married)
    addLog(s, `${p.name} đã kết hôn.`, "relationship");
  if (previous.children < p.npc.children)
    addLog(s, `Gia đình ${p.name} đón thêm một người con.`, "relationship");
}
export function manageFriendship(
  s: GameState,
  id: string,
  action: "declareEnemy" | "reconcile",
) {
  requireGame(
    s.flags.includes("apk_mode") && s.age >= 6 && s.time >= 1 && !s.prisonYears,
    "Cần bộ Việt hóa, từ 6 tuổi, còn thời gian và không đang thụ án.",
  );
  requireGame(
    ["declareEnemy", "reconcile"].includes(action),
    "Thao tác bạn bè không hợp lệ.",
  );
  const p = s.relations.find(
    (r) => r.id === id && r.alive && r.role === "friend",
  );
  requireGame(p, "Người bạn này không còn phù hợp.");
  const profile = npcProfile(p),
    key = `friendship_${id}`;
  requireGame(
    (s.activityUses[key] ?? 0) < 2,
    "Đã thay đổi quan hệ 2 lần trong năm.",
  );
  requireGame(
    action === "declareEnemy" ? !profile.enemy : profile.enemy,
    "Quan hệ không ở trạng thái phù hợp.",
  );
  if (action === "reconcile")
    requireGame(p.closeness >= 40, "Cần gắn bó từ 40 để làm hòa.");
  p.npc = { ...profile, enemy: action === "declareEnemy" };
  if (p.npc.enemy) p.closeness = Math.min(p.closeness, 10);
  s.time--;
  s.activityUses[key] = (s.activityUses[key] ?? 0) + 1;
  const text = `${s.name} và ${p.name} ${p.npc.enemy ? "chuyển sang quan hệ thù địch" : "đã làm hòa"}.`;
  changeContext(s, "relationship", text);
  stat(s, "happiness", p.npc.enemy ? -3 : 3);
  addLog(s, text, "relationship");
}
