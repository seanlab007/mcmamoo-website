/**
 * MaoAI Cloud Model Configurations
 *
 * 所有云端模型的 provider、API key、endpoint 统一在此定义。
 * aiStream.ts 通过此文件获取模型路由配置。
 * 注意：apiKey 使用 getter 动态读取，确保每次调用时从最新的环境变量获取。
 */

export interface ModelConfig {
  name: string;
  badge: string;
  provider: "zhipu" | "deepseek" | "groq" | "gemini" | "google-ai-studio" | "zai" | "autoclaw" | "anthropic" | "ollama";
  model: string;
  baseUrl: string;
  /** apiKey 为 getter，运行时动态读取环境变量，避免模块加载顺序问题 */
  readonly apiKey: string;
  maxTokens: number;
  supportsVision?: boolean;
  supportsAudio?: boolean;
  supportsVideo?: boolean;
  /** 是否支持 extended thinking / reasoning 模式 */
  supportsReasoning?: boolean;
  /** 是否为嵌入模型 */
  isEmbedding?: boolean;
}

// ─── Ollama 本地模型动态发现 ──────────────────────────────────────────────────

interface OllamaModel {
  name: string;
  model: string;
  size: number;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

/** 缓存 Ollama 模型列表，避免频繁请求（5秒 TTL） */
let ollamaCache: { models: OllamaModel[]; ts: number } | null = null;
const OLLAMA_CACHE_TTL = 5000;

/**
 * 从本地 Ollama 实例动态获取已安装的模型列表
 * 支持自动发现新安装/删除的模型
 */
export async function discoverOllamaModels(): Promise<OllamaModel[]> {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

  // 检查缓存
  if (ollamaCache && Date.now() - ollamaCache.ts < OLLAMA_CACHE_TTL) {
    return ollamaCache.models;
  }

  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000), // 3秒超时
    });
    if (!res.ok) throw new Error(`Ollama responded ${res.status}`);
    const data = await res.json() as { models: OllamaModel[] };
    const models = data.models || [];

    // 更新缓存
    ollamaCache = { models, ts: Date.now() };
    return models;
  } catch {
    // Ollama 不可用，返回空列表
    return [];
  }
}

/**
 * 将 Ollama 动态发现的模型转换为 ModelConfig 格式
 * 与 MODEL_CONFIGS 中已有的配置合并，动态发现的模型会覆盖静态配置
 */
export function ollamaModelToConfig(ollama: OllamaModel): ModelConfig {
  const modelName = ollama.name;
  const family = ollama.details.family;
  const paramSize = ollama.details.parameter_size;
  const quant = ollama.details.quantization_level;
  const isEmbedding = family === "bert" || family === "nomic-bert";
  const supportsVision = ollama.details.families?.some(f =>
    ["gemma3", "llava", "llama3.2-vision", "minicpm-v", "qwen2.5-vl"].includes(f)
  ) ?? false;

  // 智能生成模型显示名
  let displayName: string;
  if (isEmbedding) {
    displayName = `${modelName.split(":")[0]} (Embed)`;
  } else {
    const shortName = modelName.split(":")[0];
    displayName = `${shortName} ${paramSize}`;
  }

  const badge = isEmbedding ? "EMBED"
    : supportsVision ? "LOCAL👁"
    : "LOCAL";

  return {
    name: displayName,
    badge,
    provider: "ollama",
    model: modelName,
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    get apiKey() { return ""; },
    maxTokens: isEmbedding ? 512 : 32768,
    supportsVision,
    isEmbedding,
  };
}

// ─── Provider Base URLs ───────────────────────────────────────────────────────

const ZHIPU_BASE    = "https://open.bigmodel.cn/api/paas/v4";
const DEEPSEEK_BASE = "https://api.deepseek.com/v1";
const GROQ_BASE     = "https://api.groq.com/openai/v1";
const GEMINI_BASE   = "https://generativelanguage.googleapis.com/v1beta/openai";
const GOOGLE_AI_STUDIO_BASE = "https://generativelanguage.googleapis.com/v1beta";
const ZAI_BASE      = "https://api.z.ai/api/paas/v4";
const ANTHROPIC_BASE = "https://api.anthropic.com/v1";

