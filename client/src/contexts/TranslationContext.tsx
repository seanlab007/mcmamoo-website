/**
 * TranslationContext — Dynamic LLM-powered translation system
 *
 * Strategy:
 * 1. Collect all text nodes from the DOM that need translation
 * 2. Batch-send to server LLM translation endpoint
 * 3. Cache results in localStorage (keyed by lang + text hash)
 * 4. Apply translations back to DOM nodes via data attributes
 *
 * This approach works without hardcoding any language strings.
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { trpc } from "@/lib/trpc";

export type LanguageCode = string;

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

interface TranslationContextValue {
  currentLang: LanguageCode;
  languages: Language[];
  isTranslating: boolean;
  setLanguage: (code: LanguageCode) => void;
}

const TranslationContext = createContext<TranslationContextValue>({
  currentLang: "zh",
  languages: [],
  isTranslating: false,
  setLanguage: () => {},
});

// Cache key prefix
const CACHE_PREFIX = "mcmamoo_trans_v1_";
// Data attribute to mark translated nodes
const ORIGINAL_ATTR = "data-original-text";
const LANG_ATTR = "data-translated-lang";

function getCacheKey(lang: LanguageCode, text: string): string {
  return `${CACHE_PREFIX}${lang}_${btoa(encodeURIComponent(text)).slice(0, 32)}`;
}

function getFromCache(lang: LanguageCode, text: string): string | null {
  try {
    return localStorage.getItem(getCacheKey(lang, text));
  } catch {
    return null;
  }
}

function saveToCache(lang: LanguageCode, text: string, translated: string): void {
  try {
    localStorage.setItem(getCacheKey(lang, text), translated);
  } catch {
    // localStorage full — ignore
  }
}

/**
 * Collect all translatable text nodes from the document.
 * We target specific elements to avoid translating code, scripts, etc.
 */
function collectTranslatableNodes(): Array<{ node: Text; original: string }> {
  const results: Array<{ node: Text; original: string }> = [];
  const SKIP_TAGS = new Set([
    "SCRIPT", "STYLE", "NOSCRIPT", "CODE", "PRE", "SVG", "MATH",
  ]);
  // Only translate inside main content areas
  const roots = document.querySelectorAll(
    "main, nav, header, footer, section, article, [data-translate]"
  );

  const walker = (root: Element) => {
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        // Skip empty or whitespace-only nodes
        const text = node.textContent?.trim();
        if (!text || text.length < 2) return NodeFilter.FILTER_REJECT;
        // Skip nodes that are purely numbers/symbols
        if (/^[\d\s+%.,·•\-–—→←↑↓★☆©®™\n]+$/.test(text)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node: Text | null;
    while ((node = tw.nextNode() as Text | null)) {
      const text = node.textContent?.trim() ?? "";
      if (text) results.push({ node, original: text });
    }
  };

  roots.forEach((root) => walker(root as Element));
  return results;
}

/**
 * Restore all DOM nodes to their original Chinese text
 */
function restoreOriginalText(): void {
  document.querySelectorAll(`[${ORIGINAL_ATTR}]`).forEach((el) => {
    const original = el.getAttribute(ORIGINAL_ATTR);
    if (original && el.firstChild?.nodeType === Node.TEXT_NODE) {
      el.firstChild.textContent = original;
    }
    el.removeAttribute(ORIGINAL_ATTR);
    el.removeAttribute(LANG_ATTR);
  });
}

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [currentLang, setCurrentLang] = useState<LanguageCode>(() => {
    try {
      return localStorage.getItem("mcmamoo_lang") ?? "zh";
    } catch {
      return "zh";
    }
  });
  const [isTranslating, setIsTranslating] = useState(false);
  const translateMutation = trpc.translate.translate.useMutation();
  const { data: languagesData } = trpc.translate.languages.useQuery();
  const languages: Language[] = languagesData ? [...languagesData] : [];
  const pendingLangRef = useRef<LanguageCode | null>(null);

  const applyTranslations = useCallback(
    async (lang: LanguageCode) => {
      if (lang === "zh") {
        restoreOriginalText();
        return;
      }

      setIsTranslating(true);
      try {
        const nodes = collectTranslatableNodes();
        if (nodes.length === 0) return;

        // Deduplicate texts
        const uniqueTexts = Array.from(new Set(nodes.map((n) => n.original)));

        // Split into cached vs. uncached
        const cached: Record<string, string> = {};
        const toTranslate: string[] = [];

        for (const text of uniqueTexts) {
          const hit = getFromCache(lang, text);
          if (hit) {
            cached[text] = hit;
          } else {
            toTranslate.push(text);
          }
        }

        // Batch translate uncached texts (max 40 per request)
        const BATCH_SIZE = 40;
        for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
          const batch = toTranslate.slice(i, i + BATCH_SIZE);
          const result = await translateMutation.mutateAsync({
            texts: batch,
            targetLang: lang,
            context: "Brand strategy consulting website for Mc&Mamoo (猫眼咨询)",
          });
          batch.forEach((text, idx) => {
            const translated = result.translations[idx];
            if (translated) {
              cached[text] = translated;
              saveToCache(lang, text, translated);
            }
          });
        }

        // Apply translations to DOM
        nodes.forEach(({ node, original }) => {
          const translated = cached[original];
          if (!translated || translated === original) return;
          const parent = node.parentElement;
          if (!parent) return;
          // Save original text if not already saved
          if (!parent.hasAttribute(ORIGINAL_ATTR)) {
            parent.setAttribute(ORIGINAL_ATTR, original);
            parent.setAttribute(LANG_ATTR, lang);
          }
          node.textContent = translated;
        });
      } catch (err) {
        console.error("[Translation] Failed:", err);
      } finally {
        setIsTranslating(false);
      }
    },
    [translateMutation]
  );

  const setLanguage = useCallback(
    (code: LanguageCode) => {
      pendingLangRef.current = code;
      setCurrentLang(code);
      try {
        localStorage.setItem("mcmamoo_lang", code);
      } catch {}
    },
    []
  );

  // Apply translation whenever language changes (after DOM settles)
  useEffect(() => {
    if (currentLang === "zh") {
      restoreOriginalText();
      return;
    }
    // Small delay to let React finish rendering
    const timer = setTimeout(() => {
      applyTranslations(currentLang);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentLang, applyTranslations]);

  return (
    <TranslationContext.Provider
      value={{ currentLang, languages, isTranslating, setLanguage }}
    >
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  return useContext(TranslationContext);
}
