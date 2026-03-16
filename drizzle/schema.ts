import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, float } from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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

// ─── Conversations ────────────────────────────────────────────────────────────
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull().default("新对话"),
  model: varchar("model", { length: 64 }).notNull().default("deepseek-chat"),
  systemPrompt: text("systemPrompt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  model: varchar("model", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── AI Nodes ─────────────────────────────────────────────────────────────────
// 注册的 AI 节点：云端 Claude、OpenManus、OpenClaw、WorkBuddy 等
export const aiNodes = mysqlTable("ai_nodes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  // 节点类型
  type: mysqlEnum("type", [
    "claude_api",      // 官方 Claude API（付费）
    "openai_compat",   // OpenAI 兼容接口（DeepSeek/Zhipu/Groq）
    "openmanus",       // OpenManus 自动化框架
    "openclaw",        // OpenClaw 本地网关
    "workbuddy",       // WorkBuddy 本地客户端
    "custom",          // 自定义节点
  ]).notNull().default("openai_compat"),
  // 连接信息
  baseUrl: varchar("baseUrl", { length: 512 }).notNull(),
  apiKey: varchar("apiKey", { length: 512 }).default(""),
  modelId: varchar("modelId", { length: 128 }).default(""),  // 节点内使用的模型 ID
  // 状态
  isActive: boolean("isActive").default(true).notNull(),
  isPaid: boolean("isPaid").default(false).notNull(),  // 是否为付费节点
  isLocal: boolean("isLocal").default(false).notNull(), // 是否为本地节点
  priority: int("priority").default(100).notNull(),     // 优先级（越小越优先）
  // 健康状态（定时更新）
  lastPingAt: timestamp("lastPingAt"),
  lastPingMs: int("lastPingMs"),  // 最近一次 ping 延迟（ms）
  isOnline: boolean("isOnline").default(false).notNull(),
  // 元信息
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AiNode = typeof aiNodes.$inferSelect;
export type InsertAiNode = typeof aiNodes.$inferInsert;

// ─── Routing Rules ────────────────────────────────────────────────────────────
// 路由策略：决定何时使用哪些节点
export const routingRules = mysqlTable("routing_rules", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  // 触发条件
  mode: mysqlEnum("mode", [
    "paid",      // 付费模式（优先 Claude API）
    "free",      // 免费模式（优先本地/免费节点）
    "auto",      // 自动（根据节点可用性）
    "manual",    // 手动指定
  ]).notNull().default("auto"),
  // 节点优先级列表（逗号分隔的节点 ID）
  nodeIds: text("nodeIds").notNull(),
  // 失败策略
  failover: boolean("failover").default(true).notNull(),
  loadBalance: mysqlEnum("loadBalance", ["priority", "round_robin", "least_latency"]).default("priority").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RoutingRule = typeof routingRules.$inferSelect;
export type InsertRoutingRule = typeof routingRules.$inferInsert;

// ─── Node Logs ────────────────────────────────────────────────────────────────
// 每次 AI 调用的日志记录
export const nodeLogs = mysqlTable("node_logs", {
  id: int("id").autoincrement().primaryKey(),
  nodeId: int("nodeId").notNull(),
  userId: int("userId"),
  conversationId: int("conversationId"),
  // 请求信息
  model: varchar("model", { length: 128 }),
  promptTokens: int("promptTokens").default(0),
  completionTokens: int("completionTokens").default(0),
  // 响应信息
  status: mysqlEnum("status", ["success", "error", "timeout", "failover"]).notNull().default("success"),
  latencyMs: int("latencyMs"),
  errorMessage: text("errorMessage"),
  // 时间
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type NodeLog = typeof nodeLogs.$inferSelect;
export type InsertNodeLog = typeof nodeLogs.$inferInsert;

// ===== 猫眼咨询官网表 (merged from mcmamoo-website) =====

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
export type InsertBriefSubscriber = typeof briefSubscribers.$inferInsert;
