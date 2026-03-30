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
  /** 独立登录页 */
  LOGIN: "/maoai/login",
  /** 定价页 */
  PRICING: "/maoai/pricing",
  /** 销售 CRM 功能页 */
  SALES: "/maoai/sales",
} as const;

export type MaoAIRoute = (typeof MAOAI_ROUTES)[keyof typeof MAOAI_ROUTES];

// ─── Backend ──────────────────────────────────────────────────────────────────

export const MAOAI_BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "https://api.mcmamoo.com";

// ─── Models ───────────────────────────────────────────────────────────────────

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
] as const;

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
