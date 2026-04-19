/**
 * 数据库访问层 — Supabase PostgreSQL
 *
 * 统一使用 Supabase REST API（dbFetch）。
 * 已移除 MySQL / mysql2 / drizzle-orm/mysql2 依赖。
 *
 * 表对应关系：
 *   users              → Supabase public.users（或 auth.users 扩展）
 *   mao_applications   → Supabase public.mao_applications
 *   brief_subscribers  → Supabase public.brief_subscribers
 *   ai_nodes           → Supabase public.ai_nodes
 *   node_skills        → Supabase public.node_skills
 */

import { dbFetch } from "./aiNodes";
import { ENV } from "./_core/env";

// ─── 类型 ──────────────────────────────────────────────────────────────────────

type AnyRecord = Record<string, unknown>;

export interface InsertUser {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  role?: "user" | "admin";
  lastSignedIn?: Date;
}

// ─── 用户管理 ─────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const existing = await getUserByOpenId(user.openId);
  const existingRole = existing?.role === "admin" || existing?.role === "user"
    ? (existing.role as "user" | "admin")
    : undefined;

  // 自动赋予 owner 或特定邮箱管理员权限；已有用户优先保留原角色，避免误降级
  const role: "user" | "admin" =
    user.role ??
    existingRole ??
    (user.openId === ENV.ownerOpenId || user.email === "sean_lab@me.com"
      ? "admin"
      : "user");

  const payload: AnyRecord = {
    openId: user.openId,
    role,
    lastSignedIn: (user.lastSignedIn ?? new Date()).toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (user.name !== undefined) payload.name = user.name ?? null;
  if (user.email !== undefined) payload.email = user.email ?? null;
  if (user.loginMethod !== undefined) payload.loginMethod = user.loginMethod ?? null;

  const r = existing
    ? await dbFetch(
        `/users?openId=eq.${encodeURIComponent(user.openId)}`,
        { method: "PATCH", body: JSON.stringify(payload) }
      )
    : await dbFetch("/users", { method: "POST", body: JSON.stringify(payload) });

  if (!r.ok) {
    console.error("[DB] upsertUser failed:", r.status, r.data);
    throw new Error(`upsertUser failed: ${r.status}`);
  }
}

export async function getUserByOpenId(openId: string): Promise<AnyRecord | undefined> {
  const r = await dbFetch(`/users?openId=eq.${encodeURIComponent(openId)}&limit=1`);
  const rows = r.data as AnyRecord[] | null;
  return rows?.[0];
}

export async function listUsers(): Promise<AnyRecord[]> {
  const r = await dbFetch("/users?order=id.asc&select=id,name,email,role,lastSignedIn,createdAt");
  return (r.data as AnyRecord[]) ?? [];
}

export async function updateUserRole(id: number, role: "user" | "admin"): Promise<void> {
  await dbFetch(
    `/users?id=eq.${id}`,
    { method: "PATCH", body: JSON.stringify({ role, updatedAt: new Date().toISOString() }) }
  );
}

// ─── Mao 咨询申请 ─────────────────────────────────────────────────────────────

export interface InsertMaoApplication {
  name: string;
  organization: string;
  consultType: string;
  description?: string | null;
  status?: "pending" | "reviewing" | "approved" | "rejected";
}

export async function createMaoApplication(data: InsertMaoApplication): Promise<void> {
  const r = await dbFetch(
    "/mao_applications",
    { method: "POST", body: JSON.stringify({ ...data, status: data.status ?? "pending" }) },
    "return=minimal"
  );
  if (!r.ok) throw new Error(`createMaoApplication failed: ${r.status}`);
}

export async function listMaoApplications(): Promise<AnyRecord[]> {
  const r = await dbFetch("/mao_applications?order=createdAt.asc");
  return (r.data as AnyRecord[]) ?? [];
}

export async function updateMaoApplicationStatus(
  id: number,
  status: "pending" | "reviewing" | "approved" | "rejected"
): Promise<void> {
  await dbFetch(
    `/mao_applications?id=eq.${id}`,
    { method: "PATCH", body: JSON.stringify({ status, updatedAt: new Date().toISOString() }) }
  );
}

export async function updateMaoApplicationNotes(id: number, notes: string): Promise<void> {
  await dbFetch(
    `/mao_applications?id=eq.${id}`,
    { method: "PATCH", body: JSON.stringify({ notes, updatedAt: new Date().toISOString() }) }
  );
}

