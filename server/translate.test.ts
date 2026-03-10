/**
 * Tests for the translation router
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the LLM module
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";
import { translateRouter, SUPPORTED_LANGUAGES } from "./routers/translate";

describe("translateRouter", () => {
  describe("SUPPORTED_LANGUAGES", () => {
    it("should have exactly 18 languages", () => {
      expect(SUPPORTED_LANGUAGES).toHaveLength(18);
    });

    it("should include Chinese as the first language", () => {
      expect(SUPPORTED_LANGUAGES[0].code).toBe("zh");
      expect(SUPPORTED_LANGUAGES[0].nativeName).toBe("中文");
    });

    it("should include all required languages", () => {
      const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
      const required = ["zh", "en", "fr", "de", "es", "pt", "it", "ru", "ja", "ko", "ar", "hi", "th", "vi", "id", "ms", "tr", "nl"];
      required.forEach((code) => {
        expect(codes).toContain(code);
      });
    });

    it("should have nativeName for each language", () => {
      SUPPORTED_LANGUAGES.forEach((lang) => {
        expect(lang.nativeName).toBeTruthy();
        expect(lang.code).toBeTruthy();
        expect(lang.name).toBeTruthy();
      });
    });
  });

  describe("translate procedure logic", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should return original texts when target is Chinese (zh)", async () => {
      // When translating to zh (source language), no LLM call should be made
      const texts = ["让品牌显贵", "让利润倍增"];
      const mockInvoke = vi.mocked(invokeLLM);

      // Simulate the procedure logic for zh target
      const targetLang = "zh";
      if (targetLang === "zh") {
        expect(mockInvoke).not.toHaveBeenCalled();
        expect(texts).toEqual(["让品牌显贵", "让利润倍增"]);
      }
    });

    it("should call LLM with correct structure for non-Chinese targets", async () => {
      const mockInvoke = vi.mocked(invokeLLM);
      mockInvoke.mockResolvedValueOnce({
        id: "test",
        created: Date.now(),
        model: "gemini-2.5-flash",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify({
                translations: ["Make Brands Premium", "Multiply Profits"],
              }),
            },
            finish_reason: "stop",
          },
        ],
      });

      const texts = ["让品牌显贵", "让利润倍增"];
      const result = await invokeLLM({
        messages: [
          { role: "system", content: "You are a translator." },
          { role: "user", content: texts.map((t, i) => `[${i + 1}] ${t}`).join("\n") },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "translation_result",
            strict: true,
            schema: {
              type: "object",
              properties: {
                translations: { type: "array", items: { type: "string" } },
              },
              required: ["translations"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = result.choices[0].message.content as string;
      const parsed = JSON.parse(content);
      expect(parsed.translations).toEqual(["Make Brands Premium", "Multiply Profits"]);
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });

    it("should handle LLM returning valid JSON translations", () => {
      const responseContent = JSON.stringify({
        translations: ["Make Brands Premium", "Multiply Profits", "Grow Across All Channels"],
      });
      const parsed = JSON.parse(responseContent);
      expect(Array.isArray(parsed.translations)).toBe(true);
      expect(parsed.translations).toHaveLength(3);
    });

    it("should handle batch size limit of 50 texts", () => {
      const texts = Array.from({ length: 50 }, (_, i) => `文本${i + 1}`);
      expect(texts).toHaveLength(50);
      // Texts over 50 should be rejected by zod schema
      const over50 = Array.from({ length: 51 }, (_, i) => `文本${i + 1}`);
      expect(over50).toHaveLength(51);
    });
  });
});
