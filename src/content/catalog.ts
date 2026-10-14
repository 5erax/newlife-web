import eventData from "./events.json" with { type: "json" };
import extraEventData from "./extra-events.json" with { type: "json" };
import chainEventData from "./chain-events.json" with { type: "json" };
import careerData from "./career-events.json" with { type: "json" };
import fallbackData from "./fallback-events.json" with { type: "json" };
import activityData from "./activities.json" with { type: "json" };
import lifestyleData from "./lifestyle-activities.json" with { type: "json" };
import jobData from "./jobs.json" with { type: "json" };
import educationData from "./education.json" with { type: "json" };
import assetData from "./assets.json" with { type: "json" };
import achievementData from "./achievements.json" with { type: "json" };
import storyData from "./stories.json" with { type: "json" };
import apkEventData from "./apk/events.vi.json" with { type: "json" };
import apkJobData from "./apk/jobs.vi.json" with { type: "json" };
import apkEducationData from "./apk/education.vi.json" with { type: "json" };
import apkInterviewData from "./apk/interviews.vi.json" with { type: "json" };
import {
  eventSchema,
  activitySchema,
  jobSchema,
  educationSchema,
  assetSchema,
  achievementSchema,
  storySchema,
  apkInterviewSchema,
} from "../schema/content";
import type {
  LifeEvent,
  Activity,
  Job,
  Education,
  Asset,
  Achievement,
  Story,
} from "../engine/types";
export const apkEvents: LifeEvent[] = apkEventData.map((e) =>
  eventSchema.parse(e),
);
export const apkJobs: Job[] = apkJobData.map((e) => jobSchema.parse(e));
export const apkInterviews = apkInterviewData.map((e) =>
  apkInterviewSchema.parse(e),
);
export const apkEducation: Education[] = apkEducationData.map((e) =>
  educationSchema.parse(e),
);
export const events: LifeEvent[] = [
  ...eventData,
  ...careerData,
  ...extraEventData,
  ...chainEventData,
].map((e) => eventSchema.parse(e));
export const fallbacks: LifeEvent[] = fallbackData.map((e) =>
  eventSchema.parse(e),
);
export const activities: Activity[] = [...activityData, ...lifestyleData].map(
  (e) => activitySchema.parse(e),
);
export const jobs: Job[] = jobData.map((e) => jobSchema.parse(e));
export const education: Education[] = educationData.map((e) =>
  educationSchema.parse(e),
);
export const assets: Asset[] = assetData.map((e) => assetSchema.parse(e));
export const achievements: Achievement[] = achievementData.map((e) =>
  achievementSchema.parse(e),
);
export const stories: Story[] = storyData.map((e) => storySchema.parse(e));
export const eventById = new Map(
  [...events, ...fallbacks, ...apkEvents].map((e) => [e.id, e]),
);
export const jobById = new Map([...jobs, ...apkJobs].map((e) => [e.id, e]));
export const assetById = new Map(assets.map((e) => [e.id, e]));
export const educationById = new Map(
  [...education, ...apkEducation].map((e) => [e.id, e]),
);