// ─── 战略简报订阅 ─────────────────────────────────────────────────────────────

export async function subscribeBrief(email: string): Promise<void> {
  const r = await dbFetch(
    "/brief_subscribers",
    { method: "POST", body: JSON.stringify({ email }) },
    "resolution=merge-duplicates"
  );
  if (!r.ok && r.status !== 409) throw new Error(`subscribeBrief failed: ${r.status}`);
}

export async function listBriefSubscribers(): Promise<AnyRecord[]> {
  const r = await dbFetch("/brief_subscribers?order=createdAt.asc");
  return (r.data as AnyRecord[]) ?? [];
}

export async function listSubscriberEmails(): Promise<string[]> {
  const rows = await listBriefSubscribers();
  return rows.map((r) => r.email as string).filter(Boolean);
}

// ─── AI Node Management（via Supabase REST）───────────────────────────────────

export async function getAiNodes(onlineOnly?: boolean): Promise<AnyRecord[]> {
  const filter = onlineOnly ? "?isLocal=eq.true&order=priority.asc" : "?order=priority.asc";
  const r = await dbFetch(`/ai_nodes${filter}`);
  return (r.data as AnyRecord[]) ?? [];
}

export async function getAiNodeById(id: number): Promise<AnyRecord | null> {
  const r = await dbFetch(`/ai_nodes?id=eq.${id}&limit=1`);
  const rows = r.data as AnyRecord[] | null;
  return rows?.[0] ?? null;
}

export async function createAiNode(data: AnyRecord): Promise<AnyRecord | null> {
  const r = await dbFetch(
    "/ai_nodes",
    { method: "POST", body: JSON.stringify(data) },
    "return=representation"
  );
  const rows = r.data as AnyRecord[] | null;
  return rows?.[0] ?? null;
}

export async function updateAiNode(id: number, data: AnyRecord): Promise<void> {
  await dbFetch(`/ai_nodes?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function updateNodePingStatus(
  id: number,
  isOnline: boolean,
  lastPingMs?: number
): Promise<void> {
  const body: AnyRecord = {
    isOnline,
    lastPingAt: new Date().toISOString(),
    lastHeartbeatAt: new Date().toISOString(),
  };
  if (lastPingMs !== undefined) body.lastPingMs = lastPingMs;
  await dbFetch(`/ai_nodes?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function getRoutingRules(): Promise<AnyRecord[]> {
  const r = await dbFetch("/routing_rules?order=priority.asc");
  return (r.data as AnyRecord[]) ?? [];
}

export async function createNodeLog(data: AnyRecord): Promise<void> {
  try {
    await dbFetch("/node_logs", { method: "POST", body: JSON.stringify(data) }, "return=minimal");
  } catch {
    // 日志写入失败不影响主流程
  }
}

export async function getNodeSkills(nodeId: number): Promise<AnyRecord[]> {
  const r = await dbFetch(`/node_skills?nodeId=eq.${nodeId}&order=skillId.asc`);
  return (r.data as AnyRecord[]) ?? [];
}

export async function getAllNodeSkills(): Promise<AnyRecord[]> {
  const r = await dbFetch("/node_skills?order=nodeId.asc");
  return (r.data as AnyRecord[]) ?? [];
}

export async function upsertNodeSkill(data: AnyRecord): Promise<void> {
  await dbFetch(
    "/node_skills",
    { method: "POST", body: JSON.stringify(data) },
    "resolution=merge-duplicates"
  );
}

export async function deleteNodeSkill(nodeId: number, skillId: string): Promise<void> {
  await dbFetch(
    `/node_skills?nodeId=eq.${nodeId}&skillId=eq.${encodeURIComponent(skillId)}`,
    { method: "DELETE" }
  );
}

export async function deleteAllNodeSkills(nodeId: number): Promise<void> {
  await dbFetch(`/node_skills?nodeId=eq.${nodeId}`, { method: "DELETE" });
}

export async function setNodeSkillEnabled(
  nodeId: number,
  skillId: string,
  isEnabled: boolean
): Promise<void> {
  await dbFetch(
    `/node_skills?nodeId=eq.${nodeId}&skillId=eq.${encodeURIComponent(skillId)}`,
    { method: "PATCH", body: JSON.stringify({ isActive: isEnabled }) }
  );
}
