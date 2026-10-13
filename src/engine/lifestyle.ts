import type { Activity, Action, GameState } from "./types";
import {
  addLog,
  clamp,
  flag,
  makePerson,
  money,
  requireGame,
  stat,
} from "./helpers";
import { random } from "./rng";
import { localPrice } from "./world";
import { changeContext } from "./changes";
export const HAIR_COLORS: Record<string, string> = {
  black: "#242424",
  brown: "#655047",
  blonde: "#c8a35c",
  auburn: "#994d3a",
  blue: "#366eb5",
  purple: "#8056a8",
  gray: "#d7d7d3",
};
export const HAIR_STYLES = ["natural", "short", "long", "curly", "bob", "buzz"];
export const NAIL_STYLES = ["natural", "clear", "red", "pastel", "dark"];
export const emptyAppearance = () => ({
  hairColor: "natural",
  hairStyle: "natural",
  nails: "natural",
  tanned: false,
});
export function specialActivity(
  s: GameState,
  activity: Activity,
  a: Extract<Action, { type: "activity" }>,
) {
  const feature = activity.feature;
  if (!feature) return;
  const uses = s.activityUses[activity.id] ?? 1;
  if (feature.type === "practice") {
    const option =
      feature.options?.find((o) => o.id === a.optionId) ?? feature.options?.[0];
    requireGame(
      !a.optionId ||
        !feature.options ||
        !!feature.options.find((o) => o.id === a.optionId),
      "Lựa chọn luyện tập không hợp lệ.",
    );
    const key = option?.id ?? feature.skill,
      before = s.skills[key] ?? 0;
    s.skills[key] = clamp(
      before + Math.max(1, Math.round((5 + random(s) * 5) / uses)),
    );
    if (
      ["acting", "voice", "modeling"].includes(feature.skill) &&
      s.skills[key] >= 35
    )
      s.fame = clamp(s.fame + 2);
    addLog(
      s,
      `${option?.label ?? activity.name}: kỹ năng ${before} → ${s.skills[key]}/100. ${feature.skill === "martial" ? "Bạn luyện kỹ thuật và tự kiểm soát, không dùng để gây hấn." : "Tiến trình được giữ trong đời này."}`,
    );
  } else if (feature.type === "style") {
    const option =
      feature.options.find((o) => o.id === a.optionId) ?? feature.options[0];
    requireGame(
      !a.optionId || feature.options.some((o) => o.id === a.optionId),
      "Kiểu chăm sóc không hợp lệ.",
    );
    s.appearance[feature.field] = option.id;
    addLog(
      s,
      `Bạn chọn ${option.label.toLowerCase()}; hình đại diện và hồ sơ giữ thay đổi này.`,
    );
  } else if (feature.type === "diet") {
    const option =
      feature.options.find((o) => o.id === a.optionId) ?? feature.options[0];
    requireGame(
      !a.optionId || feature.options.some((o) => o.id === a.optionId),
      "Thực đơn không hợp lệ.",
    );
    for (const f of ["diet_balanced", "diet_plant", "diet_training"])
      flag(s, f, false);
    flag(s, `diet_${option.id}`);
    addLog(
      s,
      `Bạn chọn ${option.label.toLowerCase()} trong game. Thói quen ảnh hưởng sức khoẻ ở những năm sau.`,
    );
  } else if (feature.type === "tan") {
    if (random(s) < 0.12) {
      changeContext(
        s,
        "activity",
        "Buổi làm rám da không như dự tính, bạn cần nghỉ để hồi phục.",
      );
      stat(s, "health", -4);
      stat(s, "looks", -2);
    } else s.appearance.tanned = true;
  } else if (feature.type === "memory") {
    const score = clamp(
      Math.round(s.stats.intelligence + (random(s) - 0.5) * 30),
    );
    s.counters.memory_best = Math.max(s.counters.memory_best ?? 0, score);
    addLog(
      s,
      `Bài đánh giá trí nhớ hư cấu: ${score}/100. Kết quả tốt nhất: ${s.counters.memory_best}/100; không thay đánh giá y khoa.`,
    );
  } else if (feature.type === "fame") {
    const before = s.fame;
    if (feature.action === "crashout") {
      s.fame = clamp(s.fame + 8 + Math.floor(random(s) * 9));
      s.reputation = clamp(s.reputation - 20);
      flag(s, "late_nights");
      for (const r of s.relations.filter((r) => r.alive))
        r.closeness = clamp(r.closeness - 3);
      addLog(
        s,
        "Bữa tiệc và phát ngôn bốc đồng thu hút chú ý, nhưng uy tín và lòng tin giảm.",
      );
    } else {
      const success =
        random(s) <
        Math.min(
          0.95,
          0.45 +
            s.reputation / 250 +
            (feature.action === "book"
              ? s.stats.intelligence / 500
              : s.fame / 500),
        );
      s.fame = clamp(s.fame + (success ? 5 : 1));
      s.reputation = clamp(s.reputation + (success ? 2 : -3));
      const base = {
        book: 300000,
        commercial: 2000000,
        photoshoot: 1000000,
        talkshow: 1500000,
      }[feature.action];
      money(
        s,
        localPrice(s, Math.round(base * (success ? 1 + before / 12 : 0.1))),
        `Thù lao ${activity.name.toLowerCase()}`,
      );
      addLog(
        s,
        success
          ? "Buổi hợp tác được đón nhận; thù lao và mức nhận diện tăng."
          : "Kết quả chưa được đón nhận nhiều. Bạn nhận phần thù lao cơ bản và thêm kinh nghiệm.",
      );
    }
    addLog(
      s,
      `Danh vọng ${before} → ${s.fame}/100; uy tín ${s.reputation}/100.`,
    );
  } else if (feature.type === "love") {
    requireGame(
      s.age >= 18 && !s.loveOffer,
      "Chỉ nhân vật trưởng thành mới mở cuộc gặp và cần giải quyết lời mời trước.",
    );
    requireGame(
      !a.genderPreference ||
        ["male", "female", "any"].includes(a.genderPreference),
      "Sở thích hẹn hò không hợp lệ.",
    );
    const preference =
      feature.mode === "lgbtq"
        ? s.gender === "other"
          ? "other"
          : s.gender
        : a.genderPreference === "any" || !a.genderPreference
          ? undefined
          : a.genderPreference;
    const people = Array.from(
      { length: feature.mode === "threesome" ? 2 : 1 },
      () =>
        makePerson(
          s,
          "friend",
          Math.max(18, Math.min(110, s.age + Math.floor(random(s) * 11) - 5)),
          preference,
        ),
    );
    if (feature.mode === "celebrity")
      for (const person of people) person.trait = "người nổi tiếng hư cấu";
    const probability =
      feature.mode === "celebrity" ? Math.min(0.85, 0.15 + s.fame / 150) : 0.85;
    s.loveOffer = {
      id: `${s.id}_offer_${s.actionSerial}`,
      mode: feature.mode,
      people,
      consent: people.map(() => random(s) < probability),
    };
    addLog(
      s,
      `Bạn nhận hồ sơ một cuộc gặp ${feature.mode === "celebrity" ? "với người nổi tiếng hư cấu" : "mới"}. Bạn có thể nhận hoặc từ chối.`,
      "relationship",
    );
  }
}
export function resolveLove(s: GameState, id: string, accept: boolean) {
  const offer = s.loveOffer;
  requireGame(offer && offer.id === id, "Lời mời này đã được xử lý.");
  requireGame(
    !accept || offer.consent.every(Boolean),
    "Cuộc gặp chỉ diễn ra khi mọi người cùng đồng ý.",
  );
  changeContext(
    s,
    "relationship",
    accept
      ? "Bạn nhận một cuộc gặp tự nguyện giữa những người trưởng thành."
      : "Bạn từ chối lời mời và giữ giới hạn của mình.",
  );
  if (accept) {
    requireGame(
      s.relations.length + offer.people.length <= 250,
      "Đã đạt giới hạn người trong hồ sơ.",
    );
    const casual = ["hookup", "threesome"].includes(offer.mode),
      partner = s.relations.find(
        (r) => r.alive && ["lover", "spouse"].includes(r.role),
      );
    requireGame(casual || !partner, "Bạn đã có người yêu hoặc bạn đời.");
    for (const person of offer.people) {
      person.role = casual ? "friend" : "lover";
      person.closeness = casual ? 35 : 55;
      s.relations.push(person);
    }
    stat(s, "happiness", 3);
    if (casual) {
      flag(s, "casual_meeting");
      if (partner) {
        partner.closeness = clamp(partner.closeness - 20);
        flag(s, "relationship_tension");
        stat(s, "happiness", -6);
        addLog(
          s,
          "Cuộc gặp ngoài quan hệ hiện tại khiến lòng tin bị tổn thương.",
          "relationship",
        );
      }
    }
    addLog(
      s,
      casual
        ? "Những người trưởng thành cùng đồng ý dành một buổi riêng tư; câu chuyện dừng ở đây."
        : `Bạn bắt đầu hẹn hò với ${offer.people[0].name}.`,
      "relationship",
    );
  } else
    addLog(
      s,
      "Bạn lịch sự từ chối. Không ai cần phải tiếp tục một cuộc gặp khi không muốn.",
      "relationship",
    );
  s.loveOffer = null;
}