// ─── Model Config Map ─────────────────────────────────────────────────────────

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // ── DeepSeek ───────────────────────────────────────────────────────────────
  "deepseek-chat": {
    name: "DeepSeek Chat",
    badge: "FAST",
    provider: "deepseek",
    model: "deepseek-chat",
    baseUrl: DEEPSEEK_BASE,
    get apiKey() { return process.env.DEEPSEEK_API_KEY || ""; },
    maxTokens: 4096,
  },
  "deepseek-reasoner": {
    name: "DeepSeek Reasoner",
    badge: "THINK",
    provider: "deepseek",
    model: "deepseek-reasoner",
    baseUrl: DEEPSEEK_BASE,
    get apiKey() { return process.env.DEEPSEEK_API_KEY || ""; },
    maxTokens: 8192,
  },

  // ── 智谱 GLM ───────────────────────────────────────────────────────────────
  "glm-4-flash": {
    name: "GLM-4 Flash",
    badge: "FREE",
    provider: "zhipu",
    model: "glm-4-flash",
    baseUrl: ZHIPU_BASE,
    get apiKey() { return process.env.ZHIPU_API_KEY || ""; },
    maxTokens: 4096,
  },
  "glm-4-plus": {
    name: "GLM-4 Plus",
    badge: "PRO",
    provider: "zhipu",
    model: "glm-4-plus",
    baseUrl: ZHIPU_BASE,
    get apiKey() { return process.env.ZHIPU_API_KEY || ""; },
    maxTokens: 4096,
  },
  "glm-4-air": {
    name: "GLM-4 Air",
    badge: "LITE",
    provider: "zhipu",
    model: "glm-4-air",
    baseUrl: ZHIPU_BASE,
    get apiKey() { return process.env.ZHIPU_API_KEY || ""; },
    maxTokens: 4096,
  },
  "glm-z1-flash": {
    name: "GLM-Z1 Flash",
    badge: "THINK",
    provider: "zhipu",
    model: "glm-z1-flash",
    baseUrl: ZHIPU_BASE,
    get apiKey() { return process.env.ZHIPU_API_KEY || ""; },
    maxTokens: 4096,
  },
  "glm-4v-flash": {
    name: "GLM-4V Flash",
    badge: "VISION",
    provider: "zhipu",
    model: "glm-4v-flash",
    baseUrl: ZHIPU_BASE,
    get apiKey() { return process.env.ZHIPU_API_KEY || ""; },
    maxTokens: 4096,
    supportsVision: true,
  },

  // ── Groq（极速）────────────────────────────────────────────────────────────
  "llama-3.3-70b": {
    name: "Llama 3.3 70B",
    badge: "FAST",
    provider: "groq",
    model: "llama-3.3-70b-versatile",
    baseUrl: GROQ_BASE,
    get apiKey() { return process.env.GROQ_API_KEY || ""; },
    maxTokens: 4096,
  },
  "llama-3.1-8b": {
    name: "Llama 3.1 8B",
    badge: "LITE",
    provider: "groq",
    model: "llama-3.1-8b-instant",
    baseUrl: GROQ_BASE,
    get apiKey() { return process.env.GROQ_API_KEY || ""; },
    maxTokens: 4096,
  },
  "gemma2-9b": {
    name: "Gemma2 9B",
    badge: "LITE",
    provider: "groq",
    model: "gemma2-9b-it",
    baseUrl: GROQ_BASE,
    get apiKey() { return process.env.GROQ_API_KEY || ""; },
    maxTokens: 4096,
  },

  // ── Gemini ─────────────────────────────────────────────────────────────────
  "gemini-2.5-flash": {
    name: "Gemini 2.5 Flash",
    badge: "FAST",
    provider: "gemini",
    model: "gemini-2.5-flash-preview-04-17",
    baseUrl: GEMINI_BASE,
    get apiKey() { return process.env.GEMINI_API_KEY || ""; },
    maxTokens: 8192,
    supportsVision: true,
  },
  "gemini-2.5-pro": {
    name: "Gemini 2.5 Pro",
    badge: "PRO",
    provider: "gemini",
    model: "gemini-2.5-pro-preview-03-25",
    baseUrl: GEMINI_BASE,
    get apiKey() { return process.env.GEMINI_API_KEY || ""; },
    maxTokens: 8192,
    supportsVision: true,
  },

  // ── 智谱 GLM-5V-TurboAutoClaw（BigModel 多模态）─────────────────────────────────
  "glm-5v-turbo": {
    name: "GLM-5V-Turbo",
    badge: "VL-TURBO",
    provider: "zhipu",
    model: "glm-5v-turbo",
    baseUrl: ZHIPU_BASE,
    get apiKey() { return process.env.ZHIPU_API_KEY || ""; },
    maxTokens: 8192,
    supportsVision: true,
  },

  // ── Google AI Studio (Gemma 3n / Gemma 4) ─────────────────────────────────────
  // ⚠️ 模型 ID 已根据 API 实际情况修正（2026-04-19 验证）
  // API Key 使用同一个 GOOGLE_AI_STUDIO_API_KEY
  "gemma-3n-e2b-it": {
    name: "Gemma 3n E2B",
    badge: "MOBILE",
    provider: "google-ai-studio",
    model: "gemma-3n-e2b-it",
    baseUrl: GOOGLE_AI_STUDIO_BASE,
    get apiKey() { return process.env.GOOGLE_AI_STUDIO_API_KEY || ""; },
    maxTokens: 128000,
    supportsVision: true,
    supportsAudio: true,
    supportsVideo: true,
  },
  "gemma-3n-e4b-it": {
    name: "Gemma 3n E4B",
    badge: "EDGE",
    provider: "google-ai-studio",
    model: "gemma-3n-e4b-it",
    baseUrl: GOOGLE_AI_STUDIO_BASE,
    get apiKey() { return process.env.GOOGLE_AI_STUDIO_API_KEY || ""; },
    maxTokens: 128000,
    supportsVision: true,
    supportsAudio: true,
    supportsVideo: true,
  },
  // Gemma 4 26B A4B (MoE 架构，激活参数仅 3.8B)
  "gemma-4-26b-a4b-it": {
    name: "Gemma 4 26B A4B",
    badge: "PRO",
    provider: "google-ai-studio",
    model: "gemma-4-26b-a4b-it",
    baseUrl: GOOGLE_AI_STUDIO_BASE,
    get apiKey() { return process.env.GOOGLE_AI_STUDIO_API_KEY || ""; },
    maxTokens: 262144,
    supportsVision: true,
    supportsAudio: true,
    supportsVideo: true,
  },
  // Gemma 4 31B (Dense 架构，Arena AI 开源第三)
  "gemma-4-31b-it": {
    name: "Gemma 4 31B",
    badge: "MAX",
    provider: "google-ai-studio",
    model: "gemma-4-31b-it",
    baseUrl: GOOGLE_AI_STUDIO_BASE,
    get apiKey() { return process.env.GOOGLE_AI_STUDIO_API_KEY || ""; },
    maxTokens: 262144,
    supportsVision: true,
    supportsAudio: true,
    supportsVideo: true,
  },

  // ── Z.ai 平台（GLM-5 / GLM-4.7）────────────────────────────────────────────
  "zai-glm-5": {
    name: "Z.ai GLM-5",
    badge: "GLM5",
    provider: "zai",
    model: "glm-5",
    baseUrl: ZAI_BASE,
    get apiKey() { return process.env.ZAI_API_KEY || ""; },
    maxTokens: 8192,
  },
  "zai-glm-4-7": {
    name: "Z.ai GLM-4.7",
    badge: "GLM47",
    provider: "zai",
    model: "glm-4.7",
    baseUrl: ZAI_BASE,
    get apiKey() { return process.env.ZAI_API_KEY || ""; },
    maxTokens: 8192,
  },

  // ── AutoClaw（澳龙）本地节点配置说明 ─────────────────────────────────────────
  // AutoClaw 是智谱推出的本地版 OpenClaw（澳龙），需在本地安装运行
  // 它没有独立的云端 API，而是作为本地节点接入 MaoAI
  // 配置步骤：
  //   1. 下载安装：https://autoglm.zhipuai.cn/autoclaw/
  //   2. 在 AutoClaw 设置中，将 Base URL 指向 MaoAI 节点注册地址
  //   3. 通过 /api/ai/node/register 接口注册本地节点
  //   4. 注册成功后，AutoClaw 将作为 local:<nodeId> 模型出现在模型列表中
  // 注意：AutoClaw 本身不支持 function calling，其 Agent 能力通过 Skills 系统实现

  // ── MiniMind（超小型本地 LLM）──────────────────────────────────────────
  // MiniMind 是从零训练的超小型 LLM 框架（26M-502M 参数）
  // 通过 Ollama 部署后自动发现为本地节点
  // 特点：$3 训练成本、2小时训练、支持视觉（MiniMind-V）
  // 部署步骤：
  //   1. 安装 Ollama：https://ollama.ai
  //   2. 拉取模型：ollama pull minimind（或自定义 GGUF）
  //   3. MaoAI 自动发现 Ollama 模型并注册为本地节点
  //   4. 配合 Token Optimization 可实现极低成本的本地推理
  // 注意：MiniMind 参数量小，适合简单问答/摘要，复杂推理建议使用云端模型
  // 仓库：https://github.com/seanlab007/minimind

  // ── Anthropic Claude ─────────────────────────────────────────────────────────
  "claude-opus-4-5": {
    name: "Claude Opus 4.5",
    badge: "MAX",
    provider: "anthropic",
    model: "claude-opus-4-5-20251101",
    baseUrl: ANTHROPIC_BASE,
    get apiKey() { return process.env.ANTHROPIC_API_KEY || ""; },
    maxTokens: 8192,
    supportsVision: true,
    supportsReasoning: true,
  },
  "claude-sonnet-4-5": {
    name: "Claude Sonnet 4.5",
    badge: "PRO",
    provider: "anthropic",
    model: "claude-sonnet-4-5-20251101",
    baseUrl: ANTHROPIC_BASE,
    get apiKey() { return process.env.ANTHROPIC_API_KEY || ""; },
    maxTokens: 8192,
    supportsVision: true,
    supportsReasoning: true,
  },
  "claude-haiku-4": {
    name: "Claude Haiku 4",
    badge: "FAST",
    provider: "anthropic",
    model: "claude-haiku-4-20251101",
    baseUrl: ANTHROPIC_BASE,
    get apiKey() { return process.env.ANTHROPIC_API_KEY || ""; },
    maxTokens: 4096,
    supportsVision: true,
  },

  // ── Ollama 本地模型 ─────────────────────────────────────────────────────────
  // 通过 OLLAMA_BASE_URL 自动发现本地模型
  // 这些配置用于 MaoAI 识别和路由到本地 Ollama 实例
  "ollama-gemma3-4b": {
    name: "Gemma 3 4B (Local)",
    badge: "LOCAL",
    provider: "ollama",
    model: "gemma3:4b",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    get apiKey() { return ""; },  // Ollama 不需要 API Key
    maxTokens: 8192,
    supportsVision: true,
  },
  "ollama-qwen2.5-7b": {
    name: "Qwen 2.5 7B (Local)",
    badge: "LOCAL",
    provider: "ollama",
    model: "qwen2.5:7b",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    get apiKey() { return ""; },
    maxTokens: 32768,
  },
  "ollama-qwen2.5-3b": {
    name: "Qwen 2.5 3B (Local)",
    badge: "LOCAL",
    provider: "ollama",
    model: "qwen2.5:3b",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    get apiKey() { return ""; },
    maxTokens: 32768,
  },

  // ── Ollama 嵌入模型 ─────────────────────────────────────────────────────────
  // 用于 RAG、语义搜索、文本相似度计算
  "ollama-nomic-embed": {
    name: "Nomic Embed (Local)",
    badge: "EMBED",
    provider: "ollama",
    model: "nomic-embed-text:latest",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    get apiKey() { return ""; },
    maxTokens: 512,
    isEmbedding: true,
  },
  "ollama-all-minilm": {
    name: "All-MiniLM (Local)",
    badge: "EMBED",
    provider: "ollama",
    model: "all-minilm:latest",
    baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    get apiKey() { return ""; },
    maxTokens: 512,
    isEmbedding: true,
  },
};
