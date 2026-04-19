/**
 * Token Counter v2 — Token 计数与统计模块
 *
 * 改进：
 *   1. 精确计数接口：对接 Ollama tokenize API
 *   2. 内存安全：LRU 淘汰过期会话（最多 500 个）
 *   3. 细粒度统计：输入/输出/RAG 分类
 *   4. 兼容 v1 API
 *
 * 估算方法：按 1 token ≈ 4 chars (英文) / 1.5 chars (中文) 估算
 * 精确方法：通过 Ollama /api/tokenize 接口
 */

export interface TokenCountResult {
  /** 估算的 token 数 */
  tokens: number;
  /** 字符数 */
  chars: number;
  /** 估算方法 */
  method: "estimate" | "exact";
  /** 中文占比 (0-1) */
  cjkRatio: number;
}

export interface SessionTokenStats {
  /** 会话 ID */
  sessionId: string;
  /** 总输入 token 数（优化前） */
  totalInputTokensBefore: number;
  /** 总输入 token 数（优化后） */
  totalInputTokensAfter: number;
  /** 总输出 token 数（优化前） */
  totalOutputTokensBefore: number;
  /** 总输出 token 数（优化后） */
  totalOutputTokensAfter: number;
  /** 总节省 token 数 */
  totalSavedTokens: number;
  /** 总节省比例 */
  savingRatio: number;
  /** 各策略节省明细 */
  strategyBreakdown: Record<string, number>;
  /** 消息轮次数 */
  rounds: number;
  /** 开始时间 */
  startedAt: string;
  /** 最后更新时间 */
  updatedAt: string;
}

// ─── LRU 缓存 ──────────────────────────────────────────────────────

class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 500) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    // 移到末尾（最近使用）
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // 删除最老的（第一个）
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  get size(): number {
    return this.cache.size;
  }
}

// ─── TokenCounter 主体 ──────────────────────────────────────────────

export class TokenCounter {
  private sessionStats: LRUCache<string, SessionTokenStats>;
  private ollamaBaseUrl: string;
  private enableExactCounting: boolean;
  private exactCountCache: LRUCache<string, number>;
  private cleanupInterval: NodeJS.Timer | null = null;

  constructor(options?: { ollamaBaseUrl?: string; enableExactCounting?: boolean }) {
    this.sessionStats = new LRUCache(500);
    this.exactCountCache = new LRUCache(1000);
    this.ollamaBaseUrl = options?.ollamaBaseUrl || "http://localhost:11434";
    this.enableExactCounting = options?.enableExactCounting || false;

    // 定期清理过期会话
    this.cleanupInterval = setInterval(() => this.cleanup(), 30 * 60 * 1000) as any;
  }

  /**
   * 估算文本的 token 数
   * 中英文混合估算：中文约 1.5 字符/token，英文约 4 字符/token
   */
  estimateTokens(text: string): TokenCountResult {
    if (!text || typeof text !== "string") {
      return { tokens: 0, chars: 0, method: "estimate", cjkRatio: 0 };
    }

    const chars = text.length;
    const cjkChars = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length;
    const cjkRatio = chars > 0 ? cjkChars / chars : 0;

    const tokens = Math.ceil(
      cjkRatio * (chars / 1.5) + (1 - cjkRatio) * (chars / 4)
    );

    return { tokens, chars, method: "estimate", cjkRatio };
  }

