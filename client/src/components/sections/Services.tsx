/*
 * ============================================================
 * Services Section — 首页服务与定价局部展示
 * ============================================================
 * 逻辑：展示核心“大脑+执行”逻辑，提供精简定价，引导至完整 Pricing 页面
 * ============================================================
 */
import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Brain, Zap, ArrowRight, Check } from "lucide-react";

export default function Services() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== "zh";
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
          }
        });
      },
      { threshold: 0.1 }
    );

    const reveals = sectionRef.current?.querySelectorAll(".reveal");
    reveals?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const coreServices = [
    {
      icon: <Brain className="text-[#C9A84C]" size={32} />,
      title: isEn ? "MaoAI Strategic Brain" : "MaoAI 战略大脑",
      desc: isEn 
        ? "AI-driven market insights and strategic decision pre-audit." 
        : "基于错位竞争理论的 AI 战略模型，负责市场洞察与决策预审。",
      price: "1.98",
      unit: isEn ? "k/mo" : "万/月",
      features: isEn 
        ? ["AI Strategy Assistant", "Competitor Monitoring", "Weekly AI Reports"]
        : ["AI 战略助手", "竞品动态预警", "AI 自动周报"],
      color: "#C9A84C",
      href: "/mao-ai"
    },
    {
      icon: <Zap className="text-[#40d090]" size={32} />,
      title: isEn ? "Content Automation" : "内容自动化平台",
      desc: isEn 
        ? "Unified execution engine for content and AutoClip video." 
        : "统一调度 AI 内容生产与 AutoClip 视频剪辑，高效全域分发。",
      price: "2.98",
      unit: isEn ? "k/mo" : "万/月",
      features: isEn 
        ? ["AI Content Engine", "AutoClip Video", "Multi-Platform Sync"]
        : ["AI 内容生产", "AutoClip 视频剪辑", "全平台自动同步"],
      color: "#40d090",
      href: "/platform"
    }
  ];

  return (
    <section id="services" ref={sectionRef} className="py-24 bg-[#0A0A0A] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-[0.02] pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />
      </div>

      <div className="container relative z-10">
        <div className="max-w-4xl mb-16 reveal">
          <div className="inline-block px-3 py-1 border border-[#C9A84C]/30 text-[#C9A84C] text-[10px] font-bold tracking-widest uppercase mb-6">
            Service Ecosystem
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 font-['Noto_Serif_SC']">
            {isEn ? "The Brain & The Execution" : "大脑决策，平台执行"}
          </h2>
          <p className="text-white/50 text-lg leading-relaxed">
            {isEn 
              ? "We combine elite human consulting with cutting-edge AI to multiply your brand's profit."
              : "我们将顶级专家咨询与前沿 AI 技术深度融合，为您构建从战略大脑到内容执行的完整增长闭环。"}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {coreServices.map((service, idx) => (
            <div 
              key={idx}
              className="reveal p-8 border border-white/10 bg-white/[0.02] hover:border-[#C9A84C]/30 transition-all duration-500 group"
              style={{ transitionDelay: `${idx * 0.2}s` }}
            >
              <div className="mb-8 flex justify-between items-start">
                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                  {service.icon}
                </div>
                <div className="text-right">
                  <div className="text-[#C9A84C] text-3xl font-bold font-mono">{service.price}<span className="text-sm ml-1 opacity-60">{service.unit}</span></div>
                  <div className="text-white/30 text-[10px] uppercase tracking-widest mt-1">Starting From</div>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-['Noto_Serif_SC']">{service.title}</h3>
              <p className="text-white/40 text-sm mb-8 leading-relaxed h-12">
                {service.desc}
              </p>
              <ul className="space-y-3 mb-10">
                {service.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/60 text-sm">
                    <Check size={14} className="text-[#C9A84C]/60" />
                    {f}
                  </li>
                ))}
              </ul>
              <a 
                href={service.href}
                className="flex items-center justify-between w-full p-4 border border-white/10 text-white/80 text-sm font-bold tracking-widest uppercase hover:bg-[#C9A84C] hover:text-[#0A0A0A] transition-all duration-300"
              >
                {isEn ? "Explore Module" : "探索模块"}
                <ArrowRight size={16} />
              </a>
            </div>
          ))}
        </div>

        {/* Bottom Link to Full Pricing */}
        <div className="reveal flex flex-col md:flex-row items-center justify-between gap-8 p-8 border border-[#C9A84C]/20 bg-[#C9A84C]/5">
          <div className="flex items-center gap-6">
            <div className="hidden md:flex w-12 h-12 rounded-full bg-[#C9A84C] items-center justify-center text-[#0A0A0A]">
              <Check size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold mb-1">{isEn ? "Need a Full-Case Strategy?" : "需要品牌全案战略咨询？"}</h4>
              <p className="text-white/40 text-sm">{isEn ? "Explore our expert-led consulting packages." : "探索由猫眼专家团队主导的顶级咨询方案。"}</p>
            </div>
          </div>
          <a 
            href="/pricing" 
            className="px-10 py-4 bg-[#C9A84C] text-[#0A0A0A] font-bold tracking-widest uppercase text-sm hover:bg-[#D4B866] transition-all flex items-center gap-3"
          >
            {isEn ? "View Full Pricing" : "查看完整定价体系"}
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
