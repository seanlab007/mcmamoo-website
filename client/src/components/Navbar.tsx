/*
 * ============================================================
 * Navbar Component — 终极简洁版本 (双排平铺导航，无下拉菜单)
 * ============================================================
 * 设计理念：
 * 1. 取消所有下拉菜单，改为双排平铺导航
 * 2. 第一排：Logo + 核心导航 (AI Products, Subsidiaries, IP Licensing)
 * 3. 第二排：咨询、新闻稿、语言切换、预约按钮
 * 4. 所有链接直接可点击，绝无交互问题
 * 5. 更换金色眼睛 Logo，提升品牌质感
 * ============================================================
 */
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Menu, X, Zap } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language !== "zh";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    
    fetch(`${BACKEND_URL}/api/content/subscription`, { credentials: "include" })
      .then(res => {
        if (res.ok) setShowContent(true);
      })
      .catch(() => setShowContent(false));

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNav = (href: string) => {
    setIsMobileMenuOpen(false);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      setLocation(href);
    }
  };

  // AI 产品列表
  const aiProducts = [
    { label: "MaoAI (大脑)", href: "/mao-ai" },
    { label: "内容平台 (执行)", href: "/platform" },
    { label: "运营平台", href: "/operation" },
    { label: "小龙虾 AI", href: "/crayfish" },
  ];

  // 旗下子公司列表
  const subsidiaries = [
    { label: "Whale Pictures", href: "/whale-pictures" },
    { label: "猫眼工业", href: "/mao-industry" },
    { label: "毛智库", href: "/mao-think-tank" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled ? "bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5" : "bg-transparent"
    }`}>
      {/* 第一排：Logo + 导航 */}
      <div className="container py-4 flex items-center justify-between">
        {/* Logo & Brand Name */}
        <Link href="/">
          <a className="flex items-center gap-3 group flex-shrink-0">
            {/* 金色眼睛 Logo */}
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full" style={{ filter: "drop-shadow(0 0 8px rgba(201,168,76,0.6))" }}>
                {/* 眼睛轮廓 */}
                <ellipse cx="50" cy="50" rx="45" ry="35" fill="url(#goldGradient)" stroke="rgba(201,168,76,0.8)" strokeWidth="2" />
                {/* 瞳孔 */}
                <circle cx="50" cy="50" r="18" fill="#0A0A0A" />
                {/* 高光 */}
                <circle cx="58" cy="42" r="6" fill="rgba(201,168,76,0.9)" />
              </svg>
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: "#D4AF37", stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: "#C9A84C", stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: "#A68D2B", stopOpacity: 1 }} />
                </linearGradient>
              </defs>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-[0.2em] text-white font-['Noto_Serif_SC'] leading-none">Mc&Mamoo</span>
              <span className="text-[10px] font-bold tracking-[0.3em] text-[#C9A84C] font-['Noto_Serif_SC'] mt-1 uppercase">Growth Engine</span>
            </div>
          </a>
        </Link>

        {/* Desktop 第一行导航 */}
        <div className="hidden lg:flex items-center gap-12">
          {/* AI Products */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold tracking-widest text-[#C9A84C] font-['Noto_Serif_SC'] uppercase">AI Products</span>
            <div className="flex items-center gap-3">
              {aiProducts.slice(0, 2).map((p) => (
                <Link key={p.href} href={p.href}>
                  <a className="text-white/60 hover:text-[#C9A84C] text-sm font-['Noto_Serif_SC'] transition-colors cursor-pointer">
                    {p.label}
                  </a>
                </Link>
              ))}
            </div>
          </div>

          {/* Subsidiaries */}
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold tracking-widest text-[#C9A84C] font-['Noto_Serif_SC'] uppercase">Subsidiaries</span>
            <div className="flex items-center gap-3">
              {subsidiaries.slice(0, 2).map((s) => (
                <Link key={s.href} href={s.href}>
                  <a className="text-white/60 hover:text-[#C9A84C] text-sm font-['Noto_Serif_SC'] transition-colors cursor-pointer">
                    {s.label}
                  </a>
                </Link>
              ))}
            </div>
          </div>

          {/* IP Licensing */}
          <Link href="/ip-licensing">
            <a className="text-white/60 hover:text-[#C9A84C] text-sm font-['Noto_Serif_SC'] transition-colors cursor-pointer">
              IP Licensing
            </a>
          </Link>

          {/* 语言切换 */}
          <div className="h-4 w-px bg-white/10" />
          <LanguageSwitcher />

          {/* 预约按钮 */}
          <button onClick={() => handleNav("#contact")} className="px-6 py-2 bg-[#C9A84C] text-[#0A0A0A] text-[10px] font-bold tracking-widest uppercase hover:bg-[#D4B866] transition-all font-['Noto_Serif_SC']">
            {t("nav.bookConsultation")}
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="lg:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* 第二排：更多导航 (仅桌面端) */}
      <div className="hidden lg:block border-t border-white/5 bg-[#0A0A0A]/50">
        <div className="container py-3 flex items-center justify-between">
          {/* 更多 AI Products 和 Subsidiaries */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              {aiProducts.slice(2).map((p) => (
                <Link key={p.href} href={p.href}>
                  <a className="text-white/50 hover:text-white text-xs font-['Noto_Serif_SC'] transition-colors cursor-pointer">
                    {p.label}
                  </a>
                </Link>
              ))}
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-3">
              {subsidiaries.slice(2).map((s) => (
                <Link key={s.href} href={s.href}>
                  <a className="text-white/50 hover:text-white text-xs font-['Noto_Serif_SC'] transition-colors cursor-pointer">
                    {s.label}
                  </a>
                </Link>
              ))}
            </div>
          </div>

          {/* 咨询、新闻稿 */}
          <div className="flex items-center gap-6">
            <Link href="/pricing">
              <a className="text-white/50 hover:text-white text-xs font-['Noto_Serif_SC'] transition-colors cursor-pointer">
                Consulting
              </a>
            </Link>
            <Link href="/press">
              <a className="text-white/50 hover:text-white text-xs font-['Noto_Serif_SC'] transition-colors cursor-pointer">
                Press
              </a>
            </Link>
            {showContent && (
              <Link href="/content">
                <a className="flex items-center gap-1.5 px-3 py-1 bg-[#40d090]/10 border border-[#40d090]/30 text-[#40d090] text-[9px] font-bold tracking-widest uppercase hover:bg-[#40d090]/20 transition-all font-['Noto_Serif_SC']">
                  <Zap size={9} /> Platform
                </a>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-[#0A0A0A] z-40 transition-transform duration-500 lg:hidden ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-col items-center justify-center h-full gap-6 p-10">
          {/* AI Products */}
          <div className="text-center">
            <div className="text-[10px] font-bold tracking-widest text-[#C9A84C] font-['Noto_Serif_SC'] uppercase mb-3">AI Products</div>
            {aiProducts.map(p => (
              <Link key={p.href} href={p.href}>
                <a className="block text-lg text-white/60 hover:text-[#C9A84C] font-['Noto_Serif_SC'] py-2 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  {p.label}
                </a>
              </Link>
            ))}
          </div>

          <div className="w-12 h-px bg-white/10" />

          {/* Subsidiaries */}
          <div className="text-center">
            <div className="text-[10px] font-bold tracking-widest text-[#C9A84C] font-['Noto_Serif_SC'] uppercase mb-3">Subsidiaries</div>
            {subsidiaries.map(s => (
              <Link key={s.href} href={s.href}>
                <a className="block text-lg text-white/60 hover:text-white font-['Noto_Serif_SC'] py-2 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  {s.label}
                </a>
              </Link>
            ))}
          </div>

          <div className="w-12 h-px bg-white/10" />

          {/* 其他链接 */}
          <Link href="/ip-licensing">
            <a className="text-lg text-white/60 font-['Noto_Serif_SC'] py-2" onClick={() => setIsMobileMenuOpen(false)}>
              IP Licensing
            </a>
          </Link>
          <Link href="/pricing">
            <a className="text-lg text-white/60 font-['Noto_Serif_SC'] py-2" onClick={() => setIsMobileMenuOpen(false)}>
              Consulting
            </a>
          </Link>
          <Link href="/press">
            <a className="text-lg text-white/60 font-['Noto_Serif_SC'] py-2" onClick={() => setIsMobileMenuOpen(false)}>
              Press
            </a>
          </Link>

          <div className="w-12 h-px bg-white/10 mt-4" />

          <button onClick={() => handleNav("#contact")} className="mt-4 px-10 py-4 border border-[#C9A84C] text-[#C9A84C] text-lg uppercase tracking-widest font-['Noto_Serif_SC']">
            {t("nav.bookConsultation")}
          </button>

          <div className="mt-4 scale-125">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
