/*
 * ============================================================
<<<<<<< HEAD
 * Services Section — 首页服务与定价局部展示
 * ============================================================
 * 逻辑：突出展示极具竞争力的入门价格（9.8/38/98/198）
 * 作为核心竞争力，引导用户快速尝试
 * ============================================================
 */
import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Brain, Zap, ArrowRight, Check, Sparkles, Flame } from "lucide-react";
=======
 * Services Section — 首页业务与定价展示
 * ============================================================
 * 逻辑：
 * 1. 业务介绍后紧跟价格展示
 * 2. 突出 9.8/38/98/198 极低尝试价格
 * 3. 区分 AI 组 (平替) 与 专家组 (高端)
 * 4. 提供详情跳转链接
 * ============================================================
 */
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Check, ArrowRight, Sparkles, Brain, Zap, Target, Globe, Shield, Flame } from "lucide-react";

const services = [
  {
    id: "design",
    title: "品牌视觉设计",
    titleEn: "Brand Design",
    desc: "爆品设计、官网设计、单项设计。从 AI 极速生成到专家深度定制。",
    aiPrice: "9.8",
    expertPrice: "3800",
    link: "/pricing#design-services",
    icon: <Zap className="text-[#E53E3E]" size={24} />
  },
  {
    id: "content",
    title: "内容自动化平台",
    titleEn: "Content Engine",
    desc: "整合 AutoClip 视频引擎。AI 组负责高频分发，专家组负责品牌大片。",
    aiPrice: "38",
    expertPrice: "1.98万",
    link: "/pricing",
    icon: <Sparkles className="text-[#40d090]" size={24} />
  },
  {
    id: "strategy",
    title: "战略增长引擎",
    titleEn: "Strategy Engine",
    desc: "数字增长、爆品打造、品牌全案。最高支持 5000 万级顶层咨询。",
    aiPrice: "98",
    expertPrice: "30万",
    link: "/pricing#strategy-services",
    icon: <Target className="text-[#C9A84C]" size={24} />
  },
  {
    id: "military",
    title: "毛智库 (军事业务)",
    titleEn: "Mao Think Tank",
    desc: "独立军事战略智库。兵棋推演、战略预测。To 军队独立收费。",
    aiPrice: "资质审核",
    expertPrice: "200万",
    link: "/mao-think-tank",
    icon: <Shield className="text-[#8B1A1A]" size={24} />
  }
];
>>>>>>> origin/fix/navbar-dropdown-interaction

export default function Services() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== "zh";
<<<<<<< HEAD
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
=======

  return (
    <section id="services" className="py-24 bg-[#0A0A0A] border-t border-white/5">
      <div className="container">
        <div className="mb-16">
          <div className="inline-block px-3 py-1 border border-[#C9A84C]/30 text-[#C9A84C] text-[10px] font-bold tracking-widest uppercase mb-4 flex items-center gap-2">
            <Flame size={12} /> {isEn ? "Our Services & Pricing" : "增长服务与定价"}
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 font-['Noto_Serif_SC']">
            {isEn ? "Growth Services" : "从 ¥9.8 开始增长"}
          </h2>
          <p className="text-white/40 max-w-2xl text-lg">
            我们以极具竞争力的价格门槛，为您提供从 AI 极速平替到专家顶层定制的全方位增长支持。
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((s) => (
            <div key={s.id} className="group p-8 border border-white/10 bg-white/[0.02] hover:border-[#C9A84C]/30 transition-all duration-500 flex flex-col">
              <div className="mb-6 p-3 bg-white/5 inline-block group-hover:scale-110 transition-transform">
                {s.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4 font-['Noto_Serif_SC']">
                {isEn ? s.titleEn : s.title}
              </h3>
              <p className="text-white/40 text-sm mb-8 leading-relaxed flex-1">
                {s.desc}
              </p>
              
              {/* 价格展示区 */}
              <div className="space-y-4 mb-8 pt-6 border-t border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">AI 组尝鲜</span>
                  <span className="text-[#40d090] font-mono font-bold">¥{s.aiPrice}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-white/30 uppercase tracking-widest">专家组起步</span>
                  <span className="text-[#C9A84C] font-mono font-bold">¥{s.expertPrice}</span>
                </div>
              </div>

              <Link href={s.link}>
                <a className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-white group-hover:text-[#C9A84C] transition-colors">
                  {isEn ? "View Details" : "查看详情"} <ArrowRight size={14} />
                </a>
              </Link>
>>>>>>> origin/fix/navbar-dropdown-interaction
            </div>
          ))}
        </div>

<<<<<<< HEAD
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
=======
        {/* 子公司跳转链接 */}
        <div className="mt-20 p-10 border border-[#C9A84C]/20 bg-[#C9A84C]/5 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-[#C9A84C] flex items-center justify-center text-[#0A0A0A]">
              <Globe size={24} />
            </div>
            <div>
              <h4 className="text-xl font-bold text-white mb-1 font-['Noto_Serif_SC']">鲸达影业 (Whale Pictures)</h4>
              <p className="text-white/40 text-sm">专业的影视摄制与全球模特经纪，点击访问独立站点。</p>
            </div>
          </div>
          <Link href="/whale-pictures">
            <a className="px-8 py-4 bg-white text-[#0A0A0A] text-[10px] font-bold tracking-widest uppercase hover:bg-[#C9A84C] transition-all">
              访问鲸达影业官网
            </a>
          </Link>
>>>>>>> origin/fix/navbar-dropdown-interaction
        </div>
      </div>
    </section>
  );
}
