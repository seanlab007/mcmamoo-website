/**
 * MaoAI 前端安全围栏
 * 
 * 在前端进行初步检查，减少不必要的API调用
 * 覆盖常见的探测模式
 */

/**
 * 前端可检测的敏感模式
 * 注意：前端检查不能替代后端检查，仅用于优化
 */
export const FRONTEND_SENSITIVE_PATTERNS = [
  // 系统提示词相关
  /system\s*prompt/i,
  /系统提示词/i,
  /system\s*instruction/i,
  /元提示/i,
  
  // 架构相关
  /架构设计/i,
  /architecture/i,
  /内部实现/i,
  /triad/i,
  /三权分立/i,
  /破壁者/i,
  
  // 诱导攻击
  /ignore.*previous/i,
  /disregard.*all/i,
  /绕过.*安全/i,
  /jailbreak/i,
  /越狱/i,
  
  // 凭证相关
  /api[_-]?key/i,
  /API.*key/i,
  /密钥/i,
  /secret/i,
  /token/i,
];

/**
 * 检查消息是否包含敏感内容
 */
export function isSensitiveMessage(message: string): boolean {
  const normalized = message.trim();
  return FRONTEND_SENSITIVE_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * 获取友好的前端提示
 */
export function getFrontendWarning(): {
  show: boolean;
  title: string;
  message: string;
} {
  return {
    show: true,
    title: "⚠️ 问题可能无法回答",
    message:
      "您的问题可能涉及系统内部信息，这类问题MaoAI无法回答。建议您尝试其他方向，或者直接描述您想完成的任务。",
  };
}

/**
 * 在发送前预处理消息
 * 返回 null 表示消息可以发送，否则返回拒绝原因
 */
export function preprocessMessage(
  message: string
): { allowed: boolean; reason?: string } {
  if (isSensitiveMessage(message)) {
    return {
      allowed: false,
      reason: "您的问题可能涉及系统内部信息，请换个角度提问。",
    };
  }

  // 超长消息检查（可能的探测）
  if (message.length > 5000) {
    return {
      allowed: false,
      reason: "消息过长，请精简您的问题。",
    };
  }

  // 重复内容检查
  const uniqueChars = new Set(message).size;
  if (uniqueChars < message.length * 0.3 && message.length > 100) {
    return {
      allowed: false,
      reason: "检测到重复内容，请重新组织您的问题。",
    };
  }

  return { allowed: true };
}
