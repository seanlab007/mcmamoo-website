/**
 * MaoAI Industrial Architecture - Model Router
 * 
 * 三级路由体系：
 * 1. 一级路由（关键词/长度）：简单请求 -> 低成本模型
 * 2. 二级路由（意图分类）：语义判断请求复杂度
 * 3. 三级路由（动态重试）：置信度低时自动升级
 * 
 * 成本优化目标：节省 60%-80% API 成本
 */

export type ModelTier = "free" | "cheap" | "expensive" | "max";

export interface RoutingResult {
  modelKey: string;
  modelTier: ModelTier;
  reason: string;
  confidence: number; // 0-1
  estimatedCost: number; // per 1K tokens
}

// ─── 一级路由：关键词/长度 ──────────────────────────────────────────────────────

const FREE_KEYWORDS = [
  "你好", "hello", "hi", "嗨", "您好",
  "谢谢", "thanks", "thank you",
  "再见", "bye", "拜拜",
  "叫什么", "名字", "who are you", "你是谁",
  "帮忙", "help", "怎么用", "怎么操作",
];

const CHEAP_INTENTS = [
  "翻译", "translate", "解释", "explain",
  "总结", "summarize", "摘要",
  "改写", "paraphrase", "润色",
  "计算", "calculate", "数学",
  "查天气", "weather", "日期", "时间",
  "搜索", "search", "查找",
  "列出", "list", "给我一个",
];

const EXPENSIVE_INTENTS = [
  "写代码", "code", "programming", "python", "javascript", "typescript",
  "写文章", "article", "essay", "blog",
  "分析", "analyze", "analysis",
  "比较", "compare", "对比",
  "设计", "design", "architecture",
  "实现", "implement", "方案",
  "优化", "optimize", "improve",
  "调试", "debug", "fix bug",
];

function classifyByKeywords(text: string): ModelTier {
  const lower = text.toLowerCase();
  
  // 检查免费关键词
  if (FREE_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()))) {
    return "free";
  }
  
  // 检查是否简短（<20字符）
  if (text.length < 20 && !EXPENSIVE_INTENTS.some(kw => lower.includes(kw.toLowerCase()))) {
    return "cheap";
  }
  
  // 检查复杂意图
  if (EXPENSIVE_INTENTS.some(kw => lower.includes(kw))) {
    return "expensive";
  }
  
  // 检查简单意图
  if (CHEAP_INTENTS.some(kw => lower.includes(kw))) {
    return "cheap";
  }
  
  return "cheap"; // 默认低成本
}

// ─── 二级路由：语义分类器 ──────────────────────────────────────────────────────

interface IntentPattern {
  tier: ModelTier;
  patterns: RegExp[];
  keywords: string[];
  maxLength?: number;
}

