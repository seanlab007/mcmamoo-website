/**
 * MaoAI 安全围栏检测引擎 v2.0
 *
 * 核心升级：
 * 1. 多层规则匹配（九层防护）
 * 2. 威胁等级动态计算
 * 3. 策略执行 + terminate 终止策略
 * 4. 输出审计（Output Guardrails）- 防止AI输出泄露系统信息
 * 5. 频率限制（Rate Limiting）- 防止高频探测
 * 6. 行为一致性检查 - 检测异常模式
 * 7. 安全事件记录（不泄露用户输入）
 */

import {
  GuardRule,
  GUARDRAIL_CONFIG,
  ALL_GUARD_RULES,
  ThreatLevel,
} from "./guardrail-config";
import {
  ResponseCategory,
  getRandomResponse,
  getThreatPrefix,
} from "./response-templates";

export interface GuardResult {
  /** 是否被拦截 */
  blocked: boolean;
  /** 触发的规则ID */
  ruleId?: string;
  /** 威胁等级 */
  threatLevel?: ThreatLevel;
  /** 响应策略 */
  strategy?: "mirror" | "redirect" | "deflect" | "block" | "terminate";
  /** 拦截原因 */
  reason?: string;
  /** 响应内容 */
  response?: string;
  /** 是否记录日志 */
  shouldLog: boolean;
  /** 是否需要终止会话 */
  terminateSession?: boolean;
}

export interface GuardContext {
  /** 用户输入 */
  userMessage: string;
  /** 对话历史 */
  history?: Array<{ role: string; content: string }>;
  /** 用户ID（可选） */
  userId?: string;
  /** IP地址（可选，用于频率限制） */
  ip?: string;
  /** 是否为白名单用户 */
  isWhitelisted?: boolean;
}

export interface OutputGuardResult {
  /** 是否安全 */
  safe: boolean;
  /** 触发的敏感模式 */
  pattern?: string;
  /** 清洁后的输出（如果不安全） */
  sanitizedOutput?: string;
}

/**
 * 频率限制存储（内存版，生产环境建议用 Redis）
 */
interface RateLimitEntry {
  count: number;
  resetAt: number;
  blockedCount: number;
}

/**
 * 安全事件记录（不含用户输入明文）
 */
interface SecurityEvent {
  timestamp: string;
  ruleId: string;
  threatLevel: ThreatLevel;
  userId?: string;
  ip?: string;
  inputHash: string;  // 只记录哈希，不记录明文
}

/**
 * 安全围栏引擎 v2.0
 */
export class GuardrailEngine {
  private rules: GuardRule[];
  private enabled: boolean;
  private logEnabled: boolean;
  private rateLimitMap: Map<string, RateLimitEntry>;
  private securityEvents: SecurityEvent[];
  private readonly MAX_EVENTS = 1000;

  constructor() {
    this.rules = ALL_GUARD_RULES;
    this.enabled = GUARDRAIL_CONFIG.enabled;
    this.logEnabled = GUARDRAIL_CONFIG.logEnabled;
    this.rateLimitMap = new Map();
    this.securityEvents = [];
  }

  // ─────────────────────────────────────────
  // 主检查入口
  // ─────────────────────────────────────────

  /**
   * 输入审计（Input Guardrails）
   */
  check(context: GuardContext): GuardResult {
    if (!this.enabled) {
      return { blocked: false, shouldLog: false };
    }

    const { userMessage, isWhitelisted, userId, ip } = context;

    // 白名单用户跳过检查
    if (isWhitelisted) {
      return { blocked: false, shouldLog: false };
    }

    // 消息长度异常检测
    if (userMessage.length > GUARDRAIL_CONFIG.maxMessageLength) {
      return this.buildResult({
        ruleId: "sys-length",
        threatLevel: "high",
        strategy: "deflect",
        reason: "消息长度超限（可能的长距离注入攻击）",
        category: "manipulation-blocked",
      });
    }

    // 频率限制检查
    const rateKey = userId || ip || "anonymous";
    const rateLimitResult = this.checkRateLimit(rateKey);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // 白名单关键词检查
    if (this.isWhitelistedMessage(userMessage)) {
      return { blocked: false, shouldLog: false };
    }

    // 执行规则匹配
    for (const rule of this.rules) {
      if (this.matchesRule(userMessage, rule)) {
        // 检查是否是组合攻击
        const isComboAttack = this.checkComboAttack(context, rule);

        // 计算最终威胁等级
        const finalThreatLevel = isComboAttack
          ? this.elevateThreat(rule.threatLevel)
          : rule.threatLevel;

        // 更新频率计数
        this.incrementRateLimit(rateKey);

        // 记录安全事件
        if (rule.logEvent) {
          this.recordSecurityEvent({
            ruleId: rule.id,
            threatLevel: finalThreatLevel,
            userId: context.userId,
            ip: context.ip,
            input: userMessage,
          });
        }

        // 记录日志（开发环境）
        if (this.logEnabled) {
          this.logThreat(rule, userMessage, finalThreatLevel);
        }

        const result = this.buildResult({
          ruleId: rule.id,
          threatLevel: finalThreatLevel,
          strategy: rule.strategy,
          reason: `匹配规则: ${rule.name}`,
          category: rule.responseCategory as ResponseCategory,
        });

        // terminate 策略：需要终止会话
        if (rule.strategy === "terminate") {
          result.terminateSession = true;
        }

        return result;
      }
    }

    // 检查对话历史中的可疑模式
    const historyThreat = this.checkHistoryThreat(context);
    if (historyThreat) {
      return historyThreat;
    }

    return { blocked: false, shouldLog: false };
  }

