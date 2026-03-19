/**
 * Translation Router — LLM-powered dynamic translation
 * Uses built-in Gemini LLM to translate text batches on-demand.
 * Results are cached on the client side (localStorage) to avoid repeated calls.
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const SUPPORTED_LANGUAGES = [
  { code: "zh", name: "中文", nativeName: "中文" },
  { code: "en", name: "English", nativeName: "English" },
  { code: "fr", name: "French", nativeName: "Français" },
  { code: "de", name: "German", nativeName: "Deutsch" },
  { code: "es", name: "Spanish", nativeName: "Español" },
  { code: "pt", name: "Portuguese", nativeName: "Português" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "th", name: "Thai", nativeName: "ภาษาไทย" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", nativeName: "Bahasa Melayu" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "nl", name: "Dutch", nativeName: "Nederlands" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const translateRouter = router({
  // Return supported languages list
  languages: publicProcedure.query(() => SUPPORTED_LANGUAGES),

  // Translate a batch of text strings to target language
  // texts: array of source strings (Chinese)
  // targetLang: target language code
  // Returns: array of translated strings in the same order
  translate: publicProcedure
    .input(
      z.object({
        texts: z.array(z.string().max(500)).max(50),
        targetLang: z.string().min(2).max(10),
        context: z.string().max(200).optional(), // optional context hint
      })
    )
    .mutation(async ({ input }) => {
      const { texts, targetLang, context } = input;

      // If target is Chinese (source language), return as-is
      if (targetLang === "zh") {
        return { translations: texts };
      }

      const targetLangInfo = SUPPORTED_LANGUAGES.find(
        (l) => l.code === targetLang
      );
      const targetLangName = targetLangInfo?.name ?? targetLang;

      // Build a numbered list for the LLM to translate
      const numberedTexts = texts
        .map((t, i) => `[${i + 1}] ${t}`)
        .join("\n");

      const systemPrompt = `You are a professional translator specializing in business, brand strategy, and consulting content.
You are translating content for Mc&Mamoo (猫眼增长引擎), a premium Chinese brand management and strategy consulting firm.

NEVER translate these — keep them EXACTLY as written in ALL languages:
- "毛智库" → ALWAYS translate to "Mao Strategic Think Tank" in non-Chinese languages (NEVER use "Mao Think Tank" or keep as Chinese characters)
- "Sean DAI" → ALWAYS output "Sean DAI" (it is a person's name, NEVER replace with "Spokesperson" or any title)
- "Mc&Mamoo" → always keep as "Mc&Mamoo"
- "猫眼增长引擎" → keep as "Mc&Mamoo" or "猫眼增长引擎"
- Brand names (小仙炖, 江中猴姑, 小罐茶, 蟹太太, 胖哥食品) → keep in original form
- "对标美国五角大楼兰德咨询" → translate naturally to convey "benchmarked against RAND Corporation (Pentagon's think tank)"
- Maintain a premium, authoritative, and sophisticated tone throughout
${context ? `Context: ${context}` : ""}

CRITICAL RULES:
1. "毛智库" must ALWAYS appear as "Mao Strategic Think Tank" in non-Chinese output
2. "Sean DAI" must ALWAYS appear as "Sean DAI" in output, never as a job title or translated name
3. Return ONLY a valid JSON object with no markdown, no code blocks, no extra text
4. The JSON must have a "translations" key containing an array of translated strings in the EXACT same order as input`;

      const userPrompt = `Translate the following ${texts.length} text item(s) from Chinese to ${targetLangName}.
Return ONLY a JSON object: {"translations": ["translation1", "translation2", ...]}

Texts to translate:
${numberedTexts}`;

      const result = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "translation_result",
            strict: true,
            schema: {
              type: "object",
              properties: {
                translations: {
                  type: "array",
                  items: { type: "string" },
                  description: "Array of translated strings in the same order as input",
                },
              },
              required: ["translations"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = result.choices[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new Error("Translation failed: empty response");
      }

      let parsed: { translations: string[] };
      try {
        parsed = JSON.parse(content);
      } catch {
        // Try to extract JSON from the response
        const match = content.match(/\{[\s\S]*\}/);
        if (!match) throw new Error("Translation failed: invalid JSON response");
        parsed = JSON.parse(match[0]);
      }

      if (!Array.isArray(parsed.translations)) {
        throw new Error("Translation failed: invalid response structure");
      }

      // Ensure we have the same number of translations as inputs
      const translations = texts.map(
        (_, i) => parsed.translations[i] ?? texts[i]
      );

      return { translations };
    }),
});
