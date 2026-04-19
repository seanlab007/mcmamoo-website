/**
 * Output Compactor v2 — 输出压缩器
 *
 * 灵感来源：Claw-Compactor (open-compress/claw-compactor)
 * 14 阶段融合管线简化为 8 阶段，适配 MaoAI 场景：
 *
 *   Stage 1: ANSI/控制字符清理
 *   Stage 2: 重复行折叠
 *   Stage 3: 路径简化（绝对路径 → 相对/短路径）【v2: 跳过代码块内路径】
 *   Stage 4: 时间戳标准化
 *   Stage 5: 错误堆栈压缩
 *   Stage 6: JSON/结构化输出压缩【v2新增】
 *   Stage 7: 表格输出压缩【v2新增】
 *   Stage 8: 智能截断
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
  /** 是否压缩 JSON 输出 */
  compactJson?: boolean;
  /** 是否压缩表格输出 */
  compactTables?: boolean;
  /** JSON 输出最大保留字段数 */
  jsonMaxFields?: number;
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

// ─── 正则模式 ──────────────────────────────────────────────────────

// ANSI 转义序列
const ANSI_ESCAPE = /\x1b\[[0-9;]*[a-zA-Z]|\x1b\].*?(?:\x07|\x1b\\)/g;
// 控制字符（保留换行和制表符）
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
// 时间戳格式
const TIMESTAMP_ISO = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[.\d]*Z?/g;
const TIMESTAMP_LOG = /\d{2}:\d{2}:\d{2}[.\d]*/g;

export class OutputCompactor {
  private options: Required<CompactOptions>;

