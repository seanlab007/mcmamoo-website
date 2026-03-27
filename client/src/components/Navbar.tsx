/*
 * ============================================================
 * Navbar Component — 终极版本 (React 状态锁 + 物理重叠感应区)
 * ============================================================
 * 核心修复策略：
 * 1. React 状态管理：使用 useState 管理下拉菜单开启状态
 * 2. 悬停延迟锁：使用 setTimeout 实现 200ms 的关闭延迟
 * 3. 物理重叠感应区：在按钮和菜单之间建立透明的重叠区域
 * 4. 点击触发备份：支持点击打开/关闭菜单
 * 5. 全屏点击关闭：点击菜单外任何地方都会关闭菜单
 * ============================================================
 */
import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ChevronDown, Menu, X, Zap } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showContent, setShowContent] = useState(false);
  
  // 下拉菜单状态管理 - 核心修复
  const [openDropdown, setOpenDropdown] = useState<"ai" | "subsidiaries" | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const isEn = i18n.language !== "zh";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    
    // 检查内容平台访问权限
    fetch(`${BACKEND_URL}/api/content/subscription`, { credentials: "include" })
      .then(res => {
        if (res.ok) setShowContent(true);
      })
      .catch(() => setShowContent(false));

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 全屏点击关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown-container]")) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleNav = (href: string) => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
    if (href.startsWith("#")) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      setLocation(href);
    }
  };

  // 处理鼠标进入下拉菜单
  const handleMouseEnter = (dropdown: "ai" | "subsidiaries") => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setOpenDropdown(dropdown);
  };

  // 处理鼠标离开下拉菜单 - 使用延迟关闭
  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 200); // 200ms 延迟，确保鼠标有时间移动到菜单
  };

  const aiProducts = [
    { label: "MaoAI (大脑)", href: "/mao-ai", color: "#C9A84C", desc: "战略决策与市场洞察" },
    { label: "内容平台 (执行)", href: "/platform", color: "#40d090", desc: "含 AutoClip 视频自动化" },
    { label: "运营平台", href: "/operation", color: "#60A5FA", desc: "全域数据监控" },
    { label: "小龙虾 AI", href: "/crayfish", color: "#F87171", desc: "垂直行业解决方案" },
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
              alt="Mc&Mamoo Logo"
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
          {/* AI 产品 Dropdown - 终极版本 */}
          <div 
            data-dropdown-container
            className="relative"
            onMouseEnter={() => handleMouseEnter("ai")}
            onMouseLeave={handleMouseLeave}
          >
            <button 
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm tracking-widest font-['Noto_Serif_SC'] transition-colors py-2 cursor-pointer"
              onClick={() => setOpenDropdown(openDropdown === "ai" ? null : "ai")}
            >
              AI Products <ChevronDown size={12} className={`transition-transform duration-300 ${openDropdown === "ai" ? "rotate-180" : ""}`} />
            </button>

            {/* 下拉菜单 - 物理重叠感应区 */}
            {openDropdown === "ai" && (
              <>
                {/* 透明桥接区 - 确保鼠标从按钮移动到菜单时不会离开感应区 */}
                <div 
                  className="absolute top-full left-0 right-0 h-4 pointer-events-auto"
                  onMouseEnter={() => handleMouseEnter("ai")}
                  onMouseLeave={handleMouseLeave}
                />
                
                {/* 实际菜单 */}
                <div 
                  className="absolute top-full left-0 mt-0 w-72 bg-[#111] border border-white/10 shadow-2xl backdrop-blur-xl rounded-sm overflow-hidden pointer-events-auto"
                  onMouseEnter={() => handleMouseEnter("ai")}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="p-2">
                    {aiProducts.map((p) => (
                      <Link key={p.href} href={p.href}>
                        <a 
                          className="flex items-start gap-3 p-4 hover:bg-white/5 transition-colors group cursor-pointer"
                          onClick={() => setOpenDropdown(null)}
                        >
                          <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: p.color }} />
                          <div>
                            <div className="text-white text-sm font-bold group-hover:text-[#C9A84C] transition-colors">{p.label}</div>
                            <div className="text-white/30 text-[10px] mt-0.5">{p.desc}</div>
                          </div>
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 旗下子公司 Dropdown - 终极版本 */}
          <div 
            data-dropdown-container
            className="relative"
            onMouseEnter={() => handleMouseEnter("subsidiaries")}
            onMouseLeave={handleMouseLeave}
          >
            <button 
              className="flex items-center gap-1.5 text-white/70 hover:text-white text-sm tracking-widest font-['Noto_Serif_SC'] transition-colors py-2 cursor-pointer"
              onClick={() => setOpenDropdown(openDropdown === "subsidiaries" ? null : "subsidiaries")}
            >
              Subsidiaries <ChevronDown size={12} className={`transition-transform duration-300 ${openDropdown === "subsidiaries" ? "rotate-180" : ""}`} />
            </button>

            {/* 下拉菜单 - 物理重叠感应区 */}
            {openDropdown === "subsidiaries" && (
              <>
                {/* 透明桥接区 */}
                <div 
                  className="absolute top-full left-0 right-0 h-4 pointer-events-auto"
                  onMouseEnter={() => handleMouseEnter("subsidiaries")}
                  onMouseLeave={handleMouseLeave}
                />
                
                {/* 实际菜单 */}
                <div 
                  className="absolute top-full left-0 mt-0 w-56 bg-[#111] border border-white/10 shadow-2xl backdrop-blur-xl rounded-sm overflow-hidden pointer-events-auto"
                  onMouseEnter={() => handleMouseEnter("subsidiaries")}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="p-2">
                    {subsidiaries.map((s) => (
                      <Link key={s.href} href={s.href}>
                        <a 
                          className="block p-4 text-white/60 hover:text-white hover:bg-white/5 text-sm tracking-widest font-['Noto_Serif_SC'] transition-all cursor-pointer"
                          onClick={() => setOpenDropdown(null)}
                        >
                          {s.label}
                        </a>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
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
              <a className="text-2xl font-bold text-white/80 hover:text-[#C9A84C] transition-colors font-['Noto_Serif_SC']" onClick={() => setIsMobileMenuOpen(false)}>{p.label}</a>
            </Link>
          ))}
          <div className="w-12 h-px bg-white/10" />
          {subsidiaries.map(s => (
            <Link key={s.href} href={s.href}>
              <a className="text-xl text-white/60 hover:text-white font-['Noto_Serif_SC']" onClick={() => setIsMobileMenuOpen(false)}>{s.label}</a>
            </Link>
          ))}
          <div className="w-12 h-px bg-white/10" />
          <Link href="/ip-licensing">
            <a className="text-xl text-white/60 font-['Noto_Serif_SC']" onClick={() => setIsMobileMenuOpen(false)}>IP Licensing</a>
          </Link>
          <Link href="/pricing">
            <a className="text-xl text-white/60 font-['Noto_Serif_SC']" onClick={() => setIsMobileMenuOpen(false)}>Consulting</a>
          </Link>
          <Link href="/press">
            <a className="text-xl text-white/60 font-['Noto_Serif_SC']" onClick={() => setIsMobileMenuOpen(false)}>Press</a>
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
