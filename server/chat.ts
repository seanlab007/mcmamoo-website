/**
 * MaoAI Chat API
 *
 * 接口列表：
 *  POST /api/chat/conversations          新建对话
 *  GET  /api/chat/conversations          获取对话列表
 *  DELETE /api/chat/conversations/:id    删除对话
 *  PATCH /api/chat/conversations/:id/title  重命名对话
 *  GET  /api/chat/conversations/:id/messages  获取消息列表
 *  POST /api/chat/send                   发送消息（流式 SSE）
 *  POST /api/chat/image-gen              图片生成（CogView-3）
 *  GET  /api/chat/agents                 获取可用 Agent 列表
 *  GET  /api/chat/agents/:id             获取指定 Agent 详情
 */

import { Router, Request, Response } from "express";
import { AGENTS, getAgent, getAgentSystemPrompt, AGENTS_BY_CATEGORY, CATEGORY_INFO } from "./agents";

export const chatRouter = Router();

// ─── Supabase ───────────────────────────────────────────────────────────────

function sbHeaders() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || "";
  return {
    url,
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  };
}

async function sbGet(path: string) {
  const { url, headers } = sbHeaders();
  const res = await fetch(`${url}/rest/v1${path}`, { headers });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

async function sbPost(path: string, body: unknown, prefer?: string) {
  const { url, headers } = sbHeaders();
  const h: Record<string, string> = { ...headers };
  if (prefer) h["Prefer"] = prefer;
  const res = await fetch(`${url}/rest/v1${path}`, {
    method: "POST",
    headers: h,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

async function sbDelete(path: string) {
  const { url, headers } = sbHeaders();
  const res = await fetch(`${url}/rest/v1${path}`, { method: "DELETE", headers });
  return { ok: res.ok, status: res.status };
}

async function sbPatch(path: string, body: unknown) {
  const { url, headers } = sbHeaders();
  const res = await fetch(`${url}/rest/v1${path}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

// ─── 联网搜索（Tavily API）────────────────────────────────────────────────────

async function webSearch(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return "";

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: 5,
        include_answer: true,
      }),
    });
    if (!res.ok) return "";
    const json: any = await res.json();
    const answer = json.answer || "";
    const results: string = (json.results || [])
      .slice(0, 3)
      .map((r: any) => `[${r.title}](${r.url})\n${r.content?.slice(0, 300)}`)
      .join("\n\n");
    return `【联网搜索结果】\n${answer ? `摘要：${answer}\n\n` : ""}${results}`;
  } catch {
    return "";
  }
}

// ─── 检测是否需要联网搜索 ──────────────────────────────────────────────────

function needsSearch(text: string): boolean {
  const patterns = [
    /今天|今日|现在|最新|最近|当前|实时/,
    /\d{4}年|\d+月\d+日/,
    /新闻|资讯|行情|价格|股价/,
    /搜索|查一下|找一下|帮我查/,
    /latest|current|today|recent|news/i,
  ];
  return patterns.some(p => p.test(text));
}

// ─── 多模型路由配置 ───────────────────────────────────────────────────────────

/**
 * 模型配置表
 * provider: 'zhipu' | 'deepseek' | 'groq'
 * apiModel: 实际传给 API 的模型名
 */
interface ModelConfig {
  provider: "zhipu" | "deepseek" | "groq" | "gemini" | "google-ai-studio";
  apiModel: string;
  label: string;
  maxTokens: number;
}

const MODEL_MAP: Record<string, ModelConfig> = {
  // ── DeepSeek ──────────────────────────────────────────────────────────────
  "deepseek-chat":     { provider: "deepseek", apiModel: "deepseek-chat",     label: "DeepSeek Chat",     maxTokens: 4096 },
  "deepseek-reasoner": { provider: "deepseek", apiModel: "deepseek-reasoner", label: "DeepSeek Reasoner", maxTokens: 8192 },
  // ── Groq（极速）────────────────────────────────────────────────────────────
  "llama-3.3-70b":     { provider: "groq", apiModel: "llama-3.3-70b-versatile",  label: "Llama 3.3 70B (Groq)", maxTokens: 4096 },
  "llama-3.1-8b":      { provider: "groq", apiModel: "llama-3.1-8b-instant",     label: "Llama 3.1 8B (Groq)",  maxTokens: 4096 },
  "gemma2-9b":         { provider: "groq", apiModel: "gemma2-9b-it",             label: "Gemma2 9B (Groq)",     maxTokens: 4096 },
  // ── 智谱 GLM ───────────────────────────────────────────────────────────────
  "glm-4-flash":       { provider: "zhipu", apiModel: "glm-4-flash",  label: "GLM-4 Flash",  maxTokens: 4096 },
  "glm-4-plus":        { provider: "zhipu", apiModel: "glm-4-plus",   label: "GLM-4 Plus",   maxTokens: 4096 },
  "glm-4-air":         { provider: "zhipu", apiModel: "glm-4-air",    label: "GLM-4 Air",    maxTokens: 4096 },
  "glm-z1-flash":      { provider: "zhipu", apiModel: "glm-z1-flash", label: "GLM-Z1 Flash", maxTokens: 4096 },
  // ── Gemini ───────────────────────────────────────────────────────────────
  "gemini-2.5-flash":  { provider: "gemini", apiModel: "gemini-2.5-flash-preview-04-17", label: "Gemini 2.5 Flash", maxTokens: 8192 },
  "gemini-2.5-pro":    { provider: "gemini", apiModel: "gemini-2.5-pro-preview-03-25",   label: "Gemini 2.5 Pro",   maxTokens: 8192 },
  // ── Google AI Studio (Gemma 4) ───────────────────────────────────────────
  "gemma-4-e2b-it":    { provider: "google-ai-studio", apiModel: "gemma-4-e2b-it",   label: "Gemma 4 E2B", maxTokens: 128000 },
  "gemma-4-e4b-it":    { provider: "google-ai-studio", apiModel: "gemma-4-e4b-it",   label: "Gemma 4 E4B", maxTokens: 128000 },
  "gemma-4-26b-it":    { provider: "google-ai-studio", apiModel: "gemma-4-26b-it",   label: "Gemma 4 26B", maxTokens: 256000 },
  "gemma-4-31b-it":    { provider: "google-ai-studio", apiModel: "gemma-4-31b-it",   label: "Gemma 4 31B", maxTokens: 256000 },
};

const DEFAULT_MODEL = "deepseek-chat";

// ─── 各 Provider 的 API 端点和 Headers ───────────────────────────────────────

const ZHIPU_BASE    = "https://open.bigmodel.cn/api/paas/v4";
const DEEPSEEK_BASE = "https://api.deepseek.com/v1";
const GROQ_BASE     = "https://api.groq.com/openai/v1";
const GEMINI_BASE   = "https://generativelanguage.googleapis.com/v1beta/openai";
const GOOGLE_AI_STUDIO_BASE = "https://generativelanguage.googleapis.com/v1beta";

function getProviderConfig(provider: ModelConfig["provider"]): { base: string; key: string } {
  switch (provider) {
    case "deepseek":
      return { base: DEEPSEEK_BASE, key: process.env.DEEPSEEK_API_KEY || "" };
    case "groq":
      return { base: GROQ_BASE,     key: process.env.GROQ_API_KEY || "" };
    case "gemini":
      return { base: GEMINI_BASE,   key: process.env.GEMINI_API_KEY || "" };
    case "google-ai-studio":
      return { base: GOOGLE_AI_STUDIO_BASE, key: process.env.GOOGLE_AI_STUDIO_API_KEY || "" };
    case "zhipu":
    default:
      return { base: ZHIPU_BASE,    key: process.env.ZHIPU_API_KEY || "" };
  }
}

function zhipuHeaders() {
  const key = process.env.ZHIPU_API_KEY || "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${key}`,
  };
}

// ── GET /api/chat/models ──────────────────────────────────────────────────────
chatRouter.get("/models", (_req, res) => {
  const list = Object.entries(MODEL_MAP).map(([id, cfg]) => ({
    id,
    label: cfg.label,
    provider: cfg.provider,
  }));
  res.json(list);
});

// ─── 路由实现 ────────────────────────────────────────────────────────────────

/** 获取 userId（从 Cookie/JWT 解析，或返回匿名 ID） */
function getUserId(req: Request): string {
  // 尝试从 Authorization header 读取（简单 base64 encoded userId）
  const auth = req.headers["x-user-id"];
  if (auth && typeof auth === "string") return auth;
  // session cookie fallback
  const cookie = req.cookies?.["mao-session"];
  if (cookie) return `session:${cookie.slice(0, 32)}`;
  // anonymous
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "anon";
  return `anon:${ip}`;
}

// ── POST /api/chat/conversations ─────────────────────────────────────────────
chatRouter.post("/conversations", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { title = "新对话", model = "glm-4-flash" } = req.body || {};
    const r = await sbPost(
      "/conversations?select=id,title,model,created_at,updated_at",
      { user_id: userId, title, model },
      "return=representation"
    );
    if (!r.ok) return res.status(500).json({ error: "创建对话失败" });
    const conv = Array.isArray(r.data) ? r.data[0] : r.data;
    res.json(conv);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/chat/conversations ───────────────────────────────────────────────
chatRouter.get("/conversations", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const r = await sbGet(
      `/conversations?user_id=eq.${encodeURIComponent(userId)}&order=updated_at.desc&limit=50&select=id,title,model,created_at,updated_at`
    );
    if (!r.ok) return res.status(500).json({ error: "获取对话列表失败" });
    res.json(r.data || []);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── DELETE /api/chat/conversations/:id ────────────────────────────────────────
chatRouter.delete("/conversations/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    await sbDelete(`/conversations?id=eq.${req.params.id}&user_id=eq.${encodeURIComponent(userId)}`);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── PATCH /api/chat/conversations/:id/title ───────────────────────────────────
chatRouter.patch("/conversations/:id/title", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "title 必填" });
    await sbPatch(
      `/conversations?id=eq.${req.params.id}&user_id=eq.${encodeURIComponent(userId)}`,
      { title }
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/chat/conversations/:id/messages ──────────────────────────────────
chatRouter.get("/conversations/:id/messages", async (req: Request, res: Response) => {
  try {
    const r = await sbGet(
      `/messages?conversation_id=eq.${req.params.id}&order=created_at.asc&select=id,role,content,metadata,created_at`
    );
    if (!r.ok) return res.status(500).json({ error: "获取消息失败" });
    res.json(r.data || []);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/chat/send （流式 SSE）──────────────────────────────────────────
chatRouter.post("/send", async (req: Request, res: Response) => {
  const { conversationId, message, model = DEFAULT_MODEL, useSearch = false, agent: agentId } = req.body;

  if (!conversationId || !message) {
    return res.status(400).json({ error: "conversationId 和 message 必填" });
  }

  // 获取 Agent 系统提示词（如果选择了 Agent）
  let agentSystemPrompt = "";
  if (agentId) {
    agentSystemPrompt = getAgentSystemPrompt(agentId);
  }

  // 设置 SSE headers
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // 1. 获取历史消息（最近 20 条）
    const historyR = await sbGet(
      `/messages?conversation_id=eq.${conversationId}&order=created_at.asc&limit=20&select=role,content`
    );
    const history: { role: string; content: string }[] = Array.isArray(historyR.data) ? historyR.data : [];

    // 2. 联网搜索（按需）
    let searchContext = "";
    if (useSearch || needsSearch(message)) {
      sendEvent("status", { text: "正在联网搜索..." });
      searchContext = await webSearch(message);
    }

    // 3. 保存用户消息
    await sbPost("/messages", {
      conversation_id: conversationId,
      role: "user",
      content: message,
      metadata: {},
    });

    // 4. 构造消息列表
    // 优先使用 Agent 的系统提示词，否则使用默认的 MaoAI 提示词
    let systemPrompt: string;
    if (agentSystemPrompt) {
      systemPrompt = agentSystemPrompt + (searchContext ? `\n\n${searchContext}` : "");
    } else {
      systemPrompt = `你是毛AI（MaoAI），一个以中国战略思维和全球视野为核心的AI助手。你擅长战略分析、商业洞察和前沿信息整合。请用中文回答，保持专业、深刻、有洞见。${searchContext ? `\n\n${searchContext}` : ""}`;
    }

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-18),
      { role: "user", content: message },
    ];

    // 5. 查找模型配置，按 provider 路由
    const modelCfg = MODEL_MAP[model] || MODEL_MAP[DEFAULT_MODEL];
    const { base, key } = getProviderConfig(modelCfg.provider);

    if (!key) {
      sendEvent("error", { text: `${modelCfg.provider.toUpperCase()} API Key 未配置` });
      return res.end();
    }

    // 告诉前端用的哪个模型
    sendEvent("model", { provider: modelCfg.provider, label: modelCfg.label });

    const llmRes = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: modelCfg.apiModel,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: modelCfg.maxTokens,
      }),
    });

    if (!llmRes.ok || !llmRes.body) {
      const errText = await llmRes.text();
      sendEvent("error", { text: `模型调用失败 [${modelCfg.provider}]: ${errText}` });
      return res.end();
    }

    // 6. 流式转发 + 收集完整回复
    let fullContent = "";
    const reader = llmRes.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (payload === "[DONE]") continue;

        try {
          const json = JSON.parse(payload);
          const delta = json.choices?.[0]?.delta?.content || "";
          if (delta) {
            fullContent += delta;
            sendEvent("delta", { text: delta });
          }
        } catch {
          // skip malformed
        }
      }
    }

    // 7. 保存 AI 回复
    if (fullContent) {
      await sbPost("/messages", {
        conversation_id: conversationId,
        role: "assistant",
        content: fullContent,
        metadata: searchContext ? { searched: true } : {},
      });
    }

    // 8. 自动生成对话标题（首次回复）
    if (history.length === 0 && fullContent) {
      const titleText = message.slice(0, 30).trim();
      await sbPatch(
        `/conversations?id=eq.${conversationId}`,
        { title: titleText || "新对话" }
      );
      sendEvent("title", { text: titleText || "新对话" });
    }

    sendEvent("done", { text: "" });
    res.end();
  } catch (e: any) {
    sendEvent("error", { text: e.message });
    res.end();
  }
});

// ── POST /api/chat/image-gen ──────────────────────────────────────────────────
chatRouter.post("/image-gen", async (req: Request, res: Response) => {
  const { prompt, conversationId } = req.body;
  if (!prompt) return res.status(400).json({ error: "prompt 必填" });

  const apiKey = process.env.ZHIPU_API_KEY || "";
  if (!apiKey) return res.status(500).json({ error: "ZHIPU_API_KEY 未配置" });

  try {
    const r = await fetch(`${ZHIPU_BASE}/images/generations`, {
      method: "POST",
      headers: zhipuHeaders(),
      body: JSON.stringify({
        model: "cogview-3-flash",
        prompt,
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(500).json({ error: `图片生成失败: ${err}` });
    }

    const json: any = await r.json();
    const imageUrl = json.data?.[0]?.url || "";

    // 保存图片消息到对话
    if (conversationId && imageUrl) {
      await sbPost("/messages", {
        conversation_id: conversationId,
        role: "assistant",
        content: `![生成图片](${imageUrl})`,
        metadata: { type: "image", imageUrl, prompt },
      });
    }

    res.json({ url: imageUrl });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/chat/agents ─────────────────────────────────────────────────────────
// 获取所有可用 Agent 列表（按分类）
chatRouter.get("/agents", (_req, res) => {
  const result = Object.entries(AGENTS_BY_CATEGORY).map(([category, agents]) => ({
    category,
    info: CATEGORY_INFO[category],
    agents: agents.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      emoji: a.emoji,
      exampleQuestions: a.exampleQuestions,
    })),
  }));
  res.json(result);
});

// ── GET /api/chat/agents/:id ───────────────────────────────────────────────────────
// 获取指定 Agent 详情
chatRouter.get("/agents/:id", (req, res) => {
  const agent = getAgent(req.params.id);
  if (!agent) {
    return res.status(404).json({ error: "Agent 不存在" });
  }
  res.json(agent);
});


// ─── RAG 状态与健康检查 ──────────────────────────────────────────────────────

/**
 * GET /api/chat/rag/status
 * 获取本地 RAG (Ollama) 状态
 */
chatRouter.get("/rag/status", async (req: Request, res: Response) => {
  try {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${ollamaUrl}/api/tags`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data: any = await response.json();
      const models = data.models || [];
      const hasNomic = models.some((m: any) => m.name.includes("nomic-embed-text"));
      
      res.json({
        status: "online",
        ollama: "connected",
        embedding_model: hasNomic ? "nomic-embed-text" : "missing",
        available_models: models.map((m: any) => m.name),
        vector_db: "local_json",
        index_size: 0,
        last_sync: new Date().toISOString()
      });
    } else {
      throw new Error("Ollama returned non-ok status");
    }
  } catch (error) {
    res.json({
      status: "offline",
      ollama: "disconnected",
      reason: error instanceof Error ? error.message : "Unknown error",
      suggestion: "请确保本地 Ollama 已启动并安装了 nomic-embed-text 模型"
    });
  }
});

/**
 * GET /api/chat/rag/health
 * RAG 系统健康检查
 */
chatRouter.get("/rag/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    components: {
      ollama: "unknown",
      vector_store: "ready",
      document_processor: "ready"
    },
    timestamp: new Date().toISOString()
  });
});
