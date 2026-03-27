/*
 * Methodology Section -- Brand Prestige & Profit Multiplication
 * Design: dark background + four pillars + results showcase
 * Simplified from "Dislocation Competition Theory" to plain language
 */
import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const METHODOLOGY_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/methodology-bg-iADjg24sG3B8CAK3kDs55r.webp";

const PILLARS = [
  {
    num: "01",
    title: "品牌显贵",
    subtitle: "Brand Prestige",
    desc: "让品牌从卖货升级为被仰望。通过精准的品牌人格塑造、视觉语言升级和高端场景渗透，让消费者主动为品牌溢价买单。",
    highlight: "溢价率平均提升 3-8倍",
  },
  {
    num: "02",
    title: "利润倍增",
    subtitle: "Profit Multiplication",
    desc: "不靠烧钱买流量，靠品牌力驱动自然增长。优化产品结构、渠道利润分配和复购体系，让每一分营销投入产生最大回报。",
    highlight: "客户平均利润率提升 200%+",
  },
  {
    num: "03",
    title: "全域增长",
    subtitle: "Omni-Channel Growth",
    desc: "打通线上线下、公域私域、国内国外的全链路增长体系。从流量到留量，从单次购买到终身价值，构建可持续的增长飞轮。",
    highlight: "全域 GMV 平均增长 5-10倍",
  },
  {
    num: "04",
    title: "趋势领先",
    subtitle: "Trend Leadership",
    desc: "在竞争对手还在追赶昨天的热点时，我们已经帮品牌布局明天的赛道。基于10倍变量预判，让品牌永远比市场快半步。",
    highlight: "提前 6-18 个月锁定增长红利",
  },
];

const RESULTS = [
  { brand: "小仙炖鲜炖燕窝", result: "5年从0到20亿", metric: "天猫燕窝品类第一" },
  { brand: "法国奢利 LA CELLE", result: "单日售出2万瓶", metric: "高端香水品类黑马" },
  { brand: "江中猴姑米稀", result: "3年销售额翻10倍", metric: "养胃品类绝对第一" },
  { brand: "美国长盛天 NAD+", result: "单篇带货50万+", metric: "抗衰赛道品牌溢价王" },
];

const THINKERS = [
  { name: "毛泽东", theory: "桅杆理论" },
  { name: "查尔斯·达尔文", theory: "进化论" },
  { name: "阿尔伯特·爱因斯坦", theory: "第一性原理" },
  { name: "L.V.贝塔朗菲", theory: "系统论" },
  { name: "杰克·特劳特", theory: "定位理论" },
  { name: "约瑟夫·熊彼特", theory: "创新理论" },
  { name: "Sean DAI", theory: "猫眼增长引擎方法论" },
];

export default function Methodology() {
  const [activePillar, setActivePillar] = useState(0);
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();
  const ref4 = useScrollReveal();

  return (
    <section id="methodology" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${METHODOLOGY_BG})` }}
      />
      <div className="absolute inset-0 bg-[#0D1B2A]/92" />

      <div className="relative z-10 container">
        {/* Header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="section-label mb-4">02 — Core Methodology</div>
          <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold mb-4">
            猫眼增长引擎方法论
          </h2>
          <p className="text-[#C9A84C] font-['Cormorant_Garamond'] text-xl italic mb-4">
            让品牌显贵，让利润倍增，让增长全域
          </p>
          <p className="text-white/50 max-w-2xl text-base leading-relaxed">
            我们不做定位，不讲概念。我们只关注一件事：
            <span className="text-white font-medium">让您的品牌卖得更贵、赚得更多、长得更快。</span>
          </p>
        </div>

        {/* Four Pillars */}
        <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="text-white/40 text-xs tracking-widest uppercase mb-6 font-['DM_Mono']">
            四大核心价值主张
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-white/10">
            {PILLARS.map((p, i) => (
              <button
                key={p.num}
                onClick={() => setActivePillar(i)}
                className={[
                  "text-left p-8 transition-all duration-300 group",
                  i % 2 === 0 ? "border-r border-white/10" : "",
                  i < 2 ? "border-b border-white/10" : "",
                  activePillar === i ? "bg-[#C9A84C]/8" : "hover:bg-white/2",
                ].join(" ")}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="font-['DM_Mono'] text-2xl font-bold flex-shrink-0 transition-colors"
                    style={{ color: activePillar === i ? "#C9A84C" : "rgba(255,255,255,0.15)" }}
                  >
                    {p.num}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h3
                        className="font-['Noto_Serif_SC'] text-xl font-bold transition-colors"
                        style={{ color: activePillar === i ? "#C9A84C" : "white" }}
                      >
                        {p.title}
                      </h3>
                      <span className="text-white/30 text-xs font-['DM_Mono']">{p.subtitle}</span>
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed mb-4">{p.desc}</p>
                    <div
                      className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 border"
                      style={{
                        borderColor: activePillar === i ? "#C9A84C" : "rgba(255,255,255,0.1)",
                        color: activePillar === i ? "#C9A84C" : "rgba(255,255,255,0.3)",
                      }}
                    >
                      <span>&#9654;</span>
                      <span>{p.highlight}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Results showcase */}
        <div ref={ref3 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="text-white/40 text-xs tracking-widest uppercase mb-6 font-['DM_Mono']">
            方法论落地成果 — 真实案例
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/8">
            {RESULTS.map((r) => (
              <div key={r.brand} className="bg-[#0D1B2A] p-6 group hover:bg-[#C9A84C]/5 transition-all duration-300">
                <div className="text-[#C9A84C] font-['Cormorant_Garamond'] text-2xl font-semibold mb-2">{r.result}</div>
                <div className="text-white font-medium text-sm mb-1 font-['Noto_Serif_SC']">{r.brand}</div>
                <div className="text-white/35 text-xs">{r.metric}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Thinkers */}
        <div ref={ref4 as React.RefObject<HTMLDivElement>} className="reveal">
          <div className="text-white/40 text-xs tracking-widest uppercase mb-6 font-['DM_Mono']">
            思想基石 — 站在巨人的肩膀上
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {THINKERS.map((t) => (
              <div
                key={t.name}
                className={[
                  "p-4 border text-center group transition-all hover:border-[#C9A84C]/50",
                  t.name === "Sean DAI" ? "border-[#C9A84C] bg-[#C9A84C]/10" : "border-white/10",
                ].join(" ")}
              >
                <div className={[
                  "font-semibold text-sm mb-1 transition-colors",
                  t.name === "Sean DAI" ? "text-[#C9A84C]" : "text-white group-hover:text-[#C9A84C]",
                ].join(" ")}>
                  {t.name}
                </div>
                <div className="text-white/40 text-xs">{t.theory}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
