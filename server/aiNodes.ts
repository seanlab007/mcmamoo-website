/**
 * Supabase REST / 本地文件 双模式数据访问工具
 *
 * 提供统一的 dbFetch 接口：
 *  - 配置了 SUPABASE_URL + SUPABASE_SERVICE_KEY → 走 Supabase REST API
 *  - 未配置（本地开发）→ 走本地 JSON 文件存储（.openclaw-local-db.json）
 *
 * 注意：原 aiNodesRouter（Express 路由）已迁移到 aiStream.ts，此文件仅保留数据访问层。
 */

import fs from "fs";
import path from "path";

// ─── 本地文件存储（开发模式降级层）────────────────────────────────────────────

const LOCAL_DB_PATH = path.resolve(process.cwd(), ".openclaw-local-db.json");

interface LocalDb {
  nodes: Record<number, Record<string, unknown>>;
  skills: Record<string, Record<string, unknown>>;
  nextNodeId: number;
}

function loadLocalDb(): LocalDb {
  try {
    return JSON.parse(fs.readFileSync(LOCAL_DB_PATH, "utf8"));
  } catch {
    return { nodes: {}, skills: {}, nextNodeId: 1 };
  }
}

function saveLocalDb(db: LocalDb): void {
  fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
}

// ─── Supabase 配置 ───────────────────────────────────────────────────────────

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  if (!url || !key) {
    throw new Error("SUPABASE_URL 或 SUPABASE_SERVICE_KEY 未配置");
  }
  return { url, key };
}

// Extended options: body can be any serializable value (objects will be JSON.stringify'd automatically)
export type DbFetchOptions = Omit<RequestInit, "body"> & { body?: unknown };

/** Normalize body to a BodyInit-compatible string */
function normalizeBody(body: unknown): BodyInit | null | undefined {
  if (body === undefined || body === null) return body as null | undefined;
  if (typeof body === "string") return body;
  return JSON.stringify(body);
}

/** 通用 Supabase REST 请求 */
async function sbFetch(
  path: string,
  options: DbFetchOptions = {},
  prefer?: string
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const { url, key } = getSupabaseConfig();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...(options.headers as Record<string, string>),
  };
  if (prefer) headers["Prefer"] = prefer;

  const res = await globalThis.fetch(`${url}/rest/v1${path}`, {
    ...options,
    body: normalizeBody(options.body),
    headers,
  });

  let data: unknown;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { ok: res.ok, status: res.status, data };
}

// ─── 本地存储适配层（Supabase 未配置时使用）───────────────────────────────────

/** 解析 Supabase 风格 path 并在本地 DB 上执行操作 */
async function localFetch(
  p: string,
  options: DbFetchOptions = {}
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const db = loadLocalDb();
  const method = (options.method ?? "GET").toUpperCase();
  const [tablePart, queryPart] = p.split("?");
  const table = tablePart.replace(/^\//, "");
  const params = new URLSearchParams(queryPart ?? "");

  // Helper: 根据 query params 过滤记录
  function filterRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
    let result = [...rows];
    params.forEach((val, key) => {
      if (key === "select" || key === "order") return;
      const [field, op] = key.split(".");
      if (!op) return;
      if (op === "eq") result = result.filter((r) => String(r[field]) === val);
      if (op === "lt") result = result.filter((r) => new Date(String(r[field])) < new Date(val));
      if (op === "in") {
        const ids = val.replace(/[()]/g, "").split(",").map((v) => v.trim());
        result = result.filter((r) => ids.includes(String(r[field])));
      }
    });
    return result;
  }

  const tableKey = table === "ai_nodes" ? "nodes" : "skills";
  const store = db[tableKey] as Record<number, Record<string, unknown>>;
  const rows = Object.values(store);

  if (method === "GET") {
    const filtered = filterRows(rows);
    return { ok: true, status: 200, data: filtered };
  }

  if (method === "POST") {
    const bodyStr = normalizeBody(options.body) ?? "{}";
    const body = JSON.parse(String(bodyStr));
    if (Array.isArray(body)) {
      for (const item of body) {
        const id = tableKey === "nodes" ? db.nextNodeId++ : `${item.nodeId}:${item.skillId}`;
        const key = typeof id === "number" ? id : (id as string);
        store[key as number] = { id: key, ...item };
      }
    } else {
      const id = tableKey === "nodes" ? db.nextNodeId++ : `${body.nodeId}:${body.skillId}`;
      const key = typeof id === "number" ? id : (id as string);
      store[key as number] = { id: key, ...body };
      saveLocalDb(db);
      return { ok: true, status: 201, data: [{ id: key, ...body }] };
    }
    saveLocalDb(db);
    return { ok: true, status: 201, data: null };
  }

  if (method === "PATCH") {
    const bodyStr = normalizeBody(options.body) ?? "{}";
    const body = JSON.parse(String(bodyStr));
    const toUpdate = filterRows(rows);
    for (const row of toUpdate) {
      const key = row.id as number;
      store[key] = { ...store[key], ...body };
    }
    saveLocalDb(db);
    return { ok: true, status: 200, data: toUpdate.map((r) => ({ ...r, ...body })) };
  }

  if (method === "DELETE") {
    const toDelete = filterRows(rows);
    for (const row of toDelete) {
      delete store[row.id as number];
    }
    saveLocalDb(db);
    return { ok: true, status: 204, data: null };
  }

  return { ok: false, status: 405, data: null };
}

/** 统一入口：有 Supabase 走云端，否则走本地文件 */
export async function dbFetch(
  p: string,
  options: DbFetchOptions = {},
  prefer?: string
): Promise<{ ok: boolean; status: number; data: unknown }> {
  if (isSupabaseConfigured()) {
    return sbFetch(p, options, prefer);
  }
  console.log("[aiNodes] 🗂️ 使用本地文件存储（开发模式）");
  return localFetch(p, options);
}
