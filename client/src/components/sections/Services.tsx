/*
 * Services Section — Service System with Inline Pricing
 * Design: 暗夜金融极简主义 — 服务描述 → 价格锚定 → 立即预约
 * i18n: full bilingual support
 */
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "react-i18next";
import React from "react";

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

// ── 核心定价数据（内嵌于 Services 板块）──────────────────────────────────────
const pricingTiers_zh = [
  {
    id: "brand-strategy",
    title: "品牌全案战略咨询",
    subtitle: "Full-Case Brand Strategy",
    badge: "旗舰服务",
    badgeColor: "#C9A84C",
    plans: [
      {
        name: "尝鲜体验",
        period: "单月",
        price: "98",
        unit: "万",
        originalPrice: null,
        highlight: false,
        features: ["品牌诊断报告（1次）", "战略方向建议书", "竞品分析报告", "1次高管战略会议"],
        cta: "预约体验",
      },
      {
        name: "半年深耕",
        period: "6个月",
        price: "380",
        unit: "万",
        originalPrice: "588万",
        highlight: false,
        features: ["品牌全案战略规划", "爆品视觉锤设计", "猫眼符号系统", "每月战略复盘会议", "6次高管深度咨询"],
        cta: "预约咨询",
      },
      {
        name: "全年战略伙伴",
        period: "12个月",
        price: "480",
        unit: "万",
        originalPrice: "1176万",
        highlight: true,
        features: ["企业战略方针制定", "第一品牌战略规划", "品类战略规划", "爆品视觉锤设计", "猫眼符号系统", "全年不限次战略咨询", "专属战略顾问团队"],
        cta: "立即签约",
      },
    ],
  },
  {
    id: "product-marketing",
    title: "爆品营销策划",
    subtitle: "Hero Product Marketing",
    badge: "增长核心",
    badgeColor: "#F6AD55",
    plans: [
      {
        name: "单品爆品策划",
        period: "单次",
        price: "48",
        unit: "万",
        originalPrice: null,
        highlight: false,
        features: ["爆品核心价值提炼", "爆品蜂窝15模型诊断", "上市传播策略", "KOL种草矩阵规划"],
        cta: "立即咨询",
      },
      {
        name: "季度爆品计划",
        period: "3个月",
        price: "128",
        unit: "万",
        originalPrice: "144万",
        highlight: false,
        features: ["季度爆品战略规划", "3款爆品全案策划", "KOL/KOC矩阵执行", "全域内容种草", "月度复盘会议"],
        cta: "预约咨询",
      },
      {
        name: "全年爆品陪跑",
        period: "12个月",
        price: "300",
        unit: "万",
        originalPrice: "576万",
        highlight: true,
        features: ["全年爆品战略规划", "不限数量爆品策划", "品牌360°领导力构建", "全球KOL资源（2万+）", "跨境电商策略", "专属爆品顾问团队"],
        cta: "立即签约",
      },
    ],
  },
  {
    id: "content-platform",
    title: "猫眼自动内容平台",
    subtitle: "Mc&Mamoo Content Engine",
    badge: "AI驱动",
    badgeColor: "#48BB78",
    plans: [
      {
        name: "入门版",
        period: "月付",
        price: "2.98",
        unit: "万",
        originalPrice: null,
        highlight: false,
        features: ["每月50条AI内容生产", "2个平台账号管理", "基础数据分析报告", "内容日历规划"],
        cta: "免费试用14天",
      },
      {
        name: "专业版",
        period: "月付",
        price: "9.8",
        unit: "万",
        originalPrice: "11.8万",
        highlight: true,
        features: ["每月200条AI内容生产", "6个平台账号管理", "深度数据分析 + 竞品监测", "爆款预测模型", "专属内容策略师"],
        cta: "立即开通",
      },
      {
        name: "旗舰版（年付）",
        period: "12个月",
        price: "15",
        unit: "万/月",
        originalPrice: "9.8万/月",
        highlight: false,
        features: ["无限AI内容生产", "全平台账号管理", "实时爆款监测与预警", "自动发布与排期", "专属AI训练（品牌声音定制）"],
        cta: "预约演示",
      },
    ],
  },
];

