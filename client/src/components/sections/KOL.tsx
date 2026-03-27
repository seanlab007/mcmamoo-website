/*
 * KOL Section — 头部网红战略合作
 * Design: 深色背景 + 真实达人照片展示
 * Theme: 薇娅/李佳琦/辛巴/小杨哥/蛋蛋 + 国外TikTok头部
 */
import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const DOMESTIC_KOLS = [
  {
    name: "薇娅",
    enName: "Viya",
    platform: "淘宝直播",
    followers: "1.2亿",
    gmv: "单场带货破50亿",
    tag: "带货女王",
    desc: "中国直播电商开创者，与猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)深度合作品牌孵化，多个品牌实现从0到10亿的跨越式增长。",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/weiya_baf88932.jpg",
  },
  {
    name: "李佳琦",
    enName: "Austin Li",
    platform: "抖音 / 淘宝",
    followers: "7000万+",
    gmv: "年带货超300亿",
    tag: "口红一哥",
    desc: "美妆类目绝对头部，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)为其合作品牌提供品牌溢价策略，助力多品牌实现高端化转型。",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/lijiaqi_dbabdd8a.jpg",
  },
  {
    name: "辛巴",
    enName: "Xinba",
    platform: "快手",
    followers: "1.4亿",
    gmv: "单场带货近70亿",
    tag: "快手一哥",
    desc: "下沉市场绝对王者，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)协助其生态品牌构建品牌护城河，实现从流量到品牌的价值升级。",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/xinba_ede0de7d.webp",
  },
  {
    name: "小杨哥",
    enName: "Xiao Yang Ge",
    platform: "抖音",
    followers: "1.2亿",
    gmv: "年带货超200亿",
    tag: "抖音带货王",
    desc: "三只羊网络创始人，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)为其合作品牌提供全域增长策略，实现品效合一的高速增长。",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/xiaoyangg_994663bc.jpg",
  },
  {
    name: "蛋蛋",
    enName: "Dandan",
    platform: "抖音",
    followers: "3000万+",
    gmv: "单场带货破亿",
    tag: "三只羊核心主播",
    desc: "三只羊旗下头部主播，以亲和力和专业度著称，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)助力其合作品牌实现精准人群渗透。",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/xinba_live_b1916f8b.jpg",
  },
];

const GLOBAL_KOLS = [
  {
    name: "Charli D'Amelio",
    enName: "Charli D'Amelio",
    platform: "TikTok",
    followers: "1.58亿",
    gmv: "全球最具影响力达人",
    tag: "TikTok No.1",
    desc: "TikTok全球粉丝量第一，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)协助中国品牌借助其影响力实现北美市场品牌溢价突破。",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/charli_bc1435dc.jpg",
  },
  {
    name: "Khaby Lame",
    enName: "Khaby Lame",
    platform: "TikTok",
    followers: "1.55亿",
    gmv: "全球最高商业价值",
    tag: "TikTok全球第二",
    desc: "无语言障碍的全球化内容创作者，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)借助其跨文化影响力为品牌打通欧非市场。",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/tiktok_stars_9b180303.jpg",
  },
  {
    name: "MrBeast",
    enName: "MrBeast",
    platform: "YouTube / TikTok",
    followers: "2.6亿+",
    gmv: "全球最高商业回报",
    tag: "YouTube之王",
    desc: "全球最大YouTube频道主理人，猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)协助品牌通过其渠道实现全球范围内的爆发式增长。",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/tiktok_stars_9b180303.jpg",
  },
];

