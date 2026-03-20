import { Router, Request, Response } from "express";
import { MODEL_CONFIGS } from "./routers";
import { getAiNodes, getAiNodeById, createAiNode, updateAiNode, updateNodePingStatus, getRoutingRules, createNodeLog } from "./db";

const aiStreamRouter = Router();

// ─── Smart Router ─────────────────────────────────────────────────────────────
async function selectNode(preferPaid?: boolean) {
  try {
    const nodes = await getAiNodes(true);
    if (!nodes || nodes.length === 0) return null;
    const rules = await getRoutingRules();
    const defaultRule = rules.find(r => r.isDefault && r.isActive) || rules.find(r => r.isActive);
    let candidates = nodes.filter(n => n.isOnline !== false);
    if (candidates.length === 0) candidates = nodes;
    if (defaultRule) {
      if (defaultRule.mode === "paid" || preferPaid === true) {
        const paid = candidates.filter(n => n.isPaid);
        if (paid.length > 0) candidates = paid;
      } else if (defaultRule.mode === "free" || preferPaid === false) {
        const free = candidates.filter(n => !n.isPaid);
        if (free.length > 0) candidates = free;
      } else if (defaultRule.mode === "manual" && defaultRule.nodeIds) {
        const ids = (defaultRule.nodeIds as string).split(",").map((s: string) => parseInt(s.trim())).filter(Boolean);
        const ordered = ids.map(id => candidates.find(n => n.id === id)).filter(Boolean) as typeof candidates;
        if (ordered.length > 0) candidates = ordered;
      }
      if (defaultRule.loadBalance === "round_robin") {
        return candidates[Math.floor(Math.random() * candidates.length)];
      } else if (defaultRule.loadBalance === "least_latency") {
        const withLatency = candidates.filter(n => n.lastPingMs);
        if (withLatency.length > 0) {
          return withLatency.reduce((a, b) => ((a.lastPingMs as number) || 9999) < ((b.lastPingMs as number) || 9999) ? a : b);
        }
      }
    }
    return candidates.sort((a, b) => (a.priority as number) - (b.priority as number))[0];
  } catch { return null; }
}

