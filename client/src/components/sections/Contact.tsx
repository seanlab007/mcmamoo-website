/*
 * Contact Section — 联系我们
 * Design: 极简黑底 + 金色竖线 + 联系信息
 * Feature: 表单提交后自动发送确认邮件给访客 + 抄送管理员
 */
import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Phone, Globe, Mail, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const CONTACT_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/contact-bg-8krYjvmedEVGPfhYr9X7Co.webp";

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", phone: "", email: "", message: "" });
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err) => {
      console.error("[Contact] Submit error:", err);
      toast.error("提交失败，请稍后重试或直接拨打联系电话");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate({
      name: form.name,
      company: form.company,
      phone: form.phone,
      message: form.message || undefined,
      email: form.email || undefined,
    });
  };

  return (
    <section id="contact" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${CONTACT_BG})` }}
      />
      <div className="absolute inset-0 bg-[#0A0A0A]/96" />

      <div className="relative z-10 container">
        {/* Header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="section-label mb-4">06 — Contact</div>
          <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold mb-4">
            联系我们
          </h2>
          <p className="text-white/50 max-w-xl text-base leading-relaxed">
            如果您正在寻找一家能够真正帮助您打造爆品、实现战略破局的合作伙伴，欢迎与我们联系。
          </p>
        </div>

        <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal grid lg:grid-cols-2 gap-16">
          {/* Left: Contact info */}
          <div>
            <div className="text-white/40 text-xs tracking-widest uppercase mb-8 font-['DM_Mono']">
              联系方式
            </div>

            <div className="space-y-6 mb-12">
              {[
                { icon: Phone, label: "联系电话", value: "+86 137 6459 7723" },
                { icon: Mail, label: "电子邮箱", value: "sean@mcmamoo.com" },
                { icon: Globe, label: "官方网站", value: "www.mcmamoo.com" },
                { icon: MapPin, label: "公司地址", value: "上海" },
              ].map(({ icon: Icon, label, value }) => (
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
<<<<<<< HEAD
<<<<<<< HEAD
                {/* QR code with gold frame */}
                <div className="relative flex-shrink-0">
                  <div className="absolute -inset-1 border border-[#C9A84C]/40" />
                  <div className="absolute -inset-2 border border-[#C9A84C]/15" />
                  <div className="p-1.5 bg-white">
                    <img
                      src="https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/mao_qr_code_81db722a.png"
                      alt="微信二维码"
                      className="w-20 h-20 object-contain block"
                    />
                  </div>
                </div>
                {/* Info */}
                <div>
                  <div className="text-[#C9A84C]/60 text-[0.6rem] font-['DM_Mono'] tracking-[0.2em] uppercase mb-2">SCAN TO ADD WECHAT</div>
                  <div className="text-white font-['Noto_Serif_SC'] text-base font-bold mb-1">Sean DAI</div>
                  <div className="text-white/50 text-xs mb-2">首席战略专家 · 猫眼咨询</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-px bg-[#C9A84C]/50" />
                    <span className="text-[#C9A84C]/70 text-[0.6rem] font-['DM_Mono'] tracking-widest">MCMAMOO.COM</span>
=======
=======
>>>>>>> origin/deploy/trigger-build-1774631965
                {92	                <div className="relative flex-shrink-0">
                  {/* 外层金边框 */}
                  <div className="absolute -inset-1 border border-[#C9A84C]/60" />
                  <div className="absolute -inset-2 border border-[#C9A84C]/20" />
                  {/* 二维码容器 - 物理性切除白边 */}
                  <div className="relative flex-shrink-0 w-20 h-20 overflow-hidden bg-[#0A0A0A]">
                    <img
                      src="https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/mao_qr_code_81db722a.png"
                      alt="微信二维码"
                      className="w-full h-full object-cover block"
                      style={{
                        filter: "invert(1) brightness(1.1) contrast(1.2)",
                        clipPath: "inset(8% 8% 8% 8%)",
                      }}
                    />
                  </div>
                </div>        </div>
104	                </div>            {/* Info */}
                <div>
                  <div className="text-[#C9A84C]/60 text-[0.6rem] font-['DM_Mono'] tracking-[0.2em] uppercase mb-2">SCAN TO ADD WECHAT</div>
                  <div className="text-white font-['Noto_Serif_SC'] text-base font-bold mb-1">Sean DAI</div>
                  <div className="text-white/50 text-xs mb-2">首席战略专家 · 猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-px bg-[#C9A84C]/50" />
                    <span className="text-[#C9A84C]/70 text-[0.6rem] font-['DM_Mono'] tracking-widest">Mc&Mamoo Growth Engine.COM</span>
<<<<<<< HEAD
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
>>>>>>> origin/deploy/trigger-build-1774631965
                  </div>
                </div>
              </div>
            </div>

            {/* Brand statement */}
            <div className="border-l-2 border-[#C9A84C] pl-6">
              <p className="font-['Noto_Serif_SC'] text-[#C9A84C] text-lg font-semibold leading-relaxed mb-2">
                洞察商业本质，陪伴战略落地
              </p>
              <p className="text-white/40 text-sm">
                全球新消费第一品牌管理公司
              </p>
            </div>
          </div>

          {/* Right: Contact form */}
          <div>
            <div className="text-white/40 text-xs tracking-widest uppercase mb-8 font-['DM_Mono']">
              预约战略咨询
            </div>

            {submitted ? (
              <div className="p-8 border border-[#C9A84C]/40 bg-[#C9A84C]/5 text-center">
                <CheckCircle2 className="w-10 h-10 text-[#C9A84C] mx-auto mb-4" />
                <h3 className="font-['Noto_Serif_SC'] text-white text-xl font-bold mb-2">
                  感谢您的咨询
                </h3>
                <p className="text-white/60 text-sm mb-3">
                  我们将在1-2个工作日内与您联系，期待与您共同探索品牌增长的可能性。
                </p>
                {form.email && (
                  <p className="text-[#C9A84C]/70 text-xs font-['DM_Mono']">
                    确认邮件已发送至 {form.email}
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {[
                  { key: "name", label: "您的姓名 *", placeholder: "请输入姓名" },
                  { key: "company", label: "公司名称 *", placeholder: "请输入公司名称" },
                  { key: "phone", label: "联系电话 *", placeholder: "请输入手机号码" },
                  { key: "email", label: "电子邮箱（选填）", placeholder: "填写后将收到确认邮件", required: false },
                ].map((field) => (
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
                    咨询需求
                  </label>
                  <textarea
                    placeholder="请简述您的品牌现状和咨询需求..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 text-white/80 text-sm px-4 py-3 placeholder:text-white/20 focus:outline-none focus:border-[#C9A84C]/50 transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full py-4 bg-[#C9A84C] text-[#0A0A0A] font-semibold text-sm tracking-widest uppercase hover:bg-[#E8D5A0] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      提交中...
                    </>
                  ) : (
                    "提交咨询申请"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
