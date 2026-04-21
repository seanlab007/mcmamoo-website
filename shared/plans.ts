/**
 * MaoAI Plan Definitions v4 — 1000 倍加价率定价体系
 *
 * 设计原则：
 *   成本 ¥1 → 收费 ¥1,000（1000 倍加价率）
 *
 * API 成本基准（每百万 tokens）：
 *   · GLM-4 Flash:    输入 ¥0.4 / 输出 ¥1.6
 *   · DeepSeek Chat:  输入 ¥1.8 / 输出 ¥7.2
 *   · DeepSeek R1:    输入 ¥4 / 输出 ¥16
 *   · Groq Llama:     输入 ¥1.2 / 输出 ¥1.2
 *
 * 平均：约 ¥3/百万 tokens（输入+输出 混合）
 */

export type PlanTier = "free" | "starter" | "pro" | "flagship";
export type Currency = "CNY" | "USD";
export type BillingCycle = "monthly" | "biannual" | "annual";

// ─── 档位限制 ───────────────────────────────────────────────────

export interface PlanLimits {
  dailyChatMessages: number;
  monthlyTokens: number;
  dailyImageGenerations: number;
  monthlyContentQuota: number;
  maxConversations: number;
  premiumModels: boolean;
  imageGeneration: boolean;
  priorityQueue: boolean;
  fileUpload: boolean;
  brandStrategy: boolean;
  accountManager: boolean;
  customPersona: boolean;
  apiAccess: boolean;
  teamSeats: number;
  contentPlatform: boolean;
  contentSchedule: boolean;
  contentPlatforms: string[];
  monthlyVideoSeconds: number;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    dailyChatMessages: 20,
    monthlyTokens: 10000,
    dailyImageGenerations: 0,
    monthlyContentQuota: 0,
    maxConversations: 10,
    premiumModels: false,
    imageGeneration: false,
    priorityQueue: false,
    fileUpload: false,
    brandStrategy: false,
    accountManager: false,
    customPersona: false,
    apiAccess: false,
    teamSeats: 1,
    contentPlatform: false,
    contentSchedule: false,
    contentPlatforms: [],
    monthlyVideoSeconds: 0,
  },

  starter: {
    dailyChatMessages: 100,
    monthlyTokens: 50000,           // 5万 tokens ≈ ¥0.15 成本
    dailyImageGenerations: 5,
    monthlyContentQuota: 0,
    maxConversations: 50,
    premiumModels: false,
    imageGeneration: true,
    priorityQueue: false,
    fileUpload: false,
    brandStrategy: false,
    accountManager: false,
    customPersona: false,
    apiAccess: false,
    teamSeats: 1,
    contentPlatform: false,
    contentSchedule: false,
    contentPlatforms: [],
    monthlyVideoSeconds: 0,
  },

  pro: {
    dailyChatMessages: 500,
    monthlyTokens: 500000,           // 50万 tokens ≈ ¥1.5 成本
    dailyImageGenerations: 50,
    monthlyContentQuota: 30,
    maxConversations: -1,
    premiumModels: true,
    imageGeneration: true,
    priorityQueue: true,
    fileUpload: true,
    brandStrategy: false,
    accountManager: false,
    customPersona: true,
    apiAccess: true,
    teamSeats: 3,
    contentPlatform: true,
    contentSchedule: false,
    contentPlatforms: ["xiaohongshu", "weibo"],
    monthlyVideoSeconds: 30,
  },

  flagship: {
    dailyChatMessages: -1,
    monthlyTokens: 2000000,          // 200万 tokens ≈ ¥6 成本
    dailyImageGenerations: -1,
    monthlyContentQuota: 200,
    maxConversations: -1,
    premiumModels: true,
    imageGeneration: true,
    priorityQueue: true,
    fileUpload: true,
    brandStrategy: true,
    accountManager: true,
    customPersona: true,
    apiAccess: true,
    teamSeats: 10,
    contentPlatform: true,
    contentSchedule: true,
    contentPlatforms: ["xiaohongshu", "douyin", "weibo", "wechat"],
    monthlyVideoSeconds: 180,
  },
};

// ─── 定价（1000 倍加价率：成本 ¥1 → 收费 ¥1,000）────────────────────

export interface CyclePricing {
  total: number;
  perMonth: number;
  months: number;
  savingPct: number;
  costPrice: number;      // API 成本
  markupRatio: number;    // 加价倍数
}

