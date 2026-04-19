/**
 * MaoAI 频率限制模块（Rate Limiter）
 *
 * 对标 Manus 的访问控制设计
 * 职责：
 *   1. 防止高频安全规则触发（探测攻击）
 *   2. 防止暴力破解
 *   3. 为不同行为提供差异化的限速策略
 *   4. 支持 IP + UserID 双重维度
 *   5. 提供风险评分系统
 *
 * 注意：当前使用内存存储，生产环境建议替换为 Redis
 */

export interface RateLimitConfig {
  /** 时间窗口（毫秒） */
  windowMs: number;
  /** 窗口内最大次数 */
  maxRequests: number;
  /** 阻断时长（毫秒），默认等于窗口 */
  blockDurationMs?: number;
}

export interface RateLimitResult {
  /** 是否被限速 */
  limited: boolean;
  /** 当前计数 */
  current: number;
  /** 剩余可用次数 */
  remaining: number;
  /** 重置时间（Unix毫秒） */
  resetAt: number;
  /** 被阻断到的时间（Unix毫秒，仅在 limited=true 时有效） */
  blockedUntil?: number;
  /** 当前风险评分 0-100 */
  riskScore: number;
}

interface BucketEntry {
  count: number;
  windowStart: number;
  violations: number;       // 超限次数（影响风险评分）
  lastSeen: number;
  blockedUntil?: number;
}

/**
 * 不同场景的限速配置
 */
export const RATE_LIMIT_CONFIGS = {
  /** 安全规则触发限速（最严格） */
  securityViolation: {
    windowMs: 60_000,     // 1分钟
    maxRequests: 5,        // 最多触发5次
    blockDurationMs: 300_000, // 触发阻断后锁定5分钟
  },
  /** 普通请求限速 */
  normalRequest: {
    windowMs: 60_000,     // 1分钟
    maxRequests: 60,       // 1分钟60次
    blockDurationMs: 60_000,
  },
  /** API调用限速 */
  apiCall: {
    windowMs: 60_000,
    maxRequests: 30,
    blockDurationMs: 120_000,
  },
  /** 认证尝试限速 */
  authAttempt: {
    windowMs: 300_000,    // 5分钟
    maxRequests: 10,
    blockDurationMs: 900_000, // 阻断15分钟
  },
} as const;

/**
 * 基于内存的速率限制器
 */
export class RateLimiter {
  private buckets: Map<string, BucketEntry> = new Map();
  private readonly cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // 每5分钟清理过期桶
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60_000);
  }

  /**
   * 检查并记录一次请求
   */
  check(
    key: string,
    config: RateLimitConfig = RATE_LIMIT_CONFIGS.normalRequest
  ): RateLimitResult {
    const now = Date.now();
    const bucket = this.getOrCreateBucket(key, now);

    // 检查是否在阻断期内
    if (bucket.blockedUntil && now < bucket.blockedUntil) {
      return {
        limited: true,
        current: bucket.count,
        remaining: 0,
        resetAt: bucket.windowStart + config.windowMs,
        blockedUntil: bucket.blockedUntil,
        riskScore: this.calculateRiskScore(bucket),
      };
    }

    // 检查窗口是否需要重置
    if (now - bucket.windowStart > config.windowMs) {
      bucket.count = 0;
      bucket.windowStart = now;
    }

    // 增加计数
    bucket.count++;
    bucket.lastSeen = now;

    const remaining = Math.max(0, config.maxRequests - bucket.count);
    const limited = bucket.count > config.maxRequests;

    if (limited) {
      bucket.violations++;
      const blockDuration = config.blockDurationMs ?? config.windowMs;
      bucket.blockedUntil = now + blockDuration;
    }

    return {
      limited,
      current: bucket.count,
      remaining,
      resetAt: bucket.windowStart + config.windowMs,
      blockedUntil: limited ? bucket.blockedUntil : undefined,
      riskScore: this.calculateRiskScore(bucket),
    };
  }

  /**
   * 仅查询状态，不增加计数
   */
  peek(key: string, config: RateLimitConfig = RATE_LIMIT_CONFIGS.normalRequest): RateLimitResult {
    const now = Date.now();
    const bucket = this.buckets.get(key);

    if (!bucket) {
      return {
        limited: false,
        current: 0,
        remaining: config.maxRequests,
        resetAt: now + config.windowMs,
        riskScore: 0,
      };
    }

    if (bucket.blockedUntil && now < bucket.blockedUntil) {
      return {
        limited: true,
        current: bucket.count,
        remaining: 0,
        resetAt: bucket.windowStart + config.windowMs,
        blockedUntil: bucket.blockedUntil,
        riskScore: this.calculateRiskScore(bucket),
      };
    }

    const remaining = Math.max(0, config.maxRequests - bucket.count);
    return {
      limited: bucket.count > config.maxRequests,
      current: bucket.count,
      remaining,
      resetAt: bucket.windowStart + config.windowMs,
      riskScore: this.calculateRiskScore(bucket),
    };
  }

  /**
   * 强制重置某个Key（管理员操作）
   */
  reset(key: string): void {
    this.buckets.delete(key);
  }

  /**
   * 获取所有高风险Key（风险分 > 70）
   */
  getHighRiskKeys(): Array<{ key: string; riskScore: number; violations: number }> {
    const result: Array<{ key: string; riskScore: number; violations: number }> = [];

    for (const [key, bucket] of this.buckets.entries()) {
      const riskScore = this.calculateRiskScore(bucket);
      if (riskScore > 70) {
        result.push({ key, riskScore, violations: bucket.violations });
      }
    }

    return result.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * 计算风险评分（0-100）
   * 综合考虑：违规次数、被阻断次数、访问频率
   */
  private calculateRiskScore(bucket: BucketEntry): number {
    const violationScore = Math.min(bucket.violations * 20, 80);
    const blockedScore = bucket.blockedUntil ? 20 : 0;
    return Math.min(100, violationScore + blockedScore);
  }

  private getOrCreateBucket(key: string, now: number): BucketEntry {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        count: 0,
        windowStart: now,
        violations: 0,
        lastSeen: now,
      });
    }
    return this.buckets.get(key)!;
  }

  private cleanup(): void {
    const now = Date.now();
    const expireThreshold = 30 * 60_000; // 30分钟未活跃则清理

    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastSeen > expireThreshold) {
        this.buckets.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.buckets.clear();
  }
}

// 单例
let rateLimiterInstance: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}

/**
 * 便捷函数：检查安全违规限速
 */
export function checkSecurityRateLimit(key: string): RateLimitResult {
  return getRateLimiter().check(key, RATE_LIMIT_CONFIGS.securityViolation);
}

/**
 * 便捷函数：检查普通请求限速
 */
export function checkRequestRateLimit(key: string): RateLimitResult {
  return getRateLimiter().check(key, RATE_LIMIT_CONFIGS.normalRequest);
}
