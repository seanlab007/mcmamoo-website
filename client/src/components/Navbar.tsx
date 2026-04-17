/*
 * ============================================================
<<<<<<< HEAD
 * Navbar Component — 导航栏重构
 * ============================================================
 * 逻辑变更：
 * 1. 整合 AutoClip 进入“猫眼内容平台”，不再作为独立一级入口
 * 2. 明确 MaoAI 为“大脑”定位
 * 3. 统一付费用户的内容平台入口逻辑
<<<<<<< HEAD
 * ============================================================
 */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
=======
 * 4. 修正毛智库 (MaoThinkTank) 路由为 /mao-think-tank
=======
 * Navbar Component — 终极简洁版本 (双排平铺导航，无下拉菜单)
 * ============================================================
 * 设计理念：
 * 1. 取消所有下拉菜单，改为双排平铺导航
 * 2. 第一排：Logo + 核心导航 (AI Products, Subsidiaries, IP Licensing)
 * 3. 第二排：咨询、新闻稿、语言切换、预约按钮
 * 4. 所有链接直接可点击，绝无交互问题
 * 5. 更换金色眼睛 Logo，提升品牌质感
>>>>>>> origin/fix/final-navbar-restructure-1774631973
 * ============================================================
 */
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
<<<<<<< HEAD
>>>>>>> origin/fix/navbar-dropdown-interaction
import { useTranslation } from "react-i18next";
import { ChevronDown, Menu, X, Zap } from "lucide-react";
=======
import { useTranslation } from "react-i18next";
import { Menu, X, Zap } from "lucide-react";
>>>>>>> origin/fix/final-navbar-restructure-1774631973
import LanguageSwitcher from "./LanguageSwitcher";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
<<<<<<< HEAD
  const [isAiDropdownOpen, setIsAiDropdownOpen] = useState(false);
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);
=======
>>>>>>> origin/fix/final-navbar-restructure-1774631973
  const [showContent, setShowContent] = useState(false);
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language !== "zh";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    
<<<<<<< HEAD
    // 检查内容平台访问权限 (付费用户逻辑)
=======
>>>>>>> origin/fix/final-navbar-restructure-1774631973
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