export default function KOL() {
  const [activeTab, setActiveTab] = useState<"domestic" | "global">("domestic");
  const [activeIdx, setActiveIdx] = useState(0);
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();

  const kols = activeTab === "domestic" ? DOMESTIC_KOLS : GLOBAL_KOLS;
  const current = kols[activeIdx] || kols[0];
  const accentColor = activeTab === "domestic" ? "#C9A84C" : "#7B9ED9";

  return (
    <section id="kol" className="bg-[#060C18] py-24 lg:py-32 relative overflow-hidden">
      {/* BG glow */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-[#C9A84C]/4 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#7B9ED9]/4 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative z-10">
        {/* Header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-14">
          <div className="section-label mb-4">03 — KOL Strategy</div>
          <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold leading-tight mb-4">
            头部网红<span className="text-[#C9A84C]">战略合作</span>
          </h2>
          <p className="text-white/50 max-w-2xl text-base leading-relaxed">
            猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)深度整合全球 <span className="text-[#C9A84C] font-semibold">500+头部KOL战略资源</span>，
            国内覆盖抖音、快手、淘宝、小红书，海外覆盖TikTok、YouTube、Instagram，
            为品牌构建从种草到转化的完整增长链路。
          </p>
        </div>

        {/* Tab Switch */}
        <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal flex gap-2 mb-10">
          <button
            onClick={() => { setActiveTab("domestic"); setActiveIdx(0); }}
            className="px-6 py-2.5 text-sm font-medium tracking-wider transition-all duration-300 border"
            style={{
              backgroundColor: activeTab === "domestic" ? "#C9A84C" : "transparent",
              color: activeTab === "domestic" ? "#050A14" : "rgba(255,255,255,0.5)",
              borderColor: activeTab === "domestic" ? "#C9A84C" : "rgba(255,255,255,0.15)",
            }}
          >
            国内头部达人
          </button>
          <button
            onClick={() => { setActiveTab("global"); setActiveIdx(0); }}
            className="px-6 py-2.5 text-sm font-medium tracking-wider transition-all duration-300 border"
            style={{
              backgroundColor: activeTab === "global" ? "#7B9ED9" : "transparent",
              color: activeTab === "global" ? "#050A14" : "rgba(255,255,255,0.5)",
              borderColor: activeTab === "global" ? "#7B9ED9" : "rgba(255,255,255,0.15)",
            }}
          >
            海外TikTok头部
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
                style={{
                  borderColor: activeIdx === idx ? accentColor : "rgba(255,255,255,0.08)",
                  backgroundColor: activeIdx === idx ? `${accentColor}12` : "transparent",
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 transition-all duration-300"
                    style={{ borderColor: activeIdx === idx ? accentColor : "transparent" }}
                  >
                    <img
                      src={kol.image}
                      alt={kol.name}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-base">{kol.name}</span>
                      <span
                        className="text-xs px-2 py-0.5 font-medium"
                        style={{ backgroundColor: accentColor, color: "#050A14" }}
                      >
                        {kol.tag}
                      </span>
                    </div>
                    <div className="text-white/40 text-xs mt-0.5">{kol.platform} · {kol.followers}粉丝</div>
                  </div>
                  <span className="text-white/20 group-hover:text-white/50 transition-colors text-lg">›</span>
                </div>
              </button>
            ))}
          </div>

          {/* Right: KOL Detail */}
          <div className="lg:col-span-8">
            <div
              className="border overflow-hidden h-full"
              style={{ borderColor: `${accentColor}25`, backgroundColor: "rgba(255,255,255,0.02)" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Photo */}
                <div className="relative overflow-hidden" style={{ minHeight: "360px" }}>
                  <img
                    key={current.name}
                    src={current.image}
                    alt={current.name}
                    className="w-full h-full object-cover object-top transition-opacity duration-500"
                    style={{ minHeight: "360px" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060C18] via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#060C18]/50" />
                  <div className="absolute bottom-5 left-5">
                    <div className="text-xs tracking-widest uppercase mb-1.5 font-['DM_Mono']" style={{ color: accentColor }}>
                      Strategic Partner
                    </div>
                    <div className="text-white text-2xl font-['Noto_Serif_SC'] font-bold">{current.name}</div>
                    <div className="text-white/50 text-sm font-['DM_Mono']">{current.enName}</div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-8 flex flex-col justify-center">
                  <div className="mb-5">
                    <div className="text-xs tracking-widest uppercase mb-1.5 font-['DM_Mono']" style={{ color: accentColor }}>
                      合作平台
                    </div>
                    <div className="text-white text-lg font-medium">{current.platform}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="p-3 border border-white/8">
                      <div className="text-xs text-white/35 mb-1">粉丝规模</div>
                      <div className="font-['Cormorant_Garamond'] text-xl font-semibold" style={{ color: accentColor }}>
                        {current.followers}
                      </div>
                    </div>
                    <div className="p-3 border border-white/8">
                      <div className="text-xs text-white/35 mb-1">带货能力</div>
                      <div className="text-white text-sm font-medium leading-snug">{current.gmv}</div>
                    </div>
                  </div>

                  <p className="text-white/55 text-sm leading-relaxed mb-6">{current.desc}</p>

                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
                    <span className="text-xs text-white/35 tracking-wider font-['DM_Mono']">战略合作伙伴 · 深度绑定</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/8">
          {[
            { num: "500+", label: "头部KOL战略合作" },
            { num: "20+", label: "覆盖内容平台" },
            { num: "50亿+", label: "年度合作GMV" },
            { num: "98%", label: "品牌客户续约率" },
          ].map((stat) => (
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