  /**
   * 输出审计（Output Guardrails）
   * 扫描AI生成的回复，防止泄露敏感信息
   */
  checkOutput(aiOutput: string): OutputGuardResult {
    if (!GUARDRAIL_CONFIG.outputScanEnabled) {
      return { safe: true };
    }

    // 系统提示词泄露检测
    const systemPromptPatterns = [
      /you\s+are\s+(?:a|an)\s+(?:helpful|assistant)/i,
      /your\s+role\s+is\s+to/i,
      /as\s+an\s+ai\s+assistant/i,
      /system:\s*\n/i,
      /<system>/i,
      /\[system\]/i,
      /你的角色是/i,
      /你被设定为/i,
      /你的核心指令/i,
    ];

    for (const pattern of systemPromptPatterns) {
      if (pattern.test(aiOutput)) {
        return {
          safe: false,
          pattern: pattern.toString(),
          sanitizedOutput: this.sanitizeOutput(aiOutput),
        };
      }
    }

    // API密钥格式检测（防止AI意外输出）
    const credentialPatterns = [
      /sk-[A-Za-z0-9]{20,}/,           // OpenAI风格
      /AIza[A-Za-z0-9_\-]{35}/,          // Google API Key
      /[A-Za-z0-9]{32,40}/,              // 通用密钥格式（谨慎使用）
      /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY/,
      /password\s*[:=]\s*["']?\w+/i,
    ];

    for (const pattern of credentialPatterns) {
      if (pattern.test(aiOutput)) {
        return {
          safe: false,
          pattern: pattern.toString(),
          sanitizedOutput: this.sanitizeOutput(aiOutput),
        };
      }
    }

    // 内网地址泄露检测
    const internalAddressPatterns = [
      /\b192\.168\.\d{1,3}\.\d{1,3}/,
      /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
      /\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}/,
      /localhost:\d{4,5}/,
      /127\.0\.0\.1:\d{4,5}/,
    ];

    for (const pattern of internalAddressPatterns) {
      if (pattern.test(aiOutput)) {
        return {
          safe: false,
          pattern: pattern.toString(),
          sanitizedOutput: this.sanitizeOutput(aiOutput),
        };
      }
    }

    return { safe: true };
  }

  // ─────────────────────────────────────────
  // 私有方法
  // ─────────────────────────────────────────

  private matchesRule(message: string, rule: GuardRule): boolean {
    for (const pattern of rule.patterns) {
      if (typeof pattern === "string") {
        if (message.includes(pattern)) return true;
      } else {
        if (pattern.test(message)) return true;
      }
    }
    return false;
  }

  private isWhitelistedMessage(message: string): boolean {
    const normalized = message.trim().toLowerCase();
    return GUARDRAIL_CONFIG.whitelist.some((keyword) =>
      normalized.includes(keyword.toLowerCase())
    );
  }

  /**
   * 频率限制检查
   */
  private checkRateLimit(key: string): GuardResult | null {
    const now = Date.now();
    const entry = this.rateLimitMap.get(key);

    if (!entry || now > entry.resetAt) {
      return null; // 没有超限
    }

    if (entry.count >= GUARDRAIL_CONFIG.rateLimitPerMinute) {
      entry.blockedCount++;
      return this.buildResult({
        ruleId: "sys-ratelimit",
        threatLevel: "high",
        strategy: "block",
        reason: "频率限制：短时间内触发安全规则过多",
        category: "manipulation-blocked",
      });
    }

    return null;
  }

  private incrementRateLimit(key: string): void {
    const now = Date.now();
    const entry = this.rateLimitMap.get(key);

    if (!entry || now > entry.resetAt) {
      this.rateLimitMap.set(key, {
        count: 1,
        resetAt: now + 60_000,
        blockedCount: 0,
      });
    } else {
      entry.count++;
    }
  }

  private checkComboAttack(
    context: GuardContext,
    _currentRule: GuardRule
  ): boolean {
    if (!context.history || context.history.length === 0) return false;

    const recentUserMessages = context.history
      .slice(-GUARDRAIL_CONFIG.comboAttackWindow)
      .filter((m) => m.role === "user")
      .map((m) => m.content);

    let matchCount = 0;
    for (const msg of recentUserMessages) {
      for (const rule of this.rules) {
        if (this.matchesRule(msg, rule)) {
          matchCount++;
          break;
        }
      }
    }

    return matchCount >= 2;
  }

