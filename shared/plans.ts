/**
 * MaoAI Plan Definitions
 * Single source of truth for tier features, limits, and pricing.
 *
 * Tiers:
 *   starter  — 入门版  ¥99/mo   | $13.99/mo
 *   pro      — 专业版  ¥398/mo  | $54.99/mo
 *   flagship — 品牌全案旗舰版 ¥998/mo | $138.99/mo
 *
 * Billing cycles (CNY):
 *   monthly  × 1  →  ¥998 / ¥398 / ¥99
 *   biannual × 6  →  ¥5680 / ¥2280 / ¥560   (≈ 5.7 × monthly, save ~5%)
 *   annual   × 12 →  ¥9980 / ¥3980 / ¥980   (≈ 10 × monthly, save ~17%)
 *   lifetime  —    →  ¥39800 / ¥15800 / ¥3980
 */

export type PlanTier = "starter" | "pro" | "flagship";
export type Currency = "CNY" | "USD";
export type BillingCycle = "monthly" | "biannual" | "annual" | "lifetime";

// ─── Limits ───────────────────────────────────────────────────────────────────
export interface PlanLimits {
  /** Daily chat messages. -1 = unlimited */
  dailyChatMessages: number;
  /** Daily image generations. -1 = unlimited */
  dailyImageGenerations: number;
  /** Max stored conversations. -1 = unlimited */
  maxConversations: number;
  /** Access to premium models (DeepSeek R1, GLM-4 Plus, etc.) */
  premiumModels: boolean;
  /** nano banana image generation */
  imageGeneration: boolean;
  /** Priority response queue */
  priorityQueue: boolean;
  /** File / document upload & analysis */
  fileUpload: boolean;
  /** Brand strategy & full-case AI services */
  brandStrategy: boolean;
  /** Dedicated account manager */
  accountManager: boolean;
  /** Custom AI persona / system prompt */
  customPersona: boolean;
  /** API access */
  apiAccess: boolean;
  /** Team seats included */
  teamSeats: number;
  // ── 猫眼自动内容平台 ───────────────────────────────
  /** Monthly content production quota. 0 = no access. -1 = unlimited */
  contentQuota: number;
  /** Access to auto content platform dashboard */
  contentPlatform: boolean;
  /** Configurable auto-publish schedules */
  contentSchedule: boolean;
  /** Platforms supported: xiaohongshu / douyin / weibo / wechat */
  contentPlatforms: string[];
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  starter: {
    dailyChatMessages: 100,
    dailyImageGenerations: 5,
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
    contentQuota: 0,
    contentPlatform: false,
    contentSchedule: false,
    contentPlatforms: [],
  },
  pro: {
    dailyChatMessages: 1000,
    dailyImageGenerations: 100,
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
    contentQuota: 50,
    contentPlatform: true,
    contentSchedule: false,
    contentPlatforms: ["xiaohongshu", "weibo"],
  },
  flagship: {
    dailyChatMessages: -1,
    dailyImageGenerations: -1,
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
    contentQuota: -1,
    contentPlatform: true,
    contentSchedule: true,
    contentPlatforms: ["xiaohongshu", "douyin", "weibo", "wechat"],
  },
};

// ─── Pricing ──────────────────────────────────────────────────────────────────
export interface CyclePricing {
  /** Total amount for this cycle */
  total: number;
  /** Effective monthly cost */
  perMonth: number;
  /** Months covered (0 = lifetime) */
  months: number;
  /** Savings vs. equivalent monthly payments (percentage, 0 if no saving) */
  savingPct: number;
  /** Anchor label shown to user */
  anchorLabel?: Record<string, string>;
}

