/**
 * LanguageSwitcher — 18-language dropdown for the Navbar
 * Uses TranslationContext to switch language and trigger LLM translation
 */
import { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Loader2 } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

export default function LanguageSwitcher() {
  const { currentLang, languages, isTranslating, setLanguage } = useTranslation();
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

  const currentLangInfo = languages.find((l) => l.code === currentLang);
  const displayName = currentLangInfo?.nativeName ?? currentLang.toUpperCase();

  // Group languages for display
  const primaryLangs = languages.slice(0, 6);
  const secondaryLangs = languages.slice(6);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-[#C9A84C]/30 text-[#C9A84C] hover:border-[#C9A84C]/70 hover:bg-[#C9A84C]/10 transition-all duration-200 text-xs font-['DM_Mono'] tracking-wider"
        title="Switch Language"
        disabled={isTranslating}
      >
        {isTranslating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Globe className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline max-w-[60px] truncate">{displayName}</span>
        <ChevronDown
          className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[#0D1B2A] border border-[#C9A84C]/30 rounded-lg shadow-2xl shadow-black/60 z-[200] overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 border-b border-[#C9A84C]/20">
            <p className="text-[10px] text-[#C9A84C]/60 font-['DM_Mono'] tracking-widest uppercase">
              Select Language
            </p>
          </div>

          {/* Language grid */}
          <div className="p-2 max-h-72 overflow-y-auto scrollbar-thin">
            {/* Primary languages */}
            <div className="grid grid-cols-2 gap-1 mb-1">
              {primaryLangs.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setOpen(false);
                  }}
                  className={`flex flex-col items-start px-3 py-2 rounded text-left transition-all duration-150 ${
                    currentLang === lang.code
                      ? "bg-[#C9A84C]/20 border border-[#C9A84C]/50"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span className="text-xs text-white font-medium leading-tight">
                    {lang.nativeName}
                  </span>
                  <span className="text-[10px] text-white/40 leading-tight mt-0.5">
                    {lang.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-white/10 my-1" />

            {/* Secondary languages */}
            <div className="grid grid-cols-2 gap-1">
              {secondaryLangs.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setOpen(false);
                  }}
                  className={`flex flex-col items-start px-3 py-2 rounded text-left transition-all duration-150 ${
                    currentLang === lang.code
                      ? "bg-[#C9A84C]/20 border border-[#C9A84C]/50"
                      : "hover:bg-white/5 border border-transparent"
                  }`}
                >
                  <span className="text-xs text-white font-medium leading-tight">
                    {lang.nativeName}
                  </span>
                  <span className="text-[10px] text-white/40 leading-tight mt-0.5">
                    {lang.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="px-3 py-2 border-t border-[#C9A84C]/20 bg-[#0A0A0A]/50">
            <p className="text-[9px] text-white/30 font-['DM_Mono']">
              AI-powered translation · 18 languages
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
