/*
 * Team Section — Core Team + Awards & Qualifications
 * Design: deep black, team cards + awards list
 * i18n: full bilingual support
 */
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "react-i18next";

const team = [
  {
    name: "Sean DAI（代言）",
    nameEn: "Sean DAI",
    role: "创始人 / 首席战略专家",
    roleEn: "Founder & Chief Strategy Expert",
    en: "Founder & Chief Strategy Expert",
    bio: "错位竞争理论创始人，与特劳特定位理论并称全球营销两大流派。14年主导孵化8个10亿级大单品，帮助MasterCard三年逆势增长70亿美金。前德勤咨询高级分析师，北美注册会计师（ACCA）。",
    bioEn: "Founder of the Misaligned Competition Theory, recognized alongside Trout's Positioning Theory as one of the two major global marketing schools. Over 14 years, led the incubation of 8 billion-dollar products and helped Mastercard achieve counter-cyclical growth of $7B over three years. Former senior analyst at Deloitte Consulting, North American CPA (ACCA).",
    tags: ["错位竞争理论", "暗物质资本合伙人", "中欧商学院特邀专家"],
    tagsEn: ["Misaligned Competition Theory", "Dark Matter Capital Partner", "CEIBS Guest Expert"],
  },
  {
    name: "王琳 Elva Wong",
    nameEn: "Elva Wong",
    role: "合伙人 / Partner",
    roleEn: "Partner",
    en: "Partner",
    bio: "多年品牌营销经验，集团层面品牌管理者，百亿品牌幕后推手。深度参与Skinow、益盛汉参、张裕醉诗仙等消费品战略破局，从0到1，从1到10。拥有丰富电商经验，手里拥有海量一线网红资源。",
    bioEn: "Veteran brand marketing expert and group-level brand manager, the force behind multiple billion-dollar brands. Deeply involved in strategic breakthroughs for consumer brands including Skinow, Yisheng Hanshen, and Changyu Zuishixian — from 0 to 1 and 1 to 10. Rich e-commerce experience with extensive top-tier influencer resources.",
    tags: ["品牌营销", "电商运营", "网红资源"],
    tagsEn: ["Brand Marketing", "E-Commerce Operations", "Influencer Resources"],
  },
  {
    name: "黄和可 Koko HUANG",
    nameEn: "Koko HUANG",
    role: "导演 / Director",
    roleEn: "Director · Whale Studio",
    en: "Director · Whale Studio",
    bio: "服务的青啤夜猫子、青啤1903、崂山啤酒、健达巧克力等都成为经典，助力客户突破百亿。主导的居康成为经典品类案例，两年销售从0到10亿。夜猫子等多部作品刷屏，播放量2亿+。",
    bioEn: "Directed iconic campaigns for Tsingtao Night Owl, Tsingtao 1903, Laoshan Beer, and Kinder Chocolate, helping clients break the ¥10B mark. The Jukang campaign became a classic category case with sales growing from zero to ¥1B in two years. Night Owl and other works went viral with 200M+ views.",
    tags: ["伦敦国际奖华文金奖", "中国胖鲸智库专家", "爆款视频"],
    tagsEn: ["London International Awards Gold", "China Jelly Think Tank Expert", "Viral Video Creator"],
  },
  {
    name: "图拉古",
    nameEn: "Tulagu",
    role: "导演 / Director",
    roleEn: "Director · Film Director",
    en: "Director · Film Director",
    bio: "中国内地影视导演，毕业于北京电影学院、南加州大学电影艺术学院，福布斯FGA500精英。2015年凭借推理电影获得巴黎电影节单片最佳导演奖。2021年推出超级电影工业系统。",
    bioEn: "Mainland Chinese film and TV director, graduated from Beijing Film Academy and USC School of Cinematic Arts. Forbes FGA500 Elite. Won Best Director at the Paris Film Festival in 2015 for a mystery film. Launched the Super Film Industry System in 2021.",
    tags: ["巴黎电影节最佳导演", "北京电影学院", "南加州大学"],
    tagsEn: ["Paris Film Festival Best Director", "Beijing Film Academy", "USC School of Cinematic Arts"],
  },
];

const awardsData = [
  { year: "2021", zh: "伦敦广告节 小金人（London International Awards）", en: "London International Awards — Gold" },
  { year: "2016", zh: "戛纳广告节 1金1铜（Cannes Lions）", en: "Cannes Lions — 1 Gold, 1 Bronze" },
  { year: "2015", zh: "戛纳广告节 1金1银（Cannes Lions）", en: "Cannes Lions — 1 Gold, 1 Silver" },
  { year: "2014", zh: "D&AD In Book", en: "D&AD — In Book" },
  { year: "2014", zh: "ONE SHOW 铜铅笔", en: "One Show — Bronze Pencil" },
  { year: "2014", zh: "亚太广告节 铜奖", en: "ADFEST — Bronze" },
  { year: "2013", zh: "戛纳广告节 铜狮（Cannes Lions）", en: "Cannes Lions — Bronze Lion" },
  { year: "2013", zh: "中国4A金印奖 金奖", en: "China 4A Gold Seal Award — Gold" },
  { year: "2013", zh: "龙玺广告节 1金2银", en: "Longxi Advertising Festival — 1 Gold, 2 Silver" },
];

