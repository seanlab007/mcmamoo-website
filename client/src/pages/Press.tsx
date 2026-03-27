/*
 * Press & Awards News Page — SEO-optimized press releases
 * Route: /press
 * SEO: structured award announcements for search engine indexing
 */
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const PRESS_RELEASES = [
  {
    id: "davos-2025",
    date: "2025-01-22",
    year: 2025,
    title_zh: "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)荣获达沃斯全球战略咨询创新领袖奖",
    title_en: "Mc&Mamoo Receives Davos Global Strategic Consulting Innovation Leadership Award",
    org: "Davos Global Strategic Innovation Forum",
    city: "Davos, Switzerland",
    excerpt_zh: "在2025年达沃斯全球战略创新论坛上，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)（Mc&Mamoo）凭借其在AI驱动品牌战略咨询领域的全球领先地位，荣获年度最高荣誉——达沃斯全球战略咨询创新领袖奖。这是猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)连续第17年在国际舞台获得顶级机构认可。",
    excerpt_en: "At the 2025 Davos Global Strategic Innovation Forum, Mc&Mamoo was honored with the highest annual award — the Davos Global Strategic Consulting Innovation Leadership Award — recognizing its global leadership in AI-driven brand strategy consulting. This marks Mc&Mamoo's 17th consecutive year of recognition by top international institutions.",
    body_zh: `达沃斯，瑞士，2025年1月22日——猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)（Mc&Mamoo Brand Management Inc.）今日宣布，公司荣获达沃斯全球战略创新论坛颁发的"全球战略咨询创新领袖奖"。

本次获奖是对猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)在人工智能驱动的品牌战略咨询领域所取得成就的高度认可。评审委员会特别指出，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)独创的"猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎"方法论——涵盖品牌溢价、利润倍增与全域增长三大核心模块——在过去十六年间帮助超过200个中国消费品牌实现了平均3-8倍的溢价提升。

猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)创始人表示："这个奖项属于我们服务过的每一个品牌。我们的使命从未改变——让中国品牌在全球市场卖出更高的价格、赚取更多的利润、实现更快的增长。"

关于达沃斯全球战略创新论坛：该论坛每年在瑞士达沃斯举办，汇聚全球顶级战略咨询机构、政府决策者和企业领袖，共同探讨全球战略创新趋势。`,
    body_en: `Davos, Switzerland, January 22, 2025 — Mc&Mamoo Brand Management Inc. today announced it has been honored with the "Global Strategic Consulting Innovation Leadership Award" by the Davos Global Strategic Innovation Forum.

This recognition highlights Mc&Mamoo's achievements in AI-driven brand strategy consulting. The evaluation committee specifically noted Mc&Mamoo's proprietary "Growth Engine" methodology — encompassing brand premium elevation, profit multiplication, and omni-channel growth — which has helped over 200 Chinese consumer brands achieve an average 3-8x premium increase over the past sixteen years.

"This award belongs to every brand we have served," said Mc&Mamoo's founder. "Our mission has never changed — to help Chinese brands sell at higher prices, earn more profits, and grow faster in global markets."

About the Davos Global Strategic Innovation Forum: The Forum convenes annually in Davos, Switzerland, bringing together the world's leading strategic consulting institutions, government decision-makers, and business leaders to explore global strategic innovation trends.`,
    tags: ["Strategy", "AI", "Brand", "Davos", "Innovation"],
  },
  {
    id: "london-2024",
    date: "2024-06-15",
    year: 2024,
    title_zh: "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)入选英国品牌战略研究院全球TOP10咨询机构",
    title_en: "Mc&Mamoo Named Among London Global Brand Strategy Consulting Firm TOP 10",
    org: "British Brand Strategy Research Institute",
    city: "London, UK",
    excerpt_zh: "英国品牌战略研究院年度评选结果揭晓，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)（Mc&Mamoo）成功入选全球品牌战略咨询机构TOP10榜单，成为唯一入选的中国本土咨询机构。",
    excerpt_en: "The British Brand Strategy Research Institute has released its annual rankings, with Mc&Mamoo named among the Top 10 global brand strategy consulting firms — the only China-based consulting firm to achieve this recognition.",
    body_zh: `伦敦，英国，2024年6月15日——英国品牌战略研究院今日发布年度全球品牌战略咨询机构TOP10榜单，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)（Mc&Mamoo）成功入选，成为唯一一家跻身该榜单的中国本土咨询机构。

评选委员会表示，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)凭借其在中国消费品牌全域增长领域的系统性方法论、丰富的成功案例以及在亚太市场的深度影响力，从全球数百家机构中脱颖而出。

猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)的代表性案例包括：帮助小仙炖燕窝从0增长至20亿年销售额，帮助法国奢侈品牌LA CELLE在中国市场实现单日售出2万瓶的突破，以及帮助江中猴姑米稀在3年内实现销售额翻10倍。

这一荣誉进一步巩固了猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)作为亚太区领先品牌战略咨询机构的国际地位。`,
    body_en: `London, UK, June 15, 2024 — The British Brand Strategy Research Institute today released its annual Top 10 Global Brand Strategy Consulting Firms ranking, with Mc&Mamoo named on the list — the only China-based consulting firm to achieve this recognition.

The evaluation committee noted that Mc&Mamoo stood out from hundreds of global firms for its systematic methodology in omni-channel growth for Chinese consumer brands, rich portfolio of success cases, and deep influence in Asia-Pacific markets.

Representative cases include: growing Xiaoxiandun Bird's Nest from zero to ¥2 billion in annual sales; achieving a single-day sales record of 20,000 bottles for French luxury brand LA CELLE in China; and tripling Jiangzhong Monkey Mushroom Rice's sales within three years.

This honor further cements Mc&Mamoo's international standing as a leading brand strategy consulting institution in the Asia-Pacific region.`,
    tags: ["Brand Strategy", "TOP10", "London", "Global Ranking"],
  },
  {
    id: "singapore-2023",
    date: "2023-09-08",
    year: 2023,
    title_zh: "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)荣获亚太战略咨询协会年度最高荣誉奖",
    title_en: "Mc&Mamoo Wins Asia-Pacific Strategic Consulting Association's Highest Annual Honor",
    org: "Asia-Pacific Strategic Consulting Association",
    city: "Singapore",
    excerpt_zh: "亚太战略咨询协会年度颁奖典礼在新加坡举行，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)凭借在亚太区品牌战略咨询领域的全面领先地位，荣获年度最高荣誉奖。",
    excerpt_en: "At the Asia-Pacific Strategic Consulting Association's annual awards ceremony in Singapore, Mc&Mamoo received the highest annual honor for its comprehensive leading position in brand strategy consulting across the Asia-Pacific region.",
    body_zh: `新加坡，2023年9月8日——亚太战略咨询协会年度颁奖典礼今日在新加坡举行，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)（Mc&Mamoo）荣获年度最高荣誉奖。

本次获奖是对猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)在亚太区品牌战略咨询领域全面领先地位的高度认可。评审委员会特别指出，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)在过去十五年间，通过其独创的"猫眼增长引擎 (Mc&Mamoo Growth Engine)方法论"，帮助中国消费品牌在亚太市场实现了系统性的品牌溢价提升和全域增长。

猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)的"毛智库"战略研究部门在全球战略预测领域的85%准确率，以及与IMF、俄罗斯战略研究院、中国人民解放军等顶级机构的深度合作，也是本次获奖的重要因素。`,
    body_en: `Singapore, September 8, 2023 — The Asia-Pacific Strategic Consulting Association held its annual awards ceremony in Singapore today, with Mc&Mamoo receiving the highest annual honor.

This recognition acknowledges Mc&Mamoo's comprehensive leading position in brand strategy consulting across the Asia-Pacific region. The evaluation committee specifically noted that over the past fifteen years, through its proprietary "Mc&Mamoo Methodology," the firm has helped Chinese consumer brands achieve systematic brand premium elevation and omni-channel growth in Asia-Pacific markets.

The 85% accuracy rate of Mc&Mamoo's "Mao Think Tank" strategic research division in global strategic forecasting, as well as its deep collaboration with top institutions including the IMF, Russian Institute for Strategic Studies, and the People's Liberation Army, were also key factors in this recognition.`,
    tags: ["APAC", "Strategy", "Singapore", "Brand Management"],
  },
  {
    id: "zurich-2022",
    date: "2022-11-03",
    year: 2022,
    title_zh: "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)荣获苏黎世国际品牌管理协会卓越机构奖",
    title_en: "Mc&Mamoo Honored with Zurich International Brand Management Excellence Institution Award",
    org: "Zurich International Brand Management Association",
    city: "Zurich, Switzerland",
    excerpt_zh: "苏黎世国际品牌管理协会颁发年度卓越机构奖，表彰猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)在全球品牌管理领域的卓越机构能力和系统方法论。",
    excerpt_en: "The Zurich International Brand Management Association presented its annual Excellence Institution Award to Mc&Mamoo, recognizing the firm's outstanding institutional capabilities and systematic methodologies in global brand management.",
    body_zh: `苏黎世，瑞士，2022年11月3日——苏黎世国际品牌管理协会今日宣布，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)（Mc&Mamoo）荣获年度卓越机构奖。

这一奖项表彰在全球品牌管理领域具有卓越机构能力和系统方法论的咨询公司。猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)凭借其在品牌溢价战略、全域增长体系和趋势预判三大核心能力上的系统性积累，从全球候选机构中脱颖而出。

评审委员会特别提到，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)在过去十四年间服务的品牌中，客户平均利润率提升超过200%，全域GMV平均增长5-10倍，品牌溢价平均提升3-8倍，这些数据充分证明了其方法论的有效性和可复制性。`,
    body_en: `Zurich, Switzerland, November 3, 2022 — The Zurich International Brand Management Association today announced that Mc&Mamoo has received the annual Excellence Institution Award.

This award recognizes consulting firms with outstanding institutional capabilities and systematic methodologies in global brand management. Mc&Mamoo stood out from global candidates for its systematic accumulation in three core capabilities: brand premium strategy, omni-channel growth systems, and trend prediction.

The evaluation committee specifically noted that among the brands Mc&Mamoo has served over the past fourteen years, clients have achieved an average profit margin increase of over 200%, average omni-channel GMV growth of 5-10x, and average brand premium increase of 3-8x — fully demonstrating the effectiveness and replicability of its methodology.`,
    tags: ["Brand Management", "Zurich", "Excellence", "Methodology"],
  },
  {
    id: "paris-2016",
    date: "2016-10-20",
    year: 2016,
    title_zh: "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)荣获巴黎国际奢侈品管理协会战略咨询金奖",
    title_en: "Mc&Mamoo Wins Paris International Luxury Management Association Strategy Consulting Gold Award",
    org: "Paris International Luxury Management Association",
    city: "Paris, France",
    excerpt_zh: "巴黎国际奢侈品管理协会年度颁奖，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)凭借在奢侈品牌战略咨询领域的杰出贡献与创新方法论，荣获战略咨询金奖。",
    excerpt_en: "At the Paris International Luxury Management Association's annual awards, Mc&Mamoo won the Strategy Consulting Gold Award for its outstanding contributions and innovative methodologies in luxury brand strategy consulting.",
    body_zh: `巴黎，法国，2016年10月20日——巴黎国际奢侈品管理协会年度颁奖典礼今日举行，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)（Mc&Mamoo）荣获战略咨询金奖。

这是猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)首次在欧洲奢侈品领域获得顶级机构认可。评审委员会指出，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)在帮助中国消费品牌向奢侈品和高端定位转型方面，展现出了独特的方法论优势和丰富的实战经验。

猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)的奢侈品战略方法论核心在于：通过感官语言升级和高端场景渗透，让消费者主动为品牌溢价买单，实现品牌从大众市场向高端市场的系统性跨越。`,
    body_en: `Paris, France, October 20, 2016 — The Paris International Luxury Management Association held its annual awards ceremony today, with Mc&Mamoo receiving the Strategy Consulting Gold Award.

This marks Mc&Mamoo's first recognition by a top European luxury institution. The evaluation committee noted that Mc&Mamoo has demonstrated unique methodological advantages and rich practical experience in helping Chinese consumer brands transition toward luxury and premium positioning.

The core of Mc&Mamoo's luxury strategy methodology lies in: upgrading sensory language and penetrating high-end scenarios to make consumers proactively pay premium prices for brands, achieving a systematic leap from mass market to premium market.`,
    tags: ["Luxury", "Paris", "Gold Award", "Brand Premium"],
  },
  {
    id: "brussels-2011",
    date: "2011-05-12",
    year: 2011,
    title_zh: "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)荣获布鲁塞尔战略咨询行业协会大奖",
    title_en: "Mc&Mamoo Wins Brussels Strategic Consulting Industry Association Grand Prix",
    org: "Brussels Strategic Consulting Industry Association",
    city: "Brussels, Belgium",
    excerpt_zh: "欧洲最具权威的战略咨询行业大奖——布鲁塞尔战略咨询行业协会大奖颁发，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)凭借在全球品牌管理领域的行业引领作用荣获此殊荣。",
    excerpt_en: "Europe's most authoritative strategic consulting industry award — the Brussels Strategic Consulting Industry Association Grand Prix — was presented to Mc&Mamoo for its industry-leading role in global brand management.",
    body_zh: `布鲁塞尔，比利时，2011年5月12日——布鲁塞尔战略咨询行业协会年度颁奖典礼今日举行，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)（Mc&Mamoo）荣获年度大奖。

这是猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)成立以来首次获得欧洲顶级战略咨询行业机构的认可。评审委员会表示，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)在中国消费品牌全球化战略方面的系统性探索，以及其独创的品牌溢价方法论，在全球咨询行业具有重要的参考价值和引领意义。

这一奖项标志着猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)正式进入全球顶级战略咨询机构的视野，也为其后续在全球范围内的品牌建设奠定了重要基础。`,
    body_en: `Brussels, Belgium, May 12, 2011 — The Brussels Strategic Consulting Industry Association held its annual awards ceremony today, with Mc&Mamoo receiving the Grand Prix.

This marks Mc&Mamoo's first recognition by a top European strategic consulting industry institution since its founding. The evaluation committee stated that Mc&Mamoo's systematic exploration of Chinese consumer brand globalization strategy, and its proprietary brand premium methodology, hold important reference value and leading significance for the global consulting industry.

This award marks Mc&Mamoo's formal entry into the vision of the world's top strategic consulting institutions, and lays an important foundation for its subsequent global brand building.`,
    tags: ["Brussels", "Grand Prix", "Strategy", "Europe"],
  },
];

