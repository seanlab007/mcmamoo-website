/**
 * MaoAI Cloud Model Configurations
 *
 * 所有云端模型的 provider、API key、endpoint 统一在此定义。
 * aiStream.ts 通过此文件获取模型路由配置。
 */

export interface ModelConfig {
  name: string;
  badge: string;
  provider: "zhipu" | "deepseek" | "groq" | "gemini";
  model: string;
  baseUrl: string;
  apiKey: string;
  maxTokens: number;
  supportsVision?: boolean;
}

// ─── Provider Base URLs ───────────────────────────────────────────────────────

const ZHIPU_BASE    = "https://open.bigmodel.cn/api/paas/v4";
const DEEPSEEK_BASE = "https://api.deepseek.com/v1";
const GROQ_BASE     = "https://api.groq.com/openai/v1";
const GEMINI_BASE   = "https://generativelanguage.googleapis.com/v1beta/openai";

// ─── Model Config Map ─────────────────────────────────────────────────────────

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // ── DeepSeek ───────────────────────────────────────────────────────────────
  "deepseek-chat": {
    name: "DeepSeek Chat",
    badge: "FAST",
    provider: "deepseek",
    model: "deepseek-chat",
    baseUrl: DEEPSEEK_BASE,
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    maxTokens: 4096,
  },
  "deepseek-reasoner": {
    name: "DeepSeek Reasoner",
    badge: "THINK",
    provider: "deepseek",
    model: "deepseek-reasoner",
    baseUrl: DEEPSEEK_BASE,
    apiKey: process.env.DEEPSEEK_API_KEY || "",
    maxTokens: 8192,
  },

  // ── 智谱 GLM ───────────────────────────────────────────────────────────────
  "glm-4-flash": {
    name: "GLM-4 Flash",
    badge: "FREE",
    provider: "zhipu",
    model: "glm-4-flash",
    baseUrl: ZHIPU_BASE,
    apiKey: process.env.ZHIPU_API_KEY || "",
    maxTokens: 4096,
  },
  "glm-4-plus": {
    name: "GLM-4 Plus",
    badge: "PRO",
    provider: "zhipu",
    model: "glm-4-plus",
    baseUrl: ZHIPU_BASE,
    apiKey: process.env.ZHIPU_API_KEY || "",
    maxTokens: 4096,
  },
  "glm-4-air": {
    name: "GLM-4 Air",
    badge: "LITE",
    provider: "zhipu",
    model: "glm-4-air",
    baseUrl: ZHIPU_BASE,
    apiKey: process.env.ZHIPU_API_KEY || "",
    maxTokens: 4096,
  },
  "glm-z1-flash": {
    name: "GLM-Z1 Flash",
    badge: "THINK",
    provider: "zhipu",
    model: "glm-z1-flash",
    baseUrl: ZHIPU_BASE,
    apiKey: process.env.ZHIPU_API_KEY || "",
    maxTokens: 4096,
  },
  "glm-4v-flash": {
    name: "GLM-4V Flash",
    badge: "VISION",
    provider: "zhipu",
    model: "glm-4v-flash",
    baseUrl: ZHIPU_BASE,
    apiKey: process.env.ZHIPU_API_KEY || "",
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
    apiKey: process.env.GROQ_API_KEY || "",
    maxTokens: 4096,
  },
  "llama-3.1-8b": {
    name: "Llama 3.1 8B",
    badge: "LITE",
    provider: "groq",
    model: "llama-3.1-8b-instant",
    baseUrl: GROQ_BASE,
    apiKey: process.env.GROQ_API_KEY || "",
    maxTokens: 4096,
  },
  "gemma2-9b": {
    name: "Gemma2 9B",
    badge: "LITE",
    provider: "groq",
    model: "gemma2-9b-it",
    baseUrl: GROQ_BASE,
    apiKey: process.env.GROQ_API_KEY || "",
    maxTokens: 4096,
  },

  // ── Gemini ─────────────────────────────────────────────────────────────────
  "gemini-2.5-flash": {
    name: "Gemini 2.5 Flash",
    badge: "FAST",
    provider: "gemini",
    model: "gemini-2.5-flash-preview-04-17",
    baseUrl: GEMINI_BASE,
    apiKey: process.env.GEMINI_API_KEY || "",
    maxTokens: 8192,
    supportsVision: true,
  },
  "gemini-2.5-pro": {
    name: "Gemini 2.5 Pro",
    badge: "PRO",
    provider: "gemini",
    model: "gemini-2.5-pro-preview-03-25",
    baseUrl: GEMINI_BASE,
    apiKey: process.env.GEMINI_API_KEY || "",
    maxTokens: 8192,
    supportsVision: true,
  },
};
