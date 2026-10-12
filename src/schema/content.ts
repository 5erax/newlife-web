import { z } from "zod";
import type { Condition, Effect } from "../engine/types";
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
export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({
      field: z.enum([
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
export const choiceSchema = z.object({
  id: idSchema,
  label: z.string().min(1).max(200),
  conditions: z.array(conditionSchema).max(30).optional(),
  outcomes,
});
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
    sourceKind: z.literal("original_web"),
    rare: z.boolean().optional(),
  })
  .refine((e) => e.minAge <= e.maxAge, "Khoảng tuổi không hợp lệ.")
  .refine(
    (e) => new Set(e.choices.map((c) => c.id)).size === e.choices.length,
    "ID lựa chọn bị trùng.",
  );
export const activitySchema = z.object({
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
  id: idSchema,
  name: z.string(),
  industry: z.string(),
  minAge: number.int().min(18),
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
  sourceKind: z.literal("original_web"),
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
  sourceKind: z.literal("original_web"),
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