async function streamFromNode(
  node: { id: number; baseUrl: unknown; apiKey: unknown; modelId: unknown },
  messages: any[],
  res: Response,
  model?: string
): Promise<{ success: boolean }> {
  const effectiveModel = (node.modelId as string) || model || "gpt-3.5-turbo";
  const start = Date.now();
  try {
    const response = await fetch(`${node.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(node.apiKey ? { Authorization: `Bearer ${node.apiKey}` } : {}),
      },
      body: JSON.stringify({ model: effectiveModel, messages, stream: true, max_tokens: 4096 }),
    });
    if (!response.ok) {
      const errText = await response.text();
      await createNodeLog({ nodeId: node.id, model: effectiveModel, status: "error", latencyMs: Date.now() - start, errorMessage: `HTTP ${response.status}: ${errText.slice(0, 200)}` });
      return { success: false };
    }
    const reader = response.body?.getReader();
    if (!reader) return { success: false };
    const decoder = new TextDecoder();
    let buffer = "";
    let totalTokens = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") { if (trimmed === "data: [DONE]") res.write("data: [DONE]\n\n"); continue; }
        if (trimmed.startsWith("data: ")) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta !== undefined && delta !== null) { res.write(`data: ${JSON.stringify({ content: delta })}\n\n`); totalTokens += delta.length; }
            if (json.usage?.total_tokens) totalTokens = json.usage.total_tokens;
          } catch { /* skip */ }
        }
      }
    }
    await createNodeLog({ nodeId: node.id, model: effectiveModel, status: "success", latencyMs: Date.now() - start, completionTokens: totalTokens });
    return { success: true };
  } catch (err: any) {
    await createNodeLog({ nodeId: node.id, model: effectiveModel, status: "error", latencyMs: Date.now() - start, errorMessage: err.message });
    return { success: false };
  }
}

// ─── Main Chat Stream ─────────────────────────────────────────────────────────
aiStreamRouter.post("/chat/stream", async (req: Request, res: Response) => {
  const { model = "deepseek-chat", messages, systemPrompt, preferPaid } = req.body;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // 1. Smart routing via registered nodes
  try {
    const node = await selectNode(preferPaid);
    if (node) {
      const allMessages = systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages;
      const result = await streamFromNode(node, allMessages, res, model);
      if (result.success) { res.end(); return; }
      res.write(`data: ${JSON.stringify({ info: "节点故障，切换到内置模型..." })}\n\n`);
    }
  } catch { /* fallback */ }

  // 2. Fallback: built-in model configs
  const cfg = MODEL_CONFIGS[model];
  if (!cfg) { res.write(`data: ${JSON.stringify({ error: `Unknown model: ${model}` })}\n\n`); res.end(); return; }
  if (!cfg.apiKey) { res.write(`data: ${JSON.stringify({ error: `API key not configured for model: ${model}` })}\n\n`); res.end(); return; }
  const allMessages = systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages;
  try {
    const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({ model: cfg.model, messages: allMessages, stream: true, max_tokens: 4096 }),
    });
    if (!response.ok) {
      const errText = await response.text();
      res.write(`data: ${JSON.stringify({ error: `API Error ${response.status}: ${errText}` })}\n\n`);
      res.end(); return;
    }
    const reader = response.body?.getReader();
    if (!reader) { res.write(`data: ${JSON.stringify({ error: "No response body" })}\n\n`); res.end(); return; }
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") { if (trimmed === "data: [DONE]") res.write("data: [DONE]\n\n"); continue; }
        if (trimmed.startsWith("data: ")) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = json.choices?.[0]?.delta?.content;
            if (delta !== undefined && delta !== null) res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
          } catch { /* skip */ }
        }
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    console.error("[AI Stream] Error:", err);
    res.write(`data: ${JSON.stringify({ error: err.message || "Stream error" })}\n\n`);
    res.end();
  }
});

// ─── Node Self-Registration ───────────────────────────────────────────────────
// POST /api/ai/node/register
// WorkBuddy / OpenClaw 本地服务启动时调用此接口注册自身
//
// Request body:
//   token    string  必填，与 Railway 环境变量 NODE_REGISTRATION_TOKEN 一致
//   name     string  必填，节点显示名称，如 "WorkBuddy-MacBook"
//   baseUrl  string  必填，本地 OpenAI 兼容接口地址，如 "http://127.0.0.1:11434/v1"
//   type     string  可选，节点类型: workbuddy | openclaw | openmanus | custom（默认 custom）
//   modelId  string  可选，默认使用的模型名，如 "qwen2.5:7b"
//   priority number  可选，路由优先级，数字越小越优先（默认 200）
//
// Response:
//   { success: true, nodeId: number, action: "created" | "updated" }
//
aiStreamRouter.post("/node/register", async (req: Request, res: Response) => {
  const { token, name, baseUrl, type, modelId, priority } = req.body;

  // Token 鉴权
  const expectedToken = process.env.NODE_REGISTRATION_TOKEN;
  if (!expectedToken) {
    res.status(503).json({ error: "NODE_REGISTRATION_TOKEN not configured on server" });
    return;
  }
  if (!token || token !== expectedToken) {
    res.status(401).json({ error: "Invalid registration token" });
    return;
  }

  // 参数校验
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    res.status(400).json({ error: "Missing required field: name" });
    return;
  }
  if (!baseUrl || typeof baseUrl !== "string") {
    res.status(400).json({ error: "Missing required field: baseUrl" });
    return;
  }

  const nodeType = (["workbuddy", "openclaw", "openmanus", "openai_compat", "custom"].includes(type)) ? type : "custom";
  const nodePriority = typeof priority === "number" ? priority : 200;

  try {
    // 检查是否已有同名节点（upsert 逻辑）
    const existing = await getAiNodes();
    const found = existing.find(n => n.name === name.trim());

    if (found) {
      // 更新已有节点：刷新 baseUrl、modelId、isOnline=true、lastPingAt
      await updateAiNode(found.id as number, {
        baseUrl: baseUrl.trim(),
        modelId: modelId || (found.modelId as string) || "",
        isOnline: true,
        isActive: true,
        priority: nodePriority,
        description: `Auto-registered: ${new Date().toISOString()}`,
      });
      console.log(`[Node Register] Updated node "${name}" (id=${found.id})`);
      res.json({ success: true, nodeId: found.id, action: "updated" });
    } else {
      // 创建新节点
      const node = await createAiNode({
        name: name.trim(),
        type: nodeType,
        baseUrl: baseUrl.trim(),
        apiKey: "",
        modelId: modelId || "",
        isPaid: false,
        isLocal: true,
        priority: nodePriority,
        isActive: true,
        isOnline: true,
        description: `Auto-registered: ${new Date().toISOString()}`,
      });
      console.log(`[Node Register] Created node "${name}" (id=${(node as any)?.id})`);
      res.json({ success: true, nodeId: (node as any)?.id, action: "created" });
    }
  } catch (err: any) {
    console.error("[Node Register] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Node Heartbeat ───────────────────────────────────────────────────────────
// POST /api/ai/node/heartbeat
// 本地节点每 30 秒调用一次，保持在线状态
// 若超过 90 秒未收到心跳，节点自动标记为离线
//
// Request body:
//   token   string  必填，与 NODE_REGISTRATION_TOKEN 一致
//   nodeId  number  必填，注册时返回的 nodeId
//
// Response:
//   { success: true, timestamp: string }
//
aiStreamRouter.post("/node/heartbeat", async (req: Request, res: Response) => {
  const { token, nodeId } = req.body;

  // Token 鉴权
  const expectedToken = process.env.NODE_REGISTRATION_TOKEN;
  if (!expectedToken || token !== expectedToken) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  if (!nodeId || typeof nodeId !== "number") {
    res.status(400).json({ error: "Missing required field: nodeId" });
    return;
  }

  try {
    const node = await getAiNodeById(nodeId);
    if (!node) {
      res.status(404).json({ error: `Node ${nodeId} not found` });
      return;
    }

    // 更新心跳时间和在线状态
    await updateNodePingStatus(nodeId, true, undefined);
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error("[Node Heartbeat] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Node Deregister ──────────────────────────────────────────────────────────
// POST /api/ai/node/deregister
// 本地节点正常关闭时调用，主动标记为离线
//
// Request body:
//   token   string  必填
//   nodeId  number  必填
//
aiStreamRouter.post("/node/deregister", async (req: Request, res: Response) => {
  const { token, nodeId } = req.body;

  const expectedToken = process.env.NODE_REGISTRATION_TOKEN;
  if (!expectedToken || token !== expectedToken) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  try {
    await updateNodePingStatus(nodeId, false, undefined);
    console.log(`[Node Deregister] Node ${nodeId} marked offline`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Auto-offline: mark nodes offline if no heartbeat for 90s ────────────────
// 每 60 秒检查一次，将超过 90 秒没有心跳的本地节点标记为离线
setInterval(async () => {
  try {
    const nodes = await getAiNodes();
    const now = Date.now();
    const OFFLINE_THRESHOLD_MS = 90 * 1000; // 90 seconds

    for (const node of nodes) {
      if (!node.isLocal || !node.isOnline) continue;
      if (!node.lastPingAt) continue;

      const lastPing = new Date(node.lastPingAt as string).getTime();
      if (now - lastPing > OFFLINE_THRESHOLD_MS) {
        await updateNodePingStatus(node.id as number, false, undefined);
        console.log(`[Auto-offline] Node "${node.name}" (id=${node.id}) marked offline (no heartbeat for ${Math.round((now - lastPing) / 1000)}s)`);
      }
    }
  } catch { /* ignore */ }
}, 60 * 1000);

// ─── Health check ─────────────────────────────────────────────────────────────
aiStreamRouter.get("/status", async (_req: Request, res: Response) => {
  const status: Record<string, any> = {};
  for (const [id, cfg] of Object.entries(MODEL_CONFIGS)) {
    status[id] = { name: cfg.name, configured: !!cfg.apiKey, badge: cfg.badge };
  }
  let nodeCount = 0, onlineCount = 0;
  try {
    const nodes = await getAiNodes();
    nodeCount = nodes.length;
    onlineCount = nodes.filter(n => n.isOnline).length;
  } catch { /* db not ready */ }
  res.json({ status: "ok", models: status, nodes: { total: nodeCount, online: onlineCount }, timestamp: new Date().toISOString() });
});

export default aiStreamRouter;
