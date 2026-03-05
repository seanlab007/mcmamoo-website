/*
 * Methodology Section — 错位竞争理论
 * Design: 深色背景 + 网络图 + 对比表格 + 九维度展示
 */
import { useScrollReveal } from "@/hooks/useScrollReveal";

const METHODOLOGY_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/methodology-bg-iADjg24sG3B8CAK3kDs55r.webp";

const eras = [
  { era: "工厂时代", logic: "生产为王，供不应求", active: false },
  { era: "渠道时代", logic: "渠道为王，谁掌握渠道谁赢", active: false },
  { era: "定位时代", logic: "心智为王，抢占顾客认知", active: false },
  { era: "错位竞争时代", logic: "趋势为王，领先顾客感知", active: true },
];

const comparisons = [
  { dim: "关注焦点", pos: "关注竞争", dis: "关注用户" },
  { dim: "时间维度", pos: "关注现在", dis: "关注未来" },
  { dim: "组织维度", pos: "不关注组织", dis: "关注组织" },
  { dim: "感知维度", pos: "关注心智", dis: "都关注心智，更关注感知" },
];

const dimensions = ["趋势", "战略", "组织", "人才", "用户", "渠道", "供应链", "媒介", "终端"];

const thinkers = [
  { name: "毛泽东", theory: "桅杆理论" },
  { name: "查尔斯·达尔文", theory: "进化论" },
  { name: "阿尔伯特·爱因斯坦", theory: "第一性原理" },
  { name: "L.V.贝塔朗菲", theory: "系统论" },
  { name: "杰克·特劳特", theory: "定位理论" },
  { name: "约瑟夫·熊彼特", theory: "创新理论" },
  { name: "Sean DAI", theory: "错位竞争理论" },
];

export default function Methodology() {
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
      <div className="absolute inset-0 bg-[#0D1B2A]/90" />

      <div className="relative z-10 container">
        {/* Header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="section-label mb-4">02 — Core Methodology</div>
          <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold mb-4">
            错位竞争理论
          </h2>
          <p className="text-[#C9A84C] font-['Cormorant_Garamond'] text-xl italic">
            Dislocation Competition Theory
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Left: Era evolution */}
          <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal">
            <div className="text-white/40 text-xs tracking-widest uppercase mb-6 font-['DM_Mono']">
              竞争范式演进
            </div>
            <div className="space-y-0">
              {eras.map((era, i) => (
                <div
                  key={era.era}
                  className={`flex items-start gap-4 p-4 border-l-2 transition-all ${
                    era.active
                      ? "border-[#C9A84C] bg-[#C9A84C]/5"
                      : "border-white/10"
                  }`}
                >
                  <span className={`font-['DM_Mono'] text-sm mt-0.5 flex-shrink-0 ${era.active ? "text-[#C9A84C]" : "text-white/30"}`}>
                    0{i + 1}
                  </span>
                  <div>
                    <div className={`font-semibold mb-1 ${era.active ? "text-[#C9A84C]" : "text-white/60"}`}>
                      {era.era} {era.active && "★"}
                    </div>
                    <div className={`text-sm ${era.active ? "text-white/80" : "text-white/40"}`}>
                      {era.logic}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Core claim */}
            <div className="mt-8 p-6 border border-[#C9A84C]/30 bg-[#C9A84C]/5">
              <div className="text-white/40 text-xs tracking-widest uppercase mb-4 font-['DM_Mono']">核心主张</div>
              <p className="font-['Noto_Serif_SC'] text-[#C9A84C] text-base leading-relaxed">
                从10倍变量出发，领先用户，领先竞争对手。
                <br />一切行为围绕趋势，而不是围绕竞争。
                <br />构建一个系统，而不是符号等单一要素。
              </p>
            </div>
          </div>

          {/* Right: Comparison table */}
          <div ref={ref3 as React.RefObject<HTMLDivElement>} className="reveal" style={{ transitionDelay: "0.15s" }}>
            <div className="text-white/40 text-xs tracking-widest uppercase mb-6 font-['DM_Mono']">
              错位竞争 vs 定位咨询
            </div>
            <div className="border border-white/10">
              <div className="grid grid-cols-3 bg-[#0A0A0A]/60">
                <div className="p-3 text-white/40 text-xs font-['DM_Mono'] border-r border-white/10">维度</div>
                <div className="p-3 text-white/40 text-xs font-['DM_Mono'] border-r border-white/10">定位咨询</div>
                <div className="p-3 text-[#C9A84C] text-xs font-['DM_Mono']">错位竞争</div>
              </div>
              {comparisons.map((c) => (
                <div key={c.dim} className="grid grid-cols-3 border-t border-white/10">
                  <div className="p-3 text-white/50 text-sm border-r border-white/10">{c.dim}</div>
                  <div className="p-3 text-white/40 text-sm line-through border-r border-white/10">{c.pos}</div>
                  <div className="p-3 text-white text-sm font-medium">{c.dis}</div>
                </div>
              ))}
            </div>

            {/* 9 Dimensions */}
            <div className="mt-8">
              <div className="text-white/40 text-xs tracking-widest uppercase mb-4 font-['DM_Mono']">
                错位竞争战略九维度
              </div>
              <div className="grid grid-cols-3 gap-2">
                {dimensions.map((d, i) => (
                  <div
                    key={d}
                    className={`p-3 text-center text-sm border transition-all hover:border-[#C9A84C]/50 hover:text-[#C9A84C] ${
                      i === 0
                        ? "border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10"
                        : "border-white/10 text-white/60"
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Thinkers */}
        <div ref={ref4 as React.RefObject<HTMLDivElement>} className="reveal">
          <div className="text-white/40 text-xs tracking-widest uppercase mb-6 font-['DM_Mono']">
            思想基石 — 站在巨人的肩膀上
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {thinkers.map((t) => (
              <div
                key={t.name}
                className={`p-4 border text-center group transition-all hover:border-[#C9A84C]/50 ${
                  t.name === "Sean DAI"
                    ? "border-[#C9A84C] bg-[#C9A84C]/10"
                    : "border-white/10"
                }`}
              >
                <div className={`font-semibold text-sm mb-1 ${t.name === "Sean DAI" ? "text-[#C9A84C]" : "text-white group-hover:text-[#C9A84C]"} transition-colors`}>
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
