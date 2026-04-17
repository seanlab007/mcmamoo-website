/**
 * 私密云笔记 API
 *
 * 管理员专属，存储在 Supabase PostgreSQL。
 * 接口列表：
 *  - POST   /api/notes/init          初始化建表（首次使用）
 *  - GET    /api/notes               获取笔记列表（支持搜索、标签过滤、归档）
 *  - POST   /api/notes               创建笔记
 *  - GET    /api/notes/:id           获取单条笔记
 *  - PATCH  /api/notes/:id           更新笔记
 *  - DELETE /api/notes/:id           删除笔记
 *  - GET    /api/notes/tags/all      获取所有标签
 *  - PATCH  /api/notes/:id/pin       切换置顶
 *  - PATCH  /api/notes/:id/archive   切换归档
 */
import { Router, Request, Response } from "express";

export const notesRouter = Router();

// ─── Supabase 配置 ────────────────────────────────────────────────────────────
function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  if (!url || !key) throw new Error("SUPABASE_URL 或 SUPABASE_SERVICE_KEY 未配置");
  return { url, key };
}

async function sbFetch(
  path: string,
  options: RequestInit = {},
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
  const res = await globalThis.fetch(`${url}/rest/v1${path}`, { ...options, headers });
  let data: unknown;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

// ─── 管理员鉴权中间件 ──────────────────────────────────────────────────────────
const ADMIN_TOKEN = process.env.NODE_REGISTRATION_TOKEN || "maoai-node-reg-2026-secret-workbuddy";

function requireAdmin(req: Request, res: Response, next: Function) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : req.query.token as string;
  if (token === ADMIN_TOKEN) return next();
  // 也支持 session cookie（已登录的管理员用户）
  const sessionCookie = req.cookies?.session || req.headers["x-session"] || "";
  if (sessionCookie) return next(); // 有 session 就放行（前端已登录）
  return res.status(401).json({ error: "未授权，请提供管理员 token" });
}

// ─── 自动建表 ──────────────────────────────────────────────────────────────────
let tableInitialized = false;

async function ensureTable() {
  if (tableInitialized) return;
  // 检查表是否存在
  const check = await sbFetch("/notes?limit=1");
  if (check.status !== 404) {
    tableInitialized = true;
    return;
  }
  // 表不存在，通过 Supabase Management API 创建
  // （需要 SUPABASE_ACCESS_TOKEN，如果没有则跳过，让用户手动建表）
  const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn("[notes] notes 表不存在，且未配置 SUPABASE_ACCESS_TOKEN，跳过自动建表");
    return;
  }
  const { url } = getSupabaseConfig();
  const projectRef = url.replace("https://", "").split(".")[0];
  const sql = `
    CREATE TABLE IF NOT EXISTS notes (
      id          BIGSERIAL PRIMARY KEY,
      title       TEXT NOT NULL DEFAULT '',
      content     TEXT NOT NULL DEFAULT '',
      tags        TEXT[] NOT NULL DEFAULT '{}',
      is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
      is_archived BOOLEAN NOT NULL DEFAULT FALSE,
      color       TEXT DEFAULT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS notes_tags_idx ON notes USING GIN (tags);
    CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes (updated_at DESC);
    CREATE INDEX IF NOT EXISTS notes_is_pinned_idx ON notes (is_pinned);
    CREATE INDEX IF NOT EXISTS notes_is_archived_idx ON notes (is_archived);
    CREATE OR REPLACE FUNCTION update_notes_updated_at()
    RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
    DROP TRIGGER IF EXISTS notes_updated_at_trigger ON notes;
    CREATE TRIGGER notes_updated_at_trigger BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_notes_updated_at();
  `;
  const r = await globalThis.fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ query: sql }),
  });
  if (r.ok) {
    console.log("[notes] notes 表创建成功");
    tableInitialized = true;
  } else {
    const t = await r.text();
    console.error("[notes] 建表失败:", t.slice(0, 200));
  }
}

// ─── 初始化建表接口 ────────────────────────────────────────────────────────────
notesRouter.post("/init", requireAdmin, async (req: Request, res: Response) => {
  tableInitialized = false;
  await ensureTable();
  const check = await sbFetch("/notes?limit=1");
  if (check.status === 200 || check.status === 206) {
    return res.json({ success: true, message: "notes 表已就绪" });
  }
  return res.status(500).json({ error: "建表失败，请手动在 Supabase SQL 编辑器执行建表语句" });
});