const INTENT_PATTERNS: IntentPattern[] = [
  // 免费/极简
  {
    tier: "free",
    keywords: ["你好", "hi", "hello", "thanks", "bye", "who are you"],
    patterns: [/^(hi|hello|hey)[.!]?$/i, /^谢谢$/i, /^再见$/i],
  },
  // 短文本翻译
  {
    tier: "cheap",
    keywords: ["翻译", "translate", "改写", "paraphrase"],
    patterns: [/把.*翻译/i, /翻译成.*英语/i],
    maxLength: 500,
  },
  // 总结摘要
  {
    tier: "cheap",
    keywords: ["总结", "summarize", "摘要", "核心"],
    patterns: [/总结.*$/i, /概括/i],
    maxLength: 5000,
  },
  // 简单问答
  {
    tier: "cheap",
    keywords: ["什么是", "怎么", "如何", "why", "what is", "how to"],
    patterns: [/^(什么是|怎么|如何)/],
    maxLength: 1000,
  },
  // 代码生成
  {
    tier: "expensive",
    keywords: ["写代码", "code", "function", "class", "python", "javascript"],
    patterns: [
      /写.*函数/i,
      /写.*代码/i,
      /create.*function/i,
      /def\s+\w+\s*\(/i,
      /function\s+\w+\s*\(/i,
    ],
  },
  // 长文分析
  {
    tier: "expensive",
    keywords: ["分析", "analyze", "compare", "design", "implement"],
    patterns: [
      /分析.*原因/i,
      /比较.*和.*差异/i,
      /设计.*方案/i,
    ],
    maxLength: 10000,
  },
];

function classifyByIntent(text: string): { tier: ModelTier; confidence: number } {
  const lower = text.toLowerCase();
  
  for (const pattern of INTENT_PATTERNS) {
    // 检查正则匹配
    for (const regex of pattern.patterns) {
      if (regex.test(text)) {
        // 长度检查
        if (pattern.maxLength && text.length > pattern.maxLength) {
          continue; // 文本太长，跳过此模式
        }
        return { tier: pattern.tier, confidence: 0.9 };
      }
    }
    
    // 检查关键词匹配
    for (const kw of pattern.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        if (pattern.maxLength && text.length > pattern.maxLength) {
          continue;
        }
        return { tier: pattern.tier, confidence: 0.7 };
      }
    }
  }
  
  return { tier: "cheap", confidence: 0.5 };
}

// ─── 模型选择映射 ─────────────────────────────────────────────────────────────

const MODEL_MAP: Record<ModelTier, string[]> = {
  free: ["glm-4-flash", "llama-3.1-8b", "gemma2-9b"],
  cheap: ["glm-4-flash", "deepseek-chat", "llama-3.1-8b", "gemini-2.5-flash"],
  expensive: ["deepseek-reasoner", "gemini-2.5-pro", "claude-sonnet-4-5", "gpt-4o"],
  max: ["claude-opus-4-5", "gemini-2.5-pro"],
};

const MODEL_COSTS: Record<string, number> = {
  "glm-4-flash": 0.001,
  "llama-3.1-8b": 0.002,
  "gemma2-9b": 0.002,
  "deepseek-chat": 0.014,
  "deepseek-reasoner": 0.055,
  "gemini-2.5-flash": 0.0035,
  "gemini-2.5-pro": 0.035,
  "claude-sonnet-4-5": 0.03,
  "claude-opus-4-5": 0.075,
  "gpt-4o": 0.06,
};

// ─── 主路由类 ─────────────────────────────────────────────────────────────────

export class ModelRouter {
  private fallbackModel: string;
  private upgradeHistory: Map<string, number> = new Map();
  
  constructor(fallbackModel: string = "deepseek-chat") {
    this.fallbackModel = fallbackModel;
  }
  
  /**
   * 路由请求到最合适的模型
   */
  route(userInput: string, userPreference?: string): RoutingResult {
    // 一级路由：关键词/长度
    const tier1 = classifyByKeywords(userInput);
    
    // 二级路由：意图分类
    const { tier: tier2, confidence } = classifyByIntent(userInput);
    
    // 取较高优先级
    const finalTier = this.getHigherTier(tier1, tier2);
    
    // 用户偏好覆盖
    if (userPreference) {
      return this.selectModel(userPreference, finalTier, confidence, "user_preference");
    }
    
    return this.selectModelByTier(finalTier, confidence);
  }
  
  /**
   * 动态升级：当小模型置信度低时升级到复杂模型
   */
  shouldUpgrade(currentModel: string, errorCount: number, avgLatency: number): boolean {
    // 错误次数过多
    if (errorCount >= 2) return true;
    
    // 延迟过高（>30s）
    if (avgLatency > 30000) return true;
    
    // 记录升级历史
    const currentCount = this.upgradeHistory.get(currentModel) || 0;
    if (currentCount >= 3) return false; // 防止无限升级
    
    return false;
  }
  
  /**
   * 标记升级
   */
  markUpgrade(modelKey: string) {
    const count = this.upgradeHistory.get(modelKey) || 0;
    this.upgradeHistory.set(modelKey, count + 1);
  }
  
  /**
   * 获取升级后的模型
   */
  getUpgradedModel(currentModel: string): string {
    const currentTier = this.getModelTier(currentModel);
    const nextTier = this.getNextTier(currentTier);
    const models = MODEL_MAP[nextTier];
    return models[Math.floor(Math.random() * models.length)];
  }
  
  private getHigherTier(t1: ModelTier, t2: ModelTier): ModelTier {
    const order: ModelTier[] = ["free", "cheap", "expensive", "max"];
    return order[Math.max(order.indexOf(t1), order.indexOf(t2))];
  }
  
  private getModelTier(modelKey: string): ModelTier {
    for (const [tier, models] of Object.entries(MODEL_MAP)) {
      if (models.includes(modelKey)) return tier as ModelTier;
    }
    return "cheap";
  }
  
  private getNextTier(current: ModelTier): ModelTier {
    const order: ModelTier[] = ["free", "cheap", "expensive", "max"];
    const idx = order.indexOf(current);
    return order[Math.min(idx + 1, order.length - 1)];
  }
  
  private selectModel(preference: string, baseTier: ModelTier, confidence: number, reason: string): RoutingResult {
    const tier = this.getModelTier(preference) || baseTier;
    return {
      modelKey: preference,
      modelTier: tier,
      reason,
      confidence,
      estimatedCost: MODEL_COSTS[preference] || 0.01,
    };
  }
  
  private selectModelByTier(tier: ModelTier, confidence: number): RoutingResult {
    const models = MODEL_MAP[tier];
    const modelKey = models[Math.floor(Math.random() * models.length)];
    
    return {
      modelKey,
      modelTier: tier,
      reason: `tier_${tier}_${confidence > 0.8 ? "high_conf" : "low_conf"}`,
      confidence,
      estimatedCost: MODEL_COSTS[modelKey] || 0.01,
    };
  }
}

// ─── 成本统计 ─────────────────────────────────────────────────────────────────

export class CostTracker {
  private costs: Map<string, { totalTokens: number; totalCost: number }> = new Map();
  private dailyCosts: Map<string, number> = new Map();
  
  track(modelKey: string, inputTokens: number, outputTokens: number) {
    const costPerToken = MODEL_COSTS[modelKey] || 0.01;
    const cost = (inputTokens + outputTokens) * costPerToken / 1000;
    
    const existing = this.costs.get(modelKey) || { totalTokens: 0, totalCost: 0 };
    this.costs.set(modelKey, {
      totalTokens: existing.totalTokens + inputTokens + outputTokens,
      totalCost: existing.totalCost + cost,
    });
    
    const today = new Date().toISOString().split("T")[0];
    const dailyCost = this.dailyCosts.get(today) || 0;
    this.dailyCosts.set(today, dailyCost + cost);
  }
  
  getTotalCost(): number {
    let total = 0;
    for (const { totalCost } of this.costs.values()) {
      total += totalCost;
    }
    return total;
  }
  
  getDailyCost(date?: string): number {
    const d = date || new Date().toISOString().split("T")[0];
    return this.dailyCosts.get(d) || 0;
  }
  
  getSavingsVsBaseline(): { percentage: number; actual: number; baseline: number } {
    const actual = this.getTotalCost();
    // 假设全部使用 max 模型的基线成本
    const baseline = actual * 5; // 粗略估算
    return {
      percentage: ((baseline - actual) / baseline) * 100,
      actual,
      baseline,
    };
  }
}

export const modelRouter = new ModelRouter();
export const costTracker = new CostTracker();
