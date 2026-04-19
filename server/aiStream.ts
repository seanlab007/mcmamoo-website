import { Router, Request, Response } from "express";
import { spawn } from "child_process";
import { MODEL_CONFIGS } from "./models";
import { getAiNodes, getAiNodeById, createAiNode, updateAiNode, updateNodePingStatus, getRoutingRules, createNodeLog, getNodeSkills, getAllNodeSkills, upsertNodeSkill, deleteNodeSkill, deleteAllNodeSkills, setNodeSkillEnabled } from "./db";
import { dbFetch } from "./aiNodes";
import { sdk } from "./_core/sdk";
import mammoth from "mammoth";
// pdf-parse is loaded dynamically to avoid DOMMatrix crash at startup
import { TOOL_DEFINITIONS, ADMIN_TOOL_DEFINITIONS, executeTool } from "./tools";
import { checkSkillPermission } from "./contentPlatform";
import { getAgentSystemPrompt } from "./agents";
import { searchCorpus, formatForPrompt } from "./maoRagServer";
import { TokenOptimizationPipeline } from "./token-optimization";

const aiStreamRouter = Router();

// ─── Token Optimization Pipeline ────────────────────────────────────────────────
// 集成 TokenSaver / Claw-Compactor / RTK 的 token 节省管线
const tokenPipeline = new TokenOptimizationPipeline({
  enableInputPreprocess: true,
  enableOutputCompact: true,
  enableCliProxy: true,
  enableTokenCounting: true,
  inputMaxChars: 12000,
  toolOutputMaxChars: 6000,
});

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
const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
const OLLAMA_OPENAI_BASE_URL = `${OLLAMA_BASE_URL}/v1`;
const OLLAMA_NODE_NAME_PREFIX = "Ollama / ";

async function syncAutoDiscoveredOllamaNodes() {
  try {
    const resp = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!resp.ok) return;

    const data = await resp.json().catch(() => ({}));
    const modelIds = (Array.isArray(data?.models) ? data.models : [])
      .map((item: any) => String(item?.model || item?.name || "").trim())
      .filter(Boolean);

    if (modelIds.length === 0) return;

    const existing = await getAiNodes();

    for (let idx = 0; idx < modelIds.length; idx++) {
      const modelId = modelIds[idx];
      const name = `${OLLAMA_NODE_NAME_PREFIX}${modelId}`;
      const found = existing.find((node) => String(node.name || "") === name);
      const payload = {
        name,
        type: "openai_compat",
        baseUrl: OLLAMA_OPENAI_BASE_URL,
        modelId,
        isPaid: false,
        isLocal: true,
        isActive: true,
        isOnline: true,
        priority: Number(found?.priority) || 50 + idx,
        description: `Auto-discovered from Ollama (${OLLAMA_BASE_URL})`,
      };

      if (found?.id) {
        await updateAiNode(Number(found.id), payload);
        await updateNodePingStatus(Number(found.id), true, 0);
      } else {
        const created = await createAiNode(payload);
        if (created?.id) {
          await updateNodePingStatus(Number(created.id), true, 0);
        }
      }
    }
  } catch (err) {
    console.warn("[Ollama Sync] Skip auto-discovery:", err);
  }
}

