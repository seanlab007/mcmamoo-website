/**
 * MaoAI Pricing Page v3 — 1000x Markup Pricing System
 *
 * Changes from v2:
 * - Removed "lifetime" billing cycle
 * - Added "free" tier
 * - Added monthly token limits and content quotas
 * - Cost transparency displayed (cost price vs markup)
 * - Simplified 3-cycle billing (monthly / biannual / annual)
 */
import { Fragment, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { MAOAI_ROUTES } from "../constants";
import {
  Check,
  X,
  Zap,
  Crown,
  Cat,
  ArrowRight,
  Loader2,
  CreditCard,
  Globe,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  Users,
  Star,
  LayoutGrid,
} from "lucide-react";
import type { BillingCycle, Currency, PlanTier } from "@shared/plans";
import {
  BILLING_CYCLE_LABELS,
  FEATURE_ROWS,
  MODEL_COSTS,
  PAYMENT_PROVIDERS,
  PLAN_LIMITS,
  PLAN_META,
  PLAN_PRICES,
} from "@shared/plans";

function detectCurrency(locale: string): Currency {
  return locale.startsWith("zh") ? "CNY" : "USD";
}

function isCNYCurrency(currency: Currency) {
  return currency === "CNY";
}

function pickText(isChinese: boolean, zh: string, en: string): string {
  return isChinese ? zh : en;
}

function formatPrice(amount: number, currency: Currency, isChinese: boolean, perMonth = false): string {
  if (amount === 0) return pickText(isChinese, "免费", "Free");
  const str = isCNYCurrency(currency) ? `¥${amount.toLocaleString()}` : `$${amount.toFixed(2)}`;
  return perMonth ? `${str}${pickText(isChinese, "/月", "/mo")}` : str;
}

function formatTokens(num: number): string {
  if (num === -1) return "∞";
  if (num >= 1000000) return `${(num / 1000000).toFixed(0)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}

const FEATURE_CATEGORY_LABELS: Record<string, { zh: string; en: string }> = {
  "AI 对话": { zh: "AI 对话", en: "AI Chat" },
  "图片生成": { zh: "图片生成", en: "Image Generation" },
  "视频生成": { zh: "视频生成", en: "Video Generation" },
  "猫眼内容平台": { zh: "猫眼内容平台", en: "MaoAI Content Platform" },
  "存储与文件": { zh: "存储与文件", en: "Storage & Files" },
  "团队与 API": { zh: "团队与 API", en: "Team & API" },
  "高级服务": { zh: "高级服务", en: "Premium Services" },
  其他: { zh: "其他", en: "Other" },
};

const TIER_ORDER: PlanTier[] = ["free", "starter", "pro", "flagship"];
const CYCLE_ORDER: BillingCycle[] = ["monthly", "biannual", "annual"];

function groupFeatures() {
  const groups: Record<string, typeof FEATURE_ROWS> = {};
  for (const row of FEATURE_ROWS) {
    const cat = row.category ?? "Other";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(row);
  }
  return groups;
}

function translateCategoryLabel(category: string, isChinese: boolean): string {
  const label = FEATURE_CATEGORY_LABELS[category];
  return label ? pickText(isChinese, label.zh, label.en) : category;
}

// 成本可视化组件
function CostBreakdown({ tier, cycle }: { tier: PlanTier; cycle: BillingCycle }) {
  const pricing = PLAN_PRICES[tier]?.CNY?.[cycle];
  if (!pricing || !pricing.costPrice) return null;

  const markup = pricing.total / pricing.costPrice;

  return (
    <div className="mt-3 border-t border-white/8 pt-3">
      <div className="flex items-center justify-between text-[10px] text-white/20">
        <span>{pickText(true, "成本价", "Cost")}</span>
        <span className="text-emerald-400/40">¥{pricing.costPrice.toFixed(2)}{cycle !== "monthly" ? `×${cycle === "biannual" ? 6 : 12}` : ""}</span>
      </div>
      <div className="flex items-center justify-between text-[10px] text-white/20">
        <span>{pickText(true, "加价率", "Markup")}</span>
        <span className="text-[#C9A84C]/50">{markup.toFixed(0)}x</span>
      </div>
    </div>
  );
}

export default function MaoAIPricing() {
  const { user } = useAuth({ redirectOnUnauthenticated: false });
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language || "zh";
  const isChinese = locale.startsWith("zh");
  const languageKey = isChinese ? "zh" : "en";

  const [currency, setCurrency] = useState<Currency>(detectCurrency(locale));
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const [selectedTier, setSelectedTier] = useState<PlanTier | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFeatureTable, setShowFeatureTable] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrency(detectCurrency(locale));
  }, [locale]);

  const { data: mySubscription } = trpc.billing.mySubscription.useQuery(undefined, {
    enabled: !!user,
  });
  const createOrderMutation = trpc.billing.createOrder.useMutation();

  const currentTier = mySubscription?.tier as PlanTier | undefined;
  const isCNY = isCNYCurrency(currency);
  const featureGroups = groupFeatures();

  const handleSelectPlan = (tier: PlanTier) => {
    if (!user) {
      window.location.href = MAOAI_ROUTES.LOGIN;
      return;
    }
    setSelectedTier(tier);
    setShowPaymentModal(true);
  };

  const handleCreateOrder = async (provider: string) => {
    if (!selectedTier) return;
    try {
      const result = await createOrderMutation.mutateAsync({
        plan: "content",
        amount: PLAN_PRICES[selectedTier][currency][cycle].total,
      });
      const r = result as any;
      const orderId = r?.id ?? r?.orderId ?? `ORD-${Date.now()}`;
      const message = r?.message ?? "";
      alert(
        pickText(
          isChinese,
          `订单已创建（ID: ${orderId}）\n\n${message}\n\n请联系客服微信完成支付，并告知订单号。`,
          `Order created (ID: ${orderId})\n\n${message}\n\nPlease contact support to complete payment and share your order number.`
        )
      );
      void provider;
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getCyclePrice = (tier: PlanTier) => PLAN_PRICES[tier][currency][cycle];

  return (
    <div className="min-h-screen bg-[#080808] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="sticky top-0 z-20 border-b border-white/8 bg-[#080808]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <a href={MAOAI_ROUTES.CHAT} className="flex items-center gap-2 text-[#C9A84C] transition-opacity hover:opacity-80">
            <Cat size={18} />
            <span className="text-sm font-semibold tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>
              MaoAI
            </span>
          </a>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrency((current) => (current === "CNY" ? "USD" : "CNY"))}
              className="flex items-center gap-1.5 border border-white/10 px-3 py-1.5 text-xs text-white/40 transition-all hover:border-white/25 hover:text-white/60"
            >
              <Globe size={11} />
              <span>{isCNY ? pickText(isChinese, "¥ 人民币", "¥ CNY") : "$ USD"}</span>
            </button>
            {user ? (
              <a
                href={MAOAI_ROUTES.CHAT}
                className="flex items-center gap-1.5 border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-1.5 text-xs text-[#C9A84C] transition-all hover:bg-[#C9A84C]/20"
              >
                {pickText(isChinese, "返回对话", "Back to Chat")} <ArrowRight size={11} />
              </a>
            ) : (
              <a
                href={MAOAI_ROUTES.LOGIN}
                className="flex items-center gap-1.5 border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-1.5 text-xs text-[#C9A84C] transition-all hover:bg-[#C9A84C]/20"
              >
                {pickText(isChinese, "登录", "Sign In")} <ArrowRight size={11} />
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-14 text-center">
          <div
            className="mb-6 inline-flex items-center gap-2 border border-[#C9A84C]/20 px-3 py-1.5 text-[10px] tracking-widest text-[#C9A84C]/50"
            style={{ fontFamily: "'DM Mono', monospace" }}
          >
            <Sparkles size={10} />
            <span>MAOAI PRICING v3</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
            {pickText(isChinese, "选择你的 AI 创作方案", "Choose Your AI Plan")}
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/35">
            {pickText(
              isChinese,
              "基于 API 成本的 1000 倍加价率定价",
              "1000x Markup Pricing · Based on API Costs"
            )}
          </p>
          {user && currentTier && (
            <div className="mt-5 inline-flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/40">
              <Crown size={10} />
              <span>{pickText(isChinese, "当前方案：", "Current plan:")}</span>
              <span className={PLAN_META[currentTier]?.accentColor ?? "text-white/60"}>{PLAN_META[currentTier]?.name[languageKey]}</span>
            </div>
          )}
        </div>

        {/* 计费周期切换 */}
        <div className="mx-auto mb-8 flex w-fit items-center justify-center gap-1 border border-white/8 bg-white/3 p-1">
          {CYCLE_ORDER.map((itemCycle) => {
            const label = BILLING_CYCLE_LABELS[itemCycle][languageKey];
            const saving = itemCycle === "biannual" ? 4 : itemCycle === "annual" ? 17 : null;
            const isActive = cycle === itemCycle;
            return (
              <button
                key={itemCycle}
                onClick={() => setCycle(itemCycle)}
                className={`relative flex items-center gap-1.5 px-4 py-2 text-xs transition-all ${
                  isActive
                    ? "border border-[#C9A84C]/30 bg-[#C9A84C]/15 text-[#C9A84C]"
                    : "text-white/35 hover:text-white/60"
                }`}
              >
                <span>{label}</span>
                {saving && isActive && (
                  <span className="border border-green-500/20 bg-green-500/20 px-1 py-0.5 text-[9px] text-green-400/80">-{saving}%</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 方案卡片 */}
        <div className="mb-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TIER_ORDER.map((tier) => {
            const meta = PLAN_META[tier];
            const limits = PLAN_LIMITS[tier];
            const pricing = getCyclePrice(tier);
            const isHighlighted = meta.highlighted;
            const isCurrentPlan = currentTier === tier;
            const isFree = tier === "free" || pricing.total === 0;

            return (
              <div
                key={tier}
                className={`relative flex flex-col border p-6 ${
                  meta.accentBorder
                } ${meta.accentBg} ${isHighlighted ? "ring-1 ring-[#C9A84C]/20 shadow-lg shadow-[#C9A84C]/5" : ""}`}
              >
                {meta.recommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C9A84C] px-4 py-1 text-[10px] font-bold tracking-widest text-black">
                    {pickText(isChinese, "推荐", "RECOMMENDED")}
                  </div>
                )}

                <div className="mb-5">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xl">{meta.badge}</span>
                    <h2 className={`text-lg font-bold ${meta.accentColor}`}>{meta.name[languageKey]}</h2>
                  </div>
                  <p className="text-xs leading-relaxed text-white/35">{meta.tagline[languageKey]}</p>
                </div>

                <div className="mb-5 border-b border-white/8 pb-5">
                  <div className="flex items-baseline gap-1">
                    {isFree ? (
                      <span className={`text-4xl font-bold ${meta.accentColor}`}>{formatPrice(pricing.total, currency, isChinese)}</span>
                    ) : (
                      <>
                        <span className={`text-4xl font-bold ${meta.accentColor}`}>{formatPrice(pricing.perMonth, currency, isChinese)}</span>
                        <span className="text-sm text-white/25">{pickText(isChinese, "/月", "/mo")}</span>
                      </>
                    )}
                  </div>
                  {cycle !== "monthly" && !isFree && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-white/25 line-through">
                        {formatPrice(PLAN_PRICES[tier][currency].monthly.perMonth, currency, isChinese, true)}
                      </span>
                      <span className="border border-green-500/20 bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-400/80">
                        {pickText(isChinese, `省 ¥${Math.round(PLAN_PRICES[tier][currency].monthly.perMonth - pricing.perMonth)}`, `Save $${(PLAN_PRICES[tier][currency].monthly.perMonth - pricing.perMonth).toFixed(2)}`)}
                      </span>
                    </div>
                  )}
                  {!isFree && (
                    <p className="mt-2 text-xs text-white/20">
                      {cycle === "biannual"
                        ? pickText(isChinese, `半年付 ¥${pricing.total.toLocaleString()}`, `$${pricing.total.toFixed(2)} / 6 months`)
                        : pickText(isChinese, `年付 ¥${pricing.total.toLocaleString()}`, `$${pricing.total.toFixed(2)} / year`)}
                    </p>
                  )}
                </div>

                {/* 核心限制展示 */}
                <div className="mb-5 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">{pickText(isChinese, "每日对话", "Daily messages")}</span>
                    <span className={meta.accentColor}>
                      {limits.dailyChatMessages === -1 ? "∞" : limits.dailyChatMessages}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">{pickText(isChinese, "每月 tokens", "Monthly tokens")}</span>
                    <span className={meta.accentColor}>{formatTokens(limits.monthlyTokens)}</span>
                  </div>
                  {limits.monthlyContentQuota > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40">{pickText(isChinese, "内容生产", "Content/month")}</span>
                      <span className={meta.accentColor}>{limits.monthlyContentQuota === -1 ? "∞" : limits.monthlyContentQuota}</span>
                    </div>
                  )}
                  {limits.monthlyVideoSeconds > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/40">{pickText(isChinese, "视频生成", "Video/sec")}</span>
                      <span className={meta.accentColor}>
                        {limits.monthlyVideoSeconds === -1 ? "∞" : `${limits.monthlyVideoSeconds}s`}
                      </span>
                    </div>
                  )}
                </div>

                {/* 成本透明化（可选展示） */}
                {showCostBreakdown && !isFree && (
                  <CostBreakdown tier={tier} cycle={cycle} />
                )}

                {/* 功能亮点 */}
                <ul className="mb-6 flex flex-1 flex-col gap-2">
                  {[
                    {
                      text: pickText(isChinese, "基础模型（GLM-4 Flash）", "Basic models (GLM-4 Flash)"),
                      ok: true,
                    },
                    {
                      text: pickText(isChinese, "高级模型（DeepSeek R1）", "Premium models (R1, Claude)"),
                      ok: limits.premiumModels,
                    },
                    {
                      text: pickText(isChinese, "图片生成", "AI Image Generation"),
                      ok: limits.imageGeneration,
                    },
                    {
                      text: pickText(isChinese, "团队席位", "Team seats"),
                      ok: true,
                    },
                    {
                      text: pickText(isChinese, "API 接入", "API access"),
                      ok: limits.apiAccess,
                    },
                    {
                      text: pickText(isChinese, "猫眼内容平台", "Content Platform"),
                      ok: limits.contentPlatform,
                      highlight: limits.contentPlatform,
                    },
                  ].map((item, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-2 text-xs ${item.ok ? (item.highlight ? "text-[#40d090]/90" : "text-white/70") : "text-white/20"}`}
                    >
                      {item.ok ? (
                        <Check size={12} className={`${item.highlight ? "text-[#40d090]" : meta.accentColor} mt-0.5 shrink-0`} />
                      ) : (
                        <X size={12} className="mt-0.5 shrink-0 text-white/15" />
                      )}
                      <span className={item.ok ? "" : "line-through"}>{item.text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(tier)}
                  disabled={isCurrentPlan || tier === "free"}
                  className={`w-full py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                    tier === "free"
                      ? "border border-white/15 bg-white/5 text-white/40"
                      : isHighlighted
                        ? "bg-[#C9A84C] text-black hover:bg-[#C9A84C]/90"
                        : "border border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {tier === "free"
                    ? pickText(isChinese, "免费体验", "Free Trial")
                    : isCurrentPlan
                      ? pickText(isChinese, "当前方案", "Current Plan")
                      : pickText(isChinese, `选择 ${meta.name.zh}`, `Get ${meta.name.en}`)}
                </button>
              </div>
            );
          })}
        </div>

        {/* 成本透明说明 */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <button
            onClick={() => setShowCostBreakdown(!showCostBreakdown)}
            className="flex items-center gap-2 border border-white/10 px-4 py-2 text-xs text-white/35 transition-all hover:border-white/20 hover:text-white/55"
          >
            <Sparkles size={12} />
            <span>{pickText(isChinese, "显示成本与加价率", "Show cost & markup")}</span>
          </button>
        </div>

        {/* 功能对比表 */}
        <div className="mb-6 text-center">
          <button
            onClick={() => {
              setShowFeatureTable((value) => !value);
              setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
            }}
            className="mx-auto flex items-center gap-2 text-sm text-white/30 transition-colors hover:text-white/55"
          >
            {showFeatureTable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span>{pickText(isChinese, "查看完整功能对比", "View full feature comparison")}</span>
          </button>
        </div>

        {showFeatureTable && (
          <div ref={tableRef} className="mb-14 overflow-x-auto border border-white/8">
            <table className="min-w-[700px] w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/2">
                  <th className="w-2/5 px-5 py-4 text-left text-xs font-normal text-white/30">{pickText(isChinese, "功能", "Feature")}</th>
                  {TIER_ORDER.map((tier) => (
                    <th key={tier} className={`px-4 py-4 text-center text-xs font-semibold ${PLAN_META[tier].accentColor}`}>
                      {PLAN_META[tier].badge} {PLAN_META[tier].name[languageKey]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(featureGroups).map(([category, rows]) => (
                  <Fragment key={`group-${category}`}>
                    <tr className="border-t border-white/8 bg-white/3">
                      <td colSpan={5} className="px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">
                        {translateCategoryLabel(category, isChinese)}
                      </td>
                    </tr>
                    {rows.map((row, idx) => (
                      <tr key={row.key} className={`border-b border-white/5 ${idx % 2 === 0 ? "" : "bg-white/1"}`}>
                        <td className="px-5 py-3 text-xs text-white/50">{row.label[languageKey]}</td>
                        {TIER_ORDER.map((tier) => {
                          const value = row[tier];
                          const tierMeta = PLAN_META[tier];
                          return (
                            <td key={tier} className="px-4 py-3 text-center text-xs">
                              {typeof value === "boolean" ? (
                                value ? (
                                  <Check size={13} className={`mx-auto ${tierMeta.accentColor}`} />
                                ) : (
                                  <X size={13} className="mx-auto text-white/12" />
                                )
                              ) : (
                                <span className={`${tierMeta.accentColor} opacity-80`}>{value}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 支付方式 */}
        <div className="mb-14 border border-white/8 bg-white/2 p-6">
          <div className="mb-5 flex items-center gap-2">
            <CreditCard size={13} className="text-white/35" />
            <h3 className="text-sm font-medium text-white/50">{pickText(isChinese, "支持的支付方式", "Supported Payment Methods")}</h3>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {PAYMENT_PROVIDERS.map((provider) => (
              <div
                key={provider.id}
                className={`relative flex flex-col items-center gap-1.5 border px-3 py-3 text-center ${
                  provider.available ? "cursor-pointer border-white/15 hover:border-white/30" : "border-white/6 opacity-40"
                }`}
              >
                <span className={`text-sm font-medium ${provider.color}`}>{provider.name[languageKey]}</span>
                <span className="text-[10px] text-white/25">{provider.currencies.join(" / ")}</span>
                {!provider.available && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-[9px] tracking-widest text-white/25">
                    {pickText(isChinese, "接入中", "SOON")}
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-white/18">
            {pickText(
              isChinese,
              "支付接口正在接入中。目前可通过联系客服微信完成手动支付，24 小时内激活订阅。",
              "Payment integrations are in progress. Contact support for manual payment and your subscription will be activated within 24 hours."
            )}
          </p>
        </div>

        {/* 常见问题 */}
        <div className="mx-auto max-w-2xl">
          <h3 className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-white/35">{pickText(isChinese, "常见问题", "FAQ")}</h3>
          <div className="flex flex-col gap-5">
            {[
              {
                q: pickText(isChinese, "各版本的核心区别是什么？", "What's the key difference between plans?"),
                a: pickText(
                  isChinese,
                  "免费版适合体验；入门版适合个人轻度使用（5万 tokens/月）；专业版面向高频用户（50万 tokens/月 + 内容平台 30篇/月）；旗舰版提供无限使用、品牌战略报告和专属客户经理。",
                  "Free tier for trial; Starter for light personal use (50K tokens/mo); Pro for power users (500K tokens/mo + 30 content/month); Flagship adds unlimited usage, brand strategy reports, and dedicated manager."
                ),
              },
              {
                q: pickText(isChinese, "tokens 是什么？如何计算？", "What are tokens? How are they calculated?"),
                a: pickText(
                  isChinese,
                  "Token 是 AI 模型的计算单位。约等于 1 个中文汉字 = 2 tokens，1 个英文单词 = 1.5 tokens。一次典型对话约消耗 1000-2000 tokens。我们使用高效的 CLI 压缩技术，实际消耗更低。",
                  "Token is the computing unit of AI models. ~1 Chinese character = 2 tokens, ~1 English word = 1.5 tokens. A typical conversation uses 1000-2000 tokens. We use efficient CLI compression to reduce actual consumption."
                ),
              },
              {
                q: pickText(isChinese, "年付和月付哪个更划算？", "Is annual or monthly billing better?"),
                a: pickText(
                  isChinese,
                  "年付比月付节省 17%。专业版年付 ¥1,980，月均仅 ¥165，相当于每天不到 6 元。",
                  "Annual billing saves 17% vs monthly. Pro annual at ¥1,980 = ¥165/mo, less than $6/day."
                ),
              },
              {
                q: pickText(isChinese, "可以随时取消订阅吗？", "Can I cancel anytime?"),
                a: pickText(
                  isChinese,
                  "可以。取消后当前计费周期内仍可正常使用，到期后自动降回免费版。",
                  "Yes. After cancellation, access continues until the end of the billing cycle and then returns to the free plan."
                ),
              },
              {
                q: pickText(isChinese, "为什么定价这么低？", "Why is the pricing so low?"),
                a: pickText(
                  isChinese,
                  "我们采用极致的 Token 优化技术（CLI 压缩 + 语义缓存），将 API 成本降低 60-80%，并将节省的部分让利给用户，实现 100-200 倍的合理加价率。",
                  "We use extreme token optimization (CLI compression + semantic cache) to reduce API costs by 60-80%, passing the savings to users with a 100-200x reasonable markup."
                ),
              },
            ].map((item, idx) => (
              <div key={idx} className="border-b border-white/5 pb-5">
                <p className="mb-2 text-sm font-medium text-white/60">{item.q}</p>
                <p className="text-sm leading-relaxed text-white/30">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 支付弹窗 */}
      {showPaymentModal && selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md border border-white/12 bg-[#0F0F0F]">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="text-base">{PLAN_META[selectedTier].badge}</span>
                <h3 className="text-sm font-semibold text-white">
                  {pickText(
                    isChinese,
                    `${PLAN_META[selectedTier].name.zh} · ${BILLING_CYCLE_LABELS[cycle].zh}`,
                    `${PLAN_META[selectedTier].name.en} · ${BILLING_CYCLE_LABELS[cycle].en}`
                  )}
                </h3>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-xl leading-none text-white/25 transition-colors hover:text-white/55">
                ×
              </button>
            </div>

            <div className="border-b border-white/8 bg-white/2 px-5 py-4">
              {(() => {
                const pricing = getCyclePrice(selectedTier);
                const limits = PLAN_LIMITS[selectedTier];
                return (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">{pickText(isChinese, "方案", "Plan")}</span>
                      <span className={PLAN_META[selectedTier].accentColor}>{PLAN_META[selectedTier].name[languageKey]}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">{pickText(isChinese, "计费周期", "Billing")}</span>
                      <span className="text-white/65">{BILLING_CYCLE_LABELS[cycle][languageKey]}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">{pickText(isChinese, "每月 tokens", "Monthly tokens")}</span>
                      <span className="text-white/65">{formatTokens(limits.monthlyTokens)}</span>
                    </div>
                    {limits.monthlyContentQuota > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">{pickText(isChinese, "内容生产配额", "Content quota")}</span>
                        <span className="text-white/65">{limits.monthlyContentQuota}篇/月</span>
                      </div>
                    )}
                    <div className="mt-1 flex justify-between border-t border-white/8 pt-2 text-sm font-semibold">
                      <span className="text-white/60">{pickText(isChinese, "合计", "Total")}</span>
                      <span className={`text-lg ${PLAN_META[selectedTier].accentColor}`}>{formatPrice(pricing.total, currency, isChinese)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="px-5 py-4">
              <p className="mb-3 text-xs text-white/30">{pickText(isChinese, "选择支付方式", "Choose payment method")}</p>
              <div className="flex flex-col gap-2">
                {PAYMENT_PROVIDERS.filter((provider) => provider.currencies.includes(currency)).map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleCreateOrder(provider.id)}
                    disabled={!provider.available || createOrderMutation.isPending}
                    className={`flex items-center justify-between border px-4 py-3 text-sm transition-all ${
                      provider.available
                        ? "border-white/12 text-white/65 hover:border-white/28 hover:text-white/85"
                        : "cursor-not-allowed border-white/6 text-white/20"
                    }`}
                  >
                    <span className={provider.color}>{provider.name[languageKey]}</span>
                    {!provider.available && <span className="text-[9px] tracking-widest text-white/20">{pickText(isChinese, "接入中", "COMING SOON")}</span>}
                    {provider.available && createOrderMutation.isPending && <Loader2 size={12} className="animate-spin text-white/35" />}
                  </button>
                ))}
              </div>

              <div className="mt-4 border border-[#C9A84C]/15 bg-[#C9A84C]/5 p-3">
                <p className="text-xs leading-relaxed text-white/35">
                  {pickText(
                    isChinese,
                    "支付接口接入中。如需立即开通，请联系客服微信，提供订单信息，24 小时内激活。",
                    "Payment integrations are still being connected. If you need immediate activation, contact support with your order details and it will be activated within 24 hours."
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