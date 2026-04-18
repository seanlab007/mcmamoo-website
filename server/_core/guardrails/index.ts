/**
 * MaoAI 安全围栏 - 统一导出
 * 
 * 使用方式：
 * ```typescript
 * import { guardMessage } from "./_core/guardrails";
 * 
 * const result = guardMessage(userMessage, { history });
 * if (result.blocked) {
 *   return result.response; // 返回安全响应
 * }
 * ```
 */

export {
  GuardrailEngine,
  getGuardrailEngine,
} from "./guardrail-engine";

export type { GuardResult, GuardContext } from "./guardrail-engine";

export {
  GUARDRAIL_CONFIG,
  ALL_GUARD_RULES,
  CORE_SECRETS_RULES,
  MANIPULATION_RULES,
  TOOL_PROBE_RULES,
  COMPETITOR_RULES,
  SELF_AWARENESS_RULES,
} from "./guardrail-config";

export type { GuardRule, ThreatLevel } from "./guardrail-config";

export {
  RESPONSE_TEMPLATES,
  getRandomResponse,
  getThreatPrefix,
} from "./response-templates";

export type { ResponseCategory } from "./response-templates";

/**
 * 便捷函数：直接检查消息
 */
import { getGuardrailEngine } from "./guardrail-engine";
import type { GuardContext } from "./guardrail-engine";

export function guardMessage(
  userMessage: string,
  options?: {
    history?: Array<{ role: string; content: string }>;
    userId?: string;
    isWhitelisted?: boolean;
  }
) {
  const engine = getGuardrailEngine();
  const context: GuardContext = {
    userMessage,
    history: options?.history,
    userId: options?.userId,
    isWhitelisted: options?.isWhitelisted,
  };
  return engine.check(context);
}
