import { describe, it, expect } from "vitest";
import "dotenv/config";

describe("AI API Keys Configuration", () => {
  it("DEEPSEEK_API_KEY should be set", () => {
    expect(process.env.DEEPSEEK_API_KEY).toBeTruthy();
    expect(process.env.DEEPSEEK_API_KEY?.startsWith("sk-")).toBe(true);
  });

  it("ZHIPU_API_KEY should be set", () => {
    expect(process.env.ZHIPU_API_KEY).toBeTruthy();
    expect(process.env.ZHIPU_API_KEY?.length).toBeGreaterThan(10);
  });

  it("GROQ_API_KEY should be set", () => {
    expect(process.env.GROQ_API_KEY).toBeTruthy();
    expect(process.env.GROQ_API_KEY?.startsWith("gsk_")).toBe(true);
  });

  it("MODEL_CONFIGS should include all providers", async () => {
    const { MODEL_CONFIGS } = await import("./routers");
    expect(MODEL_CONFIGS["deepseek-chat"]).toBeDefined();
    expect(MODEL_CONFIGS["glm-4-flash"]).toBeDefined();
    expect(MODEL_CONFIGS["llama-3.3-70b-versatile"]).toBeDefined();
  }, 15000);

  it("DeepSeek API should respond (lightweight check)", async () => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return;
    const res = await fetch("https://api.deepseek.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(res.status).toBe(200);
  }, 15000);
});
