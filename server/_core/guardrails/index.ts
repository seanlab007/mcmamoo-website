/**
 * MaoAI 安全围栏 v2.0 - 统一导出
 *
 * 架构：九层防护 + 输出审计 + 频率限制
 *
 * 使用示例：
 * ```typescript
 * import { guardMessage, scanOutput, checkRequestRateLimit } from "./_core/guardrails";
 *
 * // 1. 输入审计
 * const inputResult = guardMessage(userMessage, { history, userId, ip });
 * if (inputResult.blocked) {
 *   if (inputResult.terminateSession) { ... }
 *   return inputResult.response;
 * }
 *
 * // 2. 调用AI模型...
 * const aiResponse = await callModel(userMessage);
 *
 * // 3. 输出审计
 * const outputResult = scanOutput(aiResponse);
 * const safeResponse = outputResult.sanitized;
 * ```
 */

// ── 核心引擎 ──────────────────────────────
export {
  GuardrailEngine,
  getGuardrailEngine,
} from "./guardrail-engine";

export type { GuardResult, GuardContext, OutputGuardResult } from "./guardrail-engine";

// ── 规则配置 ──────────────────────────────
export {
  GUARDRAIL_CONFIG,
  ALL_GUARD_RULES,
  CORE_SECRETS_RULES,
  MANIPULATION_RULES,
  TOOL_PROBE_RULES,
  COMPETITOR_RULES,
  SELF_AWARENESS_RULES,
  ENCODING_BYPASS_RULES,
  COT_HIJACK_RULES,
  OUTPUT_POISON_RULES,
  ADVANCED_THREAT_RULES,
} from "./guardrail-config";

export type { GuardRule, ThreatLevel } from "./guardrail-config";

// ── 响应话术库 ────────────────────────────
export {
  RESPONSE_TEMPLATES,
  getRandomResponse,
  getThreatPrefix,
} from "./response-templates";

export type { ResponseCategory } from "./response-templates";

// ── 输出审计模块 ─────────────────────────
export {
  scanOutput,
  isOutputSafe,
  scanOutputChunk,
} from "./output-guardrails";

export type { OutputScanResult } from "./output-guardrails";

// ── 频率限制模块 ─────────────────────────
export {
  RateLimiter,
  getRateLimiter,
  checkSecurityRateLimit,
  checkRequestRateLimit,
  RATE_LIMIT_CONFIGS,
} from "./rate-limiter";

export type { RateLimitConfig, RateLimitResult } from "./rate-limiter";

// ── 前端模块 ─────────────────────────────
export {
  checkSensitiveMessage,
  isSensitiveMessage,
  getFrontendWarning,
  preprocessMessage,
  getInputRiskLevel,
  FRONTEND_SENSITIVE_PATTERNS,
} from "./client-guardrails";

// ── 便捷函数 ─────────────────────────────
import { getGuardrailEngine } from "./guardrail-engine";
import type { GuardContext } from "./guardrail-engine";
import { scanOutput } from "./output-guardrails";
import { checkSecurityRateLimit } from "./rate-limiter";

/**
 * 一站式输入安全检查（含频率限制）
 */
export function guardMessage(
  userMessage: string,
  options?: {
    history?: Array<{ role: string; content: string }>;
    userId?: string;
    ip?: string;
    isWhitelisted?: boolean;
  }
) {
  const engine = getGuardrailEngine();
  const context: GuardContext = {
    userMessage,
    history: options?.history,
    userId: options?.userId,
    ip: options?.ip,
    isWhitelisted: options?.isWhitelisted,
  };
  return engine.check(context);
}

/**
 * 一站式输出安全检查
 */
export function guardOutput(aiOutput: string) {
  return scanOutput(aiOutput);
}

/**
 * 完整的请求安全流水线（输入 + 频率检查）
 */
export function guardRequest(
  userMessage: string,
  options?: {
    history?: Array<{ role: string; content: string }>;
    userId?: string;
    ip?: string;
    isWhitelisted?: boolean;
  }
) {
  const rateKey = options?.userId || options?.ip || "anonymous";

  // 频率限制前置检查（查询不增加计数）
  const rateLimitPeek = getRateLimiter().peek(rateKey, RATE_LIMIT_CONFIGS.securityViolation);

  if (rateLimitPeek.limited) {
    return {
      blocked: true,
      ruleId: "sys-ratelimit",
      threatLevel: "high" as const,
      strategy: "block" as const,
      reason: "频率限制：请稍后再试",
      response: "您的请求频率过高，请稍等片刻后重试。",
      shouldLog: false,
    };
  }

  return guardMessage(userMessage, options);
}

import { getRateLimiter, RATE_LIMIT_CONFIGS } from "./rate-limiter";
