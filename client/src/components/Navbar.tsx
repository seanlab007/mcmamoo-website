import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Zap } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { MAOAI_ROUTES } from "@/features/maoai";

export default function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinksRow1 = [
    { name: "MaoAI", href: MAOAI_ROUTES.CHAT },
    { name: "猫眼内容平台", href: "/media-matrix-system.html" },
    { name: "Whale Pictures", href: "/whale-pictures" },
    { name: "猫眼工业", href: "/mao-industry" },
    { name: "IP Licensing", href: "/ip-licensing" },
  ];

  const navLinksRow2 = [
    { name: "猫眼内容平台", href: "/content" },
    { name: "小龙虾 AI", href: "/openclaw" },
    { name: "毛智库", href: "/mao-think-tank" },
  ];

  const rightLinks = [
    { name: "Consulting", href: "/pricing" },
    { name: "Press", href: "/press" },
  ];

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b",
        isScrolled
          ? "bg-[#0A0A0A]/95 backdrop-blur-md border-white/5 py-2"
          : "bg-transparent border-transparent py-4"
      )}
    >
      <div className="container mx-auto px-8">
        {/* Desktop Navigation - Double Row */}
        <div className="hidden lg:flex flex-col gap-5">
          {/* Row 1: Logo + Main Links */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-16">
              <Link href="/" className="flex items-center gap-4 group flex-shrink-0">
                <div className="relative w-10 h-10 overflow-hidden">
                  <img 
                    src="/logo-gold.png" 
                    alt="Mc&Mamoo Logo" 
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-['Noto_Serif_SC'] text-lg font-bold tracking-wider leading-tight">
                    Mc&Mamoo <span className="text-[#C9A84C] text-xs align-top ml-1">AI</span>
                  </span>
                  <span className="text-white/40 text-[0.6rem] font-['DM_Mono'] tracking-[0.3em] uppercase leading-none">
                    Growth Engine Products
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-12 flex-1">
                {navLinksRow1.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "text-[0.75rem] font-medium tracking-[0.12em] uppercase transition-all duration-300 hover:text-[#C9A84C] whitespace-nowrap",
                      location === link.href ? "text-[#C9A84C]" : "text-white/60"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-8 flex-shrink-0">
              <LanguageSwitcher />
              <Button
                asChild
                className="bg-[#C9A84C] text-[#0A0A0A] hover:bg-[#D4B866] rounded-none px-6 py-5 text-[0.7rem] font-bold tracking-[0.2em] uppercase transition-all duration-300 flex-shrink-0"
              >
                <Link href="/pricing">预约咨询</Link>
              </Button>
            </div>
          </div>

          {/* Row 2: Secondary Links + Right Actions */}
          <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <div className="flex items-center gap-14">
              {navLinksRow2.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-[0.7rem] font-medium tracking-[0.12em] uppercase transition-all duration-300 hover:text-[#C9A84C] whitespace-nowrap",
                    location === link.href ? "text-[#C9A84C]" : "text-white/40"
                  )}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-10">
              {rightLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-[0.7rem] font-medium tracking-[0.12em] uppercase transition-all duration-300 hover:text-[#C9A84C] whitespace-nowrap",
                    location === link.href ? "text-[#C9A84C]" : "text-white/40"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/platform"
                className="flex items-center gap-2 px-3 py-1 border border-[#C9A84C]/30 bg-[#C9A84C]/5 text-[#C9A84C] text-[0.65rem] font-bold tracking-[0.2em] uppercase hover:bg-[#C9A84C]/10 transition-all whitespace-nowrap flex-shrink-0"
              >
                <Zap size={10} className="animate-pulse" />
                Platform
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo-gold.png" alt="Logo" className="w-8 h-8 object-contain" />
            <span className="text-white font-['Noto_Serif_SC'] text-sm font-bold tracking-wider">Mc&Mamoo</span>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-white p-2"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[72px] bg-[#0A0A0A] z-40 flex flex-col p-8 gap-6 overflow-y-auto">
          {[...navLinksRow1, ...navLinksRow2, ...rightLinks].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-white/70 text-lg font-medium tracking-widest hover:text-[#C9A84C]"
            >
              {link.name}
            </Link>
          ))}
          <Button
            asChild
            className="bg-[#C9A84C] text-[#0A0A0A] w-full py-6 rounded-none mt-4"
          >
            <Link href="/pricing" onClick={() => setIsMobileMenuOpen(false)}>
              预约咨询
            </Link>
          </Button>
        </div>
      )}
    </nav>
  );
}
