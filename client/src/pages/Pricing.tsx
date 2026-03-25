/*
 * Pricing Page — Mc&Mamoo Growth Engine
 * 产品化定价体系：高中低价格带 + 锚定价逻辑
 * i18n: full bilingual support
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ─── 定价数据 ─────────────────────────────────────────────────────────────────

const pricingData_zh = {
  // ── 1. 品牌全案战略咨询 ──────────────────────────────────────────────────────
  brandStrategy: {
    id: "brand-strategy",
    badge: "旗舰服务",
    badgeColor: "#C9A84C",
    title: "品牌全案战略咨询",
    subtitle: "Full-Case Brand Strategy",
    desc: "从企业战略到爆品打造，构建第一品牌的完整方法论体系",
    anchor: "全年最划算 — 单月仅需 40 万",
    plans: [
      {
        name: "尝鲜体验",
        period: "单月",
        price: "98",
        unit: "万",
        originalPrice: null,
        perMonth: "98万/月",
        tag: null,
        highlight: false,
        features: ["品牌诊断报告（1次）", "战略方向建议书", "竞品分析报告", "1次高管战略会议", "基础定位策划"],
        cta: "预约体验",
      },
      {
        name: "半年深耕",
        period: "6个月",
        price: "380",
        unit: "万",
        originalPrice: "588万",
        perMonth: "63.3万/月",
        tag: "省208万",
        highlight: false,
        features: ["品牌全案战略规划", "爆品视觉锤设计", "猫眼符号系统", "每月战略复盘会议", "品类战略规划", "6次高管深度咨询"],
        cta: "预约咨询",
      },
      {
        name: "全年战略伙伴",
        period: "12个月",
        price: "480",
        unit: "万",
        originalPrice: "1176万",
        perMonth: "40万/月",
        tag: "最划算 · 省696万",
        highlight: true,
        features: ["企业战略方针制定", "第一品牌战略规划", "战略配称方案设计", "品类战略规划", "品牌定位策划", "爆品视觉锤设计", "猫眼符号系统", "每月战略复盘 + 季度高管峰会", "全年不限次战略咨询", "专属战略顾问团队"],
        cta: "立即签约",
      },
    ],
  },

  // ── 2. 战略咨询全案（顶级） ──────────────────────────────────────────────────
  strategicConsulting: {
    id: "strategic-consulting",
    badge: "顶级定制",
    badgeColor: "#E53E3E",
    title: "战略咨询全案",
    subtitle: "Strategic Consulting Suite",
    desc: "毛智库深度介入，为企业提供3年战略护航，打造行业第一品牌",
    anchor: "3年全案 — 等于每年仅需 1667 万",
    plans: [
      {
        name: "战略诊断",
        period: "单次",
        price: "200",
        unit: "万",
        originalPrice: null,
        perMonth: null,
        tag: null,
        highlight: false,
        features: ["企业战略全面诊断", "竞争格局深度分析", "增长机会识别报告", "战略路线图建议", "高管汇报（1次）"],
        cta: "预约诊断",
      },
      {
        name: "年度战略顾问",
        period: "12个月",
        price: "2000",
        unit: "万",
        originalPrice: "2400万",
        perMonth: "166.7万/月",
        tag: "省400万",
        highlight: false,
        features: ["全年战略规划与执行陪跑", "月度战略委员会会议", "重大决策实时咨询", "行业情报与趋势预判", "竞争对手动态监测", "高管团队战略培训"],
        cta: "预约咨询",
      },
      {
        name: "三年战略全案",
        period: "36个月",
        price: "5000",
        unit: "万",
        originalPrice: "7200万",
        perMonth: "138.9万/月",
        tag: "最划算 · 省2200万",
        highlight: true,
        features: ["3年战略护航全程陪跑", "企业战略委员会席位", "行业第一品牌打造方案", "全球战略布局规划", "资本运作战略建议", "高管团队战略能力建设", "毛智库专属研究支持", "国际机构对接资源", "不限次战略咨询", "年度战略峰会主办"],
        cta: "立即洽谈",
      },
    ],
  },

  // ── 3. 猫眼自动内容平台 ─────────────────────────────────────────────────────
  contentPlatform: {
    id: "content-platform",
    badge: "AI驱动",
    badgeColor: "#48BB78",
    title: "猫眼自动内容平台",
    subtitle: "Mc&Mamoo Content Engine",
    desc: "AI驱动的全域内容自动化生产系统，覆盖小红书/抖音/微博/视频号",
    anchor: "年付最省 — 相当于每月仅需 1.25 万",
    plans: [
      {
        name: "入门版",
        period: "月付",
        price: "2.98",
        unit: "万",
        originalPrice: null,
        perMonth: "2.98万/月",
        tag: null,
        highlight: false,
        features: ["每月50条AI内容生产", "2个平台账号管理", "基础数据分析报告", "内容日历规划", "人工审核服务"],
        cta: "免费试用14天",
      },
      {
        name: "专业版",
        period: "月付",
        price: "9.8",
        unit: "万",
        originalPrice: "11.8万",
        perMonth: "9.8万/月",
        tag: "最受欢迎",
        highlight: true,
        features: ["每月200条AI内容生产", "6个平台账号管理", "深度数据分析 + 竞品监测", "爆款预测模型", "KOL内容协同", "专属内容策略师", "A/B测试优化"],
        cta: "立即开通",
      },
      {
        name: "旗舰版（年付）",
        period: "12个月",
        price: "15",
        unit: "万",
        originalPrice: "117.6万",
        perMonth: "1.25万/月",
        tag: "年付最省 · 省102.6万",
        highlight: false,
        features: ["无限AI内容生产", "全平台账号管理（不限数量）", "实时爆款监测与预警", "自动发布与排期", "全域数据大屏", "专属AI训练（品牌声音定制）", "优先技术支持", "季度内容战略复盘"],
        cta: "预约演示",
      },
    ],
  },

  // ── 4. 品牌设计 ─────────────────────────────────────────────────────────────
  brandDesign: {
    id: "brand-design",
    badge: "视觉升级",
    badgeColor: "#9F7AEA",
    title: "品牌设计",
    subtitle: "Brand Design System",
    desc: "从品牌符号到全域视觉体系，打造令消费者一眼记住的品牌形象",
    anchor: "全案设计 — 等于每项仅需 3 万",
    plans: [
      {
        name: "品牌基础包",
        period: "一次性",
        price: "18",
        unit: "万",
        originalPrice: null,
        perMonth: null,
        tag: null,
        highlight: false,
        features: ["品牌Logo设计（3套方案）", "品牌色彩系统", "字体规范手册", "名片/信封/工牌设计", "基础VI手册"],
        cta: "立即咨询",
      },
      {
        name: "品牌全案设计",
        period: "一次性",
        price: "58",
        unit: "万",
        originalPrice: "80万",
        perMonth: null,
        tag: "省22万",
        highlight: true,
        features: ["品牌战略定位研究", "品牌Logo + 视觉锤设计", "猫眼符号系统", "完整VI规范手册", "包装设计（主SKU）", "电商视觉体系（主图/详情页）", "线下物料设计", "品牌故事与文案体系"],
        cta: "预约提案",
      },
      {
        name: "官网设计开发",
        period: "一次性",
        price: "38",
        unit: "万",
        originalPrice: "55万",
        perMonth: null,
        tag: "含开发交付",
        highlight: false,
        features: ["品牌官网策划与设计", "响应式开发（PC+移动端）", "18语言国际化", "SEO基础优化", "CMS内容管理系统", "3个月免费维护"],
        cta: "预约咨询",
      },
    ],
  },

  // ── 5. 爆品营销策划 ─────────────────────────────────────────────────────────
  productMarketing: {
    id: "product-marketing",
    badge: "增长核心",
    badgeColor: "#F6AD55",
    title: "爆品营销策划",
    subtitle: "Hero Product Marketing",
    desc: "从爆品定义到全域引爆，构建可复制的爆品打造方法论",
    anchor: "全年陪跑 — 等于每月仅需 25 万",
    plans: [
      {
        name: "单品爆品策划",
        period: "单次",
        price: "48",
        unit: "万",
        originalPrice: null,
        perMonth: null,
        tag: null,
        highlight: false,
        features: ["爆品核心价值提炼", "爆品蜂窝15模型诊断", "上市传播策略", "KOL种草矩阵规划", "首发活动策划方案"],
        cta: "立即咨询",
      },
      {
        name: "季度爆品计划",
        period: "3个月",
        price: "128",
        unit: "万",
        originalPrice: "144万",
        perMonth: "42.7万/月",
        tag: "省16万",
        highlight: false,
        features: ["季度爆品战略规划", "3款爆品全案策划", "KOL/KOC矩阵执行", "全域内容种草", "实时数据监测与优化", "月度复盘会议"],
        cta: "预约咨询",
      },
      {
        name: "全年爆品陪跑",
        period: "12个月",
        price: "300",
        unit: "万",
        originalPrice: "576万",
        perMonth: "25万/月",
        tag: "最划算 · 省276万",
        highlight: true,
        features: ["全年爆品战略规划", "不限数量爆品策划", "品牌360°领导力构建", "IP打造与情感共振", "全球KOL资源（2万+）", "跨境电商策略", "私域流量运营", "全年数据大屏监测", "专属爆品顾问团队"],
        cta: "立即签约",
      },
    ],
  },

  // ── 6. 毛智库 ────────────────────────────────────────────────────────────────
  thinkTank: {
    id: "think-tank",
    badge: "战略智慧",
    badgeColor: "#FC8181",
    title: "毛智库",
    subtitle: "Mao Think Tank",
    desc: "中国极少数具备全球战略影响力的民间智库，深度参与重大战略决策",
    anchor: "年度会员 — 等于每月仅需 8.3 万",
    plans: [
      {
        name: "战略研究报告",
        period: "单次",
        price: "30",
        unit: "万",
        originalPrice: null,
        perMonth: null,
        tag: null,
        highlight: false,
        features: ["行业深度研究报告", "竞争格局分析", "趋势预判与机会识别", "战略建议摘要", "高管汇报（1次）"],
        cta: "预约定制",
      },
      {
        name: "季度战略情报",
        period: "3个月",
        price: "80",
        unit: "万",
        originalPrice: "90万",
        perMonth: "26.7万/月",
        tag: "省10万",
        highlight: false,
        features: ["每月战略情报简报", "行业动态实时预警", "竞争对手深度监测", "季度战略研讨会", "专属研究员支持"],
        cta: "预约咨询",
      },
      {
        name: "年度战略会员",
        period: "12个月",
        price: "100",
        unit: "万",
        originalPrice: "360万",
        perMonth: "8.3万/月",
        tag: "最划算 · 省260万",
        highlight: true,
        features: ["全年战略情报订阅", "月度高管战略简报", "重大事件实时预警", "年度战略峰会参与资格", "毛智库研究成果优先获取", "国际机构对接机会", "专属战略研究员", "不限次战略咨询热线"],
        cta: "立即加入",
      },
    ],
  },
};

// ─── 英文版定价数据 ────────────────────────────────────────────────────────────
const pricingData_en = {
  brandStrategy: {
    id: "brand-strategy",
    badge: "Flagship",
    badgeColor: "#C9A84C",
    title: "Full-Case Brand Strategy",
    subtitle: "Full-Case Brand Strategy",
    desc: "From corporate strategy to hero product creation — the complete methodology for building the #1 brand",
    anchor: "Annual Plan — Only ¥400K/month",
    plans: [
      {
        name: "Starter",
        period: "1 Month",
        price: "¥980K",
        unit: "",
        originalPrice: null,
        perMonth: "¥980K/mo",
        tag: null,
        highlight: false,
        features: ["Brand Diagnostic Report (1x)", "Strategic Direction Proposal", "Competitor Analysis", "1 Executive Strategy Session", "Basic Positioning Plan"],
        cta: "Book a Session",
      },
      {
        name: "6-Month Deep Dive",
        period: "6 Months",
        price: "¥3.8M",
        unit: "",
        originalPrice: "¥5.88M",
        perMonth: "¥633K/mo",
        tag: "Save ¥2.08M",
        highlight: false,
        features: ["Full Brand Strategy Plan", "Hero Product Visual Hammer", "Mc&Mamoo Symbol System", "Monthly Strategy Reviews", "Category Strategy Planning", "6 Executive Deep-Dive Sessions"],
        cta: "Book Consultation",
      },
      {
        name: "Annual Strategic Partner",
        period: "12 Months",
        price: "¥4.8M",
        unit: "",
        originalPrice: "¥11.76M",
        perMonth: "¥400K/mo",
        tag: "Best Value · Save ¥6.96M",
        highlight: true,
        features: ["Corporate Strategy Formulation", "#1 Brand Strategic Planning", "Strategic Alignment Design", "Category Strategy Planning", "Brand Positioning", "Hero Product Visual Hammer", "Mc&Mamoo Symbol System", "Monthly Reviews + Quarterly Summits", "Unlimited Strategic Consulting", "Dedicated Strategy Advisory Team"],
        cta: "Sign Now",
      },
    ],
  },
  strategicConsulting: {
    id: "strategic-consulting",
    badge: "Elite Custom",
    badgeColor: "#E53E3E",
    title: "Strategic Consulting Suite",
    subtitle: "Strategic Consulting Suite",
    desc: "Mao Think Tank deep engagement — 3-year strategic partnership to build the industry's #1 brand",
    anchor: "3-Year Suite — Only ¥1.39M/month",
    plans: [
      {
        name: "Strategic Diagnostic",
        period: "One-Time",
        price: "¥2M",
        unit: "",
        originalPrice: null,
        perMonth: null,
        tag: null,
        highlight: false,
        features: ["Full Enterprise Strategy Audit", "Competitive Landscape Analysis", "Growth Opportunity Report", "Strategic Roadmap", "Executive Presentation (1x)"],
        cta: "Book Diagnostic",
      },
      {
        name: "Annual Strategic Advisor",
        period: "12 Months",
        price: "¥20M",
        unit: "",
        originalPrice: "¥24M",
        perMonth: "¥1.67M/mo",
        tag: "Save ¥4M",
        highlight: false,
        features: ["Full-Year Strategy Execution Support", "Monthly Strategy Committee", "Real-Time Decision Consulting", "Industry Intelligence & Foresight", "Competitor Monitoring", "Executive Strategy Training"],
        cta: "Book Consultation",
      },
      {
        name: "3-Year Full Suite",
        period: "36 Months",
        price: "¥50M",
        unit: "",
        originalPrice: "¥72M",
        perMonth: "¥1.39M/mo",
        tag: "Best Value · Save ¥22M",
        highlight: true,
        features: ["3-Year Strategy Execution Partnership", "Strategy Committee Seat", "#1 Brand Building Blueprint", "Global Strategy Planning", "Capital Strategy Advisory", "Executive Capability Building", "Mao Think Tank Research Access", "International Institution Connections", "Unlimited Strategy Consulting", "Annual Strategy Summit Hosting"],
        cta: "Negotiate Now",
      },
    ],
  },
  contentPlatform: {
    id: "content-platform",
    badge: "AI-Powered",
    badgeColor: "#48BB78",
    title: "Mc&Mamoo Content Engine",
    subtitle: "Mc&Mamoo Content Engine",
    desc: "AI-driven automated content production across Xiaohongshu, Douyin, Weibo, and Video Channels",
    anchor: "Annual Plan — Only ¥12.5K/month",
    plans: [
      {
        name: "Starter",
        period: "Monthly",
        price: "¥29.8K",
        unit: "",
        originalPrice: null,
        perMonth: "¥29.8K/mo",
        tag: null,
        highlight: false,
        features: ["50 AI-generated posts/month", "2 platform accounts", "Basic analytics report", "Content calendar planning", "Human review service"],
        cta: "14-Day Free Trial",
      },
      {
        name: "Professional",
        period: "Monthly",
        price: "¥98K",
        unit: "",
        originalPrice: "¥118K",
        perMonth: "¥98K/mo",
        tag: "Most Popular",
        highlight: true,
        features: ["200 AI-generated posts/month", "6 platform accounts", "Deep analytics + competitor monitoring", "Viral prediction model", "KOL content collaboration", "Dedicated content strategist", "A/B testing optimization"],
        cta: "Get Started",
      },
      {
        name: "Enterprise (Annual)",
        period: "12 Months",
        price: "¥150K",
        unit: "",
        originalPrice: "¥1.176M",
        perMonth: "¥12.5K/mo",
        tag: "Best Annual Value · Save ¥1.026M",
        highlight: false,
        features: ["Unlimited AI content production", "All platforms (unlimited accounts)", "Real-time viral monitoring", "Auto-publish & scheduling", "Full-domain data dashboard", "Custom AI voice training", "Priority technical support", "Quarterly content strategy review"],
        cta: "Book Demo",
      },
    ],
  },
  brandDesign: {
    id: "brand-design",
    badge: "Visual Upgrade",
    badgeColor: "#9F7AEA",
    title: "Brand Design System",
    subtitle: "Brand Design System",
    desc: "From brand symbols to full visual identity — create a brand image consumers remember instantly",
    anchor: "Full Design Suite — Only ¥30K per deliverable",
    plans: [
      {
        name: "Brand Essentials",
        period: "One-Time",
        price: "¥180K",
        unit: "",
        originalPrice: null,
        perMonth: null,
        tag: null,
        highlight: false,
        features: ["Brand Logo Design (3 concepts)", "Brand Color System", "Typography Manual", "Business Cards / Envelopes / Badges", "Basic VI Manual"],
        cta: "Inquire Now",
      },
      {
        name: "Full Brand Design",
        period: "One-Time",
        price: "¥580K",
        unit: "",
        originalPrice: "¥800K",
        perMonth: null,
        tag: "Save ¥220K",
        highlight: true,
        features: ["Brand Strategy Research", "Logo + Visual Hammer Design", "Mc&Mamoo Symbol System", "Complete VI Manual", "Packaging Design (Main SKU)", "E-commerce Visual System", "Offline Materials Design", "Brand Story & Copywriting System"],
        cta: "Book Proposal",
      },
      {
        name: "Website Design & Dev",
        period: "One-Time",
        price: "¥380K",
        unit: "",
        originalPrice: "¥550K",
        perMonth: null,
        tag: "Includes Development",
        highlight: false,
        features: ["Brand Website Strategy & Design", "Responsive Development (PC + Mobile)", "18-Language Internationalization", "Basic SEO Optimization", "CMS Content Management", "3-Month Free Maintenance"],
        cta: "Book Consultation",
      },
    ],
  },
  productMarketing: {
    id: "product-marketing",
    badge: "Growth Core",
    badgeColor: "#F6AD55",
    title: "Hero Product Marketing",
    subtitle: "Hero Product Marketing",
    desc: "From defining hero products to full-channel ignition — a replicable hero product methodology",
    anchor: "Annual Retainer — Only ¥250K/month",
    plans: [
      {
        name: "Single Product Launch",
        period: "One-Time",
        price: "¥480K",
        unit: "",
        originalPrice: null,
        perMonth: null,
        tag: null,
        highlight: false,
        features: ["Hero Product Core Value Extraction", "Honeycomb-15 Model Audit", "Launch Communication Strategy", "KOL Seeding Matrix Plan", "Launch Event Strategy"],
        cta: "Inquire Now",
      },
      {
        name: "Quarterly Hero Plan",
        period: "3 Months",
        price: "¥1.28M",
        unit: "",
        originalPrice: "¥1.44M",
        perMonth: "¥427K/mo",
        tag: "Save ¥160K",
        highlight: false,
        features: ["Quarterly Hero Product Strategy", "3 Full-Case Product Plans", "KOL/KOC Matrix Execution", "Full-Channel Content Seeding", "Real-Time Data Monitoring", "Monthly Review Sessions"],
        cta: "Book Consultation",
      },
      {
        name: "Annual Growth Partner",
        period: "12 Months",
        price: "¥3M",
        unit: "",
        originalPrice: "¥5.76M",
        perMonth: "¥250K/mo",
        tag: "Best Value · Save ¥2.76M",
        highlight: true,
        features: ["Full-Year Hero Product Strategy", "Unlimited Product Plans", "Brand 360° Leadership Building", "IP Building & Emotional Resonance", "Global KOL Network (20,000+)", "Cross-Border E-commerce Strategy", "Private Domain Operations", "Full-Year Data Dashboard", "Dedicated Hero Product Advisory Team"],
        cta: "Sign Now",
      },
    ],
  },
  thinkTank: {
    id: "think-tank",
    badge: "Strategic Intelligence",
    badgeColor: "#FC8181",
    title: "Mao Think Tank",
    subtitle: "Mao Think Tank",
    desc: "One of China's few private think tanks with global strategic influence — deeply involved in major strategic decisions",
    anchor: "Annual Membership — Only ¥83K/month",
    plans: [
      {
        name: "Research Report",
        period: "One-Time",
        price: "¥300K",
        unit: "",
        originalPrice: null,
        perMonth: null,
        tag: null,
        highlight: false,
        features: ["Industry Deep Research Report", "Competitive Landscape Analysis", "Trend Foresight & Opportunity ID", "Strategic Recommendations", "Executive Presentation (1x)"],
        cta: "Commission Report",
      },
      {
        name: "Quarterly Intelligence",
        period: "3 Months",
        price: "¥800K",
        unit: "",
        originalPrice: "¥900K",
        perMonth: "¥267K/mo",
        tag: "Save ¥100K",
        highlight: false,
        features: ["Monthly Strategic Intelligence Brief", "Real-Time Industry Alerts", "Competitor Deep Monitoring", "Quarterly Strategy Workshop", "Dedicated Research Analyst"],
        cta: "Book Consultation",
      },
      {
        name: "Annual Strategic Member",
        period: "12 Months",
        price: "¥1M",
        unit: "",
        originalPrice: "¥3.6M",
        perMonth: "¥83K/mo",
        tag: "Best Value · Save ¥2.6M",
        highlight: true,
        features: ["Full-Year Intelligence Subscription", "Monthly Executive Strategy Brief", "Major Event Real-Time Alerts", "Annual Strategy Summit Access", "Priority Research Access", "International Institution Connections", "Dedicated Research Analyst", "Unlimited Strategy Hotline"],
        cta: "Join Now",
      },
    ],
  },
};

// ─── 组件 ─────────────────────────────────────────────────────────────────────

function PricingCard({ plan, currency, isEn }: { plan: any; currency: string; isEn: boolean }) {
  return (
    <div
      className={`relative flex flex-col p-8 border transition-all duration-300 ${
        plan.highlight
          ? "border-[#C9A84C] bg-[#C9A84C]/5 shadow-[0_0_40px_rgba(201,168,76,0.15)]"
          : "border-white/10 bg-white/[0.02] hover:border-white/25"
      }`}
    >
      {/* 推荐标签 */}
      {plan.tag && (
        <div
          className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold tracking-widest uppercase whitespace-nowrap ${
            plan.highlight
              ? "bg-[#C9A84C] text-[#0A0A0A]"
              : "bg-white/10 text-white/70 border border-white/20"
          }`}
        >
          {plan.tag}
        </div>
      )}

      {/* 套餐名 & 周期 */}
      <div className="mb-6">
        <div className="text-white/40 text-xs tracking-widest uppercase font-['DM_Mono'] mb-1">{plan.period}</div>
        <h3 className={`text-xl font-bold font-['Noto_Serif_SC'] ${plan.highlight ? "text-[#C9A84C]" : "text-white"}`}>
          {plan.name}
        </h3>
      </div>

      {/* 价格 */}
      <div className="mb-2">
        <div className="flex items-baseline gap-1">
          {!isEn && <span className="text-white/60 text-lg">¥</span>}
          <span className={`text-4xl font-bold font-['DM_Mono'] ${plan.highlight ? "text-[#C9A84C]" : "text-white"}`}>
            {plan.price}
          </span>
          {!isEn && plan.unit && <span className="text-white/60 text-lg">{plan.unit}</span>}
        </div>
        {plan.originalPrice && (
          <div className="text-white/30 text-sm line-through mt-1 font-['DM_Mono']">
            {isEn ? "" : "¥"}{plan.originalPrice}
          </div>
        )}
        {plan.perMonth && (
          <div className="text-white/40 text-xs mt-1 font-['DM_Mono']">≈ {plan.perMonth}</div>
        )}
      </div>

      {/* 分割线 */}
      <div className={`h-px my-6 ${plan.highlight ? "bg-[#C9A84C]/30" : "bg-white/10"}`} />

      {/* 功能列表 */}
      <ul className="space-y-3 flex-1 mb-8">
        {plan.features.map((f: string) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
            <span className={`mt-0.5 text-xs flex-shrink-0 ${plan.highlight ? "text-[#C9A84C]" : "text-white/40"}`}>✦</span>
            {f}
          </li>
        ))}
      </ul>

      {/* CTA 按钮 */}
      <a
        href="#contact"
        onClick={(e) => { e.preventDefault(); document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" }); }}
        className={`block text-center py-3.5 px-6 text-sm font-semibold tracking-widest uppercase transition-all duration-300 ${
          plan.highlight
            ? "bg-[#C9A84C] text-[#0A0A0A] hover:bg-[#D4B866]"
            : "border border-white/20 text-white/70 hover:border-[#C9A84C]/60 hover:text-[#C9A84C]"
        }`}
      >
        {plan.cta}
      </a>
    </div>
  );
}

function ServiceSection({ data, isEn }: { data: any; isEn: boolean }) {
  return (
    <section id={data.id} className="py-20 border-b border-white/5">
      <div className="container">
        {/* 服务标题 */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="px-3 py-1 text-xs font-bold tracking-widest uppercase font-['DM_Mono']"
              style={{ background: data.badgeColor + "20", color: data.badgeColor, border: `1px solid ${data.badgeColor}40` }}
            >
              {data.badge}
            </span>
          </div>
          <h2 className="font-['Noto_Serif_SC'] text-white text-3xl md:text-4xl font-bold mb-3">
            {data.title}
          </h2>
          <p className="text-white/50 text-base max-w-2xl leading-relaxed mb-4">{data.desc}</p>
          {/* 锚定价提示 */}
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#C9A84C]/30 bg-[#C9A84C]/5">
            <span className="text-[#C9A84C] text-xs">▶</span>
            <span className="text-[#C9A84C] text-sm font-semibold">{data.anchor}</span>
          </div>
        </div>

        {/* 定价卡片 */}
        <div className="grid md:grid-cols-3 gap-6">
          {data.plans.map((plan: any) => (
            <PricingCard key={plan.name} plan={plan} currency="¥" isEn={isEn} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Pricing() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== "zh";
  const data = isEn ? pricingData_en : pricingData_zh;

  const services = [
    data.brandStrategy,
    data.strategicConsulting,
    data.contentPlatform,
    data.brandDesign,
    data.productMarketing,
    data.thinkTank,
  ];

  const tableOfContents = isEn
    ? [
        { id: "brand-strategy", label: "Full-Case Brand Strategy" },
        { id: "strategic-consulting", label: "Strategic Consulting Suite" },
        { id: "content-platform", label: "Content Engine" },
        { id: "brand-design", label: "Brand Design" },
        { id: "product-marketing", label: "Hero Product Marketing" },
        { id: "think-tank", label: "Mao Think Tank" },
      ]
    : [
        { id: "brand-strategy", label: "品牌全案战略咨询" },
        { id: "strategic-consulting", label: "战略咨询全案" },
        { id: "content-platform", label: "猫眼自动内容平台" },
        { id: "brand-design", label: "品牌设计" },
        { id: "product-marketing", label: "爆品营销策划" },
        { id: "think-tank", label: "毛智库" },
      ];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 border-b border-white/5">
        <div className="container">
          <div className="section-label mb-4">Services</div>
          <h1 className="font-['Noto_Serif_SC'] text-white text-5xl md:text-6xl font-bold mb-6 leading-tight">
            {isEn ? "Consulting Services" : "咨询服务"}
          </h1>
          <p className="text-white/50 text-lg max-w-2xl leading-relaxed mb-10">
            {isEn
              ? "Mc&Mamoo provides premium brand strategy consulting services. Choose the engagement model that best fits your growth stage."
              : "Mc&Mamoo 提供顶级品牌战略咨询服务。选择最适合您增长阶段的合作模式。"}
          </p>

          {/* 快速导航 */}
          <div className="flex flex-wrap gap-3">
            {tableOfContents.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-4 py-2 border border-white/15 text-white/50 text-sm hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition-all duration-200 font-['DM_Mono'] tracking-wide"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </section>



      {/* 所有服务定价 */}
      {services.map((service) => (
        <ServiceSection key={service.id} data={service} isEn={isEn} />
      ))}

      {/* 底部 CTA */}
      <section className="py-24">
        <div className="container text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-['Noto_Serif_SC'] text-white text-3xl md:text-4xl font-bold mb-4">
              {isEn ? "Not sure which plan fits you?" : "不确定哪个套餐适合你？"}
            </h2>
            <p className="text-white/50 mb-8 leading-relaxed">
              {isEn
                ? "Book a free 30-minute strategy consultation. We'll recommend the right plan based on your brand stage, goals, and budget."
                : "预约30分钟免费战略咨询，我们根据你的品牌阶段、目标和预算，推荐最适合的方案。"}
            </p>
            <a
              href="#contact"
              onClick={(e) => { e.preventDefault(); window.location.href = "/#contact"; }}
              className="inline-block px-10 py-4 bg-[#C9A84C] text-[#0A0A0A] font-bold tracking-widest uppercase text-sm hover:bg-[#D4B866] transition-colors duration-300"
            >
              {isEn ? "Book Free Consultation" : "预约免费咨询"}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
