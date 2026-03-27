/*
 * ============================================================
 * Pricing Page — 猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎全线业务定价体系
 * ============================================================
 * 定价架构：6 大业务板块 × 6 级定价梯度（3 AI + 3 专家）
 * 1. 设计服务（单项设计、官网设计、爆品设计）
 * 2. 官网建设（展示官网、商城官网、定制官网）
 * 3. 爆品打造（爆品策划、爆品执行、爆品全案）
 * 4. 品牌全案（品牌诊断、品牌升级、品牌护航）
 * 5. 战略咨询（数字增长、战略定位、顶级合伙）
 * 6. 毛智库（军事战略、兵棋推演、国防思路）
 * ============================================================
 * ⚠️  PROTECTED FILE — 由 Manus 统一维护
 */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, Zap, Brain, Sparkles } from "lucide-react";

// ─── 定价数据定义 ────────────────────────────────────────────────────────────

const pricingData_zh = {
  // 1. 设计服务：6 级定价
  designServices: {
    id: "design-services",
    badge: "设计类",
    badgeColor: "#E53E3E",
    title: "品牌视觉设计",
    subtitle: "单项设计 / 官网设计 / 爆品设计",
    desc: "从极致性价比的 AI 设计到顶级专家团队的高端定制，满足全阶段视觉需求。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "AI 驱动的高效设计方案",
        plans: [
          { name: "单项设计尝鲜", period: "单次", price: "9.8", unit: "元", features: ["单次 AI Logo 尝试", "3 套方案", "基础反馈"] },
          { name: "AI 官网设计", period: "单次", price: "198", unit: "元", features: ["AI 生成官网模板", "5 页面设计", "响应式优化"] },
          { name: "AI 爆品视觉包", period: "单次", price: "1980", unit: "元", highlight: true, features: ["完整爆品视觉系统", "包装 + 海报 + 主图", "AI 迭代优化"] }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Brain className="text-[#C9A84C]" size={20} />,
        desc: "顶级设计师团队操刀",
        plans: [
          { name: "专家设计诊断", period: "单次", price: "3800", unit: "元", features: ["品牌视觉审计", "竞品分析", "改进方案"] },
          { name: "专家官网设计", period: "单次", price: "28000", unit: "元", features: ["创意官网设计", "交互原型", "前端开发指导"] },
          { name: "专家爆品全案", period: "单次", price: "98000", unit: "元", highlight: true, features: ["爆品视觉系统设计", "全域物料设计", "品牌指导手册"] }
        ]
      }
    ]
  },

  // 2. 官网建设：6 级定价
  websiteServices: {
    id: "website-services",
    badge: "官网类",
    badgeColor: "#3B82F6",
    title: "官网建设与优化",
    subtitle: "展示官网 / 商城官网 / 定制官网",
    desc: "从快速上线的 AI 官网到高端定制的品牌官网，助力品牌全域转化。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "AI 快速建站方案",
        plans: [
          { name: "AI 官网尝鲜", period: "单次", price: "38", unit: "元", features: ["AI 生成官网框架", "3 套模板选择", "基础 SEO 优化"] },
          { name: "AI 商城官网", period: "单次", price: "1980", unit: "元", features: ["AI 电商模板", "产品管理系统", "支付集成"] },
          { name: "AI 定制官网", period: "单次", price: "9800", unit: "元", highlight: true, features: ["AI 定制化设计", "完整功能开发", "3 个月运维"] }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Brain className="text-[#C9A84C]" size={20} />,
        desc: "顶级官网设计与开发",
        plans: [
          { name: "专家官网诊断", period: "单次", price: "8800", unit: "元", features: ["官网体验审计", "转化漏斗分析", "优化建议"] },
          { name: "专家商城官网", period: "单次", price: "68000", unit: "元", features: ["高端商城设计", "完整电商功能", "营销工具集成"] },
          { name: "专家定制官网", period: "单次", price: "280000", unit: "元", highlight: true, features: ["顶级品牌官网", "全定制开发", "年度运维支持"] }
        ]
      }
    ]
  },

  // 3. 爆品打造：6 级定价
  explosiveProductServices: {
    id: "explosive-product-services",
    badge: "爆品类",
    badgeColor: "#F59E0B",
    title: "爆品打造与营销",
    subtitle: "爆品策划 / 爆品执行 / 爆品全案",
    desc: "从 AI 驱动的爆品策划到顶级专家的全案护航，打造真正的爆品。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "AI 爆品方案",
        plans: [
          { name: "AI 爆品策划", period: "单次", price: "98", unit: "元", features: ["AI 爆品分析", "市场定位建议", "竞品对标"] },
          { name: "AI 爆品执行", period: "单次", price: "4980", unit: "元", features: ["AI 内容生成", "投放文案", "数据监测"] },
          { name: "AI 爆品全案", period: "单次", price: "29800", unit: "元", highlight: true, features: ["完整爆品策划", "内容 + 投放", "30 天优化"] }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Brain className="text-[#C9A84C]" size={20} />,
        desc: "顶级爆品打造",
        plans: [
          { name: "专家爆品策划", period: "单次", price: "18000", unit: "元", features: ["深度市场研究", "爆品定位", "上市方案"] },
          { name: "专家爆品执行", period: "单次", price: "98000", unit: "元", features: ["专家团队执行", "全域投放", "60 天运营"] },
          { name: "专家爆品全案", period: "单次", price: "300000", unit: "元", highlight: true, features: ["从 0 到 1 爆品打造", "完整运营护航", "品牌建设"] }
        ]
      }
    ]
  },

  // 4. 品牌全案：6 级定价
  brandFullCaseServices: {
    id: "brand-full-case-services",
    badge: "品牌类",
    badgeColor: "#10B981",
    title: "品牌全案与护航",
    subtitle: "品牌诊断 / 品牌升级 / 品牌护航",
    desc: "从品牌诊断到年度护航，打造持久的品牌竞争力。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "AI 品牌方案",
        plans: [
          { name: "AI 品牌诊断", period: "单次", price: "198", unit: "元", features: ["AI 品牌分析", "竞品对标", "改进建议"] },
          { name: "AI 品牌升级", period: "单次", price: "9800", unit: "元", features: ["品牌定位优化", "视觉系统更新", "传播策略"] },
          { name: "AI 品牌护航", period: "3 个月", price: "29800", unit: "元", highlight: true, features: ["持续品牌优化", "内容运营", "数据监测"] }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Brain className="text-[#C9A84C]" size={20} />,
        desc: "顶级品牌全案",
        plans: [
          { name: "专家品牌诊断", period: "单次", price: "28000", unit: "元", features: ["深度品牌审计", "战略建议", "行动方案"] },
          { name: "专家品牌升级", period: "单次", price: "180000", unit: "元", features: ["完整品牌重塑", "全域视觉系统", "传播护航"] },
          { name: "专家品牌护航", period: "1 年", price: "4800000", unit: "元", highlight: true, features: ["年度品牌战略", "全域运营护航", "专家陪跑"] }
        ]
      }
    ]
  },

  // 5. 战略咨询：6 级定价
  strategyConsultingServices: {
    id: "strategy-consulting-services",
    badge: "战略类",
    badgeColor: "#8B5CF6",
    title: "战略咨询与定位",
    subtitle: "数字增长 / 战略定位 / 顶级合伙",
    desc: "从数字增长引擎到 3 年 5000 万的顶级合伙，重新定义品牌增长。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "AI 战略方案",
        plans: [
          { name: "AI 增长诊断", period: "单次", price: "98", unit: "元", features: ["AI 增长分析", "机会识别", "行动建议"] },
          { name: "AI 数字增长", period: "3 个月", price: "19800", unit: "元", features: ["AI 增长方案", "数据优化", "月度报告"] },
          { name: "AI 战略定位", period: "6 个月", price: "98000", unit: "元", highlight: true, features: ["完整战略规划", "执行指导", "季度评审"] }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Brain className="text-[#C9A84C]" size={20} />,
        desc: "顶级战略咨询",
        plans: [
          { name: "专家增长诊断", period: "单次", price: "38000", unit: "元", features: ["深度战略诊断", "市场机会分析", "3 年规划"] },
          { name: "专家战略定位", period: "1 年", price: "300000", unit: "元", features: ["完整战略规划", "执行护航", "月度陪跑"] },
          { name: "顶级合伙方案", period: "3 年", price: "5000000", unit: "元", highlight: true, features: ["深度战略合伙", "年度 CEO 陪跑", "全域增长护航"] }
        ]
      }
    ]
  },

  // 6. 毛智库（军事业务）：6 级定价
  maoThinkTankServices: {
    id: "mao-think-tank-services",
    badge: "军事类",
    badgeColor: "#EF4444",
    title: "毛智库 — 军事战略与兵棋推演",
    subtitle: "To 军队 / 国防战略 / 兵棋推演",
    desc: "专业的军事战略咨询与兵棋推演服务，为国防建设提供智力支持。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "AI 军事分析方案",
        plans: [
          { name: "AI 战略分析", period: "单次", price: "198", unit: "元", features: ["AI 军事分析", "情报综合", "趋势预测"] },
          { name: "AI 兵棋模拟", period: "单次", price: "19800", unit: "元", features: ["AI 兵棋推演", "场景模拟", "结果分析"] },
          { name: "AI 国防咨询", period: "3 个月", price: "98000", unit: "元", highlight: true, features: ["持续战略分析", "定期推演", "专项研究"] }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Brain className="text-[#C9A84C]" size={20} />,
        desc: "顶级军事战略",
        plans: [
          { name: "专家战略咨询", period: "单次", price: "68000", unit: "元", features: ["深度战略分析", "专家评估", "建议方案"] },
          { name: "专家兵棋推演", period: "单次", price: "200000", unit: "元", features: ["完整兵棋推演", "多方案模拟", "详细报告"] },
          { name: "顶级国防合伙", period: "1 年", price: "2000000", unit: "元", highlight: true, features: ["年度战略护航", "定期推演", "专家陪跑"] }
        ]
      }
    ]
  }
};

