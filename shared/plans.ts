/**
 * MaoAI Plan Definitions v3 — 基于 API 成本的 1000x 加价率定价体系
 *
 * 设计原则：
 *   1. 去掉了「终身买断」，改为「年付优惠」+「超大 Token 包」
 *   2. 定价基于实际 API 成本，确保 1000 倍加价率
 *   3. Token 包设计：用户容易理解「能用多少次」
 *   4. 年付享 17-20% 优惠，锁定长期用户
 *
 * 成本基准（每月）：
 *   · 入门版：5万 tokens，约 ¥0.15 成本
 *   · 专业版：50万 tokens，约 ¥1.5 成本
 *   · 旗舰版：500万 tokens，约 ¥12 成本
 *   · 大师版：2000万 tokens，约 ¥40 成本
 *
 * 加价率：99x ~ 2330x
 */

export type PlanTier = "free" | "starter" | "pro" | "flagship";
export type Currency = "CNY" | "USD";
export type BillingCycle = "monthly" | "biannual" | "annual";

// ─── 每日消息限制（新版核心单位）───────────────────────────────

export interface PlanLimits {
  /** 每日对话消息数（-1 = unlimited） */
  dailyChatMessages: number;
  /** 每月可用 tokens（-1 = unlimited） */
  monthlyTokens: number;
  /** 每日图片生成数 */
  dailyImageGenerations: number;
  /** 每月内容生产配额（篇数） */
  monthlyContentQuota: number;
  /** 最大存储对话数 */
  maxConversations: number;
  /** 是否可使用高级模型（R1/Claude/Gemini Pro） */
  premiumModels: boolean;
  /** 是否可使用图片生成 */
  imageGeneration: boolean;
  /** 优先响应队列 */
  priorityQueue: boolean;
  /** 文件上传与分析 */
  fileUpload: boolean;
  /** 品牌战略 AI 报告 */
  brandStrategy: boolean;
  /** 专属客户经理 */
  accountManager: boolean;
  /** 自定义 AI 人设 */
  customPersona: boolean;
  /** API 接入权限 */
  apiAccess: boolean;
  /** 团队席位数量 */
  teamSeats: number;
  /** 内容平台访问 */
  contentPlatform: boolean;
  /** 定时发布策略 */
  contentSchedule: boolean;
  /** 支持的内容发布平台 */
  contentPlatforms: string[];
  /** 视频生成额度（秒/月） */
  monthlyVideoSeconds: number;
}

// ─── 各档位限制 ─────────────────────────────────────────────────

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    dailyChatMessages: 20,
    monthlyTokens: 10000,           // 1万 tokens
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
    monthlyTokens: 50000,           // 5万 tokens
    dailyImageGenerations: 5,
    monthlyContentQuota: 0,
    maxConversations: 50,
    premiumModels: false,            // 基础模型（GLM-4 Flash + Groq Llama）
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
    monthlyTokens: 500000,          // 50万 tokens
    dailyImageGenerations: 50,
    monthlyContentQuota: 30,        // 每月 30 篇内容
    maxConversations: -1,
    premiumModels: true,            // 全部模型（DeepSeek R1 + Gemini + Claude）
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
    monthlyVideoSeconds: 30,        // 30秒视频/月
  },

  flagship: {
    dailyChatMessages: -1,          // 无限制
    monthlyTokens: 2000000,         // 200万 tokens
    dailyImageGenerations: -1,
    monthlyContentQuota: 200,       // 每月 200 篇内容
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
    monthlyVideoSeconds: 180,       // 3分钟视频/月
  },
};

// ─── 成本估算（元/月）─────────────────────────────────────────────
// 基于平均使用：用户每天 10-50 条消息，每条 800 input + 400 output tokens

const COST_ESTIMATE = {
  free:     0.02,   // 几乎免费
  starter:  0.15,   // 5万 tokens
  pro:      1.5,    // 50万 tokens
  flagship: 12,     // 200万 tokens
};

// ─── 定价配置 ─────────────────────────────────────────────────────

export interface CyclePricing {
  total: number;       // 总价
  perMonth: number;    // 月均成本（用于对比显示）
  months: number;      // 月数（0 = 终身）
  savingPct: number;   // 节省百分比
  costPrice: number;   // 成本价（用于计算加价率）
  markupRatio: number; // 加价倍数
}

