import { describe, it, expect } from "vitest";
import "dotenv/config";

describe("AI Stream Integration", () => {
  it("DeepSeek stream should return SSE data", async () => {
    const res = await fetch("http://localhost:3000/api/ai/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: "Say hi" }],
        systemPrompt: "You are a helpful assistant.",
      }),
    });
    expect(res.ok).toBe(true);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const text = await res.text();
    expect(text).toContain("data: ");
  }, 20000);

  it("GLM-4-Flash stream should return SSE data", async () => {
    const res = await fetch("http://localhost:3000/api/ai/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "glm-4-flash",
        messages: [{ role: "user", content: "Say hi" }],
        systemPrompt: "You are a helpful assistant.",
      }),
    });
    expect(res.ok).toBe(true);
    const text = await res.text();
    expect(text).toContain("data: ");
  }, 20000);

  it("Unknown model should return SSE stream with error message", async () => {
    // With smart routing, unknown models return 200 SSE stream with error content
    // (router tries registered nodes first, then falls back to built-in configs)
    const res = await fetch("http://localhost:3000/api/ai/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "unknown-model-xyz",
        messages: [{ role: "user", content: "test" }],
      }),
    });
    // Smart routing always returns 200 SSE; error is embedded in the stream
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    const text = await res.text();
    expect(text).toContain("error");
  }, 5000);
});
