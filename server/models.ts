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
  provider: "zhipu" | "deepseek" | "groq" | "gemini" | "google-ai-studio" | "zai" | "autoclaw";
  model: string;
  baseUrl: string;
  /** apiKey 为 getter，运行时动态读取环境变量，避免模块加载顺序问题 */
  readonly apiKey: string;
  maxTokens: number;
  supportsVision?: boolean;
  supportsAudio?: boolean;
  supportsVideo?: boolean;
}

// ─── Provider Base URLs ───────────────────────────────────────────────────────

const ZHIPU_BASE    = "https://open.bigmodel.cn/api/paas/v4";
const DEEPSEEK_BASE = "https://api.deepseek.com/v1";
const GROQ_BASE     = "https://api.groq.com/openai/v1";
const GEMINI_BASE   = "https://generativelanguage.googleapis.com/v1beta/openai";
const GOOGLE_AI_STUDIO_BASE = "https://generativelanguage.googleapis.com/v1beta";
const ZAI_BASE      = "https://api.z.ai/api/paas/v4";

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
};
