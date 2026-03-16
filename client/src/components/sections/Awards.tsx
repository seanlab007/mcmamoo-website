/*
 * Awards Section — 国际荣誉墙
 * Design: 深黑底 + 金色奖项展示 + 合作机构 LOGO 墙
 * Theme: 国际权威背书 · 行业顶级认可
 */
import { useScrollReveal } from "@/hooks/useScrollReveal";

const awards = [
  {
    year: "2021",
    award: "伦敦广告节 小金人",
    en: "London International Awards",
    category: "品牌传播",
    icon: "🏆",
  },
  {
    year: "2016",
    award: "戛纳广告节 金奖",
    en: "Cannes Lions — Gold",
    category: "创意策略",
    icon: "🦁",
  },
  {
    year: "2015",
    award: "戛纳广告节 金奖",
    en: "Cannes Lions — Gold",
    category: "整合营销",
    icon: "🦁",
  },
  {
    year: "2015",
    award: "巴黎电影节 最佳导演",
    en: "Paris Film Festival — Best Director",
    category: "影视创作",
    icon: "🎬",
  },
  {
    year: "2014",
    award: "D&AD In Book",
    en: "D&AD — In Book",
    category: "设计创意",
    icon: "✏️",
  },
  {
    year: "2014",
    award: "ONE SHOW 铜铅笔",
    en: "One Show — Bronze Pencil",
    category: "广告创意",
    icon: "✏️",
  },
  {
    year: "2014",
    award: "亚太广告节 铜奖",
    en: "ADFEST — Bronze",
    category: "亚太区域",
    icon: "🥉",
  },
  {
    year: "2013",
    award: "戛纳广告节 铜狮",
    en: "Cannes Lions — Bronze",
    category: "品牌战略",
    icon: "🦁",
  },
  {
    year: "2013",
    award: "中国4A金印奖 金奖",
    en: "China 4A Gold Seal Award",
    category: "中国广告",
    icon: "🥇",
  },
  {
    year: "2013",
    award: "龙玺广告节 金奖",
    en: "Longxi Advertising Festival — Gold",
    category: "华文创意",
    icon: "🐉",
  },
];

const institutions = [
  { name: "World Economic Forum", cn: "世界经济论坛", type: "国际机构" },
  { name: "IFC", cn: "国际金融公司", type: "世界银行集团" },
  { name: "Cannes Lions", cn: "戛纳广告节", type: "国际奖项" },
  { name: "London International Awards", cn: "伦敦国际广告节", type: "国际奖项" },
  { name: "D&AD", cn: "英国设计与艺术指导", type: "国际奖项" },
  { name: "Dark Matter Capital", cn: "暗物质资本", type: "战略投资" },
  { name: "Deloitte", cn: "德勤咨询", type: "全球四大" },
  { name: "McKinsey Alumni", cn: "麦肯锡校友网络", type: "顶级咨询" },
  { name: "中欧商学院", cn: "CEIBS", type: "顶级商学院" },
  { name: "混沌大学", cn: "Chaos University", type: "创新教育" },
  { name: "博商管理研究院", cn: "BSMI", type: "企业教育" },
  { name: "China 4A", cn: "中国4A广告协会", type: "行业协会" },
];

const stats = [
  { value: "10+", label: "国际顶级奖项" },
  { value: "3", label: "戛纳广告节金奖" },
  { value: "20+", label: "国际合作机构" },
  { value: "14", label: "年行业深耕" },
];

export default function Awards() {
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();

  return (
    <section id="awards" className="bg-[#060606] py-24 lg:py-32">
      <div className="container">
        {/* Header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="section-label mb-4">06 — Awards & Recognition</div>
          <div className="flex items-end gap-6 mb-6">
            <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold leading-tight">
              国际荣誉与认可
            </h2>
            <div className="hidden md:block h-px flex-1 bg-white/10 mb-3" />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-white/10 mt-8">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`py-6 px-8 text-center ${i < 3 ? "border-r border-white/10" : ""}`}
              >
                <div className="text-[#C9A84C] font-['Cormorant_Garamond'] text-4xl font-semibold mb-1">
                  {s.value}
                </div>
                <div className="text-white/40 text-xs tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Awards list */}
        <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="text-white/40 text-xs tracking-widest uppercase mb-6 font-['DM_Mono']">
            国际奖项 · International Awards
          </div>
          <div className="grid md:grid-cols-2 gap-0 border border-white/10">
            {awards.map((a, i) => (
              <div
                key={a.award}
                className={`flex items-center gap-4 p-5 ${i % 2 === 0 ? "border-r border-white/10" : ""} border-b border-white/10 group hover:bg-[#C9A84C]/5 transition-all duration-200`}
              >
                <span className="text-2xl flex-shrink-0">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-0.5">
                    <span className="font-['DM_Mono'] text-[#C9A84C] text-xs w-10 flex-shrink-0">{a.year}</span>
                    <span className="text-white font-semibold text-sm group-hover:text-[#C9A84C] transition-colors truncate">{a.award}</span>
                  </div>
                  <div className="text-white/30 text-xs pl-13">{a.en}</div>
                </div>
                <span className="text-white/20 text-xs flex-shrink-0 hidden md:block">{a.category}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Institutions */}
        <div ref={ref3 as React.RefObject<HTMLDivElement>} className="reveal">
          <div className="text-white/40 text-xs tracking-widest uppercase mb-6 font-['DM_Mono']">
            合作机构与认可 · Partners & Recognition
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {institutions.map((inst) => (
              <div
                key={inst.name}
                className="p-4 border border-white/10 hover:border-[#C9A84C]/40 transition-all duration-300 group"
              >
                <div className="text-white/70 font-semibold text-sm group-hover:text-[#C9A84C] transition-colors mb-1">
                  {inst.name}
                </div>
                <div className="text-white/30 text-xs">{inst.cn}</div>
                <div className="text-white/20 text-xs mt-1 font-['DM_Mono']">{inst.type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
