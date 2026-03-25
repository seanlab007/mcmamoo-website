/*
 * Awards Section — 国际荣誉墙
 * Design: 深黑底 + 金色奖项展示 + 合作机构 LOGO 墙
 * Theme: 国际权威背书 · 行业顶级认可
 */
import { useScrollReveal } from "@/hooks/useScrollReveal";

// Generic fallback images
const MEDAL_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_medal_gold_6822bcf3.png";
const TROPHY_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_trophy_gold_0ef0784f.png";
const PLAQUE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_plaque_prestige_e3eeef5e.png";

// City-specific award images
const CITY_AWARD_IMGS: Record<string, string> = {
  Istanbul: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_istanbul_medal-Uaskuz6pSfypFt7RXubeHo.png",
  "New York": "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_newyork_trophy-o9WjWf2FysAYntxfuSRaoG.png",
  Brussels: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_brussels_medal-er9FZWTrvdVxFw6Td79em7.png",
  Geneva: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_geneva_plaque-4ZNH8CWmoG3FipvyWE5rjC.png",
  Singapore: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_singapore_trophy-fVQDT6yNYHAW4Epdit6mYh.png",
  London: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_london_medal-BbVxpBeWpD2uHkGXQEeSTN.png",
  Dubai: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_dubai_trophy-Y4UK9zc2Q77dGmAdEA5bYu.png",
  Paris: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_paris_medal-ZZ6nQAd2qaPEh5GhJ6mH6A.png",
  Munich: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_munich_trophy-PBK5Zr3ose2cXU5UFnod3i.png",
  Seoul: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_seoul_plaque-JRxXf4Zh5tkq8iAervf2QN.png",
  Vienna: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_vienna_medal-GAogVzGHNNECwKPWR8sapg.png",
  Shanghai: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_shanghai_trophy-f3CMmRb2PFbBBARWbWxnk9.png",
  Zurich: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_zurich_medal-oVLca8mSjRSG3dpYCrG7NU.png",
  Davos: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/award_davos_trophy-AcRbmjenhiJUas7oiNBGBP.png",
};

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
const STATS_EN = [
  { value: "17", label: "International Top Awards" },
  { value: "16", label: "Years of Global Presence" },
  { value: "12", label: "Countries & Regions" },
  { value: "20+", label: "International Partners" },
];

function getAwardImg(type: string, city?: string) {
  if (city && CITY_AWARD_IMGS[city]) return CITY_AWARD_IMGS[city];
  if (type === "trophy") return TROPHY_IMG;
  if (type === "plaque") return PLAQUE_IMG;
  return MEDAL_IMG;
}

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

                {/* Award image thumbnail */}
                <div className="pt-8 px-4 pb-0 flex justify-center relative">
                  <div className="relative">
                    <img
                      src={getAwardImg(award.type, award.city)}
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
