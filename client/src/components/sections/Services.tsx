/*
 * ============================================================
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

export default function Services() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== "zh";

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
            </div>
          ))}
        </div>

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
        </div>
      </div>
    </section>
  );
}
