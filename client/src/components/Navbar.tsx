/*
 * Navbar — 猫眼增长引擎官网导航
 * Design: 透明渐变 → 深色固定导航，金色 hover 线条
 */
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

const industryItem = { label: "猫眼工业", href: "#mao-industry" };

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
            {/* Cat-eye logo from business card */}
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/mao_eye_logo_1a9f9467.png"
              alt="猫眼咋询 Logo"
              className="h-10 w-auto object-contain"
              style={{ filter: 'drop-shadow(0 0 6px rgba(201,168,76,0.5))' }}
            />
            <div>
              <div className="text-[#C9A84C] font-['Cormorant_Garamond'] font-semibold text-lg leading-none tracking-wide">
                Mc&amp;Mamoo
              </div>
              <div className="text-white/40 text-[9px] tracking-[0.2em] uppercase leading-none mt-0.5">
                Brand Management
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
            {/* 猫眼工业 下拉菜单 */}
            <div className="relative group">
              <button
                onClick={() => handleNav(industryItem.href)}
                className="relative text-[#4FC3F7]/80 hover:text-[#4FC3F7] text-sm tracking-wide transition-colors duration-300 py-1 flex items-center gap-1.5 whitespace-nowrap"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", letterSpacing: "0.1em" }}
              >
                <span style={{ width: 6, height: 6, background: "#4FC3F7", transform: "rotate(45deg)", display: "inline-block", flexShrink: 0, boxShadow: "0 0 6px #4FC3F7" }} />
                猫眼工业
                <span className="text-[#4FC3F7]/40 text-[0.6rem] ml-0.5">▾</span>
              </button>
              {/* 下拉菜单 */}
              <div className="absolute top-full left-0 mt-1 w-44 bg-[#0A0A0A]/98 border border-[#4FC3F7]/20 backdrop-blur-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <a
                  href="#mao-industry"
                  onClick={(e) => { e.preventDefault(); handleNav("#mao-industry"); }}
                  className="flex items-center gap-2 px-4 py-3 text-white/60 hover:text-[#4FC3F7] hover:bg-[#4FC3F7]/5 text-xs font-mono tracking-wider transition-colors duration-200 border-b border-white/5"
                >
                  <span style={{ width: 4, height: 4, background: "#4FC3F7", transform: "rotate(45deg)", display: "inline-block" }} />
                  工业板块首页
                </a>
                <a
                  href="/millennium-clock"
                  className="flex items-center gap-2 px-4 py-3 text-white/60 hover:text-[#C9A84C] hover:bg-[#C9A84C]/5 text-xs font-mono tracking-wider transition-colors duration-200 border-b border-white/5"
                >
                  <span style={{ width: 4, height: 4, background: "#C9A84C", borderRadius: "50%", display: "inline-block" }} />
                  万年钟详情页
                </a>
                <a
                  href="#contact"
                  onClick={(e) => { e.preventDefault(); handleNav("#contact"); }}
                  className="flex items-center gap-2 px-4 py-3 text-white/60 hover:text-[#C9A84C] hover:bg-[#C9A84C]/5 text-xs font-mono tracking-wider transition-colors duration-200"
                >
                  <span style={{ width: 4, height: 4, background: "#C9A84C", display: "inline-block" }} />
                  合作咨询
                </a>
              </div>
            </div>
            <a
              href="/maothink"
              className="relative text-[#8B1A1A] hover:text-[#C9A84C] text-sm tracking-wide transition-colors duration-300 py-1 flex items-center gap-1.5 whitespace-nowrap"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", letterSpacing: "0.1em" }}
            >
              <span style={{ width: 6, height: 6, background: "#8B1A1A", transform: "rotate(45deg)", display: "inline-block", flexShrink: 0 }} />
              毛智库
            </a>
            <a
              href="/platform"
              className="relative text-[#40d090]/80 hover:text-[#40d090] text-sm tracking-wide transition-colors duration-300 py-1 flex items-center gap-1.5 whitespace-nowrap"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", letterSpacing: "0.1em" }}
            >
              <span style={{ width: 6, height: 6, background: "#40d090", borderRadius: "50%", display: "inline-block", flexShrink: 0, boxShadow: "0 0 6px #40d090" }} />
              运营平台
            </a>
            <a
              href="/openclaw"
              className="relative text-[#e05a30]/80 hover:text-[#e05a30] text-sm tracking-wide transition-colors duration-300 py-1 flex items-center gap-1.5 whitespace-nowrap"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", letterSpacing: "0.1em" }}
            >
              <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>🦞</span>
              小龙虾 AI
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
            <a
              href="/pricing"
              className="ml-1 px-3 py-1.5 text-white/50 hover:text-[#C9A84C] text-xs tracking-widest uppercase transition-all duration-300 font-['DM_Mono'] whitespace-nowrap border border-transparent hover:border-[#C9A84C]/30"
            >
              {isEn ? 'Services' : '咨询服务'}
            </a>
            <a
              href="/press"
              className="ml-1 px-3 py-1.5 text-white/50 hover:text-[#C9A84C] text-xs tracking-widest uppercase transition-all duration-300 font-['DM_Mono'] whitespace-nowrap border border-transparent hover:border-[#C9A84C]/30"
            >
              {isEn ? 'Press' : '新闻'}
            </a>
            <button
              onClick={() => handleNav("#contact")}
              className="ml-1 px-5 py-2 border border-[#C9A84C]/60 text-[#C9A84C] text-sm tracking-wide hover:bg-[#C9A84C]/10 transition-all duration-300"
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
            onClick={() => handleNav(industryItem.href)}
            className="text-[#4FC3F7]/80 hover:text-[#4FC3F7] text-xl transition-colors duration-300 flex items-center gap-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span style={{ width: 8, height: 8, background: "#4FC3F7", transform: "rotate(45deg)", display: "inline-block", boxShadow: "0 0 8px #4FC3F7" }} />
            猫眼工业
          </button>
          <a
            href="/maothink"
            className="text-[#8B1A1A] hover:text-[#C9A84C] text-xl transition-colors duration-300 flex items-center gap-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span style={{ width: 8, height: 8, background: "#8B1A1A", transform: "rotate(45deg)", display: "inline-block" }} />
            毛智库
          </a>
          <a
            href="/platform"
            className="text-[#40d090]/80 hover:text-[#40d090] text-xl transition-colors duration-300 flex items-center gap-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span style={{ width: 8, height: 8, background: "#40d090", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 8px #40d090" }} />
            运营平台
          </a>
          <a
            href="/openclaw"
            className="text-[#e05a30]/80 hover:text-[#e05a30] text-xl transition-colors duration-300 flex items-center gap-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>🦞</span>
            小龙虾 AI
          </a>
          <a
            href="/maoai/login"
            className="text-[#C9A84C] hover:text-[#E8D5A0] text-xl transition-colors duration-300 flex items-center gap-2 px-4 py-2 border border-[#C9A84C]/40 hover:bg-[#C9A84C]/10"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span style={{ width: 8, height: 8, background: "#C9A84C", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 8px #C9A84C" }} />
            MaoAI 统一控制中心
          </a>
          <a
            href="/pricing"
            className="text-white/60 hover:text-[#C9A84C] text-xl transition-colors duration-300 flex items-center gap-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span style={{ width: 8, height: 8, background: "#C9A84C", display: "inline-block" }} />
            {isEn ? 'Services' : '咨询服务'}
          </a>
          <a
            href="/press"
            className="text-white/60 hover:text-[#C9A84C] text-xl transition-colors duration-300 flex items-center gap-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span style={{ width: 8, height: 8, background: "#C9A84C", display: "inline-block" }} />
            {isEn ? 'Press' : '新闻稿'}
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
