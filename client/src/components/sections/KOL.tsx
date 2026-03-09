/*
 * KOL Section — 头部网红战略合作
 * Design: 深色背景 + 平台分类 + 数据展示
 * Theme: 500+头部KOL战略合作资源
 */
import { useScrollReveal } from "@/hooks/useScrollReveal";

const platforms = [
  {
    name: "小红书",
    en: "RED / Xiaohongshu",
    count: "150+",
    desc: "美妆、时尚、生活方式头部博主，单篇笔记最高带货50万+",
    color: "#FF2442",
    kols: ["@美妆达人Lisa", "@时尚博主Mia", "@生活方式KOL", "@护肤专家"],
  },
  {
    name: "抖音",
    en: "TikTok / Douyin",
    count: "200+",
    desc: "垂类头部达人，覆盖美食、美妆、健康、生活等全品类",
    color: "#00F2EA",
    kols: ["@美食博主", "@健康达人", "@生活方式KOL", "@时尚达人"],
  },
  {
    name: "微博",
    en: "Weibo",
    count: "80+",
    desc: "千万粉丝级明星KOL，话题阅读量破亿，引爆社会讨论",
    color: "#E6162D",
    kols: ["@明星达人", "@时尚博主", "@生活方式KOL", "@美妆达人"],
  },
  {
    name: "B站",
    en: "Bilibili",
    count: "60+",
    desc: "Z世代核心圈层达人，深度内容种草，高转化率",
    color: "#00A1D6",
    kols: ["@UP主达人", "@测评博主", "@生活方式KOL", "@科技达人"],
  },
];

const globalPlatforms = [
  {
    name: "Instagram",
    count: "30+",
    desc: "欧美时尚、奢品、生活方式头部博主",
    region: "欧美",
  },
  {
    name: "TikTok Global",
    count: "40+",
    desc: "全球跨境带货达人，覆盖北美、东南亚、欧洲",
    region: "全球",
  },
  {
    name: "YouTube",
    count: "20+",
    desc: "深度测评、开箱、生活方式内容创作者",
    region: "北美",
  },
];

const caseHighlights = [
  {
    brand: "法国奢利 LA CELLE",
    kol: "头部香水博主 × 5位",
    result: "单日售出2万瓶",
    platform: "小红书 + 抖音",
  },
  {
    brand: "美国长盛天 NAD+",
    kol: "健康达人 × 10位",
    result: "单篇小红书带货50万",
    platform: "小红书 + Instagram",
  },
  {
    brand: "青岛啤酒夜猫子",
    kol: "生活方式KOL × 20位",
    result: "微博话题阅读量破1亿",
    platform: "微博 + 抖音",
  },
  {
    brand: "小仙炖鲜炖燕窝",
    kol: "明星 + 头部博主",
    result: "天猫品类第一，5年20亿",
    platform: "小红书 + 微博",
  },
];

export default function KOL() {
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();
  const ref4 = useScrollReveal();

  return (
    <section id="kol" className="bg-[#080808] py-24 lg:py-32">
      <div className="container">
        {/* Header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="section-label mb-4">03 — KOL Strategy</div>
          <div className="flex items-end gap-6">
            <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold leading-tight">
              头部网红战略合作
            </h2>
            <div className="hidden md:block h-px flex-1 bg-white/10 mb-3" />
          </div>
          <p className="text-white/50 mt-4 max-w-2xl text-base leading-relaxed">
            猫眼咨询深度整合全平台 <span className="text-[#C9A84C] font-semibold">500+头部KOL战略资源</span>，覆盖国内外主流内容平台，为品牌构建从种草到转化的完整增长链路。
          </p>
        </div>

        {/* Platform grid */}
        <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal grid md:grid-cols-2 lg:grid-cols-4 gap-0 border border-white/10 mb-12">
          {platforms.map((p, i) => (
            <div
              key={p.name}
              className={`p-8 ${i < 3 ? "border-r border-white/10" : ""} group hover:bg-white/3 transition-all duration-300`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-2 h-8"
                  style={{ backgroundColor: p.color }}
                />
                <div>
                  <div className="text-white font-bold text-lg font-['Noto_Serif_SC']">{p.name}</div>
                  <div className="text-white/30 text-xs font-['DM_Mono']">{p.en}</div>
                </div>
              </div>
              <div className="text-[#C9A84C] text-4xl font-['Cormorant_Garamond'] font-semibold mb-2">
                {p.count}
              </div>
              <div className="text-white/30 text-xs mb-4">头部合作达人</div>
              <p className="text-white/50 text-sm leading-relaxed mb-4">{p.desc}</p>
              <div className="space-y-1">
                {p.kols.map((k) => (
                  <div key={k} className="text-white/20 text-xs font-['DM_Mono']">{k}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Global platforms */}
        <div ref={ref3 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="text-white/40 text-xs tracking-widest uppercase mb-6 font-['DM_Mono']">
            全球平台覆盖 · Global Reach
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {globalPlatforms.map((p) => (
              <div
                key={p.name}
                className="p-6 border border-white/10 hover:border-[#C9A84C]/40 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-semibold group-hover:text-[#C9A84C] transition-colors">{p.name}</span>
                  <span className="text-xs px-2 py-0.5 border border-white/20 text-white/40 font-['DM_Mono']">{p.region}</span>
                </div>
                <div className="text-[#C9A84C] text-2xl font-['Cormorant_Garamond'] font-semibold mb-1">{p.count}</div>
                <p className="text-white/40 text-sm">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Case highlights */}
        <div ref={ref4 as React.RefObject<HTMLDivElement>} className="reveal">
          <div className="text-white/40 text-xs tracking-widest uppercase mb-6 font-['DM_Mono']">
            KOL合作标杆案例
          </div>
          <div className="grid md:grid-cols-2 gap-0 border border-white/10">
            {caseHighlights.map((c, i) => (
              <div
                key={c.brand}
                className={`p-6 ${i % 2 === 0 ? "border-r border-white/10" : ""} ${i < 2 ? "border-b border-white/10" : ""} group hover:bg-[#C9A84C]/5 transition-all duration-300`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-white font-semibold font-['Noto_Serif_SC'] mb-1">{c.brand}</div>
                    <div className="text-white/30 text-xs font-['DM_Mono']">{c.platform}</div>
                  </div>
                  <div className="text-white/20 text-xs">{c.kol}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#C9A84C] text-xs">▶</span>
                  <span className="text-[#C9A84C] font-semibold text-sm">{c.result}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