const pricingTiers_en = [
  {
    id: "brand-strategy",
    title: "Full-Case Brand Strategy",
    subtitle: "Full-Case Brand Strategy",
    badge: "Flagship",
    badgeColor: "#C9A84C",
    plans: [
      {
        name: "Starter",
        period: "1 Month",
        price: "¥980K",
        unit: "",
        originalPrice: null,
        highlight: false,
        features: ["Brand Diagnostic Report (1x)", "Strategic Direction Proposal", "Competitor Analysis", "1 Executive Strategy Session"],
        cta: "Book Session",
      },
      {
        name: "6-Month Deep Dive",
        period: "6 Months",
        price: "¥3.8M",
        unit: "",
        originalPrice: "¥5.88M",
        highlight: false,
        features: ["Full Brand Strategy Plan", "Hero Product Visual Hammer", "Mc&Mamoo Symbol System", "Monthly Strategy Reviews", "6 Executive Deep-Dive Sessions"],
        cta: "Book Consultation",
      },
      {
        name: "Annual Strategic Partner",
        period: "12 Months",
        price: "¥4.8M",
        unit: "",
        originalPrice: "¥11.76M",
        highlight: true,
        features: ["Corporate Strategy Formulation", "#1 Brand Strategic Planning", "Category Strategy Planning", "Hero Product Visual Hammer", "Unlimited Strategic Consulting", "Dedicated Strategy Team"],
        cta: "Sign Now",
      },
    ],
  },
  {
    id: "product-marketing",
    title: "Hero Product Marketing",
    subtitle: "Hero Product Marketing",
    badge: "Growth Core",
    badgeColor: "#F6AD55",
    plans: [
      {
        name: "Single Product",
        period: "One-Time",
        price: "¥480K",
        unit: "",
        originalPrice: null,
        highlight: false,
        features: ["Hero Product Value Extraction", "Honeycomb-15 Model Diagnosis", "Launch Communication Strategy", "KOL Seeding Matrix"],
        cta: "Inquire Now",
      },
      {
        name: "Quarterly Plan",
        period: "3 Months",
        price: "¥1.28M",
        unit: "",
        originalPrice: "¥1.44M",
        highlight: false,
        features: ["Quarterly Hero Product Strategy", "3 Full-Case Product Plans", "KOL/KOC Matrix Execution", "Omni-Channel Content Seeding", "Monthly Reviews"],
        cta: "Book Consultation",
      },
      {
        name: "Annual Companion",
        period: "12 Months",
        price: "¥3M",
        unit: "",
        originalPrice: "¥5.76M",
        highlight: true,
        features: ["Annual Hero Product Strategy", "Unlimited Product Plans", "Brand 360° Leadership", "Global KOL Network (20,000+)", "Cross-Border E-commerce", "Dedicated Team"],
        cta: "Sign Now",
      },
    ],
  },
  {
    id: "content-platform",
    title: "Mc&Mamoo Content Engine",
    subtitle: "AI-Powered Content Platform",
    badge: "AI-Driven",
    badgeColor: "#48BB78",
    plans: [
      {
        name: "Starter",
        period: "Monthly",
        price: "¥29.8K",
        unit: "",
        originalPrice: null,
        highlight: false,
        features: ["50 AI Content/Month", "2 Platform Accounts", "Basic Analytics Report", "Content Calendar"],
        cta: "Free 14-Day Trial",
      },
      {
        name: "Professional",
        period: "Monthly",
        price: "¥98K",
        unit: "",
        originalPrice: "¥118K",
        highlight: true,
        features: ["200 AI Content/Month", "6 Platform Accounts", "Deep Analytics + Competitor Monitoring", "Viral Prediction Model", "Dedicated Content Strategist"],
        cta: "Activate Now",
      },
      {
        name: "Flagship (Annual)",
        period: "12 Months",
        price: "¥15K",
        unit: "/mo",
        originalPrice: "¥98K/mo",
        highlight: false,
        features: ["Unlimited AI Content", "All Platform Accounts", "Real-Time Viral Monitoring", "Auto-Publish & Scheduling", "Custom AI Brand Voice Training"],
        cta: "Book Demo",
      },
    ],
  },
];

