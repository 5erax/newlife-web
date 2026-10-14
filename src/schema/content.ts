import { z } from "zod";
import type {
  Condition,
  Effect,
  Choice,
  CaseOutcome,
  EventCase,
} from "../engine/types";
export const statSchema = z.enum([
  "health",
  "happiness",
  "intelligence",
  "looks",
]);
export const roleSchema = z.enum([
  "mother",
  "father",
  "sibling",
  "friend",
  "lover",
  "spouse",
  "child",
  "parent",
  "grandmother",
  "grandfather",
  "grandparent",
  "relative",
]);
export const idSchema = z
  .string()
  .regex(/^[a-z0-9_]+$/)
  .max(100);
const number = z.number().finite();
const money = number.int().min(0).max(1_000_000_000_000_000);
const genderRequirement = z.enum(["any", "male", "female", "other"]);
const interviewAnswerSchema = z.object({
  id: idSchema,
  label: z.string().min(1).max(500),
  score: z.number().int().min(1).max(5),
});
export const apkInterviewSchema = z.object({
  id: idSchema,
  question: z.string().min(1).max(500),
  cta: z.string().min(1).max(500),
  commonness: z.number().int().min(1).max(5),
  answers: z.array(interviewAnswerSchema).min(3).max(20),
  defaultAnswer: interviewAnswerSchema.nullable(),
  source: z.object({
    table: z.literal("a16_interview-questions-enc"),
    record: z.number().int().min(1).max(46),
  }),
});
export const apkEventRequirementsSchema = z.object({
  friendMinCraziness: number.int().min(0).max(100).optional(),
  friendJob: z.boolean().optional(),
  friendStudent: z.boolean().optional(),
  friendChild: z.boolean().optional(),
  friendMarried: z.boolean().optional(),
  friendEnemy: z.boolean().optional(),
  trip: z.enum(["vacation", "cruise", "camp", "hike"]).optional(),
  companions: z
    .array(z.enum(["friend", "family", "lover", "dog", "pet"]))
    .min(1)
    .max(5)
    .optional(),
  gender: genderRequirement,
  student: z.boolean(),
  job: z.boolean(),
  parents: z.boolean(),
  lover: z.boolean(),
  noLover: z.boolean(),
  loverGender: genderRequirement,
  parent: z.boolean(),
  friend: z.boolean(),
  orphan: z.boolean(),
  prison: z.boolean(),
  careerId: z.string().max(100),
  friendMinAge: number.int().min(0).max(200).optional(),
  friendMaxAge: number.int().min(0).max(200).optional(),
  friendGender: genderRequirement.optional(),
});
export const apkJobRequirementsSchema = z.object({
  gender: genderRequirement,
  maxAge: number.int().min(0).max(150),
  workYears: number.int().min(0).max(150),
  majors: z.array(idSchema).max(30),
  karma: number.int().min(0).max(100),
  driving: z.boolean(),
  pilot: z.boolean(),
  vehicle: z.boolean(),
  celibacy: z.boolean(),
  unavailable: z.boolean(),
});
export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ origin: idSchema }),
    z.object({
      field: z.enum([
        "fame",
        "health",
        "happiness",
        "intelligence",
        "looks",
        "age",
        "money",
        "netWorth",
        "schoolScore",
        "jobRank",
        "workYears",
        "children",
        "marriageYears",
        "travel",
        "volunteer",
        "crimes",
        "petYears",
        "gifts",
        "hobbies",
        "stories",
        "jobs",
        "recoveries",
        "donations",
        "saved",
        "activityGroups",
      ]),
      op: z.enum([">=", "<=", ">", "<", "==", "!="]),
      value: number,
    }),
    z.object({ flag: idSchema, is: z.boolean() }),
    z.object({
      has: z.enum(["job", "education", "asset", "illness", "role"]),
      id: z.string().min(1).max(100),
    }),
    z.object({ all: z.array(conditionSchema).max(30) }),
    z.object({ any: z.array(conditionSchema).min(1).max(30) }),
    z.object({ not: conditionSchema }),
  ]),
);
export const effectSchema: z.ZodType<Effect> = z.union([
  z.object({
    apkAttribute: z.enum([
      "karma",
      "discipline",
      "behavior",
      "respect",
      "job",
      "friend",
    ]),
    delta: number.int().min(-100).max(100),
  }),
  z.object({
    modifier: z.object({
      id: idSchema,
      label: z.string().min(1).max(300),
      remaining: number.int().min(1).max(120),
      stats: z.object({
        health: number.int().min(-25).max(25).optional(),
        happiness: number.int().min(-25).max(25).optional(),
        intelligence: number.int().min(-25).max(25).optional(),
        looks: number.int().min(-25).max(25).optional(),
      }),
      happinessBaseline: number.int().min(-50).max(50).optional(),
    }),
  }),
  z.object({ stat: statSchema, delta: number.min(-100).max(100) }),
  z.object({ money: number.int().min(-1e15).max(1e15) }),
  z.object({ counter: idSchema, delta: number.int() }),
  z.object({ flag: idSchema, set: z.boolean() }),
  z.object({
    relation: z.object({
      role: z.union([roleSchema, z.literal("target")]),
      delta: number.min(-100).max(100),
    }),
  }),
  z.object({
    operation: z.enum([
      "loseJob",
      "recoverGambling",
      "recoverIllness",
      "migrate",
      "friend",
      "date",
      "propose",
      "baby",
      "adoptChild",
      "breakup",
      "divorce",
      "talk",
      "gift",
      "argue",
      "apologize",
      "support",
      "treat",
      "illness",
      "petAdopt",
      "petPlay",
      "petVet",
      "petLost",
      "petFind",
      "repair",
      "crime",
      "prison",
      "schoolScore",
      "skill",
      "donate",
      "volunteer",
      "travel",
    ]),
    value: number.optional(),
  }),
  z.object({ death: z.string().min(1).max(300) }),
  z.object({ award: idSchema }),
]);
export const outcomeSchema = z.object({
  chance: number.min(0).max(1),
  text: z.string().min(1).max(2000),
  effects: z.array(effectSchema).max(20),
  nextEvent: idSchema.optional(),
  schedule: z
    .object({ eventId: idSchema, afterYears: number.int().min(1).max(120) })
    .optional(),
});
const outcomes = z
  .array(outcomeSchema)
  .min(1)
  .max(8)
  .refine(
    (list) =>
      Math.abs(list.reduce((sum, item) => sum + item.chance, 0) - 1) < 1e-8,
    "Tổng xác suất phải bằng 1.",
  );
