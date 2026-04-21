/**
 * tokenCounter.ts — MaoAI Token 精确计数模块
 *
 * 基于 js-tiktoken (OpenAI BPE) 的精确 token 计数器。
 * 替代之前用字符数 (delta.length) 的粗略估算。
 *
 * 功能：
 *   - countTokens(text, model?)     计算单段文本的 token 数
 *   - countMessagesTokens(msgs)     计算完整消息数组的 token 数
 *   - truncateByTokenBudget(msgs, budget, model?) 按 token 预算截断消息
 *   - getContextWindowLimit(model)  获取模型的上下文窗口大小
 *
 * 用法：
 *   import { countTokens, countMessagesTokens, truncateByTokenBudget } from './tokenCounter';
 */

import { encodingForModel, type TiktokenModel } from "js-tiktoken";

// ─── 编码缓存 ─────────────────────────────────────────────────────────────

const encoderCache = new Map<string, ReturnType<typeof encodingForModel>>();

function getEncoder(model?: string) {
  const key = model || "gpt-4o-mini";
  if (encoderCache.has(key)) return encoderCache.get(key)!;
  try {
    const enc = encodingForModel(key as TiktokenModel);
    encoderCache.set(key, enc);
    return enc;
  } catch {
    // Fallback: 如果模型名不在 tiktoken 支持列表中，用 cl100k_base (GPT-4 通用编码)
    if (!encoderCache.has("cl100k_base")) {
      const { encodingForModel: efm } = require("js-tiktoken");
      // cl100k_base covers GPT-4, GPT-3.5-turbo, and most OpenAI models
      const { Tiktoken } = require("js-tiktoken");
      const fallback = new Tiktoken(
        // Load cl100k_base encoding
        require("js-tiktoken/lazy/cl100k_base"),
        // Mergeable ranks
        undefined
      );
      encoderCache.set("cl100k_base", fallback);
    }
    return encoderCache.get("cl100k_base")!;
  }
}

// ─── 单段文本 Token 计数 ───────────────────────────────────────────────────

/**
 * 精确计算文本的 token 数
 * @param text - 要计算的文本
 * @param model - 可选模型名（影响编码方案）
 */
export function countTokens(text: string, model?: string): number {
  if (!text) return 0;
  try {
    const encoder = getEncoder(model);
    return encoder.encode(text).length;
  } catch {
    // Fallback: 中文约 1.5 字符/token，英文约 4 字符/token
    return Math.ceil(text.length * 0.4);
  }
}

// ─── 消息数组 Token 计数 ──────────────────────────────────────────────────

// 各角色每条消息的固定 overhead（OpenAI 格式）
const ROLE_OVERHEAD: Record<string, number> = {
  system: 4,    // <|start|>assistant<|message|> 等
  user: 4,
  assistant: 4,
  tool: 4,
  function: 4,
};

// 每条消息的格式 overhead（role, name 等 key-value pairs）
const MESSAGE_OVERHEAD = 3;

/**
 * 计算完整消息数组的总 token 数（含格式 overhead）
 * @param messages - OpenAI 格式的消息数组
 * @param model - 可选模型名
 */
export function countMessagesTokens(
  messages: Array<{ role: string; content: string | null; name?: string; tool_calls?: unknown[] }>,
  model?: string
): number {
  let total = 0;
  for (const msg of messages) {
    // 角色固定开销
    total += ROLE_OVERHEAD[msg.role] || 3;
    // 消息格式开销
    total += MESSAGE_OVERHEAD;
    // name 字段
    if (msg.name) {
      total += countTokens(msg.name, model) + 1;
    }
    // content
    if (msg.content) {
      total += countTokens(msg.content, model);
    }
    // tool_calls (简化计算：每个约 15 tokens)
    if (msg.tool_calls && Array.isArray(msg.tool_calls)) {
      for (const tc of msg.tool_calls) {
        const tcAny = tc as any;
        total += 15; // base overhead per tool call
        if (tcAny.function?.name) {
          total += countTokens(tcAny.function.name, model);
        }
        if (tcAny.function?.arguments) {
          total += countTokens(typeof tcAny.function.arguments === "string"
            ? tcAny.function.arguments
            : JSON.stringify(tcAny.function.arguments), model);
        }
      }
    }
  }
  // 每条消息之间的分隔符
  total += messages.length > 0 ? 1 : 0;
  return total;
}

// ─── 模型上下文窗口配置 ───────────────────────────────────────────────────

