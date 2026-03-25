/**
 * MaoAI × OpenClaw 协同架构 - 节点管理 & 技能注册中心
 *
 * 使用 Supabase REST API 直接操作 ai_nodes 和 node_skills 表，
 * 无需依赖 mysql2/DATABASE_URL。
 *
 * 接口列表：
 *  - POST /api/ai/node/register    节点注册（携带技能清单）
 *  - POST /api/ai/node/heartbeat   心跳（携带 skillsChecksum）
 *  - POST /api/ai/node/deregister  节点注销
 *  - POST /api/ai/node/skills/sync 增量技能更新
 *  - GET  /api/ai/node/list        列出在线节点（管理员）
 *  - POST /api/ai/skill/invoke     技能调用转发到本地节点执行
 *  - POST /api/ai/skill/match      关键词匹配技能
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";

export const aiNodesRouter = Router();

// ─── Supabase 配置 ───────────────────────────────────────────────────────────

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  if (!url || !key) {
    throw new Error("SUPABASE_URL 或 SUPABASE_SERVICE_KEY 未配置");
  }
  return { url, key };
}

/** 通用 Supabase REST 请求 */
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

  const res = await globalThis.fetch(`${url}/rest/v1${path}`, {
    ...options,
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

// ─── 类型定义 ───────────────────────────────────────────────────────────────

interface SkillMeta {
  id: string;
  name: string;
  version?: string;
  description?: string;
  triggers?: string[];
  category?: string;
  isActive?: boolean;
}

interface RegisterBody {
  token: string;
  name: string;
  baseUrl: string;
  type?: string;
  modelId?: string;
  skills?: SkillMeta[];
}

interface HeartbeatBody {
  token: string;
  nodeId: number;
  skillsChecksum?: string;
  skillCount?: number;
}

interface SkillsSyncBody {
  token: string;
  nodeId: number;
  action: "upsert" | "delete";
  skills: SkillMeta[];
}

interface DeregisterBody {
  token: string;
  nodeId: number;
}

// ─── 鉴权中间件 ─────────────────────────────────────────────────────────────

function verifyNodeToken(token: string): boolean {
  const expected =
    process.env.NODE_REGISTRATION_TOKEN ||
    process.env.OPENCLAW_GATEWAY_TOKEN ||
    "";
  if (!expected) {
    console.warn("[aiNodes] NODE_REGISTRATION_TOKEN 未配置，跳过 token 验证（仅开发模式）");
    return true;
  }
  return token === expected;
}

// ─── 工具函数 ────────────────────────────────────────────────────────────────

function computeChecksum(skills: { id: string; version?: string }[]): string {
  const sorted = [...skills].sort((a, b) => a.id.localeCompare(b.id));
  const raw = sorted.map((s) => `${s.id}:${s.version ?? "1.0.0"}`).join("|");
  return "sha256:" + crypto.createHash("sha256").update(raw).digest("hex").slice(0, 8);
}

/** 将 SkillMeta 转为 node_skills 行数据 */
function toSkillRow(nodeId: number, s: SkillMeta) {
  return {
    nodeId,
    skillId: s.id,
    name: s.name,
    version: s.version ?? "1.0.0",
    description: s.description ?? null,
    triggers: s.triggers ?? [],
    category: s.category ?? "custom",
    isActive: s.isActive !== false,
  };
}

// ─── 心跳定时任务：90s 无心跳 → isOnline=false ─────────────────────────────

async function markOfflineNodes(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 90_000).toISOString();
    // 更新超时节点为离线
    await sbFetch(
      `/ai_nodes?isOnline=eq.true&lastHeartbeatAt=lt.${encodeURIComponent(cutoff)}`,
      { method: "PATCH", body: JSON.stringify({ isOnline: false }) }
    );
  } catch {
    // 静默忽略
  }
}

setInterval(markOfflineNodes, 30_000);

// ─── POST /api/ai/node/register ─────────────────────────────────────────────

