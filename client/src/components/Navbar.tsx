import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, LayoutDashboard } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { MAOAI_ROUTES } from "@/features/maoai";

// 猫眼内容平台跳转地址（本地:3001，云端: mcmamoo.com/content）
const CONTENT_PLATFORM_URL = process.env.NODE_ENV === "production"
  ? "/content"
  : "http://localhost:3001/content";

// 导航链接配置 - 优先级分组
const primaryLinks = [
  { name: "MaoAI", href: MAOAI_ROUTES.CHAT },
  { name: "Whale Pictures", href: "/whale-pictures" },
  { name: "猫眼工业", href: "/mao-industry" },
  { name: "IP Licensing", href: "/ip-licensing" },
];

const secondaryLinks = [
  { name: "Consulting", href: "/pricing" },
  { name: "Press", href: "/press" },
  { name: "毛智库", href: "/mao-think-tank" },
];

export default function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 监听移动端菜单关闭（路由变化时）
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5 shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 lg:px-6">
        {/* Desktop Navigation - Single Row */}
        <div className="hidden lg:flex items-center justify-between h-14">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0 mr-4">
            <img 
              src="/logo-gold.png" 
              alt="Mc&Mamoo Logo" 
              className="w-8 h-8 object-contain transition-transform duration-500 group-hover:scale-110"
            />
            <div className="flex flex-col">
              <span className="text-white font-['Noto_Serif_SC'] text-sm font-bold tracking-wide leading-tight">
                Mc&Mamoo <span className="text-[#C9A84C] text-[0.6rem] align-top ml-0.5">AI</span>
              </span>
              <span className="text-white/25 text-[0.5rem] font-['DM_Mono'] tracking-[0.2em] uppercase leading-none">
                Growth Engine
              </span>
            </div>
          </Link>

          {/* Center-Left: Primary Navigation */}
          <div className="flex items-center gap-0.5">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-2.5 py-1.5 text-[0.65rem] font-medium tracking-[0.06em] uppercase transition-all duration-200 hover:text-[#C9A84C] whitespace-nowrap rounded hover:bg-white/5",
                  location === link.href ? "text-[#C9A84C]" : "text-white/50"
                )}
              >
                {link.name}
              </Link>
            ))}
            {/* 分隔线 */}
            <div className="w-px h-4 bg-white/10 mx-1" />
            {secondaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-2.5 py-1.5 text-[0.65rem] font-medium tracking-[0.06em] uppercase transition-all duration-200 hover:text-[#C9A84C] whitespace-nowrap rounded hover:bg-white/5",
                  location === link.href ? "text-[#C9A84C]" : "text-white/40"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right: Platform Link + Language + CTA */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 猫眼内容平台 - 带图标 */}
            <a
              href={CONTENT_PLATFORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#C9A84C]/25 bg-[#C9A84C]/8 text-[#C9A84C] text-[0.6rem] font-semibold tracking-[0.1em] uppercase hover:bg-[#C9A84C]/15 transition-all whitespace-nowrap rounded"
            >
              <LayoutDashboard size={11} />
              <span>内容平台</span>
            </a>
            
            {/* Language Switcher */}
            <div className="relative">
              <LanguageSwitcher />
            </div>
            
            {/* CTA Button */}
            <Button
              asChild
              className="bg-[#C9A84C] text-[#0A0A0A] hover:bg-[#D4B866] rounded-none px-4 py-4 text-[0.6rem] font-bold tracking-[0.12em] uppercase transition-all duration-300 flex-shrink-0 h-auto"
            >
              <Link href="/pricing">预约咨询</Link>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-gold.png" alt="Logo" className="w-7 h-7 object-contain" />
            <span className="text-white font-['Noto_Serif_SC'] text-sm font-bold tracking-wider">Mc&Mamoo</span>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-2 hover:bg-white/10 rounded-md transition-colors"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 bg-[#0A0A0A]/98 backdrop-blur-lg z-40 flex flex-col p-5 gap-1 overflow-y-auto">
          {/* 主导航链接 */}
          <div className="space-y-0.5">
            {[...primaryLinks, ...secondaryLinks].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium tracking-wide rounded-lg transition-colors",
                  location === link.href ? "text-[#C9A84C] bg-[#C9A84C]/10" : "text-white/70 hover:text-[#C9A84C] hover:bg-white/5"
                )}
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          {/* 分隔线和功能按钮 */}
          <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
            <a
              href={CONTENT_PLATFORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-3 border border-[#C9A84C]/30 bg-[#C9A84C]/5 text-[#C9A84C] text-sm font-bold tracking-wide rounded-lg"
            >
              <LayoutDashboard size={16} />
              猫眼内容平台
            </a>
            <Button
              asChild
              className="w-full bg-[#C9A84C] text-[#0A0A0A] py-5 rounded-lg text-sm font-bold tracking-wider"
            >
              <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)}>
                预约咨询
              </Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
// Last updated: Fri Mar 27 13:19:33 EDT 2026
