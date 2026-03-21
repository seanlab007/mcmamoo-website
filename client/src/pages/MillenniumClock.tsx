/*
 * MillenniumClock — 代言万年钟详情页
 * 发明者：代言先生（Sean DAI）
 * 设计：超长期主义 · 宇宙尺度时间 · 科幻极简暗黑
 */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const OG_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/millennium-clock-og_9be09803.jpg";
const HERO_VIDEO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/millennium-clock-hero_9cdad099.mp4";
const CLOCK_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/mao-millennium-clock-e7b5V82FhK3kso5tNhy3YX.webp";
const INDUSTRY_BG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/mao-industry-bg-5fKD5GfBWeFuC7bBKnwxHN.webp";

const timeline = [
  { year: "2019", title: "概念诞生", desc: "代言先生在思考人类文明的长期存续问题时，提出「万年钟」概念：一个以万年为单位走动的计时装置，用以对抗人类天然的短视本能。" },
  { year: "2021", title: "哲学框架建立", desc: "发展出「超长期主义」思想体系：在宇宙138亿年的时间轴上，人类文明不过是一瞬。万年钟成为这一哲学的物质载体与仪式象征。" },
  { year: "2023", title: "工程原型设计", desc: "联合精密机械工程师完成第一代原型设计。采用恒温铟钢合金框架、真空密封腔体、原子钟校准系统，确保万年精度±1秒。" },
  { year: "2025", title: "猫眼工业代言", desc: "万年钟成为猫眼工业的精神图腾与代言产品，象征猫眼工业在月球氦-3能源、托卡马克聚变等领域的超长期战略布局。" },
];

const specs = [
  { label: "走针周期", value: "10,000 年 / 格", icon: "⏱" },
  { label: "计时精度", value: "±1秒 / 万年", icon: "🎯" },
  { label: "主体材质", value: "铟钢合金 + 暗物质晶体表盘", icon: "⚗" },
  { label: "校准方式", value: "铯原子钟 + 脉冲星信号双校准", icon: "📡" },
  { label: "运行环境", value: "真空密封腔体，恒温 20°C ±0.001°C", icon: "🌡" },
  { label: "尺寸规格", value: "高 12m × 宽 8m（纪念碑级装置）", icon: "📐" },
  { label: "能源方案", value: "氦-3 微型聚变堆自供电，无需外部能源", icon: "⚛" },
  { label: "发明者", value: "代言先生 Sean DAI", icon: "👤" },
];

const philosophyPoints = [
  { title: "对抗短视本能", desc: "人类大脑进化为处理即时威胁，天然倾向于短期决策。万年钟通过极端的时间尺度对比，强迫观者重新校准自己的决策时间框架。" },
  { title: "文明尺度的责任", desc: "当你意识到今天的一个决策将在10,000年后仍然产生影响，你对能源、环境、基因、教育的态度将彻底改变。这是万年钟最深层的设计意图。" },
  { title: "星际文明的预演", desc: "人类若要成为跨星际文明，必须学会以千年、万年为单位规划。万年钟是这种思维方式的训练装置，也是文明成熟度的标志。" },
  { title: "超长期主义宣言", desc: "「我们不是在为下一个季度做决策，我们是在为下一个文明纪元奠基。」——代言先生 Sean DAI" },
];