export const PLAN_PRICES: Record<PlanTier, Record<Currency, Record<BillingCycle, CyclePricing>>> = {
  // ── 免费版 ─────────────────────────────────────────────────────
  free: {
    CNY: {
      monthly:  { total: 0,    perMonth: 0,    months: 1,  savingPct: 0,  costPrice: 0.03,  markupRatio: 0   },
      biannual: { total: 0,    perMonth: 0,    months: 6,  savingPct: 0,  costPrice: 0.18,  markupRatio: 0   },
      annual:   { total: 0,    perMonth: 0,    months: 12, savingPct: 0,  costPrice: 0.36,  markupRatio: 0   },
    },
    USD: {
      monthly:  { total: 0,    perMonth: 0,    months: 1,  savingPct: 0,  costPrice: 0.01,  markupRatio: 0   },
      biannual: { total: 0,    perMonth: 0,    months: 6,  savingPct: 0,  costPrice: 0.06,  markupRatio: 0   },
      annual:   { total: 0,    perMonth: 0,    months: 12, savingPct: 0,  costPrice: 0.12,  markupRatio: 0   },
    },
  },

  // ── 入门版 ¥150/月 ──────────────────────────────────────────────
  // 成本：5万 tokens ≈ ¥0.15 → 定价 ¥150 → 加价率 1000x
  starter: {
    CNY: {
      monthly:  { total: 150,   perMonth: 150,  months: 1,  savingPct: 0,   costPrice: 0.15,  markupRatio: 1000 },
      biannual: { total: 900,   perMonth: 150,  months: 6,  savingPct: 0,   costPrice: 0.9,   markupRatio: 1000 },
      annual:   { total: 1500,  perMonth: 125,  months: 12, savingPct: 17,  costPrice: 1.8,   markupRatio: 833  },
    },
    USD: {
      monthly:  { total: 21.99, perMonth: 21.99, months: 1,  savingPct: 0,   costPrice: 0.02,  markupRatio: 1100 },
      biannual: { total: 129.99, perMonth: 21.67, months: 6, savingPct: 3,   costPrice: 0.12,  markupRatio: 1083 },
      annual:   { total: 219.99, perMonth: 18.33, months: 12, savingPct: 17,  costPrice: 0.24,  markupRatio: 917  },
    },
  },

  // ── 专业版 ¥1,500/月 ────────────────────────────────────────────
  // 成本：50万 tokens ≈ ¥1.5 → 定价 ¥1,500 → 加价率 1000x
  pro: {
    CNY: {
      monthly:  { total: 1500,  perMonth: 1500, months: 1,  savingPct: 0,   costPrice: 1.5,    markupRatio: 1000 },
      biannual: { total: 9000,  perMonth: 1500, months: 6,  savingPct: 0,   costPrice: 9,     markupRatio: 1000 },
      annual:   { total: 15000, perMonth: 1250, months: 12, savingPct: 17,  costPrice: 18,    markupRatio: 833  },
    },
    USD: {
      monthly:  { total: 219.99, perMonth: 219.99, months: 1,  savingPct: 0,   costPrice: 0.2,   markupRatio: 1100 },
      biannual: { total: 1299.99, perMonth: 216.67, months: 6, savingPct: 3,   costPrice: 1.2,   markupRatio: 1083 },
      annual:   { total: 2199.99, perMonth: 183.33, months: 12, savingPct: 17,  costPrice: 2.4,   markupRatio: 917  },
    },
  },

  // ── 旗舰版 ¥6,000/月 ────────────────────────────────────────────
  // 成本：200万 tokens ≈ ¥6 → 定价 ¥6,000 → 加价率 1000x
  flagship: {
    CNY: {
      monthly:  { total: 6000,  perMonth: 6000, months: 1,  savingPct: 0,   costPrice: 6,     markupRatio: 1000 },
      biannual: { total: 36000, perMonth: 6000, months: 6,  savingPct: 0,   costPrice: 36,    markupRatio: 1000 },
      annual:   { total: 60000, perMonth: 5000, months: 12, savingPct: 17,  costPrice: 72,    markupRatio: 833  },
    },
    USD: {
      monthly:  { total: 899.99, perMonth: 899.99, months: 1,  savingPct: 0,   costPrice: 0.8,   markupRatio: 1125 },
      biannual: { total: 5399.99, perMonth: 899.99, months: 6, savingPct: 2,   costPrice: 4.8,   markupRatio: 1125 },
      annual:   { total: 8999.99, perMonth: 750,    months: 12, savingPct: 17,  costPrice: 9.6,   markupRatio: 937  },
    },
  },
};

