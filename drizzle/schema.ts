import { integer, pgEnum, pgTable, text, timestamp, varchar, boolean, serial, numeric } from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant", "system"]);
export const nodeTypeEnum = pgEnum("node_type", [
  "claude_api",
  "openai_compat",
  "openmanus",
  "openclaw",
  "workbuddy",
  "custom",
]);
export const routingModeEnum = pgEnum("routing_mode", ["paid", "free", "auto", "manual"]);
export const loadBalanceEnum = pgEnum("load_balance", ["priority", "round_robin", "least_latency"]);
export const nodeLogStatusEnum = pgEnum("node_log_status", ["success", "error", "timeout", "failover"]);
export const appStatusEnum = pgEnum("app_status", ["pending", "reviewing", "approved", "rejected"]);
export const copyStatusEnum = pgEnum("copy_status", ["draft", "approved", "published"]);
export const planTierEnum = pgEnum("plan_tier", ["free", "pro", "max"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "expired", "cancelled", "pending"]);
export const paymentProviderEnum = pgEnum("payment_provider", ["alipay", "lianpay", "paypal", "stripe", "wechatpay", "manual"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed", "refunded"]);
export const currencyEnum = pgEnum("currency", ["CNY", "USD"]);

// ─── Subscriptions ───────────────────────────────────────────────────────────
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  tier: planTierEnum("tier").notNull().default("free"),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  currentPeriodStart: timestamp("currentPeriodStart").defaultNow().notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelledAt: timestamp("cancelledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ─── Payment Orders ───────────────────────────────────────────────────────────
export const paymentOrders = pgTable("payment_orders", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  tier: planTierEnum("tier").notNull(),
  provider: paymentProviderEnum("provider").notNull(),
  currency: currencyEnum("currency").notNull().default("CNY"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  externalOrderId: varchar("externalOrderId", { length: 256 }),
  paymentUrl: text("paymentUrl"),
  metadata: text("metadata"),
  paidAt: timestamp("paidAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type PaymentOrder = typeof paymentOrders.$inferSelect;
export type InsertPaymentOrder = typeof paymentOrders.$inferInsert;

// ─── Usage Tracking ───────────────────────────────────────────────────────────
export const usageRecords = pgTable("usage_records", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  chatMessages: integer("chatMessages").default(0).notNull(),
  imageGenerations: integer("imageGenerations").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type UsageRecord = typeof usageRecords.$inferSelect;
export type InsertUsageRecord = typeof usageRecords.$inferInsert;

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Conversations ────────────────────────────────────────────────────────────
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull().default("新对话"),
  model: varchar("model", { length: 64 }).notNull().default("deepseek-chat"),
  systemPrompt: text("systemPrompt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  model: varchar("model", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ─── AI Nodes ─────────────────────────────────────────────────────────────────
export const aiNodes = pgTable("ai_nodes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  type: nodeTypeEnum("type").notNull().default("openai_compat"),
  baseUrl: varchar("baseUrl", { length: 512 }).notNull(),
  apiKey: varchar("apiKey", { length: 512 }).default(""),
  modelId: varchar("modelId", { length: 128 }).default(""),
  isActive: boolean("isActive").default(true).notNull(),
  isPaid: boolean("isPaid").default(false).notNull(),
  isLocal: boolean("isLocal").default(false).notNull(),
  priority: integer("priority").default(100).notNull(),
  lastPingAt: timestamp("lastPingAt"),
  lastPingMs: integer("lastPingMs"),
  isOnline: boolean("isOnline").default(false).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type AiNode = typeof aiNodes.$inferSelect;
export type InsertAiNode = typeof aiNodes.$inferInsert;

// ─── Routing Rules ────────────────────────────────────────────────────────────
export const routingRules = pgTable("routing_rules", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  mode: routingModeEnum("mode").notNull().default("auto"),
  nodeIds: text("nodeIds").notNull(),
  failover: boolean("failover").default(true).notNull(),
  loadBalance: loadBalanceEnum("loadBalance").default("priority").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type RoutingRule = typeof routingRules.$inferSelect;
export type InsertRoutingRule = typeof routingRules.$inferInsert;

// ─── Node Logs ────────────────────────────────────────────────────────────────
export const nodeLogs = pgTable("node_logs", {
  id: serial("id").primaryKey(),
  nodeId: integer("nodeId").notNull(),
  userId: integer("userId"),
  conversationId: integer("conversationId"),
  model: varchar("model", { length: 128 }),
  promptTokens: integer("promptTokens").default(0),
  completionTokens: integer("completionTokens").default(0),
  status: nodeLogStatusEnum("status").notNull().default("success"),
  latencyMs: integer("latencyMs"),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type NodeLog = typeof nodeLogs.$inferSelect;
export type InsertNodeLog = typeof nodeLogs.$inferInsert;

// ===== 猫眼咨询官网表 =====

export const maoApplications = pgTable("mao_applications", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  organization: varchar("organization", { length: 256 }).notNull(),
  consultType: varchar("consult_type", { length: 128 }).notNull(),
  description: text("description"),
  status: appStatusEnum("status").default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type MaoApplication = typeof maoApplications.$inferSelect;
export type InsertMaoApplication = typeof maoApplications.$inferInsert;

export const briefSubscribers = pgTable("brief_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BriefSubscriber = typeof briefSubscribers.$inferSelect;
export type InsertBriefSubscriber = typeof briefSubscribers.$inferInsert;

// ─── Content Copies ───────────────────────────────────────────────────────────
export const contentCopies = pgTable("content_copies", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  brand: varchar("brand", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 100 }).notNull(),
  contentType: varchar("contentType", { length: 100 }).notNull(),
  style: varchar("style", { length: 100 }).notNull(),
  keywords: text("keywords"),
  title: varchar("title", { length: 500 }),
  content: text("content").notNull(),
  tags: text("tags"),
  status: copyStatusEnum("status").default("draft"),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ContentCopy = typeof contentCopies.$inferSelect;
export type InsertContentCopy = typeof contentCopies.$inferInsert;

// ─── 万年钟预约表 ─────────────────────────────────────────────────────────────────────────────────
export const millenniumClockReservations = pgTable("millennium_clock_reservations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  company: varchar("company", { length: 256 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  intent: varchar("intent", { length: 64 }).notNull().default("exhibition"),
  message: text("message"),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MillenniumClockReservation = typeof millenniumClockReservations.$inferSelect;
export type InsertMillenniumClockReservation = typeof millenniumClockReservations.$inferInsert;

// ─── 咨询服务预约表 ──────────────────────────────────────────────────────────────────────────────
export const consultingInquiries = pgTable("consulting_inquiries", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  company: varchar("company", { length: 256 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 64 }),
  service: varchar("service", { length: 128 }),
  budget: varchar("budget", { length: 64 }),
  message: text("message"),
  status: varchar("status", { length: 32 }).notNull().default("new"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ConsultingInquiry = typeof consultingInquiries.$inferSelect;
export type InsertConsultingInquiry = typeof consultingInquiries.$inferInsert;