export const caseOutcomeSchema: z.ZodType<CaseOutcome> = z.lazy(() =>
  z.object({
    weight: number.positive().max(1000),
    requires: z.array(conditionSchema).max(30).optional(),
    text: z.string().min(1).max(2000),
    effects: z.array(effectSchema).max(20).default([]),
    variants: z.array(z.string().min(1).max(2000)).min(1).max(10).optional(),
    setFlags: z.array(idSchema).max(20).optional(),
    choices: z.array(choiceSchema).min(2).max(6).optional(),
    nextEvent: idSchema.optional(),
    schedule: z
      .object({ eventId: idSchema, afterYears: number.int().min(1).max(120) })
      .optional(),
  }),
);
export const eventCaseSchema: z.ZodType<EventCase> = z.lazy(() =>
  z.union([
    caseOutcomeSchema,
    z.object({ pool: idSchema, weight: number.positive().max(1000) }),
  ]),
);
export const choiceSchema: z.ZodType<Choice> = z.lazy(() =>
  z
    .object({
      id: idSchema,
      label: z.string().min(1).max(600),
      conditions: z.array(conditionSchema).max(30).optional(),
      outcomes: z
        .array(outcomeSchema)
        .max(8)
        .refine(
          (list) =>
            !list.length ||
            Math.abs(list.reduce((n, o) => n + o.chance, 0) - 1) < 1e-8,
          "Tổng xác suất phải bằng 1.",
        )
        .default([]),
      cases: z.array(eventCaseSchema).min(2).max(8).optional(),
    })
    .refine(
      (c) => !!c.cases?.length || !!c.outcomes.length,
      "Lựa chọn cần ít nhất một đường ra.",
    ),
);
export const eventSchema = z
  .object({
    id: idSchema,
    group: z.string().min(1),
    minAge: number.int().min(0).max(120),
    maxAge: number.int().min(0).max(150),
    weight: number.positive().max(1000),
    once: z.boolean(),
    cooldownYears: number.int().min(0),
    maxOccurrences: number.int().min(1).max(150),
    conditions: z.array(conditionSchema).max(30),
    text: z.string().min(1).max(2000),
    choices: z.array(choiceSchema).min(1).max(6),
    sourceKind: z.enum(["original_web", "apk_translation"]),
    apkRequirements: apkEventRequirementsSchema.optional(),
    rare: z.boolean().optional(),
    chainId: idSchema.optional(),
    stage: number.int().min(1).max(8).optional(),
    chainEnd: z.boolean().optional(),
  })
  .refine((e) => e.minAge <= e.maxAge, "Khoảng tuổi không hợp lệ.")
  .refine(
    (e) => new Set(e.choices.map((c) => c.id)).size === e.choices.length,
    "ID lựa chọn bị trùng.",
  );