// ─── 显示元数据 ───────────────────────────────────────────────────

export interface PlanMeta {
  name: Record<string, string>;
  tagline: Record<string, string>;
  badge: string;
  highlighted: boolean;
  recommended: boolean;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
}

export const PLAN_META: Record<PlanTier, PlanMeta> = {
  free: {
    name:    { zh: "免费版", en: "Free" },
    tagline: { zh: "体验 AI 对话", en: "Start with AI" },
    badge:   "🌱",
    highlighted: false,
    recommended: false,
    accentColor:  "text-gray-400",
    accentBg:     "bg-gray-400/10",
    accentBorder: "border-gray-400/30",
  },
  starter: {
    name:    { zh: "入门版", en: "Starter" },
    tagline: { zh: "适合个人创作者", en: "For individual creators" },
    badge:   "⚡",
    highlighted: true,
    recommended: false,
    accentColor:  "text-emerald-400",
    accentBg:     "bg-emerald-400/10",
    accentBorder: "border-emerald-400/30",
  },
  pro: {
    name:    { zh: "专业版", en: "Pro" },
    tagline: { zh: "高频使用 · 全模型解锁", en: "High frequency · All models" },
    badge:   "🚀",
    highlighted: true,
    recommended: true,
    accentColor:  "text-[#C9A84C]",
    accentBg:     "bg-[#C9A84C]/10",
    accentBorder: "border-[#C9A84C]/40",
  },
  flagship: {
    name:    { zh: "旗舰版", en: "Flagship" },
    tagline: { zh: "无限使用 · 品牌战略 · 专属顾问", en: "Unlimited · Brand strategy · VIP" },
    badge:   "👑",
    highlighted: true,
    recommended: false,
    accentColor:  "text-purple-400",
    accentBg:     "bg-purple-500/10",
    accentBorder: "border-purple-500/40",
  },
};

// ─── 功能对比表 ───────────────────────────────────────────────────

export interface FeatureRow {
  key: string;
  category?: string;
  label: Record<string, string>;
  free: string | boolean;
  starter: string | boolean;
  pro: string | boolean;
  flagship: string | boolean;
}

export const FEATURE_ROWS: FeatureRow[] = [
  // AI 对话
  {
    key: "daily_messages", category: "AI 对话",
    label: { zh: "每日对话次数", en: "Daily messages" },
    free: "20 次/天", starter: "100 次/天", pro: "500 次/天", flagship: "无限制",
  },
  {
    key: "monthly_tokens", category: "AI 对话",
    label: { zh: "每月可用 tokens", en: "Monthly tokens" },
    free: "1 万", starter: "5 万", pro: "50 万", flagship: "200 万",
  },
  {
    key: "basic_models", category: "AI 对话",
    label: { zh: "基础模型", en: "Basic models" },
    free: true, starter: true, pro: true, flagship: true,
  },
  {
    key: "premium_models", category: "AI 对话",
    label: { zh: "高级模型（R1、Claude）", en: "Premium models (R1, Claude)" },
    free: false, starter: false, pro: true, flagship: true,
  },
  {
    key: "priority", category: "AI 对话",
    label: { zh: "优先响应队列", en: "Priority queue" },
    free: false, starter: false, pro: true, flagship: true,
  },

  // 图片 & 视频生成
  {
    key: "image_gen", category: "图片生成",
    label: { zh: "AI 图片生成", en: "AI image generation" },
    free: false, starter: "5 次/天", pro: "50 次/天", flagship: "无限制",
  },
  {
    key: "video_gen", category: "视频生成",
    label: { zh: "AI 视频生成", en: "AI video generation" },
    free: false, starter: false, pro: "30 秒/月", flagship: "180 秒/月",
  },

  // 内容平台
  {
    key: "content_platform", category: "猫眼内容平台",
    label: { zh: "内容平台访问", en: "Content platform" },
    free: false, starter: false, pro: true, flagship: true,
  },
  {
    key: "content_quota", category: "猫眼内容平台",
    label: { zh: "每月内容生产", en: "Monthly content" },
    free: "—", starter: "—", pro: "30 篇/月", flagship: "200 篇/月",
  },
  {
    key: "content_schedule", category: "猫眼内容平台",
    label: { zh: "定时自动发布", en: "Auto-schedule" },
    free: false, starter: false, pro: false, flagship: true,
  },
  {
    key: "content_platforms", category: "猫眼内容平台",
    label: { zh: "发布平台支持", en: "Platforms" },
    free: "—", starter: "—", pro: "小红书、微博", flagship: "全平台",
  },

  // 存储 & 文件
  {
    key: "conversations", category: "存储与文件",
    label: { zh: "对话历史保存", en: "Conversation history" },
    free: "最近 10 条", starter: "最近 50 条", pro: "无限制", flagship: "无限制",
  },
  {
    key: "file_upload", category: "存储与文件",
    label: { zh: "文件上传分析", en: "File upload & analysis" },
    free: false, starter: false, pro: true, flagship: true,
  },
  {
    key: "custom_persona", category: "存储与文件",
    label: { zh: "自定义 AI 人设", en: "Custom AI persona" },
    free: false, starter: false, pro: true, flagship: true,
  },

  // 团队 & API
  {
    key: "team_seats", category: "团队与 API",
    label: { zh: "团队席位", en: "Team seats" },
    free: "1 席", starter: "1 席", pro: "3 席", flagship: "10 席",
  },
  {
    key: "api_access", category: "团队与 API",
    label: { zh: "API 接入", en: "API access" },
    free: false, starter: false, pro: true, flagship: true,
  },

  // 高级服务
  {
    key: "brand_strategy", category: "高级服务",
    label: { zh: "品牌战略 AI 报告", en: "Brand strategy reports" },
    free: false, starter: false, pro: false, flagship: true,
  },
  {
    key: "account_manager", category: "高级服务",
    label: { zh: "专属客户经理", en: "Dedicated manager" },
    free: false, starter: false, pro: false, flagship: true,
  },
  {
    key: "support", category: "高级服务",
    label: { zh: "客服支持", en: "Customer support" },
    free: "社区论坛", starter: "工单支持", pro: "优先响应", flagship: "1v1 微信",
  },
];

