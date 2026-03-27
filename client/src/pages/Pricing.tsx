/*
 * ============================================================
 * Pricing Page — 猫眼增长引擎服务体系与定价
 * ============================================================
 * 业务逻辑整合：
 * 1. MaoAI (大脑) + 猫眼内容自动化平台 (执行端，含 AutoClip)
 * 2. 专家团队 (线下咨询) + AI 服务 (线上自动化) 深度融合
 * 3. 用户全链路：登录 -> 付费 -> AI 预审 -> 管理员终审 -> 交付
 * ============================================================
 */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, ShieldCheck, Zap, Brain } from "lucide-react";

// ─── 定价数据定义 ────────────────────────────────────────────────────────────

const pricingData_zh = {
  // 1. 战略大脑：MaoAI + 专家咨询
  strategicBrain: {
    id: "strategic-brain",
    badge: "核心大脑",
    badgeColor: "#C9A84C",
    title: "MaoAI 战略大脑",
    subtitle: "Strategic Intelligence & Expert Consulting",
    desc: "MaoAI 作为品牌增长的“大脑”，结合猫眼专家团队，提供从市场洞察到战略决策的全方位支持。",
    plans: [
      {
        name: "AI 战略助手",
        period: "月付",
        price: "1.98",
        unit: "万",
        highlight: false,
        features: ["MaoAI 基础对话能力", "行业趋势实时监测", "竞品动态 AI 预警", "品牌声量基础分析", "AI 自动生成周报"],
        cta: "立即开通",
        href: "/mao-ai"
      },
      {
        name: "专家+AI 陪跑",
        period: "季度",
        price: "58",
        unit: "万",
        highlight: true,
        features: ["MaoAI 高级战略模型", "专家团队月度战略会", "错位竞争理论深度应用", "爆品策划 AI 预审", "专属战略顾问支持", "管理员人工终审报告"],
        cta: "预约演示",
        href: "#contact"
      },
      {
        name: "毛智库年度会员",
        period: "年付",
        price: "100",
        unit: "万",
        highlight: false,
        features: ["全量 MaoAI 智库权限", "毛智库深度研报订阅", "季度高管闭门研讨会", "重大战略决策人工复核", "国际机构资源对接", "不限次专家咨询热线"],
        cta: "申请加入",
        href: "/maothink"
      }
    ]
  },
  // 2. 执行引擎：猫眼内容自动化平台 (含 AutoClip)
  executionEngine: {
    id: "execution-engine",
    badge: "执行引擎",
    badgeColor: "#40d090",
    title: "猫眼内容自动化平台",
    subtitle: "Content Automation & AutoClip Engine",
    desc: "统一调度 AI 内容生产与 AutoClip 视频剪辑，实现全域内容的高效产出与分发。",
    plans: [
      {
        name: "内容生产版",
        period: "月付",
        price: "2.98",
        unit: "万",
        highlight: false,
        features: ["每月 50 条 AI 图文内容", "基础 AutoClip 视频剪辑", "2 个平台账号管理", "内容日历自动规划", "AI 自动合规性预审"],
        cta: "免费试用",
        href: "/platform"
      },
      {
        name: "全能执行版",
        period: "月付",
        price: "9.8",
        unit: "万",
        highlight: true,
        features: ["每月 200 条 AI 内容生产", "高级 AutoClip 视频矩阵", "6 个平台账号管理", "爆款预测模型应用", "人工审核+AI 预审双重保障", "专属内容策略师"],
        cta: "立即升级",
        href: "/platform"
      },
      {
        name: "旗舰定制版",
        period: "年付",
        price: "15",
        unit: "万",
        highlight: false,
        features: ["无限量 AI 内容生产", "全量 AutoClip 算力支持", "全平台账号统一调度", "品牌声音/视觉定制训练", "实时数据大屏监测", "季度内容战略复盘"],
        cta: "预约演示",
        href: "/platform"
      }
    ]
  },
  // 3. 品牌全案：线下专家服务
  expertService: {
    id: "expert-service",
    badge: "顶级咨询",
    badgeColor: "#8B1A1A",
    title: "品牌全案战略咨询",
    subtitle: "Full-Case Brand Strategy",
    desc: "由猫眼核心专家团队亲自操刀，为品牌提供从 0 到 1 或从 1 到 10 的全案战略支持。",
    plans: [
      {
        name: "单品爆品策划",
        period: "单次",
        price: "48",
        unit: "万",
        highlight: false,
        features: ["爆品核心价值提炼", "爆品蜂窝 15 模型诊断", "上市传播全案策划", "KOL 种草矩阵规划", "首发活动执行方案"],
        cta: "立即咨询",
        href: "#contact"
      },
      {
        name: "品牌全案设计",
        period: "一次性",
        price: "58",
        unit: "万",
        highlight: true,
        features: ["品牌战略定位研究", "猫眼符号系统设计", "完整 VI 规范手册", "包装/电商视觉体系", "品牌故事文案体系"],
        cta: "预约提案",
        href: "#contact"
      },
      {
        name: "年度战略合伙人",
        period: "年付",
        price: "300",
        unit: "万",
        highlight: false,
        features: ["全年战略规划与陪跑", "不限次爆品策划", "品牌 360° 领导力构建", "全球 KOL 资源对接", "专属专家顾问团队"],
        cta: "立即签约",
        href: "#contact"
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
              ? "A unified ecosystem combining AI Intelligence (The Brain) and Content Automation (The Execution). Choose the model that fits your brand's growth stage."
              : "深度整合 AI 战略大脑与内容执行引擎。从战略决策到全域执行，为您提供透明、高效、可预测的增长方案。"}
          </p>
        </div>
      </section>

      {/* 核心业务逻辑展示 */}
      <section className="py-20 bg-white/[0.01]">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6 font-['Noto_Serif_SC']">
                {isEn ? "The Brain & The Execution" : "大脑决策 + 平台执行"}
              </h2>
              <div className="space-y-8">
                <div className="flex gap-5">
                  <div className="w-12 h-12 rounded-full bg-[#C9A84C]/10 flex items-center justify-center flex-shrink-0 border border-[#C9A84C]/20">
                    <Brain className="text-[#C9A84C]" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-2">MaoAI 战略大脑</h4>
                    <p className="text-white/40 text-sm leading-relaxed">
                      基于猫眼错位竞争理论训练的 AI 模型，负责市场洞察、爆品定义与战略预审。
                    </p>
                  </div>
                </div>
                <div className="flex gap-5">
                  <div className="w-12 h-12 rounded-full bg-[#40d090]/10 flex items-center justify-center flex-shrink-0 border border-[#40d090]/20">
                    <Zap className="text-[#40d090]" size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold mb-2">猫眼内容平台 (含 AutoClip)</h4>
                    <p className="text-white/40 text-sm leading-relaxed">
                      统一调度 AI 内容生产与视频剪辑，将大脑的决策快速转化为全域覆盖的优质内容。
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 border border-white/10 bg-white/[0.02] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck size={120} className="text-[#C9A84C]" />
              </div>
              <h3 className="text-[#C9A84C] font-bold mb-6 flex items-center gap-2">
                <ShieldCheck size={20} />
                {isEn ? "Full-Link Workflow" : "用户全链路流程"}
              </h3>
              <div className="space-y-6 relative">
                {[
                  { step: "01", title: "登录与需求提交", desc: "用户登录平台，提交品牌现状与增长需求" },
                  { step: "02", title: "付费与方案激活", desc: "选择对应套餐付费，系统自动激活 AI 模块" },
                  { step: "03", title: "AI 预审与生成", desc: "MaoAI 进行战略预审，内容平台自动生成初稿" },
                  { step: "04", title: "管理员人工终审", desc: "猫眼专家团队对 AI 生成内容进行最终审核把关" },
                  { step: "05", title: "交付与全域分发", desc: "审核通过后，内容自动分发至各平台账号" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <span className="text-[#C9A84C] font-mono font-bold">{item.step}</span>
                    <div>
                      <div className="text-white text-sm font-bold mb-1">{item.title}</div>
                      <div className="text-white/30 text-xs">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
            <div className="grid md:grid-cols-3 gap-8">
              {data.strategicBrain.plans.map(plan => <ServiceCard key={plan.name} plan={plan} isEn={isEn} />)}
            </div>
          </div>

          {/* 2. 执行引擎 */}
          <div className="mb-32">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <h3 className="text-2xl font-bold text-white font-['Noto_Serif_SC'] px-6">{data.executionEngine.title}</h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {data.executionEngine.plans.map(plan => <ServiceCard key={plan.name} plan={plan} isEn={isEn} />)}
            </div>
          </div>

          {/* 3. 专家全案 */}
          <div>
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <h3 className="text-2xl font-bold text-white font-['Noto_Serif_SC'] px-6">{data.expertService.title}</h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {data.expertService.plans.map(plan => <ServiceCard key={plan.name} plan={plan} isEn={isEn} />)}
            </div>
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="py-24 border-t border-white/5 bg-[#C9A84C]/5">
        <div className="container text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 font-['Noto_Serif_SC']">
            {isEn ? "Ready to Multiply Your Profits?" : "准备好让您的利润倍增了吗？"}
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
