import type { GameState, Action } from "./types";
import {
  assets,
  assetById,
  education,
  educationById,
  jobById,
} from "../content/catalog";
import {
  addLog,
  count,
  createAsset,
  flag,
  money,
  ownAsset,
  requireGame,
  stat,
} from "./helpers";
import industries from "../content/industries.json" with { type: "json" };
import apkMajors from "../content/apk/majors.vi.json" with { type: "json" };
import { random } from "./rng";
import { changeContext } from "./changes";
import { localPrice, originById } from "./world";
import { tuitionQuote, chargeTuition, parentalPayment } from "./tuition";
export const sideJobs = [
  { name: "Phụ quán", minAge: 13 },
  { name: "Gia sư nhỏ", minAge: 16 },
  { name: "Dắt thú cưng", minAge: 13 },
  { name: "Làm vườn", minAge: 13 },
  { name: "Việc vặt", minAge: 13 },
  { name: "Viết bài", minAge: 16 },
  { name: "Thiết kế nhỏ", minAge: 18 },
  { name: "Chăm thú cưng", minAge: 16 },
];
export function economicYear(s: GameState) {
  changeContext(s, "economy", "Công việc, sinh hoạt và tài sản trong năm.");
  if (s.age < 18 && !s.job) {
    if (s.age >= 6) money(s, localPrice(s, 240000), "Tiền tiêu vặt trong năm");
  } else {
    if (s.job && s.prisonYears === 0) {
      money(s, s.job.salary, "Lương năm");
      s.job.years++;
      count(s, "workYears");
      s.job.performance = Math.max(
        0,
        Math.min(100, s.job.performance - 2 + Math.round(random(s) * 7)),
      );
      const job = jobById.get(s.job.id)!;
      if (job.industry === "quandoi") {
        count(s, "serviceYears");
        if (
          (s.counters.serviceYears ?? 0) >= 20 &&
          !s.medals.includes("medal_service")
        ) {
          s.medals.push("medal_service");
          addLog(
            s,
            "Bạn được trao Huy chương tận tâm sau 20 năm phục vụ.",
            "achievement",
          );
        }
      }
      const next = job.ranks[s.job.rank + 1];
      if (
        next &&
        s.job.years >= next.minYears &&
        s.job.performance >= 65 &&
        random(s) < 0.3
      ) {
        s.job.rank++;
        s.job.salary = localPrice(s, next.salary);
        count(s, "promotions");
        addLog(s, `Bạn được thăng lên ${next.name} trong nghề ${job.name}.`);
      }
      if (
        (job.noRecord && s.flags.includes("criminal_record")) ||
        s.stats.health < Math.max(5, job.minHealth - 20)
      ) {
        addLog(
          s,
          "Bạn cần nghỉ công việc hiện tại do không còn đáp ứng điều kiện sức khoẻ hoặc hồ sơ.",
        );
        s.job = null;
      }
    }
    if (s.pension > 0) money(s, s.pension, "Trợ cấp hưu trong game");
    if (
      s.education.current &&
      s.familyWealth === "rich" &&
      s.flags.includes("tuition_support")
    )
      parentalPayment(
        s,
        localPrice(s, 12000000),
        "Cha mẹ trợ cấp sinh hoạt khi học",
      );
    if (s.prisonYears === 0)
      money(
        s,
        -localPrice(
          s,
          s.housing === "family"
            ? 12_000_000
            : s.housing === "rent"
              ? 36_000_000
              : 18_000_000,
        ),
        "Sinh hoạt và nơi ở",
        true,
      );
    const minors = s.relations.filter(
      (r) => r.alive && r.role === "child" && r.age < 18,
    ).length;
    if (minors)
      money(
        s,
        -localPrice(s, minors * 6000000),
        "Chăm người con phụ thuộc",
        true,
      );
  }
  for (const debt of s.debts) {
    debt.balance = Math.min(
      30_000_000,
      Math.round(debt.balance * (1 + debt.rate)),
    );
    if (s.money > 5_000_000) {
      const paid = Math.min(
        debt.balance,
        Math.round((s.money - 5_000_000) * 0.15),
      );
      money(s, -paid, "Trả nợ");
      debt.balance -= paid;
    }
  }
  if (s.debts.some((d) => d.balance === 0)) flag(s, "debt_paid");
  s.debts = s.debts.filter((d) => d.balance > 0);
  for (const item of assets) {
    const spread =
      item.category === "investment"
        ? 0.2
        : item.category === "house"
          ? 0.04
          : 0.01;
    const multiplier = 1 + item.yearlyChange + (random(s) - 0.5) * spread;
    s.market[item.id] = Math.max(
      1,
      Math.min(1e15, Math.round(s.market[item.id] * multiplier)),
    );
  }
  for (const owned of s.assets.filter((a) => a.alive)) {
    const item = assetById.get(owned.catalogId)!;
    owned.age++;
    owned.condition = Math.max(
      0,
      owned.condition - (item.category === "pet" ? 5 : 2),
    );
    const ownedOrigin = owned.origin ?? s.origin;
    owned.value = Math.round(
      (s.market[item.id] * originById.get(ownedOrigin)!.wealthIndex) /
        originById.get(s.origin)!.wealthIndex,
    );
    if (item.category === "pet") {
      count(s, "petYears");
      if (owned.age >= (item.lifespan ?? 15) && random(s) < 0.4) {
        owned.alive = false;
        owned.primary = false;
        addLog(
          s,
          `Bạn nhỏ ${item.name.toLowerCase()} đã qua đời. Những năm cùng chăm vẫn ở lại trong nhật ký.`,
          "relationship",
        );
        stat(s, "happiness", -6);
        continue;
      }
    }
    money(
      s,
      -localPrice({ origin: ownedOrigin }, item.upkeep * owned.quantity),
      `Duy trì ${item.name}`,
      true,
    );
    if (item.category !== "house" || owned.primary)
      for (const [key, value] of Object.entries(item.bonus))
        stat(s, key as keyof GameState["stats"], value!);
  }
}
export function studyYear(s: GameState) {
  if (s.education.current) {
    const current = s.education.current;
    const program = educationById.get(current.id)!;
    if (s.age >= 18 && program.cost > 0 && current.year + 1 < program.years) {
      const fee = tuitionQuote(s, program.cost).due;
      const room = 30_000_000 - s.debts.reduce((sum, d) => sum + d.balance, 0);
      if (s.money + room < fee) {
        addLog(
          s,
          "Bạn tạm dừng chương trình học vì chưa thu xếp được học phí. Có thể ghi danh lại khi đủ điều kiện.",
        );
        s.education.current = null;
        flag(s, "in_school", false);
        flag(s, "dropout");
      } else
        chargeTuition(
          s,
          program.cost,
          "Học phí năm",
          true,
          s.flags.includes("scholarship"),
        );
    }
    if (s.education.current) {
      current.year++;
      current.score = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            current.score * 0.8 +
              s.stats.intelligence * 0.2 +
              (random(s) - 0.5) * 8,
          ),
        ),
      );
      if (current.year >= program.years) {
        if (current.score >= Math.max(30, program.minScore - 15)) {
          s.education.completed = Array.from(
            new Set([...s.education.completed, program.id]),
          );
          s.education.score = current.score;
          if (current.specialty) s.education.specialty = current.specialty;
          addLog(
            s,
            `Bạn hoàn thành ${program.name} với điểm ${current.score}/100.`,
          );
          if (program.id === "edu_return_school") {
            s.education.completed.push("edu_upper_secondary");
            flag(s, "returned_school");
          }
        } else
          addLog(s, `Bạn chưa hoàn thành ${program.name}. Bạn có thể học lại.`);
        s.education.current = null;
        flag(s, "in_school", false);
      }
    }
  }
  const automatic =
    s.age === 6
      ? "edu_primary"
      : s.age === 11
        ? "edu_lower_secondary"
        : s.age === 15
          ? "edu_upper_secondary"
          : null;
  if (automatic && !s.education.current) {
    const p = educationById.get(automatic)!;
    if (p.requires.every((id) => s.education.completed.includes(id))) {
      s.education.current = {
        id: p.id,
        year: 0,
        score: s.stats.intelligence,
        specialty: "",
      };
      flag(s, "in_school");
      addLog(s, `Bạn bắt đầu ${p.name}. Gia đình hỗ trợ học phí phổ thông.`);
    }
  }
}
export function educationReason(s: GameState, id: string): string | null {
  const p = educationById.get(id);
  if (!p) return "Không có chương trình này.";
  if (p.sourceKind === "apk_translation" && !s.flags.includes("apk_mode"))
    return "Chương trình thuộc bộ Việt hóa từ APK.";
  if (s.prisonYears > 0)
    return "Chương trình bên ngoài chưa mở khi đang thụ án.";
  if (s.education.current) return "Bạn đang có một chương trình học chính.";
  if (s.education.completed.includes(id))
    return "Bạn đã hoàn thành chương trình này.";
  if (s.age < p.minAge) return `Mở từ ${p.minAge} tuổi.`;
  if (!p.requires.every((req) => s.education.completed.includes(req)))
    return "Chưa có bằng yêu cầu.";
  if (s.education.score < p.minScore)
    return `Cần điểm học ít nhất ${p.minScore}/100.`;
  return null;
}
export function jobReason(s: GameState, id: string): string | null {
  const j = jobById.get(id);
  if (!j) return "Không có công việc này.";
  if (j.sourceKind === "apk_translation" && !s.flags.includes("apk_mode"))
    return "Nghề thuộc bộ Việt hóa từ APK.";
  if (j.origins && !j.origins.includes(s.origin))
    return "Vị trí này chỉ tuyển tại xuất thân phù hợp trong game.";
  if (s.prisonYears > 0) return "Bạn đang thụ án.";
  if (s.age < j.minAge) return `Mở từ ${j.minAge} tuổi.`;
  if (j.degree && !s.education.completed.includes(j.degree))
    return `Cần hoàn thành ${educationById.get(j.degree)?.name ?? j.degree}.`;
  if (j.apkRequirements) {
    const r = j.apkRequirements;
    if (r.unavailable)
      return "Nghề này cần hệ đặc biệt của bản gốc; chưa mở trên web.";
    if (s.age > r.maxAge) return `Nghề tuyển đến ${r.maxAge} tuổi.`;
    if (r.gender !== "any" && r.gender !== s.gender)
      return "Chưa phù hợp điều kiện giới tính của vị trí trong dữ liệu gốc.";
    if ((s.counters.workYears ?? 0) < r.workYears)
      return `Cần ${r.workYears} năm kinh nghiệm làm việc.`;
    if (r.majors.length && !r.majors.includes(s.education.specialty))
      return (
        "Cần chuyên ngành: " +
        r.majors
          .map((id) => apkMajors.find((m) => m.id === id)?.name ?? id)
          .join(", ") +
        "."
      );
    if ((s.counters.apk_karma ?? 50) < r.karma)
      return `Cần điểm thiện tâm ${r.karma}.`;
    if (r.driving)
      return "Cần bằng lái xe; hệ cấp bằng gốc chưa chuyển sang web.";
    if (r.pilot)
      return "Cần bằng lái máy bay; hệ đào tạo bay gốc chưa chuyển sang web.";
    if (
      r.vehicle &&
      !s.assets.some(
        (a) => a.alive && assetById.get(a.catalogId)?.category === "vehicle",
      )
    )
      return "Cần sở hữu phương tiện.";
    if (
      r.celibacy &&
      s.relations.some((p) => p.alive && ["lover", "spouse"].includes(p.role))
    )
      return "Vị trí yêu cầu độc thân.";
  }
  if (
    [
      "edu_vocational",
      "edu_college",
      "edu_university",
      "edu_postgraduate",
    ].includes(j.degree) &&
    !j.apkRequirements &&
    s.education.specialty !== j.industry
  )
    return `Cần chuyên ngành ${industries.find((i) => i.id === j.industry)?.name}.`;
  if (s.stats.intelligence < j.minIntelligence)
    return `Cần trí tuệ ${j.minIntelligence}.`;
  if (s.stats.health < j.minHealth) return `Cần sức khoẻ ${j.minHealth}.`;
  if (s.stats.looks < j.minLooks) return `Cần ngoại hình ${j.minLooks}.`;
  if (j.noRecord && s.flags.includes("criminal_record"))
    return "Nghề này yêu cầu hồ sơ không có tiền án trong game.";
  return null;
}
export function economyAction(s: GameState, a: Action): boolean {
  switch (a.type) {
    case "buy": {
      const item = assetById.get(a.id);
      requireGame(item, "Không tìm thấy tài sản.");
      requireGame(s.age >= item.minAge, `Tài sản mở từ ${item.minAge} tuổi.`);
      requireGame(!s.prisonYears, "Chưa mua được khi đang thụ án.");
      requireGame(
        s.assets.filter((x) => x.alive).length < 200,
        "Đã đạt giới hạn 200 tài sản đang sở hữu.",
      );
      const quantity = a.quantity ?? 1;
      requireGame(
        Number.isInteger(quantity) &&
          quantity >= 1 &&
          quantity <= 1000 &&
          (item.category === "investment" || quantity === 1),
        "Số lượng mua không hợp lệ.",
      );
      money(
        s,
        -Math.round(s.market[item.id] * quantity * 1.02),
        `Mua ${item.name}`,
      );
      createAsset(s, item.id, quantity);
      addLog(
        s,
        `Bạn có thêm ${item.name}. Phí giao dịch 2% đã được ghi vào sổ tiền.`,
        "money",
      );
      return true;
    }
    case "sell": {
      const owned = ownAsset(s, a.instanceId);
      requireGame(owned, "Tài sản không còn sở hữu.");
      const item = assetById.get(owned.catalogId)!;
      requireGame(
        item.category !== "pet",
        "Thú cưng không bán lại trong bản web.",
      );
      const proceeds = Math.round(owned.value * owned.quantity * 0.92);
      money(s, proceeds, `Bán ${item.name}`);
      s.assets = s.assets.filter((x) => x.instanceId !== a.instanceId);
      if (owned.primary) s.housing = "family";
      addLog(
        s,
        `Bạn bán ${item.name}, phí giao dịch 8% đã được tính.`,
        "money",
      );
      return true;
    }
    case "primary": {
      const owned = ownAsset(s, a.instanceId);
      requireGame(
        owned && assetById.get(owned.catalogId)?.category === "house",
        "Hãy chọn nhà đang sở hữu.",
      );
      s.assets.forEach((x) => (x.primary = x.instanceId === a.instanceId));
      s.housing = "owned";
      addLog(s, "Bạn đổi nơi ở chính.");
      return true;
    }
    case "rent":
      requireGame(
        s.age >= 18 && !s.prisonYears,
        "Chỗ ở riêng mở khi trưởng thành và không thụ án.",
      );
      money(s, -localPrice(s, 2000000), "Đặt cọc phòng thuê");
      s.housing = "rent";
      s.assets.forEach((x) => (x.primary = false));
      addLog(
        s,
        "Bạn chuyển sang phòng thuê. Khoản thuê và sinh hoạt nằm trong chi phí năm.",
      );
      return true;
    case "enroll": {
      const reason = educationReason(s, a.id);
      requireGame(!reason, reason ?? "Chưa đủ điều kiện học.");
      const p = educationById.get(a.id)!;
      const scholarship = s.education.score >= 85 && p.cost > 0;
      const fee = tuitionQuote(s, p.cost, scholarship).due;
      if (s.money < fee) {
        requireGame(
          a.loan &&
            s.money + 30_000_000 - s.debts.reduce((n, d) => n + d.balance, 0) >=
              fee,
          "Chưa đủ học phí. Bạn có thể chọn khoản vay trong hạn mức.",
        );
      }
      chargeTuition(s, p.cost, "Học phí nhập học", !!a.loan, scholarship);
      flag(s, "scholarship", scholarship);
      requireGame(
        !p.specialty ||
          [
            ...industries,
            ...(s.flags.includes("apk_mode") ? apkMajors : []),
          ].some((i) => i.id === (a.specialty ?? "congnghe")),
        "Chuyên ngành không hợp lệ.",
      );
      s.education.current = {
        id: p.id,
        year: 0,
        score: Math.round((s.education.score + s.stats.intelligence) / 2),
        specialty: p.specialty ? (a.specialty ?? "congnghe") : "",
      };
      flag(s, "in_school");
      if (p.id === "edu_return_school") flag(s, "returned_school");
      addLog(
        s,
        `Bạn ghi danh ${p.name}${scholarship ? " với học bổng 50%" : ""}.`,
      );
      return true;
    }
    case "dropout":
      requireGame(s.education.current, "Bạn chưa theo học chương trình nào.");
      s.education.current = null;
      flag(s, "in_school", false);
      flag(s, "dropout");
      addLog(s, "Bạn tạm dừng học, bằng đã hoàn thành vẫn được giữ.");
      return true;
    case "job": {
      const reason = jobReason(s, a.id);
      requireGame(!reason, reason ?? "Chưa đủ điều kiện.");
      requireGame(s.job?.id !== a.id, "Bạn đã làm nghề này.");
      const j = jobById.get(a.id)!;
      s.job = {
        id: j.id,
        rank: 0,
        years: 0,
        performance: 60,
        salary: localPrice(s, j.ranks[0].salary),
      };
      s.pension = 0;
      count(s, "jobs");
      addLog(
        s,
        `Bạn được nhận làm ${j.name}. Lương bắt đầu trong năm làm việc tiếp theo.`,
      );
      return true;
    }
    case "quit":
      requireGame(s.job, "Bạn chưa có nghề để nghỉ.");
      s.job = null;
      addLog(s, "Bạn nghỉ công việc hiện tại.");
      return true;
    case "retire":
      requireGame(s.job, "Bạn chưa có nghề để nghỉ hưu.");
      requireGame(
        s.age >= jobById.get(s.job.id)!.retireAge,
        "Bạn chưa đến tuổi nghỉ hưu của nghề trong game.",
      );
      s.pension = Math.round(
        s.job.salary * Math.min(0.65, 0.2 + s.job.years * 0.01),
      );
      s.job = null;
      flag(s, "retired");
      addLog(s, "Bạn nghỉ hưu. Trợ cấp được tính từ năm tiếp theo.");
      return true;
    case "workHard":
      requireGame(
        s.job && s.time >= 2 && !s.prisonYears,
        "Cần đang làm việc và còn 2 điểm thời gian.",
      );
      s.time -= 2;
      s.job.performance = Math.min(100, s.job.performance + 12);
      stat(s, "health", -2);
      addLog(
        s,
        "Bạn dành thêm thời gian cho công việc, hiệu suất tăng nhưng cần nghỉ sau đó.",
      );
      return true;
    case "sideJob": {
      requireGame(
        s.age >= 13 && !s.prisonYears && s.time >= 2,
        "Cần từ 13 tuổi, không thụ án và còn 2 điểm thời gian.",
      );
      const offer = sideJobs.find((j) => j.name === a.id);
      requireGame(offer, "Việc làm thêm không hợp lệ.");
      requireGame(
        s.age >= offer.minAge,
        `Việc này mở từ ${offer.minAge} tuổi.`,
      );
      requireGame(
        !s.sideJob || s.sideJob === a.id,
        "Mỗi năm chỉ nhận một loại việc làm thêm.",
      );
      const key = "side_job";
      requireGame(
        (s.activityUses[key] ?? 0) < 3,
        "Bạn đã làm thêm đủ 3 lượt trong năm.",
      );
      s.sideJob = a.id;
      s.activityUses[key] = (s.activityUses[key] ?? 0) + 1;
      s.time -= 2;
      money(s, localPrice(s, 250000 + Math.round(random(s) * 250000)), a.id);
      count(s, "skills");
      addLog(
        s,
        `Bạn hoàn thành một lượt ${a.id.toLowerCase()} và nhận tiền công.`,
      );
      return true;
    }
    default:
      return false;
  }
}
