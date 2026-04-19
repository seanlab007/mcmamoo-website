/**
 * Token Optimization Pipeline v2 — 统一管线（中间件模式）
 *
 * 重构要点：
 *   1. 中间件钩子：beforeLLM / afterTool / onStreamEnd
 *   2. RAG context 压缩入口
 *   3. 灵活配置：每个阶段可独立开关 + 自定义参数
 *   4. 会话级别统计自动聚合
 *   5. 兼容 v1 的 optimizeInput / optimizeToolOutput API
 *
 * 使用方式：
 *   const pipeline = new TokenOptimizationPipeline({ ... });
 *
 *   // 1. 发送给 LLM 之前
 *   const { messages, savedTokens } = pipeline.optimizeInput(messages, sessionId);
 *
 *   // 2. 压缩 RAG 注入文本
 *   const { text, savedTokens } = pipeline.optimizeRagContext(ragText, sessionId);
 *
 *   // 3. 工具输出写入对话之前
 *   const { text, savedTokens } = pipeline.optimizeToolOutput(toolName, output, sessionId);
 *
 *   // 4. 流结束时推送统计
 *   const stats = pipeline.getSessionStats(sessionId);
 */

import { InputPreprocessor, type PreprocessResult } from "./inputPreprocessor";
import { OutputCompactor, type CompactResult } from "./outputCompactor";
import { CliProxyCompressor } from "./cliProxyCompressor";
import { TokenCounter, tokenCounter } from "./tokenCounter";

// ─── 类型定义 ─────────────────────────────────────────────────────

export interface PipelineOptions {
  /** 是否启用输入预处理 */
  enableInputPreprocess?: boolean;
  /** 是否启用输出压缩 */
  enableOutputCompact?: boolean;
  /** 是否启用 CLI 代理压缩 */
  enableCliProxy?: boolean;
  /** 是否记录 token 统计 */
  enableTokenCounting?: boolean;
  /** 输入最大字符数 */
  inputMaxChars?: number;
  /** 工具输出最大字符数 */
  toolOutputMaxChars?: number;
  /** 是否压缩 RAG 注入文本 */
  enableRagCompact?: boolean;
  /** RAG 文本最大字符数 */
  ragMaxChars?: number;
  /** 是否压缩对话历史（旧消息截断） */
  enableHistoryCompact?: boolean;
  /** 保留最近 N 轮完整历史 */
  historyKeepRounds?: number;
  /** 是否启用 Ollama 精确计数（需要本地 Ollama） */
  enableExactCounting?: boolean;
  /** Ollama 地址 */
  ollamaBaseUrl?: string;
}

export interface TokenOptimizationResult {
  /** 优化后的数据 */
  data: any;
  /** 总节省 token 数 */
  savedTokens: number;
  /** 各阶段详情 */
  stages: {
    input?: PreprocessResult[];
    output?: CompactResult;
    rag?: PreprocessResult;
  };
  /** 策略名称 → 节省 token 数 */
  strategyBreakdown: Record<string, number>;
}

export interface SessionSummary {
  totalSavedTokens: number;
  savingRatio: number;
  strategyBreakdown: Record<string, number>;
  rounds: number;
  inputSaved: number;
  outputSaved: number;
  ragSaved: number;
}

// ─── 默认配置 ─────────────────────────────────────────────────────

const DEFAULT_OPTIONS: Required<PipelineOptions> = {
  enableInputPreprocess: true,
  enableOutputCompact: true,
  enableCliProxy: true,
  enableTokenCounting: true,
  inputMaxChars: 12000,
  toolOutputMaxChars: 6000,
  enableRagCompact: true,
  ragMaxChars: 4000,
  enableHistoryCompact: true,
  historyKeepRounds: 4,
  enableExactCounting: false,
  ollamaBaseUrl: "http://localhost:11434",
};

// ─── Pipeline 主体 ────────────────────────────────────────────────

export class TokenOptimizationPipeline {
  private inputPreprocessor: InputPreprocessor;
  private outputCompactor: OutputCompactor;
  private cliProxyCompressor: CliProxyCompressor;
  private options: Required<PipelineOptions>;

  constructor(options: PipelineOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    this.inputPreprocessor = new InputPreprocessor({
      maxChars: this.options.inputMaxChars,
      compressCode: true,
      deduplicate: true,
      trimWhitespace: true,
    });

    this.outputCompactor = new OutputCompactor({
      maxOutputChars: this.options.toolOutputMaxChars,
      simplifyPaths: true,
      foldDuplicates: true,
      compactStackTraces: true,
      normalizeTimestamps: true,
    });

    this.cliProxyCompressor = new CliProxyCompressor({
      maxOutputChars: this.options.toolOutputMaxChars,
      minLogLevel: "INFO",
      filterEnvVars: true,
      filterProgressBars: true,
      compressVersions: true,
      compressDeps: true,
      compressFileTree: true,
    });
  }

