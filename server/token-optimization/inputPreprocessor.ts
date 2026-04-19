/**
 * Input Preprocessor — 提示词预处理器
 *
 * 灵感来源：TokenSaver (grittcloud/tokensaver)
 * 核心策略：
 *   1. 去除冗余空白（连续空行/空格/缩进）
 *   2. 折叠重复实体（重复的 import、变量名等）
 *   3. 提取关键信息（从长 system prompt 中提取关键指令）
 *   4. 截断过长内容（保留首尾，中间用摘要替代）
 *   5. 压缩 JSON/代码块（去除注释、简化格式）
 */

export interface PreprocessOptions {
  /** 最大保留字符数（超过时截断） */
  maxChars?: number;
  /** 是否压缩代码块（去除注释等） */
  compressCode?: boolean;
  /** 是否折叠重复实体 */
  deduplicate?: boolean;
  /** 是否去除冗余空白 */
  trimWhitespace?: boolean;
  /** 中间摘要的最大长度 */
  summaryMaxLen?: number;
}

export interface PreprocessResult {
  /** 处理后的文本 */
  text: string;
  /** 原始字符数 */
  originalChars: number;
  /** 处理后字符数 */
  processedChars: number;
  /** 估计节省的 token 数（按 1 token ≈ 4 chars 估算） */
  savedTokens: number;
  /** 应用的优化策略列表 */
  appliedStrategies: string[];
}

