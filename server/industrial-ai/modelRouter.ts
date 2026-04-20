/**
 * MaoAI Industrial Architecture - Model Router
 */

export type ModelTier = "free" | "cheap" | "expensive" | "max";

export interface RoutingResult {
  modelKey: string;
  modelTier: ModelTier;
  reason: string;
  confidence: number;
  estimatedCost: number;
}

const FREE_KEYWORDS = ["你好", "hello", "hi", "嗨", "您好", "谢谢", "thanks", "再见", "bye"];
const CHEAP_INTENTS = ["翻译", "translate", "解释", "explain", "总结", "summarize", "改写"];
const EXPENSIVE_INTENTS = ["写代码", "code", "programming", "写文章", "analyze", "design"];

function classifyByKeywords(text: string): ModelTier {
  const lower = text.toLowerCase();
  if (FREE_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()))) return "free";
  if (text.length < 20 && !EXPENSIVE_INTENTS.some(kw => lower.includes(kw))) return "cheap";
  if (EXPENSIVE_INTENTS.some(kw => lower.includes(kw))) return "expensive";
  if (CHEAP_INTENTS.some(kw => lower.includes(kw))) return "cheap";
  return "cheap";
}

const INTENT_PATTERNS = [
  { tier: "free" as ModelTier, keywords: ["你好", "hi", "hello"], patterns: [/^(hi|hello|hey)[.!]?$/i] },
  { tier: "cheap" as ModelTier, keywords: ["翻译", "translate"], patterns: [/翻译/i], maxLength: 500 },
  { tier: "expensive" as ModelTier, keywords: ["写代码", "code"], patterns: [/写.*函数/i], maxLength: 10000 },
];

function classifyByIntent(text: string): { tier: ModelTier; confidence: number } {
  const lower = text.toLowerCase();
  for (const pattern of INTENT_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(text) && (!pattern.maxLength || text.length <= pattern.maxLength)) return { tier: pattern.tier, confidence: 0.9 };
    }
    for (const kw of pattern.keywords) {
      if (lower.includes(kw.toLowerCase()) && (!pattern.maxLength || text.length <= pattern.maxLength)) return { tier: pattern.tier, confidence: 0.7 };
    }
  }
  return { tier: "cheap", confidence: 0.5 };
}

const MODEL_MAP: Record<ModelTier, string[]> = {
  free: ["ollama-gemma3-4b", "ollama-qwen2.5-3b", "llama-3.1-8b", "glm-4-flash"],
  cheap: ["ollama-qwen2.5-7b", "glm-4-flash", "deepseek-chat", "gemini-2.5-flash"],
  expensive: ["deepseek-reasoner", "gemini-2.5-pro", "claude-sonnet-4-5"],
  max: ["claude-opus-4-5", "gemini-2.5-pro"],
};

const MODEL_COSTS: Record<string, number> = {
  // Ollama 本地模型（零成本）
  "ollama-gemma3-4b": 0, "ollama-qwen2.5-3b": 0, "ollama-qwen2.5-7b": 0,
  // 云端模型
  "glm-4-flash": 0.001, "llama-3.1-8b": 0.002, "deepseek-chat": 0.014,
  "deepseek-reasoner": 0.055, "gemini-2.5-flash": 0.0035, "gemini-2.5-pro": 0.035,
  "claude-sonnet-4-5": 0.03, "claude-opus-4-5": 0.075,
};

export class ModelRouter {
  private fallbackModel: string;
  private upgradeHistory: Map<string, number> = new Map();
  constructor(fallbackModel: string = "deepseek-chat") { this.fallbackModel = fallbackModel; }
  
  route(userInput: string, userPreference?: string): RoutingResult {
    const tier1 = classifyByKeywords(userInput);
    const { tier: tier2, confidence } = classifyByIntent(userInput);
    const finalTier = this.getHigherTier(tier1, tier2);
    if (userPreference) return this.selectModel(userPreference, finalTier, confidence, "user_preference");
    return this.selectModelByTier(finalTier, confidence);
  }
  
  shouldUpgrade(_currentModel: string, errorCount: number, avgLatency: number): boolean {
    if (errorCount >= 2) return true;
    if (avgLatency > 30000) return true;
    return false;
  }
  
  markUpgrade(modelKey: string) { this.upgradeHistory.set(modelKey, (this.upgradeHistory.get(modelKey) || 0) + 1); }
  
  getUpgradedModel(currentModel: string): string {
    const currentTier = this.getModelTier(currentModel);
    const nextTier = this.getNextTier(currentTier);
    return MODEL_MAP[nextTier][Math.floor(Math.random() * MODEL_MAP[nextTier].length)];
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
    return { modelKey: preference, modelTier: tier, reason, confidence, estimatedCost: MODEL_COSTS[preference] || 0.01 };
  }
  
  private selectModelByTier(tier: ModelTier, confidence: number): RoutingResult {
    const models = MODEL_MAP[tier];
    const modelKey = models[Math.floor(Math.random() * models.length)];
    return { modelKey, modelTier: tier, reason: `tier_${tier}`, confidence, estimatedCost: MODEL_COSTS[modelKey] || 0.01 };
  }
}

export class CostTracker {
  private costs: Map<string, { totalTokens: number; totalCost: number }> = new Map();
  private dailyCosts: Map<string, number> = new Map();
  
  track(modelKey: string, inputTokens: number, outputTokens: number) {
    const costPerToken = MODEL_COSTS[modelKey] || 0.01;
    const cost = (inputTokens + outputTokens) * costPerToken / 1000;
    const existing = this.costs.get(modelKey) || { totalTokens: 0, totalCost: 0 };
    this.costs.set(modelKey, { totalTokens: existing.totalTokens + inputTokens + outputTokens, totalCost: existing.totalCost + cost });
    const today = new Date().toISOString().split("T")[0];
    this.dailyCosts.set(today, (this.dailyCosts.get(today) || 0) + cost);
  }
  
  getTotalCost(): number { let total = 0; for (const val of Array.from(this.costs.values())) total += val.totalCost; return total; }
  getSavingsVsBaseline(): { percentage: number; actual: number; baseline: number } { const actual = this.getTotalCost(); return { percentage: 0, actual, baseline: actual * 5 }; }
}

export const modelRouter = new ModelRouter();
export const costTracker = new CostTracker();