export const activitySchema = z.object({
  feature: z
    .discriminatedUnion("type", [
      z.object({
        type: z.literal("fame"),
        action: z.enum([
          "book",
          "commercial",
          "crashout",
          "photoshoot",
          "talkshow",
        ]),
      }),
      z.object({
        type: z.literal("love"),
        mode: z.enum([
          "date",
          "app",
          "lgbtq",
          "celebrity",
          "hookup",
          "threesome",
        ]),
      }),
      z.object({
        type: z.literal("practice"),
        skill: idSchema,
        options: z
          .array(z.object({ id: idSchema, label: z.string().min(1).max(100) }))
          .min(1)
          .max(30)
          .optional(),
      }),
      z.object({
        type: z.literal("style"),
        field: z.enum(["hairColor", "hairStyle", "nails"]),
        options: z
          .array(z.object({ id: idSchema, label: z.string().min(1).max(100) }))
          .min(1)
          .max(30),
      }),
      z.object({ type: z.literal("memory") }),
      z.object({ type: z.literal("tan") }),
      z.object({
        type: z.literal("diet"),
        options: z
          .array(z.object({ id: idSchema, label: z.string().min(1).max(100) }))
          .min(1)
          .max(20),
      }),
    ])
    .optional(),
  id: idSchema,
  group: z.string(),
  name: z.string().min(1),
  description: z.string().min(1),
  minAge: number.int().min(0).max(100),
  cost: money,
  timeCost: number.int().min(1).max(12),
  maxUsesPerYear: number.int().min(1).max(12),
  conditions: z.array(conditionSchema),
  outcomes,
  target: z.enum(["relation", "pet", "asset", "illness"]).optional(),
  targetRoles: z.array(roleSchema).optional(),
  crimeCategory: z.string().optional(),
  sourceKind: z.literal("original_web"),
});
export const jobSchema = z.object({
  apkRequirements: apkJobRequirementsSchema.optional(),
  origins: z.array(idSchema).min(1).optional(),
  id: idSchema,
  name: z.string(),
  industry: z.string(),
  minAge: number.int().min(16),
  degree: z.string(),
  minIntelligence: number.min(0).max(100),
  minHealth: number.min(0).max(100),
  minLooks: number.min(0).max(100),
  noRecord: z.boolean(),
  ranks: z
    .array(
      z.object({
        name: z.string(),
        salary: money,
        minYears: number.int().min(0),
      }),
    )
    .min(1),
  retireAge: number.int().min(40),
  duties: z.array(z.string()).length(3),
  sourceKind: z.enum(["original_web", "apk_translation"]),
});
export const educationSchema = z.object({
  id: idSchema,
  name: z.string(),
  minAge: number.int().min(0),
  years: number.int().min(1).max(10),
  cost: money,
  requires: z.array(idSchema),
  minScore: number.min(0).max(100),
  specialty: z.boolean().optional(),
  sourceKind: z.enum(["original_web", "apk_translation"]),
});
export const assetSchema = z.object({
  id: idSchema,
  name: z.string(),
  category: z.enum([
    "house",
    "vehicle",
    "investment",
    "equipment",
    "luxury",
    "pet",
  ]),
  price: money,
  upkeep: money,
  minAge: number.int().min(0),
  yearlyChange: number.min(-1).max(1),
  bonus: z.object({
    health: number.optional(),
    happiness: number.optional(),
    intelligence: number.optional(),
    looks: number.optional(),
  }),
  lifespan: number.int().min(1).optional(),
  sourceKind: z.literal("original_web"),
});
export const achievementSchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string(),
  group: z.string(),
  conditions: z.array(conditionSchema).min(1),
  sourceKind: z.literal("original_web"),
});
export const storySchema = z.object({
  id: idSchema,
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  start: idSchema,
  sourceKind: z.literal("original_web"),
  nodes: z
    .array(
      z.object({
        id: idSchema,
        text: z.string().min(1),
        choices: z
          .array(
            z.object({
              id: idSchema,
              label: z.string().min(1),
              next: idSchema,
              set: idSchema.optional(),
              requires: idSchema.optional(),
            }),
          )
          .max(6),
        ending: z
          .object({ id: idSchema, name: z.string(), text: z.string() })
          .optional(),
      }),
    )
    .min(10)
    .max(25),
});
