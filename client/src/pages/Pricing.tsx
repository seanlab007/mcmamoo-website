/*
 * Pricing Page — Mc&Mamoo Growth Engine
 * 产品化定价体系：高中低价格带 + 锚定价逻辑
 * i18n: full bilingual support
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

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
    plans: [
      {
        name: "尝鲜体验",
        period: "单月",
        price: "98",
        unit: "万",
        originalPrice: null,
        perMonth: "98万/月",
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
    plans: [
      {
        name: "战略诊断",
        period: "单次",
        price: "200",
        unit: "万",
        originalPrice: null,
        perMonth: null,
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
    plans: [
      {
        name: "入门版",
        period: "月付",
        price: "2.98",
        unit: "万",
        originalPrice: null,
        perMonth: "2.98万/月",
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
    plans: [
      {
        name: "品牌基础包",
        period: "一次性",
        price: "18",
        unit: "万",
        originalPrice: null,
        perMonth: null,
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
    plans: [
      {
        name: "单品爆品策划",
        period: "单次",
        price: "48",
        unit: "万",
        originalPrice: null,
        perMonth: null,
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
    plans: [
      {
        name: "战略研究报告",
        period: "单次",
        price: "30",
        unit: "万",
        originalPrice: null,
        perMonth: null,
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
    plans: [
      {
        name: "Starter",
        period: "1 Month",
        price: "¥980K",
        unit: "",
        originalPrice: null,
        perMonth: "¥980K/mo",
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
    plans: [
      {
        name: "Strategic Diagnostic",
        period: "One-Time",
        price: "¥2M",
        unit: "",
        originalPrice: null,
        perMonth: null,
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
    plans: [
      {
        name: "Starter",
        period: "Monthly",
        price: "¥29.8K",
        unit: "",
        originalPrice: null,
        perMonth: "¥29.8K/mo",
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
    plans: [
      {
        name: "Brand Essentials",
        period: "One-Time",
        price: "¥180K",
        unit: "",
        originalPrice: null,
        perMonth: null,
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
    plans: [
      {
        name: "Single Product Launch",
        period: "One-Time",
        price: "¥480K",
        unit: "",
        originalPrice: null,
        perMonth: null,
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
    plans: [
      {
        name: "Research Report",
        period: "One-Time",
        price: "¥300K",
        unit: "",
        originalPrice: null,
        perMonth: null,
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
      {/* 套餐名 & 周期 */}
      <div className="mb-6">
        <div className="text-white/40 text-xs tracking-widest uppercase font-['DM_Mono'] mb-1">{plan.period}</div>
        <h3 className={`text-xl font-bold font-['Noto_Serif_SC'] ${plan.highlight ? "text-[#C9A84C]" : "text-white"}`}>
          {plan.name}
        </h3>
      </div>
      {/* 价格 */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1 flex-wrap">
          {isEn ? (
            <span className={`text-3xl font-bold font-['DM_Mono'] ${plan.highlight ? "text-[#C9A84C]" : "text-white"}`}>
              {plan.price}
            </span>
          ) : (
            <>
              <span className="text-white/40 text-sm font-['DM_Mono']">¥</span>
              <span className={`text-3xl font-bold font-['DM_Mono'] ${plan.highlight ? "text-[#C9A84C]" : "text-white"}`}>
                {plan.price}
              </span>
              <span className="text-white/40 text-sm">{plan.unit}</span>
            </>
          )}
        </div>
        {plan.originalPrice && (
          <div className="text-white/25 text-xs line-through mt-1 font-['DM_Mono']">
            {isEn ? plan.originalPrice : `原价 ${plan.originalPrice}`}
          </div>
        )}
      </div>
      {/* 功能列表 */}
      <ul className="space-y-2.5 mb-8 flex-1">
        {plan.features.map((f: string) => (
          <li key={f} className="flex items-start gap-2 text-sm text-white/55">
            <span className={`mt-0.5 text-xs shrink-0 ${plan.highlight ? "text-[#C9A84C]" : "text-white/30"}`}>▸</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      {/* CTA */}
      <a
        href="/#contact"
        onClick={(e) => { e.preventDefault(); window.location.href = "/#contact"; }}
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

// ─── 品牌客户 Logo 墙 ─────────────────────────────────────────────────────────────────────────────
const CLIENTS = [
  { name: "蟹太太",       nameEn: "Xie Taitai",   href: "/cases/xietaitai",   tag: "大闸蟹 · 10亿品牌",        tagEn: "Hairy Crab · ¥1B Brand" },
  { name: "小仙炖",       nameEn: "Xiaoxiandun",   href: "/cases/xiaoxiandun", tag: "鲜炖燕窝 · 品类第一",        tagEn: "Fresh Stewed Swiftlet · #1" },
  { name: "江中",         nameEn: "Jiangzhong",    href: "/cases/jiangzhong",  tag: "健康食品 · 品牌重塑",        tagEn: "Health Food · Rebrand" },
  { name: "小罐茶",       nameEn: "Xiaoguan Tea",  href: "/cases/xiaoguan",   tag: "高端茶礼 · 爆品打造",        tagEn: "Premium Tea · Hero Product" },
  { name: "胖哥俩",       nameEn: "Pangge",        href: "/cases/pangge",     tag: "餐饮连锁 · 全国扩张",        tagEn: "F&B Chain · National Expansion" },
  { name: "MasterCard",  nameEn: "MasterCard",    href: "#global-cases",     tag: "全球支付 · 逆势增长70亿",    tagEn: "Global Payment · $7B Growth" },
  { name: "Nestlé",      nameEn: "Nestlé",        href: "#global-cases",     tag: "全球快消 · 品牌战略",        tagEn: "Global FMCG · Brand Strategy" },
  { name: "Unilever",    nameEn: "Unilever",      href: "#global-cases",     tag: "跨国快消 · 多品牌管理",      tagEn: "Multinational FMCG · Portfolio" },
];

function ClientLogoWall({ isEn }: { isEn: boolean }) {
  return (
    <section className="py-16 border-b border-white/5 overflow-hidden">
      <div className="container">
        <div className="text-center mb-10">
          <div className="text-[#C9A84C] text-xs font-['DM_Mono'] tracking-[0.3em] uppercase mb-3">
            {isEn ? "Trusted By" : "已服务品牌"}
          </div>
          <h2 className="text-white/80 font-['Noto_Serif_SC'] text-2xl md:text-3xl">
            {isEn ? "Brands We've Grown" : "我们服务过的品牌"}
          </h2>
          <p className="text-white/30 text-sm mt-3 max-w-xl mx-auto">
            {isEn
              ? "From domestic champions to global giants — we've built category leaders across industries."
              : "从国内冠军到全球巨头——我们在各行业打造了品类领导者。"}
          </p>
        </div>

        {/* Logo Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
          {CLIENTS.map((client) => (
            <a
              key={client.name}
              href={client.href}
              className="group bg-[#0A0A0A] px-6 py-8 flex flex-col items-center justify-center gap-2 hover:bg-[#C9A84C]/5 transition-all duration-300 text-center"
            >
              <div
                className="text-white/60 group-hover:text-[#C9A84C] transition-colors duration-300 font-['Cormorant_Garamond'] font-semibold tracking-wide"
                style={{ fontSize: "1.35rem" }}
              >
                {isEn ? client.nameEn : client.name}
              </div>
              <div className="text-white/20 text-[10px] font-['DM_Mono'] tracking-widest group-hover:text-white/40 transition-colors duration-300">
                {isEn ? client.tagEn : client.tag}
              </div>
              <div className="w-6 h-px bg-[#C9A84C]/0 group-hover:bg-[#C9A84C]/60 transition-all duration-300 mt-1" />
            </a>
          ))}
        </div>

        {/* 社会证明数字 */}
        <div className="mt-10 grid grid-cols-3 gap-8 max-w-2xl mx-auto text-center">
          {[
            { num: "8+",   label: isEn ? "Billion-dollar brands" : "10亿级大单品" },
            { num: "500+", label: isEn ? "KOL partnerships" : "头部KOL合作" },
            { num: "20+",  label: isEn ? "Global brands" : "全球品牌服务" },
          ].map((s) => (
            <div key={s.num}>
              <div className="text-[#C9A84C] font-['Cormorant_Garamond'] text-4xl font-bold">{s.num}</div>
              <div className="text-white/30 text-xs font-['DM_Mono'] tracking-widest mt-1 uppercase">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 预约咨询表单组件 ──────────────────────────────────────────────────────────────────────────────
function ConsultingForm({ isEn }: { isEn: boolean }) {
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", service: "", budget: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const createInquiry = trpc.consulting.createInquiry.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (e) => setError(e.message),
  });

  const services_zh = ["品牌全案战略咨询", "战略咨询全案", "猫眼自动内容平台", "品牌设计", "爆品营销策划", "毛智库"];
  const services_en = ["Full-Case Brand Strategy", "Strategic Consulting Suite", "Mc&Mamoo Content Engine", "Brand Design", "Hero Product Marketing", "Mao Think Tank"];
  const budgets_zh = ["—— 选择预算范围 ——", "100万以内", "100-500万", "500-2000万", "2000万以上"];
  const budgets_en = ["-- Select Budget --", "Under \u00a51M", "\u00a51M - \u00a55M", "\u00a55M - \u00a520M", "Above \u00a520M"];

  const inputCls = "w-full bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C]/60 transition-colors";
  const labelCls = "block text-white/50 text-xs font-['DM_Mono'] tracking-widest uppercase mb-2";

  if (submitted) {
    return (
      <section className="py-24 border-t border-white/5">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-[#C9A84C] text-5xl mb-6">✓</div>
            <h2 className="font-['Noto_Serif_SC'] text-white text-3xl font-bold mb-4">
              {isEn ? "Inquiry Received" : "咊询已收到"}
            </h2>
            <p className="text-white/50 leading-relaxed mb-8">
              {isEn
                ? "Our strategy team will contact you within 24 hours to schedule your consultation."
                : "我们的战略团队将在 24 小时内与您联系，安排咊询时间。"}
            </p>
            {/* 微信直达按钮 */}
            <div className="border border-white/10 bg-white/2 p-6 max-w-sm mx-auto">
              <div className="text-white/40 text-xs font-['DM_Mono'] tracking-widest uppercase mb-3">
                {isEn ? "Or connect directly" : "或直接联系我们"}
              </div>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#07C160]/20 border border-[#07C160]/30 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#07C160">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-3.74 3.43c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm3.814 0c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-white text-sm font-medium">{isEn ? "WeChat" : "微信"}</div>
                  <div className="text-white/40 text-xs font-['DM_Mono']">mcmamoo_growth</div>
                </div>
              </div>
              <a
                href="weixin://dl/chat?mcmamoo_growth"
                onClick={(e) => {
                  // Fallback: copy to clipboard
                  e.preventDefault();
                  navigator.clipboard?.writeText("mcmamoo_growth").then(() => {
                    alert(isEn ? "WeChat ID copied: mcmamoo_growth" : "微信号已复制：mcmamoo_growth");
                  });
                }}
                className="block w-full py-2.5 bg-[#07C160]/20 border border-[#07C160]/40 text-[#07C160] text-sm font-['DM_Mono'] tracking-widest hover:bg-[#07C160]/30 transition-all duration-200 text-center"
              >
                {isEn ? "Add on WeChat" : "加微信沟通"}
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 border-t border-white/5">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <div className="section-label mb-4">{isEn ? "Get Started" : "预约咨询"}</div>
          <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold mb-4">
            {isEn ? "Book a Strategy Session" : "预约战略咨询"}
          </h2>
          <p className="text-white/40 mb-12 text-lg leading-relaxed">
            {isEn
              ? "Tell us about your brand and goals. Our senior strategists will respond within 24 hours."
              : "告诉我们您的品牌和目标，我们的高级战略顾问将在 24 小时内回复。"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 姓名 */}
            <div>
              <label className={labelCls}>{isEn ? "Name *" : "姓名 *"}</label>
              <input className={inputCls} placeholder={isEn ? "Your full name" : "您的姓名"}
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            {/* 公司 */}
            <div>
              <label className={labelCls}>{isEn ? "Company" : "公司名称"}</label>
              <input className={inputCls} placeholder={isEn ? "Your company" : "您的公司"}
                value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            {/* 邮箱 */}
            <div>
              <label className={labelCls}>{isEn ? "Email *" : "邮箱 *"}</label>
              <input className={inputCls} type="email" placeholder={isEn ? "your@email.com" : "您的邮箱"}
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            {/* 电话 */}
            <div>
              <label className={labelCls}>{isEn ? "Phone" : "联系电话"}</label>
              <input className={inputCls} placeholder={isEn ? "+86 / International" : "手机号码"}
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            {/* 意向服务 */}
            <div>
              <label className={labelCls}>{isEn ? "Service of Interest" : "意向服务"}</label>
              <select className={inputCls} value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))}>
                <option value="">{isEn ? "-- Select Service --" : "-- 选择服务 --"}</option>
                {(isEn ? services_en : services_zh).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {/* 预算 */}
            <div>
              <label className={labelCls}>{isEn ? "Annual Budget" : "年度预算"}</label>
              <select className={inputCls} value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}>
                {(isEn ? budgets_en : budgets_zh).map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            {/* 说明 */}
            <div className="md:col-span-2">
              <label className={labelCls}>{isEn ? "Tell Us More" : "补充说明"}</label>
              <textarea className={`${inputCls} resize-none`} rows={4}
                placeholder={isEn ? "Briefly describe your brand, challenges, and goals..." : "简述您的品牌、面临的挑战和目标…"}
                value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
            </div>
          </div>

          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

          <div className="mt-8 flex items-center gap-6">
            <button
              onClick={() => {
                if (!form.name || !form.email) { setError(isEn ? "Name and email are required." : "姓名和邮箱为必填项。"); return; }
                setError("");
                createInquiry.mutate(form);
              }}
              disabled={createInquiry.isPending}
              className="px-10 py-4 bg-[#C9A84C] text-[#0A0A0A] font-bold tracking-widest uppercase text-sm hover:bg-[#D4B866] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createInquiry.isPending
                ? (isEn ? "Submitting..." : "提交中…")
                : (isEn ? "Submit Inquiry" : "提交咨询")}
            </button>
            <p className="text-white/30 text-xs font-['DM_Mono']">
              {isEn ? "Response within 24 hours · Strictly confidential" : "24小时内回复 · 信息严格保密"}
            </p>
          </div>
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



      {/* 品牌客户 Logo 墙 */}
      <ClientLogoWall isEn={isEn} />

      {/* 所有服务定价 */}
      {services.map((service) => (
        <ServiceSection key={service.id} data={service} isEn={isEn} />
      ))}

      {/* 预约咨询表单 */}
      <ConsultingForm isEn={isEn} />
      {/* 底部小字 */}
      <section className="py-10">
        <div className="container text-center">
          <p className="text-white/20 text-xs font-['DM_Mono'] tracking-widest uppercase">
            {isEn ? "All engagements begin with a confidential strategy session" : "所有合作均始于一场保密战略会议"}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
