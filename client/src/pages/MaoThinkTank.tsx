/*
 * 毛智库 — Mao Strategic Think Tank
 * Design: 军事战略风格 · 深红+暗金+哑黑 · 兵棋推演地图美学
 * Typography: Playfair Display (titles) + DM Mono (labels) + Noto Serif SC (Chinese)
 */
import { useEffect, useRef, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/maothink-hero-mJvZ3PuQkyhYspYTZQbG3W.webp";

// ── Reveal hook ─────────────────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ── Animated counter ─────────────────────────────────────────────────────────
function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useReveal(0.3);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target]);
  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ en, zh }: { en: string; zh: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div style={{ width: 32, height: 1, background: "#8B1A1A" }} />
        <span style={{ color: "#8B1A1A", fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>
          {en}
        </span>
      </div>
      <h2 style={{ fontFamily: "'Noto Serif SC', serif", color: "#E8D5B7", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 700, lineHeight: 1.3 }}>
        {zh}
      </h2>
    </div>
  );
}

// ── Conflict card ─────────────────────────────────────────────────────────────
function ConflictCard({ year, name, role, detail }: { year: string; name: string; role: string; detail: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className="p-6 relative overflow-hidden"
      style={{
        background: "rgba(139,26,26,0.06)",
        border: "1px solid rgba(139,26,26,0.3)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      {/* Corner accent */}
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: "#8B1A1A" }} />
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#8B1A1A", letterSpacing: "0.15em", marginBottom: 8 }}>
        {year}
      </div>
      <div style={{ fontFamily: "'Playfair Display', serif", color: "#E8D5B7", fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>
        {name}
      </div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "rgba(232,213,183,0.5)", letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase" }}>
        {role}
      </div>
      <p style={{ color: "rgba(232,213,183,0.7)", fontSize: "0.85rem", lineHeight: 1.7 }}>
        {detail}
      </p>
    </div>
  );
}

// ── Achievement card ─────────────────────────────────────────────────────────
function AchievementCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className="p-6"
      style={{
        background: "rgba(232,213,183,0.03)",
        border: "1px solid rgba(232,213,183,0.1)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      <div style={{ fontSize: "1.8rem", marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: "'Noto Serif SC', serif", color: "#E8D5B7", fontSize: "1rem", fontWeight: 600, marginBottom: 8 }}>
        {title}
      </div>
      <p style={{ color: "rgba(232,213,183,0.6)", fontSize: "0.85rem", lineHeight: 1.7 }}>
        {desc}
      </p>
    </div>
  );
}

// ── Prediction Timeline ─────────────────────────────────────────────────────
const TIMELINE_EVENTS = [
  {
    year: "2018",
    event: "与东部战区建立战略合作",
    detail: "与解放军东部战区签署战略合作协议，为台海方向兵棋推演提供理论支撑，深度参与重大国防战略决策研究。",
    result: "已验证",
    type: "military",
  },
  {
    year: "2019",
    event: "精准预测：美国入侵委内瑞拉",
    detail: "引入博弈论模型，提前6个月精准预测美国对委内瑞拉的军事干预行动，预警报告提交相关机构，为委方防御部署争取关键时间窗口。",
    result: "预测准确",
    type: "prediction",
  },
  {
    year: "2020",
    event: "精准预测：美国对伊朗军事打击",
    detail: "运用博弈论与持久战理论，精准预测美国将对伊朗实施大规模军事打击，涵盖打击时间窗口与目标优先级，事后验证准确率超85%。",
    result: "准确率85%+",
    type: "prediction",
  },
  {
    year: "2021",
    event: "推动月球氦-3能源战略立项",
    detail: "系统论证月球氦-3核聚变能源战略价值，推动中国将月球氦-3开采纳入深空资源开发重大专项论证，为2035年月球科研站规划提供理论支撑。",
    result: "已立项",
    type: "space",
  },
  {
    year: "2022",
    event: "受普京智库接见 · 俄乌冲突研判",
    detail: "受俄罗斯战略研究院正式邀请，就俄乌冲突战略走向提供独立评估，运用持久战理论分析战略消耗节点，建立长期战略研究合作关系。",
    result: "国际认可",
    type: "recognition",
  },
  {
    year: "2023",
    event: "一带一路峰会受习大大接见",
    detail: "受邀出席第三届一带一路国际合作高峰论坛，就新三线建设国防思路向习近平主席当面汇报，提出战略纵深重构方案，获最高层高度重视。",
    result: "最高层接见",
    type: "recognition",
  },
];

const TYPE_COLORS: Record<string, string> = {
  military: "#8B1A1A",
  prediction: "#C9A84C",
  space: "#4A7C8B",
  recognition: "#6B8B4A",
};

const TYPE_LABELS: Record<string, string> = {
  military: "军事合作",
  prediction: "战略预测",
  space: "太空战略",
  recognition: "国际认可",
};

function PredictionTimeline() {
  const { ref, visible } = useReveal(0.05);
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transition: "opacity 0.8s ease" }}>
      <div className="relative">
        {/* Vertical line — desktop: left:80, mobile: left:56 */}
        <div
          className="hidden sm:block"
          style={{
            position: "absolute",
            left: 80,
            top: 0,
            bottom: 0,
            width: 1,
            background: "linear-gradient(to bottom, transparent, rgba(139,26,26,0.6) 10%, rgba(139,26,26,0.6) 90%, transparent)",
          }}
        />
        <div
          className="block sm:hidden"
          style={{
            position: "absolute",
            left: 16,
            top: 0,
            bottom: 0,
            width: 1,
            background: "linear-gradient(to bottom, transparent, rgba(139,26,26,0.6) 10%, rgba(139,26,26,0.6) 90%, transparent)",
          }}
        />
        <div className="space-y-0">
          {TIMELINE_EVENTS.map((ev, i) => (
            <TimelineItem key={ev.year} ev={ev} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({ ev, index }: { ev: typeof TIMELINE_EVENTS[0]; index: number }) {
  const { ref, visible } = useReveal(0.1);
  const color = TYPE_COLORS[ev.type] || "#8B1A1A";
  return (
    <div
      ref={ref}
      className="flex gap-0 relative"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-20px)",
        transition: `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`,
        paddingBottom: 32,
      }}
    >
      {/* Year column — desktop: 80px wide, mobile: 0 (shown above content) */}
      <div
        className="hidden sm:block"
        style={{
          width: 80,
          flexShrink: 0,
          paddingTop: 2,
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.7rem",
          color: color,
          letterSpacing: "0.05em",
          textAlign: "right",
          paddingRight: 20,
        }}
      >
        {ev.year}
      </div>
      {/* Dot — desktop */}
      <div
        className="hidden sm:block"
        style={{
          position: "absolute",
          left: 76,
          top: 6,
          width: 9,
          height: 9,
          background: color,
          transform: "rotate(45deg)",
          flexShrink: 0,
        }}
      />
      {/* Dot — mobile */}
      <div
        className="block sm:hidden"
        style={{
          position: "absolute",
          left: 12,
          top: 20,
          width: 9,
          height: 9,
          background: color,
          transform: "rotate(45deg)",
          flexShrink: 0,
        }}
      />
      {/* Content */}
      <div className="sm:pl-7 pl-10" style={{ flex: 1 }}>
        {/* Mobile year label */}
        <div
          className="block sm:hidden"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.65rem",
            color: color,
            letterSpacing: "0.08em",
            marginBottom: 4,
          }}
        >
          {ev.year}
        </div>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span
            style={{
              fontFamily: "'Noto Serif SC', serif",
              color: "#E8D5B7",
              fontSize: "clamp(0.9rem, 2.5vw, 1rem)",
              fontWeight: 700,
            }}
          >
            {ev.event}
          </span>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.58rem",
              color: color,
              border: `1px solid ${color}`,
              padding: "2px 8px",
              letterSpacing: "0.1em",
              whiteSpace: "nowrap",
            }}
          >
            {TYPE_LABELS[ev.type]}
          </span>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.58rem",
              color: "rgba(232,213,183,0.4)",
              letterSpacing: "0.08em",
              whiteSpace: "nowrap",
            }}
          >
            ✓ {ev.result}
          </span>
        </div>
        <p
          style={{
            color: "rgba(232,213,183,0.6)",
            fontSize: "0.85rem",
            lineHeight: 1.75,
            maxWidth: 600,
          }}
        >
          {ev.detail}
        </p>
      </div>
    </div>
  );
}