export const PLAN_PRICES: Record<PlanTier, Record<Currency, Record<BillingCycle, CyclePricing>>> = {
  // ── 入门版 ──────────────────────────────────────────────────────────────────
  starter: {
    CNY: {
      monthly:  { total: 99,   perMonth: 99,   months: 1,  savingPct: 0 },
      biannual: { total: 560,  perMonth: 93,   months: 6,  savingPct: 6,  anchorLabel: { zh: "省 ¥34",  en: "Save ¥34"  } },
      annual:   { total: 980,  perMonth: 82,   months: 12, savingPct: 17, anchorLabel: { zh: "省 ¥208", en: "Save ¥208" } },
      lifetime: { total: 3980, perMonth: 0,    months: 0,  savingPct: 0,  anchorLabel: { zh: "一次买断", en: "One-time" } },
    },
    USD: {
      monthly:  { total: 13.99,  perMonth: 13.99, months: 1,  savingPct: 0 },
      biannual: { total: 79.99,  perMonth: 13.33, months: 6,  savingPct: 5,  anchorLabel: { zh: "Save $4",   en: "Save $4"   } },
      annual:   { total: 139.99, perMonth: 11.67, months: 12, savingPct: 17, anchorLabel: { zh: "Save $28",  en: "Save $28"  } },
      lifetime: { total: 549.99, perMonth: 0,     months: 0,  savingPct: 0,  anchorLabel: { zh: "One-time", en: "One-time"  } },
    },
  },

  // ── 专业版 ──────────────────────────────────────────────────────────────────
  pro: {
    CNY: {
      monthly:  { total: 398,  perMonth: 398,  months: 1,  savingPct: 0 },
      biannual: { total: 2280, perMonth: 380,  months: 6,  savingPct: 5,  anchorLabel: { zh: "省 ¥108",  en: "Save ¥108"  } },
      annual:   { total: 3980, perMonth: 332,  months: 12, savingPct: 17, anchorLabel: { zh: "省 ¥796",  en: "Save ¥796"  } },
      lifetime: { total: 15800, perMonth: 0,   months: 0,  savingPct: 0,  anchorLabel: { zh: "一次买断", en: "One-time"  } },
    },
    USD: {
      monthly:  { total: 54.99,   perMonth: 54.99, months: 1,  savingPct: 0 },
      biannual: { total: 319.99,  perMonth: 53.33, months: 6,  savingPct: 3,  anchorLabel: { zh: "Save $10",  en: "Save $10"  } },
      annual:   { total: 549.99,  perMonth: 45.83, months: 12, savingPct: 17, anchorLabel: { zh: "Save $110", en: "Save $110" } },
      lifetime: { total: 2199.99, perMonth: 0,     months: 0,  savingPct: 0,  anchorLabel: { zh: "One-time", en: "One-time"  } },
    },
  },

  // ── 品牌全案旗舰版 ──────────────────────────────────────────────────────────
  flagship: {
    CNY: {
      monthly:  { total: 998,   perMonth: 998,  months: 1,  savingPct: 0 },
      biannual: { total: 5680,  perMonth: 947,  months: 6,  savingPct: 5,  anchorLabel: { zh: "省 ¥308",  en: "Save ¥308"  } },
      annual:   { total: 9980,  perMonth: 832,  months: 12, savingPct: 17, anchorLabel: { zh: "省 ¥1996", en: "Save ¥1996" } },
      lifetime: { total: 39800, perMonth: 0,    months: 0,  savingPct: 0,  anchorLabel: { zh: "一次买断", en: "One-time"  } },
    },
    USD: {
      monthly:  { total: 138.99,  perMonth: 138.99, months: 1,  savingPct: 0 },
      biannual: { total: 799.99,  perMonth: 133.33, months: 6,  savingPct: 4,  anchorLabel: { zh: "Save $34",  en: "Save $34"  } },
      annual:   { total: 1399.99, perMonth: 116.67, months: 12, savingPct: 16, anchorLabel: { zh: "Save $268", en: "Save $268" } },
      lifetime: { total: 5599.99, perMonth: 0,      months: 0,  savingPct: 0,  anchorLabel: { zh: "One-time", en: "One-time"  } },
    },
  },
};

// ─── Display metadata ─────────────────────────────────────────────────────────
export interface PlanMeta {
  name: Record<string, string>;
  tagline: Record<string, string>;
  badge: string;
  highlighted: boolean;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
}

export const PLAN_META: Record<PlanTier, PlanMeta> = {
  starter: {
    name:    { zh: "入门版",         en: "Starter"   },
    tagline: { zh: "轻松上手 AI 创作", en: "Get started with AI" },
    badge:   "🐱",
    highlighted: false,
    accentColor:  "text-sky-400",
    accentBg:     "bg-sky-400/10",
    accentBorder: "border-sky-400/30",
  },
  pro: {
    name:    { zh: "专业版",                 en: "Pro"        },
    tagline: { zh: "高频使用 · 全模型解锁",   en: "Unlock all models & priority" },
    badge:   "⚡",
    highlighted: true,
    accentColor:  "text-[#C9A84C]",
    accentBg:     "bg-[#C9A84C]/10",
    accentBorder: "border-[#C9A84C]/40",
  },
  flagship: {
    name:    { zh: "品牌全案旗舰版",         en: "Flagship"   },
    tagline: { zh: "无限使用 · 品牌战略 · 专属顾问", en: "Unlimited · Brand strategy · Dedicated manager" },
    badge:   "👑",
    highlighted: false,
    accentColor:  "text-purple-400",
    accentBg:     "bg-purple-500/10",
    accentBorder: "border-purple-500/40",
  },
};

// ─── Feature comparison rows ──────────────────────────────────────────────────
export interface FeatureRow {
  key: string;
  category?: string;
  label: Record<string, string>;
  starter: string | boolean;
  pro: string | boolean;
  flagship: string | boolean;
}

