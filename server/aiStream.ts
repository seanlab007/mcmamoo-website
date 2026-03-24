import { Router, Request, Response } from "express";
import { MODEL_CONFIGS } from "./routers";
import { getAiNodes, getAiNodeById, createAiNode, updateAiNode, updateNodePingStatus, getRoutingRules, createNodeLog } from "./db";
import { sdk } from "./_core/sdk";

const aiStreamRouter = Router();

// ─── Admin Auth Helper ────────────────────────────────────────────────────────
// Returns the user if authenticated AND role === "admin", else null
async function getAdminUser(req: Request): Promise<{ id: number; role: string; email: string } | null> {
  try {
    const user = await sdk.authenticateRequest(req) as any;
    if (user && user.role === "admin") return user;
    return null;
  } catch {
    return null;
  }
}

// ─── Smart Router ─────────────────────────────────────────────────────────────
// onlyLocal: true = only local nodes; false = only cloud nodes; undefined = all
async function selectNode(preferPaid?: boolean, onlyLocal?: boolean, onlyCloud?: boolean) {
  try {
    const nodes = await getAiNodes(true);
    if (!nodes || nodes.length === 0) return null;
    const rules = await getRoutingRules();
    const defaultRule = rules.find(r => r.isDefault && r.isActive) || rules.find(r => r.isActive);
    let candidates = nodes.filter(n => n.isOnline !== false && n.isActive !== false);
    if (candidates.length === 0) candidates = nodes;

    // Filter by local/cloud
    if (onlyLocal) candidates = candidates.filter(n => n.isLocal);
    if (onlyCloud) candidates = candidates.filter(n => !n.isLocal);
    if (candidates.length === 0) return null;

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
  node: { id: number; name: unknown; baseUrl: unknown; apiKey: unknown; modelId: unknown; isLocal?: unknown },
  messages: any[],
  res: Response,
  model?: string,
  sendNodeInfo?: boolean
): Promise<{ success: boolean }> {
  const effectiveModel = (node.modelId as string) || model || "gpt-3.5-turbo";
  const start = Date.now();

  // Send node info event so frontend knows which node is being used
  if (sendNodeInfo) {
    res.write(`data: ${JSON.stringify({
      nodeInfo: {
        id: node.id,
        name: node.name,
        model: effectiveModel,
        isLocal: !!node.isLocal,
      }
    })}\n\n`);
  }

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
// model: cloud model ID (e.g. "deepseek-chat") or "local:<nodeId>" for local node
// useLocal: true = admin-only, force local node routing
aiStreamRouter.post("/chat/stream", async (req: Request, res: Response) => {
  let { model = "deepseek-chat", messages, systemPrompt, preferPaid, useLocal, nodeId: requestedNodeId } = req.body;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // ── Vision auto-routing: if any message contains image_url, switch to vision model ──
  const hasImage = Array.isArray(messages) && messages.some((m: any) =>
    Array.isArray(m.content) && m.content.some((c: any) => c.type === "image_url")
  );
  if (hasImage && !useLocal && !String(model).startsWith("local:")) {
    const currentCfg = MODEL_CONFIGS[model];
    if (!currentCfg?.supportsVision) {
      model = "glm-4v-flash"; // auto-switch to vision model
    }
  }

  const allMessages = systemPrompt ? [{ role: "system", content: systemPrompt }, ...messages] : messages;

  // ── Local node routing (admin only) ──────────────────────────────────────
  if (useLocal || (typeof model === "string" && model.startsWith("local:"))) {
    const admin = await getAdminUser(req);
    if (!admin) {
      res.write(`data: ${JSON.stringify({ error: "本地节点仅限管理员使用" })}\n\n`);
      res.end(); return;
    }

    // Specific node requested?
    let targetNode: any = null;
    if (requestedNodeId) {
      targetNode = await getAiNodeById(Number(requestedNodeId));
    } else if (typeof model === "string" && model.startsWith("local:")) {
      const id = parseInt(model.slice(6));
      if (!isNaN(id)) targetNode = await getAiNodeById(id);
    }
    if (!targetNode) {
      targetNode = await selectNode(preferPaid, true, false);
    }

    if (!targetNode) {
      res.write(`data: ${JSON.stringify({ error: "没有可用的本地节点，请先注册本地节点" })}\n\n`);
      res.end(); return;
    }

    const result = await streamFromNode(targetNode, allMessages, res, undefined, true);
    if (!result.success) {
      res.write(`data: ${JSON.stringify({ error: `本地节点 "${targetNode.name}" 调用失败` })}\n\n`);
    }
    res.end(); return;
  }

  // ── Cloud model routing ───────────────────────────────────────────────────
  // Send model info so frontend knows what's being used
  const cfg = MODEL_CONFIGS[model];
  if (cfg) {
    res.write(`data: ${JSON.stringify({
      nodeInfo: { id: null, name: cfg.name, model: cfg.model, isLocal: false, badge: cfg.badge }
    })}\n\n`);
  }

  if (!cfg) { res.write(`data: ${JSON.stringify({ error: `Unknown model: ${model}` })}\n\n`); res.end(); return; }
  if (!cfg.apiKey) { res.write(`data: ${JSON.stringify({ error: `API key not configured for model: ${model}` })}\n\n`); res.end(); return; }

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

// ─── OpenAI Compatible API ────────────────────────────────────────────────────
// POST /api/ai/v1/chat/completions
// WorkBuddy / OpenClaw 可以把 MaoAI 当作 OpenAI 兼容接口使用
// 需要在 Authorization 头中携带 MaoAI session token: "Bearer <maoai_session_token>"
//
// 支持 stream: true 和 stream: false
// 管理员可以通过 model 字段指定本地节点：
//   - 云端模型: "deepseek-chat", "glm-4-flash" 等
//   - 本地节点: "local:<nodeId>" 如 "local:1"
//
aiStreamRouter.post("/v1/chat/completions", async (req: Request, res: Response) => {
  const { model = "deepseek-chat", messages, stream = false, max_tokens = 4096, system } = req.body;

  // Build message list (support system field shortcut)
  const allMessages = system
    ? [{ role: "system", content: system }, ...(messages || [])]
    : (messages || []);

  const isLocal = typeof model === "string" && model.startsWith("local:");
  const isStream = stream === true;

  // Local node requires admin
  if (isLocal) {
    const admin = await getAdminUser(req);
    if (!admin) {
      res.status(403).json({ error: { message: "Local nodes are restricted to admin users", type: "auth_error" } });
      return;
    }
  }

  // Resolve node/model config
  let targetNode: any = null;
  let cloudCfg: typeof MODEL_CONFIGS[string] | null = null;

  if (isLocal) {
    const id = parseInt(model.slice(6));
    if (!isNaN(id)) targetNode = await getAiNodeById(id);
    if (!targetNode) targetNode = await selectNode(undefined, true, false);
    if (!targetNode) {
      res.status(503).json({ error: { message: "No local node available", type: "service_unavailable" } });
      return;
    }
  } else {
    cloudCfg = MODEL_CONFIGS[model] || MODEL_CONFIGS["deepseek-chat"];
    if (!cloudCfg?.apiKey) {
      res.status(503).json({ error: { message: `Model "${model}" not configured`, type: "service_unavailable" } });
      return;
    }
  }

  const backendUrl = targetNode ? `${targetNode.baseUrl}/chat/completions` : `${cloudCfg!.baseUrl}/chat/completions`;
  const backendKey = targetNode ? (targetNode.apiKey || "") : cloudCfg!.apiKey;
  const backendModel = targetNode ? ((targetNode.modelId as string) || "gpt-3.5-turbo") : cloudCfg!.model;

  const start = Date.now();

  try {
    const upstream = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(backendKey ? { Authorization: `Bearer ${backendKey}` } : {}),
      },
      body: JSON.stringify({ model: backendModel, messages: allMessages, stream: isStream, max_tokens }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      res.status(upstream.status).json({ error: { message: errText, type: "upstream_error" } });
      return;
    }

    if (isStream) {
      // Proxy SSE stream directly (standard OpenAI format)
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const reader = upstream.body?.getReader();
      if (!reader) { res.end(); return; }
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
      res.end();
    } else {
      // Non-stream: return JSON directly
      const data = await upstream.json();
      res.json(data);
    }

    if (targetNode) {
      await createNodeLog({ nodeId: targetNode.id, model: backendModel, status: "success", latencyMs: Date.now() - start });
    }
  } catch (err: any) {
    console.error("[OpenAI Compat] Error:", err);
    if (targetNode) {
      await createNodeLog({ nodeId: targetNode.id, model: backendModel, status: "error", latencyMs: Date.now() - start, errorMessage: err.message });
    }
    res.status(500).json({ error: { message: err.message, type: "internal_error" } });
  }
});

// ─── List available models (OpenAI compatible) ────────────────────────────────
// GET /api/ai/v1/models
aiStreamRouter.get("/v1/models", async (req: Request, res: Response) => {
  const admin = await getAdminUser(req);
  const cloudModels = Object.entries(MODEL_CONFIGS).map(([id, cfg]) => ({
    id,
    object: "model",
    created: 1700000000,
    owned_by: "maoai",
    display_name: cfg.name,
    badge: cfg.badge,
    is_local: false,
  }));

  let localModels: any[] = [];
  if (admin) {
    try {
      const nodes = await getAiNodes();
      localModels = nodes
        .filter(n => n.isLocal && n.isOnline)
        .map(n => ({
          id: `local:${n.id}`,
          object: "model",
          created: 1700000000,
          owned_by: "local",
          display_name: n.name,
          badge: "🖥️",
          is_local: true,
          node_id: n.id,
          base_url: n.baseUrl,
          model_id: n.modelId,
          last_ping_at: n.lastPingAt,
        }));
    } catch { /* ignore */ }
  }

  res.json({
    object: "list",
    data: [...cloudModels, ...localModels],
  });
});

// ─── Node Self-Registration ───────────────────────────────────────────────────
aiStreamRouter.post("/node/register", async (req: Request, res: Response) => {
  const { token, name, baseUrl, type, modelId, priority } = req.body;
  const expectedToken = process.env.NODE_REGISTRATION_TOKEN;
  if (!expectedToken) { res.status(503).json({ error: "NODE_REGISTRATION_TOKEN not configured on server" }); return; }
  if (!token || token !== expectedToken) { res.status(401).json({ error: "Invalid registration token" }); return; }
  if (!name || typeof name !== "string" || name.trim().length === 0) { res.status(400).json({ error: "Missing required field: name" }); return; }
  if (!baseUrl || typeof baseUrl !== "string") { res.status(400).json({ error: "Missing required field: baseUrl" }); return; }

  const nodeType = (["workbuddy", "openclaw", "openmanus", "openai_compat", "custom"].includes(type)) ? type : "custom";
  const nodePriority = typeof priority === "number" ? priority : 200;

  try {
    const existing = await getAiNodes();
    const found = existing.find(n => n.name === name.trim());
    if (found) {
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
aiStreamRouter.post("/node/heartbeat", async (req: Request, res: Response) => {
  const { token, nodeId } = req.body;
  const expectedToken = process.env.NODE_REGISTRATION_TOKEN;
  if (!expectedToken || token !== expectedToken) { res.status(401).json({ error: "Invalid token" }); return; }
  if (!nodeId || typeof nodeId !== "number") { res.status(400).json({ error: "Missing required field: nodeId" }); return; }
  try {
    const node = await getAiNodeById(nodeId);
    if (!node) { res.status(404).json({ error: `Node ${nodeId} not found` }); return; }
    await updateNodePingStatus(nodeId, true, undefined);
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Node Deregister ──────────────────────────────────────────────────────────
aiStreamRouter.post("/node/deregister", async (req: Request, res: Response) => {
  const { token, nodeId } = req.body;
  const expectedToken = process.env.NODE_REGISTRATION_TOKEN;
  if (!expectedToken || token !== expectedToken) { res.status(401).json({ error: "Invalid token" }); return; }
  try {
    await updateNodePingStatus(nodeId, false, undefined);
    console.log(`[Node Deregister] Node ${nodeId} marked offline`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Auto-offline: mark nodes offline if no heartbeat for 90s ────────────────
setInterval(async () => {
  try {
    const nodes = await getAiNodes();
    const now = Date.now();
    const OFFLINE_THRESHOLD_MS = 90 * 1000;
    for (const node of nodes) {
      if (!node.isLocal || !node.isOnline) continue;
      if (!node.lastPingAt) continue;
      const lastPing = new Date(node.lastPingAt as string).getTime();
      if (now - lastPing > OFFLINE_THRESHOLD_MS) {
        await updateNodePingStatus(node.id as number, false, undefined);
        console.log(`[Auto-offline] Node "${node.name}" (id=${node.id}) marked offline`);
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
