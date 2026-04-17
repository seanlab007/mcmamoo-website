/*
<<<<<<< HEAD
<<<<<<< HEAD
 * Hero Section — 猫眼咨询官网英雄区
 * Design: 全屏深色背景 + 猫眼金线图 + 大字标题 + 不对称布局
=======
 * Hero Section — 猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)官网英雄区
 * Design: 全屏深色背景 + 猫眼增长引擎 (Mc&Mamoo Growth Engine)金线图 + 大字标题 + 不对称布局
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
 * Hero Section — 猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)官网英雄区
 * Design: 全屏深色背景 + 猫眼增长引擎 (Mc&Mamoo Growth Engine)金线图 + 大字标题 + 不对称布局
>>>>>>> origin/deploy/trigger-build-1774631965
 * Theme: 品牌显贵 · 利润提升 · 全域增长
 */
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/hero-bg-d7eizqgBbqatPTyug6Apqv.webp";
const HERO_VIDEO = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/hero-video-final_5b857fd9.mp4";

export default function Hero() {
  const [visible, setVisible] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayText, setOverlayText] = useState(0);
  const videoRef = (el: HTMLVideoElement | null) => {
    if (!el) return;
    el.addEventListener("timeupdate", () => {
      const t = el.currentTime;
      const show = t >= 14 && t <= 26;
      setShowOverlay(show);
      if (show) {
        if (t < 17) setOverlayText(0);
        else if (t < 20) setOverlayText(1);
        else if (t < 23) setOverlayText(2);
        else setOverlayText(3);
      }
    });
  };

  const OVERLAY_LINES = [
    { en: "STRATEGIC INTELLIGENCE", zh: "运用毛泽东思想" },
    { en: "GLOBAL BATTLEFIELD ANALYSIS", zh: "洞察全球战略格局" },
    { en: "PREDICT · DOMINATE · WIN", zh: "预测·制胜·胜利" },
    { en: "MAO THINK TANK", zh: "毛智库 · 对标兰德和中心" },
  ];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const scrollDown = () => {
    const el = document.querySelector("#about");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        poster={HERO_BG}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "brightness(0.55) saturate(1.1)" }}
      >
        <source src={HERO_VIDEO} type="video/mp4" />
        {/* Fallback image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
      </video>

      {/* Video brand text overlay — appears at 14-26s */}
      <div
        className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
        style={{
          opacity: showOverlay ? 1 : 0,
          transition: "opacity 0.8s ease",
          background: showOverlay ? "rgba(10,10,10,0.45)" : "transparent",
        }}
      >
        <div className="text-center">
          <div
            key={overlayText}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "clamp(0.6rem, 1.5vw, 0.85rem)",
              color: "rgba(139,26,26,0.9)",
              letterSpacing: "0.4em",
              marginBottom: 16,
              animation: "fadeInUp 0.5s ease forwards",
            }}
          >
            {OVERLAY_LINES[overlayText]?.en}
          </div>
          <div
            key={`zh-${overlayText}`}
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2rem, 5vw, 4rem)",
              fontWeight: 900,
              color: "#E8D5B7",
              letterSpacing: "0.05em",
              textShadow: "0 0 40px rgba(139,26,26,0.5)",
              animation: "fadeInUp 0.5s ease 0.1s forwards",
              opacity: 0,
            }}
          >
            {OVERLAY_LINES[overlayText]?.zh}
          </div>
        </div>
      </div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/95 via-[#0A0A0A]/70 to-[#0D1B2A]/20" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/30 via-transparent to-[#0A0A0A]/80" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="container">
          <div className="max-w-3xl">
            {/* Label */}
            <div
              className={`section-label mb-6 transition-all duration-700 delay-200 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              ◆ &nbsp; Global Premium Brand Management · 全球顶奢品牌管理
            </div>

            {/* Main title */}
            <h1
              className={`font-['Cormorant_Garamond'] text-white leading-[1.05] mb-4 transition-all duration-700 delay-300 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <span className="block text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight">
                Mc&amp;Mamoo
              </span>
              <span className="block text-3xl md:text-4xl lg:text-5xl font-light text-[#C9A84C] mt-1 tracking-wide">
                Brand Management Inc.
              </span>
            </h1>

            {/* Chinese title */}
            <div
              className={`transition-all duration-700 delay-400 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px w-12 bg-[#C9A84C]" />
                <span className="font-['Noto_Serif_SC'] text-white/80 text-lg md:text-xl tracking-widest">
<<<<<<< HEAD
<<<<<<< HEAD
                  猫眼咨询
=======
                  猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
                  猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)
>>>>>>> origin/deploy/trigger-build-1774631965
                </span>
              </div>
            </div>

            {/* Tagline */}
            <p
              className={`font-['Noto_Serif_SC'] text-[#C9A84C] text-xl md:text-2xl font-semibold mb-3 transition-all duration-700 delay-500 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              让品牌显贵，让利润倍增，让增长全域
            </p>
            <p
              className={`text-white/50 text-sm md:text-base tracking-wide mb-10 transition-all duration-700 delay-600 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              Make Brands Premium · Multiply Profits · Grow Across All Channels
            </p>

            {/* CTAs */}
            <div
              className={`flex flex-wrap gap-4 transition-all duration-700 delay-700 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <button
                onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
                className="px-8 py-3.5 bg-[#C9A84C] text-[#0A0A0A] text-sm font-semibold tracking-widest uppercase hover:bg-[#E8D5A0] transition-all duration-300"
              >
                预约品牌诊断
              </button>
              <button
                onClick={() => document.querySelector("#cases")?.scrollIntoView({ behavior: "smooth" })}
                className="px-8 py-3.5 border border-white/30 text-white/80 text-sm tracking-widest uppercase hover:border-[#C9A84C]/60 hover:text-[#C9A84C] transition-all duration-300"
              >
                查看全球案例
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div
        className={`relative z-10 border-t border-white/10 bg-[#0A0A0A]/60 backdrop-blur-sm transition-all duration-700 delay-1000 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {[
              { value: "8", unit: "+", label: "10亿级大单品孵化" },
              { value: "500", unit: "+", label: "头部KOL战略合作" },
              { value: "20", unit: "+", label: "全球品牌服务" },
              { value: "70", unit: "亿", label: "MasterCard逆势增长(美元)" },
            ].map((stat) => (
              <div key={stat.label} className="py-5 px-6 text-center">
                <div className="flex items-baseline justify-center gap-0.5">
                  <span className="stat-number text-3xl md:text-4xl">{stat.value}</span>
                  <span className="text-[#C9A84C] text-lg font-semibold">{stat.unit}</span>
                </div>
                <div className="text-white/40 text-xs mt-1 tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={scrollDown}
        className="absolute bottom-28 md:bottom-24 right-8 z-10 text-white/30 hover:text-[#C9A84C] transition-colors duration-300 animate-bounce hidden md:block"
      >
        <ChevronDown size={24} />
      </button>
    </section>
  );
}
