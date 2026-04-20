/**
 * MaoAI Industrial Architecture - Data Flywheel
 * 
 * 数据闭环：从"用户反馈"到"提示词迭代"的自动化流水线
 */

import { nanoid } from "nanoid";

// ─── 反馈类型定义 ─────────────────────────────────────────────────────────────

export type FeedbackType = "thumbs_up" | "thumbs_down" | "follow_up" | "regenerate" | "edit";

export interface FeedbackRecord {
  id: string;
  sessionId: string;
  messageId: string;
  userId?: string;
  type: FeedbackType;
  timestamp: number;
  metadata?: {
    responseTime?: number;
    modelKey?: string;
    tokenCount?: number;
  };
}

export interface ConversationSample {
  id: string;
  sessionId: string;
  userId?: string;
  messages: Array<{ role: "user" | "assistant"; content: string; timestamp: number }>;
  feedback: FeedbackRecord[];
  score: number;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface AuditResult {
  sampleId: string;
  issues: Array<{
    category: "prompt_logic" | "knowledge_gap" | "format_error" | "safety" | "other";
    severity: "low" | "medium" | "high";
    description: string;
    suggestion: string;
  }>;
  overallScore: number;
  recommendation: "keep" | "revise" | "discard";
  judgeModel: string;
  timestamp: number;
}

// ─── 反馈收集器 ───────────────────────────────────────────────────────────────

export class FeedbackCollector {
  private feedbackBuffer: FeedbackRecord[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private onFlush?: (records: FeedbackRecord[]) => Promise<void>;

  constructor(flushIntervalMs: number = 60000) {
    this.flushInterval = setInterval(() => this.flush(), flushIntervalMs);
  }

  record(record: Omit<FeedbackRecord, "id" | "timestamp">): FeedbackRecord {
    const fullRecord: FeedbackRecord = { ...record, id: nanoid(), timestamp: Date.now() };
    this.feedbackBuffer.push(fullRecord);
    return fullRecord;
  }

  recordThumbsUp(sessionId: string, messageId: string, userId?: string, metadata?: FeedbackRecord["metadata"]) {
    return this.record({ sessionId, messageId, userId, type: "thumbs_up", metadata });
  }

  recordThumbsDown(sessionId: string, messageId: string, userId?: string, metadata?: FeedbackRecord["metadata"]) {
    return this.record({ sessionId, messageId, userId, type: "thumbs_down", metadata });
  }

  recordFollowUp(sessionId: string, messageId: string, userId?: string, metadata?: FeedbackRecord["metadata"]) {
    return this.record({ sessionId, messageId, userId, type: "follow_up", metadata });
  }

  setFlushCallback(callback: (records: FeedbackRecord[]) => Promise<void>): void {
    this.onFlush = callback;
  }

  async flush(): Promise<void> {
    if (this.feedbackBuffer.length === 0) return;
    const records = [...this.feedbackBuffer];
    this.feedbackBuffer = [];
    if (this.onFlush) await this.onFlush(records);
  }

  destroy(): void {
    if (this.flushInterval) clearInterval(this.flushInterval);
  }
}

// ─── 负面样本提取器 ─────────────────────────────────────────────────────────

export class NegativeSampleExtractor {
  constructor(private threshold: number = 0.5, private minInteractions: number = 2) {}

  isNegative(feedback: FeedbackRecord[]): boolean {
    let negativeScore = 0;
    let totalScore = 0;
    for (const record of feedback) {
      if (record.type === "thumbs_down") { negativeScore += 3; totalScore += 3; }
      else if (record.type === "follow_up") { negativeScore += 1; totalScore += 2; }
      else if (record.type === "regenerate") { negativeScore += 1; totalScore += 1; }
      else if (record.type === "thumbs_up") { totalScore += 1; }
    }
    const followUpCount = feedback.filter(f => f.type === "follow_up").length;
    if (followUpCount >= this.minInteractions) negativeScore += followUpCount;
    return totalScore > 0 && negativeScore / totalScore >= this.threshold;
  }
}

// ─── LLM 审计器 ─────────────────────────────────────────────────────────────

export class LLMAuditor {
  constructor(private judgeModel: string = "claude-sonnet-4-5") {}

  async audit(sample: ConversationSample): Promise<AuditResult> {
    const issues: AuditResult["issues"] = [];
    let overallScore = 10;
    for (const feedback of sample.feedback) {
      if (feedback.type === "thumbs_down") {
        issues.push({ category: "prompt_logic", severity: "medium", description: "用户对回复不满意", suggestion: "检查回复准确性" });
        overallScore -= 2;
      }
    }
    if (overallScore < 0) overallScore = 0;
    return { sampleId: sample.id, issues, overallScore, recommendation: overallScore >= 7 ? "keep" : "revise", judgeModel: this.judgeModel, timestamp: Date.now() };
  }
}

// ─── Prompt 优化器 ────────────────────────────────────────────────────────────

export interface PromptVariant {
  id: string;
  name: string;
  systemPrompt: string;
  metrics: { impressions: number; positiveRate: number; avgResponseTime: number };
}

export class PromptOptimizer {
  private variants: Map<string, PromptVariant> = new Map();
  private activeVariantId: string | null = null;

  registerVariant(variant: PromptVariant): void {
    this.variants.set(variant.id, variant);
    if (!this.activeVariantId) this.activeVariantId = variant.id;
  }

  getActiveVariant(): PromptVariant | null {
    return this.activeVariantId ? this.variants.get(this.activeVariantId) || null : null;
  }

  selectVariant(): PromptVariant | null {
    const variants = Array.from(this.variants.values());
    if (variants.length === 0) return null;
    if (Math.random() > 0.1) return this.getActiveVariant();
    const testVariants = variants.filter(v => v.id !== this.activeVariantId);
    return testVariants.length > 0 ? testVariants[0] : this.getActiveVariant();
  }

  recordFeedback(variantId: string, isPositive: boolean): void {
    const v = this.variants.get(variantId);
    if (v) {
      const total = v.metrics.impressions;
      v.metrics.positiveRate = (v.metrics.positiveRate * (total - 1) + (isPositive ? 1 : 0)) / total;
    }
  }
}

// ─── 数据飞轮主类 ────────────────────────────────────────────────────────────

export class DataFlywheel {
  feedbackCollector = new FeedbackCollector();
  negativeExtractor = new NegativeSampleExtractor();
  llmAuditor = new LLMAuditor();
  promptOptimizer = new PromptOptimizer();

  recordFeedback(record: Omit<FeedbackRecord, "id" | "timestamp">): FeedbackRecord {
    return this.feedbackCollector.record(record);
  }

  async onConversationComplete(sample: ConversationSample): Promise<void> {
    if (this.negativeExtractor.isNegative(sample.feedback)) {
      const auditResult = await this.llmAuditor.audit(sample);
      if (auditResult.recommendation === "revise") {
        console.log(`[DataFlywheel] Negative sample: ${sample.id}, Score: ${auditResult.overallScore}/10`);
      }
    }
  }

  destroy(): void {
    this.feedbackCollector.destroy();
  }
}

export const dataFlywheel = new DataFlywheel();
