/**
 * db.ts - Database access layer using Supabase REST API
 * Replaces Drizzle ORM / PostgreSQL direct connection to avoid pooler issues on Railway
 */

import type {
  InsertUser, InsertConversation, InsertMessage,
  InsertAiNode, InsertRoutingRule, InsertNodeLog, InsertContentCopy,
} from "../drizzle/schema";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY ?? "";

function getHeaders() {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function supabaseGet<T>(table: string, query: string): Promise<T[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(`[DB] Supabase not configured, cannot query ${table}`);
    return [];
  }
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: getHeaders(),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Failed query: ${body}`);
  }
  return resp.json() as Promise<T[]>;
}

async function supabaseInsert<T>(table: string, data: Record<string, unknown>): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Database not available");
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Failed insert: ${body}`);
  }
  const rows = await resp.json() as T[];
  return rows[0];
}

async function supabaseUpsert(table: string, data: Record<string, unknown>, onConflict: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(`[DB] Supabase not configured, cannot upsert ${table}`);
    return;
  }
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      ...getHeaders(),
      Prefer: `resolution=merge-duplicates,return=minimal`,
    },
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Failed upsert: ${body}`);
  }
}

async function supabasePatch(table: string, filter: string, data: Record<string, unknown>): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(`[DB] Supabase not configured, cannot patch ${table}`);
    return;
  }
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: { ...getHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify(data),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Failed patch: ${body}`);
  }
}

