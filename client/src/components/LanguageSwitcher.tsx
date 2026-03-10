/**
 * LanguageSwitcher — 18-language dropdown for the Navbar
 * Uses pre-generated static language packs from CDN (instant switching)
 */
import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Loader2 } from "lucide-react";
import { useTranslation, LANGUAGES } from "@/contexts/TranslationContext";

export default function LanguageSwitcher() {
  const { currentLang, isLoading, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentLangInfo = LANGUAGES.find((l) => l.code === currentLang);
  const displayName = currentLangInfo?.label ?? currentLang.toUpperCase();
  const displayFlag = currentLangInfo?.flag ?? "🌐";

  // Split into two columns for display
  const primaryLangs = LANGUAGES.slice(0, 9);
  const secondaryLangs = LANGUAGES.slice(9);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#C9A84C]/30 text-[#C9A84C] hover:border-[#C9A84C]/70 hover:bg-[#C9A84C]/10 transition-all duration-200 text-xs font-['DM_Mono'] tracking-wider"
        title="Switch Language"
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <span className="text-sm leading-none">{displayFlag}</span>
        )}
        <span className="hidden sm:inline max-w-[64px] truncate">{displayName}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#0D1B2A] border border-[#C9A84C]/30 rounded-lg shadow-2xl shadow-black/60 z-[200] overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-[#C9A84C]/20">
            <p className="text-[10px] text-[#C9A84C]/60 font-['DM_Mono'] tracking-widest uppercase">
              Select Language · 选择语言
            </p>
          </div>

          {/* Language grid */}
          <div className="p-2 max-h-80 overflow-y-auto">
            <div className="grid grid-cols-2 gap-1">
              {[...primaryLangs, ...secondaryLangs].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-left transition-all duration-150 ${
                    currentLang === lang.code
                      ? "bg-[#C9A84C]/20 border border-[#C9A84C]/50"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span className="text-base leading-none flex-shrink-0">{lang.flag}</span>
                  <div className="min-w-0">
                    <span className="text-xs text-white font-medium leading-tight block truncate">
                      {lang.label}
                    </span>
                  </div>
                  {currentLang === lang.code && (
                    <span className="ml-auto text-[#C9A84C] text-xs flex-shrink-0">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="px-3 py-2 border-t border-[#C9A84C]/20 bg-[#0A0A0A]/50">
            <p className="text-[9px] text-white/30 font-['DM_Mono']">
              Static language packs · 18 languages
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
