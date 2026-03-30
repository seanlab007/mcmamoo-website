/**
 * MaoAI Pricing Page — High-end tier with anchor pricing
 * - Auto-detects browser language → CNY (zh) or USD (en)
 * - Billing cycles: monthly / biannual / annual / lifetime
 * - Anchor pricing: highlight savings vs. monthly
 * - Feature comparison table grouped by category
 * - Payment provider stubs with "coming soon" overlay
 */
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Check, X, Zap, Crown, Cat, ArrowRight, Loader2,
  CreditCard, Globe, ChevronDown, ChevronUp, Sparkles,
  Shield, Users, Infinity, Star, LayoutGrid,
} from "lucide-react";
import type { PlanTier, Currency, BillingCycle } from "@shared/plans";
import {
  PLAN_LIMITS, PLAN_PRICES, PLAN_META, FEATURE_ROWS,
  BILLING_CYCLE_LABELS, PAYMENT_PROVIDERS,
} from "@shared/plans";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function detectCurrency(): Currency {
  const lang = navigator.language || "en";
  return lang.startsWith("zh") ? "CNY" : "USD";
}

function isCN(currency: Currency) { return currency === "CNY"; }

function t(zh: string, en: string, currency: Currency): string {
  return isCN(currency) ? zh : en;
}

function formatPrice(amount: number, currency: Currency, perMonth = false): string {
  if (amount === 0) return t("免费", "Free", currency);
  const str = isCN(currency) ? `¥${amount.toLocaleString()}` : `$${amount.toFixed(2)}`;
  return perMonth ? str + t("/月", "/mo", currency) : str;
}

const TIER_ORDER: PlanTier[] = ["starter", "pro", "flagship"];

const CYCLE_ORDER: BillingCycle[] = ["monthly", "biannual", "annual", "lifetime"];

