import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/lib/i18n";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export default function LanguageSwitcher({ className = "", compact = false }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    // Handle RTL for Arabic
    document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = code;
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[#C9A84C] hover:text-[#E8C96A] hover:bg-white/5 transition-all duration-200 text-sm font-medium"
        title="切换语言 / Switch Language"
      >
        <Globe size={15} className="opacity-80" />
        {!compact && (
          <>
            <span className="text-base leading-none">{currentLang.flag}</span>
            <span className="hidden sm:inline text-xs">{currentLang.name}</span>
          </>
        )}
        {compact && <span className="text-base leading-none">{currentLang.flag}</span>}
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-[200] bg-[#0D0D0D] border border-[#C9A84C]/20 rounded-lg shadow-2xl overflow-hidden"
          style={{ minWidth: "180px", maxHeight: "400px", overflowY: "auto" }}
        >
          {/* Grid layout: 2 columns */}
          <div className="grid grid-cols-2 gap-0 p-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center gap-2 px-3 py-2 text-xs rounded-md transition-all duration-150 text-left
                  ${i18n.language === lang.code
                    ? "bg-[#C9A84C]/20 text-[#E8C96A] font-semibold"
                    : "text-gray-300 hover:bg-white/5 hover:text-white"
                  }`}
              >
                <span className="text-base leading-none flex-shrink-0">{lang.flag}</span>
                <span className="truncate">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