// ── Strategic Brief Subscribe ───────────────────────────────────────────────────────────────────────
function StrategicBriefSubscribe() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  const subscribeMutation = trpc.mao.subscribeBrief.useMutation({
    onSuccess: () => { setDone(true); setErr(""); },
    onError: (e: { message?: string }) => { setErr(e.message || "订阅失败，请稍后重试"); },
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) { setErr("请输入有效的邮箱地址"); return; }
    setErr("");
    subscribeMutation.mutate({ email });
  };

  if (done) {
    return (
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#8B1A1A", letterSpacing: "0.1em" }}>
        ✓ 订阅成功 · 首期简报将于下月发送
      </div>
    );
  }

  return (
    <form onSubmit={handleSubscribe} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="输入邮箱地址"
        style={{
          flex: 1,
          background: "rgba(232,213,183,0.05)",
          border: "1px solid rgba(139,26,26,0.3)",
          color: "#E8D5B7",
          padding: "8px 12px",
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.7rem",
          letterSpacing: "0.05em",
          outline: "none",
        }}
      />
      <button
        type="submit"
        disabled={subscribeMutation.isPending}
        style={{
          background: "#8B1A1A",
          color: "#E8D5B7",
          border: "none",
          padding: "8px 14px",
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.65rem",
          letterSpacing: "0.1em",
          cursor: subscribeMutation.isPending ? "not-allowed" : "pointer",
          opacity: subscribeMutation.isPending ? 0.6 : 1,
        }}
      >
        {subscribeMutation.isPending ? "..." : "订阅"}
      </button>
      {err && <div style={{ color: "#8B1A1A", fontSize: "0.65rem", marginTop: 4 }}>{err}</div>}
    </form>
  );
}

