/**
 * Token Counter — Token 计数与统计模块
 *
 * 提供精确的 token 估算（基于字符数和语言特征），
 * 以及会话级别的 token 节省统计。
 *
 * 注意：精确 token 计数需要 tiktoken 等库，
 * 这里使用估算方法，按 1 token ≈ 4 chars (英文) / 1.5 chars (中文) 估算。
 * 后续可接入 tiktoken-wasm 或本地 Ollama 的 tokenize 接口做精确计数。
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

export class TokenCounter {
  private sessionStats: Map<string, SessionTokenStats> = new Map();

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

    // 混合估算
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
   * 初始化或获取会话统计
   */
  getOrCreateSession(sessionId: string): SessionTokenStats {
    if (!this.sessionStats.has(sessionId)) {
      this.sessionStats.set(sessionId, {
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
      });
    }
    return this.sessionStats.get(sessionId)!;
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

    // 合并策略统计
    for (const [strategy, saved] of Object.entries(strategies)) {
      stats.strategyBreakdown[strategy] = (stats.strategyBreakdown[strategy] || 0) + saved;
    }

    // 计算总节省比例
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
    const now = Date.now();
    let cleaned = 0;
    for (const [id, stats] of this.sessionStats) {
      const age = now - new Date(stats.updatedAt).getTime();
      if (age > maxAgeMs) {
        this.sessionStats.delete(id);
        cleaned++;
      }
    }
    return cleaned;
  }
}

// 全局单例
export const tokenCounter = new TokenCounter();
