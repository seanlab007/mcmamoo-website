/*
 * KOL Section — Top Influencer Strategic Partnerships
 * i18n: full bilingual support
 */
import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "react-i18next";

const DOMESTIC_KOLS = [
  { name: "薇娅", enName: "Viya", platform: "淘宝直播", platformEn: "Taobao Live", followers: "1.2亿", followersEn: "120M", gmvZh: "单场带货破50亿", gmvEn: "¥5B+ per livestream", tag: "带货女王", tagEn: "Sales Queen", descZh: "中国直播电商开创者，与猫眼增长引擎深度合作品牌孵化，多个品牌实现从0到10亿的跨越式增长。", descEn: "Pioneer of China's livestream e-commerce. Deep brand incubation partnership with Mc&Mamoo Growth Engine, helping multiple brands leap from zero to ¥1B.", image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/weiya_baf88932.jpg" },
  { name: "李佳琦", enName: "Austin Li", platform: "抖音 / 淘宝", platformEn: "Douyin / Taobao", followers: "7000万+", followersEn: "70M+", gmvZh: "年带货超300亿", gmvEn: "¥30B+ annual GMV", tag: "口红一哥", tagEn: "Lipstick King", descZh: "美妆类目绝对头部，猫眼增长引擎为其合作品牌提供品牌溢价策略，助力多品牌实现高端化转型。", descEn: "Absolute leader in beauty & cosmetics. Mc&Mamoo Growth Engine provides brand premiumization strategies for his partner brands, driving luxury-tier transformation.", image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/lijiaqi_dbabdd8a.jpg" },
  { name: "辛巴", enName: "Xinba", platform: "快手", platformEn: "Kuaishou", followers: "1.4亿", followersEn: "140M", gmvZh: "单场带货近70亿", gmvEn: "¥7B per livestream", tag: "快手一哥", tagEn: "Kuaishou #1", descZh: "下沉市场绝对王者，猫眼增长引擎协助其生态品牌构建品牌护城河，实现从流量到品牌的价值升级。", descEn: "Absolute king of lower-tier markets. Mc&Mamoo Growth Engine helps his ecosystem brands build brand moats, upgrading from traffic to brand value.", image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/xinba_ede0de7d.webp" },
  { name: "小杨哥", enName: "Xiao Yang Ge", platform: "抖音", platformEn: "Douyin", followers: "1.2亿", followersEn: "120M", gmvZh: "年带货超200亿", gmvEn: "¥20B+ annual GMV", tag: "抖音带货王", tagEn: "Douyin Commerce King", descZh: "三只羊网络创始人，猫眼增长引擎为其合作品牌提供全域增长策略，实现品效合一的高速增长。", descEn: "Founder of Three Sheep Network. Mc&Mamoo Growth Engine provides omni-channel growth strategies for his partner brands, achieving brand-performance unified rapid growth.", image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/xiaoyangg_994663bc.jpg" },
  { name: "蛋蛋", enName: "Dandan", platform: "抖音", platformEn: "Douyin", followers: "3000万+", followersEn: "30M+", gmvZh: "单场带货破亿", gmvEn: "¥100M+ per livestream", tag: "三只羊核心主播", tagEn: "Three Sheep Top Host", descZh: "三只羊旗下头部主播，以亲和力和专业度著称，猫眼增长引擎助力其合作品牌实现精准人群渗透。", descEn: "Top host under Three Sheep, known for relatability and expertise. Mc&Mamoo Growth Engine helps partner brands achieve precise audience penetration.", image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/xinba_live_b1916f8b.jpg" },
];

const GLOBAL_KOLS = [
  { name: "Charli D'Amelio", enName: "Charli D'Amelio", platform: "TikTok", platformEn: "TikTok", followers: "1.58亿", followersEn: "158M", gmvZh: "全球最具影响力达人", gmvEn: "World's Most Influential Creator", tag: "TikTok No.1", tagEn: "TikTok No.1", descZh: "TikTok全球粉丝量第一，猫眼增长引擎协助中国品牌借助其影响力实现北美市场品牌溢价突破。", descEn: "#1 TikTok creator globally. Mc&Mamoo Growth Engine helps Chinese brands leverage her influence to achieve brand premium breakthroughs in North America.", image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/charli_bc1435dc.jpg" },
  { name: "Khaby Lame", enName: "Khaby Lame", platform: "TikTok", platformEn: "TikTok", followers: "1.55亿", followersEn: "155M", gmvZh: "全球最高商业价值", gmvEn: "Highest Commercial Value Globally", tag: "TikTok全球第二", tagEn: "TikTok Global #2", descZh: "无语言障碍的全球化内容创作者，猫眼增长引擎借助其跨文化影响力为品牌打通欧非市场。", descEn: "Language-barrier-free global content creator. Mc&Mamoo Growth Engine leverages his cross-cultural influence to open European and African markets for brands.", image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/tiktok_stars_9b180303.jpg" },
  { name: "MrBeast", enName: "MrBeast", platform: "YouTube / TikTok", platformEn: "YouTube / TikTok", followers: "2.6亿+", followersEn: "260M+", gmvZh: "全球最高商业回报", gmvEn: "Highest Commercial Returns Globally", tag: "YouTube之王", tagEn: "King of YouTube", descZh: "全球最大YouTube频道主理人，猫眼增长引擎协助品牌通过其渠道实现全球范围内的爆发式增长。", descEn: "Owner of the world's largest YouTube channel. Mc&Mamoo Growth Engine helps brands achieve explosive global growth through his channels.", image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/tiktok_stars_9b180303.jpg" },
];

const STATS_ZH = [
  { num: "500+", label: "头部KOL战略合作" },
  { num: "20+", label: "覆盖内容平台" },
  { num: "50亿+", label: "年度合作GMV" },
  { num: "98%", label: "品牌客户续约率" },
];
const STATS_EN = [
  { num: "500+", label: "Top KOL Strategic Partners" },
  { num: "20+", label: "Content Platforms Covered" },
  { num: "¥5B+", label: "Annual Partner GMV" },
  { num: "98%", label: "Brand Client Renewal Rate" },
];

export default function KOL() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';
  const [activeTab, setActiveTab] = useState<"domestic" | "global">("domestic");
  const [activeIdx, setActiveIdx] = useState(0);
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();

  const kols = activeTab === "domestic" ? DOMESTIC_KOLS : GLOBAL_KOLS;
  const current = kols[activeIdx] || kols[0];
  const accentColor = activeTab === "domestic" ? "#C9A84C" : "#7B9ED9";
  const STATS = isEn ? STATS_EN : STATS_ZH;

  return (
    <section id="kol" className="bg-[#060C18] py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-[#C9A84C]/4 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#7B9ED9]/4 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative z-10">
        {/* Header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-14">
          <div className="section-label mb-4">03 — KOL Strategy</div>
          <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold leading-tight mb-4">
            {isEn ? <>Top Influencer <span className="text-[#C9A84C]">Strategic Partnerships</span></> : <>头部网红<span className="text-[#C9A84C]">战略合作</span></>}
          </h2>
          <p className="text-white/50 max-w-2xl text-base leading-relaxed">
            {isEn
              ? <>Mc&Mamoo Growth Engine deeply integrates <span className="text-[#C9A84C] font-semibold">500+ top-tier KOL strategic resources</span> globally — domestically covering Douyin, Kuaishou, Taobao, and Xiaohongshu; internationally covering TikTok, YouTube, and Instagram — building a complete growth chain from seeding to conversion.</>
              : <>猫眼增长引擎深度整合全球 <span className="text-[#C9A84C] font-semibold">500+头部KOL战略资源</span>，国内覆盖抖音、快手、淘宝、小红书，海外覆盖TikTok、YouTube、Instagram，为品牌构建从种草到转化的完整增长链路。</>
            }
          </p>
        </div>

        {/* Tab Switch */}
        <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal flex gap-2 mb-10">
          <button
            onClick={() => { setActiveTab("domestic"); setActiveIdx(0); }}
            className="px-6 py-2.5 text-sm font-medium tracking-wider transition-all duration-300 border"
            style={{ backgroundColor: activeTab === "domestic" ? "#C9A84C" : "transparent", color: activeTab === "domestic" ? "#050A14" : "rgba(255,255,255,0.5)", borderColor: activeTab === "domestic" ? "#C9A84C" : "rgba(255,255,255,0.15)" }}
          >
            {isEn ? "China Top Influencers" : "国内头部达人"}
          </button>
          <button
            onClick={() => { setActiveTab("global"); setActiveIdx(0); }}
            className="px-6 py-2.5 text-sm font-medium tracking-wider transition-all duration-300 border"
            style={{ backgroundColor: activeTab === "global" ? "#7B9ED9" : "transparent", color: activeTab === "global" ? "#050A14" : "rgba(255,255,255,0.5)", borderColor: activeTab === "global" ? "#7B9ED9" : "rgba(255,255,255,0.15)" }}
          >
            {isEn ? "Global TikTok Leaders" : "海外TikTok头部"}
          </button>
        </div>

        {/* Main Content */}
        <div ref={ref3 as React.RefObject<HTMLDivElement>} className="reveal grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: KOL List */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            {kols.map((kol, idx) => (
              <button
                key={kol.name}
                onClick={() => setActiveIdx(idx)}
                className="text-left p-4 border transition-all duration-300 group"
                style={{ borderColor: activeIdx === idx ? accentColor : "rgba(255,255,255,0.08)", backgroundColor: activeIdx === idx ? `${accentColor}12` : "transparent" }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 transition-all duration-300" style={{ borderColor: activeIdx === idx ? accentColor : "transparent" }}>
                    <img src={kol.image} alt={kol.name} className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-base">{kol.name}</span>
                      <span className="text-xs px-2 py-0.5 font-medium" style={{ backgroundColor: accentColor, color: "#050A14" }}>{isEn ? kol.tagEn : kol.tag}</span>
                    </div>
                    <div className="text-white/40 text-xs mt-0.5">{isEn ? kol.platformEn : kol.platform} · {isEn ? kol.followersEn : kol.followers} {isEn ? "followers" : "粉丝"}</div>
                  </div>
                  <span className="text-white/20 group-hover:text-white/50 transition-colors text-lg">›</span>
                </div>
              </button>
            ))}
          </div>

          {/* Right: KOL Detail */}
          <div className="lg:col-span-8">
            <div className="border overflow-hidden h-full" style={{ borderColor: `${accentColor}25`, backgroundColor: "rgba(255,255,255,0.02)" }}>
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Photo */}
                <div className="relative overflow-hidden" style={{ minHeight: "360px" }}>
                  <img key={current.name} src={current.image} alt={current.name} className="w-full h-full object-cover object-top transition-opacity duration-500" style={{ minHeight: "360px" }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060C18] via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#060C18]/50" />
                  <div className="absolute bottom-5 left-5">
                    <div className="text-xs tracking-widest uppercase mb-1.5 font-['DM_Mono']" style={{ color: accentColor }}>Strategic Partner</div>
                    <div className="text-white text-2xl font-['Noto_Serif_SC'] font-bold">{current.name}</div>
                    <div className="text-white/50 text-sm font-['DM_Mono']">{current.enName}</div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-8 flex flex-col justify-center">
                  <div className="mb-5">
                    <div className="text-xs tracking-widest uppercase mb-1.5 font-['DM_Mono']" style={{ color: accentColor }}>{isEn ? "Platform" : "合作平台"}</div>
                    <div className="text-white text-lg font-medium">{isEn ? current.platformEn : current.platform}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="p-3 border border-white/8">
                      <div className="text-xs text-white/35 mb-1">{isEn ? "Followers" : "粉丝规模"}</div>
                      <div className="font-['Cormorant_Garamond'] text-xl font-semibold" style={{ color: accentColor }}>{isEn ? current.followersEn : current.followers}</div>
                    </div>
                    <div className="p-3 border border-white/8">
                      <div className="text-xs text-white/35 mb-1">{isEn ? "Commerce Power" : "带货能力"}</div>
                      <div className="text-white text-sm font-medium leading-snug">{isEn ? current.gmvEn : current.gmvZh}</div>
                    </div>
                  </div>
                  <p className="text-white/55 text-sm leading-relaxed mb-6">{isEn ? current.descEn : current.descZh}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                    <span className="text-xs text-white/35 tracking-wider font-['DM_Mono']">{isEn ? "Strategic Partner · Deep Binding" : "战略合作伙伴 · 深度绑定"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/8">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-[#060C18] p-6 text-center">
              <div className="font-['Cormorant_Garamond'] text-3xl text-[#C9A84C] mb-1">{stat.num}</div>
              <div className="text-white/35 text-xs tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
