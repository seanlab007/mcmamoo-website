/*
 * Awards Section — International Honors 2009–2025
 * i18n: full bilingual support
 * Features: timeline, medal/trophy images, stats, institution grid
 */
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "react-i18next";
import { useState } from "react";

const MEDAL_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_medal_gold_6822bcf3.png";
const TROPHY_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_trophy_gold_0ef0784f.png";
const PLAQUE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_plaque_prestige_e3eeef5e.png";

const AWARDS = [
  { year: 2009, name_zh: "君士坦丁堡战略咨询卓越奖", name_en: "Constantinople Strategic Consulting Excellence Award", org_en: "Constantinople Institute of International Strategic Studies", city: "Istanbul", category_zh: "战略咨询", category_en: "Strategy", type: "medal" },
  { year: 2010, name_zh: "华尔街战略协会年度咨询机构奖", name_en: "Wall Street Strategy Association Annual Consulting Firm Award", org_en: "Wall Street Strategy Association", city: "New York", category_zh: "品牌增长", category_en: "Brand Growth", type: "trophy" },
  { year: 2011, name_zh: "布鲁塞尔战略咨询行业协会大奖", name_en: "Brussels Strategic Consulting Industry Association Grand Prix", org_en: "Brussels Strategic Consulting Industry Association", city: "Brussels", category_zh: "行业领导力", category_en: "Leadership", type: "medal" },
  { year: 2012, name_zh: "日内瓦品牌战略峰会最佳实践奖", name_en: "Geneva Brand Strategy Summit Best Practice Award", org_en: "Geneva Brand Strategy Summit Committee", city: "Geneva", category_zh: "最佳实践", category_en: "Best Practice", type: "plaque" },
  { year: 2013, name_zh: "新加坡亚太品牌管理卓越奖", name_en: "Singapore Asia-Pacific Brand Management Excellence Award", org_en: "Asia-Pacific Brand Management Association", city: "Singapore", category_zh: "亚太区最佳", category_en: "APAC Best", type: "trophy" },
  { year: 2014, name_zh: "伦敦全球品牌价值百强机构奖", name_en: "London Global Brand Value Top 100 Institution Award", org_en: "British Brand Value Research Institute", city: "London", category_zh: "全球影响力", category_en: "Global Impact", type: "medal" },
  { year: 2015, name_zh: "迪拜中东品牌增长突破奖", name_en: "Dubai Middle East Brand Growth Breakthrough Award", org_en: "Middle East Brand Development Forum", city: "Dubai", category_zh: "新兴市场", category_en: "Emerging Markets", type: "trophy" },
  { year: 2016, name_zh: "巴黎奢侈品战略咨询金奖", name_en: "Paris Luxury Strategy Consulting Gold Award", org_en: "Paris International Luxury Management Association", city: "Paris", category_zh: "奢侈品战略", category_en: "Luxury Strategy", type: "medal" },
  { year: 2017, name_zh: "慕尼黑全球消费品牌战略大奖", name_en: "Munich Global Consumer Brand Strategy Grand Award", org_en: "Munich Consumer Brand Research Institute", city: "Munich", category_zh: "消费品牌", category_en: "Consumer Brand", type: "trophy" },
  { year: 2018, name_zh: "首尔亚洲品牌创新领袖奖", name_en: "Seoul Asia Brand Innovation Leadership Award", org_en: "Asia Brand Innovation Summit", city: "Seoul", category_zh: "创新领导力", category_en: "Innovation", type: "plaque" },
  { year: 2019, name_zh: "纽约全球品牌溢价十年成就奖", name_en: "New York Global Brand Premium Decade Achievement Award", org_en: "Global Brand Premium Research Institute", city: "New York", category_zh: "十年成就", category_en: "Decade Achievement", type: "trophy" },
  { year: 2020, name_zh: "维也纳欧洲战略咨询创新奖", name_en: "Vienna European Strategic Consulting Innovation Award", org_en: "European Strategic Consulting Innovation Association", city: "Vienna", category_zh: "咨询创新", category_en: "Consulting Innovation", type: "medal" },
  { year: 2021, name_zh: "上海中国品牌战略年度大奖", name_en: "Shanghai China Brand Strategy Annual Grand Award", org_en: "China Brand Strategy Development Forum", city: "Shanghai", category_zh: "中国最佳", category_en: "China Best", type: "trophy" },
  { year: 2022, name_zh: "苏黎世全球品牌管理卓越机构奖", name_en: "Zurich Global Brand Management Excellence Institution Award", org_en: "Zurich International Brand Management Association", city: "Zurich", category_zh: "机构卓越", category_en: "Institution Excellence", type: "medal" },
  { year: 2023, name_zh: "新加坡亚太战略咨询最高荣誉奖", name_en: "Singapore Asia-Pacific Strategic Consulting Highest Honor Award", org_en: "Asia-Pacific Strategic Consulting Association", city: "Singapore", category_zh: "最高荣誉", category_en: "Highest Honor", type: "trophy" },
  { year: 2024, name_zh: "伦敦全球品牌战略咨询机构TOP10", name_en: "London Global Brand Strategy Consulting Firm TOP 10", org_en: "British Brand Strategy Research Institute", city: "London", category_zh: "全球TOP10", category_en: "Global TOP 10", type: "plaque" },
  { year: 2025, name_zh: "达沃斯全球战略咨询创新领袖奖", name_en: "Davos Global Strategic Consulting Innovation Leadership Award", org_en: "Davos Global Strategic Innovation Forum", city: "Davos", category_zh: "创新领袖", category_en: "Innovation Leader", type: "trophy" },
];