  // ─── 1. 输入预处理（发送给 LLM 之前）─────────────────────────

  optimizeInput(messages: any[], sessionId?: string): {
    messages: any[];
    savedTokens: number;
    stats: PreprocessResult[];
  } {
    if (!this.options.enableInputPreprocess) {
      return { messages, savedTokens: 0, stats: [] };
    }

    // 如果开启历史压缩，先压缩旧对话
    let processedMessages = messages;
    if (this.options.enableHistoryCompact && messages.length > this.options.historyKeepRounds * 2 + 1) {
      processedMessages = this.compactHistory(messages, this.options.historyKeepRounds);
    }

    const { messages: optimized, stats } = this.inputPreprocessor.preprocessMessages(processedMessages);
    const savedTokens = stats.reduce((sum, s) => sum + s.savedTokens, 0);

    // 记录统计
    if (this.options.enableTokenCounting && sessionId) {
      const inputBefore = tokenCounter.estimateMessagesTokens(messages).tokens;
      const inputAfter = tokenCounter.estimateMessagesTokens(optimized).tokens;
      const strategyBreakdown: Record<string, number> = {};
      for (const s of stats) {
        for (const strategy of s.appliedStrategies) {
          strategyBreakdown[strategy] = (strategyBreakdown[strategy] || 0) + s.savedTokens;
        }
      }
      tokenCounter.recordOptimization(sessionId, inputBefore, inputAfter, 0, 0, strategyBreakdown);
    }

    return { messages: optimized, savedTokens, stats };
  }

  // ─── 2. RAG 上下文压缩 ──────────────────────────────────────

  optimizeRagContext(ragText: string, sessionId?: string): {
    text: string;
    savedTokens: number;
  } {
    if (!this.options.enableRagCompact || !ragText || ragText.length < 200) {
      return { text: ragText, savedTokens: 0 };
    }

    const before = ragText.length;
    let result = this.inputPreprocessor.preprocess(ragText);

    // 如果还超长，截断
    if (result.text.length > this.options.ragMaxChars) {
      const truncated = this.smartRagTruncate(result.text, this.options.ragMaxChars);
      result = { ...result, text: truncated, appliedStrategies: [...result.appliedStrategies, "rag_truncate"] };
    }

    const savedTokens = result.savedTokens;

    if (this.options.enableTokenCounting && sessionId) {
      const beforeTokens = Math.ceil(before / 4);
      const afterTokens = Math.ceil(result.text.length / 4);
      tokenCounter.recordOptimization(sessionId, 0, 0, 0, 0, { rag_compact: beforeTokens - afterTokens });
    }

    return { text: result.text, savedTokens };
  }

  // ─── 3. 工具输出压缩 ────────────────────────────────────────

  optimizeToolOutput(toolName: string, output: string, sessionId?: string): {
    text: string;
    savedTokens: number;
  } {
    if (!output || typeof output !== "string") {
      return { text: output || "", savedTokens: 0 };
    }

    // 短输出不压缩
    if (output.length < 100) {
      return { text: output, savedTokens: 0 };
    }

    let result = output;
    let savedTokens = 0;

    const isCliTool = ["run_shell", "run_command", "execute_command", "shell_exec", "bash"].includes(toolName);
    const isCodeTool = ["run_code", "code_exec", "python_exec", "execute_code"].includes(toolName);

    if (isCliTool && this.options.enableCliProxy) {
      const stats = this.cliProxyCompressor.compressWithStats(output, toolName);
      result = stats.text;
      savedTokens = stats.savedTokens;
    } else if (this.options.enableOutputCompact) {
      const compacted = this.outputCompactor.compact(output, toolName);
      result = compacted.text;
      savedTokens = compacted.savedTokens;
    }

    // 最终安全截断
    if (result.length > this.options.toolOutputMaxChars) {
      result = result.slice(0, this.options.toolOutputMaxChars) + "\n... [输出截断]";
    }

    // 记录统计
    if (this.options.enableTokenCounting && sessionId) {
      const outputBefore = Math.ceil(output.length / 4);
      const outputAfter = Math.ceil(result.length / 4);
      const strategyBreakdown: Record<string, number> = {
        [isCliTool ? "cli_proxy" : isCodeTool ? "code_compact" : "output_compact"]: savedTokens,
      };
      tokenCounter.recordOptimization(sessionId, 0, 0, outputBefore, outputAfter, strategyBreakdown);
    }

    return { text: result, savedTokens };
  }

