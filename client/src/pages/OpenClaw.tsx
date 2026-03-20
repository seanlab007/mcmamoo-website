/*
 * OpenClaw Page — 小龙虾 AI 助手
 * 产品介绍 + 定价套餐（从 Supabase 实时加载）+ 用户订阅状态 + 跳转
 * 风格与 mcmamoo 官网保持一致（深色、金色高亮）
 */
import { useState, useEffect } from "react";
import {
  ExternalLink, Zap, Eye, Camera, MessageSquare,
  Shield, Users, Check, ArrowRight, Sparkles, Loader2,
  BadgeCheck, AlertCircle,
} from "lucide-react";
import { getOpenClawPlans } from "@/lib/supabase";

const OPENCLAW_URL = import.meta.env.VITE_OPENCLAW_URL || "http://localhost:18789";

// ─── Static feature list ────────────────────────────────────────────────────
const features = [
  {
    icon: <Eye size={20} />,
    title: "视觉理解",
    desc: "支持截图、图片上传，AI 直接分析图像内容",
  },
  {
    icon: <Camera size={20} />,
    title: "一键截图",
    desc: "点击截图按钮，选择屏幕区域，即刻发送给 AI 分析",
  },
  {
    icon: <MessageSquare size={20} />,
    title: "多模型支持",
    desc: "GPT-4o、Claude 3.5、Gemini 等顶级模型随意切换",
  },
  {
    icon: <Zap size={20} />,
    title: "Vision 模型标识",
    desc: "模型选择器自动标注 [Vision] 支持视觉理解的模型",
  },
  {
    icon: <Shield size={20} />,
    title: "私有部署",
    desc: "数据不出境，企业级安全，支持本地化部署",
  },
  {
    icon: <Users size={20} />,
    title: "团队协作",
    desc: "多会话管理，团队共享，统一账单",
  },
];