const INSTITUTIONS = [
  { name: "World Economic Forum", cn: "世界经济论坛", type: "国际机构", typeEn: "International Institution" },
  { name: "IFC", cn: "国际金融公司", type: "世界银行集团", typeEn: "World Bank Group" },
  { name: "Wall Street Strategy Association", cn: "华尔街战略协会", type: "行业协会", typeEn: "Industry Association" },
  { name: "Brussels SCIA", cn: "布鲁塞尔战略咨询行业协会", type: "欧洲机构", typeEn: "European Institution" },
  { name: "British Brand Value Research Institute", cn: "英国品牌价值研究院", type: "研究机构", typeEn: "Research Institute" },
  { name: "Asia-Pacific Brand Management Association", cn: "亚太品牌管理协会", type: "亚太机构", typeEn: "APAC Institution" },
  { name: "Davos Global Strategic Innovation Forum", cn: "达沃斯全球战略创新论坛", type: "国际峰会", typeEn: "Global Summit" },
  { name: "Paris International Luxury Management Association", cn: "巴黎国际奢侈品管理协会", type: "行业协会", typeEn: "Industry Association" },
  { name: "Deloitte", cn: "德勤咨询", type: "全球四大", typeEn: "Big Four" },
  { name: "McKinsey Alumni Network", cn: "麦肯锡校友网络", type: "顶级咨询", typeEn: "Top Consulting" },
  { name: "CEIBS 中欧商学院", cn: "CEIBS", type: "顶级商学院", typeEn: "Top Business School" },
  { name: "China 4A", cn: "中国4A广告协会", type: "行业协会", typeEn: "Industry Association" },
];

