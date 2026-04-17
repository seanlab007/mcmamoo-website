/*
 * ============================================================
 * Services Section — 首页服务与定价局部展示
 * ============================================================
 * 逻辑：突出展示极具竞争力的入门价格（9.8/38/98/198）
 * 作为核心竞争力，引导用户快速尝试
 * ============================================================
 */
import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Brain, Zap, ArrowRight, Check, Sparkles, Flame } from "lucide-react";

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
      category: "设计类",
      icon: <Brain className="text-[#C9A84C]" size={32} />,
      title: isEn ? "Brand Design" : "品牌视觉设计",
      desc: isEn 
        ? "From AI quick design to expert brand strategy." 
        : "从 AI 快速设计到专家全案规划。",
      aiPrice: "9.8",
      expertPrice: "980",
      unit: "元",
      aiFeatures: ["AI Logo 生成", "VI 规范", "品牌色彩"],
      expertFeatures: ["品牌诊断", "全案设计", "官网开发"],
      aiHref: "#contact",
      expertHref: "#contact"
    },
    {
      category: "内容类",
      icon: <Zap className="text-[#40d090]" size={32} />,
      title: isEn ? "Content Automation" : "内容自动化平台",
      desc: isEn 
        ? "From AI content to expert strategy execution." 
        : "从 AI 自动化内容到专家策划执行。",
      aiPrice: "38",
      expertPrice: "1980",
      unit: "元",
      aiFeatures: ["AI 图文内容", "AI 视频剪辑", "AutoClip"],
      expertFeatures: ["策划内容", "数据分析", "KOL 协同"],
      aiHref: "/platform",
      expertHref: "#contact"
    },
    {
      category: "战略类",
      icon: <Sparkles className="text-[#C9A84C]" size={32} />,
      title: isEn ? "Strategic Brain" : "战略大脑",
      desc: isEn 
        ? "From MaoAI insights to expert consulting." 
        : "从 MaoAI 洞察到专家深度咨询。",
      aiPrice: "98",
      expertPrice: "3800",
      unit: "元",
      aiFeatures: ["MaoAI 对话", "趋势分析", "竞品预警"],
      expertFeatures: ["战略诊断", "全案咨询", "陪跑支持"],
      aiHref: "/mao-ai",
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
          <div className="inline-block px-3 py-1 border border-[#C9A84C]/30 text-[#C9A84C] text-[10px] font-bold tracking-widest uppercase mb-6 flex items-center gap-2">
            <Flame size={12} /> {isEn ? "Ultra-Low Pricing" : "极具竞争力的定价"}
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 font-['Noto_Serif_SC']">
            {isEn ? "From ¥9.8 Start Your Growth" : "从 ¥9.8 开始增长"}
          </h2>
          <p className="text-white/50 text-lg leading-relaxed">
            {isEn 
              ? "Our core competitive advantage: ultra-low trial prices (¥9.8/38/98/198). Every service offers both AI and Expert options. Try now, pay later."
              : "我们的核心竞争力：极低的尝试价格（¥9.8/38/98/198）。每项业务都分为 AI 组与专家组。先尝试，再转化。"}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {services.map((service, idx) => (
            <div 
              key={idx}
              className="reveal p-8 border border-white/10 bg-white/[0.02] hover:border-[#C9A84C]/30 transition-all duration-500 group"
              style={{ transitionDelay: `${idx * 0.2}s` }}
            >
              <div className="mb-6">
                <div className="inline-block px-2 py-1 bg-white/5 border border-white/10 text-white/40 text-[10px] font-bold tracking-widest uppercase mb-4">
                  {service.category}
                </div>
                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500 mb-4">
                  {service.icon}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 font-['Noto_Serif_SC']">{service.title}</h3>
              <p className="text-white/40 text-sm mb-8 leading-relaxed h-12">
                {service.desc}
              </p>

              {/* AI 组 vs 专家组对比 */}
              <div className="grid grid-cols-2 gap-4">
                {/* AI 组 */}
                <div className="p-4 border border-[#40d090]/20 bg-[#40d090]/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-[#40d090]" />
                    <span className="text-[#40d090] text-[10px] font-bold tracking-widest uppercase">AI 组</span>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    ¥{service.aiPrice}
                  </div>
                  <div className="text-white/30 text-[9px] uppercase tracking-widest mb-4">起价</div>
                  <ul className="space-y-2 mb-4">
                    {service.aiFeatures.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-white/50 text-[11px]">
                        <Check size={12} className="text-[#40d090] flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href={service.aiHref} className="block w-full p-2.5 text-center border border-[#40d090]/40 text-[#40d090] text-[10px] font-bold tracking-widest uppercase hover:bg-[#40d090]/10 transition-all rounded">
                    {isEn ? "Try Now" : "立即尝试"}
                  </a>
                </div>

                {/* 专家组 */}
                <div className="p-4 border border-[#C9A84C]/20 bg-[#C9A84C]/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={14} className="text-[#C9A84C]" />
                    <span className="text-[#C9A84C] text-[10px] font-bold tracking-widest uppercase">专家组</span>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    ¥{service.expertPrice}
                  </div>
                  <div className="text-white/30 text-[9px] uppercase tracking-widest mb-4">起价</div>
                  <ul className="space-y-2 mb-4">
                    {service.expertFeatures.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-white/50 text-[11px]">
                        <Check size={12} className="text-[#C9A84C] flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a href={service.expertHref} className="block w-full p-2.5 text-center border border-[#C9A84C]/40 text-[#C9A84C] text-[10px] font-bold tracking-widest uppercase hover:bg-[#C9A84C]/10 transition-all rounded">
                    {isEn ? "Consult" : "咨询"}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Link to Full Pricing */}
        <div className="reveal flex flex-col md:flex-row items-center justify-between gap-8 p-8 border border-[#C9A84C]/20 bg-[#C9A84C]/5 rounded-lg">
          <div className="flex items-center gap-6">
            <div className="hidden md:flex w-12 h-12 rounded-full bg-[#C9A84C] items-center justify-center text-[#0A0A0A]">
              <Flame size={24} />
            </div>
            <div>
              <h4 className="text-white font-bold mb-1">{isEn ? "Explore All Pricing" : "查看完整定价体系"}</h4>
              <p className="text-white/40 text-sm">{isEn ? "9.8/38/98/198 梯度定价，设计/内容/战略全覆盖。" : "9.8/38/98/198 梯度定价，设计/内容/战略全覆盖。"}</p>
            </div>
          </div>
          <a 
            href="/pricing" 
            className="px-10 py-4 bg-[#C9A84C] text-[#0A0A0A] font-bold tracking-widest uppercase text-sm hover:bg-[#D4B866] transition-all flex items-center gap-3 whitespace-nowrap rounded"
          >
            {isEn ? "Full Pricing" : "完整定价"}
            <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
