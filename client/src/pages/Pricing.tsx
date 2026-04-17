/*
 * ============================================================
 * Pricing Page — 猫眼增长引擎服务体系与定价
 * ============================================================
 * 定价策略：
<<<<<<< HEAD
 * 1. 核心竞争力 = 极低的尝试价格（9.8/38/98/198）
 * 2. 按"设计 -> 内容 -> 战略"梯度分层
 * 3. AI 组与专家组均提供低价一次性尝试服务
 * 4. 降低获客门槛，快速转化为付费用户
=======
 * 1. 精简低价服务：回归"尝鲜"本质（如 9.8 元仅限单次 AI Logo 尝试）
 * 2. 设计服务：分为 爆品设计、官网设计、单项设计
 * 3. 战略服务：数字增长引擎、爆品打造(30万)、品牌全案(480万)、战略咨询(5000万)
 * 4. 业务逻辑：AI 组为高效平替，专家组为高端定制
>>>>>>> origin/fix/navbar-dropdown-interaction
 * ============================================================
 */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
<<<<<<< HEAD
import { Check, ShieldCheck, Zap, Brain, Sparkles, Flame } from "lucide-react";
=======
import { Check, ShieldCheck, Zap, Brain, Sparkles, Flame, Star, TrendingUp, Globe } from "lucide-react";
>>>>>>> origin/fix/navbar-dropdown-interaction

// ─── 定价数据定义 ────────────────────────────────────────────────────────────

