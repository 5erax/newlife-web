export type Stat = "health" | "happiness" | "intelligence" | "looks";
export type Stats = Record<Stat, number>;
export interface Delta {
  key: Stat | "money";
  before: number;
  after: number;
  reasons: string[];
}
export type Role =
  | "mother"
  | "father"
  | "sibling"
  | "friend"
  | "lover"
  | "spouse"
  | "child"
  | "parent"
  | "grandmother"
  | "grandfather"
  | "grandparent"
  | "relative";
export type Metric =
  | Stat
  | "age"
  | "money"
  | "netWorth"
  | "schoolScore"
  | "jobRank"
  | "workYears"
  | "children"
  | "marriageYears"
  | "travel"
  | "volunteer"
  | "crimes"
  | "petYears"
  | "gifts"
  | "hobbies"
  | "stories"
  | "jobs"
  | "recoveries"
  | "donations"
  | "saved"
  | "activityGroups";
export type Condition =
  | { field: Metric; op: ">=" | "<=" | ">" | "<" | "==" | "!="; value: number }
  | { flag: string; is: boolean }
  | { has: "job" | "education" | "asset" | "illness" | "role"; id: string }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };
export type Operation =
  | "friend"
  | "date"
  | "propose"
  | "baby"
  | "adoptChild"
  | "breakup"
  | "divorce"
  | "talk"
  | "gift"
  | "argue"
  | "apologize"
  | "support"
  | "treat"
  | "illness"
  | "petAdopt"
  | "petPlay"
  | "petVet"
  | "petLost"
  | "petFind"
  | "repair"
  | "crime"
  | "prison"
  | "schoolScore"
  | "skill"
  | "donate"
  | "volunteer"
  | "travel";
export type Effect =
  | { stat: Stat; delta: number }
  | { money: number }
  | { counter: string; delta: number }
  | { flag: string; set: boolean }
  | { relation: { role: Role | "target"; delta: number } }
  | { operation: Operation; value?: number }
  | { death: string }
  | { award: string };
