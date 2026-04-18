import { Router, Request, Response } from "express";
import { MODEL_CONFIGS } from "./models";
import { dbFetch } from "./aiNodes";
import { refreshSkillCache, getSkillCacheSnapshot, matchSkillForMessage } from "./skillMatcher";
import { sdk } from "./_core/sdk";
import mammoth from "mammoth";
// pdf-parse is loaded dynamically to avoid DOMMatrix crash at startup
import { TOOL_DEFINITIONS, ADMIN_TOOL_DEFINITIONS, executeTool } from "./tools";
import { checkSkillPermission } from "./contentPlatform";
import { getAgentSystemPrompt } from "./agents";

const aiStreamRouter = Router();

// ─── DB Helpers (Supabase REST via dbFetch) ──────────────────────────────────
// These replace the non-existent functions that were previously imported from db.ts.

async function getAiNodes(onlineOnly?: boolean): Promise<any[]> {
  const query = onlineOnly ? "?isOnline=eq.true" : "";
  const select = "id,name,baseUrl,type,modelId,isLocal,isPaid,isOnline,isActive,priority,apiKey,lastPingAt,token,skillsChecksum,lastHeartbeatAt";
  const res = await dbFetch(`/ai_nodes?select=${select}${onlineOnly ? "&isOnline=eq.true" : ""}`);
  return (res.data as any[]) ?? [];
}

async function getAiNodeById(id: number): Promise<any> {
  const res = await dbFetch(`/ai_nodes?id=eq.${id}&select=*`);
  const rows = (res.data as any[]) ?? [];
  return rows[0] ?? null;
}

async function createAiNode(data: Record<string, unknown>): Promise<any> {
  const res = await dbFetch("/ai_nodes", { method: "POST", body: JSON.stringify(data) }, "return=representation");
  const rows = (res.data as any[]) ?? [];
  return rows[0] ?? null;
}

async function updateAiNode(id: number, data: Record<string, unknown>): Promise<void> {
  await dbFetch(`/ai_nodes?id=eq.${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

async function updateNodePingStatus(id: number, isOnline: boolean, _pingMs?: number): Promise<void> {
  await dbFetch(`/ai_nodes?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({ isOnline, lastPingAt: new Date().toISOString() }),
  });
}

async function getRoutingRules(): Promise<any[]> {
  try {
    const res = await dbFetch("/routing_rules?isActive=eq.true&select=*");
    return (res.data as any[]) ?? [];
  } catch {
    return [];
  }
}

async function createNodeLog(data: { nodeId: number; model: string; status: string; latencyMs: number; errorMessage?: string }): Promise<void> {
  try {
    await dbFetch("/node_logs", {
      method: "POST",
      body: JSON.stringify({ ...data, createdAt: new Date().toISOString() }),
    });
  } catch {
    // non-critical, ignore
  }
}

async function getNodeSkills(nodeId: number): Promise<any[]> {
  const res = await dbFetch(`/node_skills?nodeId=eq.${nodeId}&select=*`);
  return (res.data as any[]) ?? [];
}

async function getAllNodeSkills(): Promise<any[]> {
  const res = await dbFetch("/node_skills?select=*");
  return (res.data as any[]) ?? [];
}

async function upsertNodeSkill(data: Record<string, unknown>): Promise<void> {
  const { nodeId, skillId } = data;
  const existing = await dbFetch(`/node_skills?nodeId=eq.${nodeId}&skillId=eq.${encodeURIComponent(skillId as string)}&select=id`);
  const rows = (existing.data as any[]) ?? [];
  if (rows.length > 0) {
    await dbFetch(`/node_skills?id=eq.${rows[0].id}`, { method: "PATCH", body: JSON.stringify(data) });
  } else {
    await dbFetch("/node_skills", { method: "POST", body: JSON.stringify(data) });
  }
}

async function deleteNodeSkill(nodeId: number, skillId: string): Promise<void> {
  await dbFetch(`/node_skills?nodeId=eq.${nodeId}&skillId=eq.${encodeURIComponent(skillId)}`, { method: "DELETE" });
}

