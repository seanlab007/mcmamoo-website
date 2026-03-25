/*
 * Contact Section — Contact Us
 * i18n: full bilingual support
 */
import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Phone, Globe, Mail, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { submitContact } from "@/lib/supabase";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import PaymentModal, { type PaymentProduct } from "@/components/PaymentModal";

const CONTACT_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/contact-bg-8krYjvmedEVGPfhYr9X7Co.webp";

export default function Contact() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", message: "" });
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const [isPending, setIsPending] = useState(false);
  const [paymentProduct, setPaymentProduct] = useState<PaymentProduct | null>(null);
  const isCNY = typeof navigator !== "undefined" && navigator.language.startsWith("zh");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await submitContact({
        name: form.name,
        company: form.company,
        phone: form.phone,
        message: form.message || undefined,
        email: form.email || undefined,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("[Contact] Submit error:", err);
      toast.error(isEn ? "Submission failed. Please try again or call us directly." : "提交失败，请稍后重试或直接拨打联系电话");
    } finally {
      setIsPending(false);
    }
  };

  const contactItems = isEn
    ? [
        { icon: Phone, label: "Phone", value: "+86 137 6459 7723" },
        { icon: Mail, label: "Email", value: "sean@mcmamoo.com" },
        { icon: Globe, label: "Website", value: "www.mcmamoo.com" },
        { icon: MapPin, label: "Location", value: "Shanghai, China" },
      ]
    : [
        { icon: Phone, label: "联系电话", value: "+86 137 6459 7723" },
        { icon: Mail, label: "电子邮箱", value: "sean@mcmamoo.com" },
        { icon: Globe, label: "官方网站", value: "www.mcmamoo.com" },
        { icon: MapPin, label: "公司地址", value: "上海" },
      ];

  const formFields = isEn
    ? [
        { key: "name", label: "Your Name *", placeholder: "Enter your name" },
        { key: "company", label: "Company Name *", placeholder: "Enter your company name" },
        { key: "phone", label: "Phone Number *", placeholder: "Enter your phone number" },
        { key: "email", label: "Email (Optional)", placeholder: "You will receive a confirmation email", required: false },
      ]
    : [
        { key: "name", label: "您的姓名 *", placeholder: "请输入姓名" },
        { key: "company", label: "公司名称 *", placeholder: "请输入公司名称" },
        { key: "phone", label: "联系电话 *", placeholder: "请输入手机号码" },
        { key: "email", label: "电子邮箱（选填）", placeholder: "填写后将收到确认邮件", required: false },
      ];

  return (
    <section id="contact" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${CONTACT_BG})` }} />
      <div className="absolute inset-0 bg-[#0A0A0A]/96" />

      <div className="relative z-10 container">
        {/* Header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="section-label mb-4">08 — Contact</div>
          <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold mb-4">
            {isEn ? "Contact Us" : "联系我们"}
          </h2>
          <p className="text-white/50 max-w-xl text-base leading-relaxed">
            {isEn
              ? "If you are looking for a partner who can truly help you build explosive products and achieve strategic breakthroughs, we welcome your inquiry."
              : "如果您正在寻找一家能够真正帮助您打造爆品、实现战略破局的合作伙伴，欢迎与我们联系。"}
          </p>
        </div>

        <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal grid lg:grid-cols-2 gap-16">
          {/* Left: Contact info */}
          <div>
            <div className="text-white/40 text-xs tracking-widest uppercase mb-8 font-['DM_Mono']">
              {isEn ? "Contact Information" : "联系方式"}
            </div>

            <div className="space-y-6 mb-12">
              {contactItems.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-5 group">
                  <div className="w-10 h-10 border border-white/10 flex items-center justify-center group-hover:border-[#C9A84C]/50 transition-colors flex-shrink-0">
                    <Icon size={16} className="text-[#C9A84C]/60 group-hover:text-[#C9A84C] transition-colors" />
                  </div>
                  <div>
                    <div className="text-white/30 text-xs font-['DM_Mono'] mb-0.5">{label}</div>
                    <div className="text-white/80 text-sm">{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Business card QR code */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-6 p-5 border border-[#C9A84C]/25 bg-[#C9A84C]/5 hover:border-[#C9A84C]/50 transition-all duration-300">
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-1 border border-[#C9A84C]/40" />
                  <div className="absolute -inset-2 border border-[#C9A84C]/15" />
                  <div className="p-2 bg-[#0A0A0A] border-2 border-[#C9A84C]/80">
                    <img
                      src="https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/wechat-qr-clean_212dda69.png"
                      alt="WeChat QR Code"
                      className="w-20 h-20 object-contain block"
                    />
                  </div>
                </div>
                <div>
                  <div className="text-[#C9A84C]/60 text-[0.6rem] font-['DM_Mono'] tracking-[0.2em] uppercase mb-2">SCAN TO ADD WECHAT</div>
                  <div className="text-white font-['Noto_Serif_SC'] text-base font-bold mb-1">Sean DAI</div>
                  <div className="text-white/50 text-xs mb-2">{isEn ? "Chief Strategy Expert · Mc&Mamoo Growth Engine" : "首席战略专家 · 猫眼增长引擎"}</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-px bg-[#C9A84C]/50" />
                    <span className="text-[#C9A84C]/70 text-[0.6rem] font-['DM_Mono'] tracking-widest">MCMAMOO.COM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Brand statement */}
            <div className="border-l-2 border-[#C9A84C] pl-6">
              <p className="font-['Noto_Serif_SC'] text-[#C9A84C] text-lg font-semibold leading-relaxed mb-2">
                {isEn ? "Insight into Business Essence, Accompanying Strategic Execution" : "洞察商业本质，陪伴战略落地"}
              </p>
              <p className="text-white/40 text-sm">
                {isEn ? "Global #1 New Consumer Brand Management Company" : "全球新消费第一品牌管理公司"}
              </p>
            </div>
          </div>

          {/* Right: Contact form */}
          <div>
            <div className="text-white/40 text-xs tracking-widest uppercase mb-8 font-['DM_Mono']">
              {isEn ? "Book a Strategy Consultation" : "预约战略咨询"}
            </div>

            {submitted ? (
              <div className="p-8 border border-[#C9A84C]/40 bg-[#C9A84C]/5 text-center">
                <CheckCircle2 className="w-10 h-10 text-[#C9A84C] mx-auto mb-4" />
                <h3 className="font-['Noto_Serif_SC'] text-white text-xl font-bold mb-2">
                  {isEn ? "Thank You for Your Inquiry" : "感谢您的咨询"}
                </h3>
                <p className="text-white/60 text-sm mb-3">
                  {isEn
                    ? "We will contact you within 1-2 business days. We look forward to exploring brand growth possibilities with you."
                    : "我们将在1-2个工作日内与您联系，期待与您共同探索品牌增长的可能性。"}
                </p>
                {form.email && (
                  <p className="text-[#C9A84C]/70 text-xs font-['DM_Mono']">
                    {isEn ? `Confirmation email sent to ${form.email}` : `确认邮件已发送至 ${form.email}`}
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {formFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-white/40 text-xs font-['DM_Mono'] mb-2 tracking-widest uppercase">
                      {field.label}
                    </label>
                    <input
                      type={field.key === "email" ? "email" : "text"}
                      placeholder={field.placeholder}
                      value={form[field.key as keyof typeof form]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 text-white/80 text-sm px-4 py-3 placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
                      required={field.required !== false}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-white/40 text-xs font-['DM_Mono'] mb-2 tracking-widest uppercase">
                    {isEn ? "Consultation Needs" : "咨询需求"}
                  </label>
                  <textarea
                    placeholder={isEn ? "Briefly describe your brand situation and consultation needs..." : "请简述您的品牌现状和咨询需求..."}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 text-white/80 text-sm px-4 py-3 placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/50 transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-sm tracking-widest uppercase hover:bg-[#E8D5A0] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {isEn ? "Submitting..." : "提交中..."}
                    </>
                  ) : (
                    isEn ? "Submit Consultation Request" : "提交咨询申请"
                  )}
                </button>
                {/* Brand consultation payment CTA */}
                <button
                  type="button"
                  onClick={() => setPaymentProduct({
                    id: "brand_consultation",
                    name: isEn ? "Brand Strategy Consultation · Deposit" : "品牌全案咨询 · 定金",
                    amount: isCNY ? 9800 : 1380,
                    currency: isCNY ? "CNY" : "USD",
                    description: isEn ? "Deposit to lock consultation slot" : "定金锁定咨询名额，余款面议后支付",
                    billingLabel: isEn ? "One-time deposit" : "一次性定金",
                  })}
                  className="w-full py-3 border border-[#C9A84C]/25 text-[#C9A84C]/60 text-xs tracking-widest uppercase hover:border-[#C9A84C]/50 hover:text-[#C9A84C]/90 hover:bg-[#C9A84C]/5 transition-all duration-300"
                >
                  {isEn ? "★ Pay Deposit to Lock Consultation Slot →" : "★ 支付定金锁定咨询名额 →"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Payment Modal ─────────────────────────────────────────────────── */}
      {paymentProduct && (
        <PaymentModal
          open={!!paymentProduct}
          onClose={() => setPaymentProduct(null)}
          product={paymentProduct}
          onSuccess={(orderId) => console.log("Contact order:", orderId)}
        />
      )}
    </section>
  );
}
