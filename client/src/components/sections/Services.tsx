/*
 * Services Section — Service System
 * i18n: full bilingual support
 */
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "react-i18next";

const services_zh = [
  {
    num: "01",
    title: "新消费第一品牌全案战略咨询",
    en: "Full-Case Brand Strategy",
    items: ["企业战略方针制定", "第一品牌战略规划", "战略配称方案设计", "品类战略规划", "品牌定位策划", "爆品视觉锤设计", "猫眼符号系统"],
  },
  {
    num: "02",
    title: "爆品营销策划",
    en: "Blockbuster Product Marketing",
    items: ["爆品核心价值提炼", "品牌360°领导力构建", "猫眼爆品蜂窝15模型", "爆品上市传播策略", "IP打造与情感共振", "KOL/KOC营销矩阵"],
  },
  {
    num: "03",
    title: "天猫流量池构建",
    en: "Tmall Traffic Architecture",
    items: ["天猫视觉升级", "鲸片场爆款视频制作", "流量结构规划", "站内投放顶级电商顾问", "主播带货销售分成", "爆款内容矩阵"],
  },
  {
    num: "04",
    title: "整合营销带货",
    en: "Integrated Marketing & Commerce",
    items: ["站外种草（小红书/抖音/微博）", "全球网红资源对接（2万+）", "跨境电商（Amazon/TikTok）", "Lazada/Shopee 东南亚市场", "私域流量运营", "品效合一投放策略"],
  },
];

const services_en = [
  {
    num: "01",
    title: "Full-Case Brand Strategy for New Consumer #1 Brand",
    en: "Full-Case Brand Strategy",
    items: ["Corporate Strategy Formulation", "#1 Brand Strategic Planning", "Strategic Alignment Design", "Category Strategy Planning", "Brand Positioning", "Hero Product Visual Hammer Design", "Mc&Mamoo Symbol System"],
  },
  {
    num: "02",
    title: "Blockbuster Product Marketing",
    en: "Blockbuster Product Marketing",
    items: ["Hero Product Core Value Extraction", "Brand 360° Leadership Building", "Mc&Mamoo Honeycomb-15 Model", "Product Launch Communication Strategy", "IP Building & Emotional Resonance", "KOL/KOC Marketing Matrix"],
  },
  {
    num: "03",
    title: "Tmall Traffic Architecture",
    en: "Tmall Traffic Architecture",
    items: ["Tmall Visual Upgrade", "Whale Studio Viral Video Production", "Traffic Structure Planning", "In-Platform Top E-commerce Advisor", "Livestream Sales Revenue Share", "Viral Content Matrix"],
  },
  {
    num: "04",
    title: "Integrated Marketing & Commerce",
    en: "Integrated Marketing & Commerce",
    items: ["Off-Platform Seeding (Xiaohongshu/Douyin/Weibo)", "Global Influencer Network (20,000+)", "Cross-Border E-commerce (Amazon/TikTok)", "Lazada/Shopee Southeast Asia Markets", "Private Domain Operations", "Brand-Performance Unified Advertising"],
  },
];

const models_zh = [
  { title: "增长三角", formula: "持续增长 = 好的商业模式 × 正确的战略 × 优秀的组织体系" },
  { title: "猫眼大渗透公式", formula: "S = C（顾客数量）× D（渠道指数）× P（价格指数）× F（购买频次）" },
  { title: "爆品蜂窝15模型", formula: "情绪价值 + 内在价值 + 溢价空间 + 进化趋势 + 场景感知 = 爆品" },
];

const models_en = [
  { title: "Growth Triangle", formula: "Sustained Growth = Strong Business Model × Right Strategy × Excellent Organization" },
  { title: "Mc&Mamoo Penetration Formula", formula: "S = C (Customers) × D (Distribution Index) × P (Price Index) × F (Purchase Frequency)" },
  { title: "Honeycomb-15 Hero Product Model", formula: "Emotional Value + Intrinsic Value + Premium Space + Evolution Trend + Scene Perception = Hero Product" },
];

export default function Services() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();

  const services = isEn ? services_en : services_zh;
  const models = isEn ? models_en : models_zh;

  return (
    <section id="services" className="bg-[#0A0A0A] py-24 lg:py-32">
      <div className="container">
        {/* Header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="section-label mb-4">04 — Services</div>
          <div className="flex items-end gap-6">
            <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold">
              {isEn ? "Service System" : "服务体系"}
            </h2>
            <div className="hidden md:block h-px flex-1 bg-white/10 mb-3" />
          </div>
          <p className="text-white/50 mt-4 max-w-2xl text-base leading-relaxed">
            {isEn
              ? "Not research reports — we build explosive products. Not a traditional client-agency relationship — we are strategic business partners. We build a complete closed loop from brand to revenue."
              : "不是提供研究报告，而是打造爆品。不是传统甲乙关系，而是事业伙伴。我们以战略护航为核心，构建从品牌到销量的完整闭环。"}
          </p>
        </div>

        {/* Service cards */}
        <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal grid md:grid-cols-2 gap-0 mb-20 border border-white/10">
          {services.map((s, i) => (
            <div
              key={s.num}
              className={`p-8 group hover:bg-[#C9A84C]/5 transition-all duration-300 ${i % 2 === 0 ? "border-r border-white/10" : ""} ${i < 2 ? "border-b border-white/10" : ""}`}
            >
              <div className="flex items-start justify-between mb-6">
                <span className="stat-number text-5xl opacity-20 group-hover:opacity-40 transition-opacity">{s.num}</span>
                <div className="w-8 h-px bg-[#C9A84C]/40 mt-4 group-hover:w-16 transition-all duration-500" />
              </div>
              <h3 className="font-['Noto_Serif_SC'] text-white text-xl font-bold mb-1 group-hover:text-[#C9A84C] transition-colors">{s.title}</h3>
              <div className="text-white/30 text-xs tracking-widest uppercase mb-6 font-['DM_Mono']">{s.en}</div>
              <ul className="space-y-2">
                {s.items.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-white/60 text-sm">
                    <span className="text-[#C9A84C]/50 text-xs">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Pricing CTA */}
        <div className="mb-12 flex items-center gap-4">
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A84C] text-[#0A0A0A] text-sm font-bold tracking-widest uppercase hover:bg-[#D4B866] transition-colors duration-300"
          >
            <span className="text-[#0A0A0A]/60 text-xs">▶</span>
            {isEn ? 'View Full Pricing' : '查看完整定价'}
          </a>
          <span className="text-white/30 text-sm">
            {isEn ? 'Transparent pricing · Anchor logic · Annual plan always best value' : '透明定价 · 锚定价逻辑 · 全年套餐永远最划算'}
          </span>
        </div>

        {/* Growth models */}
        <div ref={ref3 as React.RefObject<HTMLDivElement>} className="reveal">
          <div className="text-white/40 text-xs tracking-widest uppercase mb-8 font-['DM_Mono']">
            {isEn ? "Mc&Mamoo Growth Models" : "猫眼增长模型"}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {models.map((m) => (
              <div key={m.title} className="p-6 border border-white/10 hover:border-[#C9A84C]/40 transition-all duration-300 group">
                <div className="w-6 h-px bg-[#C9A84C] mb-4" />
                <h4 className="text-white font-semibold mb-3 group-hover:text-[#C9A84C] transition-colors">{m.title}</h4>
                <p className="text-white/50 text-sm leading-relaxed font-['DM_Mono'] text-xs">{m.formula}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
