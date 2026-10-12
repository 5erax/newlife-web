import type {
  Action,
  Activity,
  GameState,
  NewLifeOptions,
  Profile,
} from "./types";
import { CONTENT_VERSION } from "./types";
import {
  activities,
  stories,
  educationById,
  assetById,
} from "../content/catalog";
import { applyEffects } from "./effects";
import { chooseOutcome, eligible } from "./conditions";
import { random } from "./rng";
import { economyAction } from "./economy";
import {
  achievementCheck,
  advanceQueue,
  deathChance,
  finishLife,
  startYear,
} from "./year";
import {
  addLog,
  count,
  flag,
  initialMarket,
  makePerson,
  money,
  relation,
  requireGame,
  stat,
  ownAsset,
  identityDigest,
  estateReceipt,
} from "./helpers";
import {
  operate,
  relationActionCost,
  relationRoleForAction,
} from "./relations";
export const emptyProfile = (): Profile => ({
  unlockLives: {},
  achievements: [],
  endings: {},
  summaries: [],
  estateReceipts: [],
});
export function newLife(
  options: NewLifeOptions,
  profile: Profile = emptyProfile(),
): GameState {
  requireGame(
    options.name.trim().length >= 1 && options.name.length <= 80,
    "Tên cần từ 1 đến 80 ký tự.",
  );
  requireGame(
    options.hometown.length >= 1 && options.hometown.length <= 100,
    "Quê quán không hợp lệ.",
  );
  requireGame(
    ["male", "female", "other"].includes(options.gender),
    "Giới tính không hợp lệ.",
  );
  requireGame(
    Number.isInteger(options.seed) &&
      options.seed >= 0 &&
      options.seed <= 4294967295,
    "Seed không hợp lệ.",
  );
  const date = new Date(options.birthDate + "T00:00:00Z");
  requireGame(
    /^\d{4}-\d{2}-\d{2}$/.test(options.birthDate) &&
      !Number.isNaN(date.valueOf()) &&
      date.toISOString().slice(0, 10) === options.birthDate &&
      date.getUTCFullYear() >= 1900 &&
      date.getUTCFullYear() <= 9999,
    "Ngày sinh không hợp lệ.",
  );
  requireGame(
    !options.id || /^[a-z0-9_]{1,80}$/.test(options.id),
    "ID cuộc đời không hợp lệ.",
  );
  const identity = options.id ?? `life_${options.seed.toString(16)}`;
  const s: GameState = {
    schemaVersion: 1,
    contentVersion: CONTENT_VERSION,
    id: identity,
    revision: 0,
    rng: options.seed,
    phase: "ready",
    age: 0,
    name: options.name.trim(),
    gender: options.gender,
    hometown: options.hometown,
    birthDate: options.birthDate,
    stats: { health: 80, happiness: 50, intelligence: 50, looks: 50 },
    money: 0,
    education: { completed: [], current: null, score: 50, specialty: "" },
    job: null,
    sideJob: null,
    pension: 0,
    assets: [],
    market: initialMarket(),
    housing: "family",
    relations: [],
    illnesses: [],
    flags: [],
    counters: {},
    history: {},
    pending: null,
    yearQueue: [],
    scheduled: [],
    time: 12,
    activityUses: {},
    actionSerial: 0,
    ledger: [],
    debts: [],
    prisonYears: 0,
    medals: [],
    log: [],
    deathCause: null,
    estate: {
      id: `estate_${identity}`,
      settled: false,
      shares: {},
      received: [],
      distributions: {},
    },
    profile: structuredClone(profile),
    story: null,
  };
  s.stats = {
    health: Math.floor(65 + random(s) * 36),
    happiness: Math.floor(35 + random(s) * 66),
    intelligence: Math.floor(10 + random(s) * 91),
    looks: Math.floor(10 + random(s) * 91),
  };
  s.education.score = s.stats.intelligence;
  s.relations.push(
    makePerson(s, "mother", 24 + Math.floor(random(s) * 15)),
    makePerson(s, "father", 25 + Math.floor(random(s) * 18)),
  );
  if (random(s) < 0.65)
    s.relations.push(makePerson(s, "sibling", 1 + Math.floor(random(s) * 8)));
  addLog(
    s,
    `Bạn là ${s.name}, sinh ngày ${options.birthDate.split("-").reverse().join("/")} tại ${s.hometown}. Một câu chuyện mới bắt đầu.`,
  );
  if (random(s) < deathChance(0, s.stats.health))
    finishLife(s, "Một biến cố sức khoẻ rất sớm trong game");
  return s;
}
export function activityTargets(s: GameState, a: Activity) {
  if (a.target === "relation")
    return s.relations
      .filter(
        (r) => r.alive && (!a.targetRoles || a.targetRoles.includes(r.role)),
      )
      .map((r) => ({ id: r.id, name: r.name }));
  if (a.target === "illness")
    return s.illnesses.map((i) => ({ id: i.id, name: i.type }));
  if (a.target === "pet")
    return s.assets
      .filter(
        (x) =>
          x.alive &&
          assetById.get(x.catalogId)?.category === "pet" &&
          (a.id === "act_thucung_08" ? x.lost : !x.lost),
      )
      .map((x) => ({
        id: x.instanceId,
        name: `${assetById.get(x.catalogId)!.name} · ${x.age} tuổi`,
      }));
  if (a.target === "asset") {
    const required = a.conditions.find((c) => "has" in c && c.has === "asset");
    return s.assets
      .filter(
        (x) =>
          x.alive &&
          assetById.get(x.catalogId)?.category !== "pet" &&
          (!required ||
            !("has" in required) ||
            required.id === "any" ||
            assetById.get(x.catalogId)?.category === required.id),
      )
      .map((x) => ({
        id: x.instanceId,
        name: assetById.get(x.catalogId)!.name,
      }));
  }
  return [];
}
export function activityReason(s: GameState, a: Activity) {
  if (s.phase !== "ready") return "Hãy giải quyết sự kiện đang chờ.";
  if (s.age < a.minAge) return `Mở từ ${a.minAge} tuổi.`;
  if (s.prisonYears > 0 && !["hoctap", "suckhoe"].includes(a.group))
    return "Hoạt động bên ngoài chưa mở khi thụ án.";
  if (!eligible(s, a.conditions))
    return "Chưa có điều kiện, đối tượng hoặc tài sản phù hợp.";
  if (s.money < a.cost) return "Chưa đủ tiền.";
  if (s.time < a.timeCost) return "Chưa đủ điểm thời gian trong năm.";
  if ((s.activityUses[a.id] ?? 0) >= a.maxUsesPerYear)
    return "Đã đủ lượt trong năm.";
  if (a.target && !activityTargets(s, a).length)
    return "Chưa có đối tượng phù hợp.";
  return null;
}
function storyAction(s: GameState, a: Action): boolean {
  if (a.type === "storyStart") {
    const story = stories.find((x) => x.id === a.id);
    requireGame(story, "Không tìm thấy truyện.");
    if (s.story?.storyId === a.id) return true;
    s.story = {
      storyId: story.id,
      nodeId: story.start,
      flags: [],
      turns: 0,
      rng: Math.floor(random({ rng: s.rng }) * 4294967295),
    };
    return true;
  }
  if (a.type === "storyClose") {
    s.story = null;
    return true;
  }
  if (a.type === "storyChoice") {
    const active = s.story;
    requireGame(
      active && active.nodeId === a.nodeId,
      "Nút truyện này đã thay đổi.",
    );
    const story = stories.find((x) => x.id === active.storyId)!;
    const node = story.nodes.find((n) => n.id === active.nodeId)!;
    const choice = node.choices.find((c) => c.id === a.choiceId);
    requireGame(
      choice && (!choice.requires || active.flags.includes(choice.requires)),
      "Lựa chọn truyện không hợp lệ.",
    );
    requireGame(
      active.turns < 64,
      "Truyện vượt giới hạn lượt; hãy xuất file để kiểm tra.",
    );
    active.turns++;
    if (choice.set && !active.flags.includes(choice.set))
      active.flags.push(choice.set);
    const next = story.nodes.find((n) => n.id === choice.next);
    requireGame(next, "Nhánh truyện không tồn tại.");
    active.nodeId = next.id;
    if (next.ending) {
      const endings = s.profile.endings[story.id] ?? [];
      s.profile.endings[story.id] = Array.from(
        new Set([...endings, next.ending.id]),
      );
      if (s.profile.endings[story.id].length >= 3) flag(s, "story_all_endings");
      achievementCheck(s);
    }
    return true;
  }
  return false;
}
function childLife(s: GameState, id: string) {
  requireGame(
    s.phase === "dead" && s.estate.settled,
    "Chỉ tiếp tục làm con sau khi đời này đã kết thúc.",
  );
  const child = relation(s, id, ["child"]);
  requireGame(child && child.role === "child", "Người con này không còn sống.");
  const receipt = estateReceipt(s.estate.id, id);
  requireGame(
    !s.profile.estateReceipts.includes(receipt),
    "Di sản này đã được nhận trong hồ sơ.",
  );
  s.profile.estateReceipts.push(receipt);
  const seed = Math.floor(random(s) * 4294967295);
  const digest = identityDigest(s.id + ":" + id);
  const next = newLife(
    {
      id: `life_${seed.toString(16)}_${digest}`,
      name: child.name,
      gender: child.gender ?? "other",
      hometown: s.hometown,
      birthDate: s.birthDate,
      seed,
    },
    s.profile,
  );
  next.birthDate =
    String(Number(s.birthDate.slice(0, 4)) + s.age - child.age).padStart(
      4,
      "0",
    ) + s.birthDate.slice(4);
  if (
    next.birthDate.endsWith("02-29") &&
    new Date(next.birthDate + "T00:00:00Z").toISOString().slice(0, 10) !==
      next.birthDate
  )
    next.birthDate = next.birthDate.slice(0, 8) + "28";
  next.age = child.age;
  next.money = s.estate.distributions[id] ?? 0;
  next.log = [];
  next.deathCause = null;
  next.phase = "ready";
  next.estate.settled = false;
  next.profile.summaries = next.profile.summaries.filter(
    (x) => x.lifeId !== next.id,
  );
  next.relations = s.relations
    .filter(
      (r) =>
        r.id !== id &&
        (child.parents.includes(r.id) || !["lover", "friend"].includes(r.role)),
    )
    .map((r) => ({
      ...r,
      role: child.parents.includes(r.id)
        ? r.gender === "female"
          ? "mother"
          : r.gender === "male"
            ? "father"
            : "parent"
        : r.role === "mother"
          ? "grandmother"
          : r.role === "father"
            ? "grandfather"
            : r.role === "parent"
              ? "grandparent"
              : r.role === "child"
                ? "sibling"
                : "relative",
    }));
  next.relations.push({
    id: s.id,
    name: s.name,
    gender: s.gender,
    role:
      s.gender === "female"
        ? "mother"
        : s.gender === "male"
          ? "father"
          : "parent",
    age: s.age,
    closeness: child.closeness,
    alive: false,
    trait: "được nhớ",
    resources: 0,
    parents: [],
  });
  next.education.completed =
    next.age >= 18
      ? ["edu_primary", "edu_lower_secondary", "edu_upper_secondary"]
      : next.age >= 15
        ? ["edu_primary", "edu_lower_secondary"]
        : next.age >= 11
          ? ["edu_primary"]
          : [];
  if (next.age >= 6 && next.age < 18) {
    const program =
      next.age < 11
        ? "edu_primary"
        : next.age < 15
          ? "edu_lower_secondary"
          : "edu_upper_secondary";
    next.education.current = {
      id: program,
      year: next.age - educationById.get(program)!.minAge,
      score: next.stats.intelligence,
      specialty: "",
    };
    flag(next, "in_school");
  }
  flag(next, "continued_child");
  addLog(
    next,
    `Bạn tiếp tục làm ${child.name} ở tuổi ${child.age}. Thông tin chưa có về học tập được khởi tạo theo quy tắc bản web; bạn nhận đúng phần di sản của mình.`,
  );
  achievementCheck(next);
  return next;
}
export function reduce(input: GameState, a: Action): GameState {
  // Log, ledger và summary chỉ được nối; chia sẻ dòng cũ để không sao chép lại cả đời ở mỗi thao tác.
  let s = structuredClone({
    ...input,
    log: [],
    ledger: [],
    history: {},
    profile: { ...input.profile, summaries: [] },
  }) as GameState;
  s.log = [...input.log];
  s.ledger = [...input.ledger];
  s.history = { ...input.history };
  s.profile.summaries = [...input.profile.summaries];
  s.revision++;
  s.actionSerial++;
  if (storyAction(s, a)) return s;
  if (a.type === "continueChild") return childLife(s, a.id);
  requireGame(
    s.phase !== "dead",
    "Cuộc đời đã kết thúc. Hãy bắt đầu một đời khác.",
  );
  if (a.type === "choose") {
    requireGame(
      s.phase === "awaiting_choice" && s.pending?.instanceId === a.instanceId,
      "Sự kiện này đã được xử lý hoặc không còn ở đây.",
    );
    const event = s.pending.event;
    const choice = event.choices.find((c) => c.id === a.optionId);
    requireGame(
      choice && eligible(s, choice.conditions),
      "Lựa chọn chưa đủ điều kiện.",
    );
    const result = chooseOutcome(s, choice.outcomes);
    addLog(s, event.text, "event");
    addLog(s, `${choice.label}: ${result.text}`, "event");
    applyEffects(s, result.effects);
    s.pending = null;
    count(s, "chainSteps");
    requireGame(
      (s.counters.chainSteps ?? 0) <= 32,
      "Nhánh vượt 32 bước trong một năm.",
    );
    if (s.deathCause) finishLife(s, s.deathCause);
    else {
      if (result.nextEvent) s.yearQueue.unshift(result.nextEvent);
      if (result.schedule)
        s.scheduled.push({
          eventId: result.schedule.eventId,
          age: s.age + result.schedule.afterYears,
        });
      advanceQueue(s);
    }
    achievementCheck(s);
    return s;
  }
  requireGame(
    s.phase === "ready",
    "Hãy giải quyết sự kiện trước khi làm việc khác.",
  );
  if (a.type === "age") {
    startYear(s);
    return s;
  }
  if (a.type === "activity") {
    const activity = activities.find((x) => x.id === a.id);
    requireGame(activity, "Không tìm thấy hoạt động.");
    const reason = activityReason(s, activity);
    requireGame(!reason, reason ?? "Chưa đủ điều kiện.");
    if (activity.target)
      requireGame(
        activityTargets(s, activity).some((t) => t.id === a.targetId),
        "Hãy chọn đúng người hoặc tài sản cho hoạt động.",
      );
    money(s, -activity.cost, activity.name);
    s.time -= activity.timeCost;
    s.activityUses[a.id] = (s.activityUses[a.id] ?? 0) + 1;
    count(s, `group_${activity.group}`);
    if (["thechat", "suckhoe"].includes(activity.group))
      count(s, "healthy_activities");
    if (activity.crimeCategory) count(s, `crime_${activity.crimeCategory}`);
    const result = chooseOutcome(s, activity.outcomes);
    applyEffects(s, result.effects, a.targetId);
    addLog(s, `${activity.name}: ${result.text}`, "event");
    if (s.deathCause) finishLife(s, s.deathCause);
  } else if (a.type === "relation") {
    requireGame(
      s.time >= 1 && !s.prisonYears,
      "Cần còn thời gian và không đang thụ án.",
    );
    const target = relation(s, a.id, relationRoleForAction(a.action));
    requireGame(target, "Người này không còn phù hợp.");
    const key = `relation_${a.id}_${a.action}`;
    requireGame(
      (s.activityUses[key] ?? 0) < 2,
      "Tương tác này đã đủ 2 lượt trong năm.",
    );
    money(s, -relationActionCost(a.action), `Tương tác với ${target.name}`);
    s.time--;
    s.activityUses[key] = (s.activityUses[key] ?? 0) + 1;
    operate(s, a.action, 1, a.id);
    stat(s, "happiness", a.action === "argue" ? -3 : 2);
    addLog(
      s,
      `Bạn ${{ talk: "trò chuyện", gift: "tặng quà", argue: "tranh cãi", apologize: "xin lỗi", support: "xin hỗ trợ", date: "hẹn hò", propose: "cầu hôn", baby: "lập kế hoạch có con", adoptChild: "nhận nuôi con", breakup: "chia tay", divorce: "ly hôn" }[a.action]} với ${target.name}.`,
      "relationship",
    );
  } else if (a.type === "will") {
    requireGame(s.age >= 18, "Di chúc mở khi trưởng thành.");
    const list = Object.entries(a.shares);
    requireGame(
      list.length > 0 &&
        list.length <= 30 &&
        list.every(
          ([id, ratio]) =>
            !!relation(s, id) &&
            Number.isFinite(ratio) &&
            ratio >= 0 &&
            ratio <= 100,
        ) &&
        Math.abs(list.reduce((n, [, ratio]) => n + ratio, 0) - 100) < 1e-8,
      "Người nhận phải còn sống và tổng tỉ lệ phải bằng 100%.",
    );
    s.estate.shares = { ...a.shares };
    addLog(s, "Bạn cập nhật di chúc với người nhận và tỉ lệ rõ ràng.");
  } else requireGame(economyAction(s, a), "Hành động không được hỗ trợ.");
  achievementCheck(s);
  return s;
}
