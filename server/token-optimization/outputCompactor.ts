/**
 * Output Compactor — 输出压缩器
 *
 * 灵感来源：Claw-Compactor (open-compress/claw-compactor)
 * 14 阶段融合管线简化为 6 阶段，适配 MaoAI 场景：
 *
 *   Stage 1: ANSI/控制字符清理
 *   Stage 2: 重复行折叠
 *   Stage 3: 路径简化（绝对路径 → 相对/短路径）
 *   Stage 4: 时间戳标准化
 *   Stage 5: 错误堆栈压缩
 *   Stage 6: 智能截断
 *
 * 主要用于压缩工具调用结果（run_shell、run_code 的输出），
 * 在写入 conversationMessages 之前应用。
 */

export interface CompactOptions {
  /** 工具输出最大字符数 */
  maxOutputChars?: number;
  /** 是否启用路径简化 */
  simplifyPaths?: boolean;
  /** 是否折叠重复行 */
  foldDuplicates?: boolean;
  /** 是否压缩错误堆栈 */
  compactStackTraces?: boolean;
  /** 是否标准化时间戳 */
  normalizeTimestamps?: boolean;
}

export interface CompactResult {
  /** 压缩后的文本 */
  text: string;
  /** 原始字符数 */
  originalChars: number;
  /** 压缩后字符数 */
  compactedChars: number;
  /** 估计节省的 token 数 */
  savedTokens: number;
  /** 各阶段压缩率 */
  stageStats: Record<string, { before: number; after: number }>;
}