/** 模型上下文窗口大小（token 数）*/
const CONTEXT_WINDOWS: Record<string, number> = {
  // DeepSeek
  "deepseek-chat":     64_000,
  "deepseek-reasoner": 64_000,
  // 智谱 GLM
  "glm-4-flash":       128_000,
  "glm-4-plus":        128_000,
  "glm-4-air":         128_000,
  "glm-z1-flash":      65_536,
  "glm-4v-flash":      128_000,
  "glm-5v-turbo":      200_000,
  // Groq (Llama)
  "llama-3.3-70b":     128_000,
  "llama-3.1-8b":      128_000,
  "gemma2-9b":         8_192,
  // Gemini
  "gemini-2.5-flash":  1_048_576,
  "gemini-2.5-pro":    1_048_576,
  // Z.ai
  "zai-glm-5":         128_000,
  "zai-glm-4-7":       128_000,
  // Google AI Studio (Gemma 4)
  "gemma-4-e2b-it":    1_000_000,
  "gemma-4-e4b-it":    1_000_000,
  "gemma-4-26b-it":    32_000,
  "gemma-4-31b-it":    128_000,
};

/** 默认上下文窗口（未匹配到时使用）*/
const DEFAULT_CONTEXT_WINDOW = 128_000;

/** 保留给回复的最大 token 比例 */
const OUTPUT_RESERVE_RATIO = 0.25;

/**
 * 获取模型的上下文窗口大小
 */
export function getContextWindowLimit(model: string): number {
  return CONTEXT_WINDOWS[model] || DEFAULT_CONTEXT_WINDOW;
}

/**
 * 获取模型的输入 token 预算（减去输出预留）
 * @param model - 模型名
 * @param outputMaxTokens - 模型的 maxTokens 输出配置
 */
export function getInputBudget(model: string, outputMaxTokens?: number): number {
  const total = getContextWindowLimit(model);
  const outputReserve = outputMaxTokens || Math.floor(total * OUTPUT_RESERVE_RATIO);
  return Math.max(total - outputReserve - 500, 1000); // -500 安全余量
}

// ─── Token 感知的消息截断 ─────────────────────────────────────────────────

/**
 * 按 token 预算从消息数组末尾向前截断
 * 保留 system 消息 + 尽可能多的历史消息
 *
 * @param messages - 完整消息数组（system 在最前面）
 * @param budget   - 输入 token 预算
 * @param model    - 可选模型名
 * @returns 截断后的消息数组
 */
export function truncateByTokenBudget(
  messages: Array<{ role: string; content: string | null; name?: string; tool_calls?: unknown[] }>,
  budget: number,
  model?: string
): Array<{ role: string; content: string | null; name?: string; tool_calls?: unknown[] }> {
  if (messages.length === 0) return messages;

  // 分离 system 消息和历史消息
  const systemMessages: typeof messages = [];
  const historyMessages: typeof messages = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      systemMessages.push(msg);
    } else {
      historyMessages.push(msg);
    }
  }

  // 计算 system 消息占用的 token
  const systemTokens = countMessagesTokens(systemMessages, model);
  const historyBudget = Math.max(budget - systemTokens, 500);

  // 从末尾向前累积，直到超出预算
  const selected: typeof messages = [];
  let usedTokens = 0;

  for (let i = historyMessages.length - 1; i >= 0; i--) {
    const msg = historyMessages[i];
    const msgTokens = countMessagesTokens([msg], model);

    if (usedTokens + msgTokens > historyBudget) {
      break;
    }

    selected.unshift(msg);
    usedTokens += msgTokens;
  }

  return [...systemMessages, ...selected];
}

// ─── 流式 Token 累加器（替代 delta.length）────────────────────────────────

/**
 * 流式 Token 累加器
 * 用于在 SSE 流中精确统计已生成的 token 数
 */
export class StreamTokenCounter {
  private tokens = 0;
  private buffer = "";
  private model?: string;

  constructor(model?: string) {
    this.model = model;
  }

  /**
   * 累加一段 delta 文本
   * 使用缓冲策略避免跨 token 边界切分导致的计数偏差
   */
  addDelta(delta: string): void {
    this.buffer += delta;
  }

  /**
   * 获取当前已累积的 token 数
   * 每次调用时 flush 缓冲区
   */
  getTotal(): number {
    if (this.buffer.length > 0) {
      this.tokens += countTokens(this.buffer, this.model);
      this.buffer = "";
    }
    return this.tokens;
  }

  /**
   * 用 API 返回的精确 usage 覆盖（如果可用）
   */
  setFromUsage(usage: { total_tokens?: number; completion_tokens?: number }): void {
    if (usage.total_tokens !== undefined) {
      this.tokens = usage.total_tokens;
    } else if (usage.completion_tokens !== undefined) {
      this.tokens = usage.completion_tokens;
    }
    this.buffer = "";
  }
}
