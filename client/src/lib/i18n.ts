import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import zh from "../locales/zh.json";
import en from "../locales/en.json";
import ja from "../locales/ja.json";
import ko from "../locales/ko.json";
import fr from "../locales/fr.json";
import de from "../locales/de.json";
import es from "../locales/es.json";
import pt from "../locales/pt.json";
import ru from "../locales/ru.json";
import ar from "../locales/ar.json";
import hi from "../locales/hi.json";
import it from "../locales/it.json";
import nl from "../locales/nl.json";
import pl from "../locales/pl.json";
import tr from "../locales/tr.json";
import vi from "../locales/vi.json";
import th from "../locales/th.json";
import id from "../locales/id.json";
import { MAOAI_TRANSLATIONS, type MaoaiLocaleCode } from "../locales/maoai";

function withMaoAI<T extends Record<string, any>>(base: T, locale: MaoaiLocaleCode): T {
  const maoai = MAOAI_TRANSLATIONS[locale] ?? MAOAI_TRANSLATIONS.en;
  return {
    ...base,
    nav: {
      ...(base.nav ?? {}),
      ...(maoai.nav ?? {}),
    },
    maoai,
  };
}

export const LANGUAGES = [
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "vi", name: "Tiếng Việt", flag: "🇻🇳" },
  { code: "th", name: "ภาษาไทย", flag: "🇹🇭" },
  { code: "id", name: "Bahasa Indonesia", flag: "🇮🇩" },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      zh: { translation: withMaoAI(zh, "zh") },
      en: { translation: withMaoAI(en, "en") },
      ja: { translation: withMaoAI(ja, "ja") },
      ko: { translation: withMaoAI(ko, "ko") },
      fr: { translation: withMaoAI(fr, "fr") },
      de: { translation: withMaoAI(de, "de") },
      es: { translation: withMaoAI(es, "es") },
      pt: { translation: withMaoAI(pt, "pt") },
      ru: { translation: withMaoAI(ru, "ru") },
      ar: { translation: withMaoAI(ar, "ar") },
      hi: { translation: withMaoAI(hi, "hi") },
      it: { translation: withMaoAI(it, "it") },
      nl: { translation: withMaoAI(nl, "nl") },
      pl: { translation: withMaoAI(pl, "pl") },
      tr: { translation: withMaoAI(tr, "tr") },
      vi: { translation: withMaoAI(vi, "vi") },
      th: { translation: withMaoAI(th, "th") },
      id: { translation: withMaoAI(id, "id") },
    },
    fallbackLng: "zh",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
