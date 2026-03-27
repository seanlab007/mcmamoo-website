/*
 * ============================================================
 * Mao Think Tank — 毛智库 (军事战略业务)
 * ============================================================
 * 定价策略：
 * 1. 独立军事业务，面向军队 (To Army)
 * 2. 核心板块：兵棋推演、战略预测、国防思路
 * 3. 风格：军事战略风格 · 深红+暗金+哑黑
 * ============================================================
 */
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Target, Map, TrendingUp, Award, Globe, Check, ArrowRight, Flame } from "lucide-react";

// ── Reveal hook ─────────────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ── Timeline Data ──────────────────────────────────────────────────────────
const TIMELINE_EVENTS = [
  {
    year: "2018",
    event: "与东部战区建立战略合作",
    detail: "与解放军东部战区签署战略合作协议，为台海方向兵棋推演提供理论支撑，深度参与重大国防战略决策研究。",
    result: "已验证",
    type: "military",
  },
  {
    year: "2019",
    event: "精准预测：美国入侵委内瑞拉",
    detail: "引入博弈论模型，提前6个月精准预测美国对委内瑞拉的军事干预行动，预警报告提交相关机构。",
    result: "预测准确",
    type: "prediction",
  },
  {
    year: "2020",
    event: "精准预测：美国对伊朗军事打击",
    detail: "运用博弈论与持久战理论，精准预测美国将对伊朗实施大规模军事打击，事后验证准确率超85%。",
    result: "准确率85%+",
    type: "prediction",
  },
  {
    year: "2022",
    event: "受普京智库接见 · 俄乌冲突研判",
    detail: "受俄罗斯战略研究院正式邀请，就俄乌冲突战略走向提供独立评估，运用持久战理论分析战略消耗节点。",
    result: "国际认可",
    type: "recognition",
  },
  {
    year: "2023",
    event: "一带一路峰会受习大大接见",
    detail: "受邀出席第三届一带一路国际合作高峰论坛，就新三线建设国防思路向习近平主席当面汇报。",
    result: "最高层接见",
    type: "recognition",
  },
];

// ── Pricing Data ──────────────────────────────────────────────────────────
const militaryPricing = [
  {
    name: "单次兵棋推演",
    price: "200",
    unit: "万",
    features: ["单场景对抗模拟", "决策节点深度复盘", "战略建议报告", "专家团队现场指导"],
    cta: "预约推演",
    highlight: false
  },
  {
    name: "季度战略情报",
    price: "500",
    unit: "万",
    features: ["每月一场完整推演", "实时态势分析支持", "季度战略研讨会", "专属分析师团队"],
    cta: "立即洽谈",
    highlight: true
  },
  {
    name: "年度战略伙伴",
    price: "1500",
    unit: "万",
    features: ["全年不限次推演", "重大决策实时和议", "高管团队战略培训", "专属战略顾问团队"],
    cta: "深度合作",
    highlight: false
  }
];