export default function Press() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();

  return (
    <div className="min-h-screen bg-[#060606]">
      {/* SEO meta-like structured header */}
      <div className="bg-[#0A0A0A] border-b border-white/10 py-4 px-6">
        <div className="container flex items-center gap-3 text-white/30 text-xs font-['DM_Mono']">
          <Link href="/" className="hover:text-[#C9A84C] transition-colors">
            {isEn ? "Home" : "首页"}
          </Link>
          <span>/</span>
          <span className="text-white/60">{isEn ? "Press & Awards" : "新闻 & 荣誉"}</span>
        </div>
      </div>

      <div className="container py-20">

        {/* Header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="section-label mb-4">Press & Awards</div>
          <h1 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold leading-tight mb-6">
            {isEn ? "Press Releases & Award Announcements" : "新闻稿 · 获奖公告"}
          </h1>
          <p className="text-white/40 text-sm max-w-2xl leading-relaxed mb-8">
            {isEn
              ? "Official press releases and award announcements from Mc&Mamoo Brand Management Inc. — documenting 17 years of international recognition from Istanbul to Davos."
              : "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)（Mc&Mamoo）官方新闻稿与获奖公告，记录17年来从伊斯坦布尔到达沃斯的全球荣誉历程。"}
          </p>

          {/* Stats bar */}
          <div className="flex flex-wrap gap-6 text-xs font-['DM_Mono']">
            {[
              { v: "17", l: isEn ? "International Awards" : "国际奖项" },
              { v: "2009–2025", l: isEn ? "Award History" : "获奖历程" },
              { v: "12", l: isEn ? "Countries" : "国家地区" },
              { v: "6", l: isEn ? "Press Releases" : "新闻稿" },
            ].map(s => (
              <div key={s.l} className="flex items-center gap-2">
                <span className="text-[#C9A84C] font-bold text-base">{s.v}</span>
                <span className="text-white/30">{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Press releases list */}
        <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal space-y-8">
          {PRESS_RELEASES.map((pr) => (
            <article
              key={pr.id}
              className="border border-white/10 hover:border-[#C9A84C]/30 transition-all duration-300 group"
              itemScope
              itemType="https://schema.org/NewsArticle"
            >
              {/* Article header */}
              <div className="p-6 pb-4 border-b border-white/10">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="bg-[#C9A84C] text-black text-xs font-bold font-['DM_Mono'] px-2 py-0.5">
                    {pr.year}
                  </span>
                  <span className="text-white/30 text-xs font-['DM_Mono']">{pr.date}</span>
                  <span className="text-white/20 text-xs">📍 {pr.city}</span>
                  <span className="text-white/20 text-xs">— {pr.org}</span>
                </div>
                <h2
                  className="font-['Noto_Serif_SC'] text-white text-xl font-bold leading-snug group-hover:text-[#C9A84C] transition-colors mb-2"
                  itemProp="headline"
                >
                  {isEn ? pr.title_en : pr.title_zh}
                </h2>
                <p className="text-white/40 text-sm leading-relaxed" itemProp="description">
                  {isEn ? pr.excerpt_en : pr.excerpt_zh}
                </p>
              </div>

              {/* Article body (collapsible via details/summary) */}
              <details className="group/details">
                <summary className="px-6 py-3 text-[#C9A84C] text-xs font-['DM_Mono'] cursor-pointer hover:text-[#E8C97A] transition-colors select-none list-none flex items-center gap-2">
                  <span className="group-open/details:hidden">▶ {isEn ? "Read full press release" : "阅读完整新闻稿"}</span>
                  <span className="hidden group-open/details:inline">▼ {isEn ? "Collapse" : "收起"}</span>
                </summary>
                <div className="px-6 pb-6">
                  <div className="border-t border-white/10 pt-4">
                    <div className="text-white/60 text-sm leading-relaxed whitespace-pre-line" itemProp="articleBody">
                      {isEn ? pr.body_en : pr.body_zh}
                    </div>
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {pr.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 border border-white/20 text-white/30 text-xs font-['DM_Mono']">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </details>
            </article>
          ))}
        </div>

        {/* Back to home */}
        <div className="mt-16 text-center">
          <Link
            href="/#awards"
            className="inline-flex items-center gap-2 border border-[#C9A84C]/40 text-[#C9A84C] px-6 py-3 text-sm font-['DM_Mono'] hover:bg-[#C9A84C]/10 transition-all duration-200"
          >
            ← {isEn ? "View Awards Section" : "查看荣誉板块"}
          </Link>
        </div>
      </div>
    </div>
  );
}
