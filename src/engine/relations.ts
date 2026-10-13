import type { GameState, Operation, Role } from "./types";
import {
  relation,
  makePerson,
  requireGame,
  stat,
  flag,
  count,
  money,
  addLog,
  createAsset,
  ownAsset,
} from "./helpers";
import { assetById } from "../content/catalog";
import { random } from "./rng";
import { origins } from "./world";
import { migrate } from "./migration";
import { npcProfile } from "./npc";
export function operate(
  s: GameState,
  operation: Operation,
  value = 1,
  targetId?: string,
) {
  const person = relation(
    s,
    targetId,
    relationRoleForAction(operation) ?? [
      "friend",
      "lover",
      "spouse",
      "child",
      "mother",
      "father",
      "sibling",
      "parent",
      "grandmother",
      "grandfather",
      "grandparent",
      "relative",
    ],
  );
  switch (operation) {
    case "loseJob":
      if (s.job) {
        s.job = null;
        addLog(
          s,
          "Hợp đồng công việc kết thúc. Bạn có thể tìm việc mới hoặc học thêm.",
        );
      }
      flag(s, "unemployed");
      break;
    case "recoverGambling":
      s.counters.gambling_addiction = 0;
      flag(s, "gambling_addict", false);
      flag(s, "gambling_recovered");
      addLog(
        s,
        "Bạn hoàn thành một chặng cai nghiện và đặt lại giới hạn cho bản thân.",
      );
      break;
    case "recoverIllness":
      if (s.illnesses.length) {
        s.illnesses.shift();
        count(s, "recoveries");
        addLog(
          s,
          "Một tình trạng sức khoẻ đã hồi phục; những tình trạng khác vẫn được theo dõi.",
        );
      }
      break;
    case "migrate": {
      if (s.prisonYears) {
        addLog(s, "Kế hoạch di cư khép lại vì bạn chưa thể rời nơi thụ án.");
        break;
      }
      const choices = origins.filter((o) => o.id !== s.origin);
      migrate(s, choices[Math.floor(random(s) * choices.length)].id, true);
      break;
    }
    case "friend": {
      let friend = s.relations.find(
        (r) =>
          r.alive &&
          r.role === "friend" &&
          r.closeness < 90 &&
          (!s.flags.includes("apk_mode") || !npcProfile(r).enemy),
      );
      if (!friend && s.relations.length < 200) {
        friend = makePerson(
          s,
          "friend",
          Math.max(1, s.age + Math.floor(random(s) * 7) - 3),
        );
        s.relations.push(friend);
        if (s.flags.includes("apk_mode")) friend.npc = npcProfile(friend);
        addLog(
          s,
          `Bạn quen ${friend.name}, một người ${friend.trait}.`,
          "relationship",
        );
      } else if (friend) friend.closeness = Math.min(100, friend.closeness + 5);
      break;
    }
    case "date": {
      requireGame(
        s.age >= 18 && !relation(s, undefined, ["lover", "spouse"]),
        "Bạn cần đủ 18 tuổi và đang độc thân.",
      );
      let love = targetId ? relation(s, targetId, ["friend"]) : undefined;
      if (love) {
        if (s.flags.includes("apk_mode")) {
          requireGame(
            !npcProfile(love).enemy,
            "Người này đang thù địch với bạn.",
          );
          requireGame(!npcProfile(love).married, "Người này đã kết hôn.");
        }
        requireGame(love.age >= 18, "Người này chưa đủ tuổi hẹn hò.");
        love.role = "lover";
        love.closeness = Math.max(55, love.closeness);
      } else {
        love = makePerson(
          s,
          "lover",
          Math.max(18, s.age + Math.floor(random(s) * 7) - 3),
        );
        love.closeness = 55;
        s.relations.push(love);
      }
      addLog(s, `Bạn bắt đầu hẹn hò với ${love.name}.`, "relationship");
      break;
    }
    case "propose":
      requireGame(
        person?.role === "lover" && s.age >= 18 && person.age >= 18,
        "Chỉ có thể cầu hôn người yêu trưởng thành.",
      );
      requireGame(
        person.closeness >= 65,
        "Hai người cần gắn bó hơn trước khi cầu hôn.",
      );
      person.role = "spouse";
      flag(s, "married_once");
      flag(s, "married");
      count(s, "weddings");
      addLog(
        s,
        `Bạn và ${person.name} cùng bắt đầu một gia đình.`,
        "relationship",
      );
      break;
    case "baby":
    case "adoptChild": {
      requireGame(s.age >= 18, "Bạn cần đủ 18 tuổi để tạo gia đình.");
      requireGame(
        operation === "adoptChild" || person?.role === "spouse",
        "Hãy chọn bạn đời cho kế hoạch sinh con.",
      );
      requireGame(
        s.relations.filter((r) => r.role === "child" && r.alive).length < 20,
        "Gia đình đã đạt giới hạn 20 người con trong game.",
      );
      const child = makePerson(
        s,
        "child",
        operation === "adoptChild" ? Math.floor(random(s) * 8) : 0,
      );
      child.parents = [s.id, ...(person?.role === "spouse" ? [person.id] : [])];
      s.relations.push(child);
      count(s, "children_born");
      addLog(
        s,
        `${operation === "adoptChild" ? "Gia đình đón" : "Bạn có"} một người con: ${child.name}.`,
        "relationship",
      );
      break;
    }
    case "breakup":
    case "divorce": {
      requireGame(
        person &&
          person.role === (operation === "divorce" ? "spouse" : "lover"),
        "Quan hệ này không ở trạng thái phù hợp.",
      );
      if (operation === "divorce") {
        addLog(
          s,
          "Tài sản đang đứng tên riêng được giữ; gia đình này không có tài sản chung để chia.",
          "money",
        );
        flag(s, "married", false);
      }
      person.role = "friend";
      person.closeness = Math.max(0, person.closeness - 25);
      if (s.flags.includes("apk_mode"))
        person.npc = {
          ...npcProfile(person),
          married: false,
          children: Math.max(
            person.npc?.children ?? 0,
            s.relations.filter(
              (r) => r.role === "child" && r.parents.includes(person.id),
            ).length,
          ),
        };
      count(s, "separations");
      stat(s, "happiness", -8);
      addLog(
        s,
        `Bạn và ${person.name} kết thúc quan hệ tình cảm. Những chuyện đã có vẫn còn trong nhật ký.`,
        "relationship",
      );
      break;
    }
    case "talk":
    case "gift":
    case "argue":
    case "apologize":
    case "support": {
      requireGame(person, "Không còn người phù hợp cho tương tác này.");
      const before = person.closeness;
      if (operation === "support") {
        requireGame(
          !s.flags.includes("apk_mode") ||
            person.role !== "friend" ||
            !npcProfile(person).enemy,
          "Người này đang thù địch với bạn.",
        );
        const key = `support_${person.id}`;
        requireGame(
          (s.activityUses[key] ?? 0) < 1,
          "Người này đã hỗ trợ bạn trong năm.",
        );
        const grant = Math.min(
          person.resources,
          500000 + Math.round(random(s) * 1000000),
        );
        requireGame(grant > 0, "Người thân chưa có khoản để hỗ trợ.");
        person.resources -= grant;
        money(s, grant, `Hỗ trợ từ ${person.name}`);
        s.activityUses[key] = 1;
        person.closeness = Math.max(0, person.closeness - 3);
      } else {
        person.closeness = Math.max(
          0,
          Math.min(
            100,
            before + { talk: 7, gift: 10, argue: -12, apologize: 8 }[operation],
          ),
        );
        if (operation === "gift") count(s, "gifts");
        if (operation === "apologize" && before < 65)
          count(s, "reconciliations");
      }
      break;
    }
    case "treat": {
      const illness = targetId
        ? s.illnesses.find((i) => i.id === targetId)
        : s.illnesses[0];
      requireGame(illness, "Bạn chưa có bệnh phù hợp để điều trị.");
      illness.progress += value;
      if (illness.progress >= 60) {
        s.illnesses = s.illnesses.filter((i) => i.id !== illness.id);
        count(s, "recoveries");
        stat(s, "health", 5);
        addLog(s, `Bạn đã hồi phục sau ${illness.type}.`);
      }
      break;
    }
    case "illness": {
      if (value === 0 && random(s) > 0.15) break;
      const types = [
        "cảm kéo dài",
        "đau lưng",
        "mệt do thiếu ngủ",
        "bệnh cần theo dõi",
      ];
      const illness = {
        id: `${s.id}_illness_${++s.actionSerial}`,
        type: types[Math.floor(random(s) * types.length)],
        severity: Math.round(10 + random(s) * 20),
        discoveredAge: s.age,
        progress: 0,
      };
      if (s.illnesses.length < 8) {
        s.illnesses.push(illness);
        addLog(s, `Bạn phát hiện ${illness.type} và có thể chọn điều trị.`);
      }
      break;
    }
    case "petAdopt":
      requireGame(s.age >= 6, "Bạn cần lớn thêm trước khi chăm thú cưng.");
      createAsset(s, "asset_thucung_01");
      break;
    case "petPlay":
    case "petVet":
    case "petLost":
    case "petFind": {
      const pet = ownAsset(s, targetId, "pet");
      requireGame(
        pet && assetById.get(pet.catalogId)?.category === "pet",
        "Hãy chọn thú cưng đang sống.",
      );
      if (operation === "petPlay") {
        requireGame(!pet.lost, "Bạn nhỏ đang thất lạc.");
        pet.bond = Math.min(100, pet.bond + 10);
      }
      if (operation === "petVet") {
        requireGame(!pet.lost, "Bạn cần tìm lại thú cưng trước.");
        pet.condition = Math.min(100, pet.condition + value);
      }
      if (operation === "petLost") pet.lost = true;
      if (operation === "petFind") {
        requireGame(pet.lost, "Bạn nhỏ này chưa thất lạc.");
        pet.lost = false;
      }
      flag(
        s,
        "pet_lost",
        s.assets.some((a) => a.alive && a.lost),
      );
      break;
    }
    case "repair": {
      const item = ownAsset(s, targetId);
      requireGame(
        item && assetById.get(item.catalogId)?.category !== "pet",
        "Hãy chọn tài sản đang sở hữu.",
      );
      item.condition = Math.min(100, item.condition + value);
      break;
    }
    case "crime":
      count(s, "crimes", value);
      break;
    case "prison":
      s.prisonYears += value;
      flag(s, "criminal_record");
      if (s.job) {
        s.job = null;
        addLog(s, "Bạn mất công việc vì phải thụ án.");
      }
      flag(s, "in_school", false);
      s.education.current = null;
      stat(s, "happiness", -8);
      addLog(s, `Bạn phải thụ án ${value} năm trong thế giới game.`);
      break;
    case "schoolScore":
      if (s.education.current)
        s.education.current.score = Math.max(
          0,
          Math.min(100, s.education.current.score + value),
        );
      break;
    case "skill":
      count(s, "skills", value);
      if (s.job)
        s.job.performance = Math.min(100, s.job.performance + value * 2);
      break;
    case "donate":
      count(s, "donations", value);
      break;
    case "volunteer":
      count(s, "volunteer");
      if (
        (s.counters.volunteer ?? 0) >= 20 &&
        !s.medals.includes("medal_community")
      )
        s.medals.push("medal_community");
      break;
    case "travel":
      count(s, "travel");
      break;
  }
}
export function relationActionCost(action: string) {
  return action === "gift"
    ? 200000
    : action === "baby" || action === "adoptChild"
      ? 1000000
      : 0;
}
export function relationRoleForAction(action: string): Role[] | undefined {
  return action === "date"
    ? ["friend"]
    : ["propose", "breakup"].includes(action)
      ? ["lover"]
      : ["baby", "divorce"].includes(action)
        ? ["spouse"]
        : undefined;
}