export default function MaoThinkTank() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== "zh";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E8D5B7]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 border-b border-[#8B1A1A]/30 bg-gradient-to-b from-[#1A0505] to-[#0A0A0A]">
        <div className="container">
          <div className="inline-block px-3 py-1 border border-[#8B1A1A]/50 text-[#8B1A1A] text-[10px] font-bold tracking-widest uppercase mb-6">
            Military Strategic Think Tank
          </div>
          <h1 className="text-5xl md:text-8xl font-bold mb-8 leading-none font-['Noto_Serif_SC'] tracking-tight">
            毛智库<br />
            <span className="text-[#8B1A1A]">MAO THINK TANK</span>
          </h1>
          <p className="text-[#E8D5B7]/50 text-lg max-w-2xl leading-relaxed">
            {isEn 
              ? "Independent military strategic think tank. Specializing in wargame simulation, strategic prediction, and national defense concepts. Serving the highest levels of strategic decision-making."
              : "独立军事战略智库。专注于兵棋推演、战略预测与国防思路研究。为最高层战略决策提供独立、客观、前瞻的理论支撑。"}
          </p>
        </div>
      </section>

      {/* 核心业务板块 */}
      <section className="py-24 border-b border-white/5">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="p-8 border border-[#8B1A1A]/20 bg-[#8B1A1A]/5 hover:border-[#8B1A1A]/50 transition-all group">
              <Map className="text-[#8B1A1A] mb-6 group-hover:scale-110 transition-transform" size={40} />
              <h3 className="text-2xl font-bold mb-4 font-['Noto_Serif_SC']">兵棋推演</h3>
              <p className="text-[#E8D5B7]/40 text-sm leading-relaxed">
                运用先进的博弈论模型与动态模拟技术，针对台海、南海等关键战略方向进行深度兵棋推演，提供多维度的态势评估。
              </p>
            </div>
            <div className="p-8 border border-[#C9A84C]/20 bg-[#C9A84C]/5 hover:border-[#C9A84C]/50 transition-all group">
              <Target className="text-[#C9A84C] mb-6 group-hover:scale-110 transition-transform" size={40} />
              <h3 className="text-2xl font-bold mb-4 font-['Noto_Serif_SC']">战略预测</h3>
              <p className="text-[#E8D5B7]/40 text-sm leading-relaxed">
                基于持久战理论与地缘政治大数据，精准预测全球重大军事冲突与政治动向，准确率多次获得相关机构验证。
              </p>
            </div>
            <div className="p-8 border border-[#E8D5B7]/20 bg-[#E8D5B7]/5 hover:border-[#E8D5B7]/50 transition-all group">
              <Shield className="text-[#E8D5B7] mb-6 group-hover:scale-110 transition-transform" size={40} />
              <h3 className="text-2xl font-bold mb-4 font-['Noto_Serif_SC']">国防思路</h3>
              <p className="text-[#E8D5B7]/40 text-sm leading-relaxed">
                深度参与“新三线建设”等重大国防战略研究，为国家战略纵深重构与国防工业布局提供前瞻性思路。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 军事业务定价 */}
      <section className="py-24 bg-white/[0.02]">
        <div className="container">
          <div className="text-center mb-16">
            <div className="text-[#8B1A1A] text-[10px] font-bold tracking-[0.3em] uppercase mb-4">Military Service Pricing</div>
            <h2 className="text-4xl font-bold font-['Noto_Serif_SC']">军事战略咨询定价</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {militaryPricing.map((plan, idx) => (
              <div key={idx} className={`p-8 border transition-all duration-500 flex flex-col ${
                plan.highlight ? "bg-[#8B1A1A]/10 border-[#8B1A1A]/50 scale-105 z-10" : "bg-white/[0.02] border-white/10"
              }`}>
                <h4 className="text-xl font-bold mb-6">{plan.name}</h4>
                <div className="mb-8">
                  <span className="text-4xl font-bold text-[#8B1A1A]">{plan.price}</span>
                  <span className="text-[#E8D5B7]/60 text-sm ml-1">{plan.unit}</span>
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-[#E8D5B7]/60 text-sm">
                      <Check size={16} className="text-[#8B1A1A] mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-4 text-sm font-bold tracking-widest uppercase transition-all ${
                  plan.highlight ? "bg-[#8B1A1A] text-white hover:bg-[#A52A2A]" : "border border-[#8B1A1A]/30 text-[#8B1A1A] hover:bg-[#8B1A1A]/10"
                }`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 历史验证 Timeline */}
      <section className="py-24 bg-white/[0.01]">
        <div className="container">
          <div className="text-center mb-16">
            <div className="text-[#8B1A1A] text-[10px] font-bold tracking-[0.3em] uppercase mb-4">Strategic Verification</div>
            <h2 className="text-4xl font-bold font-['Noto_Serif_SC']">历史验证与国际认可</h2>
          </div>
          <div className="max-w-4xl mx-auto space-y-12">
            {TIMELINE_EVENTS.map((event, idx) => (
              <div key={idx} className="flex gap-8 items-start group">
                <div className="w-24 shrink-0 text-right">
                  <div className="text-[#8B1A1A] font-mono text-xl font-bold">{event.year}</div>
                  <div className="text-[10px] text-[#E8D5B7]/30 uppercase tracking-widest mt-1">{event.result}</div>
                </div>
                <div className="w-px h-full bg-gradient-to-b from-[#8B1A1A] to-transparent shrink-0" />
                <div className="pb-12">
                  <h4 className="text-xl font-bold mb-3 text-[#E8D5B7] group-hover:text-[#8B1A1A] transition-colors">{event.event}</h4>
                  <p className="text-[#E8D5B7]/50 text-sm leading-relaxed">{event.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="py-24 border-t border-[#8B1A1A]/20 bg-[#8B1A1A]/5">
        <div className="container text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 font-['Noto_Serif_SC']">
            {isEn ? "Military Strategic Consulting" : "申请资质审核"}
          </h2>
          <p className="text-[#E8D5B7]/50 mb-12 max-w-2xl mx-auto">
            毛智库业务属于独立军事咨询范畴，主要面向国防机构与军队。相关服务需经过严格的资质审核与保密协议签署。
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="#contact" className="px-12 py-5 bg-[#8B1A1A] text-white font-bold tracking-widest uppercase hover:bg-[#A52A2A] transition-all flex items-center gap-3">
              立即申请 <ArrowRight size={18} />
            </a>
            <div className="text-[#E8D5B7]/30 text-xs font-mono">
              * 仅限相关国防机构与授权单位申请
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
