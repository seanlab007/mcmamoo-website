/**
 * Input Preprocessor v2 — 提示词预处理器
 *
 * 灵感来源：TokenSaver (grittcloud/tokensaver)
 * 核心策略：
 *   1. 去除冗余空白（连续空行/空格/缩进）
 *   2. 折叠重复实体（重复的 import、变量名等）
 *   3. 压缩 JSON/代码块（去除注释、简化格式）
 *   4. 智能截断过长内容（保留首尾，中间用摘要替代）
 *   5. 【v2新增】System prompt 关键指令提取
 *   6. 【v2新增】对话历史去重（去除重复提问）
 *   7. 【v2新增】结构化提示模板压缩
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
  /** 是否启用 system prompt 精简 */
  compactSystemPrompt?: boolean;
  /** 是否启用对话历史去重 */
  dedupHistory?: boolean;
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

// ─── 正则模式 ──────────────────────────────────────────────────────

// 重复实体检测
const REPEATED_LINE_PATTERN = /^(.{10,})\n(\1\n)+/gm;
// 连续空行
const MULTI_BLANK_LINES = /\n{3,}/g;
// 行尾空格
const TRAILING_SPACES = /[ \t]+$/gm;
// 代码块标记间的冗余
const CODE_BLOCK_SPACING = /(```\w*)\n{2,}/g;
// System prompt 中的重复指令行（英文）
const DUPLICATE_DIRECTIVE = /^(?:You are|You must|Always|Never|Remember|Important|Note:|Make sure)\s/i;
// Markdown 列表标记的指令
const LIST_DIRECTIVE = /^[-*]\s+/;
// 重复的 import 行
const IMPORT_LINE = /^import\s+.+from\s+['"].+['"];?\s*$/;

export class InputPreprocessor {
  private options: Required<PreprocessOptions>;

  constructor(options: PreprocessOptions = {}) {
    this.options = {
      maxChars: options.maxChars ?? 12000,
      compressCode: options.compressCode ?? true,
      deduplicate: options.deduplicate ?? true,
      trimWhitespace: options.trimWhitespace ?? true,
      summaryMaxLen: options.summaryMaxLen ?? 200,
      compactSystemPrompt: options.compactSystemPrompt ?? true,
      dedupHistory: options.dedupHistory ?? true,
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

    const processed = messages.map((msg, idx) => {
      // system 消息：精简指令
      if (msg.role === "system" && this.options.compactSystemPrompt) {
        if (typeof msg.content === "string") {
          const result = this.compactSystemPromptContent(msg.content);
          stats.push(result);
          return { ...msg, content: result.text };
        }
      }

      // user 消息：标准预处理
      if (msg.role === "user") {
        if (typeof msg.content === "string") {
          const result = this.preprocess(msg.content);
          stats.push(result);
          return { ...msg, content: result.text };
        }
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
      }

      // assistant 消息：如果特别长也做轻量压缩
      if (msg.role === "assistant" && typeof msg.content === "string" && msg.content.length > 2000) {
        const result = this.preprocess(msg.content);
        stats.push(result);
        return { ...msg, content: result.text };
      }

      return msg;
    });

    // 对话历史去重
    if (this.options.dedupHistory) {
      const deduped = this.dedupHistoryMessages(processed);
      // 如果去重有变化，记录统计
      const totalBefore = processed.reduce((sum, m) => sum + (typeof m.content === "string" ? m.content.length : 0), 0);
      const totalAfter = deduped.reduce((sum, m) => sum + (typeof m.content === "string" ? m.content.length : 0), 0);
      if (totalAfter < totalBefore) {
        stats.push({
          text: "",
          originalChars: totalBefore,
          processedChars: totalAfter,
          savedTokens: Math.floor((totalBefore - totalAfter) / 4),
          appliedStrategies: ["dedup_history"],
        });
      }
      return { messages: deduped, stats };
    }

    return { messages: processed, stats };
  }

  // ─── System Prompt 精简 ────────────────────────────────────

  /**
   * 精简 system prompt：
   *   - 合并重复的指令行
   *   - 去除啰嗦的措辞
   *   - 保留关键指令关键词
   */
  private compactSystemPromptContent(text: string): PreprocessResult {
    const originalChars = text.length;
    const appliedStrategies: string[] = [];
    let result = text;

    // 1. 去除重复的指令行（相同开头的行只保留第一条）
    const lines = result.split("\n");
    const seenDirectives = new Set<string>();
    const dedupedLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) { dedupedLines.push(line); continue; }

      // 检查是否是指令行
      if (DUPLICATE_DIRECTIVE.test(trimmed) || LIST_DIRECTIVE.test(trimmed)) {
        // 取前 30 字符作为去重 key
        const key = trimmed.toLowerCase().slice(0, 30);
        if (seenDirectives.has(key)) {
          continue; // 跳过重复指令
        }
        seenDirectives.add(key);
      }

      dedupedLines.push(line);
    }

    const afterDedup = dedupedLines.join("\n");
    if (afterDedup.length < result.length) {
      result = afterDedup;
      appliedStrategies.push("system_dedup");
    }

    // 2. 常见啰嗦表达压缩
    const verbosePatterns: [RegExp, string][] = [
      [/You are (?:an|a) (?:expert|professional|highly skilled|accomplished) (.+?)(?:\.|,)/gi, "You are $1."],
      [/Please (?:make sure to|ensure that you|be sure to) /gi, "Please "],
      [/It is (?:very |extremely |highly )?important (?:that you |to )/gi, "IMPORTANT: "],
      [/Always remember (?:that )?/gi, ""],
      [/Do not (?:ever|under any circumstances) /gi, "Never "],
      [/In (?:your|the) response,?\s*(?:please )?/gi, ""],
      [/when (?:you are|you're) (?:responding|answering|writing)/gi, "when responding"],
    ];

    for (const [pattern, replacement] of verbosePatterns) {
      const before = result.length;
      result = result.replace(pattern, replacement);
      if (result.length < before) {
        appliedStrategies.push("system_verbose_compress");
      }
    }

    // 3. 标准预处理（空白、代码等）
    if (this.options.trimWhitespace) {
      result = result
        .replace(TRAILING_SPACES, "")
        .replace(MULTI_BLANK_LINES, "\n\n");
    }

    const processedChars = result.length;
    const savedTokens = Math.floor((originalChars - processedChars) / 4);

    return { text: result, originalChars, processedChars, savedTokens, appliedStrategies };
  }

  // ─── 对话历史去重 ──────────────────────────────────────────

  /**
   * 去除对话历史中重复的用户提问
   * 例如用户连续发相同/相似的消息
   */
  private dedupHistoryMessages(messages: any[]): any[] {
    const userMessages: Map<string, number> = new Map();

    return messages.filter((msg) => {
      if (msg.role !== "user") return true;

      const content = typeof msg.content === "string" ? msg.content : "";
      if (!content) return true;

      // 标准化：去除多余空白、转小写
      const normalized = content.toLowerCase().replace(/\s+/g, " ").trim();

      // 短消息不去重（可能是确认/选择等）
      if (normalized.length < 10) return true;

      // 检查是否和之前的 user 消息高度相似（编辑距离太远就算了，只检查完全重复和子串）
      for (const [existing] of userMessages) {
        // 完全相同
        if (normalized === existing) {
          return false;
        }
        // 一个是另一个的前 80% 子串
        if (normalized.length > existing.length * 0.8 && normalized.includes(existing.slice(0, Math.floor(existing.length * 0.8)))) {
          return false;
        }
      }

      userMessages.set(normalized, 1);
      return true;
    });
  }

  // ─── 原有方法 ─────────────────────────────────────────────

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
      // import 行特殊处理：只保留不同来源的 import
      if (IMPORT_LINE.test(trimmed)) {
        const importSource = trimmed.match(/from\s+['"](.+?)['"]/)?.[1] || trimmed;
        if (seen.has(`import:${importSource}`)) continue;
        seen.add(`import:${importSource}`);
        result.push(line);
        continue;
      }
      // 去重
      const key = trimmed.toLowerCase();
      if (seen.has(key)) {
        continue;
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
    return text.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang: string, code: string) => {
      let compressed = code;

      // 去除单行注释（保留 URL 中的 //）
      compressed = compressed.replace(/(?<!:?)\/\/.*$/gm, (comment: string) => {
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
