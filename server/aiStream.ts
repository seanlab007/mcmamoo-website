import { Router, Request, Response } from "express";
import { MODEL_CONFIGS } from "./routers";
import { getAiNodes, getRoutingRules, createNodeLog } from "./db";

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
        const ids = defaultRule.nodeIds.split(",").map((s: string) => parseInt(s.trim())).filter(Boolean);
        const ordered = ids.map(id => candidates.find(n => n.id === id)).filter(Boolean) as typeof candidates;
        if (ordered.length > 0) candidates = ordered;
      }
      if (defaultRule.loadBalance === "round_robin") {
        return candidates[Math.floor(Math.random() * candidates.length)];
      } else if (defaultRule.loadBalance === "least_latency") {
        const withLatency = candidates.filter(n => n.lastPingMs);
        if (withLatency.length > 0) {
          return withLatency.reduce((a, b) => (a.lastPingMs || 9999) < (b.lastPingMs || 9999) ? a : b);
        }
      }
    }
    return candidates.sort((a, b) => a.priority - b.priority)[0];
  } catch { return null; }
}

async function streamFromNode(
  node: { id: number; baseUrl: string; apiKey: string | null; modelId: string | null },
  messages: any[],
  res: Response,
  model?: string
): Promise<{ success: boolean }> {
  const effectiveModel = node.modelId || model || "gpt-3.5-turbo";
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

// ─── Node Self-Registration (for OpenManus / OpenClaw / WorkBuddy) ────────────
aiStreamRouter.post("/node/register", async (req: Request, res: Response) => {
  const { token, name, baseUrl, type, modelId } = req.body;
  const expectedToken = process.env.NODE_REGISTRATION_TOKEN;
  if (!expectedToken || token !== expectedToken) {
    res.status(401).json({ error: "Invalid registration token" });
    return;
  }
  try {
    const { createAiNode } = await import("./db");
    const node = await createAiNode({
      name, type: type || "custom", baseUrl, apiKey: "", modelId: modelId || "",
      isPaid: false, isLocal: true, priority: 200, isActive: true, isOnline: true,
      description: `Auto-registered: ${new Date().toISOString()}`,
    });
    res.json({ success: true, nodeId: node?.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

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
