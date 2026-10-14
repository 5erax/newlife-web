import type { GameState } from "./types";
import { apkInterviews, jobById } from "../content/catalog";
import { random, pick } from "./rng";
import { requireGame, addLog, count } from "./helpers";
import { jobReason, hireJob } from "./economy";

export function interviewView(s: GameState) {
  const offer = s.jobInterview;
  requireGame(offer, "Không có phỏng vấn đang chờ.");
  const q = apkInterviews.find((q) => q.id === offer.questionId),
    job = jobById.get(offer.jobId);
  requireGame(
    q && job?.sourceKind === "apk_translation" && s.flags.includes("apk_mode"),
    "Ngữ cảnh phỏng vấn không hợp lệ.",
  );
  requireGame(
    s.phase === "ready" &&
      offer.age === s.age &&
      !s.pending &&
      !s.loveOffer &&
      !s.casino.hand &&
      s.job?.id !== job.id,
    "Trạng thái phỏng vấn không hợp lệ.",
  );
  const reason = jobReason(s, job.id);
  requireGame(!reason, reason ?? "Chưa đủ điều kiện tuyển dụng.");
  requireGame(
    offer.answerIds.length === 3 &&
      new Set(offer.answerIds).size === 3 &&
      offer.answerIds.every((id) => q.answers.some((a) => a.id === id)),
    "Đáp án phỏng vấn không hợp lệ.",
  );
  const answers = offer.answerIds.map(
    (id) => q.answers.find((a) => a.id === id)!,
  );
  if (q.defaultAnswer) answers.push(q.defaultAnswer);
  return { job, question: q.question, cta: q.cta, answers };
}

// shortcut: weighting, three sampled answers, a 4/5 hiring threshold and one time point are web rules; replace only with verified native formulas.
export function startInterview(s: GameState, jobId: string) {
  const reason = jobReason(s, jobId);
  requireGame(!reason, reason ?? "Chưa đủ điều kiện tuyển dụng.");
  requireGame(
    s.time >= 1 && s.job?.id !== jobId,
    "Cần còn thời gian và chưa làm nghề này.",
  );
  let draw =
    random(s) * apkInterviews.reduce((sum, q) => sum + q.commonness, 0);
  const q =
    apkInterviews.find((q) => (draw -= q.commonness) < 0) ??
    apkInterviews.at(-1)!;
  const pool = [...q.answers],
    answerIds: string[] = [];
  for (let n = 0; n < 3; n++) {
    const answer = pick(s, pool);
    answerIds.push(answer.id);
    pool.splice(pool.indexOf(answer), 1);
  }
  s.time--;
  s.jobInterview = {
    id: `${s.id}_interview_${s.actionSerial}`,
    age: s.age,
    jobId,
    questionId: q.id,
    answerIds,
  };
  interviewView(s);
  addLog(s, `Bạn tham dự phỏng vấn cho vị trí ${jobById.get(jobId)!.name}.`);
}
export function answerInterview(
  s: GameState,
  id: string,
  answerId: string | null,
) {
  requireGame(
    s.jobInterview?.id === id,
    "Phỏng vấn đã được xử lý hoặc không còn ở đây.",
  );
  const view = interviewView(s);
  const answer =
    answerId === null ? undefined : view.answers.find((a) => a.id === answerId);
  requireGame(answerId === null || answer, "Đáp án không thuộc phỏng vấn này.");
  s.jobInterview = null;
  if (!answer) {
    addLog(s, `Bạn rút hồ sơ ứng tuyển ${view.job.name}.`);
    return;
  }
  count(s, "interviews");
  addLog(
    s,
    `${view.question} — ${answer.label}. Điểm trả lời ${answer.score}/5.`,
  );
  if (answer.score >= 4) hireJob(s, view.job.id);
  else {
    count(s, "interview_refusals");
    addLog(s, `Bạn chưa được nhận vào vị trí ${view.job.name} sau phỏng vấn.`);
  }
}