  private elevateThreat(level: ThreatLevel): ThreatLevel {
    const levels: ThreatLevel[] = ["low", "medium", "high", "critical"];
    const currentIndex = levels.indexOf(level);
    if (currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }
    return level;
  }

  private checkHistoryThreat(context: GuardContext): GuardResult | null {
    if (!context.history || context.history.length < 3) return null;

    const recentMessages = context.history.slice(-6);
    const userMessages = recentMessages
      .filter((m) => m.role === "user")
      .map((m) => m.content);

    let probeCount = 0;
    for (const msg of userMessages) {
      for (const rule of this.rules) {
        if (this.matchesRule(msg, rule)) {
          probeCount++;
          break;
        }
      }
    }

    if (probeCount >= GUARDRAIL_CONFIG.probeDetectionThreshold) {
      const response = getRandomResponse("manipulation-blocked");
      return {
        blocked: true,
        threatLevel: "high",
        strategy: "deflect",
        reason: "检测到渐进式探测攻击模式",
        response,
        shouldLog: this.logEnabled,
      };
    }

    return null;
  }

  private buildResult(opts: {
    ruleId: string;
    threatLevel: ThreatLevel;
    strategy: GuardRule["strategy"];
    reason: string;
    category: ResponseCategory;
  }): GuardResult {
    const response = getRandomResponse(opts.category);
    const displayResponse =
      this.logEnabled
        ? `${getThreatPrefix(opts.threatLevel)} [Guardrail:${opts.ruleId}] ${response}`
        : response;

    return {
      blocked: true,
      ruleId: opts.ruleId,
      threatLevel: opts.threatLevel,
      strategy: opts.strategy,
      reason: opts.reason,
      response: displayResponse,
      shouldLog: this.logEnabled,
    };
  }

  /**
   * 清洁输出（替换可能的敏感内容）
   */
  private sanitizeOutput(output: string): string {
    return output
      .replace(/sk-[A-Za-z0-9]{20,}/g, "[REDACTED_API_KEY]")
      .replace(/AIza[A-Za-z0-9_\-]{35}/g, "[REDACTED_API_KEY]")
      .replace(/-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY[\s\S]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g, "[REDACTED_PRIVATE_KEY]")
      .replace(/password\s*[:=]\s*["']?\w+/gi, "password: [REDACTED]")
      .replace(/\b192\.168\.\d{1,3}\.\d{1,3}/g, "[INTERNAL_IP]")
      .replace(/\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, "[INTERNAL_IP]");
  }

  /**
   * 记录安全事件（只记录哈希，不记录明文）
   */
  private recordSecurityEvent(opts: {
    ruleId: string;
    threatLevel: ThreatLevel;
    userId?: string;
    ip?: string;
    input: string;
  }): void {
    const event: SecurityEvent = {
      timestamp: new Date().toISOString(),
      ruleId: opts.ruleId,
      threatLevel: opts.threatLevel,
      userId: opts.userId,
      ip: opts.ip,
      inputHash: this.simpleHash(opts.input),
    };

    this.securityEvents.push(event);

    // 保持事件列表大小
    if (this.securityEvents.length > this.MAX_EVENTS) {
      this.securityEvents.shift();
    }
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private logThreat(
    rule: GuardRule,
    message: string,
    threatLevel: ThreatLevel
  ): void {
    const timestamp = new Date().toISOString();
    const prefix = getThreatPrefix(threatLevel);

    console.log(
      `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ MaoAI 安全围栏触发 v2.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ 时间: ${timestamp}
${prefix} 规则ID: ${rule.id}
📛 规则名: ${rule.name}
⚠️ 威胁等级: ${threatLevel}
🎯 策略: ${rule.strategy}
📝 用户输入: ${message.substring(0, 100)}${message.length > 100 ? "..." : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim()
    );
  }

  // ─────────────────────────────────────────
  // 公共管理 API
  // ─────────────────────────────────────────

  addRule(rule: GuardRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  getRules(): GuardRule[] {
    return [...this.rules];
  }

  /** 获取安全事件统计 */
  getSecurityStats(): {
    totalEvents: number;
    byThreatLevel: Record<string, number>;
    byRule: Record<string, number>;
  } {
    const byThreatLevel: Record<string, number> = {};
    const byRule: Record<string, number> = {};

    for (const event of this.securityEvents) {
      byThreatLevel[event.threatLevel] = (byThreatLevel[event.threatLevel] || 0) + 1;
      byRule[event.ruleId] = (byRule[event.ruleId] || 0) + 1;
    }

    return {
      totalEvents: this.securityEvents.length,
      byThreatLevel,
      byRule,
    };
  }

  /** 清除频率限制（用于测试） */
  clearRateLimit(key: string): void {
    this.rateLimitMap.delete(key);
  }
}

// 单例实例
let guardrailInstance: GuardrailEngine | null = null;

export function getGuardrailEngine(): GuardrailEngine {
  if (!guardrailInstance) {
    guardrailInstance = new GuardrailEngine();
  }
  return guardrailInstance;
}