// ─── 计费周期显示 ─────────────────────────────────────────────────

export const BILLING_CYCLE_LABELS: Record<BillingCycle, Record<string, string>> = {
  monthly:  { zh: "按月付",  en: "Monthly"  },
  biannual: { zh: "半年付",  en: "6 Months" },
  annual:   { zh: "按年付", en: "Annual"   },
};

// ─── 支付渠道 ─────────────────────────────────────────────────────

export type PaymentProvider = "alipay" | "lianpay" | "paypal" | "stripe" | "wechatpay" | "manual";

export interface PaymentProviderMeta {
  id: PaymentProvider;
  name: Record<string, string>;
  currencies: Currency[];
  available: boolean;
  color: string;
}

export const PAYMENT_PROVIDERS: PaymentProviderMeta[] = [
  { id: "alipay",    name: { zh: "支付宝",   en: "Alipay"      }, currencies: ["CNY"],      available: true,  color: "text-blue-400"   },
  { id: "wechatpay", name: { zh: "微信支付", en: "WeChat Pay"  }, currencies: ["CNY"],      available: true,  color: "text-green-400"  },
  { id: "lianpay",   name: { zh: "连连支付", en: "LianLian Pay"}, currencies: ["CNY","USD"], available: true,  color: "text-orange-400" },
  { id: "paypal",    name: { zh: "PayPal",   en: "PayPal"       }, currencies: ["USD"],      available: true,  color: "text-sky-400"    },
  { id: "stripe",    name: { zh: "Stripe",   en: "Stripe"       }, currencies: ["USD"],      available: false, color: "text-violet-400" },
];

// ─── 模型成本参考 ─────────────────────────────────────────────────

export const MODEL_COSTS = {
  // 输入成本（元/百万 tokens）
  input: {
    "glm-4-flash":      0.4,
    "deepseek-chat":    1.8,
    "deepseek-reasoner": 4,
    "glm-4-plus":       7,
    "groq-llama-3.3":   1.2,
    "gemini-2.5-flash": 0.5,
    "claude-haiku":     5.8,
    "claude-sonnet":    22,
  },
  // 输出成本（元/百万 tokens）
  output: {
    "glm-4-flash":      1.6,
    "deepseek-chat":    7.2,
    "deepseek-reasoner": 16,
    "glm-4-plus":       14,
    "groq-llama-3.3":   1.2,
    "gemini-2.5-flash": 2,
    "claude-haiku":     23,
    "claude-sonnet":    65,
  },
} as const;