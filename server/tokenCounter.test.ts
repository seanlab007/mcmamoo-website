/**
 * tokenCounter.test.ts — Token 计数模块单元测试
 */
import { describe, it, expect } from "vitest";
import {
  countTokens,
  countMessagesTokens,
  truncateByTokenBudget,
  getContextWindowLimit,
  getInputBudget,
  StreamTokenCounter,
} from "./tokenCounter";

describe("countTokens", () => {
  it("should return 0 for empty string", () => {
    expect(countTokens("")).toBe(0);
  });

  it("should return 0 for null/undefined fallback", () => {
    expect(countTokens(null as any)).toBe(0);
    expect(countTokens(undefined as any)).toBe(0);
  });

  it("should count English text tokens", () => {
    const text = "Hello, world!";
    const tokens = countTokens(text);
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(text.length); // tokens < chars for English
  });

  it("should count Chinese text tokens", () => {
    const text = "你好，世界！这是一个测试。";
    const tokens = countTokens(text);
    expect(tokens).toBeGreaterThan(0);
    // Chinese typically uses ~1-2 tokens per character
    expect(tokens).toBeLessThanOrEqual(text.length);
  });

  it("should count mixed text tokens", () => {
    const text = "MaoAI 是一个 AI 助手，基于 React + TypeScript 构建。";
    const tokens = countTokens(text);
    expect(tokens).toBeGreaterThan(0);
  });
});

describe("countMessagesTokens", () => {
  it("should count empty messages array", () => {
    expect(countMessagesTokens([])).toBe(0);
  });

  it("should count single message with role overhead", () => {
    const tokens = countMessagesTokens([{ role: "user", content: "Hello" }]);
    expect(tokens).toBeGreaterThan(1); // At least 1 token + overhead
  });

  it("should count system message", () => {
    const tokens = countMessagesTokens([{
      role: "system",
      content: "You are a helpful assistant.",
    }]);
    expect(tokens).toBeGreaterThan(0);
  });

  it("should count multiple messages with overhead", () => {
    const msgs = [
      { role: "system", content: "You are MaoAI." },
      { role: "user", content: "Hello!" },
      { role: "assistant", content: "Hi there!" },
    ];
    const totalTokens = countMessagesTokens(msgs);
    const contentTokens = countTokens("You are MaoAI.Hello!Hi there!");
    // Total should be higher due to role overhead per message
    expect(totalTokens).toBeGreaterThan(contentTokens);
  });

  it("should handle null content", () => {
    const tokens = countMessagesTokens([{ role: "assistant", content: null }]);
    expect(tokens).toBeGreaterThan(0); // Still has role overhead
  });
});

describe("getContextWindowLimit", () => {
  it("should return correct limits for known models", () => {
    expect(getContextWindowLimit("deepseek-chat")).toBe(64_000);
    expect(getContextWindowLimit("gemini-2.5-flash")).toBe(1_048_576);
    expect(getContextWindowLimit("glm-4-flash")).toBe(128_000);
  });

  it("should return default for unknown models", () => {
    expect(getContextWindowLimit("unknown-model")).toBe(128_000);
  });
});

describe("getInputBudget", () => {
  it("should calculate budget less than total context", () => {
    const budget = getInputBudget("deepseek-chat");
    const total = getContextWindowLimit("deepseek-chat");
    expect(budget).toBeLessThan(total);
    expect(budget).toBeGreaterThan(0);
  });
});

describe("truncateByTokenBudget", () => {
  it("should return empty array for empty input", () => {
    const result = truncateByTokenBudget([], 1000);
    expect(result).toEqual([]);
  });

  it("should keep system messages even when budget is small", () => {
    const messages = [
      { role: "system", content: "You are MaoAI, an AI assistant." },
      { role: "user", content: "Hello!" },
      { role: "assistant", content: "Hi there! How can I help you today?" },
    ];
    const result = truncateByTokenBudget(messages, 50); // Very small budget
    // System message should still be present
    expect(result.some(m => m.role === "system")).toBe(true);
  });

  it("should keep recent messages within budget", () => {
    const messages = [
      { role: "system", content: "System prompt here." },
      { role: "user", content: "Question 1" },
      { role: "assistant", content: "Answer 1" },
      { role: "user", content: "Question 2" },
      { role: "assistant", content: "Answer 2" },
      { role: "user", content: "Question 3 (most recent)" },
    ];

    const budget = 200; // Small budget
    const result = truncateByTokenBudget(messages, budget);

    // System should be first
    expect(result[0].role).toBe("system");
    // Most recent user message should be present
    expect(result[result.length - 1]).toEqual({ role: "user", content: "Question 3 (most recent)" });
    // Some old messages may be dropped
    expect(result.length).toBeLessThan(messages.length);
  });

  it("should keep all messages when budget is sufficient", () => {
    const messages = [
      { role: "system", content: "System" },
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hello" },
    ];
    const result = truncateByTokenBudget(messages, 10000);
    expect(result.length).toBe(3);
  });
});

describe("StreamTokenCounter", () => {
  it("should start at 0", () => {
    const counter = new StreamTokenCounter();
    expect(counter.getTotal()).toBe(0);
  });

  it("should accumulate tokens from deltas", () => {
    const counter = new StreamTokenCounter();
    counter.addDelta("Hello, ");
    counter.addDelta("world!");
    const total = counter.getTotal();
    expect(total).toBeGreaterThan(0);
  });

  it("should be more accurate than character counting", () => {
    const counter = new StreamTokenCounter();
    const text = "Hello, world!";
    counter.addDelta(text);
    const tokenCount = counter.getTotal();
    // Token count should be less than character count for English
    expect(tokenCount).toBeLessThan(text.length);
  });

  it("should override with usage data", () => {
    const counter = new StreamTokenCounter();
    counter.addDelta("Some long text here...");
    counter.setFromUsage({ total_tokens: 42 });
    expect(counter.getTotal()).toBe(42);
  });

  it("should handle completion_tokens in usage", () => {
    const counter = new StreamTokenCounter();
    counter.addDelta("text");
    counter.setFromUsage({ completion_tokens: 17 });
    expect(counter.getTotal()).toBe(17);
  });
});
