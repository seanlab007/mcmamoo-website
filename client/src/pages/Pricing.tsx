/*
 * ============================================================
 * Pricing Page — 猫眼增长引擎服务体系与定价
 * ============================================================
 * 定价策略：
 * 1. 精简低价服务：回归"尝鲜"本质（如 9.8 元仅限单次 AI Logo 尝试）
 * 2. 设计服务：分为 爆品设计、官网设计、单项设计
 * 3. 战略服务：数字增长引擎、爆品打造(30万)、品牌全案(480万)、战略咨询(5000万)
 * 4. 业务逻辑：AI 组为高效平替，专家组为高端定制
 * ============================================================
 */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, ShieldCheck, Zap, Brain, Sparkles, Flame, Star, TrendingUp, Globe } from "lucide-react";

// ─── 定价数据定义 ────────────────────────────────────────────────────────────

const pricingData_zh = {
  // 1. 设计类服务：爆品、官网、单项
  designServices: {
    id: "design-services",
    badge: "设计类",
    badgeColor: "#E53E3E",
    title: "品牌视觉设计",
    subtitle: "Brand Design & Visual Identity",
    desc: "分为爆品设计、官网设计、单项设计，满足不同阶段的视觉需求。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "AI 辅助的极速设计方案，极致性价比",
        plans: [
          {
            name: "单项设计尝鲜",
            period: "单次",
            price: "9.8",
            unit: "元",
            highlight: false,
            features: ["单次 AI Logo 尝试", "3 套 AI 生成方案", "基础色彩建议"],
            cta: "立即体验",
            href: "#contact"
          },
          {
            name: "AI 爆品视觉包",
            period: "单次",
            price: "198",
            unit: "元",
            highlight: true,
            features: ["AI 爆品主图设计", "详情页 AI 优化", "卖点视觉锤提炼", "适配主流电商平台"],
            cta: "立即开通",
            href: "#contact"
          },
          {
            name: "AI 官网原型",
            period: "单次",
            price: "980",
            unit: "元",
            highlight: false,
            features: ["AI 官网视觉原型", "响应式布局建议", "交互逻辑策划", "1 周内交付"],
            cta: "预约咨询",
            href: "#contact"
          }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Brain className="text-[#C9A84C]" size={20} />,
        desc: "专家设计师主导的高端品牌塑造",
        plans: [
          {
            name: "专家单项设计",
            period: "单次",
            price: "3800",
            unit: "元",
            highlight: false,
            features: ["专家级 Logo 设计", "完整 VI 应用规范", "品牌视觉诊断", "2 次深度修改"],
            cta: "立即预约",
            href: "#contact"
          },
          {
            name: "专家爆品全案",
            period: "单产品",
            price: "3.8",
            unit: "万",
            highlight: true,
            features: ["爆品视觉战略定位", "全套电商视觉体系", "产品包装设计", "卖点视觉锤打造"],
            cta: "预约提案",
            href: "#contact"
          },
          {
            name: "专家官网全案",
            period: "单次",
            price: "12.8",
            unit: "万",
            highlight: false,
            features: ["品牌官网深度策划", "定制化视觉设计", "18 语言国际化开发", "SEO 战略布局"],
            cta: "预约咨询",
            href: "#contact"
          }
        ]
      }
    ]
  },

  // 2. 战略类服务：数字增长、爆品打造、品牌全案、战略咨询
  strategyServices: {
    id: "strategy-services",
    badge: "战略类",
    badgeColor: "#C9A84C",
    title: "战略大脑与咨询",
    subtitle: "Strategic Intelligence & Consulting",
    desc: "从数字增长引擎到 5000 万级顶层战略咨询，为企业提供全生命周期护航。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "MaoAI 驱动的智能战略模型，高效洞察",
        plans: [
          {
            name: "数字增长尝鲜",
            period: "单次",
            price: "98",
            unit: "元",
            highlight: false,
            features: ["MaoAI 增长诊断", "行业趋势简报", "竞品动态预警"],
            cta: "立即体验",
            href: "/mao-ai"
          },
          {
            name: "AI 爆品策划包",
            period: "单次",
            price: "1980",
            unit: "元",
            highlight: true,
            features: ["AI 爆品定义模型", "卖点 AI 自动提炼", "投放策略 AI 建议"],
            cta: "立即开通",
            href: "/mao-ai"
          },
          {
            name: "AI 战略月度订阅",
            period: "月付",
            price: "9800",
            unit: "元",
            highlight: false,
            features: ["全量 MaoAI 智库权限", "不限次战略咨询", "实时市场预警"],
            cta: "预约演示",
            href: "/mao-ai"
          }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Brain className="text-[#C9A84C]" size={20} />,
        desc: "代言先生及核心专家团队亲自操刀的顶层战略",
        plans: [
          {
            name: "爆品打造全案",
            period: "单产品",
            price: "30",
            unit: "万",
            highlight: false,
            features: ["爆品定义与策划", "全渠道增长路径", "错位竞争战略应用", "管理员终审报告"],
            cta: "立即预约",
            href: "#contact"
          },
          {
            name: "品牌年度全案",
            period: "年付",
            price: "480",
            unit: "万",
            highlight: true,
            features: ["全年品牌战略护航", "全案视觉与内容管理", "季度高管闭门研讨", "专属战略顾问团队"],
            cta: "预约提案",
            href: "#contact"
          },
          {
            name: "顶层战略咨询",
            period: "3年",
            price: "5000",
            unit: "万",
            highlight: false,
            features: ["3 年长期战略规划", "全球资源整合对接", "企业级增长引擎构建", "代言先生亲自指导"],
            cta: "申请加入",
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
      plan.highlight ? "bg-[#C9A84C]/5 border-[#C9A84C]/30 scale-105 z-10 ring-2 ring-[#C9A84C]/20" : "bg-white/[0.02] border-white/10 hover:border-white/20"
    }`}>
      {plan.highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#C9A84C] text-[#0A0A0A] text-[10px] font-bold tracking-widest uppercase px-3 py-1 flex items-center gap-1">
          <Flame size={12} /> {isEn ? "Best Value" : "最佳选择"}
        </div>
      )}
      <div className="mb-6">
        <h4 className="text-white text-xl font-bold mb-1">{plan.name}</h4>
        <span className="text-white/40 text-xs uppercase tracking-widest font-mono">{plan.period}</span>
      </div>
      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-bold ${plan.highlight ? "text-[#C9A84C]" : "text-white"}`}>{plan.price}</span>
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
            {isEn ? "Growth Engine Pricing" : "全生命周期定价体系"}
          </h1>
          <p className="text-white/50 text-lg max-w-3xl leading-relaxed">
            {isEn 
              ? "From ¥9.8 AI Logo to ¥50M Strategic Consulting. We provide full-cycle growth solutions for brands at all stages."
              : "从 ¥9.8 的 AI Logo 尝试，到 5000 万级的顶层战略咨询。我们为品牌提供从爆品打造到全球全案的全生命周期增长方案。"}
          </p>
        </div>
      </section>

      {/* 定价板块 */}
      <section className="py-24">
        <div className="container">
          {/* 1. 设计类 */}
          <div className="mb-32">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <h3 className="text-2xl font-bold text-white font-['Noto_Serif_SC'] px-6">{data.designServices.title}</h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <p className="text-white/40 text-center mb-12 max-w-2xl mx-auto">{data.designServices.desc}</p>
            
            {data.designServices.groups.map((group, groupIdx) => (
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

          {/* 2. 战略类 */}
          <div>
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <h3 className="text-2xl font-bold text-white font-['Noto_Serif_SC'] px-6">{data.strategyServices.title}</h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <p className="text-white/40 text-center mb-12 max-w-2xl mx-auto">{data.strategyServices.desc}</p>
            
            {data.strategyServices.groups.map((group, groupIdx) => (
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
            {isEn ? "Start Your Growth Journey" : "开启您的品牌增长引擎"}
          </h2>
          <p className="text-white/50 mb-12 max-w-2xl mx-auto">
            无论是追求极致效率的 AI 组，还是追求顶层深度的专家组，我们都为您准备了最合适的切入点。
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="#contact" className="px-12 py-5 bg-[#C9A84C] text-[#0A0A0A] font-bold tracking-widest uppercase hover:bg-[#D4B866] transition-all">
              立即预约咨询
            </a>
            <a href="/mao-ai" className="px-12 py-5 border border-white/20 text-white font-bold tracking-widest uppercase hover:bg-white/5 transition-all">
              体验 MaoAI 大脑
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