async function selectNode(preferPaid?: boolean, onlyLocal?: boolean, onlyCloud?: boolean) {
  try {
    if (onlyLocal) {
      await syncAutoDiscoveredOllamaNodes();
    }

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

// ─── Skill Match Helper ───────────────────────────────────────────────────────
// Finds the best matching skill for a user message from online local nodes.
// Returns the matched skill row (with nodeId, skillId, invokeMode, systemPrompt, etc.)
// or null if no match / no online nodes.
async function matchSkillForMessage(userMessage: string): Promise<{
  nodeId: number;
  skillId: string;
  name: string;
  description: string | null;
  invokeMode: string;        // 'prompt' | 'invoke'
  systemPrompt: string | null;
  inputSchema: Record<string, unknown> | null;
  requiredPlan: string;      // 'free' | 'content' | 'strategic' | 'admin'
  node: { baseUrl: string; token: string; name: string } | null;
} | null> {
  try {
    // Get all online local nodes
    const nodesRes = await dbFetch("/ai_nodes?isOnline=eq.true&isLocal=eq.true&select=id,name,baseUrl,token");
    const onlineNodes = nodesRes.data as { id: number; name: string; baseUrl: string; token: string }[] | [];
    if (!onlineNodes || onlineNodes.length === 0) return null;

    const nodeIds = onlineNodes.map((n) => n.id);
    const skillsRes = await dbFetch(
      `/node_skills?nodeId=in.(${nodeIds.join(",")})&isActive=eq.true&select=*`
    );
    const skills = skillsRes.data as Array<{
      nodeId: number;
      skillId: string;
      name: string;
      triggers: string[] | null;
      description: string | null;
      invokeMode: string | null;
      systemPrompt: string | null;
      inputSchema: Record<string, unknown> | null;
      required_plan: string | null;
    }> | [];

    if (!skills || skills.length === 0) return null;

    // Keyword matching (same logic as skill/match endpoint)
    const msgLower = userMessage.toLowerCase();
    const matched = skills.filter((skill) => {
      const triggers = skill.triggers ?? [];
      return triggers.some((t: string) => msgLower.includes(t.toLowerCase()));
    });

    if (matched.length === 0) return null;

    // Pick highest-priority match (first matched, or refine by trigger specificity)
    const best = matched.sort((a, b) => {
      const aMaxLen = Math.max(...(a.triggers ?? [""]).map((t) => t.length));
      const bMaxLen = Math.max(...(b.triggers ?? [""]).map((t) => t.length));
      return bMaxLen - aMaxLen; // prefer longer (more specific) trigger
    })[0];

    const node = onlineNodes.find((n) => n.id === best.nodeId) || null;

    return {
      nodeId: best.nodeId,
      skillId: best.skillId,
      name: best.name,
      description: best.description ?? null,
      invokeMode: best.invokeMode ?? "prompt",
      systemPrompt: best.systemPrompt ?? null,
      inputSchema: best.inputSchema ?? null,
      requiredPlan: best.required_plan ?? "free",
      node: node ? { baseUrl: node.baseUrl, token: node.token, name: node.name } : null,
    };
  } catch (err) {
    console.warn("[SkillMatch] Error during skill matching:", err);
    return null;
  }
}

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
      model = "glm-5v-turbo"; // auto-switch to GLM-5V-Turbo (newest vision model)
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
        console.log(`[SkillMatch] Matched skill "${matchedSkill.skillId}" (mode=${matchedSkill.invokeMode}, requiredPlan=${matchedSkill.requiredPlan}) on node ${matchedSkill.nodeId}`);

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

  // ── MaoAI 语料库 RAG 引用注入 ───────────────────────────────────────────
  // 当有用户消息时，检索相关语料并追加到 system prompt（非阻塞执行）
  const userTextForRag = (() => {
    const lastUserMsg = [...(messages ?? [])].reverse().find((m: any) => m.role === "user");
    if (!lastUserMsg) return "";
    return typeof lastUserMsg.content === "string"
      ? lastUserMsg.content
      : Array.isArray(lastUserMsg.content)
        ? lastUserMsg.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join(" ")
        : "";
  })();
  if (userTextForRag.trim() && userTextForRag.length > 2) {
    try {
      const ragResults = await searchCorpus(userTextForRag, 3);
      if (ragResults.length > 0) {
        const refs = formatForPrompt(ragResults);
        if (refs) {
          res.write(`data: ${JSON.stringify({ ragReferences: { count: ragResults.length, preview: refs.slice(0, 100) + "..." } })}\n\n`);
          effectiveSystemPrompt = (effectiveSystemPrompt ? effectiveSystemPrompt + "\n\n" : "") + refs;
        }
      }
    } catch (_) { /* RAG 失败不影响主流程 */ }
  }

  const rawMessages = effectiveSystemPrompt ? [{ role: "system", content: effectiveSystemPrompt }, ...messages] : messages;

  // ── Token Optimization: 输入预处理 ──────────────────────────────────────
  // 压缩用户输入和 system prompt，减少发送给 LLM 的 token 数
  const sessionId = req.headers["x-session-id"] as string || `chat-${Date.now()}`;
  const { messages: optimizedMessages, savedTokens: inputSaved, stats: inputStats } = tokenPipeline.optimizeInput(rawMessages, sessionId);

  if (inputSaved > 0) {
    res.write(`data: ${JSON.stringify({
      tokenOptimization: {
        stage: "input_preprocess",
        savedTokens: inputSaved,
        strategies: inputStats.flatMap(s => s.appliedStrategies),
        originalChars: inputStats.reduce((sum, s) => sum + s.originalChars, 0),
        processedChars: inputStats.reduce((sum, s) => sum + s.processedChars, 0),
      }
    })}\n\n`);
  }

  const allMessages = hasImage ? normalizeMessagesForVision(optimizedMessages) : optimizedMessages;

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
  // All cloud models with an apiKey support OpenAI-style function calling
  const supportsTools = enableTools && !hasImage && toolDefs.length > 0 && !!cfg.apiKey;

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

      // ── ReAct 推理轮次通知（SSE，frontend 显示"正在思考..."动画）─────────────
      res.write(`data: ${JSON.stringify({
        reactRound: { round: round + 1, status: "thinking", maxRounds: MAX_TOOL_ROUNDS }
      })}\n\n`);

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
        res.write(`data: ${JSON.stringify({
          reactEnd: { reason: toolCalls.length === 0 ? "no_tools" : "final_answer", rounds: round + 1 }
        })}\n\n`);

        // ── Token Optimization: 推送会话总统计 ──────────────────────────
        const sessionStats = tokenPipeline.getSessionStats(sessionId);
        if (sessionStats && sessionStats.totalSavedTokens > 0) {
          res.write(`data: ${JSON.stringify({
            tokenOptimization: {
              stage: "session_summary",
              totalSavedTokens: sessionStats.totalSavedTokens,
              savingRatio: Math.round(sessionStats.savingRatio * 100),
              strategies: sessionStats.strategyBreakdown,
              rounds: sessionStats.rounds,
            }
          })}\n\n`);
        }

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
        // ── Token Optimization: 工具输出压缩 ──────────────────────────────
        // 对 CLI/code 工具的输出进行压缩，减少上下文 token 消耗
        let toolOutput = result.success ? result.output : `工具执行失败: ${result.error}`;
        if (result.success && result.output.length > 200) {
          const { text: compressedOutput, savedTokens: outputSaved } = tokenPipeline.optimizeToolOutput(tc.name, result.output, sessionId);
          toolOutput = compressedOutput;

          if (outputSaved > 0) {
            res.write(`data: ${JSON.stringify({
              tokenOptimization: {
                stage: "output_compact",
                toolName: tc.name,
                savedTokens: outputSaved,
              }
            })}\n\n`);
          }
        }

        // 限制上下文大小
        if (toolOutput.length > 8000) {
          toolOutput = toolOutput.slice(0, 8000);
        }

        conversationMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: toolOutput,
        } as any);
      }

      // Continue loop → AI will process tool results and either answer or call more tools
    }

    // Reached max rounds without final answer
    res.write(`data: ${JSON.stringify({
      reactEnd: { reason: "max_rounds", rounds: MAX_TOOL_ROUNDS }
    })}\n\n`);

    // ── Token Optimization: 推送会话总统计 ──────────────────────────────
    const finalSessionStats = tokenPipeline.getSessionStats(sessionId);
    if (finalSessionStats && finalSessionStats.totalSavedTokens > 0) {
      res.write(`data: ${JSON.stringify({
        tokenOptimization: {
          stage: "session_summary",
          totalSavedTokens: finalSessionStats.totalSavedTokens,
          savingRatio: Math.round(finalSessionStats.savingRatio * 100),
          strategies: finalSessionStats.strategyBreakdown,
          rounds: finalSessionStats.rounds,
        }
      })}\n\n`);
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
      await syncAutoDiscoveredOllamaNodes();
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
          is_online: n.isOnline !== false,
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
      const { updateAiNode } = await import("./db");
      await updateAiNode(nodeId, { skillsChecksum } as any);
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

// GET /api/ai/skill/list — 返回所有可用 AI 技能（内容平台前端使用）
aiStreamRouter.get("/skill/list", async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req) as any;
    if (!user) { res.status(401).json({ error: "请先登录" }); return; }
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

// ─── Midjourney Imagine ──────────────────────────────────────────────────────
// POST /api/ai/midjourney/imagine
aiStreamRouter.post("/midjourney/imagine", async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req) as any;
    if (!user) { res.status(401).json({ error: "请先登录" }); return; }
    const { prompt, aspectRatio, quality, style, version } = req.body;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      res.status(400).json({ error: "请提供图像描述 (prompt)" });
      return;
    }
    const { midjourneyImagine } = await import("./_core/midjourney");
    const result = await midjourneyImagine({
      prompt: prompt.trim(),
      aspectRatio,
      quality,
      style,
      version,
    });
    res.json(result);
  } catch (err: any) {
    console.error("[Midjourney Imagine] Error:", err);
    res.status(500).json({ error: err.message || "Midjourney 生成失败" });
  }
});