export const FEATURE_ROWS: FeatureRow[] = [
  // AI 对话
  {
    key: "chat", category: "AI 对话",
    label: { zh: "每日对话次数", en: "Daily chat messages" },
    starter: "100 次/天", pro: "1,000 次/天", flagship: "无限制",
  },
  {
    key: "models", category: "AI 对话",
    label: { zh: "基础模型（DeepSeek V3、GLM-4 Flash）", en: "Basic models" },
    starter: true, pro: true, flagship: true,
  },
  {
    key: "premium_models", category: "AI 对话",
    label: { zh: "高级模型（DeepSeek R1、GLM-4 Plus）", en: "Premium models (R1, GLM-4+)" },
    starter: false, pro: true, flagship: true,
  },
  {
    key: "priority", category: "AI 对话",
    label: { zh: "优先响应队列（更快回复）", en: "Priority response queue" },
    starter: false, pro: true, flagship: true,
  },
  // 图像生成
  {
    key: "image_gen", category: "图像生成",
    label: { zh: "nano banana 图像生成", en: "nano banana image gen" },
    starter: "5 次/天", pro: "100 次/天", flagship: "无限制",
  },
  // 文件与数据
  {
    key: "file", category: "文件与数据",
    label: { zh: "文件上传与分析（PDF、Word、表格）", en: "File upload & analysis" },
    starter: false, pro: true, flagship: true,
  },
  {
    key: "persona", category: "文件与数据",
    label: { zh: "自定义 AI 人设 / 系统提示词", en: "Custom AI persona / system prompt" },
    starter: false, pro: true, flagship: true,
  },
  // 历史与存储
  {
    key: "history", category: "历史与存储",
    label: { zh: "对话历史保存", en: "Conversation history" },
    starter: "最近 50 条", pro: "无限制", flagship: "无限制",
  },
  // API
  {
    key: "api", category: "API 与集成",
    label: { zh: "API 接入（开发者调用）", en: "API access" },
    starter: false, pro: true, flagship: true,
  },
  {
    key: "seats", category: "API 与集成",
    label: { zh: "团队席位", en: "Team seats" },
    starter: "1 席", pro: "3 席", flagship: "10 席",
  },
  // 品牌服务（旗舰版专属）
  {
    key: "brand", category: "品牌全案服务",
    label: { zh: "品牌战略 AI 分析报告", en: "Brand strategy AI reports" },
    starter: false, pro: false, flagship: true,
  },
  {
    key: "manager", category: "品牌全案服务",
    label: { zh: "专属客户经理（1v1 服务）", en: "Dedicated account manager" },
    starter: false, pro: false, flagship: true,
  },
  // 支持
  {
    key: "support", category: "客服支持",
    label: { zh: "客服支持", en: "Customer support" },
    starter: "社区论坛", pro: "邮件优先响应", flagship: "专属 1v1 微信",
  },
  // ── 猫眼自动内容平台 ──────────────────────────────────────────────────────
  {
    key: "contentPlatform", category: "猫眼自动内容平台",
    label: { zh: "内容平台访问", en: "Content platform access" },
    starter: false, pro: true, flagship: true,
  },
  {
    key: "contentQuota", category: "猫眼自动内容平台",
    label: { zh: "每月内容生产配额", en: "Monthly content quota" },
    starter: "不包含", pro: "50 篇/月", flagship: "无限制",
  },
  {
    key: "contentSchedule", category: "猫眼自动内容平台",
    label: { zh: "自定义定时发布策略", en: "Custom auto-publish schedules" },
    starter: false, pro: false, flagship: true,
  },
  {
    key: "contentPlatforms", category: "猫眼自动内容平台",
    label: { zh: "支持发布平台", en: "Supported platforms" },
    starter: "—", pro: "小红书、微博", flagship: "小红书、抖音、微博、微信公众号",
  },
];

// ─── Billing cycle display ────────────────────────────────────────────────────
export const BILLING_CYCLE_LABELS: Record<BillingCycle, Record<string, string>> = {
  monthly:  { zh: "按月付",  en: "Monthly"  },
  biannual: { zh: "半年付",  en: "6 Months" },
  annual:   { zh: "按年付",  en: "Annual"   },
  lifetime: { zh: "终身买断", en: "Lifetime" },
};

// ─── Payment providers ────────────────────────────────────────────────────────
export type PaymentProvider = "alipay" | "lianpay" | "paypal" | "stripe" | "wechatpay" | "manual";

export interface PaymentProviderMeta {
  id: PaymentProvider;
  name: Record<string, string>;
  currencies: Currency[];
  available: boolean;
  color: string;
}

export const PAYMENT_PROVIDERS: PaymentProviderMeta[] = [
  { id: "alipay",    name: { zh: "支付宝",  en: "Alipay"      }, currencies: ["CNY"],        available: false, color: "text-blue-400"   },
  { id: "wechatpay", name: { zh: "微信支付", en: "WeChat Pay"  }, currencies: ["CNY"],        available: false, color: "text-green-400"  },
  { id: "lianpay",   name: { zh: "连连支付", en: "LianLian Pay"}, currencies: ["CNY","USD"],  available: false, color: "text-orange-400" },
  { id: "paypal",    name: { zh: "PayPal",  en: "PayPal"       }, currencies: ["USD"],        available: false, color: "text-sky-400"    },
  { id: "stripe",    name: { zh: "Stripe",  en: "Stripe"       }, currencies: ["USD"],        available: false, color: "text-violet-400" },
];