aiNodesRouter.post("/node/register", async (req: Request, res: Response) => {
  const body = req.body as RegisterBody;

  if (!verifyNodeToken(body.token)) {
    res.status(401).json({ success: false, error: "Invalid token" });
    return;
  }

  if (!body.name || !body.baseUrl) {
    res.status(400).json({ success: false, error: "name and baseUrl are required" });
    return;
  }

  try {
    const skillsChecksum = body.skills ? computeChecksum(body.skills) : null;

    // 查找同名节点
    const existing = await sbFetch(`/ai_nodes?name=eq.${encodeURIComponent(body.name)}&select=id`);
    const existingRows = existing.data as { id: number }[] | null;

    let nodeId: number;

    if (existingRows && existingRows.length > 0) {
      nodeId = existingRows[0].id;
      // 更新节点信息
      await sbFetch(
        `/ai_nodes?id=eq.${nodeId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            baseUrl: body.baseUrl,
            type: body.type ?? "openclaw",
            modelId: body.modelId ?? "",
            isOnline: true,
            isLocal: true,
            isActive: true,
            skillsChecksum,
            token: body.token,
            lastHeartbeatAt: new Date().toISOString(),
            lastPingAt: new Date().toISOString(),
          }),
        },
        "return=representation"
      );
    } else {
      // 插入新节点
      const result = await sbFetch(
        `/ai_nodes`,
        {
          method: "POST",
          body: JSON.stringify({
            name: body.name,
            baseUrl: body.baseUrl,
            type: body.type ?? "openclaw",
            modelId: body.modelId ?? "",
            isOnline: true,
            isLocal: true,
            isActive: true,
            skillsChecksum,
            token: body.token,
            lastHeartbeatAt: new Date().toISOString(),
            lastPingAt: new Date().toISOString(),
          }),
        },
        "return=representation"
      );
      const rows = result.data as { id: number }[] | null;
      if (!rows || rows.length === 0) {
        res.status(500).json({ success: false, error: "节点创建失败，未返回 id" });
        return;
      }
      nodeId = rows[0].id;
    }

    // 全量写入技能
    if (body.skills && body.skills.length > 0 && nodeId) {
      // 先删除旧技能
      await sbFetch(`/node_skills?nodeId=eq.${nodeId}`, { method: "DELETE" });
      // 批量插入新技能
      const skillRows = body.skills.map((s) => toSkillRow(nodeId, s));
      await sbFetch(
        `/node_skills`,
        { method: "POST", body: JSON.stringify(skillRows) },
        "return=minimal"
      );
    }

    console.log(`[aiNodes] 节点注册成功: ${body.name} (id=${nodeId}), 技能数: ${body.skills?.length ?? 0}`);

    res.json({
      success: true,
      nodeId,
      message: `节点 ${body.name} 注册成功`,
    });
  } catch (error) {
    console.error("[aiNodes] register error:", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ─── POST /api/ai/node/heartbeat ────────────────────────────────────────────

aiNodesRouter.post("/node/heartbeat", async (req: Request, res: Response) => {
  const body = req.body as HeartbeatBody;

  if (!verifyNodeToken(body.token)) {
    res.status(401).json({ success: false, error: "Invalid token" });
    return;
  }

  try {
    const existing = await sbFetch(
      `/ai_nodes?id=eq.${body.nodeId}&select=id,skillsChecksum`
    );
    const rows = existing.data as { id: number; skillsChecksum: string | null }[] | null;

    if (!rows || rows.length === 0) {
      res.json({ success: true, needsReregister: true });
      return;
    }

    await sbFetch(
      `/ai_nodes?id=eq.${body.nodeId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          isOnline: true,
          lastHeartbeatAt: new Date().toISOString(),
          lastPingAt: new Date().toISOString(),
        }),
      }
    );

    const needsSkillSync =
      body.skillsChecksum !== undefined &&
      rows[0].skillsChecksum !== body.skillsChecksum;

    res.json({ success: true, needsSkillSync });
  } catch (error) {
    console.error("[aiNodes] heartbeat error:", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ─── POST /api/ai/node/deregister ───────────────────────────────────────────

aiNodesRouter.post("/node/deregister", async (req: Request, res: Response) => {
  const body = req.body as DeregisterBody;

  if (!verifyNodeToken(body.token)) {
    res.status(401).json({ success: false, error: "Invalid token" });
    return;
  }

  try {
    await sbFetch(
      `/ai_nodes?id=eq.${body.nodeId}`,
      { method: "PATCH", body: JSON.stringify({ isOnline: false }) }
    );
    console.log(`[aiNodes] 节点已注销: id=${body.nodeId}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ─── POST /api/ai/node/skills/sync ──────────────────────────────────────────

aiNodesRouter.post("/node/skills/sync", async (req: Request, res: Response) => {
  const body = req.body as SkillsSyncBody;

  if (!verifyNodeToken(body.token)) {
    res.status(401).json({ success: false, error: "Invalid token" });
    return;
  }

  if (!body.skills || body.skills.length === 0) {
    res.status(400).json({ success: false, error: "skills array is required" });
    return;
  }

  try {
    if (body.action === "delete") {
      // 逐个删除指定技能
      for (const s of body.skills) {
        await sbFetch(
          `/node_skills?nodeId=eq.${body.nodeId}&skillId=eq.${encodeURIComponent(s.id)}`,
          { method: "DELETE" }
        );
      }
    } else {
      // Upsert（逐个 POST with onConflict）
      for (const s of body.skills) {
        const row = toSkillRow(body.nodeId, s);
        await sbFetch(
          `/node_skills`,
          { method: "POST", body: JSON.stringify(row) },
          "resolution=merge-duplicates"
        );
      }
    }

    // 重算 checksum
    const allSkillsRes = await sbFetch(
      `/node_skills?nodeId=eq.${body.nodeId}&select=skillId,version`
    );
    const allSkills = allSkillsRes.data as { skillId: string; version: string }[] | [];
    const newChecksum = computeChecksum(
      allSkills.map((s) => ({ id: s.skillId, version: s.version }))
    );

    await sbFetch(
      `/ai_nodes?id=eq.${body.nodeId}`,
      { method: "PATCH", body: JSON.stringify({ skillsChecksum: newChecksum }) }
    );

    res.json({ success: true, checksum: newChecksum, count: allSkills.length });
  } catch (error) {
    console.error("[aiNodes] skills/sync error:", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ─── GET /api/ai/node/list ───────────────────────────────────────────────────

aiNodesRouter.get("/node/list", async (_req: Request, res: Response) => {
  try {
    const nodesRes = await sbFetch("/ai_nodes?isLocal=eq.true&select=*&order=createdAt.asc");
    const nodes = nodesRes.data as Record<string, unknown>[] | null ?? [];

    const skillsRes = await sbFetch(
      `/node_skills?nodeId=in.(${nodes.map((n) => n.id).join(",") || "0"})`
    );
    const allSkills = skillsRes.data as { nodeId: number }[] | [];

    const result = nodes.map((node) => ({
      ...node,
      token: undefined, // 不暴露 token
      skills: allSkills.filter((s) => s.nodeId === node.id),
    }));

    res.json({ nodes: result });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ─── POST /api/ai/skill/invoke ───────────────────────────────────────────────

aiNodesRouter.post("/skill/invoke", async (req: Request, res: Response) => {
  const { nodeId, skillId, params, requestId, timeout: timeoutMs = 30000 } = req.body;

  try {
    // 查找在线节点
    const nodeRes = await sbFetch(
      `/ai_nodes?id=eq.${nodeId}&isOnline=eq.true&select=*`
    );
    const nodes = nodeRes.data as Record<string, unknown>[] | null;

    if (!nodes || nodes.length === 0) {
      res.status(404).json({ success: false, error: "节点不在线或不存在" });
      return;
    }

    const node = nodes[0];
    const invokeUrl = `${node.baseUrl}/skill/invoke`;

    const fetchPromise: Promise<globalThis.Response> = globalThis.fetch(invokeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${node.token}`,
      },
      body: JSON.stringify({ skillId, params, requestId, timeout: timeoutMs }),
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("技能调用超时")), timeoutMs)
    );

    const fetchResponse = await Promise.race([fetchPromise, timeoutPromise]);
    const data = await fetchResponse.json();

    res.status(fetchResponse.status).json(data);
  } catch (error) {
    console.error("[aiNodes] skill/invoke error:", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// ─── POST /api/ai/skill/match ────────────────────────────────────────────────

aiNodesRouter.post("/skill/match", async (req: Request, res: Response) => {
  const { message } = req.body as { message: string };

  if (!message) {
    res.status(400).json({ success: false, error: "message is required" });
    return;
  }

  try {
    // 获取所有在线本地节点的 id
    const nodesRes = await sbFetch(
      "/ai_nodes?isOnline=eq.true&isLocal=eq.true&select=id"
    );
    const onlineNodes = nodesRes.data as { id: number }[] | [];

    if (onlineNodes.length === 0) {
      res.json({ matched: [] });
      return;
    }

    const nodeIds = onlineNodes.map((n) => n.id);
    const skillsRes = await sbFetch(
      `/node_skills?nodeId=in.(${nodeIds.join(",")})&isActive=eq.true&select=*`
    );
    const skills = skillsRes.data as Array<{
      nodeId: number;
      skillId: string;
      name: string;
      triggers: string[] | null;
      category: string;
      description: string | null;
    }> | [];

    // 关键词匹配
    const msgLower = message.toLowerCase();
    const matched = skills.filter((skill) => {
      const triggers = skill.triggers ?? [];
      return triggers.some((t: string) => msgLower.includes(t.toLowerCase()));
    });

    res.json({ matched });
  } catch (error) {
    console.error("[aiNodes] skill/match error:", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});
