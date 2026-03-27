/*
 * ============================================================
 * Whale Pictures Page — 鲸达影业业务重构
 * ============================================================
 * 定价策略：
 * 1. 核心竞争力 = 极低的尝试价格（9.8/38/98/198）
 * 2. 影视摄制与外模经纪均分为 AI 组与专家组
 * 3. 提供低价一次性尝试服务，快速获客
 * ============================================================
 */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, Play, Users, Sparkles, Brain, ArrowRight, Star, Flame } from "lucide-react";

// ─── 定价数据定义 ────────────────────────────────────────────────────────────

const pricingData = {
  // 1. 影视摄制：AI 视频 (AI 组) + 专家摄制 (专家组)
  videoProduction: {
    id: "video-production",
    badge: "核心业务",
    badgeColor: "#F59E0B",
    title: "影视摄制服务",
    subtitle: "Video Production & AI Content",
    desc: "从 AI 自动化视频矩阵到国际获奖团队摄制，满足不同维度的品牌传播需求。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "由 AutoClip 引擎驱动的自动化视频生产，高效且经济",
        plans: [
          {
            name: "AI 视频尝鲜",
            period: "单次",
            price: "38",
            unit: "元",
            highlight: false,
            features: ["3 条 AI 自动剪辑视频", "AutoClip 基础算力", "品牌素材 AI 适配", "多平台尺寸生成"],
            cta: "立即体验",
            href: "/platform"
          },
          {
            name: "AI 视频包",
            period: "单次",
            price: "198",
            unit: "元",
            highlight: true,
            features: ["15 条 AI 视频生产", "AutoClip 高级引擎", "爆款视频模型匹配", "全自动数字人配音"],
            cta: "立即开通",
            href: "/platform"
          },
          {
            name: "AI 短剧季卡",
            period: "单季",
            price: "1980",
            unit: "元",
            highlight: false,
            features: ["12 集 AI 生成短剧", "AI 场景与角色建模", "Sora/Kling 技术支持", "品牌深度植入策划"],
            cta: "预约演示",
            href: "/platform"
          }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Brain className="text-[#F59E0B]" size={20} />,
        desc: "由国际获奖导演团队亲自操刀，打造品牌级视觉大片",
        plans: [
          {
            name: "专家摄制尝鲜",
            period: "单次",
            price: "1980",
            unit: "元",
            highlight: false,
            features: ["15-30s 品牌短片", "专业导演团队策划", "高质感实拍/剪辑", "基础调色与音效"],
            cta: "立即预约",
            href: "#contact"
          },
          {
            name: "品牌 TVC 大片",
            period: "单次",
            price: "9800",
            unit: "元",
            highlight: true,
            features: ["60s 品牌形象大片", "戛纳获奖级别创意", "顶级摄制器材与灯光", "专业外模/演员出镜"],
            cta: "预约提案",
            href: "#contact"
          },
          {
            name: "年度内容合伙人",
            period: "年付",
            price: "128000",
            unit: "元",
            highlight: false,
            features: ["全年内容战略规划", "4 场品牌级大片摄制", "每月 10 条专家策划短片", "专属导演团队对接"],
            cta: "立即签约",
            href: "#contact"
          }
        ]
      }
    ]
  },

  // 2. 外模经纪：AI 模特 (AI 组) + 专家经纪 (专家组)
  modelAgency: {
    id: "model-agency",
    badge: "全球资源",
    badgeColor: "#F59E0B",
    title: "外模经纪服务",
    subtitle: "International Model Agency",
    desc: "提供 500+ 位全球外籍模特资源，或选择 AI 模特实现零版权风险拍摄。",
    groups: [
      {
        name: "AI 组 (AI-Powered)",
        icon: <Sparkles className="text-[#40d090]" size={20} />,
        desc: "AI 生成的超写实数字模特，无版权风险，成本极低",
        plans: [
          {
            name: "AI 模特尝鲜",
            period: "单次",
            price: "9.8",
            unit: "元",
            highlight: false,
            features: ["1 张 AI 超写实模特图", "品牌服装 AI 试穿", "指定国籍/肤色/风格", "永久商用版权"],
            cta: "立即生成",
            href: "#contact"
          },
          {
            name: "AI 模特包",
            period: "单次",
            price: "98",
            unit: "元",
            highlight: true,
            features: ["10 张 AI 模特精修图", "多场景 AI 切换", "品牌视觉风格定制", "支持视频号/电商使用"],
            cta: "立即定制",
            href: "#contact"
          }
        ]
      },
      {
        name: "专家组 (Expert-Led)",
        icon: <Users className="text-[#F59E0B]" size={20} />,
        desc: "500+ 位全球外籍模特实拍，专业经纪团队全程跟进",
        plans: [
          {
            name: "专家拍摄尝鲜",
            period: "4小时",
            price: "980",
            unit: "元",
            highlight: false,
            features: ["1 位国际模特出镜", "4 小时拍摄时长", "基础妆造配合", "国内商用版权授权"],
            cta: "挑选模特",
            href: "#contact"
          },
          {
            name: "全天专业拍摄",
            period: "8小时",
            price: "1980",
            unit: "元",
            highlight: true,
            features: ["1-2 位国际模特出镜", "8 小时拍摄时长", "专业妆造团队", "全媒体商用版权"],
            cta: "立即预约",
            href: "#contact"
          }
        ]
      }
    ]
  }
};