// Group feature rows by category
function groupFeatures() {
  const groups: Record<string, typeof FEATURE_ROWS> = {};
  for (const row of FEATURE_ROWS) {
    const cat = row.category ?? "其他";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(row);
  }
  return groups;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MaoAIPricing() {
  const { user } = useAuth({ redirectOnUnauthenticated: false });
  const [currency, setCurrency] = useState<Currency>("CNY");
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFeatureTable, setShowFeatureTable] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setCurrency(detectCurrency()); }, []);

  const { data: mySubscription } = trpc.billing.mySubscription.useQuery(
    undefined, { enabled: !!user }
  );
  const createOrderMutation = trpc.billing.createOrder.useMutation();

  const currentTier = mySubscription?.tier as PlanTier | undefined;
  const isCNY = isCN(currency);
  const featureGroups = groupFeatures();

  const handleSelectPlan = (tier: PlanTier) => {
    if (!user) { window.location.href = "/maoai/login"; return; }
    if (tier === "starter" && cycle === "lifetime") {
      // starter has lifetime too
    }
    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

  const handleCreateOrder = async (provider: string) => {
    if (!selectedTier) return;
    // Map BillingCycle to backend enum (monthly | yearly)
    const backendCycle = cycle === "annual" ? "yearly" : "monthly";
    try {
      const result = await createOrderMutation.mutateAsync({
        tier: selectedTier,
        provider: provider as any,
        currency,
        billingCycle: cycle,
      });
      alert(
        isCNY
          ? `订单已创建（ID: ${result.orderId}）\n\n${result.message}\n\n请联系客服微信完成支付，并告知订单号。`
          : `Order created (ID: ${result.orderId})\n\n${result.message}\n\nPlease contact support to complete payment.`
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getCyclePrice = (tier: PlanTier) =>
    PLAN_PRICES[tier][currency][cycle];

  return (
    <div className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <header className="border-b border-white/8 bg-[#080808]/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/maoai" className="flex items-center gap-2 text-[#C9A84C] hover:opacity-80 transition-opacity">
            <Cat size={18} />
            <span className="font-semibold text-sm tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>MaoAI</span>
          </a>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrency(c => c === "CNY" ? "USD" : "CNY")}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 text-white/40 text-xs hover:border-white/25 hover:text-white/60 transition-all"
            >
              <Globe size={11} />
              <span>{isCNY ? "¥ 人民币" : "$ USD"}</span>
            </button>
            {user ? (
              <a href="/maoai" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-xs hover:bg-[#C9A84C]/20 transition-all">
                {t("返回对话", "Back to Chat", currency)} <ArrowRight size={11} />
              </a>
            ) : (
              <a href="/maoai/login" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-xs hover:bg-[#C9A84C]/20 transition-all">
                {t("登录", "Sign In", currency)} <ArrowRight size={11} />
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-16">

        {/* ── Hero ── */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#C9A84C]/20 text-[#C9A84C]/50 text-[10px] mb-6 tracking-widest" style={{ fontFamily: "'DM Mono', monospace" }}>
            <Sparkles size={10} />
            <span>MAOAI PRICING</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            {t("选择你的 AI 战略方案", "Choose Your AI Plan", currency)}
          </h1>
          <p className="text-white/35 text-base max-w-2xl mx-auto leading-relaxed">
            {t(
              "从个人创作到品牌全案，MaoAI 为不同阶段的你提供精准匹配的 AI 能力",
              "From personal creation to full brand strategy — MaoAI scales with you",
              currency
            )}
          </p>
          {user && currentTier && (
            <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-white/40 text-xs">
              <Crown size={10} />
              <span>{t("当前方案：", "Current plan: ", currency)}</span>
              <span className={PLAN_META[currentTier]?.accentColor ?? "text-white/60"}>
                {PLAN_META[currentTier]?.name[isCNY ? "zh" : "en"]}
              </span>
            </div>
          )}
        </div>

        {/* ── Billing cycle tabs ── */}
        <div className="flex items-center justify-center gap-1 mb-12 bg-white/3 border border-white/8 p-1 w-fit mx-auto">
          {CYCLE_ORDER.map(c => {
            const label = BILLING_CYCLE_LABELS[c][isCNY ? "zh" : "en"];
            // Show saving badge for biannual / annual
            const saving = c === "biannual" ? 5 : c === "annual" ? 17 : c === "lifetime" ? null : null;
            const isActive = cycle === c;
            return (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={`relative px-4 py-2 text-xs transition-all flex items-center gap-1.5 ${
                  isActive
                    ? c === "lifetime"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "bg-[#C9A84C]/15 text-[#C9A84C] border border-[#C9A84C]/30"
                    : "text-white/35 hover:text-white/60"
                }`}
              >
                {c === "lifetime" && <Infinity size={10} />}
                <span>{label}</span>
                {saving && isActive && (
                  <span className="text-[9px] px-1 py-0.5 bg-green-500/20 text-green-400/80 border border-green-500/20">
                    -{saving}%
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Pricing cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-14">
          {TIER_ORDER.map(tier => {
            const meta = PLAN_META[tier];
            const limits = PLAN_LIMITS[tier];
            const pricing = getCyclePrice(tier);
            const isHighlighted = meta.highlighted;
            const isCurrentPlan = currentTier === tier;

            return (
              <div
                key={tier}
                className={`relative flex flex-col border ${meta.accentBorder} ${meta.accentBg} p-7 ${
                  isHighlighted ? `ring-1 ring-[#C9A84C]/20 shadow-lg shadow-[#C9A84C]/5` : ""
                }`}
              >
                {/* Popular badge */}
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#C9A84C] text-black text-[10px] font-bold tracking-widest">
                    {t("最受欢迎", "MOST POPULAR", currency)}
                  </div>
                )}
                {tier === "flagship" && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-500/80 text-white text-[10px] font-bold tracking-widest">
                    {t("品牌全案", "FULL BRAND", currency)}
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{meta.badge}</span>
                    <h2 className={`font-bold text-lg ${meta.accentColor}`}>
                      {meta.name[isCNY ? "zh" : "en"]}
                    </h2>
                  </div>
                  <p className="text-white/35 text-xs leading-relaxed">
                    {meta.tagline[isCNY ? "zh" : "en"]}
                  </p>
                </div>

                {/* Price block */}
                <div className="mb-6 pb-6 border-b border-white/8">
                  {cycle === "lifetime" ? (
                    <div>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className={`text-4xl font-bold ${meta.accentColor}`}>
                          {isCNY ? `¥${pricing.total.toLocaleString()}` : `$${pricing.total.toFixed(2)}`}
                        </span>
                      </div>
                      <p className="text-white/25 text-xs">{t("终身买断 · 一次付清", "One-time payment · Lifetime access", currency)}</p>
                      {/* Anchor: show monthly equivalent */}
                      <p className="text-white/20 text-xs mt-1">
                        {t("相当于", "Equivalent to", currency)}{" "}
                        {isCNY
                          ? `¥${Math.round(pricing.total / 36)}/月 × 3年`
                          : `$${(pricing.total / 36).toFixed(2)}/mo × 3yr`
                        }
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className={`text-4xl font-bold ${meta.accentColor}`}>
                          {isCNY ? `¥${pricing.perMonth}` : `$${pricing.perMonth.toFixed(2)}`}
                        </span>
                        <span className="text-white/25 text-sm">{t("/月", "/mo", currency)}</span>
                      </div>
                      {cycle !== "monthly" && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-white/25 text-xs line-through">
                            {isCNY ? `¥${PLAN_PRICES[tier][currency].monthly.perMonth}/月` : `$${PLAN_PRICES[tier][currency].monthly.perMonth.toFixed(2)}/mo`}
                          </span>
                          <span className="text-green-400/80 text-[10px] px-1.5 py-0.5 bg-green-500/10 border border-green-500/20">
                            {pricing.anchorLabel?.[isCNY ? "zh" : "en"]}
                          </span>
                        </div>
                      )}
                      <p className="text-white/20 text-xs mt-2">
                        {cycle === "biannual"
                          ? t(`按半年付 ${isCNY ? "¥" : "$"}${pricing.total.toLocaleString()}`, `Billed ${isCNY ? "¥" : "$"}${pricing.total} every 6 months`, currency)
                          : t(`按年付 ${isCNY ? "¥" : "$"}${pricing.total.toLocaleString()}`, `Billed ${isCNY ? "¥" : "$"}${pricing.total} annually`, currency)
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* Key features */}
                <ul className="flex flex-col gap-3 mb-8 flex-1">
                  {[
                    {
                      icon: <Zap size={12} />,
                      text: t(
                        `每日对话 ${limits.dailyChatMessages === -1 ? "无限次" : limits.dailyChatMessages + " 次"}`,
                        `${limits.dailyChatMessages === -1 ? "Unlimited" : limits.dailyChatMessages} chats/day`,
                        currency
                      ),
                      ok: true,
                    },
                    {
                      icon: <Star size={12} />,
                      text: t(
                        `图像生成 ${limits.dailyImageGenerations === -1 ? "无限次" : limits.dailyImageGenerations + " 次/天"}`,
                        `${limits.dailyImageGenerations === -1 ? "Unlimited" : limits.dailyImageGenerations} images/day`,
                        currency
                      ),
                      ok: limits.imageGeneration,
                    },
                    {
                      icon: <Shield size={12} />,
                      text: t("高级模型（R1、GLM-4 Plus）", "Premium models (R1, GLM-4+)", currency),
                      ok: limits.premiumModels,
                    },
                    {
                      icon: <Users size={12} />,
                      text: t(`团队席位 ${limits.teamSeats} 个`, `${limits.teamSeats} team seats`, currency),
                      ok: true,
                    },
                    {
                      icon: <Crown size={12} />,
                      text: t("品牌战略 AI 报告 + 专属顾问", "Brand strategy AI + Account manager", currency),
                      ok: limits.brandStrategy,
                    },
                    {
                      icon: <LayoutGrid size={12} />,
                      text: limits.contentQuota === 0
                        ? t("猫眼增长引擎 Mc&Mamoo Growth Engine内容平台（不含）", "Content platform (not included)", currency)
                        : limits.contentQuota === -1
                        ? t("猫眼增长引擎 Mc&Mamoo Growth Engine内容平台 · 无限生产 · 全平台", "Content platform · Unlimited · All channels", currency)
                        : t(`猫眼增长引擎 Mc&Mamoo Growth Engine内容平台 · ${limits.contentQuota}篇/月 · ${limits.contentPlatforms.length}个平台`, `Content platform · ${limits.contentQuota}/mo · ${limits.contentPlatforms.length} channels`, currency),
                      ok: limits.contentPlatform,
                      highlight: limits.contentPlatform,
                    },
                  ].map((item, idx) => (
                    <li key={idx} className={`flex items-start gap-2.5 text-xs ${item.ok ? (item as any).highlight ? "text-[#40d090]/90" : "text-white/70" : "text-white/20"}`}>
                      {item.ok
                        ? <Check size={13} className={`${(item as any).highlight ? "text-[#40d090]" : meta.accentColor} shrink-0 mt-0.5`} />
                        : <X size={13} className="text-white/15 shrink-0 mt-0.5" />
                      }
                      <span className={item.ok ? "" : "line-through"}>{item.text}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSelectPlan(tier)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                    isHighlighted
                      ? "bg-[#C9A84C] text-black hover:bg-[#C9A84C]/90"
                      : tier === "flagship"
                      ? "bg-purple-500/20 border border-purple-500/50 text-purple-300 hover:bg-purple-500/30"
                      : "bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20"
                  }`}
                >
                  {isCurrentPlan
                    ? t("当前方案", "Current Plan", currency)
                    : cycle === "lifetime"
                    ? t(`买断 ${meta.name.zh}`, `Get ${meta.name.en} Lifetime`, currency)
                    : t(`选择 ${meta.name.zh}`, `Get ${meta.name.en}`, currency)
                  }
                </button>

                {/* Anchor note for flagship */}
                {tier === "flagship" && cycle === "monthly" && (
                  <p className="text-center text-[10px] text-white/20 mt-2">
                    {t("年付仅 ¥9,980 · 省 ¥1,996", "Annual plan: $1,399.99 · Save $268", currency)}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Anchor pricing callout ── */}
        <div className="border border-[#C9A84C]/15 bg-[#C9A84C]/3 p-6 mb-14">
          <div className="flex items-center gap-2 mb-4">
            <Crown size={14} className="text-[#C9A84C]/60" />
            <h3 className="text-[#C9A84C]/70 text-sm font-medium tracking-wide">
              {t("旗舰版价格参考", "Flagship Pricing Reference", currency)}
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CYCLE_ORDER.map(c => {
              const p = PLAN_PRICES.flagship[currency][c];
              const isSelected = cycle === c;
              return (
                <button
                  key={c}
                  onClick={() => setCycle(c)}
                  className={`flex flex-col items-center p-4 border transition-all ${
                    isSelected
                      ? "border-[#C9A84C]/40 bg-[#C9A84C]/10"
                      : "border-white/8 hover:border-white/20"
                  }`}
                >
                  <span className="text-white/40 text-[10px] mb-2 tracking-wide">
                    {BILLING_CYCLE_LABELS[c][isCNY ? "zh" : "en"].toUpperCase()}
                  </span>
                  <span className={`text-xl font-bold ${isSelected ? "text-[#C9A84C]" : "text-white/70"}`}>
                    {isCNY ? `¥${p.total.toLocaleString()}` : `$${p.total.toFixed(2)}`}
                  </span>
                  {c !== "monthly" && c !== "lifetime" && (
                    <span className="text-[10px] text-green-400/60 mt-1">
                      {isCNY ? `¥${p.perMonth}/月` : `$${p.perMonth.toFixed(2)}/mo`}
                    </span>
                  )}
                  {c === "lifetime" && (
                    <span className="text-[10px] text-purple-400/60 mt-1">{t("永久使用", "Forever", currency)}</span>
                  )}
                  {p.anchorLabel && (
                    <span className="text-[9px] text-green-400/50 mt-1">{p.anchorLabel[isCNY ? "zh" : "en"]}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Feature comparison toggle ── */}
        <div className="text-center mb-6">
          <button
            onClick={() => {
              setShowFeatureTable(v => !v);
              setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
            }}
            className="flex items-center gap-2 mx-auto text-white/30 text-sm hover:text-white/55 transition-colors"
          >
            {showFeatureTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{t("查看完整功能对比", "View full feature comparison", currency)}</span>
          </button>
        </div>

        {/* ── Feature table ── */}
        {showFeatureTable && (
          <div ref={tableRef} className="border border-white/8 overflow-x-auto mb-14">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/2">
                  <th className="text-left px-5 py-4 text-white/30 font-normal text-xs w-2/5">
                    {t("功能", "Feature", currency)}
                  </th>
                  {TIER_ORDER.map(tier => (
                    <th key={tier} className={`px-4 py-4 text-center text-xs font-semibold ${PLAN_META[tier].accentColor}`}>
                      {PLAN_META[tier].badge} {PLAN_META[tier].name[isCNY ? "zh" : "en"]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(featureGroups).map(([cat, rows]) => (
                  <>
                    <tr key={`cat-${cat}`} className="bg-white/3 border-t border-white/8">
                      <td colSpan={4} className="px-5 py-2 text-white/25 text-[10px] font-semibold tracking-widest uppercase">
                        {cat}
                      </td>
                    </tr>
                    {rows.map((row, idx) => (
                      <tr key={row.key} className={`border-b border-white/5 ${idx % 2 === 0 ? "" : "bg-white/1"}`}>
                        <td className="px-5 py-3 text-white/50 text-xs">{row.label[isCNY ? "zh" : "en"]}</td>
                        {TIER_ORDER.map(tier => {
                          const val = (row as any)[tier];
                          return (
                            <td key={tier} className="px-4 py-3 text-center text-xs">
                              {typeof val === "boolean" ? (
                                val
                                  ? <Check size={13} className={`mx-auto ${PLAN_META[tier].accentColor}`} />
                                  : <X size={13} className="mx-auto text-white/12" />
                              ) : (
                                <span className={`${PLAN_META[tier].accentColor} opacity-80`}>{val as string}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Payment providers ── */}
        <div className="border border-white/8 bg-white/2 p-6 mb-14">
          <div className="flex items-center gap-2 mb-5">
            <CreditCard size={13} className="text-white/35" />
            <h3 className="text-white/50 text-sm font-medium">
              {t("支持的支付方式", "Supported Payment Methods", currency)}
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            {PAYMENT_PROVIDERS.map(p => (
              <div
                key={p.id}
                className={`relative flex flex-col items-center gap-1.5 px-3 py-3 border text-center ${
                  p.available ? "border-white/15 cursor-pointer hover:border-white/30" : "border-white/6 opacity-40"
                }`}
              >
                <span className={`text-sm font-medium ${p.color}`}>{p.name[isCNY ? "zh" : "en"]}</span>
                <span className="text-white/25 text-[10px]">{p.currencies.join(" / ")}</span>
                {!p.available && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-[9px] text-white/25 tracking-widest">
                    {t("接入中", "SOON", currency)}
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-white/18 text-xs leading-relaxed">
            {t(
              "支付接口正在接入中。目前可通过联系客服微信完成手动支付，24 小时内激活订阅。",
              "Payment integrations are in progress. Contact support for manual payment — subscriptions activated within 24 hours.",
              currency
            )}
          </p>
        </div>

        {/* ── FAQ ── */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-white/35 text-xs font-semibold tracking-widest uppercase mb-8 text-center">
            {t("常见问题", "FAQ", currency)}
          </h3>
          <div className="flex flex-col gap-5">
            {[
              {
                q: { zh: "各版本的核心区别是什么？", en: "What's the key difference between plans?" },
                a: { zh: "入门版适合个人轻度使用（100次/天对话，5次图像生成）；专业版面向高频用户和团队（1000次/天，100次图像，全模型解锁，API 接入）；旗舰版提供无限次使用、品牌战略 AI 报告和专属客户经理，适合企业和品牌方。", en: "Starter suits light personal use (100 chats/day, 5 images); Pro is for power users & teams (1000 chats, 100 images, all models, API); Flagship offers unlimited usage, brand strategy AI reports, and a dedicated account manager for enterprises." },
              },
              {
                q: { zh: "年付和终身买断哪个更划算？", en: "Is annual or lifetime better value?" },
                a: { zh: "年付比月付节省约 17%。终身买断相当于约 3 年月付总价，如果你计划长期使用，终身版更划算——旗舰版终身仅需 ¥39,800，相当于 40 个月月付。", en: "Annual saves ~17% vs monthly. Lifetime is equivalent to ~3 years of monthly payments — if you plan long-term, Flagship Lifetime at ¥39,800 equals just 40 months of monthly billing." },
              },
              {
                q: { zh: "品牌全案旗舰版包含哪些专属服务？", en: "What exclusive services does Flagship include?" },
                a: { zh: "旗舰版专属：无限次 AI 对话和图像生成、品牌战略 AI 分析报告、专属客户经理（1v1 微信服务）、10 个团队席位、最高优先级响应队列、API 接入。", en: "Flagship exclusive: unlimited AI chat & image gen, brand strategy AI reports, dedicated account manager (1v1), 10 team seats, highest priority queue, API access." },
              },
              {
                q: { zh: "可以随时取消订阅吗？", en: "Can I cancel anytime?" },
                a: { zh: "可以。取消后当前周期内仍可正常使用，到期后自动降回免费版。终身版一经购买不可退款。", en: "Yes. After cancellation, access continues until the end of your billing period, then reverts to free. Lifetime purchases are non-refundable." },
              },
            ].map((item, idx) => (
              <div key={idx} className="border-b border-white/5 pb-5">
                <p className="text-white/60 text-sm font-medium mb-2">{item.q[isCNY ? "zh" : "en"]}</p>
                <p className="text-white/30 text-sm leading-relaxed">{item.a[isCNY ? "zh" : "en"]}</p>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* ── Payment Modal ── */}
      {showPaymentModal && selectedTier && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0F0F0F] border border-white/12 w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <span className="text-base">{PLAN_META[selectedTier].badge}</span>
                <h3 className="text-white font-semibold text-sm">
                  {t(
                    `${PLAN_META[selectedTier].name.zh} · ${BILLING_CYCLE_LABELS[cycle].zh}`,
                    `${PLAN_META[selectedTier].name.en} · ${BILLING_CYCLE_LABELS[cycle].en}`,
                    currency
                  )}
                </h3>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-white/25 hover:text-white/55 transition-colors text-xl leading-none">×</button>
            </div>

            {/* Order summary */}
            <div className="px-5 py-4 border-b border-white/8 bg-white/2">
              {(() => {
                const pricing = getCyclePrice(selectedTier);
                return (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">{t("方案", "Plan", currency)}</span>
                      <span className={PLAN_META[selectedTier].accentColor}>{PLAN_META[selectedTier].name[isCNY ? "zh" : "en"]}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">{t("计费周期", "Billing", currency)}</span>
                      <span className="text-white/65">{BILLING_CYCLE_LABELS[cycle][isCNY ? "zh" : "en"]}</span>
                    </div>
                    {cycle !== "lifetime" && (
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">{t("月均费用", "Per month", currency)}</span>
                        <span className="text-white/65">{isCNY ? `¥${pricing.perMonth}` : `$${pricing.perMonth.toFixed(2)}`}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-semibold mt-1 pt-2 border-t border-white/8">
                      <span className="text-white/60">{t("合计", "Total", currency)}</span>
                      <span className={`text-lg ${PLAN_META[selectedTier].accentColor}`}>
                        {isCNY ? `¥${pricing.total.toLocaleString()}` : `$${pricing.total.toFixed(2)}`}
                      </span>
                    </div>
                    {pricing.anchorLabel && (
                      <div className="text-right">
                        <span className="text-[10px] text-green-400/60">{pricing.anchorLabel[isCNY ? "zh" : "en"]}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Payment providers */}
            <div className="px-5 py-4">
              <p className="text-white/30 text-xs mb-3">{t("选择支付方式", "Choose payment method", currency)}</p>
              <div className="flex flex-col gap-2">
                {PAYMENT_PROVIDERS
                  .filter(p => p.currencies.includes(currency))
                  .map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleCreateOrder(p.id)}
                      disabled={!p.available || createOrderMutation.isPending}
                      className={`flex items-center justify-between px-4 py-3 border text-sm transition-all ${
                        p.available
                          ? "border-white/12 text-white/65 hover:border-white/28 hover:text-white/85"
                          : "border-white/6 text-white/20 cursor-not-allowed"
                      }`}
                    >
                      <span className={p.color}>{p.name[isCNY ? "zh" : "en"]}</span>
                      {!p.available && <span className="text-[9px] text-white/20 tracking-widest">{t("接入中", "COMING SOON", currency)}</span>}
                      {p.available && createOrderMutation.isPending && <Loader2 size={12} className="animate-spin text-white/35" />}
                    </button>
                  ))}
              </div>

              <div className="mt-4 p-3 bg-[#C9A84C]/5 border border-[#C9A84C]/15">
                <p className="text-white/35 text-xs leading-relaxed">
                  {t(
                    "💬 支付接口接入中。如需立即开通，请联系客服微信，提供订单截图，24 小时内激活。",
                    "💬 Payment integrations coming soon. Contact support with your order details for manual activation within 24 hours.",
                    currency
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
