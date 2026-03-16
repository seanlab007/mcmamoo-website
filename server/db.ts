import { eq, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, conversations, messages, InsertConversation, InsertMessage,
  aiNodes, routingRules, nodeLogs, InsertAiNode, InsertRoutingRule, InsertNodeLog,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Conversations ────────────────────────────────────────────────────────────
export async function getConversations(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

export async function createConversation(data: Omit<InsertConversation, 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(conversations).values(data);
  const id = (result as any).insertId as number;
  const rows = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return rows[0];
}

export async function updateConversation(id: number, userId: number, data: Partial<Pick<InsertConversation, 'title' | 'model' | 'systemPrompt'>>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(conversations).set(data).where(eq(conversations.id, id));
}

export async function deleteConversation(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(messages).where(eq(messages.conversationId, id));
  await db.delete(conversations).where(eq(conversations.id, id));
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export async function getMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));
}

export async function createMessage(data: Omit<InsertMessage, 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(messages).values(data);
  const id = (result as any).insertId as number;
  const rows = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  return rows[0];
}

export async function clearMessages(conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(messages).where(eq(messages.conversationId, conversationId));
}

// ─── AI Nodes ─────────────────────────────────────────────────────────────────
export async function getAiNodes(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(aiNodes).orderBy(asc(aiNodes.priority));
  return activeOnly ? rows.filter(n => n.isActive) : rows;
}

export async function getAiNodeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(aiNodes).where(eq(aiNodes.id, id)).limit(1);
  return rows[0];
}

export async function createAiNode(data: Omit<InsertAiNode, 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(aiNodes).values(data);
  const id = (result as any).insertId as number;
  const rows = await db.select().from(aiNodes).where(eq(aiNodes.id, id)).limit(1);
  return rows[0];
}

export async function updateAiNode(id: number, data: Partial<InsertAiNode>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(aiNodes).set(data).where(eq(aiNodes.id, id));
}

export async function deleteAiNode(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(aiNodes).where(eq(aiNodes.id, id));
}

export async function updateNodePingStatus(id: number, isOnline: boolean, latencyMs?: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(aiNodes).set({
    isOnline,
    lastPingAt: new Date(),
    lastPingMs: latencyMs ?? null,
  }).where(eq(aiNodes.id, id));
}

// ─── Routing Rules ────────────────────────────────────────────────────────────
export async function getRoutingRules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(routingRules).orderBy(asc(routingRules.id));
}

export async function getDefaultRoutingRule() {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(routingRules)
    .where(eq(routingRules.isDefault, true)).limit(1);
  return rows[0];
}

export async function createRoutingRule(data: Omit<InsertRoutingRule, 'id'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(routingRules).values(data);
  const id = (result as any).insertId as number;
  const rows = await db.select().from(routingRules).where(eq(routingRules.id, id)).limit(1);
  return rows[0];
}

export async function updateRoutingRule(id: number, data: Partial<InsertRoutingRule>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(routingRules).set(data).where(eq(routingRules.id, id));
}

export async function deleteRoutingRule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(routingRules).where(eq(routingRules.id, id));
}

// ─── Node Logs ────────────────────────────────────────────────────────────────
export async function createNodeLog(data: Omit<InsertNodeLog, 'id'>) {
  const db = await getDb();
  if (!db) return;
  await db.insert(nodeLogs).values(data);
}

export async function getNodeLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(nodeLogs).orderBy(desc(nodeLogs.createdAt)).limit(limit);
}

export async function getNodeStats(nodeId: number) {
  const db = await getDb();
  if (!db) return null;
  const logs = await db.select().from(nodeLogs)
    .where(eq(nodeLogs.nodeId, nodeId))
    .orderBy(desc(nodeLogs.createdAt))
    .limit(1000);
  const total = logs.length;
  const success = logs.filter(l => l.status === 'success').length;
  const avgLatency = logs.filter(l => l.latencyMs).reduce((s, l) => s + (l.latencyMs || 0), 0) / (logs.filter(l => l.latencyMs).length || 1);
  return {
    total,
    success,
    successRate: total > 0 ? (success / total * 100).toFixed(1) : '0',
    avgLatency: Math.round(avgLatency),
  };
}