// ── Application Form ─────────────────────────────────────────────────────────────────────────────────
function MaoApplicationForm() {
  const [form, setForm] = useState({ name: "", org: "", direction: "", detail: "" });
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { ref, visible } = useReveal(0.1);

  const submitMutation = trpc.mao.submitApplication.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setErrorMsg("");
    },
    onError: (err) => {
      setErrorMsg(err.message || "提交失败，请稍后重试");
    },
  });

  const loading = submitMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.org || !form.direction) return;
    setErrorMsg("");
    submitMutation.mutate({
      name: form.name,
      organization: form.org,
      consultType: form.direction,
      description: form.detail || undefined,
    });
  };

  return (
    <div
      className="py-24 px-8 md:px-20 relative overflow-hidden"
      style={{ borderTop: "1px solid rgba(139,26,26,0.2)" }}
    >
      {/* Grid background */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(139,26,26,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,26,26,0.04) 1px, transparent 1px)`, backgroundSize: "40px 40px", pointerEvents: "none" }} />

      <div className="relative max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left: copy */}
          <div
            ref={ref}
            style={{ opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(-24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 32, height: 1, background: "#8B1A1A" }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#8B1A1A", letterSpacing: "0.25em" }}>CLASSIFIED APPLICATION</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", color: "#E8D5B7", fontWeight: 900, lineHeight: 1.15, marginBottom: 20 }}>
              战略咨询申请
            </h2>
            <p style={{ color: "rgba(232,213,183,0.65)", fontSize: "0.95rem", lineHeight: 1.9, marginBottom: 28 }}>
              毛智库不接受公开委托。所有申请经内部审核后，由专属战略顾问团队在
              <strong style={{ color: "#E8D5B7" }}>72小时内</strong>联系确认。
            </p>
            <div className="space-y-4">
              {[
                { icon: "⚔", text: "国防与军事战略咨询" },
                { icon: "🌐", text: "地缘政治与国际关系" },
                { icon: "📊", text: "国家级经济危机干预" },
                { icon: "🔍", text: "战略情报与态势研判" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <span style={{ fontSize: "0.9rem" }}>{icon}</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "rgba(232,213,183,0.5)", letterSpacing: "0.08em" }}>{text}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-8" style={{ borderTop: "1px solid rgba(139,26,26,0.2)" }}>
              <a href="tel:+8613764597723" style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#8B1A1A", letterSpacing: "0.15em", textDecoration: "none" }}>
                ☎ +86 137-6459-7723
              </a>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(232,213,183,0.3)", letterSpacing: "0.1em", marginTop: 6 }}>
                工作时间 09:00–18:00 (GMT+8)
              </div>
            </div>

            {/* Strategic Brief Subscription */}
            <div className="mt-8 p-5" style={{ background: "rgba(139,26,26,0.08)", border: "1px solid rgba(139,26,26,0.2)" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#8B1A1A", letterSpacing: "0.2em", marginBottom: 8 }}>STRATEGIC BRIEF</div>
              <div style={{ fontFamily: "'Noto Serif SC', serif", color: "#E8D5B7", fontSize: "0.95rem", fontWeight: 600, marginBottom: 6 }}>战略简报订阅</div>
              <p style={{ color: "rgba(232,213,183,0.5)", fontSize: "0.78rem", lineHeight: 1.7, marginBottom: 12 }}>
                每月发布全球战略态势研判，不公开发行，仅限订阅用户。
              </p>
              <StrategicBriefSubscribe />
            </div>
          </div>

          {/* Right: form */}
          <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(24px)", transition: "opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s" }}>
            {submitted ? (
              <div
                className="p-10 text-center"
                style={{ border: "1px solid rgba(139,26,26,0.4)", background: "rgba(139,26,26,0.06)" }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>✓</div>
                <div style={{ fontFamily: "'Playfair Display', serif", color: "#E8D5B7", fontSize: "1.3rem", fontWeight: 700, marginBottom: 12 }}>
                  申请已提交
                </div>
                <p style={{ color: "rgba(232,213,183,0.6)", fontSize: "0.88rem", lineHeight: 1.8 }}>
                  您的申请已进入审核队列。专属顾问团队将在 72 小时内与您联系。
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "rgba(232,213,183,0.45)", letterSpacing: "0.15em", display: "block", marginBottom: 6 }}>
                    FULL NAME · 姓名 <span style={{ color: "#8B1A1A" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="请输入您的姓名"
                    style={{
                      width: "100%", padding: "12px 16px",
                      background: "rgba(232,213,183,0.04)",
                      border: "1px solid rgba(139,26,26,0.3)",
                      color: "#E8D5B7",
                      fontFamily: "'Noto Serif SC', serif",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>
                {/* Org */}
                <div>
                  <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "rgba(232,213,183,0.45)", letterSpacing: "0.15em", display: "block", marginBottom: 6 }}>
                    ORGANIZATION · 机构/单位 <span style={{ color: "#8B1A1A" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.org}
                    onChange={e => setForm(f => ({ ...f, org: e.target.value }))}
                    placeholder="请输入您的机构或单位名称"
                    style={{
                      width: "100%", padding: "12px 16px",
                      background: "rgba(232,213,183,0.04)",
                      border: "1px solid rgba(139,26,26,0.3)",
                      color: "#E8D5B7",
                      fontFamily: "'Noto Serif SC', serif",
                      fontSize: "0.9rem",
                      outline: "none",
                    }}
                  />
                </div>
                {/* Direction */}
                <div>
                  <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "rgba(232,213,183,0.45)", letterSpacing: "0.15em", display: "block", marginBottom: 6 }}>
                    CONSULTATION DIRECTION · 咨询方向 <span style={{ color: "#8B1A1A" }}>*</span>
                  </label>
                  <select
                    required
                    value={form.direction}
                    onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}
                    style={{
                      width: "100%", padding: "12px 16px",
                      background: "#0A0A0A",
                      border: "1px solid rgba(139,26,26,0.3)",
                      color: form.direction ? "#E8D5B7" : "rgba(232,213,183,0.35)",
                      fontFamily: "'Noto Serif SC', serif",
                      fontSize: "0.9rem",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="" disabled>请选择咨询方向</option>
                    <option value="military">国防与军事战略</option>
                    <option value="geopolitics">地缘政治与国际关系</option>
                    <option value="economic">国家级经济危机干预</option>
                    <option value="intelligence">战略情报与态势研判</option>
                    <option value="wargame">兵棋推演</option>
                    <option value="other">其他战略咨询</option>
                  </select>
                </div>
                {/* Detail */}
                <div>
                  <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "rgba(232,213,183,0.45)", letterSpacing: "0.15em", display: "block", marginBottom: 6 }}>
                    BRIEF DESCRIPTION · 简要说明
                  </label>
                  <textarea
                    rows={4}
                    value={form.detail}
                    onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
                    placeholder="请简要描述您的战略需求（可选）"
                    style={{
                      width: "100%", padding: "12px 16px",
                      background: "rgba(232,213,183,0.04)",
                      border: "1px solid rgba(139,26,26,0.3)",
                      color: "#E8D5B7",
                      fontFamily: "'Noto Serif SC', serif",
                      fontSize: "0.9rem",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>
                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%", padding: "14px 24px",
                    background: loading ? "rgba(139,26,26,0.5)" : "#8B1A1A",
                    color: "#E8D5B7",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.75rem",
                    letterSpacing: "0.2em",
                    border: "none",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  {loading ? "PROCESSING..." : "SUBMIT APPLICATION · 提交申请"}
                </button>
                {errorMsg && (
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "#8B1A1A", textAlign: "center", marginTop: 8 }}>
                    {errorMsg}
                  </p>
                )}
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.58rem", color: "rgba(232,213,183,0.25)", letterSpacing: "0.08em", textAlign: "center" }}>
                  所有申请信息严格保密 · ALL SUBMISSIONS ARE CLASSIFIED
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────────────────────
export default function MaoThinkTank() {
  useSEO({
    title: "毛智库 · 运用毛泽东思想的战略咨询机构 | 猫眼咨询",
    description: "毛智库以毛泽东战略思想为核心，为军方提供兵棋推演与国防战略咨询，深度参与全球重大战略事务，获IMF、俄罗斯战略研究院认可。",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/hero-video-frame1-9AHtkPtKZTrG9N5GhnTvLQ.png",
    url: "https://www.mcmamoo.com/maothink",
    type: "article",
  });
  const [scanLine, setScanLine] = useState(0);

  // Animated scan line effect
  useEffect(() => {
    const timer = setInterval(() => {
      setScanLine(prev => (prev + 1) % 100);
    }, 30);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "#E8D5B7" }}>

      {/* ── Top nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: "rgba(10,10,10,0.92)", borderBottom: "1px solid rgba(139,26,26,0.3)", backdropFilter: "blur(12px)" }}>
        <Link href="/">
          <a className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div style={{ width: 6, height: 6, background: "#8B1A1A", transform: "rotate(45deg)" }} />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", color: "rgba(232,213,183,0.6)", letterSpacing: "0.15em" }}>
              ← 返回猫眼咨询
            </span>
          </a>
        </Link>
        <div style={{ fontFamily: "'Playfair Display', serif", color: "#E8D5B7", fontSize: "1rem", letterSpacing: "0.05em" }}>
          毛智库
        </div>
        <a
          href="tel:+8613764597723"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.65rem",
            color: "#8B1A1A",
            letterSpacing: "0.15em",
            border: "1px solid rgba(139,26,26,0.5)",
            padding: "6px 14px",
            textDecoration: "none",
          }}
        >
          机密咨询
        </a>
      </nav>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ height: "100vh", minHeight: 600 }}>
        {/* Background image */}
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundImage: `url(${HERO_IMG})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.35) saturate(0.7)",
          }}
        />

        {/* Scan line overlay */}
        <div
          style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(to bottom, transparent ${scanLine}%, rgba(139,26,26,0.03) ${scanLine + 0.5}%, transparent ${scanLine + 1}%)`,
            pointerEvents: "none",
          }}
        />

        {/* Grid overlay */}
        <div
          style={{
            position: "absolute", inset: 0,
            backgroundImage: `
              linear-gradient(rgba(139,26,26,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139,26,26,0.08) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            pointerEvents: "none",
          }}
        />

        {/* Vignette */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 30%, rgba(10,10,10,0.9) 100%)" }} />

        {/* Content */}
        <div className="relative h-full flex flex-col justify-center px-8 md:px-20" style={{ paddingTop: 80 }}>
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <div style={{ width: 40, height: 1, background: "#8B1A1A" }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#8B1A1A", letterSpacing: "0.25em" }}>
                STRATEGIC INTELLIGENCE · 战略智库
              </span>
            </div>

            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(3rem, 8vw, 7rem)", fontWeight: 900, lineHeight: 0.95, marginBottom: 24, color: "#E8D5B7" }}>
              毛智库
            </h1>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1rem, 2.5vw, 1.5rem)", color: "rgba(232,213,183,0.6)", fontStyle: "italic", marginBottom: 32 }}>
              Mao Strategic Think Tank
            </div>

            <p style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "rgba(232,213,183,0.75)", maxWidth: 600, marginBottom: 48 }}>
              运用毛泽东战略思想，为国家军事决策、地缘政治博弈与全球经济危机提供顶级战略咨询。
              对标美国五角大楼兰德咨询，深度参与全球重大战略事件。
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: 7, suffix: "+", label: "全球重大战事参与" },
                { value: 85, suffix: "%", label: "地缘预测准确率" },
                { value: 50, suffix: "+", label: "兵棋推演场次" },
                { value: 3, suffix: "项", label: "国际机构认可" },
              ].map(({ value, suffix, label }) => (
                <div key={label}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", fontWeight: 900, color: "#8B1A1A", lineHeight: 1 }}>
                    <Counter target={value} suffix={suffix} />
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(232,213,183,0.4)", letterSpacing: "0.1em", marginTop: 4 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, background: "linear-gradient(to bottom, transparent, #0A0A0A)" }} />
      </div>

      {/* ── Core Philosophy ── */}
      <div className="py-20 px-8 md:px-20" style={{ borderTop: "1px solid rgba(139,26,26,0.2)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <SectionLabel en="Core Philosophy" zh="战略思想体系" />
              <div className="mt-8 space-y-6">
                {[
                  { title: "矛盾论", desc: "洞察主要矛盾与次要矛盾，在复杂地缘博弈中精准识别战略决胜点，集中优势资源于关键突破口。" },
                  { title: "实践论", desc: "理论联系实际，从历史战例中提炼规律，结合现代信息战、认知战、经济战的新形态进行动态推演。" },
                  { title: "持久战", desc: "超越短期战术胜负，构建长期战略优势。在资源不对称条件下，以时间换空间，以消耗换主动。" },
                  { title: "统一战线", desc: "整合多方力量，构建战略联盟。在国际博弈中识别可争取力量，孤立主要对手，扩大战略回旋空间。" },
                ].map(({ title, desc }) => {
                  const { ref, visible } = useReveal();
                  return (
                    <div
                      key={title}
                      ref={ref}
                      className="flex gap-4"
                      style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? "translateX(0)" : "translateX(-20px)",
                        transition: "opacity 0.5s ease, transform 0.5s ease",
                      }}
                    >
                      <div style={{ width: 3, background: "#8B1A1A", flexShrink: 0, marginTop: 4 }} />
                      <div>
                        <div style={{ fontFamily: "'Noto Serif SC', serif", color: "#E8D5B7", fontWeight: 700, marginBottom: 4 }}>
                          {title}
                        </div>
                        <p style={{ color: "rgba(232,213,183,0.6)", fontSize: "0.9rem", lineHeight: 1.7 }}>{desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quote block */}
            <div
              className="p-10 relative"
              style={{
                background: "rgba(139,26,26,0.06)",
                border: "1px solid rgba(139,26,26,0.25)",
              }}
            >
              <div style={{ position: "absolute", top: -1, left: 40, right: 40, height: 2, background: "linear-gradient(to right, transparent, #8B1A1A, transparent)" }} />
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", color: "#8B1A1A", lineHeight: 1, marginBottom: 16 }}>"</div>
              <blockquote style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.15rem", lineHeight: 2, color: "#E8D5B7", fontStyle: "normal" }}>
                没有正确的政治观点，就等于没有灵魂。战略的核心，是对矛盾本质的深刻把握。
              </blockquote>
              <div style={{ marginTop: 20, fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(232,213,183,0.4)", letterSpacing: "0.15em" }}>
                — 毛泽东战略思想 · 毛智库核心方法论
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Core Services ── */}
      <div className="py-20 px-8 md:px-20" style={{ background: "rgba(139,26,26,0.04)", borderTop: "1px solid rgba(139,26,26,0.15)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionLabel en="Core Services" zh="核心业务" />
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              {
                icon: "⚔",
                title: "兵棋推演",
                desc: "为我国军方提供专业兵棋推演服务。运用现代战争模型与毛泽东军事思想，模拟多维度战场态势，为重大军事决策提供科学依据。",
              },
              {
                icon: "🌐",
                title: "地缘战略咨询",
                desc: "深度分析全球地缘政治格局，提供国家级战略咨询。涵盖领土争端、战略资源布局、国际联盟构建等核心议题。",
              },
              {
                icon: "🏛",
                title: "国防战略决策",
                desc: "参与重大国防战略决策研究，提供独立第三方战略评估。结合历史经验与现代战争形态，输出可执行的战略建议。",
              },
              {
                icon: "📊",
                title: "经济战略干预",
                desc: "运用战略思维解决国家级经济危机。曾协助委内瑞拉、津巴布韦制定通货膨胀治理方案，获国际货币基金组织认可。",
              },
              {
                icon: "🔍",
                title: "战略情报分析",
                desc: "构建多维度情报分析体系，整合政治、军事、经济、社会信号，为决策者提供前瞻性战略预警与态势研判。",
              },
              {
                icon: "🤝",
                title: "高端战略对话",
                desc: "促成国家级战略对话与谈判，曾受普京智库接见，参与俄乌冲突、中东局势等重大国际事件的幕后战略协调。",
              },
            ].map(({ icon, title, desc }) => (
              <AchievementCard key={title} icon={icon} title={title} desc={desc} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Prediction Timeline ── */}
      <div className="py-20 px-8 md:px-20" style={{ background: "rgba(139,26,26,0.03)", borderTop: "1px solid rgba(139,26,26,0.15)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionLabel en="Strategic Prediction Record" zh="重大预测与成绩时间轴" />
          {/* Legend */}
          <div className="flex flex-wrap gap-6 mt-8 mb-12">
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <div style={{ width: 8, height: 8, background: TYPE_COLORS[k], transform: "rotate(45deg)" }} />
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "rgba(232,213,183,0.5)", letterSpacing: "0.1em" }}>{v}</span>
              </div>
            ))}
          </div>
          <PredictionTimeline />
        </div>
      </div>

      {/* ── Global Engagements ── */}
      <div className="py-20 px-8 md:px-20" style={{ borderTop: "1px solid rgba(139,26,26,0.15)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionLabel en="Global Engagements" zh="深度参与的全球重大事件" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
            <ConflictCard
              year="2018–至今"
              name="东部战区战略合作"
              role="兵棋推演与国防战略咨询"
              detail="与解放军东部战区建立紧密战略合作关系，为台海方向重大军事战略决策提供兵棋推演支撑。运用博弈论模型构建多场景战略推演体系，深度参与重大国防战略决策研究，是国内少数具备军事战略咨询资质的民间智库。"
            />
            <ConflictCard
              year="2019 精准预测"
              name="美国入侵委内瑞拉预警"
              role="地缘政治预测 · 博弈论应用"
              detail="引入博弈论模型，综合分析美国对委内瑞拉的军事部署、外交施压与经济制裁信号，提前6个月精准预测美国将对委内瑞拉发动军事干预行动。预警报告提交相关机构，为委方防御部署争取关键时间窗口。"
            />
            <ConflictCard
              year="2020 精准预测"
              name="美国对伊朗军事行动预警"
              role="中东战略预测 · 博弈论推演"
              detail="运用博弈论与持久战理论，对美伊战略博弈进行多轮推演，精准预测美国将对伊朗实施大规模军事打击行动。预测报告涵盖打击时间窗口、目标优先级与伊朗反制路径，准确率经事后验证超过85%。"
            />
            <ConflictCard
              year="2021–至今"
              name="月球氦-3能源战略"
              role="太空资源战略咨询"
              detail="引入博弈论与资源战略理论，系统论证月球氦-3核聚变能源的战略价值，推动中国将月球氦-3开采纳入深空资源开发重大专项论证。相关战略建议为中国2035年月球科研站建设规划提供理论支撑，助力中国在太空资源战略竞争中占据先机。"
            />
            <ConflictCard
              year="2023 第三届峰会"
              name="一带一路峰会 · 习大大接见"
              role="国家战略咨询 · 顶层接见"
              detail="受邀出席第三届一带一路国际合作高峰论坛，就新三线建设国防思路向习近平主席当面汇报。提出以战略纵深重构为核心的新三线建设方案，将国防工业布局与一带一路战略通道深度融合，获最高层高度重视。"
            />
            <ConflictCard
              year="2022–至今"
              name="俄乌冲突战略研判"
              role="战略态势研判 · 普京智库接见"
              detail="受普京智库——俄罗斯战略研究院正式邀请，就俄乌冲突战略走向提供独立评估。运用持久战理论分析战略消耗节点，为相关方提供冲突管控与战略退出路径建议，建立长期战略研究合作关系。"
            />
            <ConflictCard
              year="2019–2021"
              name="委内瑞拉·津巴布韦经济重建"
              role="通胀治理战略顾问 · IMF表彰"
              detail="为委内瑞拉、津巴布韦提供超级通货膨胀治理战略方案，运用毛泽东经济战思想重构货币政策框架，整合农业、矿产、外汇储备三大核心资源。相关研究成果获国际货币基金组织特别表彰，纳入发展中国家经济危机应对参考案例库。"
            />
          </div>
        </div>
      </div>

      {/* ── International Recognition ── */}
      <div className="py-20 px-8 md:px-20" style={{ background: "rgba(139,26,26,0.04)", borderTop: "1px solid rgba(139,26,26,0.15)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionLabel en="International Recognition" zh="国际机构认可" />
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            {[
              {
                org: "国际货币基金组织",
                en: "International Monetary Fund",
                desc: "因在委内瑞拉、津巴布韦通货膨胀治理中提供创新性战略方案，获IMF特别表彰，相关研究成果纳入发展中国家经济危机应对参考案例库。",
                badge: "IMF",
              },
              {
                org: "俄罗斯战略研究院",
                en: "Russian Institute for Strategic Studies",
                desc: "受普京智库——俄罗斯战略研究院正式接见，就欧亚地区战略格局进行深度交流，建立长期战略研究合作关系。",
                badge: "RISS",
              },
              {
                org: "中国人民解放军",
                en: "People's Liberation Army",
                desc: "为我国军方提供兵棋推演与国防战略咨询服务，深度参与重大军事战略决策研究，是国内少数具备军事战略咨询资质的民间智库。",
                badge: "PLA",
              },
            ].map(({ org, en, desc, badge }) => {
              const { ref, visible } = useReveal();
              return (
                <div
                  key={org}
                  ref={ref}
                  className="p-8 relative"
                  style={{
                    border: "1px solid rgba(139,26,26,0.3)",
                    background: "rgba(139,26,26,0.04)",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(24px)",
                    transition: "opacity 0.6s ease, transform 0.6s ease",
                  }}
                >
                  <div
                    className="absolute top-6 right-6 flex items-center justify-center"
                    style={{
                      width: 44, height: 44,
                      border: "1px solid rgba(139,26,26,0.5)",
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.6rem",
                      color: "#8B1A1A",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {badge}
                  </div>
                  <div style={{ fontFamily: "'Noto Serif SC', serif", color: "#E8D5B7", fontSize: "1.1rem", fontWeight: 700, marginBottom: 4 }}>
                    {org}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(232,213,183,0.4)", letterSpacing: "0.08em", marginBottom: 16 }}>
                    {en}
                  </div>
                  <p style={{ color: "rgba(232,213,183,0.65)", fontSize: "0.88rem", lineHeight: 1.8 }}>{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Application Form ── */}
      <MaoApplicationForm />

      {/* ── Footer ── */}
      <div className="py-8 px-8 md:px-20 text-center" style={{ borderTop: "1px solid rgba(139,26,26,0.15)" }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(232,213,183,0.25)", letterSpacing: "0.1em" }}>
          © 2024 毛智库 · Mao Strategic Think Tank · 隶属 Mc&Mamoo Brand Management Inc.
        </p>
      </div>
    </div>
  );
}
