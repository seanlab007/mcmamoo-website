/*
 * ============================================================
 * Pricing Page — 猫眼增长引擎服务体系与定价
 * ============================================================
 * 定价策略：
 * 1. 所有业务分为"AI 组 (AI-Powered)"与"专家组 (Expert-Led)"
 * 2. AI 组价格极具竞争力，作为专家组的平替，降低获客门槛
 * 3. 专家组由代言先生及核心团队亲自操刀，定价高端
 * 4. 所有入门级都有较低的尝试价格
 * ============================================================
 */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, ShieldCheck, Zap, Brain, Sparkles } from "lucide-react";

// ─── 定价数据定义 ────────────────────────────────────────────────────────────

const pricingData_zh = {
  // 1. 战略大脑：MaoAI (AI 组) + 专家咨询 (专家组)
  strategicBrain: {
    id: "strategic-brain",
    badge: "核心大脑",
    badgeColor: "#C9A84C",
    title: "战略大脑",
    subtitle: "Strategic Intelligence & Expert Consulting",
    desc: "从市场洞察到战略决策，选择 AI 高效方案或专家深度陪跑。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "由 MaoAI 驱动的智能战略模型，高效且经济",
        plans: [
          {
            name: "AI 战略助手",
            period: "月付",
            price: "0.98",
            unit: "万",
            highlight: false,
            features: ["MaoAI 基础对话能力", "行业趋势实时监测", "竞品动态 AI 预警", "品牌声量基础分析"],
            cta: "立即开通",
            href: "/mao-ai"
          },
          {
            name: "AI 战略陪跑",
            period: "季度",
            price: "18",
            unit: "万",
            highlight: true,
            features: ["MaoAI 高级战略模型", "月度 AI 战略报告", "爆品策划 AI 预审", "竞品深度分析", "AI 自动生成周报"],
            cta: "立即开通",
            href: "/mao-ai"
          },
          {
            name: "AI 年度订阅",
            period: "年付",
            price: "48",
            unit: "万",
            highlight: false,
            features: ["全量 MaoAI 智库权限", "不限次战略咨询", "实时市场预警", "AI 自动生成月报", "品牌声音定制训练"],
            cta: "预约演示",
            href: "/mao-ai"
          }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Brain className="text-[#C9A84C]" size={20} />,
        desc: "由代言先生及核心专家团队亲自操刀，深度战略护航",
        plans: [
          {
            name: "战略诊断",
            period: "单次",
            price: "28",
            unit: "万",
            highlight: false,
            features: ["企业战略全面诊断", "竞争格局深度分析", "增长机会识别报告", "战略路线图建议", "高管汇报（1次）"],
            cta: "预约诊断",
            href: "#contact"
          },
          {
            name: "季度战略陪跑",
            period: "3个月",
            price: "88",
            unit: "万",
            highlight: true,
            features: ["专家团队月度战略会", "错位竞争理论深度应用", "爆品策划人工审核", "专属战略顾问支持", "管理员终审报告"],
            cta: "预约演示",
            href: "#contact"
          },
          {
            name: "年度战略会员",
            period: "年付",
            price: "188",
            unit: "万",
            highlight: false,
            features: ["全年战略护航陪跑", "毛智库深度研报订阅", "季度高管闭门研讨会", "重大战略决策人工复核", "国际机构资源对接"],
            cta: "申请加入",
            href: "#contact"
          }
        ]
      }
    ]
  },

  // 2. 执行引擎：内容平台 (AI 组) + 专家内容策划 (专家组)
  executionEngine: {
    id: "execution-engine",
    badge: "执行引擎",
    badgeColor: "#40d090",
    title: "内容自动化平台",
    subtitle: "Content Automation & AutoClip Engine",
    desc: "从 AI 自动化到专家策划，选择适合您的内容生产方案。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "AI 驱动的全自动内容生产与 AutoClip 视频剪辑",
        plans: [
          {
            name: "AI 内容尝鲜",
            period: "月付",
            price: "1.98",
            unit: "万",
            highlight: false,
            features: ["每月 30 条 AI 图文内容", "基础 AutoClip 视频剪辑", "1 个平台账号管理", "AI 自动合规性预审"],
            cta: "免费试用",
            href: "/platform"
          },
          {
            name: "AI 全能版",
            period: "月付",
            price: "5.98",
            unit: "万",
            highlight: true,
            features: ["每月 150 条 AI 内容生产", "高级 AutoClip 视频矩阵", "4 个平台账号管理", "爆款预测模型应用", "AI 自动合规预审"],
            cta: "立即升级",
            href: "/platform"
          },
          {
            name: "AI 旗舰版",
            period: "年付",
            price: "68",
            unit: "万",
            highlight: false,
            features: ["无限量 AI 内容生产", "全量 AutoClip 算力支持", "全平台账号统一调度", "品牌声音/视觉定制训练", "实时数据大屏监测"],
            cta: "预约演示",
            href: "/platform"
          }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Zap className="text-[#C9A84C]" size={20} />,
        desc: "由内容策略师主导的人工策划与审核，确保品质",
        plans: [
          {
            name: "专家内容尝鲜",
            period: "月付",
            price: "8.98",
            unit: "万",
            highlight: false,
            features: ["每月 50 条策划内容", "人工内容策略师指导", "2 个平台账号管理", "内容日历规划", "人工审核服务"],
            cta: "立即开通",
            href: "#contact"
          },
          {
            name: "专家全能版",
            period: "月付",
            price: "18.8",
            unit: "万",
            highlight: true,
            features: ["每月 200 条策划内容", "专属内容策略师", "6 个平台账号管理", "深度数据分析 + 竞品监测", "KOL 内容协同", "A/B 测试优化"],
            cta: "立即升级",
            href: "#contact"
          },
          {
            name: "专家旗舰版",
            period: "年付",
            price: "188",
            unit: "万",
            highlight: false,
            features: ["不限量策划内容", "全平台账号管理（不限数量）", "专属内容团队", "实时爆款监测与预警", "自动发布与排期", "季度内容战略复盘"],
            cta: "预约演示",
            href: "#contact"
          }
        ]
      }
    ]
  },

  // 3. 品牌全案：AI 设计 (AI 组) + 专家全案 (专家组)
  brandStrategy: {
    id: "brand-strategy",
    badge: "品牌全案",
    badgeColor: "#E53E3E",
    title: "品牌战略与设计",
    subtitle: "Brand Strategy & Design System",
    desc: "从 AI 辅助设计到专家全案规划，打造一流品牌形象。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "AI 辅助的品牌设计与策略工具，经济高效",
        plans: [
          {
            name: "AI 品牌尝鲜",
            period: "一次性",
            price: "2.98",
            unit: "万",
            highlight: false,
            features: ["AI 生成品牌 Logo（5 套方案）", "品牌色彩系统建议", "基础 VI 规范手册", "品牌故事文案初稿"],
            cta: "立即体验",
            href: "#contact"
          },
          {
            name: "AI 品牌设计包",
            period: "一次性",
            price: "9.8",
            unit: "万",
            highlight: true,
            features: ["AI 品牌战略定位研究", "Logo + 视觉锤设计", "完整 VI 规范手册", "品牌故事与文案体系", "基础包装设计建议"],
            cta: "立即开通",
            href: "#contact"
          },
          {
            name: "AI 官网设计",
            period: "一次性",
            price: "12.8",
            unit: "万",
            highlight: false,
            features: ["AI 官网策划与设计", "响应式开发（PC+移动端）", "SEO 基础优化", "CMS 内容管理系统", "1 个月免费维护"],
            cta: "预约咨询",
            href: "#contact"
          }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Brain className="text-[#C9A84C]" size={20} />,
        desc: "由代言先生及设计大师团队主导，顶级品牌形象塑造",
        plans: [
          {
            name: "专家品牌诊断",
            period: "单次",
            price: "12.8",
            unit: "万",
            highlight: false,
            features: ["品牌战略诊断报告", "竞品视觉分析", "品牌定位建议", "视觉升级方向指导"],
            cta: "预约诊断",
            href: "#contact"
          },
          {
            name: "专家品牌全案",
            period: "一次性",
            price: "58",
            unit: "万",
            highlight: true,
            features: ["品牌战略定位研究", "品牌 Logo + 视觉锤设计", "猫眼符号系统", "完整 VI 规范手册", "包装设计（主 SKU）", "电商视觉体系", "品牌故事与文案体系"],
            cta: "预约提案",
            href: "#contact"
          },
          {
            name: "专家官网设计开发",
            period: "一次性",
            price: "38",
            unit: "万",
            highlight: false,
            features: ["品牌官网策划与设计", "响应式开发（PC+移动端）", "18 语言国际化", "SEO 基础优化", "CMS 内容管理系统", "3 个月免费维护"],
            cta: "预约咨询",
            href: "#contact"
          }
        ]
      }
    ]
  },

  // 4. 爆品营销：AI 爆品 (AI 组) + 专家爆品 (专家组)
  productMarketing: {
    id: "product-marketing",
    badge: "爆品营销",
    badgeColor: "#F6AD55",
    title: "爆品营销策划",
    subtitle: "Hero Product Marketing",
    desc: "从 AI 爆品分析到专家全案执行，打造可复制的爆品。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "AI 驱动的爆品分析与策略生成",
        plans: [
          {
            name: "AI 爆品尝鲜",
            period: "单次",
            price: "4.98",
            unit: "万",
            highlight: false,
            features: ["AI 爆品价值提炼", "AI 蜂窝模型分析", "上市传播策略初稿", "KOL 矩阵建议"],
            cta: "立即体验",
            href: "#contact"
          },
          {
            name: "AI 爆品策划",
            period: "单次",
            price: "18.8",
            unit: "万",
            highlight: true,
            features: ["AI 爆品核心价值提炼", "AI 蜂窝 15 模型诊断", "上市传播全案策略", "KOL 种草矩阵规划", "首发活动策划方案"],
            cta: "立即开通",
            href: "#contact"
          },
          {
            name: "AI 季度爆品",
            period: "3个月",
            price: "48",
            unit: "万",
            highlight: false,
            features: ["季度 AI 爆品战略规划", "3 款爆品 AI 策划", "KOL/KOC 矩阵执行", "全域内容种草", "实时数据监测"],
            cta: "预约咨询",
            href: "#contact"
          }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Zap className="text-[#C9A84C]" size={20} />,
        desc: "由代言先生及爆品顾问团队主导，深度战略与执行",
        plans: [
          {
            name: "专家爆品尝鲜",
            period: "单次",
            price: "18.8",
            unit: "万",
            highlight: false,
            features: ["爆品核心价值提炼", "爆品蜂窝 15 模型诊断", "上市传播策略", "KOL 种草矩阵规划"],
            cta: "立即咨询",
            href: "#contact"
          },
          {
            name: "专家爆品全案",
            period: "单次",
            price: "48",
            unit: "万",
            highlight: true,
            features: ["爆品核心价值深度提炼", "爆品蜂窝 15 模型诊断", "上市传播全案策略", "KOL 种草矩阵规划", "首发活动执行方案", "专家团队支持"],
            cta: "预约提案",
            href: "#contact"
          },
          {
            name: "专家全年爆品陪跑",
            period: "12个月",
            price: "288",
            unit: "万",
            highlight: false,
            features: ["全年爆品战略规划", "不限数量爆品策划", "品牌 360° 领导力构建", "全球 KOL 资源（2 万+）", "跨境电商策略", "专属爆品顾问团队"],
            cta: "立即签约",
            href: "#contact"
          }
        ]
      }
    ]
  }
};