// ─── 奖项数据 ──────────────────────────────────────────────────────────────────
const AWARDS = [
  { year: "2013", name: "戛纳国际广告节", award: "铜狮奖 · Film Category", icon: "🥉" },
  { year: "2016", name: "D&AD",           award: "In Book · Film Craft",     icon: "✏️" },
  { year: "2015", name: "ONE SHOW",       award: "铜铅笔奖 · Branded Entertainment", icon: "✏️" },
  { year: "2013", name: "龙玺广告节",     award: "1金2银 · Greater China",   icon: "🥇" },
  { year: "2013", name: "中国4A金印奖",   award: "金奖 · 影视类",             icon: "🥇" },
  { year: "2014", name: "亚太广告节",     award: "铜奖 · Film",               icon: "🥉" },
];

// ─── 页面组件 ─────────────────────────────────────────────────────────────────

function ServiceCard({ plan, isEn }: { plan: any; isEn: boolean }) {
  return (
    <div className={`relative p-8 border transition-all duration-500 flex flex-col ${
      plan.highlight ? "bg-[#F59E0B]/5 border-[#F59E0B]/30 scale-105 z-10 ring-2 ring-[#F59E0B]/20" : "bg-white/[0.02] border-white/10 hover:border-white/20"
    }`}>
      {plan.highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#F59E0B] text-[#0A0A0A] text-[10px] font-bold tracking-widest uppercase px-3 py-1 flex items-center gap-1">
          <Flame size={12} /> {isEn ? "Best Value" : "最佳选择"}
        </div>
      )}
      <div className="mb-6">
        <h4 className="text-white text-xl font-bold mb-1">{plan.name}</h4>
        <span className="text-white/40 text-xs uppercase tracking-widest font-mono">{plan.period}</span>
      </div>
      <div className="mb-8">
        <div className="flex items-baseline gap-1">
          <span className={`text-4xl font-bold ${plan.highlight ? "text-[#F59E0B]" : "text-white"}`}>{plan.price}</span>
          <span className="text-white/60 text-sm">{plan.unit}</span>
        </div>
      </div>
      <ul className="space-y-4 mb-10 flex-1">
        {plan.features.map((f: string) => (
          <li key={f} className="flex items-start gap-3 text-white/70 text-sm leading-relaxed">
            <Check size={16} className="text-[#F59E0B] mt-0.5 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <a
        href={plan.href}
        className={`block text-center py-4 text-sm font-bold tracking-widest uppercase transition-all duration-300 ${
          plan.highlight ? "bg-[#F59E0B] text-[#0A0A0A] hover:bg-[#D98E0A]" : "border border-white/20 text-white hover:bg-white/5"
        }`}
      >
        {plan.cta}
      </a>
    </div>
  );
}

export default function WhalePictures() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== "zh";
  const data = pricingData;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 border-b border-white/5">
        <div className="container">
          <div className="flex items-center gap-3 mb-6">
            <a href="/" className="text-white/30 hover:text-[#C9A84C] text-xs font-mono tracking-widest transition-colors">
              Mc&Mamoo
            </a>
            <span className="text-white/15 font-mono">›</span>
            <span className="text-[#F59E0B] text-xs font-mono tracking-widest uppercase">Whale Pictures</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div>
              <div className="inline-block px-3 py-1 border border-[#F59E0B]/30 text-[#F59E0B] text-[10px] font-bold tracking-widest uppercase mb-6">
                Creative Production House
              </div>
              <h1 className="text-5xl md:text-8xl font-bold text-white mb-8 leading-none font-['Cormorant_Garamond'] tracking-tight">
                WHALE<br />
                <span className="text-[#F59E0B]">PICTURES</span>
              </h1>
              <p className="text-white/50 text-lg max-w-xl leading-relaxed">
                {isEn 
                  ? "International award-winning creative production house. TVC · Model Agency · AI Drama. 35 global advertising awards."
                  : "国际获奖创意影视公司。TVC 广告 · 外模经纪 · AI 短剧。35 项全球广告奖项。"}
              </p>
            </div>
            {/* 奖项数字 */}
            <div className="flex gap-12 shrink-0 mb-4">
              {[
                { num: "35+", label: isEn ? "Global Awards" : "国际奖项" },
                { num: "200+", label: isEn ? "Brand Projects" : "品牌案例" },
                { num: "500+", label: isEn ? "Int'l Models" : "外籍模特" },
              ].map(s => (
                <div key={s.num} className="text-center">
                  <div className="text-[#F59E0B] font-['Cormorant_Garamond'] text-5xl font-bold">{s.num}</div>
                  <div className="text-white/30 text-[10px] font-mono tracking-widest mt-2 uppercase">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 定价板块 */}
      <section className="py-24">
        <div className="container">
          {/* 1. 影视摄制 */}
          <div className="mb-32">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <h3 className="text-2xl font-bold text-white font-['Noto_Serif_SC'] px-6">{data.videoProduction.title}</h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <p className="text-white/40 text-center mb-12 max-w-2xl mx-auto">{data.videoProduction.desc}</p>
            
            {data.videoProduction.groups.map((group, groupIdx) => (
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

          {/* 2. 外模经纪 */}
          <div>
            <div className="flex items-center gap-4 mb-12">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <h3 className="text-2xl font-bold text-white font-['Noto_Serif_SC'] px-6">{data.modelAgency.title}</h3>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>
            <p className="text-white/40 text-center mb-12 max-w-2xl mx-auto">{data.modelAgency.desc}</p>
            
            {data.modelAgency.groups.map((group, groupIdx) => (
              <div key={groupIdx} className="mb-16">
                <div className="flex items-center gap-3 mb-8">
                  {group.icon}
                  <h4 className="text-xl font-bold text-white">{group.name}</h4>
                  <span className="text-white/30 text-sm ml-auto">{group.desc}</span>
                </div>
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {group.plans.map(plan => <ServiceCard key={plan.name} plan={plan} isEn={isEn} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 获奖荣誉 */}
      <section className="py-24 border-t border-white/5 bg-white/[0.01]">
        <div className="container">
          <div className="flex items-center justify-between mb-16">
            <div>
              <div className="text-[#F59E0B] text-[10px] font-bold tracking-[0.3em] uppercase mb-4">Honors & Recognition</div>
              <h2 className="text-4xl font-bold text-white font-['Noto_Serif_SC']">35 项国际广告奖项</h2>
            </div>
            <div className="hidden md:block h-px flex-1 bg-white/10 mx-12" />
            <Star className="text-[#F59E0B]" size={32} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {AWARDS.map((a) => (
              <div key={a.name + a.year} className="border border-white/5 bg-white/[0.02] p-8 hover:border-[#F59E0B]/30 transition-all group">
                <div className="text-3xl mb-6 group-hover:scale-110 transition-transform duration-500">{a.icon}</div>
                <div className="text-white/30 text-[10px] font-mono tracking-widest mb-2">{a.year}</div>
                <div className="text-white text-lg font-bold mb-1">{a.name}</div>
                <div className="text-white/40 text-sm">{a.award}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="py-24 border-t border-white/5 bg-[#F59E0B]/5">
        <div className="container text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 font-['Noto_Serif_SC']">
            {isEn ? "Start Your Creative Journey" : "从 ¥9.8 开始您的创意之旅"}
          </h2>
          <p className="text-white/50 mb-12 max-w-2xl mx-auto">
            极低的尝试价格是我们的竞争力。无论是 AI 自动化视频矩阵，还是国际获奖团队摄制，都能以最经济的方式快速验证效果。
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="#contact" className="px-12 py-5 bg-[#F59E0B] text-[#0A0A0A] font-bold tracking-widest uppercase hover:bg-[#D98E0A] transition-all flex items-center gap-3">
              立即开始尝试（¥9.8 起） <ArrowRight size={18} />
            </a>
            <a href="https://whalepictures.vip" target="_blank" rel="noopener noreferrer" className="px-12 py-5 border border-white/20 text-white font-bold tracking-widest uppercase hover:bg-white/5 transition-all">
              访问鲸达影业官网
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
