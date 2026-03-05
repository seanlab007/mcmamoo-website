/*
 * Hero Section — 猫眼咨询官网英雄区
 * Design: 全屏深色背景 + 猫眼金线图 + 大字标题 + 不对称布局
 */
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/hero-bg-d7eizqgBbqatPTyug6Apqv.webp";

export default function Hero() {
  const [visible, setVisible] = useState(false);

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
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${HERO_BG})` }}
      />
      {/* Gradient overlay — left side darker for text readability */}
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
              ◆ &nbsp; Global New Consumer Brand Management
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
                  猫眼咨询
                </span>
              </div>
            </div>

            {/* Tagline */}
            <p
              className={`font-['Noto_Serif_SC'] text-[#C9A84C] text-xl md:text-2xl font-semibold mb-3 transition-all duration-700 delay-500 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              洞察商业本质，陪伴战略落地
            </p>
            <p
              className={`text-white/50 text-sm md:text-base tracking-wide mb-10 transition-all duration-700 delay-600 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              Insight into the essence of business, accompany the implementation of strategy
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
                预约战略咨询
              </button>
              <button
                onClick={() => document.querySelector("#cases")?.scrollIntoView({ behavior: "smooth" })}
                className="px-8 py-3.5 border border-white/30 text-white/80 text-sm tracking-widest uppercase hover:border-[#C9A84C]/60 hover:text-[#C9A84C] transition-all duration-300"
              >
                查看标杆案例
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
              { value: "8", unit: "个", label: "10亿级大单品" },
              { value: "20", unit: "+", label: "快消品企业服务" },
              { value: "3", unit: "年", label: "新消费领域中国第一" },
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