export default function MillenniumClock() {
  const [formData, setFormData] = useState({ name: "", company: "", email: "", phone: "", intent: "exhibition", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showFounderModal, setShowFounderModal] = useState(false);

  const createReservation = trpc.millenniumClock.createReservation.useMutation({
    onSuccess: () => { setSubmitted(true); setSubmitting(false); },
    onError: (err) => { setSubmitError(err.message || "提交失败，请稍后重试"); setSubmitting(false); },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "代言万年钟 — 每10,000年走一下 | 猫眼工业";
    const setMeta = (prop: string, content: string, attr = "property") => {
      let el = document.querySelector(`meta[${attr}="${prop}"]`) as HTMLMetaElement | null;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, prop); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("og:title", "代言万年钟 — 每10,000年走一下 | 猫眼工业");
    setMeta("og:description", "由思想家代言先生发明，每一万年走一下的计时装置。超长期主义的物质载体，文明尺度的思考工具。");
    setMeta("og:image", OG_IMAGE);
    setMeta("og:url", window.location.href);
    setMeta("og:type", "website");
    setMeta("twitter:card", "summary_large_image", "name");
    setMeta("twitter:image", OG_IMAGE, "name");
    setMeta("twitter:title", "代言万年钟 MILLENNIUM CLOCK", "name");
    setMeta("twitter:description", "每10,000年走一下 · 猫眼工业代言 · 超长期主义", "name");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    createReservation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white">
      {/* ── 顶部导航 ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#020408]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-3 text-white/60 hover:text-[#C9A84C] transition-colors duration-300 text-sm">
              <span>←</span>
              <span className="font-mono tracking-wider">返回首页</span>
            </a>
          </Link>
          <div className="text-[#4FC3F7]/60 text-xs font-mono tracking-[0.3em] uppercase">
            MAO INDUSTRY · MILLENNIUM CLOCK
          </div>
          <a href="/#contact" className="px-4 py-2 border border-[#C9A84C]/40 text-[#C9A84C] text-xs font-mono tracking-widest uppercase hover:bg-[#C9A84C]/10 transition-all duration-300">
            合作咨询
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-16 overflow-hidden" style={{ minHeight: "100vh" }}>
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ opacity: 0.45 }}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
          <img src={INDUSTRY_BG} alt="宇宙背景" className="absolute inset-0 w-full h-full object-cover object-center" style={{ opacity: 0.2 }} />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[#020408]/40 via-[#020408]/60 to-[#020408]" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-10 h-px bg-[#4FC3F7]" />
              <span className="text-[#4FC3F7] text-xs tracking-[0.4em] uppercase font-mono">ENDORSED BY MAO INDUSTRY</span>
            </div>
            <h1 className="font-bold leading-tight mb-4" style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}>
              代言<br /><span className="text-[#4FC3F7]">万年钟</span>
            </h1>
            <div className="text-[#C9A84C] font-mono text-sm tracking-[0.4em] mb-8 uppercase">
              MILLENNIUM TIMEPIECE · 每 10,000 年 · 走一下
            </div>
            <p className="text-white/60 text-lg leading-relaxed mb-6 max-w-xl">
              由思想家、发明家 <span className="text-white font-semibold">代言先生（Sean DAI）</span> 构思发明。万年钟的指针每隔一万年才走动一格——它不是用来看时间的，而是用来提醒人类：
            </p>
            <blockquote className="border-l-2 border-[#4FC3F7] pl-6 mb-10">
              <p className="text-[#4FC3F7] text-xl font-light italic leading-relaxed">
                "在宇宙尺度的时间轴上，<br />我们的决策应当以万年为单位思考。"
              </p>
              <cite className="text-white/40 text-sm font-mono mt-3 block not-italic">— 代言先生 Sean DAI，超长期主义创始人</cite>
            </blockquote>
            <div className="flex flex-wrap gap-4">
              <a href="#reservation" onClick={(e) => { e.preventDefault(); document.querySelector('#reservation')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#C9A84C] text-black text-sm font-bold tracking-widest uppercase hover:bg-[#E8D5A0] transition-colors duration-300">
                预约参观 →
              </a>
              <a href="/#mao-industry" className="inline-flex items-center gap-2 px-8 py-4 border border-[#4FC3F7]/40 text-[#4FC3F7] text-sm font-mono tracking-widest uppercase hover:bg-[#4FC3F7]/10 transition-all duration-300">
                猫眼工业 →
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(79,195,247,0.12) 0%, transparent 70%)", filter: "blur(40px)" }} />
            <img src={CLOCK_IMG} alt="代言万年钟" className="relative z-10 w-full rounded-sm" style={{ maxHeight: "600px", objectFit: "cover" }} />
            <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(79,195,247,0.02) 3px, rgba(79,195,247,0.02) 6px)" }} />
            <div className="absolute top-4 left-4 z-30 w-6 h-6 border-t-2 border-l-2 border-[#4FC3F7]/60" />
            <div className="absolute top-4 right-4 z-30 w-6 h-6 border-t-2 border-r-2 border-[#4FC3F7]/60" />
            <div className="absolute bottom-4 left-4 z-30 w-6 h-6 border-b-2 border-l-2 border-[#4FC3F7]/60" />
            <div className="absolute bottom-4 right-4 z-30 w-6 h-6 border-b-2 border-r-2 border-[#4FC3F7]/60" />
          </div>
        </div>
      </section>

      {/* ── 技术规格 ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex items-center gap-4 mb-12">
          <span className="w-10 h-px bg-[#C9A84C]" />
          <h2 className="text-white text-2xl font-bold tracking-wide">技术规格</h2>
          <div className="flex-1 h-px bg-white/5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
          {specs.map((s) => (
            s.label === "发明者" ? (
              <button
                key={s.label}
                onClick={() => setShowFounderModal(true)}
                className="bg-[#020408] p-6 text-left hover:bg-[#C9A84C]/5 border border-transparent hover:border-[#C9A84C]/20 transition-all duration-300 group"
              >
                <div className="text-2xl mb-3">{s.icon}</div>
                <div className="text-white/30 text-xs font-mono tracking-widest uppercase mb-2">{s.label}</div>
                <div className="text-[#C9A84C] text-sm font-semibold leading-relaxed group-hover:text-[#E8D5A0] transition-colors">{s.value}</div>
                <div className="text-white/20 text-xs font-mono mt-2 tracking-wider">点击查看个人介绍 →</div>
              </button>
            ) : (
              <div key={s.label} className="bg-[#020408] p-6">
                <div className="text-2xl mb-3">{s.icon}</div>
                <div className="text-white/30 text-xs font-mono tracking-widest uppercase mb-2">{s.label}</div>
                <div className="text-white text-sm font-semibold leading-relaxed">{s.value}</div>
              </div>
            )
          ))}
        </div>
      </section>

      {/* ── 哲学内核 ── */}
      <section className="bg-[#040810] py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="w-10 h-px bg-[#4FC3F7]" />
            <h2 className="text-white text-2xl font-bold tracking-wide">超长期主义哲学</h2>
          </div>
          <p className="text-white/40 text-sm font-mono tracking-wider mb-12 ml-14">ULTRA-LONG-TERMISM PHILOSOPHY</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {philosophyPoints.map((p, i) => (
              <div key={i} className="border border-white/5 p-8 relative">
                <div className="absolute top-6 right-6 text-[#4FC3F7]/10 font-bold" style={{ fontSize: "4rem", lineHeight: 1, fontFamily: "monospace" }}>{String(i + 1).padStart(2, "0")}</div>
                <h3 className="text-[#4FC3F7] text-lg font-bold mb-4">{p.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 代言先生个人介绍弹窗 ── */}
      {showFounderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setShowFounderModal(false)}
        >
          <div
            className="relative max-w-2xl w-full mx-4 bg-[#020408] border border-[#C9A84C]/20 p-8 md:p-12"
            onClick={e => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setShowFounderModal(false)}
              className="absolute top-4 right-4 text-white/30 hover:text-white/70 text-2xl font-light transition-colors"
            >×</button>

            {/* 头部 */}
            <div className="flex items-start gap-6 mb-8">
              <div className="flex-shrink-0 w-16 h-16 border border-[#C9A84C]/40 flex items-center justify-center bg-[#C9A84C]/5">
                <span className="text-[#C9A84C] text-2xl font-bold font-mono">S</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-white text-xl font-bold tracking-wide">Sean DAI</h3>
                  <span className="text-[#C9A84C]/60 text-xs font-mono tracking-[0.2em] uppercase">代言先生</span>
                </div>
                <div className="text-[#4FC3F7]/70 text-sm font-mono tracking-wider">猫眼增长引擎 创始人 &amp; CEO</div>
                <div className="text-white/30 text-xs font-mono mt-1">万年钟发明者 · 超长期主义倡导者</div>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="w-full h-px bg-gradient-to-r from-[#C9A84C]/40 via-[#4FC3F7]/20 to-transparent mb-8" />

            {/* 个人介绍 */}
            <div className="space-y-4 text-white/60 text-sm leading-relaxed mb-8">
              <p>Sean DAI，猫眼增长引擎创始人，连续创业者、品牌成长战略家。在全域消费品、科技、能源等领域累积超过20年品牌建设经验，服务客户包括小仙炖、小罐茶、江中猴姑等头部品牌。</p>
              <p>作为超长期主义的倡导者，Sean相信企业和文明的真正价值在于建立跨代际的长期影响力。万年钟是他将这一哲学展现为实物的尝试——一个每1万年走一下的计时装置，将人类的短视本能与宇宙尺度的时间对比。</p>
              <p>他同时是猫眼工业的战略布局者，主导月球氦-3能源提炼、托卡马克装置研发等跨居正项目的长期战略规划，致力于为下一个文明纪元奠基。</p>
            </div>

            {/* 标签 */}
            <div className="flex flex-wrap gap-2 mb-8">
              {["创始人 & CEO", "超长期主义倡导者", "万年钟发明者", "品牌成长战略家", "全域消费品专家"].map(tag => (
                <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 text-white/50 text-xs font-mono">{tag}</span>
              ))}
            </div>

            {/* 底部操作 */}
            <div className="flex gap-4">
              <a
                href="#contact"
                onClick={() => setShowFounderModal(false)}
                className="flex-1 py-3 bg-[#C9A84C] text-black font-bold text-sm tracking-widest uppercase text-center hover:bg-[#E8D5A0] transition-colors"
              >预约与 Sean 交流</a>
              <button
                onClick={() => setShowFounderModal(false)}
                className="px-6 py-3 border border-white/10 text-white/40 text-sm font-mono hover:border-white/20 transition-colors"
              >关闭</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 发展历程 ── */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="flex items-center gap-4 mb-12">
          <span className="w-10 h-px bg-[#C9A84C]" />
          <h2 className="text-white text-2xl font-bold tracking-wide">发展历程</h2>
          <div className="flex-1 h-px bg-white/5" />
        </div>
        <div className="relative">
          <div className="absolute left-16 top-0 bottom-0 w-px bg-gradient-to-b from-[#4FC3F7]/40 via-[#C9A84C]/40 to-transparent" />
          <div className="space-y-12">
            {timeline.map((t, i) => (
              <div key={i} className="flex gap-8 items-start">
                <div className="flex-shrink-0 w-32 text-right">
                  <span className="text-[#C9A84C] font-bold text-xl font-mono">{t.year}</span>
                </div>
                <div className="flex-shrink-0 w-3 h-3 rounded-full bg-[#4FC3F7] mt-1.5 relative z-10 ring-4 ring-[#4FC3F7]/20" />
                <div className="flex-1 pb-4">
                  <h3 className="text-white font-bold text-lg mb-2">{t.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, rgba(79,195,247,0.06) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="text-[#4FC3F7]/40 text-xs font-mono tracking-[0.4em] uppercase mb-6">MAO INDUSTRY · COLLABORATION</div>
          <h2 className="text-white text-3xl md:text-4xl font-bold mb-6 leading-tight">
            以万年尺度思考，<br /><span className="text-[#C9A84C]">与猫眼工业共建文明基础设施</span>
          </h2>
          <p className="text-white/40 text-base leading-relaxed mb-10">
            无论是月球氦-3能源合作、托卡马克技术授权，还是万年钟展览与超长期主义论坛合作，我们期待与同频的文明建设者深度对话。
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#reservation" onClick={(e) => { e.preventDefault(); document.querySelector('#reservation')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="inline-flex items-center gap-2 px-10 py-4 bg-[#C9A84C] text-black text-sm font-bold tracking-widest uppercase hover:bg-[#E8D5A0] transition-colors duration-300">
              立即预约 →
            </a>
            <Link href="/">
              <a className="inline-flex items-center gap-2 px-10 py-4 border border-white/20 text-white/60 text-sm font-mono tracking-widest uppercase hover:border-white/40 hover:text-white transition-all duration-300">
                返回首页
              </a>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 预约/购买意向表单 ── */}
      <section id="reservation" className="bg-[#040810] py-24">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="w-10 h-px bg-[#C9A84C]" />
            <h2 className="text-white text-2xl font-bold tracking-wide">预约参观 · 购买意向</h2>
          </div>
          <p className="text-white/30 text-sm font-mono tracking-wider mb-10 ml-14">RESERVATION &amp; PURCHASE INQUIRY</p>

          {submitted ? (
            <div className="border border-[#4FC3F7]/30 bg-[#4FC3F7]/5 p-12 text-center">
              <div className="text-4xl mb-4">✦</div>
              <h3 className="text-[#4FC3F7] text-xl font-bold mb-3">意向已收到</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                感谢您对万年钟的关注。<br />我们将在 3 个工作日内与您取得联系，共同探讨合作可能。
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-white/40 text-xs font-mono tracking-widest uppercase mb-2">姓名 *</label>
                  <input required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#4FC3F7]/50 placeholder-white/20" placeholder="您的姓名" />
                </div>
                <div>
                  <label className="block text-white/40 text-xs font-mono tracking-widest uppercase mb-2">机构/公司</label>
                  <input value={formData.company} onChange={e => setFormData(p => ({ ...p, company: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#4FC3F7]/50 placeholder-white/20" placeholder="您所在的机构或公司" />
                </div>
                <div>
                  <label className="block text-white/40 text-xs font-mono tracking-widest uppercase mb-2">邮箱 *</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#4FC3F7]/50 placeholder-white/20" placeholder="your@email.com" />
                </div>
                <div>
                  <label className="block text-white/40 text-xs font-mono tracking-widest uppercase mb-2">联系电话</label>
                  <input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#4FC3F7]/50 placeholder-white/20" placeholder="+86 138 0000 0000" />
                </div>
              </div>
              <div>
                <label className="block text-white/40 text-xs font-mono tracking-widest uppercase mb-2">合作意向 *</label>
                <select value={formData.intent} onChange={e => setFormData(p => ({ ...p, intent: e.target.value }))}
                  className="w-full bg-[#020408] border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#4FC3F7]/50">
                  <option value="exhibition">预约参观展览装置</option>
                  <option value="purchase">购买/定制万年钟</option>
                  <option value="forum">超长期主义论坛合作</option>
                  <option value="media">媒体报道/专访</option>
                  <option value="investment">战略投资合作</option>
                  <option value="other">其他合作</option>
                </select>
              </div>
              <div>
                <label className="block text-white/40 text-xs font-mono tracking-widest uppercase mb-2">补充说明</label>
                <textarea rows={4} value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 text-sm focus:outline-none focus:border-[#4FC3F7]/50 placeholder-white/20 resize-none"
                  placeholder="请描述您的合作设想或具体需求..." />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-4 bg-[#C9A84C] text-black font-bold tracking-widest uppercase text-sm hover:bg-[#E8D5A0] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? "提交中..." : "提交意向 →"}
              </button>
              {submitError && (
                <p className="text-red-400 text-xs text-center font-mono bg-red-400/10 border border-red-400/20 px-4 py-2">{submitError}</p>
              )}
              <p className="text-white/20 text-xs text-center font-mono">提交即表示您同意我们与您就合作事宜取得联系</p>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-white/20 text-xs font-mono tracking-wider">© 2025 猫眼工业 MAO INDUSTRY · 代言万年钟 MILLENNIUM CLOCK</div>
          <div className="text-white/20 text-xs font-mono">发明者：代言先生 Sean DAI · 超长期主义创始人</div>
        </div>
      </footer>
    </div>
  );
}
