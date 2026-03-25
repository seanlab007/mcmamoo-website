/**
 * MaoAI Plan Definitions
 * Single source of truth for tier features, limits, and pricing.
 */

export type PlanTier = "free" | "pro" | "max";
export type Currency = "CNY" | "USD";

// ─── Limits ───────────────────────────────────────────────────────────────────
export interface PlanLimits {
  /** Daily chat messages (text). -1 = unlimited */
  dailyChatMessages: number;
  /** Daily image generations (nano banana). -1 = unlimited */
  dailyImageGenerations: number;
  /** Max conversation history stored */
  maxConversations: number;
  /** Access to premium models (DeepSeek R1, GLM-4 Plus) */
  premiumModels: boolean;
  /** Access to nano banana image generation */
  imageGeneration: boolean;
  /** Priority queue (faster response) */
  priorityQueue: boolean;
  /** File / document upload */
  fileUpload: boolean;
  /** API access (future) */
  apiAccess: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    dailyChatMessages: 20,
    dailyImageGenerations: 0,
    maxConversations: 10,
    premiumModels: false,
    imageGeneration: false,
    priorityQueue: false,
    fileUpload: false,
    apiAccess: false,
  },
  pro: {
    dailyChatMessages: 200,
    dailyImageGenerations: 20,
    maxConversations: 200,
    premiumModels: true,
    imageGeneration: true,
    priorityQueue: false,
    fileUpload: true,
    apiAccess: false,
  },
  max: {
    dailyChatMessages: -1,
    dailyImageGenerations: -1,
    maxConversations: -1,
    premiumModels: true,
    imageGeneration: true,
    priorityQueue: true,
    fileUpload: true,
    apiAccess: true,
  },
};

// ─── Pricing ──────────────────────────────────────────────────────────────────
export interface PlanPrice {
  monthly: number;
  yearly: number; // per month, billed annually
}

export const PLAN_PRICES: Record<PlanTier, Record<Currency, PlanPrice>> = {
  free: {
    CNY: { monthly: 0, yearly: 0 },
    USD: { monthly: 0, yearly: 0 },
  },
  pro: {
    CNY: { monthly: 39, yearly: 29 },   // ¥39/月 or ¥29/月（年付）
    USD: { monthly: 5.99, yearly: 3.99 },
  },
  max: {
    CNY: { monthly: 99, yearly: 79 },   // ¥99/月 or ¥79/月（年付）
    USD: { monthly: 13.99, yearly: 10.99 },
  },
};

// ─── Display metadata ─────────────────────────────────────────────────────────
export interface PlanMeta {
  name: Record<string, string>;
  tagline: Record<string, string>;
  badge: string;
  color: string;
  highlighted: boolean;
}

export const PLAN_META: Record<PlanTier, PlanMeta> = {
  free: {
    name: { zh: "免费版", en: "Free" },
    tagline: { zh: "体验 MaoAI 基础功能", en: "Try MaoAI basics" },
    badge: "🐱",
    color: "white/30",
    highlighted: false,
  },
  pro: {
    name: { zh: "专业版", en: "Pro" },
    tagline: { zh: "解锁图像生成与高级模型", en: "Unlock image gen & premium models" },
    badge: "⚡",
    color: "#C9A84C",
    highlighted: true,
  },
  max: {
    name: { zh: "旗舰版", en: "Max" },
    tagline: { zh: "无限使用 · 最高优先级", en: "Unlimited · Highest priority" },
    badge: "🚀",
    color: "purple-400",
    highlighted: false,
  },
};

// ─── Feature list for pricing page ───────────────────────────────────────────
export interface FeatureRow {
  key: string;
  label: Record<string, string>;
  free: string | boolean;
  pro: string | boolean;
  max: string | boolean;
}

export const FEATURE_ROWS: FeatureRow[] = [
  {
    key: "chat",
    label: { zh: "每日对话次数", en: "Daily chat messages" },
    free: "20 次",
    pro: "200 次",
    max: "无限制",
  },
  {
    key: "image",
    label: { zh: "每日图像生成（nano banana）", en: "Daily image gen (nano banana)" },
    free: false,
    pro: "20 次",
    max: "无限制",
  },
  {
    key: "models",
    label: { zh: "可用模型", en: "Available models" },
    free: "基础模型",
    pro: "全部模型",
    max: "全部模型",
  },
  {
    key: "premium_models",
    label: { zh: "高级模型（DeepSeek R1、GLM-4 Plus）", en: "Premium models (DeepSeek R1, GLM-4 Plus)" },
    free: false,
    pro: true,
    max: true,
  },
  {
    key: "history",
    label: { zh: "对话历史保存", en: "Conversation history" },
    free: "最近 10 条",
    pro: "最近 200 条",
    max: "无限制",
  },
  {
    key: "file",
    label: { zh: "文件上传分析", en: "File upload & analysis" },
    free: false,
    pro: true,
    max: true,
  },
  {
    key: "priority",
    label: { zh: "优先响应队列", en: "Priority response queue" },
    free: false,
    pro: false,
    max: true,
  },
  {
    key: "api",
    label: { zh: "API 接入（即将推出）", en: "API access (coming soon)" },
    free: false,
    pro: false,
    max: true,
  },
  {
    key: "support",
    label: { zh: "客服支持", en: "Customer support" },
    free: "社区",
    pro: "邮件优先",
    max: "专属 1v1",
  },
];

// ─── Payment providers ────────────────────────────────────────────────────────
export type PaymentProvider = "alipay" | "lianpay" | "paypal" | "stripe" | "wechatpay" | "manual";

export interface PaymentProviderMeta {
  id: PaymentProvider;
  name: Record<string, string>;
  icon: string;
  currencies: Currency[];
  available: boolean; // false = coming soon
}

export const PAYMENT_PROVIDERS: PaymentProviderMeta[] = [
  {
    id: "alipay",
    name: { zh: "支付宝", en: "Alipay" },
    icon: "alipay",
    currencies: ["CNY"],
    available: false, // stub — integrate when ready
  },
  {
    id: "wechatpay",
    name: { zh: "微信支付", en: "WeChat Pay" },
    icon: "wechat",
    currencies: ["CNY"],
    available: false,
  },
  {
    id: "lianpay",
    name: { zh: "连连支付", en: "LianLian Pay" },
    icon: "lianpay",
    currencies: ["CNY", "USD"],
    available: false,
  },
  {
    id: "paypal",
    name: { zh: "PayPal", en: "PayPal" },
    icon: "paypal",
    currencies: ["USD"],
    available: false,
  },
  {
    id: "stripe",
    name: { zh: "Stripe", en: "Stripe" },
    icon: "stripe",
    currencies: ["USD"],
    available: false,
  },
];