// ─── 组件定义 ────────────────────────────────────────────────────────────

interface PricingPlan {
  name: string;
  period: string;
  price: string;
  unit: string;
  features: string[];
  highlight?: boolean;
  cta?: string;
  href?: string;
}

interface PricingGroup {
  name: string;
  icon: React.ReactNode;
  desc: string;
  plans: PricingPlan[];
}

interface PricingService {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  desc: string;
  groups: PricingGroup[];
}

export default function Pricing() {
  const { t } = useTranslation();
  const [activeService, setActiveService] = useState<string>("design-services");

  const services = Object.values(pricingData_zh) as PricingService[];
  const currentService = services.find(s => s.id === activeService);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-8 md:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-full mb-6">
              <span className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase">PRICING SYSTEM</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 font-['Noto_Serif_SC']">
              全线业务定价体系
            </h1>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              6 大业务板块 × 6 级定价梯度 | 3 AI 方案 + 3 专家方案 | 从 ¥9.8 到 ¥5000 万
            </p>
          </div>

          {/* Service Selector */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-12">
            {services.map(service => (
              <button
                key={service.id}
                onClick={() => setActiveService(service.id)}
                className={`p-4 border rounded-sm transition-all ${
                  activeService === service.id
                    ? "bg-[#C9A84C]/20 border-[#C9A84C] text-white"
                    : "bg-transparent border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                <div className="text-xs font-bold tracking-widest uppercase mb-1">{service.badge}</div>
                <div className="text-sm font-semibold">{service.title}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      {currentService && (
        <section className="pb-24 px-8 md:px-20">
          <div className="max-w-6xl mx-auto">
            {/* Service Header */}
            <div className="mb-12">
              <div className="inline-block px-3 py-1 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-full mb-4">
                <span className="text-[#C9A84C] text-xs font-bold tracking-widest uppercase">{currentService.badge}</span>
              </div>
              <h2 className="text-4xl font-bold mb-2 font-['Noto_Serif_SC']">{currentService.title}</h2>
              <p className="text-white/50 mb-4">{currentService.subtitle}</p>
              <p className="text-white/70 max-w-3xl">{currentService.desc}</p>
            </div>

            {/* Pricing Groups */}
            <div className="space-y-12">
              {currentService.groups.map((group, groupIdx) => (
                <div key={groupIdx}>
                  <div className="flex items-center gap-3 mb-6">
                    {group.icon}
                    <div>
                      <h3 className="text-xl font-bold">{group.name}</h3>
                      <p className="text-white/50 text-sm">{group.desc}</p>
                    </div>
                  </div>

                  {/* Plans Grid */}
                  <div className="grid md:grid-cols-3 gap-6">
                    {group.plans.map((plan, planIdx) => (
                      <div
                        key={planIdx}
                        className={`p-6 border rounded-sm transition-all ${
                          plan.highlight
                            ? "bg-[#C9A84C]/10 border-[#C9A84C]"
                            : "bg-white/5 border-white/10 hover:border-white/30"
                        }`}
                      >
                        <div className="mb-4">
                          <h4 className="text-lg font-bold mb-1">{plan.name}</h4>
                          <p className="text-white/50 text-xs">{plan.period}</p>
                        </div>

                        <div className="mb-6">
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold">¥{plan.price}</span>
                            <span className="text-white/50">{plan.unit}</span>
                          </div>
                        </div>

                        <ul className="space-y-3 mb-6">
                          {plan.features.map((feature, featureIdx) => (
                            <li key={featureIdx} className="flex items-start gap-2 text-sm text-white/70">
                              <Check size={16} className="text-[#C9A84C] flex-shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <button className="w-full py-2 px-4 bg-[#C9A84C] text-[#0A0A0A] text-xs font-bold tracking-widest uppercase hover:bg-[#D4B866] transition-all rounded-sm">
                          {plan.cta || "立即咨询"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-8 md:px-20 bg-[#111]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 font-['Noto_Serif_SC']">
            无法确定最适合的方案？
          </h2>
          <p className="text-white/60 mb-8">
            我们的专家团队随时准备为您提供个性化的咨询与建议。
          </p>
          <button className="px-8 py-3 bg-[#C9A84C] text-[#0A0A0A] text-sm font-bold tracking-widest uppercase hover:bg-[#D4B866] transition-all rounded-sm">
            预约专家咨询
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
