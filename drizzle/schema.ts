/**
 * Drizzle ORM Schema — PostgreSQL (Supabase)
 *
 * 所有表使用 pgTable（postgres-js 驱动），对应 Supabase PostgreSQL。
 * 已移除 MySQL（mysql2 / drizzle-orm/mysql-core）依赖。
 *
 * AI 节点相关表（ai_nodes / node_skills）由 supabase/migrations/ 管理，
 * 在 server 层通过 aiNodes.ts dbFetch（Supabase REST）访问，不经过 Drizzle ORM。
 */

import {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  json,
  bigint,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const appStatusEnum = pgEnum("app_status", ["pending", "reviewing", "approved", "rejected"]);
export const salesStatusEnum = pgEnum("sales_status", [
  "new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost",
]);
export const salesSourceEnum = pgEnum("sales_source", [
  "website", "linkedin", "referral", "cold_outreach", "event", "other",
]);
export const outreachTypeEnum = pgEnum("outreach_type", ["email", "linkedin"]);
export const activityTypeEnum = pgEnum("activity_type", ["email", "linkedin", "call", "meeting", "note"]);
export const activityStatusEnum = pgEnum("activity_status", [
  "draft", "sent", "delivered", "opened", "replied", "bounced",
]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id:           serial("id").primaryKey(),
  openId:       varchar("openId", { length: 64 }).notNull().unique(),
  name:         text("name"),
  email:        varchar("email", { length: 320 }),
  loginMethod:  varchar("loginMethod", { length: 64 }),
  role:         userRoleEnum("role").default("user").notNull(),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Mao Think Tank consultation applications ─────────────────────────────────

export const maoApplications = pgTable("mao_applications", {
  id:           serial("id").primaryKey(),
  name:         varchar("name", { length: 128 }).notNull(),
  organization: varchar("organization", { length: 256 }).notNull(),
  consultType:  varchar("consult_type", { length: 128 }).notNull(),
  description:  text("description"),
  status:       appStatusEnum("status").default("pending").notNull(),
  notes:        text("notes"),
  createdAt:    timestamp("createdAt").defaultNow().notNull(),
  updatedAt:    timestamp("updatedAt").defaultNow().notNull(),
});

export type MaoApplication = typeof maoApplications.$inferSelect;
export type InsertMaoApplication = typeof maoApplications.$inferInsert;

// ─── Strategic brief subscribers ──────────────────────────────────────────────

export const briefSubscribers = pgTable("brief_subscribers", {
  id:        serial("id").primaryKey(),
  email:     varchar("email", { length: 320 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BriefSubscriber = typeof briefSubscribers.$inferSelect;

// ─── AI Local Nodes (OpenClaw instances) ──────────────────────────────────────
// 注意：ai_nodes / node_skills 实际运行在 Supabase PostgreSQL 上。
// 类型在此定义，写入/读取通过 server/aiNodes.ts Supabase REST API 完成，不经 Drizzle。
// 对应迁移文件：supabase/migrations/20260325234100_openclaw_node_skills.sql

export interface AiNode {
  id: number;
  name: string;
  baseUrl: string;
  type: string;
  modelId: string | null;
  isOnline: boolean;
  isLocal: boolean;
  isActive: boolean;
  skillsChecksum: string | null;
  token: string;
  lastHeartbeatAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type InsertAiNode = Omit<AiNode, "id" | "createdAt" | "updatedAt">;

export interface NodeSkill {
  id: number;
  nodeId: number;
  skillId: string;
  name: string;
  version: string;
  description: string | null;
  triggers: string[];
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InsertNodeSkill = Omit<NodeSkill, "id" | "createdAt" | "updatedAt">;

// ─── Sales Automation Tables ──────────────────────────────────────────────────

export const salesLeads = pgTable("sales_leads", {
  id:               serial("id").primaryKey(),
  name:             varchar("name", { length: 128 }).notNull(),
  company:          varchar("company", { length: 256 }).notNull(),
  title:            varchar("title", { length: 128 }),
  email:            varchar("email", { length: 320 }).notNull(),
  phone:            varchar("phone", { length: 64 }),
  linkedin:         varchar("linkedin", { length: 256 }),
  website:          varchar("website", { length: 256 }),
  status:           salesStatusEnum("status").default("new").notNull(),
  source:           salesSourceEnum("source").default("other").notNull(),
  score:            integer("score").default(0),
  notes:            text("notes"),
  lastContact:      timestamp("lastContact"),
  nextFollowUp:     timestamp("nextFollowUp"),
  assignedTo:       integer("assignedTo").references(() => users.id),
  aiInsights:       json("aiInsights").$type<string[]>(),
  suggestedActions: json("suggestedActions").$type<string[]>(),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().notNull(),
});

export type SalesLead = typeof salesLeads.$inferSelect;
export type InsertSalesLead = typeof salesLeads.$inferInsert;

export const outreachTemplates = pgTable("outreach_templates", {
  id:          serial("id").primaryKey(),
  name:        varchar("name", { length: 128 }).notNull(),
  subject:     varchar("subject", { length: 256 }),
  body:        text("body").notNull(),
  type:        outreachTypeEnum("type").default("email").notNull(),
  category:    varchar("category", { length: 64 }),
  aiOptimized: boolean("aiOptimized").default(false),
  createdBy:   integer("createdBy").references(() => users.id),
  createdAt:   timestamp("createdAt").defaultNow().notNull(),
  updatedAt:   timestamp("updatedAt").defaultNow().notNull(),
});

export type OutreachTemplate = typeof outreachTemplates.$inferSelect;
export type InsertOutreachTemplate = typeof outreachTemplates.$inferInsert;

export const outreachActivities = pgTable("outreach_activities", {
  id:        serial("id").primaryKey(),
  leadId:    integer("leadId").notNull().references(() => salesLeads.id),
  type:      activityTypeEnum("type").notNull(),
  subject:   varchar("subject", { length: 256 }),
  content:   text("content"),
  status:    activityStatusEnum("status").default("draft").notNull(),
  sentAt:    timestamp("sentAt"),
  openedAt:  timestamp("openedAt"),
  repliedAt: timestamp("repliedAt"),
  createdBy: integer("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OutreachActivity = typeof outreachActivities.$inferSelect;
export type InsertOutreachActivity = typeof outreachActivities.$inferInsert;

// ─── MPO (Multi-Party Orchestration) 执行记录 ────────────────────────────────

export const mpoStatusEnum = pgEnum("mpo_status", [
  "running", "completed", "failed", "cancelled",
]);

export const mpoModeEnum = pgEnum("mpo_mode", [
  "auto", "serial", "parallel", "triad",
]);

export const mpoExecutions = pgTable("mpo_executions", {
  id:           serial("id").primaryKey(),
  executionId:  varchar("execution_id", { length: 64 }).notNull().unique(),
  userId:       integer("user_id").notNull().references(() => users.id),
  task:         text("task").notNull(),
  mode:         mpoModeEnum("mode").default("auto").notNull(),
  status:       mpoStatusEnum("status").default("running").notNull(),
  result:       json("result"),
  errorMessage: text("error_message"),
  context:      json("context"),
  durationMs:   bigint("duration_ms", { mode: "number" }),
  startedAt:    timestamp("started_at").defaultNow().notNull(),
  completedAt:  timestamp("completed_at"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

export type MpoExecution = typeof mpoExecutions.$inferSelect;
export type InsertMpoExecution = typeof mpoExecutions.$inferInsert;

// ─── MPO DecisionLedger（博弈过程持久化）────────────────────────────────────

export const mpoDecisionLedger = pgTable("mpo_decision_ledger", {
  id:          serial("id").primaryKey(),
  executionId: varchar("execution_id", { length: 64 }).notNull(),
  userId:      integer("user_id").notNull().references(() => users.id),
  round:       integer("round").default(0).notNull(),
  agentRole:   varchar("agent_role", { length: 64 }).notNull(), // coder|reviewer|validator|reality_check
  action:      varchar("action", { length: 128 }).notNull(),
  decision:    text("decision").notNull(),
  score:       integer("score"),        // 0–100
  approved:    boolean("approved"),
  metadata:    json("metadata"),
  timestamp:   timestamp("timestamp").defaultNow().notNull(),
});

export type MpoDecisionEntry = typeof mpoDecisionLedger.$inferSelect;
export type InsertMpoDecisionEntry = typeof mpoDecisionLedger.$inferInsert;