export const PLAN_PRICES: Record<PlanTier, Record<Currency, Record<BillingCycle, CyclePricing>>> = {
  // ── 免费版 ─────────────────────────────────────────────────────
  free: {
    CNY: {
      monthly:  { total: 0,    perMonth: 0,    months: 0,  savingPct: 0,   costPrice: 0.02,    markupRatio: 0   },
      biannual:{ total: 0,    perMonth: 0,    months: 0,  savingPct: 0,   costPrice: 0.02,    markupRatio: 0   },
      annual:  { total: 0,    perMonth: 0,    months: 0,  savingPct: 0,   costPrice: 0.02,    markupRatio: 0   },
    },
    USD: {
      monthly:  { total: 0,    perMonth: 0,    months: 0,  savingPct: 0,   costPrice: 0.01,    markupRatio: 0   },
      biannual:{ total: 0,    perMonth: 0,    months: 0,  savingPct: 0,   costPrice: 0.01,    markupRatio: 0   },
      annual:  { total: 0,    perMonth: 0,    months: 0,  savingPct: 0,   costPrice: 0.01,    markupRatio: 0   },
    },
  },

  // ── 入门版 ¥29/月 ─────────────────────────────────────────────
  // 成本：约 ¥0.15/月 → 加价率：193x
  starter: {
    CNY: {
      monthly:  { total: 29,   perMonth: 29,   months: 1,  savingPct: 0,   costPrice: 0.15,    markupRatio: 193 },
      biannual: { total: 168,  perMonth: 28,   months: 6,  savingPct: 3,   costPrice: 0.9,    markupRatio: 186 },
      annual:   { total: 288,  perMonth: 24,   months: 12, savingPct: 17,  costPrice: 1.8,    markupRatio: 160 },
    },
    USD: {
      monthly:  { total: 3.99, perMonth: 3.99, months: 1,  savingPct: 0,   costPrice: 0.02,   markupRatio: 200 },
      biannual: { total: 22.99, perMonth: 3.83, months: 6, savingPct: 4,   costPrice: 0.12,   markupRatio: 192 },
      annual:   { total: 39.99, perMonth: 3.33, months: 12, savingPct: 17,  costPrice: 0.24,   markupRatio: 167 },
    },
  },

  // ── 专业版 ¥199/月 ─────────────────────────────────────────────
  // 成本：约 ¥1.5/月 → 加价率：1327x
  // 包含：50万 tokens/月 + 内容平台 30篇/月 + 高级模型
  pro: {
    CNY: {
      monthly:  { total: 199,  perMonth: 199,  months: 1,  savingPct: 0,   costPrice: 1.5,    markupRatio: 133 },
      biannual: { total: 1148, perMonth: 191,  months: 6,  savingPct: 4,   costPrice: 9,      markupRatio: 127 },
      annual:   { total: 1980, perMonth: 165,  months: 12, savingPct: 17,  costPrice: 18,     markupRatio: 110 },
    },
    USD: {
      monthly:  { total: 27.99, perMonth: 27.99, months: 1,  savingPct: 0,   costPrice: 0.2,   markupRatio: 140 },
      biannual: { total: 159.99, perMonth: 26.67, months: 6, savingPct: 5,   costPrice: 1.2,   markupRatio: 133 },
      annual:   { total: 279.99, perMonth: 23.33, months: 12, savingPct: 17,  costPrice: 2.4,   markupRatio: 117 },
    },
  },

  // ── 旗舰版 ¥699/月 ─────────────────────────────────────────────
  // 成本：约 ¥12/月 → 加价率：5825x
  // 包含：200万 tokens/月 + 内容平台 200篇/月 + 视频 180秒/月 + 品牌服务
  flagship: {
    CNY: {
      monthly:  { total: 699,  perMonth: 699,  months: 1,  savingPct: 0,   costPrice: 12,    markupRatio: 58  },
      biannual: { total: 3988, perMonth: 665,  months: 6,  savingPct: 5,   costPrice: 72,     markupRatio: 55  },
      annual:   { total: 6988, perMonth: 582,  months: 12, savingPct: 17,  costPrice: 144,    markupRatio: 49  },
    },
    USD: {
      monthly:  { total: 97.99, perMonth: 97.99, months: 1,  savingPct: 0,   costPrice: 1.6,   markupRatio: 61  },
      biannual: { total: 559.99, perMonth: 93.33, months: 6, savingPct: 5,   costPrice: 9.6,   markupRatio: 58  },
      annual:   { total: 979.99, perMonth: 81.67, months: 12, savingPct: 17,  costPrice: 19.2,  markupRatio: 51  },
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
  /** 成本估算（元/月） */
  costEstimate: string;
  /** 加价倍数 */
  markupDisplay: string;
}

export const PLAN_META: Record<PlanTier, PlanMeta> = {
  free: {
    name:    { zh: "免费版",    en: "Free" },
    tagline: { zh: "体验 AI 对话", en: "Start with AI" },
    badge:   "🌱",
    highlighted: false,
    recommended: false,
    accentColor:  "text-gray-400",
    accentBg:     "bg-gray-400/10",
    accentBorder: "border-gray-400/30",
    costEstimate: "¥0.02/月",
    markupDisplay: "免费",
  },
  starter: {
    name:    { zh: "入门版",    en: "Starter" },
    tagline: { zh: "适合个人创作者", en: "For individual creators" },
    badge:   "⚡",
    highlighted: true,
    recommended: false,
    accentColor:  "text-emerald-400",
    accentBg:     "bg-emerald-400/10",
    accentBorder: "border-emerald-400/30",
    costEstimate: "¥0.15/月",
    markupDisplay: "193x 加价",
  },
  pro: {
    name:    { zh: "专业版",    en: "Pro" },
    tagline: { zh: "高频使用 · 全模型解锁", en: "High frequency · All models" },
    badge:   "🚀",
    highlighted: true,
    recommended: true,
    accentColor:  "text-[#C9A84C]",
    accentBg:     "bg-[#C9A84C]/10",
    accentBorder: "border-[#C9A84C]/40",
    costEstimate: "¥1.5/月",
    markupDisplay: "133x 加价",
  },
  flagship: {
    name:    { zh: "旗舰版",    en: "Flagship" },
    tagline: { zh: "无限使用 · 品牌战略 · 专属顾问", en: "Unlimited · Brand strategy · VIP" },
    badge:   "👑",
    highlighted: true,
    recommended: false,
    accentColor:  "text-purple-400",
    accentBg:     "bg-purple-500/10",
    accentBorder: "border-purple-500/40",
    costEstimate: "¥12/月",
    markupDisplay: "58x 加价",
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
    label: { zh: "基础模型（GLM-4 Flash、Groq Llama）", en: "Basic models" },
    free: true, starter: true, pro: true, flagship: true,
  },
  {
    key: "premium_models", category: "AI 对话",
    label: { zh: "高级模型（DeepSeek R1、Claude、Gemini Pro）", en: "Premium models" },
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

// ─── 成本计算工具函数 ─────────────────────────────────────────────

/**
 * 计算指定档位的加价倍数
 */
export function calculateMarkup(tier: PlanTier, cycle: BillingCycle): number {
  const pricing = PLAN_PRICES[tier]?.CNY?.[cycle];
  if (!pricing || pricing.costPrice === 0) return 0;
  return Math.round(pricing.total / pricing.costPrice);
}

/**
 * 估算月均 token 消耗（基于每日消息数和模型分布）
 */
export function estimateMonthlyTokens(dailyMessages: number, premiumRatio: number = 0): number {
  // 假设每条消息平均 800 input + 400 output = 1200 tokens
  const tokensPerMessage = 1200;
  const daysPerMonth = 30;
  return dailyMessages * daysPerMonth * tokensPerMessage;
}

/**
 * 成本估算（基于实际 API 定价）
 */
export const MODEL_COSTS = {
  // 输入成本（元/百万 tokens）
  input: {
    "glm-4-flash":     0.4,
    "deepseek-chat":   1.8,
    "deepseek-reasoner": 4,
    "glm-4-plus":      7,
    "groq-llama-3.3":  1.2,
    "gemini-2.5-flash": 0.5,
    "claude-haiku":    5.8,
    "claude-sonnet":   22,
  },
  // 输出成本（元/百万 tokens）
  output: {
    "glm-4-flash":     1.6,
    "deepseek-chat":   7.2,
    "deepseek-reasoner": 16,
    "glm-4-plus":      14,
    "groq-llama-3.3":  1.2,
    "gemini-2.5-flash": 2,
    "claude-haiku":    23,
    "claude-sonnet":   65,
  },
} as const;