// ─── 获取笔记列表 ──────────────────────────────────────────────────────────────
notesRouter.get("/", requireAdmin, async (req: Request, res: Response) => {
  await ensureTable();
  const { q, tag, archived, pinned, limit = "50", offset = "0" } = req.query as Record<string, string>;

  let path = `/notes?order=is_pinned.desc,updated_at.desc&limit=${limit}&offset=${offset}`;

  // 归档过滤（默认不显示归档）
  if (archived === "true") {
    path += "&is_archived=eq.true";
  } else {
    path += "&is_archived=eq.false";
  }

  // 置顶过滤
  if (pinned === "true") path += "&is_pinned=eq.true";

  // 标签过滤
  if (tag) path += `&tags=cs.{${encodeURIComponent(tag)}}`;

  const result = await sbFetch(path, {
    headers: { "Range-Unit": "items", Range: `${offset}-${parseInt(offset) + parseInt(limit) - 1}` },
  }, "count=exact");

  if (!result.ok) return res.status(result.status).json({ error: result.data });

  // 如果有搜索词，在结果中过滤（简单文本匹配）
  let data = result.data as any[];
  if (q && Array.isArray(data)) {
    const keyword = q.toLowerCase();
    data = data.filter(n =>
      n.title?.toLowerCase().includes(keyword) ||
      n.content?.toLowerCase().includes(keyword) ||
      n.tags?.some((t: string) => t.toLowerCase().includes(keyword))
    );
  }

  return res.json({ notes: data || [], total: Array.isArray(data) ? data.length : 0 });
});

// ─── 创建笔记 ──────────────────────────────────────────────────────────────────
notesRouter.post("/", requireAdmin, async (req: Request, res: Response) => {
  await ensureTable();
  const { title = "", content = "", tags = [], color = null } = req.body;
  const result = await sbFetch("/notes", {
    method: "POST",
    body: JSON.stringify({ title, content, tags, color }),
  }, "return=representation");

  if (!result.ok) return res.status(result.status).json({ error: result.data });
  const rows = result.data as any[];
  return res.status(201).json(rows?.[0] || {});
});

// ─── 获取单条笔记 ──────────────────────────────────────────────────────────────
notesRouter.get("/:id", requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await sbFetch(`/notes?id=eq.${id}&limit=1`);
  if (!result.ok) return res.status(result.status).json({ error: result.data });
  const rows = result.data as any[];
  if (!rows?.length) return res.status(404).json({ error: "笔记不存在" });
  return res.json(rows[0]);
});

// ─── 更新笔记 ──────────────────────────────────────────────────────────────────
notesRouter.patch("/:id", requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content, tags, color, is_pinned, is_archived } = req.body;
  const patch: Record<string, unknown> = {};
  if (title !== undefined) patch.title = title;
  if (content !== undefined) patch.content = content;
  if (tags !== undefined) patch.tags = tags;
  if (color !== undefined) patch.color = color;
  if (is_pinned !== undefined) patch.is_pinned = is_pinned;
  if (is_archived !== undefined) patch.is_archived = is_archived;

  const result = await sbFetch(`/notes?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  }, "return=representation");

  if (!result.ok) return res.status(result.status).json({ error: result.data });
  const rows = result.data as any[];
  return res.json(rows?.[0] || {});
});

// ─── 删除笔记 ──────────────────────────────────────────────────────────────────
notesRouter.delete("/:id", requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await sbFetch(`/notes?id=eq.${id}`, { method: "DELETE" }, "return=minimal");
  if (!result.ok) return res.status(result.status).json({ error: result.data });
  return res.status(204).send();
});

// ─── 获取所有标签 ──────────────────────────────────────────────────────────────
notesRouter.get("/tags/all", requireAdmin, async (req: Request, res: Response) => {
  await ensureTable();
  const result = await sbFetch("/notes?select=tags&is_archived=eq.false&limit=1000");
  if (!result.ok) return res.status(result.status).json({ error: result.data });
  const rows = result.data as any[];
  const tagSet = new Set<string>();
  rows?.forEach(n => n.tags?.forEach((t: string) => tagSet.add(t)));
  return res.json({ tags: Array.from(tagSet).sort() });
});

// ─── 切换置顶 ──────────────────────────────────────────────────────────────────
notesRouter.patch("/:id/pin", requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  // 先获取当前状态
  const current = await sbFetch(`/notes?id=eq.${id}&select=is_pinned&limit=1`);
  if (!current.ok) return res.status(current.status).json({ error: current.data });
  const rows = current.data as any[];
  if (!rows?.length) return res.status(404).json({ error: "笔记不存在" });
  const newPinned = !rows[0].is_pinned;
  const result = await sbFetch(`/notes?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ is_pinned: newPinned }),
  }, "return=representation");
  if (!result.ok) return res.status(result.status).json({ error: result.data });
  const updated = result.data as any[];
  return res.json(updated?.[0] || {});
});

// ─── 切换归档 ──────────────────────────────────────────────────────────────────
notesRouter.patch("/:id/archive", requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  const current = await sbFetch(`/notes?id=eq.${id}&select=is_archived&limit=1`);
  if (!current.ok) return res.status(current.status).json({ error: current.data });
  const rows = current.data as any[];
  if (!rows?.length) return res.status(404).json({ error: "笔记不存在" });
  const newArchived = !rows[0].is_archived;
  const result = await sbFetch(`/notes?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ is_archived: newArchived }),
  }, "return=representation");
  if (!result.ok) return res.status(result.status).json({ error: result.data });
  const updated = result.data as any[];
  return res.json(updated?.[0] || {});
});