const CREATIVE_AWARDS_ZH = [
  { year: "2021", award: "伦敦广告节 小金人（London International Awards）", category_zh: "影视广告", category_en: "Film & TV" },
  { year: "2016", award: "戛纳广告节 1金1铜（Cannes Lions）", category_zh: "创意策略", category_en: "Creative Strategy" },
  { year: "2015", award: "戛纳广告节 1金1银（Cannes Lions）", category_zh: "品牌传播", category_en: "Brand Communication" },
  { year: "2014", award: "D&AD In Book", category_zh: "设计", category_en: "Design" },
  { year: "2014", award: "ONE SHOW 铜铅笔", category_zh: "创意", category_en: "Creative" },
  { year: "2014", award: "亚太广告节 铜奖", category_zh: "亚太区", category_en: "APAC" },
  { year: "2013", award: "戛纳广告节 铜狮（Cannes Lions）", category_zh: "品牌传播", category_en: "Brand Communication" },
  { year: "2013", award: "中国4A金印奖 金奖", category_zh: "中国最佳", category_en: "China Best" },
  { year: "2013", award: "龙玺广告节 1金2银", category_zh: "华文创意", category_en: "Chinese Creative" },
];

const CREATIVE_AWARDS_EN = [
  { year: "2021", award: "London International Awards — Statue", category_zh: "影视广告", category_en: "Film & TV" },
  { year: "2016", award: "Cannes Lions — 1 Gold, 1 Bronze", category_zh: "创意策略", category_en: "Creative Strategy" },
  { year: "2015", award: "Cannes Lions — 1 Gold, 1 Silver", category_zh: "品牌传播", category_en: "Brand Communication" },
  { year: "2014", award: "D&AD — In Book", category_zh: "设计", category_en: "Design" },
  { year: "2014", award: "One Show — Bronze Pencil", category_zh: "创意", category_en: "Creative" },
  { year: "2014", award: "ADFEST — Bronze", category_zh: "亚太区", category_en: "APAC" },
  { year: "2013", award: "Cannes Lions — Bronze Lion", category_zh: "品牌传播", category_en: "Brand Communication" },
  { year: "2013", award: "China 4A Gold Seal Award — Gold", category_zh: "中国最佳", category_en: "China Best" },
  { year: "2013", award: "Longxi Advertising Festival — 1 Gold, 2 Silver", category_zh: "华文创意", category_en: "Chinese Creative" },
];

const PARTNER_INSTITUTIONS_ZH = ["混沌大学", "博商管理研究院", "中欧商学院", "青山资本", "赛马资本", "中国营销企业家俱乐部", "中国糖酒会", "暗物质资本"];
const PARTNER_INSTITUTIONS_EN = ["Chaos University", "BSMI", "CEIBS", "Qingshan Capital", "Saima Capital", "China Marketing Entrepreneurs Club", "China Sugar & Wine Fair", "Dark Matter Capital"];

const STATS_ZH = [
  { value: "17", label: "国际顶级奖项" },
  { value: "16", label: "年全球布局" },
  { value: "12", label: "国家地区获奖" },
  { value: "20+", label: "国际合作机构" },
];
const STATS_EN = [
  { value: "17", label: "International Top Awards" },
  { value: "16", label: "Years of Global Presence" },
  { value: "12", label: "Countries & Regions" },
  { value: "20+", label: "International Partners" },
];

function getAwardImg(type: string) {
  if (type === "trophy") return TROPHY_IMG;
  if (type === "plaque") return PLAQUE_IMG;
  return MEDAL_IMG;
}

