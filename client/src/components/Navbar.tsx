/*
 * ============================================================
 * Navbar Component — 导航栏重构 (最终版)
 * ============================================================
 * 核心修复：
 * 1. 字体升级：DM Mono → Noto Serif SC (与主标题一致)
 * 2. 下拉菜单：CSS group-hover + pointer-events 完全重构
 * 3. 品牌更名：中文"猫眼增长引擎 (Mc&Mamoo Growth Engine)"，英文"Mc&Mamoo Growth Engine"
 * 4. 交互稳定性：彻底消除物理间隙，使用 CSS 悬停状态
 * ============================================================
 */
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ChevronDown, Menu, X, Zap } from "lucide-react";
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
    
    // 检查内容平台访问权限 (付费用户逻辑)
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

  const aiProducts = [
    { label: "MaoAI (大脑)", href: "/mao-ai", color: "#C9A84C", dot: "circle", glow: true, desc: "战略决策与市场洞察" },
    { label: "内容平台 (执行)", href: "/platform", color: "#40d090", dot: "diamond", desc: "含 AutoClip 视频自动化" },
    { label: "运营平台", href: "/operation", color: "#60A5FA", dot: "circle", desc: "全域数据监控" },
    { label: "小龙虾 AI", href: "/crayfish", color: "#F87171", dot: "emoji", emoji: "🦞", desc: "垂直行业解决方案" },
  ];

  const subsidiaries = [
    { label: "Whale Pictures", href: "/whale-pictures", color: "#F59E0B" },
    { label: "猫眼工业", href: "/mao-industry", color: "#C9A84C" },
    { label: "毛智库", href: "/mao-think-tank", color: "#E53E3E" },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      isScrolled ? "bg-[#0A0A0A]/90 backdrop-blur-md border-b border-white/5 py-4" : "bg-transparent py-8"
    }`}>
      <div className="container flex items-center justify-between">
        {/* Logo & Brand Name */}
        <Link href="/">
          <a className="flex items-center gap-3 group">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/mao_eye_logo_1a9f9467.png"
              alt="猫眼增长引擎 (Mc&Mamoo Growth Engine) Logo"
              className="h-10 w-auto object-contain"
              style={{ filter: "drop-shadow(0 0 6px rgba(201,168,76,0.5))" }}
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-[0.2em] text-white font-['Noto_Serif_SC'] leading-none">Mc&Mamoo</span>
              <span className="text-[10px] font-bold tracking-[0.3em] text-[#C9A84C] font-['Noto_Serif_SC'] mt-1 uppercase">Growth Engine</span>
            </div>
          </a>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {/* AI 产品 Dropdown - CSS Group Hover */}
          <div className="group relative">
            <button className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm tracking-widest font-['Noto_Serif_SC'] transition-colors py-2 pointer-events-auto">
              AI Products <ChevronDown size={12} className="transition-transform duration-300 group-hover:rotate-180" />
            </button>
            {/* 下拉菜单 - 使用 group-hover 触发，完全消除间隙 */}
            <div className="absolute top-full left-0 pt-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
              <div className="w-64 bg-[#111] border border-white/10 p-4 shadow-2xl rounded-sm backdrop-blur-xl mt-2">
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
                ))}
              </div>
            </div>
          </div>

          {/* 旗下子公司 Dropdown - CSS Group Hover */}
          <div className="group relative">
            <button className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm tracking-widest font-['Noto_Serif_SC'] transition-colors py-2 pointer-events-auto">
              Subsidiaries <ChevronDown size={12} className="transition-transform duration-300 group-hover:rotate-180" />
            </button>
            {/* 下拉菜单 */}
            <div className="absolute top-full left-0 pt-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
              <div className="w-48 bg-[#111] border border-white/10 p-2 shadow-2xl rounded-sm backdrop-blur-xl mt-2">
                {subsidiaries.map((s) => (
                  <Link key={s.href} href={s.href}>
                    <a className="block p-3 text-white/60 hover:text-white hover:bg-white/5 text-sm tracking-widest font-['Noto_Serif_SC'] transition-all">
                      {s.label}
                    </a>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link href="/ip-licensing">
            <a className="text-white/70 hover:text-white text-sm tracking-widest font-['Noto_Serif_SC'] transition-colors">IP Licensing</a>
          </Link>
          <Link href="/pricing">
            <a className="text-white/70 hover:text-white text-sm tracking-widest font-['Noto_Serif_SC'] transition-colors">Consulting</a>
          </Link>
          <Link href="/press">
            <a className="text-white/70 hover:text-white text-sm tracking-widest font-['Noto_Serif_SC'] transition-colors">Press</a>
          </Link>
          
          {showContent && (
            <Link href="/content">
              <a className="flex items-center gap-2 px-4 py-1.5 bg-[#40d090]/10 border border-[#40d090]/30 text-[#40d090] text-[10px] font-bold tracking-widest uppercase hover:bg-[#40d090]/20 transition-all font-['Noto_Serif_SC']">
                <Zap size={10} /> Platform
              </a>
            </Link>
          )}

          <div className="h-4 w-px bg-white/10 mx-2" />
          <LanguageSwitcher />
          
          <button onClick={() => handleNav("#contact")} className="px-6 py-2.5 bg-[#C9A84C] text-[#0A0A0A] text-[10px] font-bold tracking-widest uppercase hover:bg-[#D4B866] transition-all font-['Noto_Serif_SC']">
            {t("nav.bookConsultation")}
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button className="lg:hidden text-white p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-[#0A0A0A] z-40 transition-transform duration-500 lg:hidden ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-col items-center justify-center h-full gap-8 p-10">
          {aiProducts.map(p => (
            <Link key={p.href} href={p.href}>
              <a className="text-2xl font-bold text-white/80 hover:text-[#C9A84C] transition-colors font-['Noto_Serif_SC']">{p.label}</a>
            </Link>
          ))}
          <div className="w-12 h-px bg-white/10" />
          {subsidiaries.map(s => (
            <Link key={s.href} href={s.href}>
              <a className="text-xl text-white/60 hover:text-white font-['Noto_Serif_SC']">{s.label}</a>
            </Link>
          ))}
          <div className="w-12 h-px bg-white/10" />
          <Link href="/ip-licensing">
            <a className="text-xl text-white/60 font-['Noto_Serif_SC']">IP Licensing</a>
          </Link>
          <Link href="/pricing">
            <a className="text-xl text-white/60 font-['Noto_Serif_SC']">Consulting</a>
          </Link>
          <Link href="/press">
            <a className="text-xl text-white/60 font-['Noto_Serif_SC']">Press</a>
          </Link>
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
