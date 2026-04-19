/**
 * PaymentModal — 通用支付弹窗组件
 *
 * 适用于所有 mcmamoo 收费板块：
 *   - MaoAI 订阅（starter / pro / flagship）
 *   - OpenClaw 订阅（free / pro / team）
 *   - 万年钟购买/定制
 *   - 品牌全案咨询
 *   - 毛智库战略咨询
 *
 * 使用方式：
 *   <PaymentModal
 *     open={showPayment}
 *     onClose={() => setShowPayment(false)}
 *     product={{ id: "openclaw_pro", name: "小龙虾 AI 专业版", amount: 199, currency: "CNY", description: "年付 · 无限消息 · 全模型" }}
 *   />
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, CreditCard, CheckCircle2, Copy, X, ExternalLink } from "lucide-react";

export type PaymentCurrency = "CNY" | "USD";

export interface PaymentProduct {
  /** 内部产品 ID，用于订单记录 */
  id: string;
  /** 展示名称 */
  name: string;
  /** 金额（单位：元/美元） */
  amount: number;
  /** 货币 */
  currency: PaymentCurrency;
  /** 简短描述（显示在订单摘要中） */
  description?: string;
  /** 计费周期标签（可选） */
  billingLabel?: string;
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  product: PaymentProduct;
  /** 支付成功后的回调（可选） */
  onSuccess?: (orderId: string) => void;
}

// ─── 支付方式配置 ─────────────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    id: "alipay",
    name: { CNY: "支付宝", USD: "Alipay" },
    icon: "💙",
    color: "text-blue-400",
    border: "border-blue-400/20 hover:border-blue-400/50",
    currencies: ["CNY"] as PaymentCurrency[],
    available: false,
  },
  {
    id: "wechatpay",
    name: { CNY: "微信支付", USD: "WeChat Pay" },
    icon: "💚",
    color: "text-green-400",
    border: "border-green-400/20 hover:border-green-400/50",
    currencies: ["CNY"] as PaymentCurrency[],
    available: false,
  },
  {
    id: "lianpay",
    name: { CNY: "连连支付", USD: "LianLian Pay" },
    icon: "🟠",
    color: "text-orange-400",
    border: "border-orange-400/20 hover:border-orange-400/50",
    currencies: ["CNY", "USD"] as PaymentCurrency[],
    available: false,
  },
  {
    id: "paypal",
    name: { CNY: "PayPal", USD: "PayPal" },
    icon: "🔵",
    color: "text-sky-400",
    border: "border-sky-400/20 hover:border-sky-400/50",
    currencies: ["USD"] as PaymentCurrency[],
    available: false,
  },
  {
    id: "stripe",
    name: { CNY: "Stripe", USD: "Stripe" },
    icon: "🟣",
    color: "text-violet-400",
    border: "border-violet-400/20 hover:border-violet-400/50",
    currencies: ["USD"] as PaymentCurrency[],
    available: false,
  },
];

// 客服微信（手动支付）
const WECHAT_SERVICE = "mcmamoo_service";