// POST /api/ai/midjourney/status
aiStreamRouter.post("/midjourney/status", async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req) as any;
    if (!user) { res.status(401).json({ error: "请先登录" }); return; }
    const { taskId } = req.body;
    if (!taskId) { res.status(400).json({ error: "缺少 taskId" }); return; }
    const { midjourneyTaskStatus } = await import("./_core/midjourney");
    const result = await midjourneyTaskStatus(taskId);
    res.json(result);
  } catch (err: any) {
    console.error("[Midjourney Status] Error:", err);
    res.status(500).json({ error: err.message || "Midjourney 状态查询失败" });
  }
});

// POST /api/ai/midjourney/upscale
aiStreamRouter.post("/midjourney/upscale", async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req) as any;
    if (!user) { res.status(401).json({ error: "请先登录" }); return; }
    const { taskId, index } = req.body;
    if (!taskId || index === undefined) {
      res.status(400).json({ error: "缺少 taskId 或 index" });
      return;
    }
    const { midjourneyUpscale } = await import("./_core/midjourney");
    const result = await midjourneyUpscale(taskId, index);
    res.json(result);
  } catch (err: any) {
    console.error("[Midjourney Upscale] Error:", err);
    res.status(500).json({ error: err.message || "Midjourney Upscale 失败" });
  }
});

