/**
 * Pre-generate static translation JSON files for all 18 languages.
 * Run with: npx tsx scripts/generate-i18n.mts
 */
import { invokeLLM } from "../server/_core/llm.js";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.resolve("/home/ubuntu/mcmamoo-i18n");
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "pt", name: "Portuguese" },
  { code: "it", name: "Italian" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
  { code: "ms", name: "Malay" },
  { code: "tr", name: "Turkish" },
  { code: "nl", name: "Dutch" },
];

const zhData = JSON.parse(fs.readFileSync(`${OUTPUT_DIR}/zh.json`, "utf-8"));

const SYSTEM_PROMPT = `You are a professional translator for Mc&Mamoo (猫眼咨询), a premium Chinese brand management and strategy consulting firm.

CRITICAL RULES - follow EXACTLY:
- "毛智库" → ALWAYS translate to "Mao Strategic Think Tank" in non-Chinese languages
- "Sean DAI" → ALWAYS keep as "Sean DAI" (never translate)
- "Mc&Mamoo" → ALWAYS keep as "Mc&Mamoo"
- "MasterCard" → keep as "MasterCard"
- "Dark Matter Capital" → keep as "Dark Matter Capital"
- "KOL" → keep as "KOL"
- Brand names like 小仙炖, 江中猴姑, 小罐茶, 蟹太太, 胖哥食品 → keep in original Chinese
- "对标美国五角大楼兰德咨询" → translate to convey "benchmarked against RAND Corporation (the Pentagon's think tank)"
- Maintain premium, authoritative, sophisticated tone throughout
- Return ONLY a valid JSON object with the EXACT same structure as the input. No markdown, no code blocks, no extra text.`;

async function translateToLanguage(langName: string, langCode: string): Promise<Record<string, unknown>> {
  const response = await invokeLLM({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Translate this JSON from Chinese to ${langName}. Return ONLY the translated JSON with identical structure:\n\n${JSON.stringify(zhData, null, 2)}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content as string;
  return JSON.parse(content);
}

async function main() {
  console.log(`Starting translation generation for ${LANGUAGES.length} languages...\n`);

  for (const lang of LANGUAGES) {
    const outputFile = `${OUTPUT_DIR}/${lang.code}.json`;

    if (fs.existsSync(outputFile)) {
      console.log(`⏭  ${lang.code}.json already exists, skipping`);
      continue;
    }

    process.stdout.write(`🔄 Translating to ${lang.name} (${lang.code})... `);
    try {
      const translated = await translateToLanguage(lang.name, lang.code);
      fs.writeFileSync(outputFile, JSON.stringify(translated, null, 2), "utf-8");
      console.log(`✓ saved`);
    } catch (err) {
      console.log(`✗ ERROR: ${err}`);
    }

    // Small delay between requests
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\n✅ Done! Files generated:");
  fs.readdirSync(OUTPUT_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .forEach((f) => {
      const size = fs.statSync(`${OUTPUT_DIR}/${f}`).size;
      console.log(`  ${f}: ${size} bytes`);
    });
}

main().catch(console.error);
