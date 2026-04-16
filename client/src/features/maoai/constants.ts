/**
 * MaoAI Feature Constants
 * ─────────────────────────────────────────────────────────────────────────────
 * 所有 MaoAI 相关的路由、模型、价格配置统一在此定义。
 * 需要修改路由或配置时，只需改这一个文件。
 */

// ─── Routes ──────────────────────────────────────────────────────────────────

export const MAOAI_ROUTES = {
  /** 主聊天页（需登录） */
  CHAT: "/maoai",
  /** DeerFlow 深度研究入口 */
  RESEARCH: "/maoai/research",
  /** 研究简报（HBR + 学术期刊） */
  RESEARCH_DIGEST: "/maoai/digest",
  /** 独立登录页 */
  LOGIN: "/maoai/login",
  /** 定价页 */
  PRICING: "/maoai/pricing",
  /** 销售 CRM 功能页 */
  SALES: "/maoai/sales",
  /** 客服功能页 */
  CUSTOMER_SERVICE: "/maoai/customer-service",
} as const;

export type MaoAIRoute = (typeof MAOAI_ROUTES)[keyof typeof MAOAI_ROUTES];

// ─── Backend ──────────────────────────────────────────────────────────────────

export const MAOAI_BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "https://api.mcmamoo.com";

// ─── Models ───────────────────────────────────────────────────────────────────

/** 本地 Ollama 默认配置 */
export const MAOAI_LOCAL_OLLAMA = {
  id: "ollama-local",
  name: "Ollama (Local)",
  badge: "OFFLINE",
  description: "本地运行，100% 隐私保护",
  baseUrl: "http://localhost:11434/v1",
  defaultModel: "llama3",
  isLocal: true as const,
};

/** 云端模型列表（非本地节点） */
export const MAOAI_CLOUD_MODELS = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    badge: "FAST",
    description: "速度快，适合日常对话",
    supportsVision: true,
    available: true,
    isLocal: false as const,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    badge: "PRO",
    description: "更强推理能力，适合复杂任务",
    supportsVision: true,
    available: true,
    isLocal: false as const,
  },
  {
    id: "claude-opus-4",
    name: "Claude Opus 4",
    badge: "FLAGSHIP",
    description: "顶级写作与分析能力",
    supportsVision: true,
    available: false,
    isLocal: false as const,
  },
  {
    id: "maoai-core-2",
    name: "MaoAI Core 2.0",
    badge: "手脑合一",
    description: "毛泽东战略思想 + 马斯克第一性原理 + 三权分立执行",
    supportsVision: false,
    available: true,
    isLocal: false as const,
    isStrategicMode: true,
  },
] as const;

/** MaoAI Core 2.0 战略模式配置（Phase 6 完整版） */
export const MAOAI_CORE_2_CONFIG = {
  // ── WebSocket（TriadLoop 实时推送）────────────────────────────────────────
  /** WS 端点：ws_server.py /ws/triad-loop */
  websocketUrl:
    (import.meta.env.VITE_WS_SERVER_URL as string | undefined) ||
    `ws://${window.location.hostname}:5000/ws/triad-loop`,

  // ── REST（RAG 状态 + 健康检查）────────────────────────────────────────────
  /** RAG 索引状态接口 */
  ragStatusUrl:
    (import.meta.env.VITE_WS_SERVER_HTTP as string | undefined) ||
    `http://${window.location.hostname}:5000/api/chat/rag/status`,
  /** Ollama 连接健康检查 */
  ragHealthUrl:
    (import.meta.env.VITE_WS_SERVER_HTTP as string | undefined) ||
    `http://${window.location.hostname}:5000/api/chat/rag/health`,
  /** WS 服务健康检查 */
  serverHealthUrl:
    (import.meta.env.VITE_WS_SERVER_HTTP as string | undefined) ||
    `http://${window.location.hostname}:5000/api/health`,

  // ── 三权分立开关 ─────────────────────────────────────────────────────────
  triadLoopEnabled: true,
  codersEnabled: true,
  reviewerEnabled: true,
  validatorEnabled: true,
  strategistEnabled: true,

  // ── Phase 6：异构模型博弈（Claude 写 + GLM-4 审）─────────────────────────
  /** 默认开启异构博弈模式 */
  heterogeneousDefault: true,
  /** Reviewer 提供商："glm" | "openai" */
  reviewerProvider: "glm" as "glm" | "openai",
  /** GLM-4 默认模型 */
  glmModel: "glm-4-plus",
  /** 是否使用 Claude Code Local（有 Agentic 工具链） */
  claudeLocal: false,
  /** 是否开启红蓝对抗模式 */
  redBlueAdversarial: true,

  // ── 阶段展示配置 ─────────────────────────────────────────────────────────
  phases: {
    strategist: { name: "战略分析", icon: "🎯", color: "text-red-400" },
    coders:     { name: "代码生成", icon: "⚙️", color: "text-blue-400" },
    reviewer:   { name: "GLM-4 审查", icon: "🔍", color: "text-amber-400" },
    validator:  { name: "验证测试", icon: "✅", color: "text-emerald-400" },
    redBlue:    { name: "红蓝对抗", icon: "⚔️", color: "text-rose-400" },
  },

  // ── 重连策略 ─────────────────────────────────────────────────────────────
  reconnect: {
    maxAttempts: 5,
    intervalMs: 2000,
  },
} as const;

// ─── Tool Display ─────────────────────────────────────────────────────────────

/** 工具名 → 中文展示名、emoji、颜色 */
export const MAOAI_TOOL_DISPLAY: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  web_search: { label: "联网搜索", emoji: "🔍", color: "text-blue-400" },
  run_code: { label: "执行代码", emoji: "⚡", color: "text-yellow-400" },
  github_push: { label: "GitHub 推送", emoji: "🚀", color: "text-green-400" },
  github_read: { label: "GitHub 读取", emoji: "📂", color: "text-green-300" },
  read_url: { label: "读取网页", emoji: "🌐", color: "text-cyan-400" },
  run_shell: { label: "执行命令", emoji: "💻", color: "text-orange-400" },
  deep_research: { label: "深度研究", emoji: "🔬", color: "text-purple-400" },
  midjourney_imagine: { label: "Midjourney 绘图", emoji: "🎨", color: "text-fuchsia-400" },
  midjourney_status: { label: "Midjourney 状态", emoji: "🖼️", color: "text-fuchsia-300" },
  runway_text_to_video: { label: "Runway 视频生成", emoji: "🎬", color: "text-violet-400" },
  runway_image_to_video: { label: "Runway 图片转视频", emoji: "🎥", color: "text-violet-300" },
  runway_status: { label: "Runway 状态", emoji: "📹", color: "text-violet-200" },
};

// ─── Subscription Tier Labels ─────────────────────────────────────────────────

export const MAOAI_TIER_LABELS: Record<string, string> = {
  free: "免费版",
  starter: "入门版",
  pro: "专业版",
  flagship: "旗舰版",
};

// ─── Input Modes ──────────────────────────────────────────────────────────────

export const MAOAI_INPUT_MODES = ["chat", "image"] as const;
export type MaoAIInputMode = (typeof MAOAI_INPUT_MODES)[number];

// ─── Supported File Types ─────────────────────────────────────────────────────

export const MAOAI_SUPPORTED_FILE_TYPES = [
  "pdf",
  "docx",
  "text",
  "csv",
  "json",
  "markdown",
] as const;
export type MaoAISupportedFileType =
  (typeof MAOAI_SUPPORTED_FILE_TYPES)[number];