  constructor(options: CompactOptions = {}) {
    this.options = {
      maxOutputChars: options.maxOutputChars ?? 8000,
      simplifyPaths: options.simplifyPaths ?? true,
      foldDuplicates: options.foldDuplicates ?? true,
      compactStackTraces: options.compactStackTraces ?? true,
      normalizeTimestamps: options.normalizeTimestamps ?? true,
      compactJson: options.compactJson ?? true,
      compactTables: options.compactTables ?? true,
      jsonMaxFields: options.jsonMaxFields ?? 20,
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

    // Stage 3: 路径简化（跳过代码块内的路径）
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

    // Stage 6: JSON/结构化输出压缩
    if (this.options.compactJson) {
      const s6Before = result.length;
      result = this.compactJsonOutput(result);
      stageStats["compact_json"] = { before: s6Before, after: result.length };
    }

    // Stage 7: 表格输出压缩
    if (this.options.compactTables) {
      const s7Before = result.length;
      result = this.compactTableOutput(result);
      stageStats["compact_tables"] = { before: s7Before, after: result.length };
    }

    // Stage 8: 智能截断
    if (result.length > this.options.maxOutputChars) {
      const s8Before = result.length;
      result = this.smartTruncateOutput(result, this.options.maxOutputChars);
      stageStats["smart_truncate"] = { before: s8Before, after: result.length };
    }

    const compactedChars = result.length;
    const savedTokens = Math.floor((originalChars - compactedChars) / 4);

    return { text: result, originalChars, compactedChars, savedTokens, stageStats };
  }

  // ─── Stage 1: 清理 ANSI 转义序列和控制字符 ────────────────

  private cleanAnsi(text: string): string {
    return text
      .replace(ANSI_ESCAPE, "")
      .replace(CONTROL_CHARS, "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
  }

  // ─── Stage 2: 折叠重复行 ──────────────────────────────────

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

    if (repeatCount >= 3) {
      result.push(`  [... 重复 ${repeatCount} 行 ...]`);
    } else if (repeatCount > 0) {
      for (let i = 0; i < repeatCount; i++) result.push(prevLine);
    }

    return result.join("\n");
  }

  // ─── Stage 3: 简化路径（跳过代码块内路径）───────────────────

  private simplifyPaths(text: string): string {
    // 分离代码块和非代码块，只简化非代码块中的路径
    const parts: string[] = [];
    let inCodeBlock = false;
    let buffer = "";

    const lines = text.split("\n");
    for (const line of lines) {
      if (line.trimStart().startsWith("```")) {
        if (inCodeBlock) {
          // 结束代码块
          inCodeBlock = false;
          parts.push(buffer + line + "\n");
          buffer = "";
        } else {
          // 开始代码块前，先处理 buffer
          if (buffer) {
            parts.push(this.simplifyPathsInText(buffer));
            buffer = "";
          }
          inCodeBlock = true;
          parts.push(line + "\n");
        }
      } else if (inCodeBlock) {
        buffer += line + "\n";
      } else {
        parts.push(this.simplifyPathsInText(line) + "\n");
      }
    }

    if (buffer) parts.push(buffer);

    return parts.join("").replace(/\n$/, "");
  }

  private simplifyPathsInText(text: string): string {
    return text
      .replace(/\/Users\/[^/\s]+/g, "~")
      .replace(/\/home\/[^/\s]+/g, "~")
      .replace(/C:\\Users\\[^\\s]+/g, "~");
  }

  // ─── Stage 4: 标准化时间戳 ────────────────────────────────

  private normalizeTimestamps(text: string): string {
    return text
      .replace(TIMESTAMP_ISO, "[TIMESTAMP]")
      .replace(TIMESTAMP_LOG, "[TIME]");
  }

  // ─── Stage 5: 压缩错误堆栈 ────────────────────────────────

  private compactStackTraces(text: string): string {
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

  // ─── Stage 6: JSON/结构化输出压缩 ─────────────────────────

  /**
   * 压缩 JSON 输出：
   *   - 检测 JSON 块并解析
   *   - 如果是数组且超过阈值，只保留前后几条
   *   - 如果是对象且字段过多，只保留关键字段
   *   - 如果 JSON 解析失败，跳过
   */
  private compactJsonOutput(text: string): string {
    // 匹配独立的 JSON 块（被 ```json 包裹或独立出现的 JSON）
    return text.replace(
      /(```json\n)?([\[\{][\s\S]*?[\]\}])(\n```)?/g,
      (_match, open: string, jsonStr: string, close: string) => {
        try {
          const parsed = JSON.parse(jsonStr);

          if (Array.isArray(parsed)) {
            // 数组压缩：保留首尾几条
            if (parsed.length > 10) {
              const head = parsed.slice(0, 5);
              const tail = parsed.slice(-3);
              const compacted = [
                ...head,
                `... [省略 ${parsed.length - 8} 条]`,
                ...tail,
              ];
              const result = JSON.stringify(compacted, null, 0);
              return (open || "") + result + (close || "");
            }
            // 小数组：压缩为一行
            const result = JSON.stringify(parsed, null, 0);
            if (result.length < jsonStr.length) {
              return (open || "") + result + (close || "");
            }
          } else if (typeof parsed === "object" && parsed !== null) {
            // 对象压缩：只保留前 N 个字段
            const keys = Object.keys(parsed);
            if (keys.length > this.options.jsonMaxFields) {
              const kept: Record<string, any> = {};
              for (const key of keys.slice(0, this.options.jsonMaxFields)) {
                kept[key] = parsed[key];
              }
              kept["_truncated"] = `省略 ${keys.length - this.options.jsonMaxFields} 个字段`;
              const result = JSON.stringify(kept, null, 0);
              return (open || "") + result + (close || "");
            }
            // 小对象：压缩为一行
            const result = JSON.stringify(parsed, null, 0);
            if (result.length < jsonStr.length) {
              return (open || "") + result + (close || "");
            }
          }
        } catch {
          // JSON 解析失败，跳过
        }
        return _match;
      }
    );
  }

  // ─── Stage 7: 表格输出压缩 ────────────────────────────────

  /**
   * 压缩 Markdown 表格或对齐文本表格：
   *   - 如果行数超过阈值，只保留表头 + 前几行 + 省略 + 最后几行
   */
  private compactTableOutput(text: string): string {
    // Markdown 表格模式
    const tableBlockPattern = /((?:\|[^\n]+\|\n)+)/g;

    return text.replace(tableBlockPattern, (block: string) => {
      const rows = block.trim().split("\n");
      if (rows.length <= 8) return block; // 小表格不压缩

      // 分离表头、分隔行、数据行
      const header = rows[0];
      const separator = rows[1];
      const dataRows = rows.slice(2);

      if (dataRows.length <= 6) return block;

      // 保留前 4 行 + 省略 + 最后 2 行
      const kept = [
        header,
        separator,
        ...dataRows.slice(0, 4),
        `| ... | 省略 ${dataRows.length - 6} 行 | ... |`,
        ...dataRows.slice(-2),
      ];

      return kept.join("\n") + "\n";
    });
  }

  // ─── Stage 8: 智能截断 ────────────────────────────────────

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