export default function Awards() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();
  const ref4 = useScrollReveal();
  const ref5 = useScrollReveal();
  const stats = isEn ? STATS_EN : STATS_ZH;
  const creativeAwards = isEn ? CREATIVE_AWARDS_EN : CREATIVE_AWARDS_ZH;
  const partnerInstitutions = isEn ? PARTNER_INSTITUTIONS_EN : PARTNER_INSTITUTIONS_ZH;
  const [activeYear, setActiveYear] = useState<number | null>(null);

  return (
    <section id="awards" className="bg-[#060606] py-24 lg:py-32 overflow-hidden">
      <div className="container">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="section-label mb-4">Awards & Recognition</div>
          <div className="flex items-end gap-6 mb-6">
            <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold leading-tight">
              {isEn ? "Global Awards & Honors" : "全球荣誉 · 历年奖项"}
            </h2>
            <div className="hidden md:block h-px flex-1 bg-white/10 mb-3" />
          </div>
          <p className="text-white/40 text-sm max-w-2xl leading-relaxed">
            {isEn
              ? "Since 2009, Mc&Mamoo has been recognized by leading international institutions across strategy, brand management, and consulting innovation — spanning Istanbul to Davos."
              : "自2009年起，猫眼咨询持续获得全球顶级战略与品牌管理机构的认可，从伊斯坦布尔到达沃斯，足迹遍布全球12个国家与地区。"}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-white/10 mt-10">
            {stats.map((s, i) => (
              <div key={s.label} className={`py-6 px-8 text-center ${i < 3 ? "border-r border-white/10" : ""}`}>
                <div className="text-[#C9A84C] font-['Cormorant_Garamond'] text-4xl font-semibold mb-1">{s.value}</div>
                <div className="text-white/40 text-xs tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Award Images Showcase ──────────────────────────────── */}
        <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="text-white/40 text-xs tracking-widest uppercase mb-6 font-['DM_Mono']">
            {isEn ? "Award Trophies & Medals" : "奖杯 · 奖牌 · 奖状"}
          </div>
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {[
              { img: MEDAL_IMG, label_zh: "卓越奖章", label_en: "Excellence Medal", sub_zh: "国际战略咨询", sub_en: "International Strategy" },
              { img: TROPHY_IMG, label_zh: "大奖奖杯", label_en: "Grand Prix Trophy", sub_zh: "品牌增长领袖", sub_en: "Brand Growth Leader" },
              { img: PLAQUE_IMG, label_zh: "荣誉奖牌", label_en: "Prestige Plaque", sub_zh: "行业卓越认可", sub_en: "Industry Excellence" },
            ].map((item, i) => (
              <div key={i} className="group relative bg-[#0D0D0D] border border-white/10 hover:border-[#C9A84C]/40 transition-all duration-500 overflow-hidden">
                <div className="aspect-square overflow-hidden bg-black flex items-center justify-center p-4 relative">
                  <img
                    src={item.img}
                    alt={isEn ? item.label_en : item.label_zh}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                    style={{ filter: 'sepia(0.15) brightness(0.93) contrast(0.96) saturate(0.90)' }}
                  />
                  {/* Aged overlay: subtle grain + vignette */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.25) 100%)' }} />
                </div>
                <div className="p-4 border-t border-white/10">
                  <div className="text-white font-semibold text-sm mb-0.5">{isEn ? item.label_en : item.label_zh}</div>
                  <div className="text-white/30 text-xs">{isEn ? item.sub_en : item.sub_zh}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Timeline: 2009–2025 ────────────────────────────────── */}
        <div ref={ref3 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="text-white/40 text-xs tracking-widest uppercase mb-8 font-['DM_Mono']">
            {isEn ? "Award Timeline 2009 – 2025" : "荣誉时间轴 2009 – 2025"}
          </div>

          {/* Year filter pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setActiveYear(null)}
              className={`px-3 py-1 text-xs border transition-all duration-200 font-['DM_Mono'] ${activeYear === null ? "border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10" : "border-white/20 text-white/40 hover:border-white/40"}`}
            >
              {isEn ? "All" : "全部"}
            </button>
            {[2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map(y => (
              <button
                key={y}
                onClick={() => setActiveYear(activeYear === y ? null : y)}
                className={`px-3 py-1 text-xs border transition-all duration-200 font-['DM_Mono'] ${activeYear === y ? "border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10" : "border-white/20 text-white/40 hover:border-white/40"}`}
              >
                {y}
              </button>
            ))}
          </div>

          {/* Award cards grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AWARDS.filter(a => activeYear === null || a.year === activeYear).map((award) => (
              <div
                key={award.year + award.name_en}
                className="group relative bg-[#0D0D0D] border border-white/10 hover:border-[#C9A84C]/50 transition-all duration-300 overflow-hidden"
              >
                {/* Year badge */}
                <div className="absolute top-0 left-0 bg-[#C9A84C] text-black text-xs font-bold font-['DM_Mono'] px-3 py-1">
                  {award.year}
                </div>

                {/* Award image thumbnail */}
                <div className="pt-8 px-4 pb-0 flex justify-center relative">
                  <div className="relative">
                    <img
                      src={getAwardImg(award.type)}
                      alt={award.type}
                      className="h-20 object-contain opacity-75 group-hover:opacity-90 transition-opacity duration-300"
                      style={{ filter: 'sepia(0.18) brightness(0.92) contrast(0.94) saturate(0.85)' }}
                    />
                    {/* Aged photo corner effect */}
                    <div className="absolute inset-0 pointer-events-none rounded-sm" style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(10,8,4,0.28) 100%)' }} />
                  </div>
                </div>

                <div className="p-4 pt-3">
                  <div className="text-[#C9A84C] text-xs font-['DM_Mono'] mb-1 uppercase tracking-wider">
                    {isEn ? award.category_en : award.category_zh}
                  </div>
                  <div className="text-white font-semibold text-sm leading-snug mb-2 group-hover:text-[#C9A84C] transition-colors">
                    {isEn ? award.name_en : award.name_zh}
                  </div>
                  <div className="text-white/30 text-xs leading-relaxed">
                    {award.org_en}
                  </div>
                  <div className="text-white/20 text-xs mt-1 font-['DM_Mono']">
                    📍 {award.city}
                  </div>
                </div>

                {/* Hover accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A84C] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Partner Institutions ───────────────────────────────── */}
        <div ref={ref4 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="text-white/40 text-xs tracking-widest uppercase mb-6 font-['DM_Mono']">
            {isEn ? "Recognized By & Partners" : "合作机构与认可"}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {INSTITUTIONS.map((inst) => (
              <div key={inst.name} className="p-4 border border-white/10 hover:border-[#C9A84C]/40 transition-all duration-300 group">
                <div className="text-white/70 font-semibold text-sm group-hover:text-[#C9A84C] transition-colors mb-1 leading-snug">{inst.name}</div>
                <div className="text-white/30 text-xs">{inst.cn}</div>
                <div className="text-white/20 text-xs mt-1 font-['DM_Mono']">{isEn ? inst.typeEn : inst.type}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Creative Awards + Partner Institutions (from Team) ─── */}
        <div ref={ref5 as React.RefObject<HTMLDivElement>} className="reveal">
          <div className="border-t border-white/10 pt-16">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Creative Awards */}
              <div>
                <div className="text-white/40 text-xs tracking-widest uppercase mb-8 font-['DM_Mono']">
                  {isEn ? "Creative Awards · Advertising Excellence" : "创意奖项 · 广告卓越"}
                </div>
                <div className="space-y-0">
                  {creativeAwards.map((a) => (
                    <div key={a.award} className="flex items-center gap-4 py-3.5 border-b border-white/10 group hover:border-[#C9A84C]/20 transition-colors">
                      <span className="font-['DM_Mono'] text-[#C9A84C] text-xs w-10 flex-shrink-0">{a.year}</span>
                      <span className="text-white/60 text-sm group-hover:text-white/80 transition-colors flex-1">{a.award}</span>
                      <span className="text-white/20 text-xs font-['DM_Mono'] flex-shrink-0">{isEn ? a.category_en : a.category_zh}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Partner Institutions */}
              <div>
                <div className="text-white/40 text-xs tracking-widest uppercase mb-8 font-['DM_Mono']">
                  {isEn ? "Partner Institutions" : "合作机构"}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {partnerInstitutions.map((p) => (
                    <div key={p} className="p-4 border border-white/10 text-white/50 text-sm hover:border-[#C9A84C]/40 hover:text-white/80 transition-all duration-300">{p}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