// ─── 页面组件 ─────────────────────────────────────────────────────────────────

function ServiceCard({ plan, isEn }: { plan: any; isEn: boolean }) {
  return (
    <div className={`relative p-8 border transition-all duration-500 flex flex-col ${
      plan.highlight ? "bg-[#C9A84C]/5 border-[#C9A84C]/30 scale-105 z-10" : "bg-white/[0.02] border-white/10 hover:border-white/20"
    }`}>
      {plan.highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#C9A84C] text-[#0A0A0A] text-[10px] font-bold tracking-widest uppercase px-3 py-1">
          {isEn ? "Recommended" : "推荐方案"}
        </div>
      )}
      <div className="mb-6">
        <h4 className="text-white text-xl font-bold mb-1">{plan.name}</h4>
        <span className="text-white/40 text-xs uppercase tracking-widest font-mono">{plan.period}</span>
      </div>
      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-[#C9A84C]">{plan.price}</span>
          <span className="text-white/60 text-sm">{plan.unit}</span>
        </div>
      </div>
      <ul className="space-y-4 mb-10 flex-1">
        {plan.features.map((f: string) => (
          <li key={f} className="flex items-start gap-3 text-white/70 text-sm leading-relaxed">
            <Check size={16} className="text-[#C9A84C] mt-0.5 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <a
        href={plan.href}
        className={`block text-center py-4 text-sm font-bold tracking-widest uppercase transition-all duration-300 ${
          plan.highlight ? "bg-[#C9A84C] text-[#0A0A0A] hover:bg-[#D4B866]" : "border border-white/20 text-white hover:bg-white/5"
        }`}
      >
        {plan.cta}
      </a>
    </div>
  );
}

export default function Pricing() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== "zh";
  const data = pricingData_zh;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 border-b border-white/5">
        <div className="container">
          <div className="inline-block px-3 py-1 border border-[#C9A84C]/30 text-[#C9A84C] text-[10px] font-bold tracking-widest uppercase mb-6">
            Service & Pricing
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight font-['Noto_Serif_SC']">
            {isEn ? "Growth Engine Pricing" : "猫眼增长引擎定价体系"}
          </h1>
          <p className="text-white/50 text-lg max-w-3xl leading-relaxed">
            {isEn 
              ? "Choose between AI-powered efficiency or expert-led excellence. Every service line offers both options at competitive prices."
              : "每项业务都分为 AI 组与专家组。AI 组价格极具竞争力，作为专家组的高效平替；专家组由代言先生及核心团队亲自操刀。"}
          </p>
        </div>
      </section>

      {/* 定价板块 */}
      <section className="py-24">
        <div className="container">
          {/* 1. 战略大脑 */}
          <div className="mb-32">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <h3 className="text-2xl font-bold text-white font-['Noto_Serif_SC'] px-6">{data.strategicBrain.title}</h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <p className="text-white/40 text-center mb-12 max-w-2xl mx-auto">{data.strategicBrain.desc}</p>
            
            {data.strategicBrain.groups.map((group, groupIdx) => (
              <div key={groupIdx} className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  {group.icon}
                  <h4 className="text-xl font-bold text-white">{group.name}</h4>
                  <span className="text-white/30 text-sm ml-auto">{group.desc}</span>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {group.plans.map(plan => <ServiceCard key={plan.name} plan={plan} isEn={isEn} />)}
                </div>
              </div>
            ))}
          </div>

          {/* 2. 执行引擎 */}
          <div className="mb-32">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <h3 className="text-2xl font-bold text-white font-['Noto_Serif_SC'] px-6">{data.executionEngine.title}</h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <p className="text-white/40 text-center mb-12 max-w-2xl mx-auto">{data.executionEngine.desc}</p>
            
            {data.executionEngine.groups.map((group, groupIdx) => (
              <div key={groupIdx} className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  {group.icon}
                  <h4 className="text-xl font-bold text-white">{group.name}</h4>
                  <span className="text-white/30 text-sm ml-auto">{group.desc}</span>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {group.plans.map(plan => <ServiceCard key={plan.name} plan={plan} isEn={isEn} />)}
                </div>
              </div>
            ))}
          </div>

          {/* 3. 品牌全案 */}
          <div className="mb-32">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <h3 className="text-2xl font-bold text-white font-['Noto_Serif_SC'] px-6">{data.brandStrategy.title}</h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <p className="text-white/40 text-center mb-12 max-w-2xl mx-auto">{data.brandStrategy.desc}</p>
            
            {data.brandStrategy.groups.map((group, groupIdx) => (
              <div key={groupIdx} className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  {group.icon}
                  <h4 className="text-xl font-bold text-white">{group.name}</h4>
                  <span className="text-white/30 text-sm ml-auto">{group.desc}</span>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {group.plans.map(plan => <ServiceCard key={plan.name} plan={plan} isEn={isEn} />)}
                </div>
              </div>
            ))}
          </div>

          {/* 4. 爆品营销 */}
          <div>
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <h3 className="text-2xl font-bold text-white font-['Noto_Serif_SC'] px-6">{data.productMarketing.title}</h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <p className="text-white/40 text-center mb-12 max-w-2xl mx-auto">{data.productMarketing.desc}</p>
            
            {data.productMarketing.groups.map((group, groupIdx) => (
              <div key={groupIdx} className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  {group.icon}
                  <h4 className="text-xl font-bold text-white">{group.name}</h4>
                  <span className="text-white/30 text-sm ml-auto">{group.desc}</span>
                </div>
                <div className="grid md:grid-cols-3 gap-8">
                  {group.plans.map(plan => <ServiceCard key={plan.name} plan={plan} isEn={isEn} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="py-24 border-t border-white/5 bg-[#C9A84C]/5">
        <div className="container text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 font-['Noto_Serif_SC']">
            {isEn ? "Ready to Start?" : "准备好开始了吗？"}
          </h2>
          <p className="text-white/50 mb-12 max-w-2xl mx-auto">
            所有合作均始于一场深度的战略沟通。我们的专家团队将为您提供初步的品牌诊断。
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="#contact" className="px-12 py-5 bg-[#C9A84C] text-[#0A0A0A] font-bold tracking-widest uppercase hover:bg-[#D4B866] transition-all">
              立即预约战略会议
            </a>
            <a href="/mao-ai" className="px-12 py-5 border border-white/20 text-white font-bold tracking-widest uppercase hover:bg-white/5 transition-all">
              先去体验 MaoAI
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
