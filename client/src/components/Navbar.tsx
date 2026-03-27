/*
 * ============================================================
 * Navbar — 猫眼增长引擎官网导航
 * ============================================================
 * Design : 透明渐变 → 深色固定导航，金色 hover 线条
 * 导航结构（桌面端）:
 *   主导航锚点 | AI 产品▾ | 旗下子公司▾ | IP 授权 | 咨询服务 | 新闻稿 | 语言切换 | 预约咨询
 *
 * ⚠️  PROTECTED FILE — 由 Manus 统一维护
 *     禁止 Work Buddy / OpenClaw 直接修改本文件。
 *     如需变更，请通过 Pull Request 并在描述中注明修改目的。
 * ============================================================
 */
import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";

// ─── 后端 URL（用于内容平台订阅检查） ────────────────────────────────────────
const BACKEND_URL =
  (import.meta as any).env?.VITE_BACKEND_URL || "https://api.mcmamoo.com";

/**
 * 检查当前用户是否有内容平台访问权限（plan !== "free"）
 * 仅在已登录且订阅了 content/strategic 套餐时展示内容平台入口
 */
function useNavContentAccess() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/content/subscription`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json && json.plan && json.plan !== "free") {
          setShow(true);
        }
      })
      .catch(() => {});
  }, []);
  return { show };
}

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language !== "zh";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileAiOpen, setMobileAiOpen] = useState(false);
  const [mobileIndustryOpen, setMobileIndustryOpen] = useState(false);
  const { show: showContent } = useNavContentAccess();

  // ── 主导航锚点 ──────────────────────────────────────────────────────────────
  const navItems = [
    { label: t("nav.about"), href: "#about" },
    { label: t("nav.awards"), href: "#awards" },
    { label: t("nav.kol"), href: "#kol" },
    { label: t("nav.services"), href: "#services" },
    { label: t("nav.cases"), href: "#cases" },
    { label: t("nav.contact"), href: "#contact" },
  ];

  // ── AI 产品下拉菜单 ─────────────────────────────────────────────────────────
  const aiProducts = [
    {
      href: "/mao-ai",
      label: "MaoAI",
      sublabel: isEn ? "AI Strategy Assistant" : "AI 战略助手",
      color: "#C9A84C",
      dot: "circle",
      glow: true,
    },
    {
      href: "/platform",
      label: isEn ? "Ops Platform" : "运营平台",
      sublabel: isEn ? "Content Automation" : "AI 内容自动化",
      color: "#40d090",
      dot: "circle",
      glow: true,
    },
    {
      href: "/openclaw",
      label: isEn ? "Claw AI" : "小龙虾 AI",
      sublabel: isEn ? "AI Marketing Engine" : "AI 营销引擎",
      color: "#e05a30",
      dot: "emoji",
      emoji: "🦞",
    },
    {
      href: "/autoclip",
      label: "AutoClip",
      sublabel: isEn ? "AI Video Editing" : "AI 视频剪辑",
      color: "#a855f7",
      dot: "circle",
      glow: true,
    },
    {
      href: "/maothink",
      label: isEn ? "Mao Think Tank" : "毛智库",
      sublabel: isEn ? "Strategic Intelligence" : "战略智库平台",
      color: "#8B1A1A",
      dot: "diamond",
    },
  ];

  // ── 旗下子公司下拉菜单 ──────────────────────────────────────────────────────
  const subsidiaries = [
    {
      href: "/whale-pictures",
      label: "Whale Pictures",
      sublabel: isEn ? "TVC · Models · AI Drama" : "TVC · 外模 · AI短剧",
      color: "#F59E0B",
      dot: "circle",
      glow: true,
    },
    {
      href: "#mao-industry",
      label: isEn ? "Mao Industry" : "猫眼工业",
      sublabel: isEn
        ? "Millennium Clock · Industrial Design"
        : "万年钟 · 工业设计",
      color: "#4FC3F7",
      dot: "diamond",
      glow: true,
    },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /**
   * 处理锚点导航：关闭移动菜单后平滑滚动至目标元素
   */
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
          {/* ── Logo ── */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex items-center gap-3 group"
          >
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/mao_eye_logo_1a9f9467.png"
              alt="猫眼咨询 Logo"
              className="h-10 w-auto object-contain"
              style={{ filter: "drop-shadow(0 0 6px rgba(201,168,76,0.5))" }}
            />
            <div>
              <div className="text-[#C9A84C] font-['Cormorant_Garamond'] font-semibold text-lg leading-none tracking-wide">
                Mc&amp;Mamoo
              </div>
              <div className="text-white/40 text-[9px] tracking-[0.2em] uppercase leading-none mt-0.5">
                {isEn ? "Growth Engine" : "增长引擎"}
              </div>
            </div>
          </a>

          {/* ── 桌面端导航 ── */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-5">
            {/* 主导航锚点 */}
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => handleNav(item.href)}
                className="relative text-white/70 hover:text-[#C9A84C] text-sm tracking-wide transition-colors duration-300 hover-gold-line py-1 whitespace-nowrap"
              >
                {item.label}
              </button>
            ))}

            {/* AI 产品 下拉菜单 */}
            <div className="relative group">
              <button
                className="relative text-[#C9A84C]/80 hover:text-[#C9A84C] text-sm tracking-wide transition-colors duration-300 py-1 flex items-center gap-1.5 whitespace-nowrap"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.72rem",
                  letterSpacing: "0.1em",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    background: "#C9A84C",
                    borderRadius: "50%",
                    display: "inline-block",
                    flexShrink: 0,
                    boxShadow: "0 0 6px #C9A84C",
                  }}
                />
                {isEn ? "AI Products" : "AI 产品"}
                <ChevronDown
                  size={10}
                  className="opacity-60 group-hover:opacity-100 transition-transform duration-200 group-hover:rotate-180"
                />
              </button>
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#0D0D0D]/98 border border-[#C9A84C]/20 backdrop-blur-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {aiProducts.map((p, i) => (
                  <a
                    key={p.href}
                    href={p.href}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors duration-200 ${
                      i < aiProducts.length - 1 ? "border-b border-white/5" : ""
                    }`}
                  >
                    <span className="mt-0.5 flex-shrink-0">
                      {p.dot === "emoji" ? (
                        <span style={{ fontSize: "0.85rem", lineHeight: 1 }}>
                          {(p as any).emoji}
                        </span>
                      ) : p.dot === "diamond" ? (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            background: p.color,
                            transform: "rotate(45deg)",
                            display: "inline-block",
                            marginTop: 2,
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            background: p.color,
                            borderRadius: "50%",
                            display: "inline-block",
                            marginTop: 2,
                            boxShadow: p.glow ? `0 0 6px ${p.color}` : undefined,
                          }}
                        />
                      )}
                    </span>
                    <div>
                      <div
                        className="text-xs font-mono tracking-wider"
                        style={{ color: p.color }}
                      >
                        {p.label}
                      </div>
                      <div className="text-[10px] text-white/35 mt-0.5 tracking-wide">
                        {p.sublabel}
                      </div>
                    </div>
                  </a>
                ))}
                {/* 内容平台（仅付费用户可见） */}
                {showContent && (
                  <a
                    href="/content"
                    className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors duration-200 border-t border-white/5"
                  >
                    <span className="mt-0.5 flex-shrink-0">
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          background: "#40d090",
                          borderRadius: "3px",
                          transform: "rotate(45deg)",
                          display: "inline-block",
                          marginTop: 2,
                          boxShadow: "0 0 6px #40d090",
                        }}
                      />
                    </span>
                    <div>
                      <div
                        className="text-xs font-mono tracking-wider"
                        style={{ color: "#40d090" }}
                      >
                        {isEn ? "Content Platform" : "内容平台"}
                      </div>
                      <div className="text-[10px] text-white/35 mt-0.5 tracking-wide">
                        {isEn ? "Premium · Subscribers Only" : "付费订阅专属"}
                      </div>
                    </div>
                  </a>
                )}
              </div>
            </div>

            {/* 旗下子公司 下拉菜单 */}
            <div className="relative group">
              <button
                className="relative text-[#F59E0B]/80 hover:text-[#F59E0B] text-sm tracking-wide transition-colors duration-300 py-1 flex items-center gap-1.5 whitespace-nowrap"
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.72rem",
                  letterSpacing: "0.1em",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    background: "#F59E0B",
                    borderRadius: "50%",
                    display: "inline-block",
                    flexShrink: 0,
                    boxShadow: "0 0 6px #F59E0B",
                  }}
                />
                {isEn ? "Subsidiaries" : "旗下子公司"}
                <ChevronDown
                  size={10}
                  className="opacity-60 group-hover:opacity-100 transition-transform duration-200 group-hover:rotate-180"
                />
              </button>
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#0D0D0D]/98 border border-[#F59E0B]/20 backdrop-blur-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {subsidiaries.map((p) => (
                  <a
                    key={p.href}
                    href={p.href}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors duration-200"
                  >
                    <span className="mt-0.5 flex-shrink-0">
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          background: p.color,
                          borderRadius: p.dot === "diamond" ? "0" : "50%",
                          transform:
                            p.dot === "diamond" ? "rotate(45deg)" : "none",
                          display: "inline-block",
                          marginTop: 2,
                          boxShadow: p.glow ? `0 0 6px ${p.color}` : undefined,
                        }}
                      />
                    </span>
                    <div>
                      <div
                        className="text-xs font-mono tracking-wider"
                        style={{ color: p.color }}
                      >
                        {p.label}
                      </div>
                      <div className="text-[10px] text-white/35 mt-0.5 tracking-wide">
                        {p.sublabel}
                      </div>
                    </div>
                  </a>
                ))}
                <div className="border-t border-white/5 px-4 py-2">
                  <a
                    href="https://whalepictures.vip"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-white/30 hover:text-[#F59E0B] font-mono tracking-wider transition-colors"
                  >
                    whalepictures.vip ↗
                  </a>
                </div>
              </div>
            </div>

            {/* IP 授权 — 独立板块入口 */}
            <a
              href="/ip-licensing"
              className="relative text-[#C9A84C]/80 hover:text-[#C9A84C] text-sm tracking-wide transition-all duration-300 py-1 flex items-center gap-1.5 whitespace-nowrap"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.72rem",
                letterSpacing: "0.1em",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  background: "#C9A84C",
                  transform: "rotate(45deg)",
                  display: "inline-block",
                  boxShadow: "0 0 5px #C9A84C",
                }}
              />
              {isEn ? "IP Licensing" : "IP 授权"}
            </a>

            {/* 咨询服务 — 独立主入口 */}
            <a
              href="/pricing"
              className="relative text-white/80 hover:text-[#C9A84C] text-sm tracking-wide transition-all duration-300 py-1 px-3 border border-[#C9A84C]/40 hover:border-[#C9A84C]/80 hover:bg-[#C9A84C]/8 flex items-center gap-1.5 whitespace-nowrap"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.72rem",
                letterSpacing: "0.1em",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  background: "#C9A84C",
                  display: "inline-block",
                }}
              />
              {isEn ? "Consulting" : "咨询服务"}
            </a>

            {/* 新闻稿 */}
            <a
              href="/press"
              className="relative text-white/50 hover:text-[#C9A84C] text-sm tracking-wide transition-colors duration-300 py-1 whitespace-nowrap"
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.72rem",
                letterSpacing: "0.1em",
              }}
            >
              {isEn ? "Press" : "新闻稿"}
            </a>

            <LanguageSwitcher />

            <button
              onClick={() => handleNav("#contact")}
              className="ml-1 px-5 py-2 border border-[#C9A84C]/60 text-[#C9A84C] text-sm tracking-wide hover:bg-[#C9A84C]/10 transition-all duration-300"
            >
              {t("nav.bookConsultation")}
            </button>
          </nav>

          {/* ── 移动端菜单按钮 ── */}
          <button
            className="lg:hidden text-white/70 hover:text-[#C9A84C] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* ── 移动端全屏菜单 ── */}
      <div
        className={`fixed inset-0 z-40 bg-[#0A0A0A]/98 backdrop-blur-lg transition-all duration-400 lg:hidden ${
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-6 overflow-y-auto py-8">
          {/* 主导航锚点 */}
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

          {/* 猫眼工业 Mobile */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setMobileIndustryOpen(!mobileIndustryOpen)}
              className="text-[#4FC3F7]/80 hover:text-[#4FC3F7] text-xl transition-colors duration-300 flex items-center gap-2"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  background: "#4FC3F7",
                  transform: "rotate(45deg)",
                  display: "inline-block",
                  boxShadow: "0 0 8px #4FC3F7",
                }}
              />
              {isEn ? "Mc Industry" : "猫眼工业"}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  mobileIndustryOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {mobileIndustryOpen && (
              <div className="flex flex-col items-center gap-2 mt-1">
                <a
                  href="#mao-industry"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav("#mao-industry");
                    setMenuOpen(false);
                  }}
                  className="text-[#4FC3F7]/60 hover:text-[#4FC3F7] text-sm font-mono tracking-wider"
                >
                  {isEn ? "Industry Overview" : "工业板块首页"}
                </a>
                <a
                  href="/millennium-clock"
                  className="text-white/50 hover:text-[#C9A84C] text-sm font-mono tracking-wider"
                >
                  {isEn ? "Millennium Clock" : "万年钟"}
                </a>
              </div>
            )}
          </div>

          {/* AI 产品 Mobile — 折叠展开 */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setMobileAiOpen(!mobileAiOpen)}
              className="text-[#C9A84C]/80 hover:text-[#C9A84C] text-xl transition-colors duration-300 flex items-center gap-2"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  background: "#C9A84C",
                  borderRadius: "50%",
                  display: "inline-block",
                  boxShadow: "0 0 8px #C9A84C",
                }}
              />
              {isEn ? "AI Products" : "AI 产品"}
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  mobileAiOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {mobileAiOpen && (
              <div className="flex flex-col items-center gap-3 mt-1 border border-[#C9A84C]/10 px-6 py-4">
                {aiProducts.map((p) => (
                  <a
                    key={p.href}
                    href={p.href}
                    className="flex items-center gap-2 text-base font-mono tracking-wider transition-colors duration-200"
                    style={{ color: p.color }}
                  >
                    {p.dot === "emoji" ? (
                      <span style={{ fontSize: "1rem" }}>
                        {(p as any).emoji}
                      </span>
                    ) : p.dot === "diamond" ? (
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          background: p.color,
                          transform: "rotate(45deg)",
                          display: "inline-block",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          background: p.color,
                          borderRadius: "50%",
                          display: "inline-block",
                          boxShadow: p.glow ? `0 0 6px ${p.color}` : undefined,
                        }}
                      />
                    )}
                    {p.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Whale Pictures Mobile */}
          <a
            href="/whale-pictures"
            className="text-[#F59E0B]/80 hover:text-[#F59E0B] text-xl transition-colors duration-300 flex items-center gap-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                background: "#F59E0B",
                borderRadius: "50%",
                display: "inline-block",
                boxShadow: "0 0 8px #F59E0B",
              }}
            />
            Whale Pictures
          </a>

          {/* IP 授权 Mobile */}
          <a
            href="/ip-licensing"
            className="text-[#C9A84C]/80 hover:text-[#C9A84C] text-xl transition-colors duration-300 flex items-center gap-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                background: "#C9A84C",
                transform: "rotate(45deg)",
                display: "inline-block",
                boxShadow: "0 0 8px #C9A84C",
              }}
            />
            {isEn ? "IP Licensing" : "IP 授权"}
          </a>

          {/* 咨询服务 Mobile */}
          <a
            href="/pricing"
            className="text-white/80 hover:text-[#C9A84C] text-xl transition-colors duration-300 flex items-center gap-2 px-5 py-2 border border-[#C9A84C]/40 hover:border-[#C9A84C]/80"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                background: "#C9A84C",
                display: "inline-block",
              }}
            />
            {isEn ? "Consulting" : "咨询服务"}
          </a>

          {/* 新闻稿 Mobile */}
          <a
            href="/press"
            className="text-white/50 hover:text-[#C9A84C] text-xl transition-colors duration-300 flex items-center gap-2"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                background: "#C9A84C",
                display: "inline-block",
              }}
            />
            {isEn ? "Press" : "新闻稿"}
          </a>

          {/* 内容平台（付费用户） Mobile */}
          {showContent && (
            <a
              href="/content"
              className="text-[#40d090]/80 hover:text-[#40d090] text-xl transition-colors duration-300 flex items-center gap-2"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  background: "#40d090",
                  borderRadius: "3px",
                  transform: "rotate(45deg)",
                  display: "inline-block",
                  boxShadow: "0 0 8px #40d090",
                }}
              />
              {isEn ? "Content Platform" : "内容平台"}
            </a>
          )}

          <button
            onClick={() => handleNav("#contact")}
            className="mt-4 px-8 py-3 border border-[#C9A84C] text-[#C9A84C] text-lg hover:bg-[#C9A84C]/10 transition-all duration-300"
          >
            {t("nav.bookConsultation")}
          </button>
          <div className="mt-2">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </>
  );
}
