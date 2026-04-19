/**
 * MaoAI 前端安全围栏 v2.0
 *
 * 职责：在前端进行初步检查，减少不必要的API调用
 * 注意：前端检查不能替代后端检查，仅用于优化 UX
 *
 * v2.0 新增：
 *   - 编码混淆检测（Unicode零宽字符）
 *   - 思维链劫持检测
 *   - 代码注入快速检测
 *   - 重复字符攻击检测
 *   - 消息长度异常检测
 */

/**
 * 前端可检测的敏感模式（仅用于 UX 提示，不替代后端）
 */
export const FRONTEND_SENSITIVE_PATTERNS: Array<{
  pattern: RegExp;
  hint: string;
}> = [
  // ── 系统提示词相关 ──
  { pattern: /system\s*prompt/i, hint: "请避免询问系统内部指令" },
  { pattern: /系统提示词/i, hint: "请避免询问系统内部指令" },
  { pattern: /system\s*instruction/i, hint: "请避免询问系统内部指令" },
  { pattern: /元提示/i, hint: "请避免询问系统内部指令" },

  // ── 架构相关 ──
  { pattern: /架构设计/i, hint: "系统架构属于内部信息" },
  { pattern: /内部实现/i, hint: "系统架构属于内部信息" },
  { pattern: /triad/i, hint: "系统架构属于内部信息" },
  { pattern: /三权分立/i, hint: "系统架构属于内部信息" },
  { pattern: /破壁者/i, hint: "系统架构属于内部信息" },

  // ── 越狱/注入攻击 ──
  { pattern: /ignore.*previous/i, hint: "该内容可能被安全系统拦截" },
  { pattern: /disregard.*all/i, hint: "该内容可能被安全系统拦截" },
  { pattern: /绕过.*安全/i, hint: "该内容可能被安全系统拦截" },
  { pattern: /jailbreak/i, hint: "该内容可能被安全系统拦截" },
  { pattern: /越狱/i, hint: "该内容可能被安全系统拦截" },
  { pattern: /DAN.*mode/i, hint: "该内容可能被安全系统拦截" },
  { pattern: /developer.*mode/i, hint: "该内容可能被安全系统拦截" },
  { pattern: /上帝模式/i, hint: "该内容可能被安全系统拦截" },

  // ── 凭证相关 ──
  { pattern: /api[_-]?key/i, hint: "凭证信息不能通过对话获取" },
  { pattern: /API.*key/i, hint: "凭证信息不能通过对话获取" },
  { pattern: /密钥/i, hint: "凭证信息不能通过对话获取" },
  { pattern: /access.*token/i, hint: "凭证信息不能通过对话获取" },

  // ── Unicode零宽字符 ──
  { pattern: /\u200b|\u200c|\u200d|\ufeff/, hint: "检测到异常字符，请清理后重试" },

  // ── 代码注入快速检测 ──
  { pattern: /rm\s+-rf/i, hint: "检测到危险命令" },
  { pattern: /drop\s+table/i, hint: "检测到危险SQL命令" },
  { pattern: /exec\s*\(/i, hint: "检测到代码执行指令" },
  { pattern: /eval\s*\(/i, hint: "检测到代码执行指令" },
];

/**
 * 检查消息是否包含敏感内容
 * 返回命中的规则提示，null 表示安全
 */
export function checkSensitiveMessage(message: string): string | null {
  const normalized = message.trim();
  for (const { pattern, hint } of FRONTEND_SENSITIVE_PATTERNS) {
    if (pattern.test(normalized)) {
      return hint;
    }
  }
  return null;
}

/**
 * 简单兼容性函数（v1 API）
 */
export function isSensitiveMessage(message: string): boolean {
  return checkSensitiveMessage(message) !== null;
}

/**
 * 获取友好的前端提示
 */
export function getFrontendWarning(hint?: string): {
  show: boolean;
  title: string;
  message: string;
} {
  return {
    show: true,
    title: "⚠️ 问题可能无法回答",
    message:
      hint ||
      "您的问题可能涉及系统内部信息，这类问题MaoAI无法回答。建议您尝试其他方向，或者直接描述您想完成的任务。",
  };
}

/**
 * 消息预处理 v2.0
 * 返回 { allowed: true } 表示消息可以发送
 */
export function preprocessMessage(
  message: string
): { allowed: boolean; reason?: string; hint?: string } {
  // 1. 超长消息检查（可能的长距离注入）
  if (message.length > 8000) {
    return {
      allowed: false,
      reason: "消息过长，请精简您的问题。",
    };
  }

  // 2. 重复内容检查（可能的注意力稀释攻击）
  const uniqueChars = new Set(message).size;
  if (uniqueChars < message.length * 0.3 && message.length > 100) {
    return {
      allowed: false,
      reason: "检测到大量重复内容，请重新组织您的问题。",
    };
  }

  // 3. Unicode零宽字符检测
  if (/\u200b|\u200c|\u200d|\ufeff/.test(message)) {
    return {
      allowed: false,
      reason: "消息中包含异常隐藏字符，请清理后重试。",
    };
  }

  // 4. 敏感内容检查
  const hint = checkSensitiveMessage(message);
  if (hint) {
    return {
      allowed: false,
      reason: "您的问题可能涉及系统内部信息，请换个角度提问。",
      hint,
    };
  }

  // 5. 代码注入快速阻断
  const dangerousCodePatterns = [
    /rm\s+-rf\s+[\/~]/,
    /drop\s+(?:table|database)/i,
    /exec\s*\(\s*["'].*rm/i,
    /;\s*SELECT\s+\*\s+FROM/i,
  ];
  for (const pattern of dangerousCodePatterns) {
    if (pattern.test(message)) {
      return {
        allowed: false,
        reason: "消息包含危险代码模式，已被安全拦截。",
      };
    }
  }

  return { allowed: true };
}

/**
 * 实时输入监控（用于输入框 onChange 事件）
 * 返回风险等级：safe / warn / danger
 */
export function getInputRiskLevel(
  message: string
): "safe" | "warn" | "danger" {
  if (!message || message.length < 10) return "safe";

  // danger 级别
  const dangerPatterns = [
    /jailbreak/i,
    /越狱/i,
    /ignore.*previous.*instructions/i,
    /DAN.*mode/i,
    /drop\s+table/i,
    /rm\s+-rf/i,
    /\u200b|\u200c|\u200d|\ufeff/,
  ];
  for (const p of dangerPatterns) {
    if (p.test(message)) return "danger";
  }

  // warn 级别
  const warnPatterns = [
    /system\s*prompt/i,
    /api[_-]?key/i,
    /密钥/i,
    /架构设计/i,
    /内部实现/i,
    /破壁者/i,
    /绕过.*安全/i,
  ];
  for (const p of warnPatterns) {
    if (p.test(message)) return "warn";
  }

  return "safe";
}