export default function Services() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();
  const ref4 = useScrollReveal();

  const services = isEn ? services_en : services_zh;
  const models = isEn ? models_en : models_zh;
  const pricingTiers = isEn ? pricingTiers_en : pricingTiers_zh;

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

        {/* ── Inline Pricing Section ── */}
        <div ref={ref3 as React.RefObject<HTMLDivElement>} className="reveal mb-20">
          {/* Pricing header */}
          <div className="flex items-center gap-6 mb-12">
            <div className="w-8 h-px bg-[#C9A84C]" />
            <div>
              <div className="text-white/40 text-xs tracking-widest uppercase font-['DM_Mono'] mb-1">
                {isEn ? "Transparent Pricing" : "透明定价"}
              </div>
              <h3 className="font-['Noto_Serif_SC'] text-white text-2xl md:text-3xl font-bold">
                {isEn ? "Choose Your Growth Plan" : "选择适合你的增长方案"}
              </h3>
            </div>
            <div className="hidden md:block h-px flex-1 bg-white/10" />
            <a
              href="/pricing"
              className="hidden md:inline-flex items-center gap-2 text-[#C9A84C] text-xs tracking-widest uppercase font-['DM_Mono'] hover:text-[#D4B866] transition-colors group"
            >
              {isEn ? "Full Pricing →" : "完整定价 →"}
            </a>
          </div>

          {/* Pricing tiers — one service per row */}
          <div className="space-y-16">
            {pricingTiers.map((tier) => (
              <div key={tier.id}>
                {/* Tier header */}
                <div className="flex items-center gap-4 mb-6">
                  <span
                    className="text-xs font-bold tracking-widest uppercase px-3 py-1 font-['DM_Mono']"
                    style={{ background: `${tier.badgeColor}20`, color: tier.badgeColor, border: `1px solid ${tier.badgeColor}40` }}
                  >
                    {tier.badge}
                  </span>
                  <span className="font-['Noto_Serif_SC'] text-white text-lg font-semibold">{tier.title}</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Plan cards */}
                <div className="grid md:grid-cols-3 gap-0 border border-white/10">
                  {tier.plans.map((plan, idx) => (
                    <div
                      key={plan.name}
                      className={`relative p-7 flex flex-col transition-all duration-300 ${
                        plan.highlight
                          ? "bg-[#C9A84C]/8 border-[#C9A84C]/30"
                          : "hover:bg-white/[0.02]"
                      } ${idx < tier.plans.length - 1 ? "border-r border-white/10" : ""}`}
                    >
                      {/* Highlight badge */}
                      {plan.highlight && (
                        <div className="absolute -top-px left-0 right-0 h-0.5 bg-[#C9A84C]" />
                      )}
                      {plan.highlight && (
                        <div className="absolute top-3 right-3 bg-[#C9A84C] text-[#0A0A0A] text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 font-['DM_Mono']">
                          {isEn ? "BEST VALUE" : "最优选择"}
                        </div>
                      )}

                      {/* Plan name & period */}
                      <div className="mb-4">
                        <div className="font-['Noto_Serif_SC'] text-white text-base font-bold mb-1">{plan.name}</div>
                        <div className="text-white/30 text-xs tracking-widest uppercase font-['DM_Mono']">{plan.period}</div>
                      </div>

                      {/* Price */}
                      <div className="mb-5">
                        <div className="flex items-baseline gap-1">
                          <span className="stat-number text-3xl text-[#C9A84C]">{plan.price}</span>
                          {plan.unit && (
                            <span className="text-white/50 text-sm font-['DM_Mono']">{plan.unit}</span>
                          )}
                        </div>
                        {plan.originalPrice && (
                          <div className="text-white/25 text-xs line-through mt-1 font-['DM_Mono']">
                            {isEn ? "List: " : "原价："}{plan.originalPrice}
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="space-y-2 mb-6 flex-1">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-white/55 text-sm">
                            <span className="text-[#C9A84C]/60 text-xs mt-0.5 flex-shrink-0">✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <a
                        href="#contact"
                        className={`block text-center py-3 text-sm font-bold tracking-widest uppercase font-['DM_Mono'] transition-all duration-300 ${
                          plan.highlight
                            ? "bg-[#C9A84C] text-[#0A0A0A] hover:bg-[#D4B866]"
                            : "border border-white/20 text-white/70 hover:border-[#C9A84C]/50 hover:text-[#C9A84C]"
                        }`}
                      >
                        {plan.cta}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <div className="mt-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-8 border-t border-white/10">
            <p className="text-white/30 text-sm max-w-lg">
              {isEn
                ? "All plans include dedicated account management. Custom enterprise packages available for Fortune 500 brands."
                : "所有方案均含专属客户经理。世界500强品牌可洽谈定制企业专属方案。"}
            </p>
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A84C] text-[#0A0A0A] text-sm font-bold tracking-widest uppercase hover:bg-[#D4B866] transition-colors duration-300 font-['DM_Mono'] whitespace-nowrap"
            >
              <span className="text-[#0A0A0A]/60 text-xs">▶</span>
              {isEn ? 'Full Pricing Details' : '查看完整定价详情'}
            </a>
          </div>
        </div>

        {/* Growth models */}
        <div ref={ref4 as React.RefObject<HTMLDivElement>} className="reveal">
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
