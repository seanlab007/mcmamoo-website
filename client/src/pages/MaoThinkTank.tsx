/*
 * ============================================================
 * MaoThinkTank Page — 毛智库军事战略与兵棋推演
 * ============================================================
 * 定价架构：6 级定价梯度（3 AI + 3 专家）
 * 业务范围：To 军队 / 国防战略 / 兵棋推演
 * ============================================================
 * ⚠️  PROTECTED FILE — 由 Manus 统一维护
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, Brain, Sparkles, Shield, Zap } from "lucide-react";

// ─── 定价数据定义 ────────────────────────────────────────────────────────────

const pricingData_zh = {
  aiGroup: {
    name: "AI 组 (AI-Powered)",
    icon: <Sparkles className="text-[#40d090]" size={24} />,
    desc: "AI 驱动的军事分析与兵棋推演方案",
    plans: [
      {
        name: "AI 战略分析",
        period: "单次",
        price: "198",
        unit: "元",
        features: [
          "AI 军事态势分析",
          "情报数据综合",
          "战略趋势预测",
          "专项研究报告"
        ]
      },
      {
        name: "AI 兵棋推演",
        period: "单次",
        price: "19800",
        unit: "元",
        highlight: true,
        features: [
          "AI 兵棋模拟系统",
          "多场景推演",
          "实时数据分析",
          "完整推演报告",
          "3 套方案对比"
        ]
      },
      {
        name: "AI 国防咨询",
        period: "3 个月",
        price: "98000",
        unit: "元",
        features: [
          "持续战略分析",
          "定期兵棋推演",
          "专项研究支持",
          "月度报告",
          "实时数据监测"
        ]
      }
    ]
  },
  expertGroup: {
    name: "专家组 (Expert-Led)",
    icon: <Brain className="text-[#C9A84C]" size={24} />,
    desc: "顶级军事战略专家团队操刀",
    plans: [
      {
        name: "专家战略咨询",
        period: "单次",
        price: "68000",
        unit: "元",
        features: [
          "深度战略分析",
          "专家评估意见",
          "国防建议方案",
          "详细分析报告",
          "专家答疑"
        ]
      },
      {
        name: "专家兵棋推演",
        period: "单次",
        price: "200000",
        unit: "元",
        highlight: true,
        features: [
          "完整兵棋推演",
          "多方案模拟",
          "专家现场指导",
          "详细推演报告",
          "战略建议"
        ]
      },
      {
        name: "顶级国防合伙",
        period: "1 年",
        price: "2000000",
        unit: "元",
        features: [
          "年度战略护航",
          "定期兵棋推演",
          "专家陪跑",
          "季度战略评审",
          "全域国防支持"
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
}

interface PricingGroup {
  name: string;
  icon: React.ReactNode;
  desc: string;
  plans: PricingPlan[];
}

export default function MaoThinkTank() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-8 md:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-full mb-6">
              <span className="text-[#EF4444] text-xs font-bold tracking-widest uppercase">MILITARY STRATEGY</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 font-['Noto_Serif_SC']">
              毛智库
            </h1>
            <p className="text-white/50 text-lg max-w-2xl mx-auto mb-4">
              专业的军事战略咨询与兵棋推演服务
            </p>
            <p className="text-white/60 text-base max-w-3xl mx-auto">
              为国防建设、军事战略、国家安全提供专业的智力支持与战略咨询。
              从 AI 驱动的快速分析到顶级专家的深度护航，打造国防竞争力。
            </p>
          </div>
        </div>
      </section>

      {/* Business Overview */}
      <section className="py-16 px-8 md:px-20 bg-[#111]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border border-white/10 rounded-sm">
              <Shield className="text-[#EF4444] mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">国防战略</h3>
              <p className="text-white/60 text-sm">
                深度分析国防形势，提供战略建议，支持国防决策。
              </p>
            </div>
            <div className="p-6 border border-white/10 rounded-sm">
              <Zap className="text-[#EF4444] mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">兵棋推演</h3>
              <p className="text-white/60 text-sm">
                完整的兵棋模拟系统，多场景推演，实时数据分析。
              </p>
            </div>
            <div className="p-6 border border-white/10 rounded-sm">
              <Brain className="text-[#EF4444] mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">专家陪跑</h3>
              <p className="text-white/60 text-sm">
                顶级军事战略专家，全年度护航，季度评审。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-8 md:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 font-['Noto_Serif_SC']">
              6 级定价体系
            </h2>
            <p className="text-white/60">
              3 AI 方案 + 3 专家方案 | 从 ¥198 到 ¥2000 万
            </p>
          </div>

          {/* Pricing Groups */}
          <div className="space-y-16">
            {/* AI Group */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                {pricingData_zh.aiGroup.icon}
                <div>
                  <h3 className="text-2xl font-bold">{pricingData_zh.aiGroup.name}</h3>
                  <p className="text-white/50 text-sm">{pricingData_zh.aiGroup.desc}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {pricingData_zh.aiGroup.plans.map((plan, idx) => (
                  <div
                    key={idx}
                    className={`p-6 border rounded-sm transition-all ${
                      plan.highlight
                        ? "bg-[#40d090]/10 border-[#40d090]"
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
                          <Check size={16} className="text-[#40d090] flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button className="w-full py-2 px-4 bg-[#40d090] text-[#0A0A0A] text-xs font-bold tracking-widest uppercase hover:bg-[#3ac87d] transition-all rounded-sm">
                      立即咨询
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Expert Group */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                {pricingData_zh.expertGroup.icon}
                <div>
                  <h3 className="text-2xl font-bold">{pricingData_zh.expertGroup.name}</h3>
                  <p className="text-white/50 text-sm">{pricingData_zh.expertGroup.desc}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {pricingData_zh.expertGroup.plans.map((plan, idx) => (
                  <div
                    key={idx}
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
                      立即咨询
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-8 md:px-20 bg-[#111]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 font-['Noto_Serif_SC']">
            为国防建设提供智力支持
          </h2>
          <p className="text-white/60 mb-8">
            毛智库汇聚顶级军事战略专家，为国家安全与国防建设提供专业咨询。
          </p>
          <button className="px-8 py-3 bg-[#EF4444] text-white text-sm font-bold tracking-widest uppercase hover:bg-[#DC2626] transition-all rounded-sm">
            预约专家咨询
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