async function deleteAllNodeSkills(nodeId: number): Promise<void> {
  await dbFetch(`/node_skills?nodeId=eq.${nodeId}`, { method: "DELETE" });
}

async function setNodeSkillEnabled(nodeId: number, skillId: string, isEnabled: boolean): Promise<void> {
  await dbFetch(
    `/node_skills?nodeId=eq.${nodeId}&skillId=eq.${encodeURIComponent(skillId)}`,
    { method: "PATCH", body: JSON.stringify({ isActive: isEnabled, updatedAt: new Date().toISOString() }) }
  );
}

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

// ─── GET /api/ai/skill/status — Skill Proxy health check ────────────────────
aiStreamRouter.get("/skill/status", async (_req: Request, res: Response) => {
  try {
    await refreshSkillCache(true);
    const { skills, nodes, loadedAt } = getSkillCacheSnapshot();
    res.json({
      success: true,
      cachedSkills: skills.length,
      onlineNodes: nodes.length,
      topModes: Object.entries(
        skills.reduce((acc, s) => {
          const mode = s.invokeMode || "unknown";
          acc[mode] = (acc[mode] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort(([, a], [, b]) => b - a).slice(0, 10),
      loadedAt: new Date(loadedAt).toISOString(),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: String(err) });
  }
});

// ─── Main Chat Stream ─────────────────────────────────────────────────────────
// model: cloud model ID (e.g. "deepseek-chat") or "local:<nodeId>" for local node
// useLocal: true = admin-only, force local node routing
// agent: Agent ID to load specialized system prompt
aiStreamRouter.post("/chat/stream", async (req: Request, res: Response) => {
  let { model = "deepseek-chat", messages, systemPrompt, preferPaid, useLocal, nodeId: requestedNodeId, agent: agentId } = req.body;

  // 如果指定了 agent，加载对应的系统提示词
  if (agentId && !systemPrompt) {
    const agentPrompt = getAgentSystemPrompt(agentId);
    if (agentPrompt) {
      systemPrompt = agentPrompt;
    }
  }

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

  // ── Skill Match Pre-processing ─────────────────────────────────────────────
  // Only run for cloud chat (not local node mode), and only on non-image messages.
  // Extract the last user message to match against skill triggers.
  let matchedSkill: Awaited<ReturnType<typeof matchSkillForMessage>> = null;

  // Identify calling user for permission checks (best-effort, non-blocking)
  let callerOpenId = "";
  let callerRole = "user";
  try {
    const callerUser = await sdk.authenticateRequest(req) as any;
    callerOpenId = callerUser?.openId ?? "";
    callerRole = callerUser?.role ?? "user";
  } catch { /* 未登录用户跳过，权限校验时视为 free */ }

  if (!useLocal && !String(model).startsWith("local:") && !hasImage) {
    const lastUserMsg = [...(messages ?? [])].reverse().find((m: any) => m.role === "user");
    const userText = typeof lastUserMsg?.content === "string"
      ? lastUserMsg.content
      : Array.isArray(lastUserMsg?.content)
        ? lastUserMsg.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join(" ")
        : "";

    if (userText.trim()) {
      matchedSkill = await matchSkillForMessage(userText);
      if (matchedSkill) {
        // ── 权限校验 ────────────────────────────────────────────────────────
        if (matchedSkill.requiredPlan && matchedSkill.requiredPlan !== "free") {
          const perm = await checkSkillPermission(callerOpenId, callerRole, matchedSkill.requiredPlan);
          if (!perm.allowed) {
            // 以 SSE 格式返回权限不足的友好提示，然后结束流
            res.write(`data: ${JSON.stringify({
              skillMatch: { skillId: matchedSkill.skillId, name: matchedSkill.name, mode: "blocked" }
            })}\n\n`);
            res.write(`data: ${JSON.stringify({ content: `🔒 **权限不足**\n\n${perm.reason}\n\n如需升级套餐，请联系管理员或访问订阅页面。` })}\n\n`);
            res.write("data: [DONE]\n\n");
            res.end();
            return;
          }
        }
      }
    }
  }

  // ── Skill Invoke Mode: forward to local node and stream result ───────────────
  if (matchedSkill?.invokeMode === "invoke" && matchedSkill.node) {
    const { skillId, nodeId, name: skillName, node, inputSchema } = matchedSkill;

    // Notify frontend: skill is being invoked
    res.write(`data: ${JSON.stringify({
      skillMatch: { skillId, nodeId, name: skillName, mode: "invoke" }
    })}\n\n`);

    try {
      // Use LLM to extract structured params from user message if inputSchema provided
      let params: Record<string, unknown> = {};
      if (inputSchema) {
        const lastUserMsg = [...(messages ?? [])].reverse().find((m: any) => m.role === "user");
        const userText = typeof lastUserMsg?.content === "string" ? lastUserMsg.content : "";
        try {
          const cfg = MODEL_CONFIGS["deepseek-chat"];
          if (cfg?.apiKey) {
            const extractRes = await fetch(`${cfg.baseUrl}/chat/completions`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
              body: JSON.stringify({
                model: cfg.model,
                messages: [
                  { role: "system", content: `你是参数提取助手。从用户输入中提取符合以下 JSON Schema 的参数，只返回 JSON 对象，不要其他内容。\n\nSchema:\n${JSON.stringify(inputSchema)}` },
                  { role: "user", content: userText },
                ],
                stream: false,
                max_tokens: 512,
              }),
            });
            if (extractRes.ok) {
              const extractData = await extractRes.json();
              const raw = extractData.choices?.[0]?.message?.content || "{}";
              params = JSON.parse(raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, ""));
            }
          }
        } catch (e) {
          console.warn("[SkillMatch] Param extraction failed:", e);
        }
      }

      // Call /skill/invoke on the local node
      const invokeRes = await fetch(`${node.baseUrl}/skill/invoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${node.token}`,
        },
        body: JSON.stringify({ skillId, params, requestId: `chat-${Date.now()}` }),
      });

      if (!invokeRes.ok) {
        const errText = await invokeRes.text();
        res.write(`data: ${JSON.stringify({ error: `Skill invoke failed (${invokeRes.status}): ${errText.slice(0, 200)}` })}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      const invokeData = await invokeRes.json();
      const output = invokeData.output ?? invokeData.result ?? JSON.stringify(invokeData);

      // Stream the output as content chunks
      const chunkSize = 100;
      for (let i = 0; i < output.length; i += chunkSize) {
        res.write(`data: ${JSON.stringify({ content: output.slice(i, i + chunkSize) })}\n\n`);
      }
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    } catch (err: any) {
      console.error("[SkillMatch] Invoke error:", err);
      res.write(`data: ${JSON.stringify({ error: `Skill "${skillId}" invoke error: ${err.message}` })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }
  }

  // ── Normalize image_url for GLM-4V: strip data: prefix, keep only base64 string ──
  const normalizeMessagesForVision = (msgs: any[]) => msgs.map((m: any) => {
    if (!Array.isArray(m.content)) return m;
    return {
      ...m,
      content: m.content.map((c: any) => {
        if (c.type === "image_url" && c.image_url?.url?.startsWith("data:")) {
          // GLM-4V expects pure base64 without the data:image/xxx;base64, prefix
          const base64 = c.image_url.url.split(",")[1] || c.image_url.url;
          return { type: "image_url", image_url: { url: base64 } };
        }
        return c;
      }),
    };
  });

  // ── Skill Prompt Mode: inject skill systemPrompt into conversation ─────────
  // If a skill matched with invokeMode='prompt', prepend its systemPrompt as a
  // system message (after any user-provided systemPrompt).
  let effectiveSystemPrompt = systemPrompt;
  if (matchedSkill?.invokeMode !== "invoke" && matchedSkill?.systemPrompt) {
    // Merge: user systemPrompt (if any) + skill systemPrompt
    effectiveSystemPrompt = [systemPrompt, matchedSkill.systemPrompt].filter(Boolean).join("\n\n---\n\n");
    // Notify frontend about the matched skill
    res.write(`data: ${JSON.stringify({
      skillMatch: {
        skillId: matchedSkill.skillId,
        nodeId: matchedSkill.nodeId,
        name: matchedSkill.name,
        mode: "prompt",
      }
    })}\n\n`);
  }

  const rawMessages = effectiveSystemPrompt ? [{ role: "system", content: effectiveSystemPrompt }, ...messages] : messages;
  const allMessages = hasImage ? normalizeMessagesForVision(rawMessages) : rawMessages;

  // ── Local node routing (admin only) ────────────────────────────────────────────────────────────────────────────
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

  // ── Determine tool access ─────────────────────────────────────────────────
  // Check if user is admin for extended tool access
  const { enableTools = true } = req.body;
  const adminUser = await getAdminUser(req);
  const toolDefs = enableTools ? (adminUser ? ADMIN_TOOL_DEFINITIONS : TOOL_DEFINITIONS) : [];
  // Vision models don't support function calling
  const supportsTools = enableTools && !hasImage && toolDefs.length > 0 &&
    (model === "deepseek-chat" || model === "glm-4-plus" || model === "glm-4-flash");

  try {
    // Debug: log vision request structure
    if (hasImage) {
      const debugMsgs = allMessages.map((m: any) => ({
        role: m.role,
        content: Array.isArray(m.content) ? m.content.map((c: any) => {
          if (c.type === 'image_url') return { type: 'image_url', url_start: (c.image_url?.url || '').substring(0, 30), url_len: (c.image_url?.url || '').length };
          return c;
        }) : m.content
      }));
      console.log('[Vision Debug] model:', cfg.model, 'baseUrl:', cfg.baseUrl, 'apiKey_len:', cfg.apiKey.length, 'msgs:', JSON.stringify(debugMsgs));
    }

    // ── Function Calling Loop ─────────────────────────────────────────────────
    // Supports up to 8 rounds of tool calls before forcing final answer
    const conversationMessages = [...allMessages];
    const MAX_TOOL_ROUNDS = 8;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      // Build request body
      const requestBody: any = {
        model: cfg.model,
        messages: conversationMessages,
        max_tokens: cfg.maxTokens || 4096,
        stream: true
      };

      // Add tools on first rounds (not on final forced answer)
      if (supportsTools && round < MAX_TOOL_ROUNDS - 1) {
        requestBody.tools = toolDefs;
        requestBody.tool_choice = "auto";
      }

      const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
        body: JSON.stringify(requestBody),
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
      let assistantContent = "";
      let toolCallsAccum: Record<string, { id: string; name: string; arguments: string }> = {};
      let finishReason = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (trimmed.startsWith("data: ")) {
            try {
              const json = JSON.parse(trimmed.slice(6));
              const choice = json.choices?.[0];
              if (!choice) continue;

              // Capture finish reason
              if (choice.finish_reason) finishReason = choice.finish_reason;

              const delta = choice.delta;
              if (!delta) continue;

              // Stream text content to client
              if (delta.content !== undefined && delta.content !== null) {
                assistantContent += delta.content;
                res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`);
              }

              // Accumulate tool calls (streamed in chunks)
              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = String(tc.index ?? 0);
                  if (!toolCallsAccum[idx]) {
                    toolCallsAccum[idx] = { id: tc.id || "", name: tc.function?.name || "", arguments: "" };
                  }
                  if (tc.id) toolCallsAccum[idx].id = tc.id;
                  if (tc.function?.name) toolCallsAccum[idx].name = tc.function.name;
                  if (tc.function?.arguments) toolCallsAccum[idx].arguments += tc.function.arguments;
                }
              }
            } catch { /* skip */ }
          }
        }
      }

      const toolCalls = Object.values(toolCallsAccum);

      // ── No tool calls → final answer, done ───────────────────────────────
      if (toolCalls.length === 0 || finishReason === "stop") {
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      // ── Tool calls detected → execute each tool ───────────────────────────
      // Add assistant message with tool_calls to conversation
      conversationMessages.push({
        role: "assistant",
        content: assistantContent || null,
        tool_calls: toolCalls.map(tc => ({
          id: tc.id,
          type: "function",
          function: { name: tc.name, arguments: tc.arguments }
        }))
      } as any);

      // Execute each tool and collect results
      for (const tc of toolCalls) {
        let args: Record<string, any> = {};
        try { args = JSON.parse(tc.arguments); } catch { args = {}; }

        // Notify frontend: tool is being called
        res.write(`data: ${JSON.stringify({
          toolCall: { id: tc.id, name: tc.name, args }
        })}\n\n`);

        const result = await executeTool(tc.name, args, !!adminUser);

        // Notify frontend: tool result received
        res.write(`data: ${JSON.stringify({
          toolResult: {
            id: tc.id,
            name: tc.name,
            success: result.success,
            output: result.output.slice(0, 500) // preview for frontend
          }
        })}\n\n`);

        // Add tool result to conversation
        conversationMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result.success
            ? result.output.slice(0, 8000) // limit context size
            : `工具执行失败: ${result.error}`
        } as any);
      }

      // Continue loop → AI will process tool results and either answer or call more tools
    }

    // Reached max rounds without final answer
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
  const { token, nodeId, skillsChecksum, skillCount } = req.body;
  const expectedToken = process.env.NODE_REGISTRATION_TOKEN;
  if (!expectedToken || token !== expectedToken) { res.status(401).json({ error: "Invalid token" }); return; }
  if (!nodeId || typeof nodeId !== "number") { res.status(400).json({ error: "Missing required field: nodeId" }); return; }
  try {
    const node = await getAiNodeById(nodeId);
    if (!node) { res.status(404).json({ error: `Node ${nodeId} not found` }); return; }
    await updateNodePingStatus(nodeId, true, undefined);
    // Update skillsChecksum if provided
    if (skillsChecksum !== undefined) {
      await updateAiNode(nodeId, { skillsChecksum });
    }
    // Check if server's skill checksum differs from client's
    const serverChecksum = (node as any).skillsChecksum;
    const needsSkillSync = skillsChecksum !== undefined && serverChecksum !== skillsChecksum;
    res.json({ success: true, timestamp: new Date().toISOString(), needsSkillSync });
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

// ─── Node Skills Sync ─────────────────────────────────────────────────────────────────
// POST /api/ai/node/skills/sync
// action: "upsert" | "delete" | "replace_all"
// skills: array of skill objects
aiStreamRouter.post("/node/skills/sync", async (req: Request, res: Response) => {
  const { token, nodeId, action = "upsert", skills } = req.body;
  const expectedToken = process.env.NODE_REGISTRATION_TOKEN;
  if (!expectedToken || token !== expectedToken) { res.status(401).json({ error: "Invalid token" }); return; }
  if (!nodeId || typeof nodeId !== "number") { res.status(400).json({ error: "Missing required field: nodeId" }); return; }
  if (!Array.isArray(skills)) { res.status(400).json({ error: "skills must be an array" }); return; }
  try {
    const node = await getAiNodeById(nodeId);
    if (!node) { res.status(404).json({ error: `Node ${nodeId} not found` }); return; }
    if (action === "replace_all") {
      // Delete all existing skills for this node, then insert new ones
      await deleteAllNodeSkills(nodeId);
      for (const skill of skills) {
        await upsertNodeSkill({ ...skill, nodeId });
      }
      console.log(`[Skills Sync] Node ${nodeId} replace_all: ${skills.length} skills`);
    } else if (action === "upsert") {
      for (const skill of skills) {
        await upsertNodeSkill({ ...skill, nodeId });
      }
      console.log(`[Skills Sync] Node ${nodeId} upsert: ${skills.length} skills`);
    } else if (action === "delete") {
      for (const skill of skills) {
        await deleteNodeSkill(nodeId, skill.skillId || skill.id);
      }
      console.log(`[Skills Sync] Node ${nodeId} delete: ${skills.length} skills`);
    } else {
      res.status(400).json({ error: `Unknown action: ${action}` }); return;
    }
    res.json({ success: true, count: skills.length, action });
  } catch (err: any) {
    console.error("[Skills Sync] Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/node/skills/:nodeId  (admin only)
aiStreamRouter.get("/node/skills/:nodeId", async (req: Request, res: Response) => {
  const admin = await getAdminUser(req);
  if (!admin) { res.status(401).json({ error: "Admin only" }); return; }
  const nodeId = parseInt(req.params.nodeId);
  if (isNaN(nodeId)) { res.status(400).json({ error: "Invalid nodeId" }); return; }
  try {
    const skills = await getNodeSkills(nodeId);
    res.json({ skills });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/node/skills  (admin only, all nodes)
aiStreamRouter.get("/node/skills", async (req: Request, res: Response) => {
  const admin = await getAdminUser(req);
  if (!admin) { res.status(401).json({ error: "Admin only" }); return; }
  try {
    const skills = await getAllNodeSkills();
    res.json({ skills });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/ai/node/skills/toggle  (admin only, enable/disable a skill)
aiStreamRouter.patch("/node/skills/toggle", async (req: Request, res: Response) => {
  const admin = await getAdminUser(req);
  if (!admin) { res.status(401).json({ error: "Admin only" }); return; }
  const { nodeId, skillId, isEnabled } = req.body;
  if (!nodeId || !skillId || typeof isEnabled !== "boolean") {
    res.status(400).json({ error: "Missing required fields: nodeId, skillId, isEnabled" }); return;
  }
  try {
    await setNodeSkillEnabled(Number(nodeId), skillId, isEnabled);
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

// ─── Image Generation (nano banana) ─────────────────────────────────────────────
// POST /api/ai/image/generate
// Requires authentication. Calls the internal Forge ImageService (nano banana).
aiStreamRouter.post("/image/generate", async (req: Request, res: Response) => {
  try {
    // Auth check — any logged-in user can generate images
    const user = await sdk.authenticateRequest(req) as any;
    if (!user) {
      res.status(401).json({ error: "请先登录" });
      return;
    }
    const { prompt, originalImages } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      res.status(400).json({ error: "请提供图像描述 (prompt)" });
      return;
    }
    const { generateImage } = await import("./_core/imageGeneration");
    const result = await generateImage({
      prompt: prompt.trim(),
      originalImages: originalImages || [],
    });
    res.json({ url: result.url });
  } catch (err: any) {
    console.error("[Image Generate] Error:", err);
    res.status(500).json({ error: err.message || "图像生成失败" });
  }
});

// ─── File Upload & Parse ─────────────────────────────────────────────────────
// POST /api/ai/upload
// Accepts: multipart/form-data with field "file"
// Returns: { type, text?, dataUrl?, fileName, fileType, size, truncated? }
aiStreamRouter.post("/upload", async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req) as any;
    if (!user) { res.status(401).json({ error: "请先登录" }); return; }

    const multer = (await import("multer")).default;
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (_req: any, file: any, cb: any) => {
        const ok = [
          "image/jpeg", "image/png", "image/gif", "image/webp",
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/msword",
          "text/plain", "text/csv", "text/markdown", "application/json",
        ];
        if (ok.includes(file.mimetype) || /\.(txt|md|csv|json|pdf|docx|doc|png|jpg|jpeg|gif|webp)$/i.test(file.originalname)) {
          cb(null, true);
        } else {
          cb(new Error(`不支持的文件类型: ${file.mimetype}`));
        }
      },
    });

    await new Promise<void>((resolve, reject) => {
      upload.single("file")(req as any, res as any, (err: any) => {
        if (err) reject(err); else resolve();
      });
    });

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) { res.status(400).json({ error: "请选择要上传的文件" }); return; }

    const { originalname, mimetype, buffer, size } = file;

    // ── Image: return as base64 data URL for vision model ──
    if (mimetype.startsWith("image/")) {
      const base64 = buffer.toString("base64");
      res.json({
        type: "image",
        dataUrl: `data:${mimetype};base64,${base64}`,
        fileName: originalname,
        fileType: mimetype,
        size,
      });
      return;
    }

    let extractedText = "";
    let fileType = "text";

    // ── PDF ──
    if (mimetype === "application/pdf" || /\.pdf$/i.test(originalname)) {
      try {
        // Polyfill DOMMatrix for pdfjs-dist on Node.js 18
        if (typeof (globalThis as any).DOMMatrix === 'undefined') {
          (globalThis as any).DOMMatrix = class DOMMatrix {
            constructor() { return new Proxy({}, { get: () => 0 }); }
          };
        }
        // Dynamic import to avoid DOMMatrix crash at module load time
        const { PDFParse } = await import('pdf-parse');
        const parser = new PDFParse({ data: buffer });
        const parseResult = await parser.getText();
        extractedText = parseResult.text?.trim() || "";
        if (!extractedText) extractedText = "[PDF 内容为空或为扫描件，无法提取文字]";
        fileType = "pdf";
      } catch (e: any) {
        console.warn("[Upload] PDF parse failed:", e?.message);
        extractedText = `[PDF 解析失败: ${e?.message || "未知错误"}，请尝试复制文本内容]`;
        fileType = "pdf";
      }
    }
    // ── Word (.docx) ──
    else if (
      mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      /\.docx$/i.test(originalname)
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value?.trim() || "";
        if (!extractedText) extractedText = "[Word 文档内容为空]";
        fileType = "docx";
        if (result.messages?.length > 0) {
          console.log("[Upload] DOCX warnings:", result.messages.map((m: any) => m.message).join("; "));
        }
      } catch (e: any) {
        console.warn("[Upload] DOCX parse failed:", e?.message);
        extractedText = `[Word 文档解析失败: ${e?.message || "未知错误"}]`;
        fileType = "docx";
      }
    }
    // ── Word (.doc 旧格式) ──
    else if (
      mimetype === "application/msword" ||
      /\.doc$/i.test(originalname)
    ) {
      // mammoth 主要支持 .docx，对旧版 .doc 尝试解析，失败时给出明确提示
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value?.trim() || "";
        if (!extractedText) extractedText = "[旧版 .doc 格式内容为空，建议另存为 .docx 后重新上传]";
        fileType = "doc";
      } catch (e: any) {
        console.warn("[Upload] DOC parse failed:", e?.message);
        extractedText = `[旧版 .doc 格式暂不支持自动解析，请在 Word 中另存为 .docx 格式后重新上传]`;
        fileType = "doc";
      }
    }
    // ── Plain text / CSV / JSON / Markdown ──
    else {
      extractedText = buffer.toString("utf-8").trim();
      fileType = /\.csv$/i.test(originalname) ? "csv"
        : /\.json$/i.test(originalname) ? "json"
        : /\.md$/i.test(originalname) ? "markdown"
        : "text";
    }

    // Truncate to ~60k chars to avoid token overflow
    const MAX_CHARS = 60000;
    let truncated = false;
    if (extractedText.length > MAX_CHARS) {
      extractedText = extractedText.slice(0, MAX_CHARS);
      truncated = true;
    }

    res.json({
      type: "document",
      text: extractedText,
      fileName: originalname,
      fileType,
      size,
      truncated,
      charCount: extractedText.length,
    });
  } catch (err: any) {
    console.error("[Upload] Error:", err);
    res.status(500).json({ error: err.message || "文件解析失败" });
  }
});

// ─── Health check ─────────────────────────────────────────────
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
  res.json({ status: "ok", models: status, nodes: { total: nodeCount, online: onlineCount }, timestamp: new Date().toISOString(), version: "v2.3-openclaw-skills" });
});

export default aiStreamRouter;
