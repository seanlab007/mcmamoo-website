/*
 * Awards Section — International Honors
 * i18n: full bilingual support
 */
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "react-i18next";

const awards = [
  { year: "2021", award: "伦敦广告节 小金人", awardEn: "London International Awards — Statue", en: "London International Awards", category: "品牌传播", categoryEn: "Brand Communication", icon: "🏆" },
  { year: "2016", award: "戛纳广告节 金奖", awardEn: "Cannes Lions — Gold", en: "Cannes Lions — Gold", category: "创意策略", categoryEn: "Creative Strategy", icon: "🦁" },
  { year: "2015", award: "戛纳广告节 金奖", awardEn: "Cannes Lions — Gold", en: "Cannes Lions — Gold", category: "整合营销", categoryEn: "Integrated Marketing", icon: "🦁" },
  { year: "2015", award: "巴黎电影节 最佳导演", awardEn: "Paris Film Festival — Best Director", en: "Paris Film Festival — Best Director", category: "影视创作", categoryEn: "Film & Video", icon: "🎬" },
  { year: "2014", award: "D&AD In Book", awardEn: "D&AD — In Book", en: "D&AD — In Book", category: "设计创意", categoryEn: "Design & Art Direction", icon: "✏️" },
  { year: "2014", award: "ONE SHOW 铜铅笔", awardEn: "One Show — Bronze Pencil", en: "One Show — Bronze Pencil", category: "广告创意", categoryEn: "Advertising Creative", icon: "✏️" },
  { year: "2014", award: "亚太广告节 铜奖", awardEn: "ADFEST — Bronze", en: "ADFEST — Bronze", category: "亚太区域", categoryEn: "Asia Pacific", icon: "🥉" },
  { year: "2013", award: "戛纳广告节 铜狮", awardEn: "Cannes Lions — Bronze", en: "Cannes Lions — Bronze", category: "品牌战略", categoryEn: "Brand Strategy", icon: "🦁" },
  { year: "2013", award: "中国4A金印奖 金奖", awardEn: "China 4A Gold Seal Award — Gold", en: "China 4A Gold Seal Award", category: "中国广告", categoryEn: "China Advertising", icon: "🥇" },
  { year: "2013", award: "龙玺广告节 金奖", awardEn: "Longxi Advertising Festival — Gold", en: "Longxi Advertising Festival — Gold", category: "华文创意", categoryEn: "Chinese Creative", icon: "🐉" },
];

const institutions = [
  { name: "World Economic Forum", cn: "世界经济论坛", type: "国际机构", typeEn: "International Institution" },
  { name: "IFC", cn: "国际金融公司", type: "世界银行集团", typeEn: "World Bank Group" },
  { name: "Cannes Lions", cn: "戛纳广告节", type: "国际奖项", typeEn: "International Award" },
  { name: "London International Awards", cn: "伦敦国际广告节", type: "国际奖项", typeEn: "International Award" },
  { name: "D&AD", cn: "英国设计与艺术指导", type: "国际奖项", typeEn: "International Award" },
  { name: "Dark Matter Capital", cn: "暗物质资本", type: "战略投资", typeEn: "Strategic Investment" },
  { name: "Deloitte", cn: "德勤咨询", type: "全球四大", typeEn: "Big Four" },
  { name: "McKinsey Alumni", cn: "麦肯锡校友网络", type: "顶级咨询", typeEn: "Top Consulting" },
  { name: "中欧商学院 CEIBS", cn: "CEIBS", type: "顶级商学院", typeEn: "Top Business School" },
  { name: "混沌大学", cn: "Chaos University", type: "创新教育", typeEn: "Innovation Education" },
  { name: "博商管理研究院", cn: "BSMI", type: "企业教育", typeEn: "Corporate Education" },
  { name: "China 4A", cn: "中国4A广告协会", type: "行业协会", typeEn: "Industry Association" },
];

const stats_zh = [
  { value: "10+", label: "国际顶级奖项" },
  { value: "3", label: "戛纳广告节金奖" },
  { value: "20+", label: "国际合作机构" },
  { value: "14", label: "年行业深耕" },
];
const stats_en = [
  { value: "10+", label: "International Top Awards" },
  { value: "3", label: "Cannes Lions Gold" },
  { value: "20+", label: "International Partners" },
  { value: "14", label: "Years of Industry Depth" },
];

export default function Awards() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();
  const stats = isEn ? stats_en : stats_zh;

  return (
    <section id="awards" className="bg-[#060606] py-24 lg:py-32">
      <div className="container">
        {/* Header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="section-label mb-4">06 — Awards & Recognition</div>
          <div className="flex items-end gap-6 mb-6">
            <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold leading-tight">
              {isEn ? "International Honors & Recognition" : "国际荣誉与认可"}
            </h2>
            <div className="hidden md:block h-px flex-1 bg-white/10 mb-3" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-white/10 mt-8">
            {stats.map((s, i) => (
              <div key={s.label} className={`py-6 px-8 text-center ${i < 3 ? "border-r border-white/10" : ""}`}>
                <div className="text-[#C9A84C] font-['Cormorant_Garamond'] text-4xl font-semibold mb-1">{s.value}</div>
                <div className="text-white/40 text-xs tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Awards list */}
        <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="text-white/40 text-xs tracking-widest uppercase mb-6 font-['DM_Mono']">
            {isEn ? "International Awards" : "国际奖项 · International Awards"}
          </div>
          <div className="grid md:grid-cols-2 gap-0 border border-white/10">
            {awards.map((a, i) => (
              <div key={a.award} className={`flex items-center gap-4 p-5 ${i % 2 === 0 ? "border-r border-white/10" : ""} border-b border-white/10 group hover:bg-[#C9A84C]/5 transition-all duration-200`}>
                <span className="text-2xl flex-shrink-0">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-0.5">
                    <span className="font-['DM_Mono'] text-[#C9A84C] text-xs w-10 flex-shrink-0">{a.year}</span>
                    <span className="text-white font-semibold text-sm group-hover:text-[#C9A84C] transition-colors truncate">{isEn ? a.awardEn : a.award}</span>
                  </div>
                  <div className="text-white/30 text-xs pl-13">{a.en}</div>
                </div>
                <span className="text-white/20 text-xs flex-shrink-0 hidden md:block">{isEn ? a.categoryEn : a.category}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Institutions */}
        <div ref={ref3 as React.RefObject<HTMLDivElement>} className="reveal">
          <div className="text-white/40 text-xs tracking-widest uppercase mb-6 font-['DM_Mono']">
            {isEn ? "Partners & Recognition" : "合作机构与认可 · Partners & Recognition"}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {institutions.map((inst) => (
              <div key={inst.name} className="p-4 border border-white/10 hover:border-[#C9A84C]/40 transition-all duration-300 group">
                <div className="text-white/70 font-semibold text-sm group-hover:text-[#C9A84C] transition-colors mb-1">{inst.name}</div>
                <div className="text-white/30 text-xs">{inst.cn}</div>
                <div className="text-white/20 text-xs mt-1 font-['DM_Mono']">{isEn ? inst.typeEn : inst.type}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
