/*
 * ============================================================
 * WhalePictures Page — 鲸达影业影视内容与模特经纪
 * ============================================================
 * 定价架构：6 级定价梯度（3 AI + 3 专家）
 * 业务范围：影视摄制 / AI 视频生成 / 模特经纪
 * ============================================================
 * ⚠️  PROTECTED FILE — 由 Manus 统一维护
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, Brain, Sparkles, Film, Users } from "lucide-react";

// ─── 定价数据定义 ────────────────────────────────────────────────────────────

const pricingData_zh = {
  // 影视摄制
  filmProduction: {
    title: "影视摄制与视频内容",
    aiGroup: {
      name: "AI 组 (AI-Powered)",
      icon: <Sparkles className="text-[#40d090]" size={24} />,
      desc: "AutoClip 视频自动化引擎",
      plans: [
        {
          name: "AI 视频尝鲜",
          period: "单次",
          price: "38",
          unit: "元",
          features: [
            "AI 自动剪辑",
            "5 条短视频",
            "基础字幕生成",
            "多格式输出"
          ]
        },
        {
          name: "AI 内容矩阵",
          period: "单次",
          price: "1980",
          unit: "元",
          highlight: true,
          features: [
            "完整内容矩阵生成",
            "50 条短视频",
            "自动字幕 + 配音",
            "多平台优化",
            "30 天运营"
          ]
        },
        {
          name: "AI 全域分发",
          period: "3 个月",
          price: "29800",
          unit: "元",
          features: [
            "持续内容生成",
            "200+ 短视频",
            "全域平台分发",
            "数据监测",
            "月度优化"
          ]
        }
      ]
    },
    expertGroup: {
      name: "专家组 (Expert-Led)",
      icon: <Brain className="text-[#C9A84C]" size={24} />,
      desc: "国际获奖导演团队实拍",
      plans: [
        {
          name: "专家摄制尝鲜",
          period: "单次",
          price: "8800",
          unit: "元",
          features: [
            "专业导演团队",
            "15-30s 品牌短片",
            "1 天拍摄",
            "2 套方案"
          ]
        },
        {
          name: "专家品牌大片",
          period: "单次",
          price: "98000",
          unit: "元",
          highlight: true,
          features: [
            "国际获奖导演",
            "1-3 分钟品牌大片",
            "完整制作流程",
            "4K 输出",
            "电影级视觉"
          ]
        },
        {
          name: "专家全年内容",
          period: "1 年",
          price: "980000",
          unit: "元",
          features: [
            "年度内容规划",
            "12+ 品牌大片",
            "专家陪跑",
            "全域传播",
            "品牌升级"
          ]
        }
      ]
    }
  },

  // 模特经纪
  modelAgency: {
    title: "模特经纪与 AI 模特生成",
    aiGroup: {
      name: "AI 组 (AI-Powered)",
      icon: <Sparkles className="text-[#40d090]" size={24} />,
      desc: "超写实 AI 模特生成",
      plans: [
        {
          name: "AI 模特尝鲜",
          period: "单次",
          price: "9.8",
          unit: "元",
          features: [
            "单次 AI 模特生成",
            "3 张超写实模特图",
            "零版权风险",
            "商用授权"
          ]
        },
        {
          name: "AI 模特矩阵",
          period: "单次",
          price: "1980",
          unit: "元",
          highlight: true,
          features: [
            "完整 AI 模特库",
            "50+ 模特形象",
            "多场景多风格",
            "商用授权",
            "持续更新"
          ]
        },
        {
          name: "AI 模特全案",
          period: "3 个月",
          price: "19800",
          unit: "元",
          features: [
            "定制 AI 模特",
            "200+ 模特形象",
            "全域内容生成",
            "品牌专属",
            "月度优化"
          ]
        }
      ]
    },
    expertGroup: {
      name: "专家组 (Expert-Led)",
      icon: <Brain className="text-[#C9A84C]" size={24} />,
      desc: "500+ 全球外籍模特经纪",
      plans: [
        {
          name: "专家模特咨询",
          period: "单次",
          price: "3800",
          unit: "元",
          features: [
            "模特选角指导",
            "风格定位",
            "合作方案",
            "价格谈判"
          ]
        },
        {
          name: "专家模特拍摄",
          period: "单次",
          price: "28000",
          unit: "元",
          highlight: true,
          features: [
            "专业模特选角",
            "1 天拍摄",
            "50+ 张精修图",
            "视频素材",
            "完整授权"
          ]
        },
        {
          name: "专家模特全年",
          period: "1 年",
          price: "280000",
          unit: "元",
          features: [
            "年度模特合作",
            "12+ 拍摄项目",
            "专属模特团队",
            "全域传播",
            "品牌代言"
          ]
        }
      ]
    }
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

interface ServiceSection {
  title: string;
  aiGroup: PricingGroup;
  expertGroup: PricingGroup;
}

export default function WhalePictures() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"film" | "model">("film");

  const currentService = activeTab === "film" ? pricingData_zh.filmProduction : pricingData_zh.modelAgency;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-8 md:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 bg-[#F59E0B]/10 border border-[#F59E0B]/30 rounded-full mb-6">
              <span className="text-[#F59E0B] text-xs font-bold tracking-widest uppercase">FILM & TALENT</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 font-['Noto_Serif_SC']">
              鲸达影业
            </h1>
            <p className="text-white/50 text-lg max-w-2xl mx-auto mb-4">
              影视摄制 × AI 视频 × 模特经纪
            </p>
            <p className="text-white/60 text-base max-w-3xl mx-auto">
              从 AI 驱动的高频视频生成到国际获奖导演的品牌大片，
              从超写实 AI 模特到 500+ 全球外籍模特，打造品牌视觉竞争力。
            </p>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="py-8 px-8 md:px-20 bg-[#111]">
        <div className="max-w-6xl mx-auto flex gap-4 justify-center">
          <button
            onClick={() => setActiveTab("film")}
            className={`px-6 py-3 text-sm font-bold tracking-widest uppercase transition-all ${
              activeTab === "film"
                ? "bg-[#F59E0B] text-[#0A0A0A]"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            <Film size={16} className="inline mr-2" />
            影视摄制
          </button>
          <button
            onClick={() => setActiveTab("model")}
            className={`px-6 py-3 text-sm font-bold tracking-widest uppercase transition-all ${
              activeTab === "model"
                ? "bg-[#F59E0B] text-[#0A0A0A]"
                : "bg-white/5 text-white/60 hover:text-white"
            }`}
          >
            <Users size={16} className="inline mr-2" />
            模特经纪
          </button>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-8 md:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 font-['Noto_Serif_SC']">
              {currentService.title}
            </h2>
            <p className="text-white/60">
              6 级定价体系 | 3 AI 方案 + 3 专家方案
            </p>
          </div>

          {/* Pricing Groups */}
          <div className="space-y-16">
            {/* AI Group */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                {currentService.aiGroup.icon}
                <div>
                  <h3 className="text-2xl font-bold">{currentService.aiGroup.name}</h3>
                  <p className="text-white/50 text-sm">{currentService.aiGroup.desc}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {currentService.aiGroup.plans.map((plan, idx) => (
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
                {currentService.expertGroup.icon}
                <div>
                  <h3 className="text-2xl font-bold">{currentService.expertGroup.name}</h3>
                  <p className="text-white/50 text-sm">{currentService.expertGroup.desc}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {currentService.expertGroup.plans.map((plan, idx) => (
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
            打造品牌视觉竞争力
          </h2>
          <p className="text-white/60 mb-8">
            鲸达影业汇聚国际获奖导演与 500+ 全球模特，为品牌提供顶级视觉内容。
          </p>
          <button className="px-8 py-3 bg-[#F59E0B] text-[#0A0A0A] text-sm font-bold tracking-widest uppercase hover:bg-[#D97706] transition-all rounded-sm">
            预约专家咨询
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
