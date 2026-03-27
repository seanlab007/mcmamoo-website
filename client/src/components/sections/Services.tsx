/*
 * ============================================================
 * Services Section — 首页服务与定价局部展示
 * ============================================================
 * 逻辑：展示核心"大脑+执行"逻辑，突出 AI 入门价格极具竞争力
 * 引导至完整定价页查看 AI 组与专家组的完整对比
 * ============================================================
 */
import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Brain, Zap, ArrowRight, Check, Sparkles } from "lucide-react";

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

  const services = [
    {
      icon: <Brain className="text-[#C9A84C]" size={32} />,
      title: isEn ? "MaoAI Strategic Brain" : "MaoAI 战略大脑",
      desc: isEn 
        ? "AI-driven market insights and strategic decision pre-audit." 
        : "基于错位竞争理论的 AI 战略模型，负责市场洞察与决策预审。",
      aiPrice: "0.98",
      expertPrice: "28",
      unit: isEn ? "k/mo" : "万",
      features: isEn 
        ? ["AI Strategy Assistant", "Competitor Monitoring", "Weekly AI Reports"]
        : ["AI 战略助手", "竞品动态预警", "AI 自动周报"],
      aiHref: "/mao-ai",
      expertHref: "#contact"
    },
    {
      icon: <Zap className="text-[#40d090]" size={32} />,
      title: isEn ? "Content Automation" : "内容自动化平台",
      desc: isEn 
        ? "Unified execution engine for content and AutoClip video." 
        : "统一调度 AI 内容生产与 AutoClip 视频剪辑，高效全域分发。",
      aiPrice: "1.98",
      expertPrice: "8.98",
      unit: isEn ? "k/mo" : "万",
      features: isEn 
        ? ["AI Content Engine", "AutoClip Video", "Multi-Platform Sync"]
        : ["AI 内容生产", "AutoClip 视频剪辑", "全平台自动同步"],
      aiHref: "/platform",
      expertHref: "#contact"
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
              ? "Choose between AI efficiency (starting from just ¥9.8K/mo) or expert excellence. Every service offers both paths."
              : "每项业务都分为 AI 组与专家组。AI 组价格极具竞争力（仅从 0.98 万/月起），作为专家组的高效平替；专家组由代言先生及核心团队亲自操刀。"}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {services.map((service, idx) => (
            <div 
              key={idx}
              className="reveal p-8 border border-white/10 bg-white/[0.02] hover:border-[#C9A84C]/30 transition-all duration-500 group"
              style={{ transitionDelay: `${idx * 0.2}s` }}
            >
              <div className="mb-8 flex justify-between items-start">
                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-500">
                  {service.icon}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 font-['Noto_Serif_SC']">{service.title}</h3>
              <p className="text-white/40 text-sm mb-8 leading-relaxed">
                {service.desc}
              </p>

              {/* AI 组 vs 专家组对比 */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                {/* AI 组 */}
                <div className="p-4 border border-[#40d090]/20 bg-[#40d090]/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-[#40d090]" />
                    <span className="text-[#40d090] text-xs font-bold tracking-widest uppercase">AI 组</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {service.aiPrice}<span className="text-sm text-white/50 ml-1">{service.unit}</span>
                  </div>
                  <div className="text-white/30 text-[10px] mb-3">起价</div>
                  <ul className="space-y-2">
                    {service.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-white/50 text-[11px]">
                        <Check size={12} className="text-[#40d090]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href={service.aiHref} className="mt-4 block w-full p-2 text-center border border-[#40d090]/40 text-[#40d090] text-xs font-bold tracking-widest uppercase hover:bg-[#40d090]/10 transition-all">
                    {isEn ? "Try AI" : "体验 AI"}
                  </a>
                </div>

                {/* 专家组 */}
                <div className="p-4 border border-[#C9A84C]/20 bg-[#C9A84C]/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={16} className="text-[#C9A84C]" />
                    <span className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase">专家组</span>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {service.expertPrice}<span className="text-sm text-white/50 ml-1">{service.unit}</span>
                  </div>
                  <div className="text-white/30 text-[10px] mb-3">起价</div>
                  <ul className="space-y-2">
                    {service.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-white/50 text-[11px]">
                        <Check size={12} className="text-[#C9A84C]" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href={service.expertHref} className="mt-4 block w-full p-2 text-center border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-bold tracking-widest uppercase hover:bg-[#C9A84C]/10 transition-all">
                    {isEn ? "Expert Consult" : "专家咨询"}
                  </a>
                </div>
              </div>
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
              <h4 className="text-white font-bold mb-1">{isEn ? "View All Pricing Options" : "查看所有定价方案"}</h4>
              <p className="text-white/40 text-sm">{isEn ? "AI group + Expert group for every service line." : "每项业务都有 AI 组与专家组，选择适合您的方案。"}</p>
            </div>
          </div>
          <a 
            href="/pricing" 
            className="px-10 py-4 bg-[#C9A84C] text-[#0A0A0A] font-bold tracking-widest uppercase text-sm hover:bg-[#D4B866] transition-all flex items-center gap-3 whitespace-nowrap"
          >
            {isEn ? "Full Pricing" : "完整定价体系"}
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