const partnersZh = [
  "混沌大学", "博商管理研究院", "中欧商学院",
  "青山资本", "赛马资本", "中国营销企业家俱乐部",
  "中国糖酒会", "暗物质资本（Dark Matter Capital）",
];

const partnersEn = [
  "Chaos University", "BSMI", "CEIBS",
  "Qingshan Capital", "Saima Capital", "China Marketing Entrepreneurs Club",
  "China Sugar & Wine Fair", "Dark Matter Capital",
];

export default function Team() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();

  const partners = isEn ? partnersEn : partnersZh;

  const serviceModels = isEn ? [
    { type: "High-Growth Potential Brands", model: "Low service fee + Large equity swap + Large VC investment" },
    { type: "Steady-Growth Brands", model: "Medium service fee + Medium equity swap + Medium VC investment" },
    { type: "Standard Projects", model: "Standard service fee" },
  ] : [
    { type: "高增长潜力品牌", model: "低服务费 + 大股权置换 + 大额风投" },
    { type: "稳定增长品牌", model: "中等服务费 + 中股权置换 + 中额风投" },
    { type: "标准项目", model: "标准服务费" },
  ];

  return (
    <section id="team" className="bg-[#0A0A0A] py-24 lg:py-32">
      <div className="container">
        {/* Team header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="section-label mb-4">05 — Core Team</div>
          <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold">
            {isEn ? "Core Team" : "核心团队"}
          </h2>
        </div>

        {/* Team cards */}
        <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal grid md:grid-cols-2 gap-4 mb-24">
          {team.map((member, i) => (
            <div
              key={member.name}
              className="p-8 border border-white/10 hover:border-[#C9A84C]/40 transition-all duration-300 group"
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-['Noto_Serif_SC'] text-white text-xl font-bold mb-1 group-hover:text-[#C9A84C] transition-colors">
                    {isEn ? member.nameEn : member.name}
                  </h3>
                  <div className="text-[#C9A84C] text-sm">{isEn ? member.roleEn : member.role}</div>
                  {!isEn && <div className="text-white/30 text-xs font-['DM_Mono'] mt-0.5">{member.en}</div>}
                </div>
                <div className="w-8 h-8 border border-[#C9A84C]/30 flex items-center justify-center group-hover:border-[#C9A84C] transition-colors">
                  <span className="text-[#C9A84C] text-xs font-['DM_Mono']">0{i + 1}</span>
                </div>
              </div>

              <div className="h-px bg-white/10 mb-4" />

              <p className="text-white/60 text-sm leading-relaxed mb-4">
                {isEn ? member.bioEn : member.bio}
              </p>

              <div className="flex flex-wrap gap-2">
                {(isEn ? member.tagsEn : member.tags).map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs border border-white/10 text-white/40 group-hover:border-[#C9A84C]/30 group-hover:text-[#C9A84C]/70 transition-all"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Awards + Partners */}
        <div ref={ref3 as React.RefObject<HTMLDivElement>} className="reveal grid lg:grid-cols-2 gap-12">
          {/* Awards */}
          <div>
            <div className="section-label mb-6">{isEn ? "Awards & Honors" : "荣誉奖项"}</div>
            <div className="space-y-0">
              {awardsData.map((a) => (
                <div
                  key={a.zh}
                  className="flex items-center gap-4 py-3.5 border-b border-white/10 group hover:border-[#C9A84C]/20 transition-colors"
                >
                  <span className="font-['DM_Mono'] text-[#C9A84C] text-xs w-10 flex-shrink-0">{a.year}</span>
                  <span className="text-white/60 text-sm group-hover:text-white/80 transition-colors">
                    {isEn ? a.en : a.zh}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Partners */}
          <div>
            <div className="section-label mb-6">{isEn ? "Partner Institutions" : "合作机构"}</div>
            <div className="grid grid-cols-2 gap-3">
              {partners.map((p) => (
                <div
                  key={p}
                  className="p-4 border border-white/10 text-white/50 text-sm hover:border-[#C9A84C]/40 hover:text-white/80 transition-all duration-300"
                >
                  {p}
                </div>
              ))}
            </div>

            {/* Service models */}
            <div className="mt-8 p-6 border border-[#C9A84C]/30 bg-[#C9A84C]/5">
              <div className="text-white/40 text-xs tracking-widest uppercase mb-4 font-['DM_Mono']">
                {isEn ? "Service Models" : "服务模式"}
              </div>
              <div className="space-y-3">
                {serviceModels.map((m) => (
                  <div key={m.type} className="flex items-start gap-3">
                    <span className="text-[#C9A84C] mt-1 text-xs">◆</span>
                    <div>
                      <span className="text-white text-sm font-semibold">{m.type}</span>
                      <span className="text-white/40 text-sm"> — {m.model}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
