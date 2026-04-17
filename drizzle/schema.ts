import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Mao Think Tank consultation applications
export const maoApplications = mysqlTable("mao_applications", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  organization: varchar("organization", { length: 256 }).notNull(),
  consultType: varchar("consult_type", { length: 128 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "reviewing", "approved", "rejected"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaoApplication = typeof maoApplications.$inferSelect;
export type InsertMaoApplication = typeof maoApplications.$inferInsert;

// Strategic brief subscribers
export const briefSubscribers = mysqlTable("brief_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BriefSubscriber = typeof briefSubscribers.$inferSelect;

// ── AI Local Nodes (OpenClaw instances) ───────────────────────────────────────
// 注意：ai_nodes / node_skills 实际运行在 Supabase PostgreSQL 上。
// 这里仅作类型参考；写入/读取全部通过 server/aiNodes.ts 的 Supabase REST API 完成，
// 不经过 Drizzle ORM / mysql2。
//
// 对应 Supabase 迁移文件：
//   supabase/migrations/20260325234100_openclaw_node_skills.sql  （PostgreSQL DDL）

export interface AiNode {
  id: number;
  name: string;
  baseUrl: string;
  type: string;
  modelId: string | null;
  /** 节点是否在线（PostgreSQL 列名：isOnline） */
  isOnline: boolean;
  /** 是否本地节点（PostgreSQL 列名：isLocal） */
  isLocal: boolean;
  isActive: boolean;
  /** 所有技能版本号的 SHA256 摘要，用于心跳校验 */
  skillsChecksum: string | null;
  /** 注册鉴权 token */
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
  /** JSONB 数组，如 ["搜索", "查找"] */
  triggers: string[];
  /** 技能分类，如 "search" | "file" | "browser" | "code" | "custom" */
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InsertNodeSkill = Omit<NodeSkill, "id" | "createdAt" | "updatedAt">;

// ── Sales Automation Tables ───────────────────────────────────────────────────

// Sales leads table
export const salesLeads = mysqlTable("sales_leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  company: varchar("company", { length: 256 }).notNull(),
  title: varchar("title", { length: 128 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  linkedin: varchar("linkedin", { length: 256 }),
  website: varchar("website", { length: 256 }),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"]).default("new").notNull(),
  source: mysqlEnum("source", ["website", "linkedin", "referral", "cold_outreach", "event", "other"]).default("other").notNull(),
  score: int("score").default(0),
  notes: text("notes"),
  lastContact: timestamp("lastContact"),
  nextFollowUp: timestamp("nextFollowUp"),
  assignedTo: int("assignedTo").references(() => users.id),
  aiInsights: json("aiInsights").$type<string[]>(),
  suggestedActions: json("suggestedActions").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SalesLead = typeof salesLeads.$inferSelect;
export type InsertSalesLead = typeof salesLeads.$inferInsert;

// Outreach templates
export const outreachTemplates = mysqlTable("outreach_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  subject: varchar("subject", { length: 256 }),
  body: text("body").notNull(),
  type: mysqlEnum("type", ["email", "linkedin"]).default("email").notNull(),
  category: varchar("category", { length: 64 }),
  aiOptimized: boolean("aiOptimized").default(false),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OutreachTemplate = typeof outreachTemplates.$inferSelect;
export type InsertOutreachTemplate = typeof outreachTemplates.$inferInsert;

// Outreach activities
export const outreachActivities = mysqlTable("outreach_activities", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull().references(() => salesLeads.id),
  type: mysqlEnum("type", ["email", "linkedin", "call", "meeting", "note"]).notNull(),
  subject: varchar("subject", { length: 256 }),
  content: text("content"),
  status: mysqlEnum("status", ["draft", "sent", "delivered", "opened", "replied", "bounced"]).default("draft").notNull(),
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  repliedAt: timestamp("repliedAt"),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type OutreachActivity = typeof outreachActivities.$inferSelect;
export type InsertOutreachActivity = typeof outreachActivities.$inferInsert;