  // ─── 4. 会话统计 ────────────────────────────────────────────

  getSessionStats(sessionId: string): SessionSummary | null {
    const raw = tokenCounter.getSessionStats(sessionId);
    if (!raw) return null;

    // 从策略明细中分类
    const inputStrategies = ["trim_whitespace", "deduplicate", "compress_code", "smart_truncate", "history_compact"];
    const outputStrategies = ["cli_proxy", "code_compact", "output_compact"];
    const ragStrategies = ["rag_compact"];

    let inputSaved = 0;
    let outputSaved = 0;
    let ragSaved = 0;

    for (const [strategy, saved] of Object.entries(raw.strategyBreakdown)) {
      if (inputStrategies.includes(strategy)) inputSaved += saved;
      else if (outputStrategies.includes(strategy)) outputSaved += saved;
      else if (ragStrategies.includes(strategy)) ragSaved += saved;
    }

    return {
      totalSavedTokens: raw.totalSavedTokens,
      savingRatio: Math.round(raw.savingRatio * 100),
      strategyBreakdown: raw.strategyBreakdown,
      rounds: raw.rounds,
      inputSaved,
      outputSaved,
      ragSaved,
    };
  }

  // ─── 5. 历史对话压缩 ────────────────────────────────────────

  /**
   * 压缩旧的对话历史，保留最近 N 轮完整，更早的只保留摘要
   */
  private compactHistory(messages: any[], keepRounds: number): any[] {
    if (messages.length <= keepRounds * 2 + 1) return messages;

    // 第一条通常是 system prompt，保留
    const systemMsg = messages[0]?.role === "system" ? [messages[0]] : [];
    const restStart = systemMsg.length;

    // 最近的 keepRounds 轮（每轮 = user + assistant = 2条消息）
    const recentStart = Math.max(restStart, messages.length - keepRounds * 2);

    // 旧消息只保留 user 消息的摘要
    const oldMessages = messages.slice(restStart, recentStart);
    const compactedOld: any[] = [];

    let userCount = 0;
    for (const msg of oldMessages) {
      if (msg.role === "user") {
        userCount++;
        // 旧 user 消息只保留前 100 字符
        const content = typeof msg.content === "string" ? msg.content : "";
        if (content.length > 100) {
          compactedOld.push({
            ...msg,
            content: content.slice(0, 100) + "... [历史消息已压缩]",
          });
        } else {
          compactedOld.push(msg);
        }
      } else if (msg.role === "assistant") {
        // 旧的 assistant 消息只保留前 80 字符
        const content = typeof msg.content === "string" ? msg.content : "";
        compactedOld.push({
          ...msg,
          content: content.length > 80
            ? content.slice(0, 80) + "... [已压缩]"
            : content,
        });
      }
      // tool 消息全部丢弃（它们的信息已经被 assistant 消息包含）
    }

    if (userCount > 0) {
      compactedOld.unshift({
        role: "system",
        content: `[系统: 以下是 ${userCount} 轮历史对话的压缩版本]`,
      });
    }

    const recentMessages = messages.slice(recentStart);
    return [...systemMsg, ...compactedOld, ...recentMessages];
  }

  // ─── 6. RAG 智能截断 ────────────────────────────────────────

  /**
   * 保留每个文档片段的开头和结尾，删除中间重复/低相关内容
   */
  private smartRagTruncate(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;

    // 尝试按文档片段分割（--- 分隔符）
    const chunks = text.split(/\n---\n/);

    if (chunks.length > 1) {
      // 多文档模式：每个文档保留配额
      const perChunk = Math.floor(maxLen / chunks.length);
      const truncated = chunks.map((chunk, i) => {
        if (chunk.length <= perChunk) return chunk;
        const headLen = Math.floor(perChunk * 0.8);
        return chunk.slice(0, headLen) + `... [文档${i + 1}省略 ${chunk.length - headLen} 字符]`;
      });
      return truncated.join("\n---\n");
    }

    // 单文档：首尾保留
    const headLen = Math.floor(maxLen * 0.8);
    const tailLen = Math.floor(maxLen * 0.15);
    return text.slice(0, headLen) + `\n... [省略 ${text.length - headLen - tailLen} 字符] ...\n` + text.slice(-tailLen);
  }

  // ─── 7. 管线配置热更新 ──────────────────────────────────────

  updateOptions(options: Partial<PipelineOptions>): void {
    this.options = { ...this.options, ...options };
  }

  getOptions(): Required<PipelineOptions> {
    return { ...this.options };
  }
}