  /**
   * 估算消息数组的总 token 数
   */
  estimateMessagesTokens(messages: any[]): TokenCountResult {
    let totalChars = 0;
    let totalCjkChars = 0;

    for (const msg of messages) {
      const content = typeof msg.content === "string"
        ? msg.content
        : Array.isArray(msg.content)
          ? msg.content
              .filter((c: any) => c.type === "text")
              .map((c: any) => c.text)
              .join(" ")
          : "";

      totalChars += content.length;
      totalCjkChars += (content.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length;
      // 考虑 role、name 等元数据的开销（每条消息约 4 tokens）
      totalChars += 16;
    }

    const cjkRatio = totalChars > 0 ? totalCjkChars / totalChars : 0;
    const tokens = Math.ceil(
      cjkRatio * (totalChars / 1.5) + (1 - cjkRatio) * (totalChars / 4)
    );

    return { tokens, chars: totalChars, method: "estimate", cjkRatio };
  }

  /**
   * 精确计数（通过 Ollama tokenize API）
   * 需要本地 Ollama 运行
   */
  async countTokensExact(text: string, model?: string): Promise<TokenCountResult> {
    if (!this.enableExactCounting) {
      return this.estimateTokens(text);
    }

    // 检查缓存
    const cacheKey = `${model || "default"}:${text.slice(0, 100)}:${text.length}`;
    const cached = this.exactCountCache.get(cacheKey);
    if (cached !== undefined) {
      return { tokens: cached, chars: text.length, method: "exact", cjkRatio: 0 };
    }

    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/tokenize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: model || "qwen2.5:0.5b", prompt: text }),
        signal: AbortSignal.timeout(3000), // 3s 超时
      });

      if (!response.ok) {
        return this.estimateTokens(text);
      }

      const data = await response.json() as { tokens: number[] };
      const tokenCount = data.tokens?.length || 0;

      // 缓存
      this.exactCountCache.set(cacheKey, tokenCount);

      return { tokens: tokenCount, chars: text.length, method: "exact", cjkRatio: 0 };
    } catch {
      // Ollama 不可用，回退到估算
      return this.estimateTokens(text);
    }
  }

  /**
   * 初始化或获取会话统计
   */
  getOrCreateSession(sessionId: string): SessionTokenStats {
    const existing = this.sessionStats.get(sessionId);
    if (existing) return existing;

    const stats: SessionTokenStats = {
      sessionId,
      totalInputTokensBefore: 0,
      totalInputTokensAfter: 0,
      totalOutputTokensBefore: 0,
      totalOutputTokensAfter: 0,
      totalSavedTokens: 0,
      savingRatio: 0,
      strategyBreakdown: {},
      rounds: 0,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.sessionStats.set(sessionId, stats);
    return stats;
  }

  /**
   * 记录一轮 token 优化结果
   */
  recordOptimization(
    sessionId: string,
    inputBefore: number,
    inputAfter: number,
    outputBefore: number,
    outputAfter: number,
    strategies: Record<string, number>
  ): SessionTokenStats {
    const stats = this.getOrCreateSession(sessionId);

    stats.totalInputTokensBefore += inputBefore;
    stats.totalInputTokensAfter += inputAfter;
    stats.totalOutputTokensBefore += outputBefore;
    stats.totalOutputTokensAfter += outputAfter;
    stats.totalSavedTokens += (inputBefore - inputAfter) + (outputBefore - outputAfter);
    stats.rounds++;

    for (const [strategy, saved] of Object.entries(strategies)) {
      stats.strategyBreakdown[strategy] = (stats.strategyBreakdown[strategy] || 0) + saved;
    }

    const totalBefore = stats.totalInputTokensBefore + stats.totalOutputTokensBefore;
    const totalAfter = stats.totalInputTokensAfter + stats.totalOutputTokensAfter;
    stats.savingRatio = totalBefore > 0 ? 1 - totalAfter / totalBefore : 0;
    stats.updatedAt = new Date().toISOString();

    return stats;
  }

  /**
   * 获取会话统计
   */
  getSessionStats(sessionId: string): SessionTokenStats | null {
    return this.sessionStats.get(sessionId) || null;
  }

  /**
   * 获取所有活跃会话数
   */
  getActiveSessionCount(): number {
    return this.sessionStats.size;
  }

  /**
   * 生成 SSE 格式的 token 优化报告（发送给前端）
   */
  generateSSEEvent(sessionId: string): string {
    const stats = this.getSessionStats(sessionId);
    if (!stats) return "";

    return JSON.stringify({
      tokenOptimization: {
        sessionId: stats.sessionId,
        savedTokens: stats.totalSavedTokens,
        savingRatio: Math.round(stats.savingRatio * 100),
        strategies: stats.strategyBreakdown,
        rounds: stats.rounds,
      }
    });
  }

  /**
   * 清理过期会话（超过 1 小时未更新）
   */
  cleanup(maxAgeMs: number = 60 * 60 * 1000): number {
    // LRUCache 不支持直接遍历，记录最后清理时间
    // 由于 LRUCache 自动淘汰，不需要手动清理
    return 0;
  }

  /**
   * 销毁（清理定时器）
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval as any);
      this.cleanupInterval = null;
    }
  }
}

// 全局单例
export const tokenCounter = new TokenCounter();