const pricingData_zh = {
<<<<<<< HEAD
  // 1. 设计类服务
=======
  // 1. 设计类服务：爆品、官网、单项
>>>>>>> origin/fix/navbar-dropdown-interaction
  designServices: {
    id: "design-services",
    badge: "设计类",
    badgeColor: "#E53E3E",
    title: "品牌视觉设计",
    subtitle: "Brand Design & Visual Identity",
<<<<<<< HEAD
    desc: "从 AI 快速设计到专家全案规划，打造一流品牌形象。",
=======
    desc: "分为爆品设计、官网设计、单项设计，满足不同阶段的视觉需求。",
>>>>>>> origin/fix/navbar-dropdown-interaction
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
<<<<<<< HEAD
        desc: "AI 辅助的极速设计方案，经济高效",
        plans: [
          {
            name: "AI Logo 尝鲜",
=======
        desc: "AI 辅助的极速设计方案，极致性价比",
        plans: [
          {
            name: "单项设计尝鲜",
>>>>>>> origin/fix/navbar-dropdown-interaction
            period: "单次",
            price: "9.8",
            unit: "元",
            highlight: false,
<<<<<<< HEAD
            features: ["AI 生成 Logo 5 套方案", "品牌色彩系统建议", "基础 VI 规范", "永久使用权"],
=======
            features: ["单次 AI Logo 尝试", "3 套 AI 生成方案", "基础色彩建议"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "立即体验",
            href: "#contact"
          },
          {
<<<<<<< HEAD
            name: "AI 品牌设计包",
            period: "单次",
            price: "98",
            unit: "元",
            highlight: true,
            features: ["AI Logo + 视觉锤", "完整 VI 规范手册", "品牌故事文案", "基础包装建议"],
=======
            name: "AI 爆品视觉包",
            period: "单次",
            price: "198",
            unit: "元",
            highlight: true,
            features: ["AI 爆品主图设计", "详情页 AI 优化", "卖点视觉锤提炼", "适配主流电商平台"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "立即开通",
            href: "#contact"
          },
          {
<<<<<<< HEAD
            name: "AI 官网设计",
            period: "单次",
            price: "1980",
            unit: "元",
            highlight: false,
            features: ["AI 官网策划与设计", "响应式开发", "SEO 基础优化", "1 个月免费维护"],
=======
            name: "AI 官网原型",
            period: "单次",
            price: "980",
            unit: "元",
            highlight: false,
            features: ["AI 官网视觉原型", "响应式布局建议", "交互逻辑策划", "1 周内交付"],
>>>>>>> origin/fix/navbar-dropdown-interaction
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
<<<<<<< HEAD
            name: "专家品牌诊断",
            period: "单次",
            price: "980",
            unit: "元",
            highlight: false,
            features: ["品牌视觉诊断", "竞品分析", "定位建议", "升级方向指导"],
=======
            name: "专家单项设计",
            period: "单次",
            price: "3800",
            unit: "元",
            highlight: false,
            features: ["专家级 Logo 设计", "完整 VI 应用规范", "品牌视觉诊断", "2 次深度修改"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "立即预约",
            href: "#contact"
          },
          {
<<<<<<< HEAD
            name: "专家品牌全案",
            period: "单次",
            price: "9800",
            unit: "元",
            highlight: true,
            features: ["品牌战略定位", "Logo + 视觉锤设计", "完整 VI 规范", "包装设计", "电商视觉体系"],
=======
            name: "专家爆品全案",
            period: "单产品",
            price: "3.8",
            unit: "万",
            highlight: true,
            features: ["爆品视觉战略定位", "全套电商视觉体系", "产品包装设计", "卖点视觉锤打造"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "预约提案",
            href: "#contact"
          },
          {
<<<<<<< HEAD
            name: "专家官网设计开发",
            period: "单次",
            price: "38000",
            unit: "元",
            highlight: false,
            features: ["品牌官网策划与设计", "响应式开发", "18 语言国际化", "SEO 优化", "3 个月免费维护"],
=======
            name: "专家官网全案",
            period: "单次",
            price: "12.8",
            unit: "万",
            highlight: false,
            features: ["品牌官网深度策划", "定制化视觉设计", "18 语言国际化开发", "SEO 战略布局"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "预约咨询",
            href: "#contact"
          }
        ]
      }
    ]
  },

<<<<<<< HEAD
  // 2. 内容类服务
  contentServices: {
    id: "content-services",
    badge: "内容类",
    badgeColor: "#40d090",
    title: "内容自动化平台",
    subtitle: "Content Automation & Production",
    desc: "从 AI 自动化内容到专家策划执行，满足全域内容需求。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "AI 驱动的全自动内容生产，高效且经济",
        plans: [
          {
            name: "AI 内容尝鲜",
            period: "单次",
            price: "38",
            unit: "元",
            highlight: false,
            features: ["3 条 AI 图文内容", "1 条 AI 视频剪辑", "基础合规预审", "多平台格式"],
            cta: "立即体验",
            href: "/platform"
          },
          {
            name: "AI 内容包",
            period: "单次",
            price: "198",
            unit: "元",
            highlight: true,
            features: ["15 条 AI 图文内容", "5 条 AI 视频剪辑", "爆款预测应用", "全平台自动分发"],
            cta: "立即开通",
            href: "/platform"
          },
          {
            name: "AI 月度订阅",
            period: "月付",
            price: "1980",
            unit: "元",
            highlight: false,
            features: ["每月 150 条 AI 内容", "高级 AutoClip 支持", "4 个平台账号", "实时数据监测"],
            cta: "预约演示",
            href: "/platform"
          }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Zap className="text-[#C9A84C]" size={20} />,
        desc: "专家策划师主导的人工内容生产与审核",
        plans: [
          {
            name: "专家内容尝鲜",
            period: "单次",
            price: "1980",
            unit: "元",
            highlight: false,
            features: ["5 条策划内容", "人工策略师指导", "内容日历规划", "人工审核"],
            cta: "立即开通",
            href: "#contact"
          },
          {
            name: "专家内容包",
            period: "单次",
            price: "9800",
            unit: "元",
            highlight: true,
            features: ["30 条策划内容", "专属策略师", "深度数据分析", "KOL 内容协同", "A/B 测试优化"],
            cta: "立即升级",
            href: "#contact"
          },
          {
            name: "专家月度陪跑",
            period: "月付",
            price: "19800",
            unit: "元",
            highlight: false,
            features: ["不限量策划内容", "全平台账号管理", "专属内容团队", "实时爆款预警", "季度战略复盘"],
            cta: "预约演示",
            href: "#contact"
          }
        ]
      }
    ]
  },

  // 3. 战略类服务
=======
  // 2. 战略类服务：数字增长、爆品打造、品牌全案、战略咨询
>>>>>>> origin/fix/navbar-dropdown-interaction
  strategyServices: {
    id: "strategy-services",
    badge: "战略类",
    badgeColor: "#C9A84C",
    title: "战略大脑与咨询",
    subtitle: "Strategic Intelligence & Consulting",
<<<<<<< HEAD
    desc: "从 AI 战略助手到专家深度陪跑，打造增长引擎。",
=======
    desc: "从数字增长引擎到 5000 万级顶层战略咨询，为企业提供全生命周期护航。",
>>>>>>> origin/fix/navbar-dropdown-interaction
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
<<<<<<< HEAD
        desc: "MaoAI 驱动的智能战略模型，高效且经济",
        plans: [
          {
            name: "MaoAI 尝鲜",
=======
        desc: "MaoAI 驱动的智能战略模型，高效洞察",
        plans: [
          {
            name: "数字增长尝鲜",
>>>>>>> origin/fix/navbar-dropdown-interaction
            period: "单次",
            price: "98",
            unit: "元",
            highlight: false,
<<<<<<< HEAD
            features: ["MaoAI 基础对话", "行业趋势分析", "竞品动态预警", "品牌声量分析"],
=======
            features: ["MaoAI 增长诊断", "行业趋势简报", "竞品动态预警"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "立即体验",
            href: "/mao-ai"
          },
          {
<<<<<<< HEAD
            name: "MaoAI 战略包",
=======
            name: "AI 爆品策划包",
>>>>>>> origin/fix/navbar-dropdown-interaction
            period: "单次",
            price: "1980",
            unit: "元",
            highlight: true,
<<<<<<< HEAD
            features: ["MaoAI 高级战略模型", "爆品策划 AI 预审", "竞品深度分析", "AI 自动生成周报"],
=======
            features: ["AI 爆品定义模型", "卖点 AI 自动提炼", "投放策略 AI 建议"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "立即开通",
            href: "/mao-ai"
          },
          {
<<<<<<< HEAD
            name: "MaoAI 月度订阅",
=======
            name: "AI 战略月度订阅",
>>>>>>> origin/fix/navbar-dropdown-interaction
            period: "月付",
            price: "9800",
            unit: "元",
            highlight: false,
<<<<<<< HEAD
            features: ["全量 MaoAI 智库权限", "不限次战略咨询", "实时市场预警", "AI 自动生成月报"],
=======
            features: ["全量 MaoAI 智库权限", "不限次战略咨询", "实时市场预警"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "预约演示",
            href: "/mao-ai"
          }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Brain className="text-[#C9A84C]" size={20} />,
<<<<<<< HEAD
        desc: "代言先生及核心专家团队亲自操刀的战略护航",
        plans: [
          {
            name: "专家战略尝鲜",
            period: "单次",
            price: "3800",
            unit: "元",
            highlight: false,
            features: ["企业战略诊断", "竞争格局分析", "增长机会识别", "高管汇报 1 次"],
=======
        desc: "代言先生及核心专家团队亲自操刀的顶层战略",
        plans: [
          {
            name: "爆品打造全案",
            period: "单产品",
            price: "30",
            unit: "万",
            highlight: false,
            features: ["爆品定义与策划", "全渠道增长路径", "错位竞争战略应用", "管理员终审报告"],
>>>>>>> origin/fix/navbar-dropdown-interaction
            cta: "立即预约",
            href: "#contact"
          },
          {
<<<<<<< HEAD
            name: "专家战略全案",
            period: "单次",
            price: "38000",
            unit: "元",
            highlight: true,
            features: ["战略定位深度研究", "错位竞争理论应用", "爆品策划人工审核", "专属战略顾问支持", "管理员终审报告"],
            cta: "预约演示",
            href: "#contact"
          },
          {
            name: "专家年度陪跑",
            period: "年付",
            price: "188000",
            unit: "元",
            highlight: false,
            features: ["全年战略护航陪跑", "毛智库深度研报", "季度高管闭门研讨", "重大决策人工复核", "国际机构资源对接"],
=======
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
>>>>>>> origin/fix/navbar-dropdown-interaction
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
<<<<<<< HEAD
            {isEn ? "Growth Engine Pricing" : "极具竞争力的定价体系"}
          </h1>
          <p className="text-white/50 text-lg max-w-3xl leading-relaxed">
            {isEn 
              ? "Ultra-low entry prices (¥9.8/38/98/198) as our core competitive advantage. Every service offers both AI and Expert options."
              : "我们的核心竞争力：极低的尝试价格（¥9.8/38/98/198）。每项业务都分为 AI 组与专家组，快速获客，高效转化。"}
=======
            {isEn ? "Growth Engine Pricing" : "全生命周期定价体系"}
          </h1>
          <p className="text-white/50 text-lg max-w-3xl leading-relaxed">
            {isEn 
              ? "From ¥9.8 AI Logo to ¥50M Strategic Consulting. We provide full-cycle growth solutions for brands at all stages."
              : "从 ¥9.8 的 AI Logo 尝试，到 5000 万级的顶层战略咨询。我们为品牌提供从爆品打造到全球全案的全生命周期增长方案。"}
>>>>>>> origin/fix/navbar-dropdown-interaction
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

<<<<<<< HEAD
          {/* 2. 内容类 */}
          <div className="mb-32">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <h3 className="text-2xl font-bold text-white font-['Noto_Serif_SC'] px-6">{data.contentServices.title}</h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <p className="text-white/40 text-center mb-12 max-w-2xl mx-auto">{data.contentServices.desc}</p>
            
            {data.contentServices.groups.map((group, groupIdx) => (
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

          {/* 3. 战略类 */}
=======
          {/* 2. 战略类 */}
>>>>>>> origin/fix/navbar-dropdown-interaction
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
<<<<<<< HEAD
            {isEn ? "Start Your Growth Journey" : "从 ¥9.8 开始您的增长之旅"}
          </h2>
          <p className="text-white/50 mb-12 max-w-2xl mx-auto">
            极低的尝试价格是我们的竞争力。无论您选择 AI 高效方案还是专家深度陪跑，都能以最经济的方式快速验证效果。
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="#contact" className="px-12 py-5 bg-[#C9A84C] text-[#0A0A0A] font-bold tracking-widest uppercase hover:bg-[#D4B866] transition-all">
              立即开始尝试（¥9.8 起）
=======
            {isEn ? "Start Your Growth Journey" : "开启您的品牌增长引擎"}
          </h2>
          <p className="text-white/50 mb-12 max-w-2xl mx-auto">
            无论是追求极致效率的 AI 组，还是追求顶层深度的专家组，我们都为您准备了最合适的切入点。
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="#contact" className="px-12 py-5 bg-[#C9A84C] text-[#0A0A0A] font-bold tracking-widest uppercase hover:bg-[#D4B866] transition-all">
              立即预约咨询
>>>>>>> origin/fix/navbar-dropdown-interaction
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