export interface Outcome {
  chance: number;
  text: string;
  effects: Effect[];
  nextEvent?: string;
  schedule?: { eventId: string; afterYears: number };
}
export interface Choice {
  id: string;
  label: string;
  conditions?: Condition[];
  outcomes: Outcome[];
}
export interface LifeEvent {
  id: string;
  group: string;
  minAge: number;
  maxAge: number;
  weight: number;
  once: boolean;
  cooldownYears: number;
  maxOccurrences: number;
  conditions: Condition[];
  text: string;
  choices: Choice[];
  sourceKind: "original_web";
  rare?: boolean;
}
export interface Activity {
  id: string;
  group: string;
  name: string;
  description: string;
  minAge: number;
  cost: number;
  timeCost: number;
  maxUsesPerYear: number;
  conditions: Condition[];
  outcomes: Outcome[];
  target?: "relation" | "pet" | "asset" | "illness";
  targetRoles?: Role[];
  crimeCategory?: string;
  sourceKind: "original_web";
}
export interface Job {
  id: string;
  name: string;
  industry: string;
  minAge: number;
  degree: string;
  minIntelligence: number;
  minHealth: number;
  minLooks: number;
  noRecord: boolean;
  ranks: { name: string; salary: number; minYears: number }[];
  retireAge: number;
  duties: string[];
  sourceKind: "original_web";
}
export interface Education {
  id: string;
  name: string;
  minAge: number;
  years: number;
  cost: number;
  requires: string[];
  minScore: number;
  specialty?: boolean;
  sourceKind: "original_web";
}
export interface Asset {
  id: string;
  name: string;
  category: "house" | "vehicle" | "investment" | "equipment" | "luxury" | "pet";
  price: number;
  upkeep: number;
  minAge: number;
  yearlyChange: number;
  bonus: Partial<Stats>;
  lifespan?: number;
  sourceKind: "original_web";
}
export interface Achievement {
  id: string;
  name: string;
  description: string;
  group: string;
  conditions: Condition[];
  sourceKind: "original_web";
}
export interface StoryChoice {
  id: string;
  label: string;
  next: string;
  set?: string;
  requires?: string;
}
export interface StoryNode {
  id: string;
  text: string;
  choices: StoryChoice[];
  ending?: { id: string; name: string; text: string };
}
export interface Story {
  id: string;
  name: string;
  description: string;
  icon: string;
  nodes: StoryNode[];
  start: string;
  sourceKind: "original_web";
}
export interface Relation {
  gender?: GameState["gender"];
  id: string;
  name: string;
  role: Role;
  age: number;
  closeness: number;
  alive: boolean;
  trait: string;
  resources: number;
  parents: string[];
}
export interface OwnedAsset {
  instanceId: string;
  catalogId: string;
  age: number;
  condition: number;
  value: number;
  quantity: number;
  primary: boolean;
  alive: boolean;
  lost: boolean;
  bond: number;
}
export interface Illness {
  id: string;
  type: string;
  severity: number;
  discoveredAge: number;
  progress: number;
}
export interface Log {
  id: string;
  age: number;
  kind: "life" | "event" | "money" | "relationship" | "achievement" | "death";
  text: string;
  deltas: Delta[];
  source: string;
}
export interface Summary {
  lifeId: string;
  name: string;
  age: number;
  cause: string;
  title: string;
  netWorth: number;
  children: number;
  job: string;
  medals: string[];
}
export interface Profile {
  unlockLives?: Record<string, string>;
  achievements: string[];
  endings: Record<string, string[]>;
  summaries: Summary[];
  estateReceipts: string[];
}
export interface GameState {
  schemaVersion: 1;
  contentVersion: string;
  id: string;
  revision: number;
  rng: number;
  phase: "ready" | "awaiting_choice" | "dead";
  age: number;
  name: string;
  gender: "male" | "female" | "other";
  hometown: string;
  birthDate: string;
  stats: Stats;
  lastDeltas: Delta[];
  lastYearDeltas: Delta[];
  happinessBaseline: number;
  modifiers: {id:string; label:string; remaining:number; stats:Partial<Stats>; happinessBaseline?:number}[];
  money: number;
  education: {
    completed: string[];
    current: {
      id: string;
      year: number;
      score: number;
      specialty: string;
    } | null;
    score: number;
    specialty: string;
  };
  job: {
    id: string;
    rank: number;
    years: number;
    performance: number;
    salary: number;
  } | null;
  sideJob: string | null;
  pension: number;
  assets: OwnedAsset[];
  market: Record<string, number>;
  housing: "family" | "rent" | "owned";
  relations: Relation[];
  illnesses: Illness[];
  flags: string[];
  counters: Record<string, number>;
  history: Record<string, { count: number; lastAge: number }>;
  pending: { instanceId: string; event: LifeEvent } | null;
  yearQueue: string[];
  scheduled: { eventId: string; age: number }[];
  time: number;
  activityUses: Record<string, number>;
  actionSerial: number;
  ledger: { age: number; id: string; amount: number; label: string }[];
  debts: { id: string; balance: number; rate: number }[];
  prisonYears: number;
  medals: string[];
  log: Log[];
  deathCause: string | null;
  estate: {
    id: string;
    settled: boolean;
    shares: Record<string, number>;
    received: string[];
    distributions: Record<string, number>;
  };
  profile: Profile;
  story: {
    storyId: string;
    nodeId: string;
    flags: string[];
    turns: number;
    rng: number;
  } | null;
}
export type Action =
  | { type: "age" }
  | { type: "choose"; instanceId: string; optionId: string }
  | { type: "activity"; id: string; targetId?: string }
  | { type: "buy"; id: string; quantity?: number }
  | { type: "sell"; instanceId: string }
  | { type: "primary"; instanceId: string }
  | { type: "rent" }
  | { type: "enroll"; id: string; specialty?: string; loan?: boolean }
  | { type: "dropout" }
  | { type: "job"; id: string }
  | { type: "quit" }
  | { type: "retire" }
  | { type: "workHard" }
  | { type: "sideJob"; id: string }
  | {
      type: "relation";
      id: string;
      action:
        | "talk"
        | "gift"
        | "argue"
        | "apologize"
        | "support"
        | "date"
        | "propose"
        | "baby"
        | "adoptChild"
        | "breakup"
        | "divorce";
    }
  | { type: "will"; shares: Record<string, number> }
  | { type: "continueChild"; id: string }
  | { type: "storyStart"; id: string }
  | { type: "storyChoice"; nodeId: string; choiceId: string }
  | { type: "storyClose" };
export interface NewLifeOptions {
  id?: string;
  name: string;
  gender: "male" | "female" | "other";
  hometown: string;
  birthDate: string;
  seed: number;
}
export const CONTENT_VERSION = "1.0.0";
export const STAT_LABELS: Record<Stat, string> = {
  health: "Sức khoẻ",
  happiness: "Hạnh phúc",
  intelligence: "Trí tuệ",
  looks: "Ngoại hình",
};
export const ROLE_LABELS: Record<Role, string> = {
  mother: "Mẹ",
  father: "Cha",
  sibling: "Anh chị em",
  friend: "Bạn",
  lover: "Người yêu",
  spouse: "Bạn đời",
  child: "Con",
  parent: "Cha/mẹ",
  grandmother: "Bà",
  grandfather: "Ông",
  grandparent: "Ông bà",
  relative: "Họ hàng",
};
