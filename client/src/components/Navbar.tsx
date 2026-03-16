/*
 * Navbar — 猫眼咨询官网导航
 * Design: 透明渐变 → 深色固定导航，金色 hover 线条
 */
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "关于我们", href: "#about" },
  { label: "KOL合作", href: "#kol" },
  { label: "服务体系", href: "#services" },
  { label: "全球案例", href: "#global-cases" },
  { label: "荣誉奖项", href: "#awards" },
  { label: "联系我们", href: "#contact" },
];

const specialItems = [
  { label: "毛智库", href: "/maothink", external: true },
  { label: "运营平台", href: "/platform", external: true },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                className="relative text-white/70 hover:text-[#C9A84C] text-sm tracking-wide transition-colors duration-300 hover-gold-line py-1"
              >
                {item.label}
              </button>
            ))}
            <a
              href="/maothink"
              className="relative text-[#8B1A1A] hover:text-[#C9A84C] text-sm tracking-wide transition-colors duration-300 py-1 flex items-center gap-1.5"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", letterSpacing: "0.1em" }}
            >
              <span style={{ width: 6, height: 6, background: "#8B1A1A", transform: "rotate(45deg)", display: "inline-block", flexShrink: 0 }} />
              毛智库
            </a>
            <a
              href="/platform"
              className="relative text-[#40d090]/80 hover:text-[#40d090] text-sm tracking-wide transition-colors duration-300 py-1 flex items-center gap-1.5"
              style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", letterSpacing: "0.1em" }}
            >
              <span style={{ width: 6, height: 6, background: "#40d090", borderRadius: "50%", display: "inline-block", flexShrink: 0, boxShadow: "0 0 6px #40d090" }} />
              运营平台
            </a>
            <button
              onClick={() => handleNav("#contact")}
              className="ml-4 px-5 py-2 border border-[#C9A84C]/60 text-[#C9A84C] text-sm tracking-wide hover:bg-[#C9A84C]/10 transition-all duration-300"
            >
              预约咨询
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
          <button
            onClick={() => handleNav("#contact")}
            className="mt-4 px-8 py-3 border border-[#C9A84C] text-[#C9A84C] text-lg hover:bg-[#C9A84C]/10 transition-all duration-300"
          >
            预约咨询
          </button>
        </div>
      </div>
    </>
  );
}
