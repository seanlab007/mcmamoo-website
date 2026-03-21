/*
 * Navbar — Mc&Mamoo Growth Engine Website Navigation
 * Design: transparent gradient → dark fixed nav, gold hover lines
 * i18n: full bilingual support
 */
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: t('nav.about'), href: "#about" },
    { label: t('nav.kol'), href: "#kol" },
    { label: t('nav.services'), href: "#services" },
    { label: t('nav.cases'), href: "#global-cases" },
    { label: t('nav.awards'), href: "#awards" },
    { label: t('nav.contact'), href: "#contact" },
  ];

  const industryLabel = isEn ? "Mao Industry" : "猫眼工业";
  const industryHomeLabel = isEn ? "Industry Home" : "工业板块首页";
  const millenniumLabel = isEn ? "Millennium Clock" : "万年钟详情页";
  const cooperationLabel = isEn ? "Partnership" : "合作咨询";
  const thinkTankLabel = isEn ? "Mao Think Tank" : "毛智库";
  const platformLabel = isEn ? "Operations Platform" : "运营平台";
  const crawfishLabel = isEn ? "Crawfish AI" : "小龙虾 AI";
  const maoAILabel = isEn ? "MaoAI Control Center" : "MaoAI 统一控制中心";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNav = (href: string) => {
    setMenuOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <div className="container flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="flex items-center gap-3 group"
          >
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/mao_eye_logo_1a9f9467.png"
              alt="Mc&Mamoo Logo"
              className="h-10 w-auto object-contain"
              style={{ filter: 'drop-shadow(0 0 6px rgba(201,168,76,0.5))' }}
            />
            <div>
              <div className="text-[#C9A84C] font-['Cormorant_Garamond'] font-semibold text-lg leading-none tracking-wide">
                Mc&amp;Mamoo
              </div>
              <div className="text-white/40 text-[9px] tracking-[0.2em] uppercase leading-none mt-0.5">
                {isEn ? 'Growth Engine' : 'Brand Management'}
              </div>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                className="relative text-white/70 hover:text-[#C9A84C] text-sm tracking-wide transition-colors duration-300 hover-gold-line py-1 whitespace-nowrap"
              >
                {item.label}
              </button>
            ))}
            {/* Mao Industry dropdown */}
            <div className="relative group">
              <button
                onClick={() => handleNav("#mao-industry")}
                className="relative text-[#4FC3F7]/80 hover:text-[#4FC3F7] text-sm tracking-wide transition-colors duration-300 py-1 flex items-center gap-1.5 whitespace-nowrap"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", letterSpacing: "0.1em" }}
              >
                <span style={{ width: 6, height: 6, background: "#4FC3F7", transform: "rotate(45deg)", display: "inline-block", flexShrink: 0, boxShadow: "0 0 6px #4FC3F7" }} />
                {industryLabel}
                <span className="text-[#4FC3F7]/40 text-[0.6rem] ml-0.5">▾</span>
              </button>
              <div className="absolute top-full left-0 mt-1 w-44 bg-[#0A0A0A]/98 border border-[#4FC3F7]/20 backdrop-blur-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <a
                  href="#mao-industry"
                  onClick={(e) => { e.preventDefault(); handleNav("#mao-industry"); }}
                  className="flex items-center gap-2 px-4 py-3 text-white/60 hover:text-[#4FC3F7] hover:bg-[#4FC3F7]/5 text-xs font-mono tracking-wider transition-colors duration-200 border-b border-white/5"
                >
                  <span style={{ width: 4, height: 4, background: "#4FC3F7", transform: "rotate(45deg)", display: "inline-block" }} />
                  {industryHomeLabel}
                </a>
                <a
                  href="/millennium-clock"
                  className="flex items-center gap-2 px-4 py-3 text-white/60 hover:text-[#C9A84C] hover:bg-[#C9A84C]/5 text-xs font-mono tracking-wider transition-colors duration-200 border-b border-white/5"
                >
                  <span style={{ width: 4, height: 4, background: "#C9A84C", borderRadius: "50%", display: "inline-block" }} />
                  {millenniumLabel}
                </a>
                <a
                  href="#contact"
                  onClick={(e) => { e.preventDefault(); handleNav("#contact"); }}
                  className="flex items-center gap-2 px-4 py-3 text-white/60 hover:text-[#C9A84C] hover:bg-[#C9A84C]/5 text-xs font-mono tracking-wider transition-colors duration-200"
                >
                  <span style={{ width: 4, height: 4, background: "#C9A84C", display: "inline-block" }} />
                  {cooperationLabel}
                </a>
              </div>
            </div>
            <a
              href="/maothink"
              className="relative text-[#8B1A1A] hover:text-[#C9A84C] text-sm tracking-wide transition-colors duration-300 py-1 flex items-center gap-1.5 whitespace-nowrap"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", letterSpacing: "0.1em" }}
            >
              <span style={{ width: 6, height: 6, background: "#8B1A1A", transform: "rotate(45deg)", display: "inline-block", flexShrink: 0 }} />
              {thinkTankLabel}
            </a>
            <a
              href="/platform"
              className="relative text-[#40d090]/80 hover:text-[#40d090] text-sm tracking-wide transition-colors duration-300 py-1 flex items-center gap-1.5 whitespace-nowrap"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", letterSpacing: "0.1em" }}
            >
              <span style={{ width: 6, height: 6, background: "#40d090", borderRadius: "50%", display: "inline-block", flexShrink: 0, boxShadow: "0 0 6px #40d090" }} />
              {platformLabel}
            </a>
            <a
              href="/openclaw"
              className="relative text-[#e05a30]/80 hover:text-[#e05a30] text-sm tracking-wide transition-colors duration-300 py-1 flex items-center gap-1.5 whitespace-nowrap"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", letterSpacing: "0.1em" }}
            >
              <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>🦞</span>
              {crawfishLabel}
            </a>
            <a
              href="/maoai/login"
              className="relative text-[#C9A84C] hover:text-[#E8D5A0] text-sm tracking-wide transition-all duration-300 py-1 px-3 border border-[#C9A84C]/40 hover:border-[#C9A84C]/80 hover:bg-[#C9A84C]/10 flex items-center gap-1.5 whitespace-nowrap"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", letterSpacing: "0.1em" }}
            >
              <span style={{ width: 6, height: 6, background: "#C9A84C", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 6px #C9A84C", flexShrink: 0 }} />
              MaoAI
            </a>
            <LanguageSwitcher />
            <button
              onClick={() => handleNav("#contact")}
              className="ml-2 px-5 py-2 border border-[#C9A84C]/60 text-[#C9A84C] text-sm tracking-wide hover:bg-[#C9A84C]/10 transition-all duration-300"
            >
              {t('nav.bookConsultation')}
            </button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-white/70 hover:text-[#C9A84C] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 bg-[#0A0A0A]/98 backdrop-blur-lg transition-all duration-400 lg:hidden ${
          menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navItems.map((item, i) => (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className="text-white/80 hover:text-[#C9A84C] text-2xl font-['Noto_Serif_SC'] transition-colors duration-300"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => handleNav("#mao-industry")}
            className="text-[#4FC3F7]/80 hover:text-[#4FC3F7] text-xl transition-colors duration-300 flex items-center gap-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span style={{ width: 8, height: 8, background: "#4FC3F7", transform: "rotate(45deg)", display: "inline-block", boxShadow: "0 0 8px #4FC3F7" }} />
            {industryLabel}
          </button>
          <a
            href="/maothink"
            className="text-[#8B1A1A] hover:text-[#C9A84C] text-xl transition-colors duration-300 flex items-center gap-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span style={{ width: 8, height: 8, background: "#8B1A1A", transform: "rotate(45deg)", display: "inline-block" }} />
            {thinkTankLabel}
          </a>
          <a
            href="/platform"
            className="text-[#40d090]/80 hover:text-[#40d090] text-xl transition-colors duration-300 flex items-center gap-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span style={{ width: 8, height: 8, background: "#40d090", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 8px #40d090" }} />
            {platformLabel}
          </a>
          <a
            href="/openclaw"
            className="text-[#e05a30]/80 hover:text-[#e05a30] text-xl transition-colors duration-300 flex items-center gap-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>🦞</span>
            {crawfishLabel}
          </a>
          <a
            href="/maoai/login"
            className="text-[#C9A84C] hover:text-[#E8D5A0] text-xl transition-colors duration-300 flex items-center gap-2 px-4 py-2 border border-[#C9A84C]/40 hover:bg-[#C9A84C]/10"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span style={{ width: 8, height: 8, background: "#C9A84C", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 8px #C9A84C" }} />
            {maoAILabel}
          </a>
          <button
            onClick={() => handleNav("#contact")}
            className="mt-4 px-8 py-3 border border-[#C9A84C] text-[#C9A84C] text-lg hover:bg-[#C9A84C]/10 transition-all duration-300"
          >
            {t('nav.bookConsultation')}
          </button>
          <div className="mt-2">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </>
  );
}
