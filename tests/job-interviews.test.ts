import { describe, it, expect } from "vitest";
import { newLife, reduce } from "../src/engine/game";
import { interviewView } from "../src/engine/interviews";
import { apkInterviews, apkJobs, jobs } from "../src/content/catalog";
import { serialize, parseSave } from "../src/engine/save";
import { localPrice } from "../src/engine/world";
import { jobReason } from "../src/engine/economy";
import type { Action } from "../src/engine/types";
const options = {
  name: "An",
  gender: "female" as const,
  hometown: "Huế",
  birthDate: "2000-01-01",
  seed: 42,
  contentMode: "apk" as const,
};
function adult() {
  const s = newLife(options);
  s.age = 30;
  s.stats = { health: 100, happiness: 100, intelligence: 100, looks: 100 };
  return s;
}
function apply() {
  return reduce(adult(), { type: "job", id: apkJobs[0].id });
}
describe("APK job interviews", () => {
  it("keeps all 46 source questions and 810 scored answers playable across save roundtrips", () => {
    expect(apkInterviews).toHaveLength(46);
    const base = apply();
    let total = 0;
    for (const question of apkInterviews) {
      for (const answer of [
        ...question.answers,
        ...(question.defaultAnswer ? [question.defaultAnswer] : []),
      ]) {
        const s = structuredClone(base);
        s.jobInterview!.questionId = question.id;
        s.jobInterview!.answerIds = question.answers
          .filter((a) => a.id !== answer.id)
          .slice(0, 3)
          .map((a) => a.id);
        if (answer !== question.defaultAnswer)
          s.jobInterview!.answerIds[0] = answer.id;
        const restored = parseSave(serialize(s));
        expect(interviewView(restored)).toEqual(interviewView(s));
        const result = reduce(restored, {
          type: "interviewAnswer",
          id: restored.jobInterview!.id,
          answerId: answer.id,
        });
        expect(result.job?.id ?? null, answer.id).toBe(
          answer.score >= 4 ? apkJobs[0].id : null,
        );
        expect(result.jobInterview).toBeNull();
        expect(result.time).toBe(11);
        expect(result.money).toBe(s.money);
        if (result.job)
          expect(result.job.salary).toBe(
            localPrice(s, apkJobs[0].ranks[0].salary),
          );
        expect(() => parseSave(serialize(result)), answer.id).not.toThrow();
        total++;
      }
    }
    expect(total).toBe(810);
  }, 30000);
  it("draws three distinct source answers, preserves them and blocks other actions or stale replies", () => {
    const s = apply(),
      copy = apply(),
      rng = s.rng;
    expect(copy.jobInterview).toEqual(s.jobInterview);
    expect(s.job).toBeNull();
    expect(s.jobInterview!.answerIds).toHaveLength(3);
    expect(new Set(s.jobInterview!.answerIds).size).toBe(3);
    expect(interviewView(parseSave(serialize(s)))).toEqual(interviewView(s));
    expect(s.rng).toBe(rng);
    const actions: Action[] = [
      { type: "age" },
      { type: "job", id: apkJobs[1].id },
      { type: "storyStart", id: "story_missing" },
    ];
    for (const action of actions)
      expect(() => reduce(s, action)).toThrow(/phỏng vấn/);
    expect(() =>
      reduce(s, { type: "interviewAnswer", id: "stale", answerId: null }),
    ).toThrow();
    expect(() =>
      reduce(s, {
        type: "interviewAnswer",
        id: s.jobInterview!.id,
        answerId: "forged",
      }),
    ).toThrow();
    expect(() =>
      reduce({ ...adult(), time: 0 }, { type: "job", id: apkJobs[0].id }),
    ).toThrow();
  });
  it("keeps the existing job, pension and money when refused or withdrawn", () => {
    const original = adult();
    original.job = {
      id: jobs[0].id,
      rank: 0,
      years: 4,
      performance: 77,
      salary: localPrice(original, jobs[0].ranks[0].salary),
    };
    original.pension = 1000000;
    const s = reduce(original, { type: "job", id: apkJobs[0].id });
    expect(s.job).toEqual(original.job);
    const q = apkInterviews.find((q) => q.answers.some((a) => a.score === 1))!;
    s.jobInterview!.questionId = q.id;
    s.jobInterview!.answerIds = q.answers.slice(0, 3).map((a) => a.id);
    s.jobInterview!.answerIds[0] = q.answers.find((a) => a.score === 1)!.id;
    const failed = reduce(s, {
      type: "interviewAnswer",
      id: s.jobInterview!.id,
      answerId: s.jobInterview!.answerIds[0],
    });
    const cancelled = reduce(s, {
      type: "interviewAnswer",
      id: s.jobInterview!.id,
      answerId: null,
    });
    for (const result of [failed, cancelled]) {
      expect(result.job).toEqual(original.job);
      expect(result.pension).toBe(original.pension);
      expect(result.money).toBe(original.money);
      expect(result.time).toBe(11);
    }
    expect(original.time).toBe(12);
    expect(original.jobInterview).toBeNull();
  });
  it("rejects forged offer context, duplicates and impossible concurrent state", () => {
    const s = apply();
    for (const patch of [
      { questionId: "missing" },
      { jobId: jobs[0].id },
      { age: 31 },
      {
        answerIds: [
          s.jobInterview!.answerIds[0],
          s.jobInterview!.answerIds[0],
          s.jobInterview!.answerIds[0],
        ],
      },
      { answerIds: ["forged", ...s.jobInterview!.answerIds.slice(1)] },
    ]) {
      const data = JSON.parse(serialize(s));
      Object.assign(data.game.jobInterview, patch);
      expect(() => parseSave(JSON.stringify(data))).toThrow();
    }
    const data = JSON.parse(serialize(s));
    data.game.prisonYears = 1;
    expect(() => parseSave(JSON.stringify(data))).toThrow();
    const blocked = structuredClone(s);
    blocked.prisonYears = 1;
    expect(() =>
      reduce(blocked, {
        type: "interviewAnswer",
        id: s.jobInterview!.id,
        answerId: s.jobInterview!.answerIds[0],
      }),
    ).toThrow();
  });
  it("migrates 1.4 without consuming RNG and keeps original web hiring immediate", () => {
    const old = adult(),
      data = JSON.parse(serialize(old));
    data.game.contentVersion = "1.4.0";
    delete data.game.jobInterview;
    const upgraded = parseSave(JSON.stringify(data));
    expect(upgraded.jobInterview).toBeNull();
    expect(upgraded.rng).toBe(old.rng);
    const web = newLife({ ...options, contentMode: "web" });
    web.age = 30;
    web.education.completed = ["edu_upper_secondary"];
    web.stats = { health: 100, happiness: 100, intelligence: 100, looks: 100 };
    const available = jobs.find((j) => !jobReason(web, j.id))!;
    const hired = reduce(web, { type: "job", id: available.id });
    expect(hired.job!.id).toBe(available.id);
    expect(hired.jobInterview).toBeNull();
    expect(hired.rng).toBe(web.rng);
    expect(hired.time).toBe(web.time);
  });
});