async function supabaseDelete(table: string, filter: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(`[DB] Supabase not configured, cannot delete from ${table}`);
    return;
  }
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
    method: "DELETE",
    headers: { ...getHeaders(), Prefer: "return=minimal" },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Failed delete: ${body}`);
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const data: Record<string, unknown> = { openId: user.openId };
  if (user.name !== undefined) data.name = user.name ?? null;
  if (user.email !== undefined) data.email = user.email ?? null;
  if (user.loginMethod !== undefined) data.loginMethod = user.loginMethod ?? null;
  if (user.lastSignedIn !== undefined) data.lastSignedIn = user.lastSignedIn instanceof Date ? user.lastSignedIn.toISOString() : user.lastSignedIn;
  if (user.role !== undefined) data.role = user.role;
  if (!data.lastSignedIn) data.lastSignedIn = new Date().toISOString();
  await supabaseUpsert("users", data, "openId");
}

export async function getUserByOpenId(openId: string) {
  const rows = await supabaseGet<Record<string, unknown>>("users", `openId=eq.${encodeURIComponent(openId)}&limit=1`);
  return rows.length > 0 ? rows[0] : undefined;
}

// ─── Conversations ────────────────────────────────────────────────────────────
export async function getConversations(userId: number) {
  return supabaseGet<Record<string, unknown>>("conversations", `userId=eq.${userId}&order=updatedAt.desc`);
}

export async function createConversation(data: Omit<InsertConversation, 'id'>) {
  return supabaseInsert<Record<string, unknown>>("conversations", data as Record<string, unknown>);
}

export async function updateConversation(id: number, userId: number, data: Partial<Pick<InsertConversation, 'title' | 'model' | 'systemPrompt'>>) {
  await supabasePatch("conversations", `id=eq.${id}`, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteConversation(id: number, userId: number) {
  await supabaseDelete("messages", `conversationId=eq.${id}`);
  await supabaseDelete("conversations", `id=eq.${id}`);
}

// ─── Messages ─────────────────────────────────────────────────────────────────
export async function getMessages(conversationId: number) {
  return supabaseGet<Record<string, unknown>>("messages", `conversationId=eq.${conversationId}&order=createdAt.asc`);
}

export async function createMessage(data: Omit<InsertMessage, 'id'>) {
  return supabaseInsert<Record<string, unknown>>("messages", data as Record<string, unknown>);
}

export async function clearMessages(conversationId: number) {
  await supabaseDelete("messages", `conversationId=eq.${conversationId}`);
}

// ─── AI Nodes ─────────────────────────────────────────────────────────────────
export async function getAiNodes(activeOnly = false) {
  const filter = activeOnly
    ? "isActive=eq.true&order=priority.asc"
    : "order=priority.asc";
  return supabaseGet<Record<string, unknown>>("ai_nodes", filter);
}

export async function getAiNodeById(id: number) {
  const rows = await supabaseGet<Record<string, unknown>>("ai_nodes", `id=eq.${id}&limit=1`);
  return rows[0];
}

export async function createAiNode(data: Omit<InsertAiNode, 'id'>) {
  return supabaseInsert<Record<string, unknown>>("ai_nodes", data as Record<string, unknown>);
}

export async function updateAiNode(id: number, data: Partial<InsertAiNode>) {
  await supabasePatch("ai_nodes", `id=eq.${id}`, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteAiNode(id: number) {
  await supabaseDelete("ai_nodes", `id=eq.${id}`);
}

export async function updateNodePingStatus(id: number, isOnline: boolean, latencyMs?: number) {
  await supabasePatch("ai_nodes", `id=eq.${id}`, {
    isOnline,
    lastPingAt: new Date().toISOString(),
    lastPingMs: latencyMs ?? null,
  });
}

// ─── Routing Rules ────────────────────────────────────────────────────────────
export async function getRoutingRules() {
  return supabaseGet<Record<string, unknown>>("routing_rules", "order=id.asc");
}

export async function getDefaultRoutingRule() {
  const rows = await supabaseGet<Record<string, unknown>>("routing_rules", "isDefault=eq.true&limit=1");
  return rows[0];
}

export async function createRoutingRule(data: Omit<InsertRoutingRule, 'id'>) {
  return supabaseInsert<Record<string, unknown>>("routing_rules", data as Record<string, unknown>);
}

export async function updateRoutingRule(id: number, data: Partial<InsertRoutingRule>) {
  await supabasePatch("routing_rules", `id=eq.${id}`, { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteRoutingRule(id: number) {
  await supabaseDelete("routing_rules", `id=eq.${id}`);
}

// ─── Node Logs ────────────────────────────────────────────────────────────────
export async function createNodeLog(data: Omit<InsertNodeLog, 'id'>) {
  try {
    await supabaseInsert<Record<string, unknown>>("node_logs", data as Record<string, unknown>);
  } catch (err) {
    console.error("[DB] Failed to create node log:", err);
  }
}

export async function getNodeLogs(limit = 100) {
  return supabaseGet<Record<string, unknown>>("node_logs", `order=createdAt.desc&limit=${limit}`);
}

export async function getNodeStats(nodeId: number) {
  const logs = await supabaseGet<Record<string, unknown>>("node_logs", `nodeId=eq.${nodeId}&order=createdAt.desc&limit=1000`);
  const total = logs.length;
  const success = logs.filter(l => l.status === 'success').length;
  const avgLatency = logs.filter(l => l.latencyMs).reduce((s, l) => s + ((l.latencyMs as number) || 0), 0) / (logs.filter(l => l.latencyMs).length || 1);
  return {
    total,
    success,
    successRate: total > 0 ? (success / total * 100).toFixed(1) : '0',
    avgLatency: Math.round(avgLatency),
  };
}

// ─── Content Copies ───────────────────────────────────────────────────────────
export async function getContentCopies(userId?: number, limit = 100) {
  return supabaseGet<Record<string, unknown>>("content_copies", `order=createdAt.desc&limit=${limit}`);
}

export async function createContentCopy(data: Omit<InsertContentCopy, 'id'>) {
  return supabaseInsert<Record<string, unknown>>("content_copies", data as Record<string, unknown>);
}

export async function deleteContentCopy(id: number) {
  await supabaseDelete("content_copies", `id=eq.${id}`);
}

export async function updateContentCopyStatus(id: number, status: "draft" | "approved" | "published") {
  await supabasePatch("content_copies", `id=eq.${id}`, { status });
}
