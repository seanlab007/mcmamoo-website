/**
 * MaoAI 安全围栏检测引擎
 * 
 * 核心功能：
 * 1. 多层规则匹配
 * 2. 威胁等级计算
 * 3. 策略执行
 * 4. 镜像重构响应
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
  strategy?: "mirror" | "redirect" | "deflect" | "block";
  /** 拦截原因 */
  reason?: string;
  /** 响应内容 */
  response?: string;
  /** 是否记录日志 */
  shouldLog: boolean;
}

export interface GuardContext {
  /** 用户输入 */
  userMessage: string;
  /** 对话历史 */
  history?: Array<{ role: string; content: string }>;
  /** 用户ID（可选） */
  userId?: string;
  /** 是否为白名单用户 */
  isWhitelisted?: boolean;
}

/**
 * 安全围栏引擎
 */
export class GuardrailEngine {
  private rules: GuardRule[];
  private enabled: boolean;
  private logEnabled: boolean;

  constructor() {
    this.rules = ALL_GUARD_RULES;
    this.enabled = GUARDRAIL_CONFIG.enabled;
    this.logEnabled = GUARDRAIL_CONFIG.logEnabled;
  }

  /**
   * 执行安全检查
   */
  check(context: GuardContext): GuardResult {
    // 如果围栏未启用，直接通过
    if (!this.enabled) {
      return { blocked: false, shouldLog: false };
    }

    const { userMessage, isWhitelisted } = context;

    // 白名单用户跳过检查
    if (isWhitelisted) {
      return { blocked: false, shouldLog: false };
    }

    // 白名单关键词检查
    if (this.isWhitelistedMessage(userMessage)) {
      return { blocked: false, shouldLog: false };
    }

    // 执行规则匹配
    for (const rule of this.rules) {
      if (this.matchesRule(userMessage, rule)) {
        // 检查是否是组合攻击（历史记录中有可疑内容）
        const isComboAttack = this.checkComboAttack(context, rule);
        
        // 计算最终威胁等级
        const finalThreatLevel = isComboAttack 
          ? this.elevateThreat(rule.threatLevel) 
          : rule.threatLevel;

        // 记录日志（开发环境）
        if (this.logEnabled) {
          this.logThreat(rule, userMessage, finalThreatLevel);
        }

        // 根据策略生成响应
        const response = this.generateResponse(rule, finalThreatLevel);

        return {
          blocked: true,
          ruleId: rule.id,
          threatLevel: finalThreatLevel,
          strategy: rule.strategy,
          reason: `匹配规则: ${rule.name}`,
          response,
          shouldLog: this.logEnabled,
        };
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
   * 检查消息是否匹配规则
   */
  private matchesRule(message: string, rule: GuardRule): boolean {
    for (const pattern of rule.patterns) {
      if (typeof pattern === "string") {
        // 关键词匹配
        if (message.includes(pattern)) {
          return true;
        }
      } else {
        // 正则匹配
        if (pattern.test(message)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 检查是否为白名单消息
   */
  private isWhitelistedMessage(message: string): boolean {
    const normalized = message.trim().toLowerCase();
    return GUARDRAIL_CONFIG.whitelist.some(
      (keyword) => normalized.includes(keyword.toLowerCase())
    );
  }

  /**
   * 检查是否为组合攻击（跨多条消息）
   */
  private checkComboAttack(
    context: GuardContext,
    currentRule: GuardRule
  ): boolean {
    if (!context.history || context.history.length === 0) {
      return false;
    }

    // 获取最近5条用户消息
    const recentUserMessages = context.history
      .slice(-5)
      .filter((m) => m.role === "user")
      .map((m) => m.content);

    // 检查是否有多个规则被触发
    let matchCount = 0;
    for (const msg of recentUserMessages) {
      for (const rule of this.rules) {
        if (this.matchesRule(msg, rule)) {
          matchCount++;
        }
      }
    }

    // 如果最近有2+次匹配，判定为组合攻击
    return matchCount >= 2;
  }

  /**
   * 提升威胁等级
   */
  private elevateThreat(level: ThreatLevel): ThreatLevel {
    const levels: ThreatLevel[] = ["low", "medium", "high", "critical"];
    const currentIndex = levels.indexOf(level);
    if (currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }
    return level;
  }

  /**
   * 检查历史记录中的潜在威胁
   */
  private checkHistoryThreat(context: GuardContext): GuardResult | null {
    if (!context.history || context.history.length < 3) {
      return null;
    }

    // 获取最近的用户消息序列
    const recentMessages = context.history.slice(-6);
    const userMessages = recentMessages
      .filter((m) => m.role === "user")
      .map((m) => m.content);

    // 检测"渐进式探测"模式
    // 如果连续3条以上的消息都在试探边界，可能是探测攻击
    let probeCount = 0;
    for (const msg of userMessages) {
      for (const rule of this.rules) {
        if (this.matchesRule(msg, rule)) {
          probeCount++;
          break;
        }
      }
    }

    if (probeCount >= 3) {
      // 渐进式探测攻击
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

  /**
   * 生成响应
   */
  private generateResponse(
    rule: GuardRule,
    threatLevel: ThreatLevel
  ): string {
    const response = getRandomResponse(rule.responseCategory as ResponseCategory);
    
    // 在开发环境中添加调试前缀
    if (this.logEnabled) {
      const prefix = getThreatPrefix(threatLevel);
      return `${prefix} [Guardrail:${rule.id}] ${response}`;
    }

    return response;
  }

  /**
   * 记录威胁日志
   */
  private logThreat(
    rule: GuardRule,
    message: string,
    threatLevel: ThreatLevel
  ): void {
    const timestamp = new Date().toISOString();
    const prefix = getThreatPrefix(threatLevel);
    
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ MaoAI 安全围栏触发
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ 时间: ${timestamp}
🔴 规则ID: ${rule.id}
📛 规则名: ${rule.name}
⚠️ 威胁等级: ${threatLevel}
🎯 策略: ${rule.strategy}
📝 用户输入: ${message.substring(0, 200)}${message.length > 200 ? "..." : ""}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim());
  }

  /**
   * 添加自定义规则（运行时）
   */
  addRule(rule: GuardRule): void {
    this.rules.push(rule);
  }

  /**
   * 移除规则
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取当前所有规则
   */
  getRules(): GuardRule[] {
    return [...this.rules];
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
