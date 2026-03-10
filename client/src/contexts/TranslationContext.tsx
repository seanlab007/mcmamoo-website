/**
 * TranslationContext — Static Language Pack System
 *
 * Uses pre-generated JSON language packs hosted on CDN.
 * Switching languages is near-instant (cached after first load).
 * No runtime LLM calls needed.
 *
 * Supported languages: zh, en, fr, de, es, pt, it, ru, ja, ko, ar, hi, th, vi, id, ms, tr, nl
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export type LangCode =
  | "zh" | "en" | "fr" | "de" | "es" | "pt" | "it" | "ru"
  | "ja" | "ko" | "ar" | "hi" | "th" | "vi" | "id" | "ms" | "tr" | "nl";

// Keep LanguageCode as alias for backward compatibility
export type LanguageCode = LangCode;

export interface Language {
  code: LangCode;
  name: string;      // Native name
  nativeName: string;
  label: string;     // Display label
  flag: string;      // Emoji flag
  rtl?: boolean;
}

export const LANGUAGES: Language[] = [
  { code: "zh", name: "中文", nativeName: "中文", label: "中文", flag: "🇨🇳" },
  { code: "en", name: "English", nativeName: "English", label: "English", flag: "🇺🇸" },
  { code: "fr", name: "Français", nativeName: "Français", label: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", nativeName: "Deutsch", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", name: "Español", nativeName: "Español", label: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Português", nativeName: "Português", label: "Português", flag: "🇧🇷" },
  { code: "it", name: "Italiano", nativeName: "Italiano", label: "Italiano", flag: "🇮🇹" },
  { code: "ru", name: "Русский", nativeName: "Русский", label: "Русский", flag: "🇷🇺" },
  { code: "ja", name: "日本語", nativeName: "日本語", label: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", nativeName: "한국어", label: "한국어", flag: "🇰🇷" },
  { code: "ar", name: "العربية", nativeName: "العربية", label: "العربية", flag: "🇸🇦", rtl: true },
  { code: "hi", name: "हिन्दी", nativeName: "हिन्दी", label: "हिन्दी", flag: "🇮🇳" },
  { code: "th", name: "ภาษาไทย", nativeName: "ภาษาไทย", label: "ภาษาไทย", flag: "🇹🇭" },
  { code: "vi", name: "Tiếng Việt", nativeName: "Tiếng Việt", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "id", name: "Bahasa Indonesia", nativeName: "Bahasa Indonesia", label: "Indonesia", flag: "🇮🇩" },
  { code: "ms", name: "Bahasa Melayu", nativeName: "Bahasa Melayu", label: "Melayu", flag: "🇲🇾" },
  { code: "tr", name: "Türkçe", nativeName: "Türkçe", label: "Türkçe", flag: "🇹🇷" },
  { code: "nl", name: "Nederlands", nativeName: "Nederlands", label: "Nederlands", flag: "🇳🇱" },
];

// CDN URLs for each language pack
const CDN_URLS: Record<LangCode, string> = {
  zh: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/zh_df5b9705.json",
  en: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/en_6b375a2c.json",
  fr: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/fr_2ef4858a.json",
  de: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/de_2a874477.json",
  es: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/es_760a2d06.json",
  pt: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/pt_94923035.json",
  it: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/it_4e2b07a5.json",
  ru: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/ru_53b062e8.json",
  ja: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/ja_26e91917.json",
  ko: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/ko_f4e53218.json",
  ar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/ar_cfd9b2b9.json",
  hi: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/hi_610562dc.json",
  th: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/th_180f764c.json",
  vi: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/vi_1edea59b.json",
  id: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/id_5a4c8dd4.json",
  ms: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/ms_8898e04d.json",
  tr: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/tr_e8eca65b.json",
  nl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/nl_9db37899.json",
};

type TranslationData = Record<string, unknown>;

interface TranslationContextValue {
  currentLang: LangCode;
  currentLanguage: Language;
  languages: Language[];
  translations: TranslationData;
  isLoading: boolean;
  isTranslating: boolean;
  setLanguage: (code: LangCode) => void;
  t: (key: string, fallback?: string) => string;
}

const TranslationContext = createContext<TranslationContextValue>({
  currentLang: "zh",
  currentLanguage: LANGUAGES[0],
  languages: LANGUAGES,
  translations: {},
  isLoading: false,
  isTranslating: false,
  setLanguage: () => {},
  t: (key: string, fallback?: string) => fallback ?? key,
});

// In-memory cache to avoid re-fetching
const translationCache: Partial<Record<LangCode, TranslationData>> = {};

function getNestedValue(obj: TranslationData, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [currentLang, setCurrentLang] = useState<LangCode>(() => {
    try {
      const saved = localStorage.getItem("mcmamoo_lang") as LangCode | null;
      return saved && CDN_URLS[saved] ? saved : "zh";
    } catch {
      return "zh";
    }
  });
  const [translations, setTranslations] = useState<TranslationData>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadLanguage = useCallback(async (code: LangCode) => {
    // Use cache if available
    if (translationCache[code]) {
      setTranslations(translationCache[code]!);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(CDN_URLS[code]);
      if (!res.ok) throw new Error(`Failed to load ${code}`);
      const data = await res.json();
      translationCache[code] = data;
      setTranslations(data);
    } catch (err) {
      console.error("Translation load error:", err);
      // Fallback: keep current translations
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLanguage(currentLang);
  }, [currentLang, loadLanguage]);

  // Apply RTL direction for Arabic
  useEffect(() => {
    const lang = LANGUAGES.find((l) => l.code === currentLang);
    document.documentElement.dir = lang?.rtl ? "rtl" : "ltr";
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  const setLanguage = useCallback((code: LangCode) => {
    try {
      localStorage.setItem("mcmamoo_lang", code);
    } catch {}
    setCurrentLang(code);
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const value = getNestedValue(translations, key);
      return value ?? fallback ?? key;
    },
    [translations]
  );

  const currentLanguage = LANGUAGES.find((l) => l.code === currentLang) ?? LANGUAGES[0];

  return (
    <TranslationContext.Provider
      value={{
        currentLang,
        currentLanguage,
        languages: LANGUAGES,
        translations,
        isLoading,
        isTranslating: isLoading,
        setLanguage,
        t,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}
