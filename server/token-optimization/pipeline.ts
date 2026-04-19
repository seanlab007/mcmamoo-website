/**
 * Token Optimization Pipeline — 统一管线
 *
 * 将 InputPreprocessor、OutputCompactor、CliProxyCompressor、TokenCounter
 * 串联成完整的 token 优化流程，供 aiStream.ts 一键调用。
 *
 * 使用方式：
 *   import { TokenOptimizationPipeline } from "./token-optimization";
 *   const pipeline = new TokenOptimizationPipeline();
 *   const result = pipeline.optimizeInput(messages);
 *   const result = pipeline.optimizeToolOutput(toolName, output);
 */

import { InputPreprocessor, type PreprocessResult } from "./inputPreprocessor";
import { OutputCompactor, type CompactResult } from "./outputCompactor";
import { CliProxyCompressor } from "./cliProxyCompressor";
import { TokenCounter, tokenCounter } from "./tokenCounter";

export interface TokenOptimizationResult {
  /** 优化后的数据 */
  data: any;
  /** 总节省 token 数 */
  savedTokens: number;
  /** 各阶段详情 */
  stages: {
    input?: PreprocessResult[];
    output?: CompactResult;
  };
  /** 策略名称 → 节省 token 数 */
  strategyBreakdown: Record<string, number>;
}

export interface PipelineOptions {
  /** 是否启用输入预处理 */
  enableInputPreprocess: boolean;
  /** 是否启用输出压缩 */
  enableOutputCompact: boolean;
  /** 是否启用 CLI 代理压缩 */
  enableCliProxy: boolean;
  /** 是否记录 token 统计 */
  enableTokenCounting: boolean;
  /** 输入最大字符数 */
  inputMaxChars: number;
  /** 工具输出最大字符数 */
  toolOutputMaxChars: number;
}

const DEFAULT_OPTIONS: PipelineOptions = {
  enableInputPreprocess: true,
  enableOutputCompact: true,
  enableCliProxy: true,
  enableTokenCounting: true,
  inputMaxChars: 12000,
  toolOutputMaxChars: 6000,
};

export class TokenOptimizationPipeline {
  private inputPreprocessor: InputPreprocessor;
  private outputCompactor: OutputCompactor;
  private cliProxyCompressor: CliProxyCompressor;
  private options: PipelineOptions;

  constructor(options: Partial<PipelineOptions> = {}) {
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

  /**
   * 优化输入消息（发送给 LLM 之前调用）
   *
   * @param messages - OpenAI 格式的消息数组
   * @param sessionId - 会话 ID（用于统计）
   * @returns 优化后的消息数组 + 统计信息
   */
  optimizeInput(messages: any[], sessionId?: string): {
    messages: any[];
    savedTokens: number;
    stats: PreprocessResult[];
  } {
    if (!this.options.enableInputPreprocess) {
      return { messages, savedTokens: 0, stats: [] };
    }

    const { messages: optimized, stats } = this.inputPreprocessor.preprocessMessages(messages);
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

  /**
   * 优化工具输出（写入 conversationMessages 之前调用）
   *
   * @param toolName - 工具名称（如 run_shell、run_code）
   * @param output - 工具输出文本
   * @param sessionId - 会话 ID
   * @returns 优化后的输出文本
   */
  optimizeToolOutput(toolName: string, output: string, sessionId?: string): {
    text: string;
    savedTokens: number;
  } {
    if (!output || typeof output !== "string") {
      return { text: output || "", savedTokens: 0 };
    }

    let result = output;
    let savedTokens = 0;

    // CLI 工具使用更激进的压缩
    const isCliTool = ["run_shell", "run_command", "execute_command", "shell_exec", "bash"].includes(toolName);
    const isCodeTool = ["run_code", "code_exec", "python_exec", "execute_code"].includes(toolName);

    if (isCliTool && this.options.enableCliProxy) {
      const stats = this.cliProxyCompressor.compressWithStats(output, toolName);
      result = stats.text;
      savedTokens = stats.savedTokens;
    } else if (isCodeTool && this.options.enableOutputCompact) {
      const compacted = this.outputCompactor.compact(output, toolName);
      result = compacted.text;
      savedTokens = compacted.savedTokens;
    } else if (this.options.enableOutputCompact) {
      // 通用工具输出压缩
      const compacted = this.outputCompactor.compact(output, toolName);
      result = compacted.text;
      savedTokens = compacted.savedTokens;
    }

    // 记录统计
    if (this.options.enableTokenCounting && sessionId) {
      const outputBefore = Math.ceil(output.length / 4);
      const outputAfter = Math.ceil(result.length / 4);
      const strategyBreakdown: Record<string, number> = {
        [isCliTool ? "cli_proxy" : "output_compact"]: savedTokens,
      };
      tokenCounter.recordOptimization(sessionId, 0, 0, outputBefore, outputAfter, strategyBreakdown);
    }

    return { text: result, savedTokens };
  }

  /**
   * 优化 RAG 注入的文本
   * RAG 检索结果可能很长，需要压缩后注入 system prompt
   */
  optimizeRagContext(ragText: string): {
    text: string;
    savedTokens: number;
  } {
    if (!ragText || ragText.length < 200) {
      return { text: ragText, savedTokens: 0 };
    }

    const result = this.inputPreprocessor.preprocess(ragText);
    return { text: result.text, savedTokens: result.savedTokens };
  }

  /**
   * 获取会话 token 优化统计
   */
  getSessionStats(sessionId: string) {
    return tokenCounter.getSessionStats(sessionId);
  }

  /**
   * 生成 SSE 事件（token 优化统计推送到前端）
   */
  generateTokenSSEEvent(sessionId: string): string | null {
    const event = tokenCounter.generateSSEEvent(sessionId);
    return event || null;
  }
}
