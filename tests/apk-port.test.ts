import { describe, it, expect } from "vitest";
import { newLife, reduce } from "../src/engine/game";
import { apkEvents, apkJobs } from "../src/content/catalog";
import { eventAllowed, advanceQueue, eligibleEvents } from "../src/engine/year";
import { apkPresentation } from "../src/engine/apk";
import { jobReason, economicYear } from "../src/engine/economy";
import { parseSave, serialize } from "../src/engine/save";
import coverage from "../src/content/apk/coverage.json" with { type: "json" };
const options = {
  name: "An",
  gender: "female" as const,
  hometown: "Huế",
  birthDate: "2000-01-01",
  seed: 42,
};
describe("APK data adaptation", () => {
  it("keeps old lives separate and upgrades 1.1 saves without changing their RNG", () => {
    const old = newLife(options);
    expect(
      eligibleEvents(old).every((e) => e.sourceKind === "original_web"),
    ).toBe(true);
    const saved = JSON.parse(serialize(old));
    saved.game.contentVersion = "1.1.0";
    const restored = parseSave(JSON.stringify(saved));
    expect(restored.rng).toBe(old.rng);
    expect(restored.flags).not.toContain("apk_mode");
    const imported = newLife({ ...options, contentMode: "apk" });
    expect(imported.flags).toContain("apk_mode");
    expect(
      imported.investments.instruments.filter((i) =>
        i.id.startsWith("apk_coin_"),
      ),
    ).toHaveLength(21);
  });
  it("checks source student, career, prison, orphan and gender conditions in the engine", () => {
    const s = newLife({ ...options, contentMode: "apk" });
    s.age = 14;
    const school = apkEvents.find((e) => e.id === "apk_universal_1")!;
    expect(eventAllowed(s, school)).toBe(false);
    s.flags.push("in_school");
    s.education.current = {
      id: "edu_lower_secondary",
      year: 2,
      score: 50,
      specialty: "",
    };
    expect(eventAllowed(s, school)).toBe(true);
    const prison = apkEvents.find((e) => e.group === "apk_prison")!;
    s.age = 25;
    s.education.current = null;
    expect(eventAllowed(s, prison)).toBe(false);
    s.prisonYears = 2;
    expect(eventAllowed(s, prison)).toBe(true);
    const orphan = apkEvents.find((e) => e.group === "apk_orphan")!;
    s.age = 10;
    s.prisonYears = 0;
    expect(eventAllowed(s, orphan)).toBe(false);
    s.relations.forEach((r) => (r.alive = false));
    expect(eventAllowed(s, orphan)).toBe(true);
    const career = apkEvents.find((e) => e.id === "apk_career_11001")!;
    s.age = 30;
    expect(eventAllowed(s, career)).toBe(false);
    s.job = {
      id: career.apkRequirements!.careerId,
      rank: 0,
      years: 0,
      performance: 60,
      salary: 1000,
    };
    expect(eventAllowed(s, career)).toBe(true);
  });
  it("freezes variants across rendering, serialization and choice results, and applies actual CSV impacts", () => {
    let s = newLife({ ...options, contentMode: "apk" });
    s.age = 30;
    s.job = {
      id: apkEvents.find((e) => e.id === "apk_career_11001")!.apkRequirements!
        .careerId,
      rank: 0,
      years: 0,
      performance: 60,
      salary: 1000,
    };
    s.yearQueue = ["apk_career_11001"];
    advanceQueue(s);
    const before = s.rng,
      view = apkPresentation(s);
    expect(view.text).not.toMatch(/<[^>]+>/);
    expect(apkPresentation(s)).toEqual(view);
    expect(s.rng).toBe(before);
    const restored = parseSave(serialize(s));
    expect(apkPresentation(restored)).toEqual(view);
    s = reduce(restored, {
      type: "choose",
      instanceId: restored.pending!.instanceId,
      optionId: view.choices[0].id,
    });
    expect(s.counters.apk_karma).toBe(47);
    expect(s.counters.apk_discipline).toBe(45);
    expect(s.job!.performance).toBe(55);
    expect(s.log.some((r) => r.text === view.text)).toBe(true);
  });
  it("checks no-degree jobs at 16, source majors and missing native requirements instead of ignoring them", () => {
    const s = newLife({ ...options, contentMode: "apk" });
    s.age = 16;
    expect(jobReason(s, apkJobs[0].id)).toBe(null);
    s.job = {
      id: apkJobs[0].id,
      rank: 0,
      years: 0,
      performance: 60,
      salary: 25000000,
    };
    const initial = s.money;
    economicYear(s);
    expect(s.money).toBeGreaterThan(initial + 240000);
    expect(s.job.years).toBe(1);
    const driver = apkJobs.find((j) => j.apkRequirements!.driving)!;
    s.age = 30;
    s.education.completed.push(driver.degree);
    s.stats = { health: 100, happiness: 100, intelligence: 100, looks: 100 };
    expect(jobReason(s, driver.id)).toMatch(/bằng lái/);
    const accountant = apkJobs.find((j) =>
      j.apkRequirements!.majors.includes("apk_major_accounting"),
    )!;
    s.education.completed.push(accountant.degree);
    s.education.specialty = "congnghe";
    expect(jobReason(s, accountant.id)).toMatch(/chuyên ngành/);
    s.education.specialty = "apk_major_accounting";
    expect(jobReason(s, accountant.id)).toBe(null);
  });
  it("accounts for every core row and resolves every playable template and choice without raw tags", () => {
    expect(
      apkEvents.filter((e) => !e.apkRequirements?.trip).length +
        coverage.deferredCore.length,
    ).toBe(coverage.coreRows);
    expect(new Set(apkEvents.map((e) => e.id)).size).toBe(apkEvents.length);
    let choices = 0;
    for (const event of apkEvents.filter((e) => !e.apkRequirements?.trip)) {
      const r = event.apkRequirements!,
        s = newLife({ ...options, contentMode: "apk" });
      s.age = event.minAge;
      s.gender = r.gender === "any" ? "female" : r.gender;
      if (r.orphan) s.relations.forEach((p) => (p.alive = false));
      if (r.prison) s.prisonYears = 3;
      if (r.student)
        s.education.current = {
          id: "edu_university",
          year: 0,
          score: 60,
          specialty: "",
        };
      if (r.job || r.careerId)
        s.job = {
          id: r.careerId || apkJobs[0].id,
          rank: 0,
          years: 0,
          performance: 50,
          salary: 1000,
        };
      if (r.lover)
        s.relations.push({
          id: "lover_fixture",
          name: "Bảo",
          gender: r.loverGender === "any" ? "male" : r.loverGender,
          role: "lover",
          age: 25,
          closeness: 50,
          alive: true,
          trait: "bình dị",
          resources: 0,
          parents: [],
        });
      if (r.friend)
        s.relations.push({
          id: "friend_fixture",
          name: "Chi",
          gender:
            r.friendGender === "any" || !r.friendGender
              ? "female"
              : r.friendGender,
          role: "friend",
          age: r.friendMinAge ?? s.age,
          closeness: 50,
          alive: true,
          trait: "bình dị",
          resources: 0,
          parents: [],
        });
      expect(eventAllowed(s, event), event.id).toBe(true);
      s.yearQueue = [event.id];
      advanceQueue(s);
      const view = apkPresentation(s);
      expect(JSON.stringify(view), event.id).not.toMatch(/<[^>]+>/);
      expect(apkPresentation(parseSave(serialize(s))), event.id).toEqual(view);
      for (const c of view.choices) {
        const result = reduce(s, {
          type: "choose",
          instanceId: s.pending!.instanceId,
          optionId: c.id,
        });
        expect(
          () => parseSave(serialize(result)),
          event.id + "/" + c.id,
        ).not.toThrow();
        expect(
          result.log.some((row) => row.text.includes(c.outcomes[0].text)),
          event.id,
        ).toBe(true);
        choices++;
      }
    }
    expect(choices).toBeGreaterThan(3000);
  }, 60000);
});
