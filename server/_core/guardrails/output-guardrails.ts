/**
 * MaoAI 输出审计模块（Output Guardrails）
 *
 * 对标 Manus 的 Output Guardrails 设计
 * 职责：扫描AI生成的每一条回复，防止：
 *   1. 系统提示词/内部指令泄露
 *   2. API密钥/凭证意外输出
 *   3. 内网地址/端口泄露
 *   4. 私钥/证书泄露
 *   5. 用户隐私数据泄露
 *   6. 内部架构细节泄露
 *
 * 使用方式：
 *   import { scanOutput } from "./_core/guardrails/output-guardrails";
 *   const result = scanOutput(aiResponse);
 *   if (!result.safe) {
 *     return result.sanitized; // 使用清洁后的版本
 *   }
 */

export interface OutputScanResult {
  /** 是否安全（无敏感信息） */
  safe: boolean;
  /** 触发的规则ID（如有） */
  ruleId?: string;
  /** 检测到的敏感内容类型 */
  sensitiveType?: string;
  /** 清洁后的输出 */
  sanitized: string;
  /** 是否做了替换 */
  modified: boolean;
}

interface OutputRule {
  id: string;
  name: string;
  patterns: RegExp[];
  replacement: string | ((match: string) => string);
  /** 是否需要完全阻断（true = 阻断，false = 替换继续） */
  shouldBlock: boolean;
}

/**
 * 输出扫描规则集
 */
