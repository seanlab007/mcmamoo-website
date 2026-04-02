/**
 * MaoAI Pricing Page — High-end tier with anchor pricing
 * - Auto-detects browser language → CNY (zh) or USD (non-zh)
 * - Billing cycles: monthly / biannual / annual / lifetime
 * - Anchor pricing: highlight savings vs. monthly
 * - Feature comparison table grouped by category
 * - Payment provider stubs with coming-soon overlay
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
  Infinity,
  Star,
  LayoutGrid,
} from "lucide-react";
import type { BillingCycle, Currency, PlanTier } from "@shared/plans";
import {
  BILLING_CYCLE_LABELS,
  FEATURE_ROWS,
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

const FEATURE_CATEGORY_LABELS: Record<string, { zh: string; en: string }> = {
  "AI 对话": { zh: "AI 对话", en: "AI Chat" },
  "图像生成": { zh: "图像生成", en: "Image Generation" },
  "文件与数据": { zh: "文件与数据", en: "Files & Data" },
  "历史与存储": { zh: "历史与存储", en: "History & Storage" },
  "API 与集成": { zh: "API 与集成", en: "API & Integrations" },
  "品牌全案服务": { zh: "品牌全案服务", en: "Flagship Services" },
  "客服支持": { zh: "客服支持", en: "Support" },
  "猫眼自动内容平台": { zh: "猫眼自动内容平台", en: "MaoAI Content Platform" },
  其他: { zh: "其他", en: "Other" },
  Other: { zh: "其他", en: "Other" },
};

const FEATURE_VALUE_LABELS: Record<string, { zh: string; en: string }> = {
  "100 次/天": { zh: "100 次/天", en: "100/day" },
  "1,000 次/天": { zh: "1,000 次/天", en: "1,000/day" },
  "无限制": { zh: "无限制", en: "Unlimited" },
  "5 次/天": { zh: "5 次/天", en: "5/day" },
  "最近 50 条": { zh: "最近 50 条", en: "Latest 50" },
  "1 席": { zh: "1 席", en: "1 seat" },
  "3 席": { zh: "3 席", en: "3 seats" },
  "10 席": { zh: "10 席", en: "10 seats" },
  "社区论坛": { zh: "社区论坛", en: "Community forum" },
  "邮件优先响应": { zh: "邮件优先响应", en: "Priority email support" },
  "专属 1v1 微信": { zh: "专属 1v1 微信", en: "Dedicated 1:1 WeChat" },
  "不包含": { zh: "不包含", en: "Not included" },
  "50 篇/月": { zh: "50 篇/月", en: "50/month" },
  "小红书、微博": { zh: "小红书、微博", en: "Xiaohongshu, Weibo" },
  "小红书、抖音、微博、微信公众号": {
    zh: "小红书、抖音、微博、微信公众号",
    en: "Xiaohongshu, Douyin, Weibo, WeChat Official Accounts",
  },
  "—": { zh: "—", en: "—" },
};

const TIER_ORDER: PlanTier[] = ["starter", "pro", "flagship"];
const CYCLE_ORDER: BillingCycle[] = ["monthly", "biannual", "annual", "lifetime"];

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

function translateFeatureValue(value: string, isChinese: boolean): string {
  const label = FEATURE_VALUE_LABELS[value];
  return label ? pickText(isChinese, label.zh, label.en) : value;
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
            <span>MAOAI PRICING</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
            {pickText(isChinese, "选择你的 AI 战略方案", "Choose Your AI Plan")}
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-white/35">
            {pickText(
              isChinese,
              "从个人创作到品牌全案，MaoAI 为不同阶段的你提供精准匹配的 AI 能力",
              "From personal creation to full brand strategy, MaoAI scales with you."
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

        <div className="mx-auto mb-12 flex w-fit items-center justify-center gap-1 border border-white/8 bg-white/3 p-1">
          {CYCLE_ORDER.map((itemCycle) => {
            const label = BILLING_CYCLE_LABELS[itemCycle][languageKey];
            const saving = itemCycle === "biannual" ? 5 : itemCycle === "annual" ? 17 : null;
            const isActive = cycle === itemCycle;
            return (
              <button
                key={itemCycle}
                onClick={() => setCycle(itemCycle)}
                className={`relative flex items-center gap-1.5 px-4 py-2 text-xs transition-all ${
                  isActive
                    ? itemCycle === "lifetime"
                      ? "border border-purple-500/30 bg-purple-500/20 text-purple-300"
                      : "border border-[#C9A84C]/30 bg-[#C9A84C]/15 text-[#C9A84C]"
                    : "text-white/35 hover:text-white/60"
                }`}
              >
                {itemCycle === "lifetime" && <Infinity size={10} />}
                <span>{label}</span>
                {saving && isActive && (
                  <span className="border border-green-500/20 bg-green-500/20 px-1 py-0.5 text-[9px] text-green-400/80">-{saving}%</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mb-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TIER_ORDER.map((tier) => {
            const meta = PLAN_META[tier];
            const limits = PLAN_LIMITS[tier];
            const pricing = getCyclePrice(tier);
            const isHighlighted = meta.highlighted;
            const isCurrentPlan = currentTier === tier;

            return (
              <div
                key={tier}
                className={`relative flex flex-col border p-7 ${meta.accentBorder} ${meta.accentBg} ${
                  isHighlighted ? "ring-1 ring-[#C9A84C]/20 shadow-lg shadow-[#C9A84C]/5" : ""
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#C9A84C] px-4 py-1 text-[10px] font-bold tracking-widest text-black">
                    {pickText(isChinese, "最受欢迎", "MOST POPULAR")}
                  </div>
                )}
                {tier === "flagship" && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-purple-500/80 px-4 py-1 text-[10px] font-bold tracking-widest text-white">
                    {pickText(isChinese, "品牌全案", "FULL BRAND")}
                  </div>
                )}

                <div className="mb-6">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xl">{meta.badge}</span>
                    <h2 className={`text-lg font-bold ${meta.accentColor}`}>{meta.name[languageKey]}</h2>
                  </div>
                  <p className="text-xs leading-relaxed text-white/35">{meta.tagline[languageKey]}</p>
                </div>

                <div className="mb-6 border-b border-white/8 pb-6">
                  {cycle === "lifetime" ? (
                    <div>
                      <div className="mb-1 flex items-baseline gap-1">
                        <span className={`text-4xl font-bold ${meta.accentColor}`}>{formatPrice(pricing.total, currency, isChinese)}</span>
                      </div>
                      <p className="text-xs text-white/25">{pickText(isChinese, "终身买断 · 一次付清", "One-time payment · Lifetime access")}</p>
                      <p className="mt-1 text-xs text-white/20">
                        {pickText(isChinese, "相当于", "Equivalent to")} {formatPrice(Math.round(pricing.total / 36), currency, isChinese, true)} {pickText(isChinese, "× 3年", "× 3 years")}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="mb-1 flex items-baseline gap-1">
                        <span className={`text-4xl font-bold ${meta.accentColor}`}>{formatPrice(pricing.perMonth, currency, isChinese)}</span>
                        <span className="text-sm text-white/25">{pickText(isChinese, "/月", "/mo")}</span>
                      </div>
                      {cycle !== "monthly" && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-white/25 line-through">{formatPrice(PLAN_PRICES[tier][currency].monthly.perMonth, currency, isChinese, true)}</span>
                          <span className="border border-green-500/20 bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-400/80">
                            {pricing.anchorLabel?.[languageKey]}
                          </span>
                        </div>
                      )}
                      <p className="mt-2 text-xs text-white/20">
                        {cycle === "biannual"
                          ? pickText(isChinese, `按半年付 ¥${pricing.total.toLocaleString()}`, `Billed $${pricing.total.toFixed(2)} every 6 months`)
                          : pickText(isChinese, `按年付 ¥${pricing.total.toLocaleString()}`, `Billed $${pricing.total.toFixed(2)} annually`)}
                      </p>
                    </div>
                  )}
                </div>

                <ul className="mb-8 flex flex-1 flex-col gap-3">
                  {[
                    {
                      text: pickText(
                        isChinese,
                        `每日对话 ${limits.dailyChatMessages === -1 ? "无限次" : `${limits.dailyChatMessages} 次`}`,
                        `${limits.dailyChatMessages === -1 ? "Unlimited" : limits.dailyChatMessages} chats/day`
                      ),
                      ok: true,
                    },
                    {
                      text: pickText(
                        isChinese,
                        `图像生成 ${limits.dailyImageGenerations === -1 ? "无限次" : `${limits.dailyImageGenerations} 次/天`}`,
                        `${limits.dailyImageGenerations === -1 ? "Unlimited" : limits.dailyImageGenerations} images/day`
                      ),
                      ok: limits.imageGeneration,
                    },
                    {
                      text: pickText(isChinese, "高级模型（R1、GLM-4 Plus）", "Premium models (R1, GLM-4+)"),
                      ok: limits.premiumModels,
                    },
                    {
                      text: pickText(isChinese, `团队席位 ${limits.teamSeats} 个`, `${limits.teamSeats} team seats`),
                      ok: true,
                    },
                    {
                      text: pickText(isChinese, "品牌战略 AI 报告 + 专属顾问", "Brand strategy AI report + account manager"),
                      ok: limits.brandStrategy,
                    },
                    {
                      text:
                        limits.contentQuota === 0
                          ? pickText(isChinese, "猫眼增长引擎 Mc&Mamoo Growth Engine 内容平台（不含）", "Mc&Mamoo Growth Engine content platform (not included)")
                          : limits.contentQuota === -1
                            ? pickText(isChinese, "猫眼增长引擎 Mc&Mamoo Growth Engine 内容平台 · 无限生产 · 全平台", "Mc&Mamoo Growth Engine content platform · Unlimited · All channels")
                            : pickText(
                                isChinese,
                                `猫眼增长引擎 Mc&Mamoo Growth Engine 内容平台 · ${limits.contentQuota} 篇/月 · ${limits.contentPlatforms.length} 个平台`,
                                `Mc&Mamoo Growth Engine content platform · ${limits.contentQuota}/month · ${limits.contentPlatforms.length} channels`
                              ),
                      ok: limits.contentPlatform,
                      highlight: limits.contentPlatform,
                    },
                  ].map((item, idx) => (
                    <li
                      key={idx}
                      className={`flex items-start gap-2.5 text-xs ${item.ok ? (item.highlight ? "text-[#40d090]/90" : "text-white/70") : "text-white/20"}`}
                    >
                      {item.ok ? (
                        <Check size={13} className={`${item.highlight ? "text-[#40d090]" : meta.accentColor} mt-0.5 shrink-0`} />
                      ) : (
                        <X size={13} className="mt-0.5 shrink-0 text-white/15" />
                      )}
                      <span className={item.ok ? "" : "line-through"}>{item.text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(tier)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                    isHighlighted
                      ? "bg-[#C9A84C] text-black hover:bg-[#C9A84C]/90"
                      : tier === "flagship"
                        ? "border border-purple-500/50 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                        : "border border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20"
                  }`}
                >
                  {isCurrentPlan
                    ? pickText(isChinese, "当前方案", "Current Plan")
                    : cycle === "lifetime"
                      ? pickText(isChinese, `买断 ${meta.name.zh}`, `Get ${meta.name.en} Lifetime`)
                      : pickText(isChinese, `选择 ${meta.name.zh}`, `Get ${meta.name.en}`)}
                </button>

                {tier === "flagship" && cycle === "monthly" && (
                  <p className="mt-2 text-center text-[10px] text-white/20">
                    {pickText(isChinese, "年付仅 ¥9,980 · 省 ¥1,996", "Annual plan: $1,399.99 · Save $268")}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mb-14 border border-[#C9A84C]/15 bg-[#C9A84C]/3 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Crown size={14} className="text-[#C9A84C]/60" />
            <h3 className="text-sm font-medium tracking-wide text-[#C9A84C]/70">{pickText(isChinese, "旗舰版价格参考", "Flagship Pricing Reference")}</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CYCLE_ORDER.map((itemCycle) => {
              const pricing = PLAN_PRICES.flagship[currency][itemCycle];
              const isSelected = cycle === itemCycle;
              return (
                <button
                  key={itemCycle}
                  onClick={() => setCycle(itemCycle)}
                  className={`flex flex-col items-center border p-4 transition-all ${
                    isSelected ? "border-[#C9A84C]/40 bg-[#C9A84C]/10" : "border-white/8 hover:border-white/20"
                  }`}
                >
                  <span className="mb-2 text-[10px] tracking-wide text-white/40">{BILLING_CYCLE_LABELS[itemCycle][languageKey].toUpperCase()}</span>
                  <span className={`text-xl font-bold ${isSelected ? "text-[#C9A84C]" : "text-white/70"}`}>{formatPrice(pricing.total, currency, isChinese)}</span>
                  {itemCycle !== "monthly" && itemCycle !== "lifetime" && (
                    <span className="mt-1 text-[10px] text-green-400/60">{formatPrice(pricing.perMonth, currency, isChinese, true)}</span>
                  )}
                  {itemCycle === "lifetime" && <span className="mt-1 text-[10px] text-purple-400/60">{pickText(isChinese, "永久使用", "Forever")}</span>}
                  {pricing.anchorLabel && <span className="mt-1 text-[9px] text-green-400/50">{pricing.anchorLabel[languageKey]}</span>}
                </button>
              );
            })}
          </div>
        </div>

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
            <table className="min-w-[600px] w-full text-sm">
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
                      <td colSpan={4} className="px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">
                        {translateCategoryLabel(category, isChinese)}
                      </td>
                    </tr>
                    {rows.map((row, idx) => (
                      <tr key={row.key} className={`border-b border-white/5 ${idx % 2 === 0 ? "" : "bg-white/1"}`}>
                        <td className="px-5 py-3 text-xs text-white/50">{row.label[languageKey]}</td>
                        {TIER_ORDER.map((tier) => {
                          const value = row[tier];
                          return (
                            <td key={tier} className="px-4 py-3 text-center text-xs">
                              {typeof value === "boolean" ? (
                                value ? (
                                  <Check size={13} className={`mx-auto ${PLAN_META[tier].accentColor}`} />
                                ) : (
                                  <X size={13} className="mx-auto text-white/12" />
                                )
                              ) : (
                                <span className={`${PLAN_META[tier].accentColor} opacity-80`}>{translateFeatureValue(value, isChinese)}</span>
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

        <div className="mx-auto max-w-2xl">
          <h3 className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-white/35">{pickText(isChinese, "常见问题", "FAQ")}</h3>
          <div className="flex flex-col gap-5">
            {[
              {
                q: pickText(isChinese, "各版本的核心区别是什么？", "What's the key difference between plans?"),
                a: pickText(
                  isChinese,
                  "入门版适合个人轻度使用，专业版面向高频用户和团队，旗舰版提供无限次使用、品牌战略 AI 报告和专属客户经理，适合企业和品牌方。",
                  "Starter suits light personal use, Pro is for power users and teams, and Flagship adds unlimited usage, brand strategy AI reports, and a dedicated account manager for enterprises."
                ),
              },
              {
                q: pickText(isChinese, "年付和终身买断哪个更划算？", "Is annual or lifetime better value?"),
                a: pickText(
                  isChinese,
                  "年付比月付节省约 17%。终身买断约等于 3 年月付总价，如果你计划长期使用，终身版通常更划算。",
                  "Annual billing saves about 17% versus monthly. Lifetime pricing is roughly equal to three years of monthly payments, so it is usually better value for long-term use."
                ),
              },
              {
                q: pickText(isChinese, "品牌全案旗舰版包含哪些专属服务？", "What exclusive services does Flagship include?"),
                a: pickText(
                  isChinese,
                  "旗舰版提供无限次 AI 对话和图像生成、品牌战略 AI 分析报告、专属客户经理、团队席位和最高优先级响应。",
                  "Flagship includes unlimited AI chat and image generation, brand strategy AI reports, a dedicated account manager, team seats, and the highest-priority response queue."
                ),
              },
              {
                q: pickText(isChinese, "可以随时取消订阅吗？", "Can I cancel anytime?"),
                a: pickText(
                  isChinese,
                  "可以。取消后当前计费周期内仍可正常使用，到期后自动降回免费版。终身版一经购买不可退款。",
                  "Yes. After cancellation, access continues until the end of the billing cycle and then returns to the free plan. Lifetime purchases are non-refundable."
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
                    {cycle !== "lifetime" && (
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">{pickText(isChinese, "月均费用", "Per month")}</span>
                        <span className="text-white/65">{formatPrice(pricing.perMonth, currency, isChinese)}</span>
                      </div>
                    )}
                    <div className="mt-1 flex justify-between border-t border-white/8 pt-2 text-sm font-semibold">
                      <span className="text-white/60">{pickText(isChinese, "合计", "Total")}</span>
                      <span className={`text-lg ${PLAN_META[selectedTier].accentColor}`}>{formatPrice(pricing.total, currency, isChinese)}</span>
                    </div>
                    {pricing.anchorLabel && (
                      <div className="text-right">
                        <span className="text-[10px] text-green-400/60">{pricing.anchorLabel[languageKey]}</span>
                      </div>
                    )}
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