export default function PaymentModal({ open, onClose, product, onSuccess }: PaymentModalProps) {
  const [step, setStep] = useState<"select" | "pending" | "success">("select");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const createOrderMutation = trpc.billing.createOrder.useMutation();

  if (!open) return null;

  const isCNY = product.currency === "CNY";
  const filteredMethods = PAYMENT_METHODS.filter(m => m.currencies.includes(product.currency));

  const handlePaymentMethod = async (methodId: string) => {
    try {
      const result = await createOrderMutation.mutateAsync({
        plan: "content", // generic product order
        amount: product.amount,
      });
      setOrderId(result ? String((result as any).id ?? (result as any).orderId ?? `ORD-${Date.now()}`) : `ORD-${Date.now()}`);
      setStep("pending");
    } catch {
      // Fallback: show manual payment step anyway
      setOrderId(`ORD-${Date.now()}`);
      setStep("pending");
    }
  };

  const handleManualPayment = () => {
    setOrderId(`ORD-${Date.now()}`);
    setStep("pending");
  };

  const copyOrderId = () => {
    if (orderId) {
      navigator.clipboard.writeText(orderId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleConfirmPaid = () => {
    setStep("success");
    onSuccess?.(orderId ?? "");
  };

  const handleClose = () => {
    setStep("select");
    setOrderId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0F0F0F] border border-white/12 w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <CreditCard size={14} className="text-[#C9A84C]/70" />
            <span className="text-white/80 font-medium text-sm">
              {step === "select" ? "选择支付方式" : step === "pending" ? "完成支付" : "支付成功"}
            </span>
          </div>
          <button onClick={handleClose} className="text-white/25 hover:text-white/60 transition-colors text-xl leading-none">×</button>
        </div>

        {/* Order summary */}
        <div className="px-5 py-4 border-b border-white/6 bg-white/2">
          <div className="flex justify-between items-start mb-1">
            <div>
              <p className="text-white/80 text-sm font-medium">{product.name}</p>
              {product.description && <p className="text-white/35 text-xs mt-0.5">{product.description}</p>}
              {product.billingLabel && <p className="text-white/25 text-[10px] mt-0.5">{product.billingLabel}</p>}
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="text-[#C9A84C] text-xl font-bold">
                {isCNY ? `¥${product.amount.toLocaleString()}` : `$${product.amount.toFixed(2)}`}
              </p>
            </div>
          </div>
        </div>

        {/* ── Step: Select payment method ── */}
        {step === "select" && (
          <div className="px-5 py-5">
            <p className="text-white/30 text-xs mb-4">
              {isCNY ? "选择支付方式" : "Choose payment method"}
            </p>

            {/* Online payment methods (coming soon) */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {filteredMethods.map(m => (
                <button
                  key={m.id}
                  onClick={() => handlePaymentMethod(m.id)}
                  disabled={!m.available || createOrderMutation.isPending}
                  className={`relative flex items-center gap-2 px-3 py-3 border text-sm transition-all ${
                    m.available
                      ? `${m.border} text-white/70 hover:text-white/90 cursor-pointer`
                      : "border-white/6 text-white/20 cursor-not-allowed"
                  }`}
                >
                  <span>{m.icon}</span>
                  <span className={m.available ? m.color : ""}>{m.name[product.currency]}</span>
                  {!m.available && (
                    <span className="absolute top-1 right-1 text-[8px] text-white/15 tracking-widest">接入中</span>
                  )}
                  {createOrderMutation.isPending && m.available && (
                    <Loader2 size={11} className="animate-spin ml-auto" />
                  )}
                </button>
              ))}
            </div>

            {/* Manual payment via WeChat */}
            <div className="border border-[#C9A84C]/20 bg-[#C9A84C]/3 p-4">
              <p className="text-[#C9A84C]/70 text-xs font-medium mb-2">
                💬 {isCNY ? "微信人工支付（立即可用）" : "Manual Payment via WeChat (Available Now)"}
              </p>
              <p className="text-white/35 text-xs leading-relaxed mb-3">
                {isCNY
                  ? "添加客服微信，发送截图确认订单，24 小时内激活服务。"
                  : "Add our WeChat support, send payment screenshot, service activated within 24 hours."}
              </p>
              <button
                onClick={handleManualPayment}
                className="w-full py-2.5 bg-[#C9A84C]/15 border border-[#C9A84C]/40 text-[#C9A84C] text-sm hover:bg-[#C9A84C]/25 transition-all"
              >
                {isCNY ? "微信联系客服支付 →" : "Pay via WeChat Support →"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Pending / Manual payment instructions ── */}
        {step === "pending" && (
          <div className="px-5 py-5">
            <div className="mb-5">
              <p className="text-white/50 text-xs mb-1">{isCNY ? "订单号" : "Order ID"}</p>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2">
                <code className="text-[#C9A84C]/80 text-sm font-mono flex-1">{orderId}</code>
                <button onClick={copyOrderId} className="text-white/30 hover:text-white/60 transition-colors">
                  {copied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[#C9A84C] text-[10px] font-bold">1</span>
                </div>
                <div>
                  <p className="text-white/65 text-xs font-medium mb-0.5">
                    {isCNY ? "添加客服微信" : "Add WeChat Support"}
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="text-[#C9A84C]/70 text-xs font-mono bg-white/5 px-2 py-0.5">{WECHAT_SERVICE}</code>
                    <button
                      onClick={() => navigator.clipboard.writeText(WECHAT_SERVICE)}
                      className="text-white/25 hover:text-white/50 transition-colors"
                    >
                      <Copy size={11} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[#C9A84C] text-[10px] font-bold">2</span>
                </div>
                <p className="text-white/50 text-xs leading-relaxed">
                  {isCNY
                    ? `发送订单号 ${orderId} 和支付截图，告知购买的产品：「${product.name}」`
                    : `Send order ID ${orderId} and payment screenshot, mention product: "${product.name}"`}
                </p>
              </div>

              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/40 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[#C9A84C] text-[10px] font-bold">3</span>
                </div>
                <p className="text-white/50 text-xs leading-relaxed">
                  {isCNY ? "客服确认后 24 小时内激活服务" : "Service activated within 24 hours after confirmation"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmPaid}
                className="flex-1 py-2.5 bg-[#C9A84C]/15 border border-[#C9A84C]/40 text-[#C9A84C] text-sm hover:bg-[#C9A84C]/25 transition-all"
              >
                {isCNY ? "我已联系客服" : "I've contacted support"}
              </button>
              <button
                onClick={() => setStep("select")}
                className="px-4 py-2.5 border border-white/10 text-white/30 text-sm hover:text-white/50 hover:border-white/20 transition-all"
              >
                {isCNY ? "返回" : "Back"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Success ── */}
        {step === "success" && (
          <div className="px-5 py-8 text-center">
            <CheckCircle2 size={40} className="text-[#C9A84C] mx-auto mb-4" />
            <h3 className="text-white font-semibold text-base mb-2">
              {isCNY ? "感谢您的购买！" : "Thank you for your purchase!"}
            </h3>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              {isCNY
                ? "客服将在 24 小时内为您激活服务。如有问题，请保留订单号联系我们。"
                : "Our team will activate your service within 24 hours. Keep your order ID for reference."}
            </p>
            <div className="bg-white/5 border border-white/8 px-3 py-2 mb-6 text-left">
              <p className="text-white/25 text-[10px] mb-1">{isCNY ? "订单号" : "Order ID"}</p>
              <code className="text-[#C9A84C]/70 text-xs font-mono">{orderId}</code>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-2.5 bg-[#C9A84C]/15 border border-[#C9A84C]/40 text-[#C9A84C] text-sm hover:bg-[#C9A84C]/25 transition-all"
            >
              {isCNY ? "完成" : "Done"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