const OUTPUT_RULES: OutputRule[] = [
  // ── 凭证类 ──────────────────────────────
  {
    id: "out-cred-001",
    name: "OpenAI API Key",
    patterns: [/sk-[A-Za-z0-9]{20,}/g],
    replacement: "[REDACTED_API_KEY]",
    shouldBlock: false,
  },
  {
    id: "out-cred-002",
    name: "Google API Key",
    patterns: [/AIza[A-Za-z0-9_\-]{35}/g],
    replacement: "[REDACTED_API_KEY]",
    shouldBlock: false,
  },
  {
    id: "out-cred-003",
    name: "私钥证书",
    patterns: [
      /-----BEGIN\s+(?:RSA\s+)?(?:PRIVATE|PUBLIC)\s+KEY[\s\S]*?-----END\s+(?:RSA\s+)?(?:PRIVATE|PUBLIC)\s+KEY-----/g,
      /-----BEGIN\s+CERTIFICATE[\s\S]*?-----END\s+CERTIFICATE-----/g,
    ],
    replacement: "[REDACTED_CERTIFICATE]",
    shouldBlock: false,
  },
  {
    id: "out-cred-004",
    name: "Bearer Token",
    patterns: [/Bearer\s+[A-Za-z0-9\-_\.]+\.[A-Za-z0-9\-_\.]+\.[A-Za-z0-9\-_\.]+/g],
    replacement: "Bearer [REDACTED_TOKEN]",
    shouldBlock: false,
  },
  {
    id: "out-cred-005",
    name: "数据库连接串",
    patterns: [
      /(?:postgres|mysql|mongodb|redis):\/\/[^\s"']+/gi,
      /password\s*[=:]\s*["']?[A-Za-z0-9!@#$%^&*()_+\-=]{8,}["']?/gi,
    ],
    replacement: "[REDACTED_DB_CREDENTIAL]",
    shouldBlock: false,
  },
  {
    id: "out-cred-006",
    name: "AWS/云服务凭证",
    patterns: [
      /AKIA[A-Z0-9]{16}/g,           // AWS Access Key
      /aws_secret_access_key\s*=\s*\S+/gi,
      /supabase.*key.*=.*["'][A-Za-z0-9.]+["']/gi,
    ],
    replacement: "[REDACTED_CLOUD_KEY]",
    shouldBlock: false,
  },

  // ── 内网地址类 ──────────────────────────
  {
    id: "out-net-001",
    name: "内网IPv4地址",
    patterns: [
      /\b192\.168\.\d{1,3}\.\d{1,3}:\d{2,5}\b/g,
      /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{2,5}\b/g,
      /\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}:\d{2,5}\b/g,
    ],
    replacement: "[INTERNAL_ADDRESS]",
    shouldBlock: false,
  },
  {
    id: "out-net-002",
    name: "AWS Metadata端点",
    patterns: [/169\.254\.169\.254/g],
    replacement: "[BLOCKED_METADATA_ENDPOINT]",
    shouldBlock: true,
  },
  {
    id: "out-net-003",
    name: "本地开发端口",
    patterns: [/localhost:\d{4,5}/g, /127\.0\.0\.1:\d{4,5}/g],
    replacement: "[LOCAL_ENDPOINT]",
    shouldBlock: false,
  },

  // ── 系统指令泄露 ─────────────────────────
  {
    id: "out-sys-001",
    name: "系统标签泄露",
    patterns: [
      /<system>[\s\S]*?<\/system>/gi,
      /\[system\]\s*[\s\S]*?\[\/system\]/gi,
      /##\s*system\s*##[\s\S]*?##\s*end\s*##/gi,
    ],
    replacement: "[SYSTEM_CONTENT_REDACTED]",
    shouldBlock: true,
  },
  {
    id: "out-sys-002",
    name: "角色扮演指令泄露",
    patterns: [
      /you\s+are\s+(?:a|an)\s+AI\s+assistant\s+(?:called|named)\s+\w+/gi,
      /your\s+name\s+is\s+\w+\s+and\s+you\s+(?:are|must|should)/gi,
    ],
    replacement: "[ROLE_INSTRUCTION_REDACTED]",
    shouldBlock: false,
  },

  // ── 环境变量 ─────────────────────────────
  {
    id: "out-env-001",
    name: "环境变量值泄露",
    patterns: [
      /(?:OPENAI|ANTHROPIC|DEEPSEEK|ZHIPU|GROQ|GEMINI)_API_KEY\s*[=:]\s*["']?[A-Za-z0-9\-_]{10,}["']?/gi,
      /NODE_ENV\s*=\s*["']?(?:production|development)["']?/gi,
    ],
    replacement: "[ENV_VAR_REDACTED]",
    shouldBlock: false,
  },
];

/**
 * 扫描AI输出内容
 */
export function scanOutput(output: string): OutputScanResult {
  let sanitized = output;
  let modified = false;
  let triggeredRule: OutputRule | undefined;

  for (const rule of OUTPUT_RULES) {
    for (const pattern of rule.patterns) {
      // 重置正则状态
      pattern.lastIndex = 0;

      if (pattern.test(output)) {
        // 重置再替换
        pattern.lastIndex = 0;
        const before = sanitized;
        sanitized = sanitized.replace(
          pattern,
          typeof rule.replacement === "function"
            ? rule.replacement
            : rule.replacement
        );

        if (sanitized !== before) {
          modified = true;
          if (!triggeredRule) triggeredRule = rule;
        }

        // 如果需要完全阻断，直接返回通用安全响应
        if (rule.shouldBlock) {
          return {
            safe: false,
            ruleId: rule.id,
            sensitiveType: rule.name,
            sanitized: "抱歉，此回复包含系统不允许输出的内容，已被安全过滤。请重新提问。",
            modified: true,
          };
        }
      }
    }
  }

  return {
    safe: !modified,
    ruleId: triggeredRule?.id,
    sensitiveType: triggeredRule?.name,
    sanitized,
    modified,
  };
}

/**
 * 快速检查输出是否安全（不修改内容）
 */
export function isOutputSafe(output: string): boolean {
  return scanOutput(output).safe;
}

/**
 * 对流式输出进行逐块扫描
 * 适用于 SSE/WebSocket 流式响应
 */
export function scanOutputChunk(
  chunk: string,
  buffer: string
): { safe: boolean; sanitizedChunk: string; updatedBuffer: string } {
  // 将新块加入缓冲区
  const combined = buffer + chunk;

  // 扫描缓冲区
  const result = scanOutput(combined);

  if (!result.safe) {
    return {
      safe: false,
      sanitizedChunk: result.sanitized.slice(buffer.length),
      updatedBuffer: result.sanitized,
    };
  }

  return {
    safe: true,
    sanitizedChunk: chunk,
    updatedBuffer: combined.slice(-200), // 保留最后200字符作为上下文
  };
}