// ─── Runway Text-to-Video ────────────────────────────────────────────────────
// POST /api/ai/runway/text-to-video
aiStreamRouter.post("/runway/text-to-video", async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req) as any;
    if (!user) { res.status(401).json({ error: "请先登录" }); return; }
    const { promptText, negativePromptText, duration, seed, model } = req.body;
    if (!promptText || typeof promptText !== "string" || !promptText.trim()) {
      res.status(400).json({ error: "请提供视频描述 (promptText)" });
      return;
    }
    const { runwayTextToVideo } = await import("./_core/runway");
    const result = await runwayTextToVideo({
      promptText: promptText.trim(),
      negativePromptText,
      duration,
      seed,
      model,
    });
    res.json(result);
  } catch (err: any) {
    console.error("[Runway T2V] Error:", err);
    res.status(500).json({ error: err.message || "Runway 视频生成失败" });
  }
});

// POST /api/ai/runway/image-to-video
aiStreamRouter.post("/runway/image-to-video", async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req) as any;
    if (!user) { res.status(401).json({ error: "请先登录" }); return; }
    const { promptImage, promptText, negativePromptText, duration, seed, model } = req.body;
    if (!promptImage) {
      res.status(400).json({ error: "请提供输入图片 URL (promptImage)" });
      return;
    }
    const { runwayImageToVideo } = await import("./_core/runway");
    const result = await runwayImageToVideo({
      promptImage,
      promptText,
      negativePromptText,
      duration,
      seed,
      model,
    });
    res.json(result);
  } catch (err: any) {
    console.error("[Runway I2V] Error:", err);
    res.status(500).json({ error: err.message || "Runway 图片生成视频失败" });
  }
});

