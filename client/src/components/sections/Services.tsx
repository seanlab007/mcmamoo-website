/*
 * Services Section — Service System
 * Design: dark background, 4 service module cards, gold number labels
 * i18n: full bilingual support
 */
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "react-i18next";

const servicesZh = [
  {
    num: "01",
    title: "新消费第一品牌全案战略咨询",
    en: "Full-Case Brand Strategy",
    items: [
      "企业战略方针制定",
      "第一品牌战略规划",
      "战略配称方案设计",
      "品类战略规划",
      "品牌定位策划",
      "爆品视觉锤设计",
      "猫眼符号系统",
    ],
  },
  {
    num: "02",
    title: "爆品营销策划",
    en: "Blockbuster Product Marketing",
    items: [
      "爆品核心价值提炼",
      "品牌360°领导力构建",
      "猫眼爆品蜂窝15模型",
      "爆品上市传播策略",
      "IP打造与情感共振",
      "KOL/KOC营销矩阵",
    ],
  },
  {
    num: "03",
    title: "天猫流量池构建",
    en: "Tmall Traffic Architecture",
    items: [
      "天猫视觉升级",
      "鲸片场爆款视频制作",
      "流量结构规划",
      "站内投放顶级电商顾问",
      "主播带货销售分成",
      "爆款内容矩阵",
    ],
  },
  {
    num: "04",
    title: "整合营销带货",
    en: "Integrated Marketing & Commerce",
    items: [
      "站外种草（小红书/抖音/微博）",
      "全球网红资源对接（2万+）",
      "跨境电商（Amazon/TikTok）",
      "Lazada/Shopee 东南亚市场",
      "私域流量运营",
      "品效合一投放策略",
    ],
  },
];

const servicesEn = [
  {
    num: "01",
    title: "Full-Case Brand Strategy Consulting",
    en: "Full-Case Brand Strategy",
    items: [
      "Corporate Strategy Formulation",
      "No.1 Brand Strategic Planning",
      "Strategic Alignment Design",
      "Category Strategy Planning",
      "Brand Positioning & Concept",
      "Blockbuster Visual Hammer Design",
      "Mao Eye Symbol System",
    ],
  },
  {
    num: "02",
    title: "Blockbuster Product Marketing",
    en: "Blockbuster Product Marketing",
    items: [
      "Core Value Extraction for Hit Products",
      "Brand 360° Leadership Building",
      "Mao Eye Honeycomb 15-Model",
      "Product Launch Communication Strategy",
      "IP Creation & Emotional Resonance",
      "KOL/KOC Marketing Matrix",
    ],
  },
  {
    num: "03",
    title: "Tmall Traffic Architecture",
    en: "Tmall Traffic Architecture",
    items: [
      "Tmall Visual Upgrade",
      "Viral Video Production (Whale Studio)",
      "Traffic Structure Planning",
      "Top E-Commerce Advisor for In-Platform Ads",
      "Livestreamer Sales Commission",
      "Viral Content Matrix",
    ],
  },
  {
    num: "04",
    title: "Integrated Marketing & Commerce",
    en: "Integrated Marketing & Commerce",
    items: [
      "Off-Platform Seeding (Xiaohongshu/Douyin/Weibo)",
      "Global Influencer Network (20,000+)",
      "Cross-Border E-Commerce (Amazon/TikTok)",
      "Lazada/Shopee Southeast Asia Markets",
      "Private Domain Traffic Operations",
      "Performance-Brand Unified Ad Strategy",
    ],
  },
];

const modelsZh = [
  {
    title: "增长三角",
    formula: "持续增长 = 好的商业模式 × 正确的战略 × 优秀的组织体系",
  },
  {
    title: "猫眼大渗透公式",
    formula: "S = C（顾客数量）× D（渠道指数）× P（价格指数）× F（购买频次）",
  },
  {
    title: "爆品蜂窝15模型",
    formula: "情绪价值 + 内在价值 + 溢价空间 + 进化趋势 + 场景感知 = 爆品",
  },
];

const modelsEn = [
  {
    title: "Growth Triangle",
    formula: "Sustained Growth = Good Business Model × Correct Strategy × Excellent Organization",
  },
  {
    title: "Mao Eye Penetration Formula",
    formula: "S = C (Customers) × D (Channel Index) × P (Price Index) × F (Purchase Frequency)",
  },
  {
    title: "Honeycomb 15-Model for Hit Products",
    formula: "Emotional Value + Intrinsic Value + Premium Space + Evolution Trend + Scene Awareness = Hit Product",
  },
];

export default function Services() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();

  const services = isEn ? servicesEn : servicesZh;
  const models = isEn ? modelsEn : modelsZh;

  return (
    <section id="services" className="bg-[#0A0A0A] py-24 lg:py-32">
      <div className="container">
        {/* Header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="section-label mb-4">03 — Services</div>
          <div className="flex items-end gap-6">
            <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold">
              {isEn ? "Service System" : "服务体系"}
            </h2>
            <div className="hidden md:block h-px flex-1 bg-white/10 mb-3" />
          </div>
          <p className="text-white/50 mt-4 max-w-2xl text-base leading-relaxed">
            {isEn
              ? "Not research reports — we build blockbuster products. Not a traditional client-agency relationship — we are strategic business partners. We build a complete closed loop from brand to sales."
              : "不是提供研究报告，而是打造爆品。不是传统甲乙关系，而是事业伙伴。我们以战略护航为核心，构建从品牌到销量的完整闭环。"}
          </p>
        </div>

        {/* Service cards */}
        <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal grid md:grid-cols-2 gap-0 mb-20 border border-white/10">
          {services.map((s, i) => (
            <div
              key={s.num}
              className={`p-8 group hover:bg-[#C9A84C]/5 transition-all duration-300 ${
                i % 2 === 0 ? "border-r border-white/10" : ""
              } ${i < 2 ? "border-b border-white/10" : ""}`}
            >
              <div className="flex items-start justify-between mb-6">
                <span className="stat-number text-5xl opacity-20 group-hover:opacity-40 transition-opacity">
                  {s.num}
                </span>
                <div className="w-8 h-px bg-[#C9A84C]/40 mt-4 group-hover:w-16 transition-all duration-500" />
              </div>
              <h3 className="font-['Noto_Serif_SC'] text-white text-xl font-bold mb-1 group-hover:text-[#C9A84C] transition-colors">
                {s.title}
              </h3>
              <div className="text-white/30 text-xs tracking-widest uppercase mb-6 font-['DM_Mono']">
                {s.en}
              </div>
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

        {/* Growth models */}
        <div ref={ref3 as React.RefObject<HTMLDivElement>} className="reveal">
          <div className="text-white/40 text-xs tracking-widest uppercase mb-8 font-['DM_Mono']">
            {isEn ? "Mc&Mamoo Growth Models" : "猫眼增长模型"}
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {models.map((m) => (
              <div
                key={m.title}
                className="p-6 border border-white/10 hover:border-[#C9A84C]/40 transition-all duration-300 group"
              >
                <div className="w-6 h-px bg-[#C9A84C] mb-4" />
                <h4 className="text-white font-semibold mb-3 group-hover:text-[#C9A84C] transition-colors">
                  {m.title}
                </h4>
                <p className="text-white/50 text-sm leading-relaxed font-['DM_Mono'] text-xs">
                  {m.formula}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
