/**
 * WhalePictures — Whale Pictures 子公司专属页面
 * 整合至 Mc&Mamoo 官网，展示三大业务 + 收费阶梯 + 咨询表单
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

// ─── 收费数据 ─────────────────────────────────────────────────────────────────

const pricingZh = {
  tvc: {
    id: "tvc",
    badge: "核心业务",
    badgeColor: "#F59E0B",
    title: "TVC 广告拍摄",
    subtitle: "TVC Film Production",
    desc: "戛纳级别创意执行，8K摄影设备，从剧本到成片的全流程专业制作。35项国际广告奖项背书。",
    plans: [
      {
        name: "产品短视频",
        period: "单支",
        price: "8",
        unit: "万起",
        originalPrice: null,
        highlight: false,
        features: ["15-30秒产品展示片", "专业摄影团队", "基础后期调色", "1-2个拍摄场景", "2个修改版本"],
        cta: "预约咨询",
      },
      {
        name: "品牌TVC",
        period: "单支",
        price: "20",
        unit: "万起",
        originalPrice: null,
        highlight: true,
        features: ["30-60秒品牌广告片", "导演 + 摄影指导", "专业演员/外籍模特", "多场景拍摄", "电影级调色", "3个修改版本", "竖版/横版双格式交付"],
        cta: "立即预约",
      },
      {
        name: "全案TVC套餐",
        period: "系列",
        price: "60",
        unit: "万起",
        originalPrice: null,
        highlight: false,
        features: ["多支系列广告片", "完整创意策略", "品牌视觉统一规范", "主片+花絮+社媒版本", "全媒体格式交付", "版权全授权", "专属项目经理"],
        cta: "定制方案",
      },
    ],
  },
  model: {
    id: "model",
    badge: "专业资源",
    badgeColor: "#EC4899",
    title: "外籍模特经纪",
    subtitle: "International Model Agency",
    desc: "500+欧美、东欧、东南亚外籍专业模特，24小时精准匹配，全流程服务（试镜/档期/肖像授权）。",
    plans: [
      {
        name: "半日拍摄",
        period: "4小时",
        price: "0.8",
        unit: "万起",
        originalPrice: null,
        highlight: false,
        features: ["4小时拍摄档期", "1位外籍模特", "基础造型协调", "肖像授权（国内商用）", "24h内确认档期"],
        cta: "查看模特库",
      },
      {
        name: "全日拍摄",
        period: "8小时",
        price: "1.5",
        unit: "万起",
        originalPrice: null,
        highlight: true,
        features: ["8小时拍摄档期", "1-2位外籍模特", "专业造型师协调", "肖像授权（全媒体）", "多套服装/场景切换", "备选模特方案"],
        cta: "立即预约",
      },
      {
        name: "系列合作",
        period: "月度/季度",
        price: "定制",
        unit: "",
        originalPrice: null,
        highlight: false,
        features: ["长期档期优先锁定", "专属模特资源池", "品牌调性精准匹配", "多语言沟通支持", "全球版权授权", "专属BD对接"],
        cta: "洽谈合作",
      },
    ],
  },
  aiDrama: {
    id: "ai-drama",
    badge: "热门业务",
    badgeColor: "#06B6D4",
    title: "AI 短剧制作",
    subtitle: "AI Drama Production",
    desc: "融合 Sora/Kling 等最新 AIGC 技术，成本仅为传统方式的 1/3，最快 3 天一集，电影级视觉效果。",
    plans: [
      {
        name: "单集体验",
        period: "1集",
        price: "3",
        unit: "万起",
        originalPrice: null,
        highlight: false,
        features: ["3-5分钟单集短剧", "AIGC场景生成", "真实演员+AI数字人混合", "适配抖音/小红书格式", "1个修改版本"],
        cta: "试水体验",
      },
      {
        name: "系列套餐",
        period: "6集",
        price: "15",
        unit: "万起",
        originalPrice: "30万",
        highlight: true,
        features: ["6集系列短剧", "完整剧本创作", "品牌植入策略", "多平台格式适配", "数据复盘报告", "2个修改版本/集", "发布运营建议"],
        cta: "立即启动",
      },
      {
        name: "品牌短剧全案",
        period: "12集+",
        price: "50",
        unit: "万起",
        originalPrice: null,
        highlight: false,
        features: ["12集以上系列短剧", "IP孵化策略", "品牌故事深度植入", "全平台矩阵运营", "KOL二创授权", "实时数据监控", "季度内容复盘", "专属创意团队"],
        cta: "定制方案",
      },
    ],
  },
};

const pricingEn = {
  tvc: {
    id: "tvc",
    badge: "Core Service",
    badgeColor: "#F59E0B",
    title: "TVC Film Production",
    subtitle: "TVC Film Production",
    desc: "Cannes-level creative execution, 8K cinematography, full-service production from script to final cut. Backed by 35 international advertising awards.",
    plans: [
      {
        name: "Product Video",
        period: "per film",
        price: "¥80K",
        unit: "+",
        originalPrice: null,
        highlight: false,
        features: ["15-30s product showcase", "Professional film crew", "Basic color grading", "1-2 shooting locations", "2 revision rounds"],
        cta: "Book Consultation",
      },
      {
        name: "Brand TVC",
        period: "per film",
        price: "¥200K",
        unit: "+",
        originalPrice: null,
        highlight: true,
        features: ["30-60s brand commercial", "Director + DOP", "Professional/international cast", "Multi-location shoot", "Cinematic color grade", "3 revision rounds", "Vertical + horizontal delivery"],
        cta: "Book Now",
      },
      {
        name: "Full TVC Suite",
        period: "series",
        price: "¥600K",
        unit: "+",
        originalPrice: null,
        highlight: false,
        features: ["Multi-film series", "Full creative strategy", "Brand visual guidelines", "Main + BTS + social cuts", "All media formats", "Full IP rights", "Dedicated PM"],
        cta: "Custom Quote",
      },
    ],
  },
  model: {
    id: "model",
    badge: "Premium Resource",
    badgeColor: "#EC4899",
    title: "International Model Agency",
    subtitle: "International Model Agency",
    desc: "500+ international models from Europe, Eastern Europe & Southeast Asia. 24h matching, full service (casting/scheduling/portrait rights).",
    plans: [
      {
        name: "Half-Day Shoot",
        period: "4 hours",
        price: "¥8K",
        unit: "+",
        originalPrice: null,
        highlight: false,
        features: ["4-hour shoot slot", "1 international model", "Basic styling coordination", "Portrait rights (China commercial)", "24h booking confirmation"],
        cta: "Browse Models",
      },
      {
        name: "Full-Day Shoot",
        period: "8 hours",
        price: "¥15K",
        unit: "+",
        originalPrice: null,
        highlight: true,
        features: ["8-hour shoot slot", "1-2 international models", "Professional stylist", "Full media portrait rights", "Multiple outfits/scenes", "Backup model options"],
        cta: "Book Now",
      },
      {
        name: "Series Partnership",
        period: "monthly/quarterly",
        price: "Custom",
        unit: "",
        originalPrice: null,
        highlight: false,
        features: ["Priority slot reservation", "Dedicated model pool", "Brand-matched casting", "Multilingual support", "Global rights", "Dedicated BD manager"],
        cta: "Discuss Partnership",
      },
    ],
  },
  aiDrama: {
    id: "ai-drama",
    badge: "Hot Service",
    badgeColor: "#06B6D4",
    title: "AI Drama Production",
    subtitle: "AI Drama Production",
    desc: "Powered by Sora/Kling AIGC technology. 1/3 the cost of traditional production, as fast as 3 days per episode, cinematic visual quality.",
    plans: [
      {
        name: "Single Episode",
        period: "1 episode",
        price: "¥30K",
        unit: "+",
        originalPrice: null,
        highlight: false,
        features: ["3-5 min single episode", "AIGC scene generation", "Real actors + AI avatars", "Douyin/Xiaohongshu format", "1 revision round"],
        cta: "Try It Out",
      },
      {
        name: "Series Package",
        period: "6 episodes",
        price: "¥150K",
        unit: "+",
        originalPrice: "¥300K",
        highlight: true,
        features: ["6-episode series", "Full script writing", "Brand integration strategy", "Multi-platform formats", "Data analytics report", "2 revisions/episode", "Publishing strategy"],
        cta: "Start Now",
      },
      {
        name: "Brand Drama Suite",
        period: "12+ episodes",
        price: "¥500K",
        unit: "+",
        originalPrice: null,
        highlight: false,
        features: ["12+ episode series", "IP incubation strategy", "Deep brand storytelling", "Full-platform operations", "KOL secondary creation rights", "Real-time data monitoring", "Quarterly content review", "Dedicated creative team"],
        cta: "Custom Quote",
      },
    ],
  },
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

// ─── PricingCard ──────────────────────────────────────────────────────────────
function WhalePricingCard({ plan, isEn }: { plan: typeof pricingZh.tvc.plans[0]; isEn: boolean }) {
  return (
    <div className={`relative flex flex-col border p-8 ${
      plan.highlight
        ? "border-[#F59E0B]/40 bg-[#F59E0B]/5"
        : "border-white/8 bg-white/2"
    }`}>
      {plan.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#F59E0B] text-black text-[10px] font-mono tracking-widest uppercase">
          {isEn ? "Most Popular" : "最受欢迎"}
        </div>
      )}
      {plan.originalPrice && (
        <div className="text-white/30 text-xs font-mono line-through mb-1">{plan.originalPrice}</div>
      )}
      <div className="mb-1">
        <span className="text-white/60 text-xs font-mono tracking-widest uppercase">{plan.name}</span>
      </div>
      <div className="flex items-end gap-1 mb-1">
        <span className={`font-['Cormorant_Garamond'] text-5xl font-bold ${plan.highlight ? "text-[#F59E0B]" : "text-white"}`}>
          {plan.price}
        </span>
        <span className="text-white/40 text-sm pb-2">{plan.unit}</span>
      </div>
      <div className="text-white/25 text-xs font-mono mb-6">{plan.period}</div>
      <ul className="space-y-2 mb-8 flex-1">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-white/60 text-sm">
            <span className="text-[#F59E0B]/60 mt-0.5 shrink-0">◆</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <a
        href="#whale-contact"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("whale-contact")?.scrollIntoView({ behavior: "smooth" });
        }}
        className={`block text-center py-3 text-sm font-mono tracking-widest border transition-all duration-200 ${
          plan.highlight
            ? "bg-[#F59E0B] border-[#F59E0B] text-black hover:bg-[#F59E0B]/90"
            : "border-white/20 text-white/60 hover:border-[#F59E0B]/50 hover:text-[#F59E0B]"
        }`}
      >
        {plan.cta}
      </a>
    </div>
  );
}

// ─── ServiceSection ───────────────────────────────────────────────────────────
function WhaleServiceSection({ data, isEn }: { data: typeof pricingZh.tvc; isEn: boolean }) {
  return (
    <section id={data.id} className="py-20 border-b border-white/5">
      <div className="container">
        <div className="mb-12">
          <span
            className="inline-block px-3 py-1 text-[10px] font-mono tracking-[0.3em] uppercase border mb-4"
            style={{ color: data.badgeColor, borderColor: `${data.badgeColor}40`, background: `${data.badgeColor}10` }}
          >
            {data.badge}
          </span>
          <h2 className="font-['Noto_Serif_SC'] text-white text-4xl font-bold mb-3">{data.title}</h2>
          <p className="text-white/40 max-w-2xl leading-relaxed">{data.desc}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.plans.map((plan) => (
            <WhalePricingCard key={plan.name} plan={plan} isEn={isEn} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── 咨询表单 ─────────────────────────────────────────────────────────────────
function WhaleContactForm({ isEn }: { isEn: boolean }) {
  const [form, setForm] = useState({
    name: "", company: "", email: "", phone: "",
    service: "", budget: "", message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const createInquiry = trpc.consulting.createInquiry.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (e) => setError(e.message),
  });

  const services = isEn
    ? ["TVC Film Production", "International Model Agency", "AI Drama Production", "Brand Package Design"]
    : ["TVC广告拍摄", "外籍模特经纪", "AI短剧制作", "品牌包装设计"];

  const budgets = isEn
    ? ["-- Select Budget --", "Under ¥100K", "¥100K - ¥500K", "¥500K - ¥2M", "Above ¥2M"]
    : ["—— 选择预算范围 ——", "10万以内", "10-50万", "50-200万", "200万以上"];

  const inputCls = "w-full bg-white/5 border border-white/10 text-white placeholder-white/30 px-4 py-3 text-sm focus:outline-none focus:border-[#F59E0B]/60 transition-colors";
  const labelCls = "block text-white/50 text-xs font-['DM_Mono'] tracking-widest uppercase mb-2";

  if (submitted) {
    return (
      <section id="whale-contact" className="py-24 border-t border-white/5">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-[#F59E0B] text-5xl mb-6">✓</div>
            <h2 className="font-['Noto_Serif_SC'] text-white text-3xl font-bold mb-4">
              {isEn ? "Inquiry Received" : "咨询已收到"}
            </h2>
            <p className="text-white/50 leading-relaxed mb-8">
              {isEn
                ? "Our production team will contact you within 24 hours."
                : "我们的制作团队将在 24 小时内与您联系。"}
            </p>
            <div className="border border-white/10 bg-white/2 p-6 max-w-sm mx-auto">
              <div className="text-white/40 text-xs font-['DM_Mono'] tracking-widest uppercase mb-3">
                {isEn ? "Or connect directly" : "或直接联系我们"}
              </div>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#07C160]/20 border border-[#07C160]/30 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#07C160">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-3.74 3.43c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm3.814 0c.535 0 .969.44.969.983a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-white text-sm font-medium">{isEn ? "WeChat" : "微信"}</div>
                  <div className="text-white/40 text-xs font-['DM_Mono']">whalepictures</div>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText("whalepictures").then(() => {
                    alert(isEn ? "WeChat ID copied: whalepictures" : "微信号已复制：whalepictures");
                  });
                }}
                className="block w-full py-2.5 bg-[#07C160]/20 border border-[#07C160]/40 text-[#07C160] text-sm font-['DM_Mono'] tracking-widest hover:bg-[#07C160]/30 transition-all duration-200 text-center"
              >
                {isEn ? "Add on WeChat" : "加微信沟通"}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="whale-contact" className="py-24 border-t border-white/5">
      <div className="container">
        <div className="max-w-3xl mx-auto">
          <div className="section-label mb-4">{isEn ? "Start a Project" : "开始合作"}</div>
          <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold mb-4">
            {isEn ? "Let's Create Together" : "开始你的项目"}
          </h2>
          <p className="text-white/40 mb-10 leading-relaxed">
            {isEn
              ? "Tell us about your project and we'll get back to you within 24 hours."
              : "告诉我们你的项目需求，我们将在 24 小时内回复。"}
          </p>

          {error && (
            <div className="mb-6 px-4 py-3 border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className={labelCls}>{isEn ? "Name *" : "姓名 *"}</label>
              <input className={inputCls} placeholder={isEn ? "Your name" : "您的姓名"}
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>{isEn ? "Company" : "公司"}</label>
              <input className={inputCls} placeholder={isEn ? "Company name" : "公司名称"}
                value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>{isEn ? "Email *" : "邮箱 *"}</label>
              <input className={inputCls} type="email" placeholder={isEn ? "your@email.com" : "您的邮箱"}
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>{isEn ? "Phone" : "电话"}</label>
              <input className={inputCls} placeholder={isEn ? "Phone number" : "联系电话"}
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>{isEn ? "Service" : "服务类型"}</label>
              <select className={inputCls} value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))}>
                <option value="">{isEn ? "-- Select Service --" : "—— 选择服务类型 ——"}</option>
                {services.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>{isEn ? "Budget" : "预算范围"}</label>
              <select className={inputCls} value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}>
                {budgets.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-8">
            <label className={labelCls}>{isEn ? "Project Brief" : "项目说明"}</label>
            <textarea className={`${inputCls} resize-none`} rows={4}
              placeholder={isEn ? "Describe your project, timeline, and any specific requirements..." : "请描述您的项目需求、时间节点和特殊要求..."}
              value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
          </div>
          <button
            disabled={createInquiry.isPending}
            onClick={() => {
              if (!form.name || !form.email) {
                setError(isEn ? "Name and email are required." : "姓名和邮箱为必填项。");
                return;
              }
              setError("");
              createInquiry.mutate({ ...form, service: form.service || "TVC广告拍摄" });
            }}
            className="px-12 py-4 bg-[#F59E0B] text-black text-sm font-mono tracking-widest hover:bg-[#F59E0B]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createInquiry.isPending
              ? (isEn ? "SUBMITTING..." : "提交中...")
              : (isEn ? "SUBMIT INQUIRY" : "提交咨询")}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── 主页面 ───────────────────────────────────────────────────────────────────
export default function WhalePictures() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== "zh";
  const data = isEn ? pricingEn : pricingZh;

  const toc = isEn
    ? [
        { id: "tvc",      label: "TVC Production" },
        { id: "model",    label: "Model Agency" },
        { id: "ai-drama", label: "AI Drama" },
      ]
    : [
        { id: "tvc",      label: "TVC广告拍摄" },
        { id: "model",    label: "外籍模特经纪" },
        { id: "ai-drama", label: "AI短剧制作" },
      ];

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 border-b border-white/5">
        <div className="container">
          {/* 子公司标签 */}
          <div className="flex items-center gap-3 mb-6">
            <a href="/" className="text-white/30 hover:text-[#C9A84C] text-xs font-mono tracking-widest transition-colors">
              Mc&Mamoo
            </a>
            <span className="text-white/15 font-mono">›</span>
            <span className="text-[#F59E0B] text-xs font-mono tracking-widest">Whale Pictures</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-10">
            <div>
              <div className="section-label mb-4">
                {isEn ? "Mc&Mamoo Subsidiary" : "猫眼增长引擎旗下子公司"}
              </div>
              <h1 className="font-['Cormorant_Garamond'] text-white text-6xl md:text-7xl font-bold mb-4 leading-none tracking-tight">
                WHALE<br />
                <span className="text-[#F59E0B]">PICTURES</span>
              </h1>
              <p className="text-white/50 text-lg max-w-xl leading-relaxed">
                {isEn
                  ? "International award-winning creative production house. TVC · Model Agency · AI Drama. 35 global advertising awards."
                  : "国际获奖创意影视公司。TVC广告 · 外模经纪 · AI短剧。35项全球广告奖项。"}
              </p>
            </div>
            {/* 奖项数字 */}
            <div className="flex gap-8 shrink-0">
              {[
                { num: "35+", label: isEn ? "Global Awards" : "国际奖项" },
                { num: "200+", label: isEn ? "Brand Projects" : "品牌案例" },
                { num: "500+", label: isEn ? "Int'l Models" : "外籍模特" },
              ].map(s => (
                <div key={s.num} className="text-center">
                  <div className="text-[#F59E0B] font-['Cormorant_Garamond'] text-4xl font-bold">{s.num}</div>
                  <div className="text-white/30 text-[10px] font-mono tracking-widest mt-1 uppercase">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 快速导航 */}
          <div className="flex flex-wrap gap-3">
            {toc.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-4 py-2 border border-white/15 text-white/50 text-sm hover:border-[#F59E0B]/50 hover:text-[#F59E0B] transition-all duration-200 font-['DM_Mono'] tracking-wide"
              >
                {item.label}
              </a>
            ))}
            <a
              href="https://whalepictures.vip"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-[#F59E0B]/30 text-[#F59E0B]/70 text-sm hover:border-[#F59E0B] hover:text-[#F59E0B] transition-all duration-200 font-['DM_Mono'] tracking-wide"
            >
              {isEn ? "Visit Full Site →" : "访问官网 →"}
            </a>
          </div>
        </div>
      </section>

      {/* 三大服务定价 */}
      <WhaleServiceSection data={data.tvc} isEn={isEn} />
      <WhaleServiceSection data={data.model} isEn={isEn} />
      <WhaleServiceSection data={data.aiDrama} isEn={isEn} />

      {/* 获奖荣誉 */}
      <section className="py-16 border-b border-white/5">
        <div className="container">
          <div className="section-label mb-4">{isEn ? "Awards" : "获奖荣誉"}</div>
          <h2 className="font-['Noto_Serif_SC'] text-white text-3xl font-bold mb-10">
            {isEn ? "35 International Awards" : "35项国际广告奖项"}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {AWARDS.map((a) => (
              <div key={a.name + a.year} className="border border-white/5 bg-white/2 p-5 flex items-start gap-4">
                <span className="text-2xl shrink-0">{a.icon}</span>
                <div>
                  <div className="text-white/30 text-[10px] font-mono tracking-widest mb-1">{a.year}</div>
                  <div className="text-white text-sm font-medium mb-0.5">{a.name}</div>
                  <div className="text-white/40 text-xs">{a.award}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 咨询表单 */}
      <WhaleContactForm isEn={isEn} />

      {/* 底部 Mc&Mamoo 品牌关联 */}
      <section className="py-10 border-t border-white/5">
        <div className="container text-center">
          <p className="text-white/20 text-xs font-['DM_Mono'] tracking-widest uppercase mb-2">
            {isEn ? "A Mc&Mamoo Growth Engine Company" : "猫眼增长引擎旗下子公司"}
          </p>
          <a href="/" className="text-white/30 hover:text-[#C9A84C] text-xs font-mono tracking-widest transition-colors">
            ← {isEn ? "Back to Mc&Mamoo" : "返回猫眼增长引擎"}
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
