/**
 * MaoAI Pricing Page
 * - Detects browser language to show CNY (zh) or USD (en)
 * - Displays Free / Pro / Max tiers with feature comparison table
 * - Payment provider stubs with "coming soon" overlay
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Check, X, Zap, Rocket, Cat, Crown, ArrowRight, Loader2,
  CreditCard, Globe, ChevronDown, ChevronUp, Sparkles, Wand2,
} from "lucide-react";
import type { PlanTier, Currency } from "@shared/plans";

// ─── Language detection ───────────────────────────────────────────────────────
function detectCurrency(): Currency {
  const lang = navigator.language || "en";
  return lang.startsWith("zh") ? "CNY" : "USD";
}

function t(zh: string, en: string, currency: Currency): string {
  return currency === "CNY" ? zh : en;
}

function formatPrice(amount: number, currency: Currency): string {
  if (amount === 0) return currency === "CNY" ? "免费" : "Free";
  if (currency === "CNY") return `¥${amount}`;
  return `$${amount.toFixed(2)}`;
}

// ─── Payment provider icons (text-based, no external images) ─────────────────
const PROVIDER_ICONS: Record<string, string> = {
  alipay: "支付宝",
  wechatpay: "微信支付",
  lianpay: "连连",
  paypal: "PayPal",
  stripe: "Stripe",
};

const PROVIDER_COLORS: Record<string, string> = {
  alipay: "text-blue-400",
  wechatpay: "text-green-400",
  lianpay: "text-orange-400",
  paypal: "text-sky-400",
  stripe: "text-violet-400",
};

const TIER_ICONS: Record<PlanTier, React.ReactNode> = {
  free: <Cat size={20} className="text-white/40" />,
  pro: <Zap size={20} className="text-[#C9A84C]" />,
  max: <Rocket size={20} className="text-purple-400" />,
};

const TIER_BORDER: Record<PlanTier, string> = {
  free: "border-white/10",
  pro: "border-[#C9A84C]/50",
  max: "border-purple-500/40",
};

const TIER_BG: Record<PlanTier, string> = {
  free: "bg-white/2",
  pro: "bg-[#C9A84C]/5",
  max: "bg-purple-500/5",
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function MaoAIPricing() {
  const { user } = useAuth({ redirectOnUnauthenticated: false });
  const [currency, setCurrency] = useState<Currency>("CNY");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [selectedTier, setSelectedTier] = useState<"pro" | "max" | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFeatureTable, setShowFeatureTable] = useState(false);

  useEffect(() => {
    setCurrency(detectCurrency());
  }, []);

  const { data: plans } = trpc.billing.plans.useQuery();
  const { data: mySubscription } = trpc.billing.mySubscription.useQuery(undefined, { enabled: !!user });
  const createOrderMutation = trpc.billing.createOrder.useMutation();

  const currentTier = mySubscription?.tier ?? "free";

  const tiers: PlanTier[] = ["free", "pro", "max"];

  const handleSelectPlan = (tier: "pro" | "max") => {
    if (!user) {
      window.location.href = "/maoai/login";
      return;
    }
    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

  const handleCreateOrder = async (provider: string) => {
    if (!selectedTier) return;
    try {
      const result = await createOrderMutation.mutateAsync({
        tier: selectedTier,
        provider: provider as any,
        currency,
        billingCycle,
      });
      // Show contact info since payment is not yet integrated
      alert(
        currency === "CNY"
          ? `订单已创建（ID: ${result.orderId}）\n\n${result.message}\n\n请联系客服微信完成支付，并告知订单号。`
          : `Order created (ID: ${result.orderId})\n\n${result.message}\n\nPlease contact support to complete payment.`
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const isCNY = currency === "CNY";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <header className="border-b border-[#C9A84C]/20 bg-[#0A0A0A]/95 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/maoai" className="flex items-center gap-2 text-[#C9A84C] hover:text-[#C9A84C]/80 transition-colors">
            <Cat size={18} />
            <span className="font-semibold text-sm tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>MaoAI</span>
          </a>
          <div className="flex items-center gap-3">
            {/* Currency toggle */}
            <button
              onClick={() => setCurrency(c => c === "CNY" ? "USD" : "CNY")}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 text-white/50 text-xs hover:border-white/30 hover:text-white/70 transition-all"
            >
              <Globe size={12} />
              <span>{currency === "CNY" ? "¥ 人民币" : "$ USD"}</span>
            </button>
            {user ? (
              <a href="/maoai" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-xs hover:bg-[#C9A84C]/20 transition-all">
                {t("返回对话", "Back to Chat", currency)}
                <ArrowRight size={12} />
              </a>
            ) : (
              <a href="/maoai/login" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] text-xs hover:bg-[#C9A84C]/20 transition-all">
                {t("登录", "Sign In", currency)}
                <ArrowRight size={12} />
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16">

        {/* ── Hero ── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#C9A84C]/20 text-[#C9A84C]/60 text-xs mb-6" style={{ fontFamily: "'DM Mono', monospace" }}>
            <Sparkles size={11} />
            <span>MaoAI PRICING</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {t("选择适合你的方案", "Choose Your Plan", currency)}
          </h1>
          <p className="text-white/40 text-base max-w-xl mx-auto">
            {t(
              "免费体验基础功能，升级解锁 AI 图像生成、高级模型与无限对话",
              "Start free, unlock image generation, premium models, and unlimited chat",
              currency
            )}
          </p>

          {/* Current plan badge */}
          {user && mySubscription && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-white/50 text-xs">
              <Crown size={11} />
              <span>
                {t("当前方案：", "Current plan: ", currency)}
                <span className={currentTier === "pro" ? "text-[#C9A84C]" : currentTier === "max" ? "text-purple-400" : "text-white/60"}>
                  {plans?.meta[currentTier]?.name[isCNY ? "zh" : "en"] ?? currentTier}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* ── Billing cycle toggle ── */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-2 text-sm transition-all ${billingCycle === "monthly" ? "bg-white/10 text-white border border-white/20" : "text-white/40 hover:text-white/60"}`}
          >
            {t("按月付", "Monthly", currency)}
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-2 text-sm transition-all flex items-center gap-2 ${billingCycle === "yearly" ? "bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/30" : "text-white/40 hover:text-white/60"}`}
          >
            {t("按年付", "Yearly", currency)}
            <span className="text-[10px] px-1.5 py-0.5 bg-[#C9A84C]/20 text-[#C9A84C]/80 border border-[#C9A84C]/20">
              {t("省 25%", "Save 25%", currency)}
            </span>
          </button>
        </div>

        {/* ── Pricing cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier) => {
            const meta = plans?.meta[tier];
            const price = plans?.prices[tier]?.[currency];
            const limits = plans?.limits[tier];
            const amount = billingCycle === "yearly" ? price?.yearly : price?.monthly;
            const isCurrentPlan = currentTier === tier;
            const isHighlighted = tier === "pro";

            return (
              <div
                key={tier}
                className={`relative flex flex-col border ${TIER_BORDER[tier]} ${TIER_BG[tier]} p-6 ${isHighlighted ? "ring-1 ring-[#C9A84C]/30" : ""}`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#C9A84C] text-black text-[10px] font-bold tracking-wider">
                    {t("推荐", "POPULAR", currency)}
                  </div>
                )}

                {/* Plan header */}
                <div className="flex items-center gap-2 mb-4">
                  {TIER_ICONS[tier]}
                  <div>
                    <h2 className="text-white font-semibold text-base">
                      {meta?.name[isCNY ? "zh" : "en"] ?? tier}
                    </h2>
                    <p className="text-white/35 text-xs mt-0.5">
                      {meta?.tagline[isCNY ? "zh" : "en"]}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-bold ${tier === "pro" ? "text-[#C9A84C]" : tier === "max" ? "text-purple-400" : "text-white/60"}`}>
                      {amount !== undefined ? formatPrice(amount, currency) : "—"}
                    </span>
                    {amount !== 0 && (
                      <span className="text-white/30 text-sm">
                        {t("/ 月", "/ mo", currency)}
                      </span>
                    )}
                  </div>
                  {billingCycle === "yearly" && amount !== 0 && (
                    <p className="text-white/25 text-xs mt-1">
                      {t("按年计费", "billed annually", currency)}
                    </p>
                  )}
                </div>

                {/* Key features */}
                <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                  {[
                    {
                      label: t(
                        `每日对话 ${limits?.dailyChatMessages === -1 ? "无限次" : limits?.dailyChatMessages + " 次"}`,
                        `${limits?.dailyChatMessages === -1 ? "Unlimited" : limits?.dailyChatMessages} chats/day`,
                        currency
                      ),
                      ok: true,
                    },
                    {
                      label: t(
                        `图像生成 ${limits?.imageGeneration ? (limits.dailyImageGenerations === -1 ? "无限次" : limits.dailyImageGenerations + " 次/天") : "不可用"}`,
                        `Image gen: ${limits?.imageGeneration ? (limits.dailyImageGenerations === -1 ? "unlimited" : limits.dailyImageGenerations + "/day") : "unavailable"}`,
                        currency
                      ),
                      ok: limits?.imageGeneration ?? false,
                    },
                    {
                      label: t("高级模型（R1、GLM-4 Plus）", "Premium models (R1, GLM-4+)", currency),
                      ok: limits?.premiumModels ?? false,
                    },
                    {
                      label: t("文件上传分析", "File upload & analysis", currency),
                      ok: limits?.fileUpload ?? false,
                    },
                    {
                      label: t("优先响应队列", "Priority queue", currency),
                      ok: limits?.priorityQueue ?? false,
                    },
                    {
                      label: t("API 接入", "API access", currency),
                      ok: limits?.apiAccess ?? false,
                    },
                  ].map((item, idx) => (
                    <li key={idx} className={`flex items-start gap-2 text-xs ${item.ok ? "text-white/70" : "text-white/25"}`}>
                      {item.ok
                        ? <Check size={13} className={tier === "pro" ? "text-[#C9A84C] shrink-0 mt-0.5" : tier === "max" ? "text-purple-400 shrink-0 mt-0.5" : "text-white/40 shrink-0 mt-0.5"} />
                        : <X size={13} className="text-white/15 shrink-0 mt-0.5" />
                      }
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA button */}
                {tier === "free" ? (
                  <a
                    href="/maoai"
                    className="w-full py-2.5 text-center text-sm border border-white/15 text-white/40 hover:border-white/30 hover:text-white/60 transition-all"
                  >
                    {isCurrentPlan ? t("当前方案", "Current Plan", currency) : t("免费开始", "Start Free", currency)}
                  </a>
                ) : (
                  <button
                    onClick={() => handleSelectPlan(tier as "pro" | "max")}
                    disabled={isCurrentPlan}
                    className={`w-full py-2.5 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      tier === "pro"
                        ? "bg-[#C9A84C]/15 border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/25"
                        : "bg-purple-500/15 border border-purple-500/40 text-purple-400 hover:bg-purple-500/25"
                    }`}
                  >
                    {isCurrentPlan
                      ? t("当前方案", "Current Plan", currency)
                      : t(`升级到${meta?.name.zh}`, `Upgrade to ${meta?.name.en}`, currency)
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Feature comparison table toggle ── */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowFeatureTable(v => !v)}
            className="flex items-center gap-2 mx-auto text-white/35 text-sm hover:text-white/60 transition-colors"
          >
            {showFeatureTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{t("查看完整功能对比", "View full feature comparison", currency)}</span>
          </button>
        </div>

        {/* ── Feature table ── */}
        {showFeatureTable && plans?.features && (
          <div className="border border-white/10 overflow-x-auto mb-12">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-white/40 font-normal text-xs w-1/2">
                    {t("功能", "Feature", currency)}
                  </th>
                  {tiers.map(tier => (
                    <th key={tier} className={`px-4 py-3 text-center text-xs font-semibold ${tier === "pro" ? "text-[#C9A84C]" : tier === "max" ? "text-purple-400" : "text-white/40"}`}>
                      {plans.meta[tier]?.name[isCNY ? "zh" : "en"]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plans.features.map((row, idx) => (
                  <tr key={row.key} className={`border-b border-white/5 ${idx % 2 === 0 ? "" : "bg-white/2"}`}>
                    <td className="px-4 py-3 text-white/55 text-xs">
                      {row.label[isCNY ? "zh" : "en"]}
                    </td>
                    {(["free", "pro", "max"] as PlanTier[]).map(tier => {
                      const val = row[tier];
                      return (
                        <td key={tier} className="px-4 py-3 text-center text-xs">
                          {typeof val === "boolean" ? (
                            val
                              ? <Check size={13} className={`mx-auto ${tier === "pro" ? "text-[#C9A84C]" : tier === "max" ? "text-purple-400" : "text-white/40"}`} />
                              : <X size={13} className="mx-auto text-white/15" />
                          ) : (
                            <span className={tier === "pro" ? "text-[#C9A84C]/80" : tier === "max" ? "text-purple-400/80" : "text-white/40"}>
                              {val as string}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Payment providers section ── */}
        <div className="border border-white/8 bg-white/2 p-6 mb-12">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={14} className="text-white/40" />
            <h3 className="text-white/60 text-sm font-medium">
              {t("支持的支付方式", "Supported Payment Methods", currency)}
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {plans?.providers.map(provider => (
              <div
                key={provider.id}
                className={`relative flex flex-col items-center gap-1.5 px-3 py-3 border text-center ${
                  provider.available
                    ? "border-white/15 hover:border-white/30 cursor-pointer"
                    : "border-white/8 opacity-50"
                }`}
              >
                <span className={`text-sm font-medium ${PROVIDER_COLORS[provider.id] ?? "text-white/50"}`}>
                  {PROVIDER_ICONS[provider.id] ?? provider.id}
                </span>
                <span className="text-white/30 text-[10px]">
                  {provider.currencies.join(" / ")}
                </span>
                {!provider.available && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-[9px] text-white/30 tracking-widest">
                    {t("接入中", "SOON", currency)}
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-white/20 text-xs mt-4">
            {t(
              "支付接口正在接入中。目前可通过联系客服完成手动支付，我们将在 24 小时内激活您的订阅。",
              "Payment integrations are in progress. Contact support for manual payment — subscriptions activated within 24 hours.",
              currency
            )}
          </p>
        </div>

        {/* ── FAQ ── */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-white/50 text-sm font-medium mb-6 text-center tracking-wide">
            {t("常见问题", "FAQ", currency)}
          </h3>
          <div className="flex flex-col gap-4">
            {[
              {
                q: { zh: "免费版有什么限制？", en: "What are the free plan limits?" },
                a: { zh: "免费版每天可发送 20 条消息，保存最多 10 条对话历史，仅支持基础模型（DeepSeek V3、GLM-4 Flash 等），不支持图像生成。", en: "Free plan allows 20 messages/day, stores up to 10 conversations, and supports basic models only. Image generation is not available." },
              },
              {
                q: { zh: "升级后立即生效吗？", en: "Does the upgrade take effect immediately?" },
                a: { zh: "是的，支付确认后立即激活。目前支付接口接入中，请联系客服完成支付，我们将在 24 小时内手动激活。", en: "Yes, activated immediately after payment confirmation. While payment integrations are in progress, contact support for manual activation within 24 hours." },
              },
              {
                q: { zh: "可以随时取消吗？", en: "Can I cancel anytime?" },
                a: { zh: "可以。取消后当前订阅周期内仍可正常使用，到期后自动降回免费版。", en: "Yes. After cancellation, you retain access until the end of your billing period, then revert to Free." },
              },
              {
                q: { zh: "支持哪些支付方式？", en: "What payment methods are supported?" },
                a: { zh: "即将支持支付宝、微信支付、连连支付（国内），以及 PayPal、Stripe（国际）。目前可联系客服通过转账完成支付。", en: "Coming soon: Alipay, WeChat Pay, LianLian Pay (China), PayPal, Stripe (international). Currently available via manual bank transfer — contact support." },
              },
            ].map((item, idx) => (
              <div key={idx} className="border-b border-white/5 pb-4">
                <p className="text-white/65 text-sm font-medium mb-1.5">{item.q[isCNY ? "zh" : "en"]}</p>
                <p className="text-white/35 text-sm leading-relaxed">{item.a[isCNY ? "zh" : "en"]}</p>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* ── Payment Modal ── */}
      {showPaymentModal && selectedTier && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/15 w-full max-w-md">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                {selectedTier === "pro" ? <Zap size={16} className="text-[#C9A84C]" /> : <Rocket size={16} className="text-purple-400" />}
                <h3 className="text-white font-medium text-sm">
                  {t(
                    `升级到${plans?.meta[selectedTier]?.name.zh}`,
                    `Upgrade to ${plans?.meta[selectedTier]?.name.en}`,
                    currency
                  )}
                </h3>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-white/30 hover:text-white/60 transition-colors text-lg leading-none">×</button>
            </div>

            {/* Order summary */}
            <div className="px-5 py-4 border-b border-white/10">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white/50">{t("方案", "Plan", currency)}</span>
                <span className={selectedTier === "pro" ? "text-[#C9A84C]" : "text-purple-400"}>
                  {plans?.meta[selectedTier]?.name[isCNY ? "zh" : "en"]}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-white/50">{t("计费周期", "Billing", currency)}</span>
                <span className="text-white/70">{billingCycle === "monthly" ? t("按月", "Monthly", currency) : t("按年", "Yearly", currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">{t("金额", "Amount", currency)}</span>
                <span className="text-white font-semibold">
                  {formatPrice(
                    billingCycle === "yearly"
                      ? (plans?.prices[selectedTier]?.[currency]?.yearly ?? 0)
                      : (plans?.prices[selectedTier]?.[currency]?.monthly ?? 0),
                    currency
                  )}
                  <span className="text-white/30 text-xs font-normal ml-1">{t("/ 月", "/ mo", currency)}</span>
                </span>
              </div>
            </div>

            {/* Payment providers */}
            <div className="px-5 py-4">
              <p className="text-white/40 text-xs mb-3">{t("选择支付方式", "Choose payment method", currency)}</p>
              <div className="flex flex-col gap-2">
                {plans?.providers
                  .filter(p => p.currencies.includes(currency))
                  .map(provider => (
                    <button
                      key={provider.id}
                      onClick={() => handleCreateOrder(provider.id)}
                      disabled={!provider.available || createOrderMutation.isPending}
                      className={`relative flex items-center justify-between px-4 py-3 border text-sm transition-all ${
                        provider.available
                          ? "border-white/15 text-white/70 hover:border-white/30 hover:text-white/90"
                          : "border-white/8 text-white/25 cursor-not-allowed"
                      }`}
                    >
                      <span className={PROVIDER_COLORS[provider.id] ?? "text-white/50"}>
                        {provider.name[isCNY ? "zh" : "en"]}
                      </span>
                      {!provider.available && (
                        <span className="text-[10px] text-white/25 tracking-widest">{t("接入中", "COMING SOON", currency)}</span>
                      )}
                      {provider.available && createOrderMutation.isPending && (
                        <Loader2 size={12} className="animate-spin text-white/40" />
                      )}
                    </button>
                  ))}
              </div>

              {/* Manual payment fallback */}
              <div className="mt-4 p-3 bg-white/3 border border-white/8">
                <p className="text-white/40 text-xs leading-relaxed">
                  {t(
                    "💬 支付接口接入中。如需立即升级，请联系客服微信完成手动支付，24 小时内激活。",
                    "💬 Payment integrations coming soon. For immediate upgrade, contact support for manual payment — activated within 24 hours.",
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