// 重复实体检测正则
const REPEATED_LINE_PATTERN = /^(.{10,})\n(\1\n)+/gm;
// 连续空行
const MULTI_BLANK_LINES = /\n{3,}/g;
// 行尾空格
const TRAILING_SPACES = /[ \t]+$/gm;
// 代码注释（单行 // 和 #）
const SINGLE_LINE_COMMENT = /^\s*(\/\/|#)\s.*$/gm;
// 代码块标记间的冗余
const CODE_BLOCK_SPACING = /(```\w*)\n{2,}/g;

export class InputPreprocessor {
  private options: Required<PreprocessOptions>;

  constructor(options: PreprocessOptions = {}) {
    this.options = {
      maxChars: options.maxChars ?? 12000,
      compressCode: options.compressCode ?? true,
      deduplicate: options.deduplicate ?? true,
      trimWhitespace: options.trimWhitespace ?? true,
      summaryMaxLen: options.summaryMaxLen ?? 200,
    };
  }

  /**
   * 预处理单条消息内容
   */
  preprocess(text: string): PreprocessResult {
    if (!text || typeof text !== "string") {
      return { text: text || "", originalChars: 0, processedChars: 0, savedTokens: 0, appliedStrategies: [] };
    }

    const originalChars = text.length;
    const appliedStrategies: string[] = [];
    let result = text;

    // 1. 去除冗余空白
    if (this.options.trimWhitespace) {
      const before = result.length;
      result = result
        .replace(TRAILING_SPACES, "")
        .replace(MULTI_BLANK_LINES, "\n\n")
        .replace(/[ \t]{2,}/g, " ");
      if (result.length < before) {
        appliedStrategies.push("trim_whitespace");
      }
    }

    // 2. 折叠重复实体
    if (this.options.deduplicate) {
      const before = result.length;
      result = this.deduplicateContent(result);
      if (result.length < before) {
        appliedStrategies.push("deduplicate");
      }
    }

    // 3. 压缩代码块
    if (this.options.compressCode) {
      const before = result.length;
      result = this.compressCodeBlocks(result);
      if (result.length < before) {
        appliedStrategies.push("compress_code");
      }
    }

    // 4. 截断过长内容
    if (result.length > this.options.maxChars) {
      result = this.smartTruncate(result, this.options.maxChars, this.options.summaryMaxLen);
      appliedStrategies.push("smart_truncate");
    }

    const processedChars = result.length;
    const savedTokens = Math.floor((originalChars - processedChars) / 4);

    return { text: result, originalChars, processedChars, savedTokens, appliedStrategies };
  }

  /**
   * 预处理消息数组（针对 OpenAI 格式的 messages）
   * 对 system 消息和 user 消息应用预处理
   */
  preprocessMessages(messages: any[]): { messages: any[]; stats: PreprocessResult[] } {
    const stats: PreprocessResult[] = [];

    const processed = messages.map((msg) => {
      // 只处理 system 和 user 消息
      if (msg.role !== "system" && msg.role !== "user") return msg;

      // 处理字符串内容
      if (typeof msg.content === "string") {
        const result = this.preprocess(msg.content);
        stats.push(result);
        return { ...msg, content: result.text };
      }

      // 处理多模态内容数组（只压缩 text 类型的部分）
      if (Array.isArray(msg.content)) {
        const newContent = msg.content.map((part: any) => {
          if (part.type === "text" && typeof part.text === "string") {
            const result = this.preprocess(part.text);
            stats.push(result);
            return { ...part, text: result.text };
          }
          return part;
        });
        return { ...msg, content: newContent };
      }

      return msg;
    });

    return { messages: processed, stats };
  }

  /**
   * 折叠重复内容行
   */
  private deduplicateContent(text: string): string {
    const lines = text.split("\n");
    const seen = new Set<string>();
    const result: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // 空行保留
      if (!trimmed) {
        result.push(line);
        continue;
      }
      // 短行（<20字符）不折叠，可能是代码结构
      if (trimmed.length < 20) {
        result.push(line);
        continue;
      }
      // 去重
      const key = trimmed.toLowerCase();
      if (seen.has(key)) {
        continue; // 跳过重复行
      }
      seen.add(key);
      result.push(line);
    }

    return result.join("\n");
  }

  /**
   * 压缩代码块内容
   */
  private compressCodeBlocks(text: string): string {
    // 处理 markdown 代码块
    return text.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang: string, code: string) => {
      let compressed = code;

      // 去除单行注释（保留 URL 中的 //）
      compressed = compressed.replace(/(?<!:?)\/\/.*$/gm, (comment: string) => {
        // 保留 TODO/FIXME/HACK 等重要注释
        if (/\/\/\s*(TODO|FIXME|HACK|XXX|NOTE|IMPORTANT)/i.test(comment)) {
          return comment;
        }
        return "";
      });

      // 去除 # 注释（Python/Ruby/Shell）
      compressed = compressed.replace(/^\s*#(?!(!|include|define|pragma|ifdef|endif|else|elif)).*$/gm, (comment: string) => {
        if (/#\s*(TODO|FIXME|HACK|XXX|NOTE|IMPORTANT)/i.test(comment)) {
          return comment;
        }
        return "";
      });

      // 去除多余空行
      compressed = compressed.replace(/\n{3,}/g, "\n\n");

      // 去除行尾空格
      compressed = compressed.replace(/[ \t]+$/gm, "");

      return "```" + lang + "\n" + compressed.trim() + "\n```";
    });
  }

  /**
   * 智能截断：保留首尾，中间用摘要替代
   */
  private smartTruncate(text: string, maxLen: number, summaryLen: number): string {
    if (text.length <= maxLen) return text;

    const headLen = Math.floor(maxLen * 0.7);
    const tailLen = Math.floor(maxLen * 0.2);
    const head = text.slice(0, headLen);
    const tail = text.slice(-tailLen);

    // 生成简单摘要（取中间部分的关键行）
    const midStart = headLen;
    const midEnd = text.length - tailLen;
    const midSection = text.slice(midStart, midEnd);
    const summaryLines = midSection
      .split("\n")
      .filter((line) => line.trim().length > 10)
      .slice(0, 3)
      .map((line) => line.trim());

    const summary = summaryLines.length > 0
      ? `\n\n... [省略 ${midSection.length} 字符，关键行：${summaryLines.join("；")}] ...\n\n`
      : `\n\n... [省略 ${midSection.length} 字符] ...\n\n`;

    return head + summary + tail;
  }
}
