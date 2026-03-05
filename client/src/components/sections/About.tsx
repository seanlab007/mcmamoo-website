/*
 * About Section — 关于猫眼咨询
 * Design: 白底左右分栏，左文右数据，金色竖线点缀
 */
import { useScrollReveal } from "@/hooks/useScrollReveal";

const FOUNDER_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/founder-portrait-bg-dp5bEng4Ly5J93ahLDAL3o.webp";

const credentials = [
  "美国暗物质资本（Dark Matter Capital）合伙人",
  "错位竞争理论创始人 — 全球营销两大流派之一",
  "博商管理研究院企业教练",
  "混沌大学客座讲师",
  "中欧商学院特邀品牌战略专家",
  "前德勤咨询高级分析师 | 北美注册会计师（ACCA）",
  "伦敦国际华文金奖 | 戛纳广告金奖获得者",
];

const differentiators = [
  { from: "提供研究报告", to: "打造爆品" },
  { from: "传统甲乙关系", to: "事业伙伴" },
  { from: "无法负责销量", to: "打爆天猫" },
  { from: "短期项目指导", to: "长期战略护航" },
];

export default function About() {
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();

  return (
    <section id="about" className="bg-[#0A0A0A] py-24 lg:py-32">
      <div className="container">
        {/* Section header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="section-label mb-4">01 — About</div>
          <div className="flex items-end gap-6">
            <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold leading-tight">
              关于猫眼咨询
            </h2>
            <div className="hidden md:block h-px flex-1 bg-white/10 mb-3" />
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">
          {/* Left: Company intro */}
          <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal">
            <p className="text-white/70 text-base leading-relaxed mb-6">
              <strong className="text-white font-semibold">Mc&amp;Mamoo Brand Management Inc.</strong>（猫眼咨询）是一家发源于美国芝加哥、根植中国上海的国际领先战略咨询公司，由<span className="text-[#C9A84C]">暗物质资本（Dark Matter Capital）</span>投资创立。
            </p>
            <p className="text-white/70 text-base leading-relaxed mb-6">
              公司团队汇聚来自麦肯锡（McKinsey）、波士顿咨询（BCG）、贝恩咨询（Bain）及德勤咨询（Deloitte）等全球顶尖咨询机构的精英人才，在中国新消费领域<span className="text-[#C9A84C] font-semibold">连续三年排名第一</span>。
            </p>
            <p className="text-white/70 text-base leading-relaxed mb-10">
              我们的核心竞争力在于独创的<span className="text-[#C9A84C] font-semibold">错位竞争理论</span>——这一理论与特劳特定位理论并称全球营销学两大流派，被《巴黎商业周刊》评论为21世纪中国营销学最重要的贡献之一。
            </p>

            {/* Differentiators */}
            <div className="space-y-0">
              <div className="text-white/40 text-xs tracking-widest uppercase mb-4 font-['DM_Mono']">
                猫眼咨询 vs 传统咨询
              </div>
              {differentiators.map((d) => (
                <div
                  key={d.from}
                  className="flex items-center gap-4 py-3 border-b border-white/5 group"
                >
                  <span className="text-white/30 text-sm line-through w-28 flex-shrink-0">{d.from}</span>
                  <span className="text-[#C9A84C]/60 text-sm">→</span>
                  <span className="text-white font-semibold text-sm group-hover:text-[#C9A84C] transition-colors">{d.to}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Founder card */}
          <div ref={ref3 as React.RefObject<HTMLDivElement>} className="reveal" style={{ transitionDelay: "0.2s" }}>
            <div
              className="relative overflow-hidden"
              style={{
                backgroundImage: `url(${FOUNDER_BG})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0A]/40 to-[#0A0A0A]/95" />
              <div className="relative p-8 pt-32">
                {/* Gold top border */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#C9A84C]" />

                <div className="section-label mb-3">创始人 / Founder</div>
                <h3 className="font-['Cormorant_Garamond'] text-white text-3xl font-semibold mb-1">
                  Sean DAI
                </h3>
                <div className="text-[#C9A84C] text-sm mb-6 tracking-wide">代言 · 首席战略专家</div>

                <div className="space-y-2">
                  {credentials.map((c) => (
                    <div key={c} className="flex items-start gap-2.5">
                      <span className="text-[#C9A84C] mt-1 text-xs flex-shrink-0">◆</span>
                      <span className="text-white/70 text-sm leading-relaxed">{c}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <div className="text-white/40 text-xs tracking-widest uppercase mb-2 font-['DM_Mono']">14年 · 核心战绩</div>
                  <p className="text-white/70 text-sm leading-relaxed">
                    主导孵化 <span className="text-[#C9A84C] font-semibold">8个10亿级大单品</span>，疫情期间帮助MasterCard三年逆势增长 <span className="text-[#C9A84C] font-semibold">70亿美金</span>。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