<<<<<<< HEAD
  const aiProducts = [
    { label: "MaoAI (大脑)", href: "/mao-ai", color: "#C9A84C", dot: "circle", glow: true, desc: "战略决策与市场洞察" },
    { label: "内容平台 (执行)", href: "/platform", color: "#40d090", dot: "diamond", desc: "含 AutoClip 视频自动化" },
    { label: "运营平台", href: "/operation", color: "#60A5FA", dot: "circle", desc: "全域数据监控" },
    { label: "小龙虾 AI", href: "/crayfish", color: "#F87171", dot: "emoji", emoji: "🦞", desc: "垂直行业解决方案" },
  ];

  const subsidiaries = [
    { label: "Whale Pictures", href: "/whale-pictures", color: "#F59E0B" },
    { label: "猫眼工业", href: "/mao-industry", color: "#C9A84C" },
<<<<<<< HEAD
    { label: "毛智库", href: "/maothink", color: "#E53E3E" },
=======
    { label: "毛智库", href: "/mao-think-tank", color: "#E53E3E" },
>>>>>>> origin/fix/navbar-dropdown-interaction
=======
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
>>>>>>> origin/fix/final-navbar-restructure-1774631973
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
<<<<<<< HEAD
      isScrolled ? "bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/5 py-4" : "bg-transparent py-8"
    }`}>
      <div className="container flex items-center justify-between">
        {/* Logo */}
<<<<<<< HEAD
        <a href="/" onClick={(e) => { e.preventDefault(); handleNav("/"); }} className="relative group">
          <span className="text-2xl font-bold tracking-[0.2em] text-white font-['DM_Mono']">MC&MAMOO</span>
          <div className="absolute -bottom-1 left-0 w-0 h-px bg-[#C9A84C] transition-all duration-500 group-hover:w-full" />
        </a>
=======
        <Link href="/">
          <a className="relative group">
            <span className="text-2xl font-bold tracking-[0.2em] text-white font-['DM_Mono']">MC&MAMOO</span>
            <div className="absolute -bottom-1 left-0 w-0 h-px bg-[#C9A84C] transition-all duration-500 group-hover:w-full" />
          </a>
        </Link>
>>>>>>> origin/fix/navbar-dropdown-interaction

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-10">
          {/* AI 产品 Dropdown */}
<<<<<<< HEAD
          <div className="relative" onMouseEnter={() => setIsAiDropdownOpen(true)} onMouseLeave={() => setIsAiDropdownOpen(false)}>
            <button className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs tracking-widest uppercase font-['DM_Mono'] transition-colors">
              AI Products <ChevronDown size={12} className={`transition-transform duration-300 ${isAiDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {isAiDropdownOpen && (
              <div className="absolute top-full left-0 mt-4 w-64 bg-[#111] border border-white/10 p-4 shadow-2xl">
                {aiProducts.map((p) => (
                  <a key={p.href} href={p.href} className="flex items-start gap-3 p-3 hover:bg-white/5 transition-colors group">
                    <div className="mt-1">
                      {p.dot === "diamond" ? <div className="w-2 h-2 rotate-45" style={{ background: p.color }} /> : <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />}
                    </div>
                    <div>
                      <div className="text-white text-sm font-bold group-hover:text-[#C9A84C] transition-colors">{p.label}</div>
                      <div className="text-white/30 text-[10px] mt-0.5">{p.desc}</div>
                    </div>
                  </a>
=======
          <div className="relative group" onMouseEnter={() => setIsAiDropdownOpen(true)} onMouseLeave={() => setIsAiDropdownOpen(false)}>
            <button className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs tracking-widest uppercase font-['DM_Mono'] transition-colors">
              AI Products <ChevronDown size={12} className={`transition-transform duration-300 ${isAiDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {/* 隐形缓冲区 */}
            {isAiDropdownOpen && <div className="absolute top-0 left-0 right-0 h-3" />}
            {isAiDropdownOpen && (
              <div className="absolute top-full left-0 mt-0 w-64 bg-[#111] border border-white/10 p-4 shadow-2xl rounded-sm">
                {aiProducts.map((p) => (
                  <Link key={p.href} href={p.href}>
                    <a className="flex items-start gap-3 p-3 hover:bg-white/5 transition-colors group">
                      <div className="mt-1">
                        {p.dot === "diamond" ? <div className="w-2 h-2 rotate-45" style={{ background: p.color }} /> : <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />}
                      </div>
                      <div>
                        <div className="text-white text-sm font-bold group-hover:text-[#C9A84C] transition-colors">{p.label}</div>
                        <div className="text-white/30 text-[10px] mt-0.5">{p.desc}</div>
                      </div>
                    </a>
                  </Link>
>>>>>>> origin/fix/navbar-dropdown-interaction
                ))}
              </div>
            )}
          </div>

          {/* 旗下子公司 Dropdown */}
<<<<<<< HEAD
          <div className="relative" onMouseEnter={() => setIsSubDropdownOpen(true)} onMouseLeave={() => setIsSubDropdownOpen(false)}>
            <button className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs tracking-widest uppercase font-['DM_Mono'] transition-colors">
              Subsidiaries <ChevronDown size={12} className={`transition-transform duration-300 ${isSubDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {isSubDropdownOpen && (
              <div className="absolute top-full left-0 mt-4 w-48 bg-[#111] border border-white/10 p-2 shadow-2xl">
                {subsidiaries.map((s) => (
                  <a key={s.href} href={s.href} className="block p-3 text-white/60 hover:text-white hover:bg-white/5 text-xs tracking-widest uppercase font-['DM_Mono'] transition-all">
                    {s.label}
                  </a>
=======
          <div className="relative group" onMouseEnter={() => setIsSubDropdownOpen(true)} onMouseLeave={() => setIsSubDropdownOpen(false)}>
            <button className="flex items-center gap-1.5 text-white/70 hover:text-white text-xs tracking-widest uppercase font-['DM_Mono'] transition-colors">
              Subsidiaries <ChevronDown size={12} className={`transition-transform duration-300 ${isSubDropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {/* 隐形缓冲区 */}
            {isSubDropdownOpen && <div className="absolute top-0 left-0 right-0 h-3" />}
            {isSubDropdownOpen && (
              <div className="absolute top-full left-0 mt-0 w-48 bg-[#111] border border-white/10 p-2 shadow-2xl rounded-sm">
                {subsidiaries.map((s) => (
                  <Link key={s.href} href={s.href}>
                    <a className="block p-3 text-white/60 hover:text-white hover:bg-white/5 text-xs tracking-widest uppercase font-['DM_Mono'] transition-all">
                      {s.label}
                    </a>
                  </Link>
>>>>>>> origin/fix/navbar-dropdown-interaction
                ))}
              </div>
            )}
          </div>

<<<<<<< HEAD
          <a href="/ip-licensing" className="text-white/70 hover:text-white text-xs tracking-widest uppercase font-['DM_Mono'] transition-colors">IP Licensing</a>
          <a href="/pricing" className="text-white/70 hover:text-white text-xs tracking-widest uppercase font-['DM_Mono'] transition-colors">Consulting</a>
          <a href="/press" className="text-white/70 hover:text-white text-xs tracking-widest uppercase font-['DM_Mono'] transition-colors">Press</a>
          
          {showContent && (
            <a href="/content" className="flex items-center gap-2 px-4 py-1.5 bg-[#40d090]/10 border border-[#40d090]/30 text-[#40d090] text-[10px] font-bold tracking-widest uppercase hover:bg-[#40d090]/20 transition-all">
              <Zap size={10} /> Platform
            </a>
=======
          <Link href="/ip-licensing">
            <a className="text-white/70 hover:text-white text-xs tracking-widest uppercase font-['DM_Mono'] transition-colors">IP Licensing</a>
          </Link>
          <Link href="/pricing">
            <a className="text-white/70 hover:text-white text-xs tracking-widest uppercase font-['DM_Mono'] transition-colors">Consulting</a>
          </Link>
          <Link href="/press">
            <a className="text-white/70 hover:text-white text-xs tracking-widest uppercase font-['DM_Mono'] transition-colors">Press</a>
          </Link>
          
          {showContent && (
            <Link href="/content">
              <a className="flex items-center gap-2 px-4 py-1.5 bg-[#40d090]/10 border border-[#40d090]/30 text-[#40d090] text-[10px] font-bold tracking-widest uppercase hover:bg-[#40d090]/20 transition-all">
                <Zap size={10} /> Platform
              </a>
            </Link>
>>>>>>> origin/fix/navbar-dropdown-interaction
          )}

          <div className="h-4 w-px bg-white/10 mx-2" />
          <LanguageSwitcher />
          
          <button onClick={() => handleNav("#contact")} className="px-6 py-2.5 bg-[#C9A84C] text-[#0A0A0A] text-[10px] font-bold tracking-widest uppercase hover:bg-[#D4B866] transition-all">
=======
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
>>>>>>> origin/fix/final-navbar-restructure-1774631973
            {t("nav.bookConsultation")}
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="lg:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

<<<<<<< HEAD
      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-[#0A0A0A] z-40 transition-transform duration-500 lg:hidden ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-col items-center justify-center h-full gap-8 p-10">
          {aiProducts.map(p => (
<<<<<<< HEAD
            <a key={p.href} href={p.href} className="text-2xl font-bold text-white/80 hover:text-[#C9A84C] transition-colors">{p.label}</a>
          ))}
          <div className="w-12 h-px bg-white/10" />
          <a href="/ip-licensing" className="text-xl text-white/60">IP Licensing</a>
          <a href="/pricing" className="text-xl text-white/60">Consulting</a>
          <a href="/press" className="text-xl text-white/60">Press</a>
=======
            <Link key={p.href} href={p.href}>
              <a className="text-2xl font-bold text-white/80 hover:text-[#C9A84C] transition-colors">{p.label}</a>
            </Link>
          ))}
          <div className="w-12 h-px bg-white/10" />
          {subsidiaries.map(s => (
            <Link key={s.href} href={s.href}>
              <a className="text-xl text-white/60 hover:text-white">{s.label}</a>
            </Link>
          ))}
          <div className="w-12 h-px bg-white/10" />
          <Link href="/ip-licensing">
            <a className="text-xl text-white/60">IP Licensing</a>
          </Link>
          <Link href="/pricing">
            <a className="text-xl text-white/60">Consulting</a>
          </Link>
          <Link href="/press">
            <a className="text-xl text-white/60">Press</a>
          </Link>
>>>>>>> origin/fix/navbar-dropdown-interaction
          <button onClick={() => handleNav("#contact")} className="mt-4 px-10 py-4 border border-[#C9A84C] text-[#C9A84C] text-lg uppercase tracking-widest">
            {t("nav.bookConsultation")}
          </button>
=======
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

>>>>>>> origin/fix/final-navbar-restructure-1774631973
          <div className="mt-4 scale-125">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </nav>
  );
}
<<<<<<< HEAD
=======
// Last updated: Fri Mar 27 13:19:33 EDT 2026
>>>>>>> origin/fix/final-navbar-restructure-1774631973
