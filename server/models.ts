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
  provider: "zhipu" | "deepseek" | "groq" | "gemini" | "zai" | "autoclaw" | "ollama";
  model: string;
  baseUrl: string;
  /** apiKey 为 getter，运行时动态读取环境变量，避免模块加载顺序问题 */
  readonly apiKey: string;
  maxTokens: number;
  supportsVision?: boolean;
  /** 是否本地模型 */
  isLocal?: boolean;
}

// ─── Provider Base URLs ───────────────────────────────────────────────────────

const ZHIPU_BASE    = "https://open.bigmodel.cn/api/paas/v4";
const DEEPSEEK_BASE = "https://api.deepseek.com/v1";
const GROQ_BASE     = "https://api.groq.com/openai/v1";
const GEMINI_BASE   = "https://generativelanguage.googleapis.com/v1beta/openai";
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

  // ── 本地 Ollama 模型 ─────────────────────────────────────────────────────────
  // Ollama 本地运行，无需 API Key，baseUrl 固定为 localhost:11434
  "ollama-local": {
    name: "Ollama (Local)",
    badge: "LOCAL",
    provider: "ollama",
    model: process.env.OLLAMA_MODEL || "llama3",
    baseUrl: "http://localhost:11434/v1",
    get apiKey() { return "ollama"; }, // 占位符，Ollama 不需要真实 API Key
    maxTokens: 4096,
    isLocal: true,
  },
};