// ─── Fallback plans (shown while Supabase loads) ────────────────────────────
const FALLBACK_PLANS = [
  {
    id: "free",
    name_zh: "免费版",
    name: "Free",
    price_monthly: 0,
    price_yearly: 0,
    badge: null,
    features: ["每日 5 条消息", "基础模型（GPT-3.5）", "纯文字对话", "1 个会话"],
    cta: "免费开始",
    highlight: false,
  },
  {
    id: "pro",
    name_zh: "专业版",
    name: "Pro",
    price_monthly: 19.9,
    price_yearly: 199,
    badge: "最受欢迎",
    features: [
      "无限消息",
      "全部顶级模型",
      "截图 & 图片理解",
      "Vision AI 分析",
      "无限会话",
      "优先客服支持",
    ],
    cta: "立即升级",
    highlight: true,
  },
  {
    id: "team",
    name_zh: "团队版",
    name: "Team",
    price_monthly: 49.9,
    price_yearly: 499,
    badge: "企业首选",
    features: [
      "Pro 版全部功能",
      "5 个团队成员",
      "共享会话管理",
      "管理员控制台",
      "API 访问权限",
      "专属客户经理",
    ],
    cta: "联系我们",
    highlight: false,
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function parsePlanFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function OpenClaw() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [plans, setPlans] = useState<typeof FALLBACK_PLANS>(FALLBACK_PLANS);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(false);

  // Load plans from Supabase on mount
  useEffect(() => {
    getOpenClawPlans()
      .then((rows: any[]) => {
        if (!rows || rows.length === 0) return;
        const mapped = rows.map((r: any, i: number) => ({
          id: r.id,
          name_zh: r.name_zh ?? r.name,
          name: r.name,
          price_monthly: Number(r.price_monthly),
          price_yearly: Number(r.price_yearly),
          badge: i === 1 ? "最受欢迎" : i === 2 ? "企业首选" : null,
          features: parsePlanFeatures(r.features),
          cta: r.id === "free" ? "免费开始" : r.id === "team" ? "联系我们" : "立即升级",
          highlight: r.id === "pro",
        }));
        setPlans(mapped);
      })
      .catch(() => setPlansError(true))
      .finally(() => setPlansLoading(false));
  }, []);

  const handleLaunch = (planId: string) => {
    if (planId === "team") {
      window.location.href = "/#contact";
      return;
    }
    window.open(OPENCLAW_URL, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 h-12 bg-[#111118] border-b border-white/5">
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2 text-[#C9A84C] hover:text-[#e8c96a] transition-colors text-sm"
          >
            <span className="text-lg">←</span>
            <span className="font-['Cormorant_Garamond'] tracking-wide">Mc&amp;Mamoo</span>
          </a>
          <span className="text-white/15">/</span>
          <span className="text-white/50 text-sm flex items-center gap-1.5">
            <span style={{ fontSize: "1rem" }}>🦞</span>
            小龙虾 AI
          </span>
        </div>
        <a
          href={OPENCLAW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-[#C9A84C]/70 hover:text-[#C9A84C] transition-colors"
        >
          <ExternalLink size={12} />
          直接进入
        </a>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-16 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(ellipse, #C9A84C 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/5 text-[#C9A84C] text-xs tracking-widest uppercase mb-8">
            <Sparkles size={12} />
            AI 视觉助手 · 截图理解 · 多模型
          </div>

          <h1 className="font-['Cormorant_Garamond'] text-5xl md:text-7xl font-light text-white mb-4 leading-tight">
            小龙虾
            <span className="text-[#C9A84C]"> AI</span>
          </h1>
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-6">
            OpenClaw · Powered by mcmamoo
          </p>

          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            新一代 AI 对话助手，支持截图直接发给 AI 分析，
            <br className="hidden md:block" />
            内置 Vision 模型标识，让图像理解触手可及。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href={OPENCLAW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-8 py-3.5 bg-[#C9A84C] text-black font-semibold text-sm tracking-wide hover:bg-[#e8c96a] transition-all duration-300"
            >
              立即免费使用
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#pricing"
              className="flex items-center gap-2 px-8 py-3.5 border border-white/20 text-white/70 text-sm tracking-wide hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition-all duration-300"
            >
              查看定价
            </a>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-['Cormorant_Garamond'] text-3xl md:text-4xl text-white mb-3">
              核心功能
            </h2>
            <div className="w-12 h-px bg-[#C9A84C] mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="group p-6 border border-white/5 bg-white/[0.02] hover:border-[#C9A84C]/30 hover:bg-[#C9A84C]/[0.03] transition-all duration-300"
              >
                <div className="text-[#C9A84C] mb-4 opacity-80 group-hover:opacity-100 transition-opacity">
                  {f.icon}
                </div>
                <h3 className="text-white font-medium mb-2 text-sm tracking-wide">{f.title}</h3>
                <p className="text-white/40 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Screenshot Demo ───────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-[#0D0D0D]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-['Cormorant_Garamond'] text-3xl md:text-4xl text-white mb-3">
            截图 → AI 分析，一步到位
          </h2>
          <div className="w-12 h-px bg-[#C9A84C] mx-auto mb-8" />
          <p className="text-white/50 text-sm mb-10 max-w-xl mx-auto leading-relaxed">
            点击工具栏的截图按钮，选择屏幕区域，截图自动附加到消息中，
            发送给支持视觉理解的 Vision 模型，即刻获得 AI 分析结果。
          </p>

          {/* Mock UI Preview */}
          <div className="relative mx-auto max-w-2xl border border-white/10 bg-[#111118] rounded-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-[#0D0D15]">
              <div className="w-2 h-2 rounded-full bg-red-500/60" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
              <div className="w-2 h-2 rounded-full bg-green-500/60" />
              <span className="ml-3 text-white/20 text-xs font-mono">小龙虾 AI · chat</span>
              <div className="ml-auto flex items-center gap-1.5 text-[10px] text-[#C9A84C]/60 border border-[#C9A84C]/20 px-2 py-0.5 rounded-sm">
                <Eye size={10} />
                gpt-4o [Vision]
              </div>
            </div>

            <div className="p-4 space-y-3 text-left">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#C9A84C]/20 flex-shrink-0 flex items-center justify-center text-[10px] text-[#C9A84C]">U</div>
                <div className="flex-1">
                  <div className="bg-[#1a1a2e] border border-white/5 rounded-sm p-3 text-xs text-white/70">
                    <div className="flex items-center gap-2 mb-2">
                      <Camera size={10} className="text-[#C9A84C]" />
                      <span className="text-[#C9A84C] text-[10px]">screenshot.png</span>
                    </div>
                    帮我分析这张截图里的数据趋势
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-[#C9A84C]/10 flex-shrink-0 flex items-center justify-center text-[10px] text-[#C9A84C]">AI</div>
                <div className="flex-1">
                  <div className="bg-[#0f1a0f] border border-[#40d090]/10 rounded-sm p-3 text-xs text-white/60 leading-relaxed">
                    从截图中可以看到，数据呈现明显的上升趋势...
                    <span className="inline-block w-1 h-3 bg-[#C9A84C]/60 ml-1 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 pb-4">
              <div className="flex items-center gap-2 border border-white/10 bg-[#0D0D15] px-3 py-2 rounded-sm">
                <Camera size={14} className="text-[#C9A84C]/60" />
                <span className="text-white/20 text-xs flex-1">输入消息，或点击截图按钮...</span>
                <div className="w-6 h-6 bg-[#C9A84C]/20 flex items-center justify-center rounded-sm">
                  <ArrowRight size={10} className="text-[#C9A84C]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-['Cormorant_Garamond'] text-3xl md:text-4xl text-white mb-3">
              定价方案
            </h2>
            <div className="w-12 h-px bg-[#C9A84C] mx-auto mb-6" />

            {/* Status indicators */}
            {plansLoading && (
              <div className="flex items-center justify-center gap-2 text-white/30 text-xs mb-4">
                <Loader2 size={12} className="animate-spin" />
                正在加载最新定价...
              </div>
            )}
            {plansError && (
              <div className="flex items-center justify-center gap-2 text-amber-400/60 text-xs mb-4">
                <AlertCircle size={12} />
                使用缓存定价数据
              </div>
            )}
            {!plansLoading && !plansError && (
              <div className="flex items-center justify-center gap-2 text-green-400/50 text-xs mb-4">
                <BadgeCheck size={12} />
                定价已实时同步
              </div>
            )}

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-1 p-1 border border-white/10 bg-white/[0.02]">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 text-xs tracking-wide transition-all ${
                  billingCycle === "monthly"
                    ? "bg-[#C9A84C] text-black font-semibold"
                    : "text-white/50 hover:text-white"
                }`}
              >
                月付
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-1.5 text-xs tracking-wide transition-all ${
                  billingCycle === "yearly"
                    ? "bg-[#C9A84C] text-black font-semibold"
                    : "text-white/50 hover:text-white"
                }`}
              >
                年付
                <span className="ml-1.5 text-[10px] text-green-400">省 17%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-6 border transition-all duration-300 ${
                  plan.highlight
                    ? "border-[#C9A84C]/50 bg-[#C9A84C]/[0.04]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-[#C9A84C] text-black text-[10px] font-bold tracking-widest uppercase">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-['Cormorant_Garamond'] text-2xl text-white">{plan.name_zh}</span>
                    <span className="text-white/30 text-xs">{plan.name}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    {plan.price_monthly === 0 ? (
                      <span className="text-3xl font-light text-[#C9A84C]">免费</span>
                    ) : (
                      <>
                        <span className="text-white/40 text-sm">$</span>
                        <span className="text-3xl font-light text-white">
                          {billingCycle === "yearly"
                            ? (plan.price_yearly / 12).toFixed(1)
                            : plan.price_monthly}
                        </span>
                        <span className="text-white/30 text-xs">/月</span>
                      </>
                    )}
                  </div>
                  {billingCycle === "yearly" && plan.price_monthly > 0 && (
                    <div className="text-green-400/70 text-[10px] mt-1">
                      年付 ${plan.price_yearly}，节省 $
                      {(plan.price_monthly * 12 - plan.price_yearly).toFixed(0)}
                    </div>
                  )}
                </div>

                <ul className="space-y-2.5 mb-8">
                  {parsePlanFeatures(plan.features).map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs text-white/60">
                      <Check size={12} className="text-[#C9A84C] mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleLaunch(plan.id)}
                  className={`w-full py-2.5 text-xs tracking-widest uppercase transition-all duration-300 ${
                    plan.highlight
                      ? "bg-[#C9A84C] text-black font-semibold hover:bg-[#e8c96a]"
                      : "border border-white/20 text-white/60 hover:border-[#C9A84C]/50 hover:text-[#C9A84C]"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          <p className="text-center text-white/25 text-xs mt-8">
            所有套餐均支持 7 天无理由退款 · 企业定制方案请联系我们
          </p>
        </div>
      </section>

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-white/5 text-center">
        <h2 className="font-['Cormorant_Garamond'] text-3xl text-white mb-4">
          准备好了吗？
        </h2>
        <p className="text-white/40 text-sm mb-8">
          立即体验小龙虾 AI，让截图理解成为您的工作利器
        </p>
        <a
          href={OPENCLAW_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#C9A84C] text-black font-semibold text-sm tracking-wide hover:bg-[#e8c96a] transition-all duration-300"
        >
          <span style={{ fontSize: "1rem" }}>🦞</span>
          打开小龙虾 AI
          <ExternalLink size={14} />
        </a>
      </section>
    </div>
  );
}