// POST /api/ai/runway/status
aiStreamRouter.post("/runway/status", async (req: Request, res: Response) => {
  try {
    const user = await sdk.authenticateRequest(req) as any;
    if (!user) { res.status(401).json({ error: "请先登录" }); return; }
    const { taskId } = req.body;
    if (!taskId) { res.status(400).json({ error: "缺少 taskId" }); return; }
    const { runwayTaskStatus } = await import("./_core/runway");
    const result = await runwayTaskStatus(taskId);
    res.json(result);
  } catch (err: any) {
    console.error("[Runway Status] Error:", err);
    res.status(500).json({ error: err.message || "Runway 状态查询失败" });
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

// ─── HyperAgents Python Engine — 流式推理日志 ─────────────────────────────────────
// POST /api/ai/agent/stream
// 启动 Python HyperAgents Engine，通过 SSE 将 ReAct 推理日志实时推送到前端
// 请求体: { task: string, domain?: "coding"|"research"|"general", workspace?: string }
aiStreamRouter.post("/agent/stream", async (req: Request, res: Response) => {
  const { task, domain = "general", workspace = "." } = req.body as {
    task: string;
    domain?: string;
    workspace?: string;
  };

  if (!task || typeof task !== "string" || !task.trim()) {
    res.status(400).json({ error: "Missing required field: task" });
    return;
  }

  const admin = await getAdminUser(req);
  if (!admin) {
    res.status(403).json({ error: "仅限管理员使用 HyperAgents" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const PYTHON_SCRIPT = `${__dirname}/hyperagents/generate_loop.py`;
  const PYTHON_CMD = (process.env.PYTHON3_PATH || "python3");

  const pythonProcess = spawn(PYTHON_CMD, [
    PYTHON_SCRIPT,
    "--task", task.trim(),
    "--domain", domain,
    "--workspace", workspace,
  ], {
    cwd: workspace,
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
    },
    timeout: 120000,
  });

  let hasErrored = false;

  pythonProcess.stdout.on("data", (data: Buffer) => {
    const lines = data.toString("utf-8").split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      try {
        const logEntry = JSON.parse(line);
        // 通过 SSE 发送 agentLog 事件，frontend 实时渲染"推理日志"视图
        res.write(`data: ${JSON.stringify({ agentLog: logEntry })}\n\n`);
      } catch {
        // 非 JSON 输出（如 Python stderr）作为普通消息
        console.log("[Python Raw stdout]:", line.substring(0, 200));
        res.write(`data: ${JSON.stringify({ agentLog: { type: "raw", message: line.substring(0, 200), timestamp: Date.now() / 1000 } })}\n\n`);
      }
    }
  });

  pythonProcess.stderr.on("data", (data: Buffer) => {
    if (hasErrored) return;
    hasErrored = true;
    const errMsg = data.toString("utf-8").trim();
    console.warn("[HyperAgents stderr]:", errMsg.substring(0, 300));
    res.write(`data: ${JSON.stringify({ agentLog: { type: "error", category: "env", message: errMsg.substring(0, 300), timestamp: Date.now() / 1000 } })}\n\n`);
  });

  pythonProcess.on("close", (code: number | null) => {
    res.write(`data: ${JSON.stringify({ agentLog: { type: "done", exitCode: code, timestamp: Date.now() / 1000 } })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  });

  pythonProcess.on("error", (err: Error) => {
    console.error("[HyperAgents spawn error]:", err);
    res.write(`data: ${JSON.stringify({ agentLog: { type: "error", category: "env", message: `启动失败: ${err.message}`, timestamp: Date.now() / 1000 } })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  });

  // 超时保护：5 分钟
  setTimeout(() => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ agentLog: { type: "error", category: "timeout", message: "执行超时（5分钟）", timestamp: Date.now() / 1000 } })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
      pythonProcess.kill("SIGTERM");
    }
  }, 5 * 60 * 1000);
});

// ─── Suggested Follow-ups Generator ────────────────────────────────────────
// POST /api/ai/suggestions
// 根据对话历史和 AI 回复，生成 3 个推荐追问
aiStreamRouter.post("/suggestions", async (req: Request, res: Response) => {
  const { messages, lastResponse } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Missing or invalid messages" });
    return;
  }

  if (!lastResponse || typeof lastResponse !== "string" || lastResponse.trim().length === 0) {
    res.status(400).json({ error: "Missing or invalid lastResponse" });
    return;
  }

  // 使用快速模型生成推荐追问
  const cfg = MODEL_CONFIGS["deepseek-chat"] || MODEL_CONFIGS["glm-4-flash"];
  if (!cfg?.apiKey) {
    res.status(503).json({ error: "No model configured for suggestions" });
    return;
  }

  // 构建对话摘要（避免发送完整历史，限制长度）
  const recentMessages = messages.slice(-6);
  const conversationSummary = recentMessages
    .map((m: any) => `${m.role === "user" ? "用户" : "AI"}: ${typeof m.content === "string" ? m.content.slice(0, 500) : "[多模态内容]"}`)
    .join("\n");

  const prompt = `你是一个对话助手，需要根据以下对话内容，为用户生成3个具有启发性的追问建议。

对话历史：
${conversationSummary}

AI 最新回复：
${lastResponse.slice(0, 1500)}

请生成3个追问建议，要求：
1. 每个问题不超过20个中文字
2. 必须与当前话题强相关
3. 从不同角度提问：
   - 第1个问题：技术深度/定制化（如"如何自定义配置？"）
   - 第2个问题：工程权衡/挑战（如"性能和成本如何平衡？"）
   - 第3个问题：落地实践/案例（如"有哪些成功案例？"）
4. 避免是非性问题，多用"如何"、"为什么"、"对比"

请直接返回3个问题，每行一个，不要序号和任何其他内容。`;

  try {
    const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [{ role: "user", content: prompt }],
        stream: false,
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Suggestions] Model API error:", response.status, errText.slice(0, 200));
      res.status(500).json({ error: `Model API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";

    // 解析问题（每行一个）
    const lines = rawContent.split("\n").map((l: string) => l.trim()).filter(Boolean);
    const questions = lines.slice(0, 3);

    // 分配维度标签
    const dimensions: Array<"depth" | "tradeoff" | "practice"> = ["depth", "tradeoff", "practice"];
    const suggestions = questions.map((q: string, i: number) => ({
      question: q.replace(/^[\d\.\-\*]+\s*/, "").replace(/[\"「」]/g, ""), // 清理序号和引号
      dimension: dimensions[i] || "depth",
    }));

    // 确保返回3个建议（如果解析失败则用默认值补充）
    if (suggestions.length < 3) {
      const defaults = [
        { question: "如何进一步深入探讨这个话题？", dimension: "depth" as const },
        { question: "这有什么优缺点或权衡？", dimension: "tradeoff" as const },
        { question: "有哪些实际应用案例？", dimension: "practice" as const },
      ];
      while (suggestions.length < 3) {
        suggestions.push(defaults[suggestions.length]);
      }
    }

    res.json({ suggestions });
  } catch (err: any) {
    console.error("[Suggestions] Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate suggestions" });
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