// ANSI 转义序列
const ANSI_ESCAPE = /\x1b\[[0-9;]*[a-zA-Z]|\x1b\].*?(?:\x07|\x1b\\)/g;
// 控制字符（保留换行和制表符）
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
// 绝对路径模式（macOS/Linux）
const ABS_PATH = /\/Users\/[^/\s]+|\/home\/[^/\s]+|\/var\/[^/\s]+|C:\\Users\\[^\\s]+/g;
// 时间戳格式
const TIMESTAMP_ISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[.\d]*Z?/g;
const TIMESTAMP_LOG = /\d{2}:\d{2}:\d{2}[.\d]*/g;
// 堆栈跟踪
const STACK_TRACE = /(?:at\s+\S+\s+\()?[^\s(]+\.js:\d+:\d+\)?/g;
// 重复行
const DUPLICATE_LINES: unique symbol = Symbol("DUPLICATE_LINES");

export class OutputCompactor {
  private options: Required<CompactOptions>;

  constructor(options: CompactOptions = {}) {
    this.options = {
      maxOutputChars: options.maxOutputChars ?? 8000,
      simplifyPaths: options.simplifyPaths ?? true,
      foldDuplicates: options.foldDuplicates ?? true,
      compactStackTraces: options.compactStackTraces ?? true,
      normalizeTimestamps: options.normalizeTimestamps ?? true,
    };
  }

  /**
   * 压缩工具输出
   */
  compact(text: string, toolName?: string): CompactResult {
    if (!text || typeof text !== "string") {
      return { text: text || "", originalChars: 0, compactedChars: 0, savedTokens: 0, stageStats: {} };
    }

    const originalChars = text.length;
    const stageStats: Record<string, { before: number; after: number }> = {};
    let result = text;

    // Stage 1: ANSI/控制字符清理
    const s1Before = result.length;
    result = this.cleanAnsi(result);
    stageStats["clean_ansi"] = { before: s1Before, after: result.length };

    // Stage 2: 重复行折叠
    if (this.options.foldDuplicates) {
      const s2Before = result.length;
      result = this.foldDuplicateLines(result);
      stageStats["fold_duplicates"] = { before: s2Before, after: result.length };
    }

    // Stage 3: 路径简化
    if (this.options.simplifyPaths) {
      const s3Before = result.length;
      result = this.simplifyPaths(result);
      stageStats["simplify_paths"] = { before: s3Before, after: result.length };
    }

    // Stage 4: 时间戳标准化
    if (this.options.normalizeTimestamps) {
      const s4Before = result.length;
      result = this.normalizeTimestamps(result);
      stageStats["normalize_timestamps"] = { before: s4Before, after: result.length };
    }

    // Stage 5: 错误堆栈压缩
    if (this.options.compactStackTraces) {
      const s5Before = result.length;
      result = this.compactStackTraces(result);
      stageStats["compact_stacktraces"] = { before: s5Before, after: result.length };
    }

    // Stage 6: 智能截断
    if (result.length > this.options.maxOutputChars) {
      const s6Before = result.length;
      result = this.smartTruncateOutput(result, this.options.maxOutputChars);
      stageStats["smart_truncate"] = { before: s6Before, after: result.length };
    }

    const compactedChars = result.length;
    const savedTokens = Math.floor((originalChars - compactedChars) / 4);

    return { text: result, originalChars, compactedChars, savedTokens, stageStats };
  }

  /**
   * Stage 1: 清理 ANSI 转义序列和控制字符
   */
  private cleanAnsi(text: string): string {
    return text
      .replace(ANSI_ESCAPE, "")
      .replace(CONTROL_CHARS, "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
  }

  /**
   * Stage 2: 折叠重复行
   * 连续 3+ 行相同内容只保留 1 行 + [重复 N 行]
   */
  private foldDuplicateLines(text: string): string {
    const lines = text.split("\n");
    const result: string[] = [];
    let prevLine = "";
    let repeatCount = 0;

    for (const line of lines) {
      if (line === prevLine) {
        repeatCount++;
      } else {
        if (repeatCount >= 3) {
          result.push(`  [... 重复 ${repeatCount} 行 ...]`);
        } else if (repeatCount > 0) {
          for (let i = 0; i < repeatCount; i++) result.push(prevLine);
        }
        result.push(line);
        prevLine = line;
        repeatCount = 0;
      }
    }

    // 处理末尾重复
    if (repeatCount >= 3) {
      result.push(`  [... 重复 ${repeatCount} 行 ...]`);
    } else if (repeatCount > 0) {
      for (let i = 0; i < repeatCount; i++) result.push(prevLine);
    }

    return result.join("\n");
  }

  /**
   * Stage 3: 简化路径
   * /Users/daiyan/Desktop/project/... → ~/project/...
   */
  private simplifyPaths(text: string): string {
    return text
      .replace(/\/Users\/[^/\s]+/g, "~")
      .replace(/\/home\/[^/\s]+/g, "~")
      .replace(/C:\\Users\\[^\\s]+/g, "~")
      .replace(/\/var\/log\//g, "/var/log/");
  }

  /**
   * Stage 4: 标准化时间戳
   * 2024-01-15T14:30:00.123Z → [TIMESTAMP]
   * 14:30:00.123 → [TIME]
   */
  private normalizeTimestamps(text: string): string {
    return text
      .replace(TIMESTAMP_ISO, "[TIMESTAMP]")
      .replace(TIMESTAMP_LOG, "[TIME]");
  }

  /**
   * Stage 5: 压缩错误堆栈
   * 只保留前 3 层和最后 1 层，中间用 [...] 替代
   */
  private compactStackTraces(text: string): string {
    // 匹配完整的 Error 堆栈块
    return text.replace(
      /(Error:.*)\n((?:\s+at\s+.+\n?)+)/g,
      (_match, errorLine: string, stack: string) => {
        const frames = stack.trim().split("\n").filter(Boolean);
        if (frames.length <= 4) {
          return errorLine + "\n" + stack;
        }
        const top = frames.slice(0, 3);
        const bottom = frames.slice(-1);
        return errorLine + "\n" + top.join("\n") + "\n  [... " + (frames.length - 4) + " frames omitted ...]\n" + bottom.join("\n");
      }
    );
  }

  /**
   * Stage 6: 智能截断
   * 保留首尾关键信息，中间省略
   */
  private smartTruncateOutput(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;

    const headLen = Math.floor(maxLen * 0.75);
    const tailLen = Math.floor(maxLen * 0.2);
    const head = text.slice(0, headLen);
    const tail = text.slice(-tailLen);
    const omitted = text.length - headLen - tailLen;

    return head + `\n\n... [省略 ${omitted} 字符] ...\n\n` + tail;
  }
}
