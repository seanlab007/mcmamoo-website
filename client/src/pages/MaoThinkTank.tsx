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

// ── Think Tank Pricing Tiers ─────────────────────────────────────────────────────────────────────────────────────────
const thinkTankPricing_zh = [
  {
    id: "wargame",
    icon: "⚔",
    title: "兵棋推演服务",
    subtitle: "Wargame Simulation Service",
    badge: "军事层级",
    badgeColor: "#8B1A1A",
    plans: [
      {
        name: "单次推演",
        period: "单次",
        price: "200",
        unit: "万",
        originalPrice: null,
        highlight: false,
        features: ["单场景兵棋推演", "推演报告与复盘", "关键决策节点分析", "战略建议摘要"],
        cta: "预约推演",
      },
      {
        name: "季度推演计划",
        period: "3个月",
        price: "500",
        unit: "万",
        originalPrice: "600万",
        highlight: false,
        features: ["每月一场完整推演", "多场景对抗推演", "实时态势分析支持", "季度战略研讨会", "专属分析师团队"],
        cta: "预约和谈",
      },
      {
        name: "年度战略伙伴",
        period: "12个月",
        price: "1500",
        unit: "万",
        originalPrice: "2400万",
        highlight: true,
        features: ["全年不限次兵棋推演", "实时战略情报支持", "重大决策实时和议", "月度战略委员会会议", "高管团队战略培训", "专属战略顾问团队"],
        cta: "立即洽谈",
      },
    ],
  },
  {
    id: "strategy-sandbox",
    icon: "🏛",
    title: "战略沙盘和分析",
    subtitle: "Strategy Sandbox & Analysis",
    badge: "顶级定制",
    badgeColor: "#C9A84C",
    plans: [
      {
        name: "战略诊断",
        period: "单次",
        price: "30",
        unit: "万",
        originalPrice: null,
        highlight: false,
        features: ["行业深度研究报告", "竞争格局分析", "趋势预判与机会识别", "战略建议摘要"],
        cta: "预约定制",
      },
      {
        name: "季度战略情报",
        period: "3个月",
        price: "80",
        unit: "万",
        originalPrice: "90万",
        highlight: false,
        features: ["每月战略情报简报", "行业动态实时预警", "竞争对手深度监测", "季度战略研讨会", "专属研究员支持"],
        cta: "预约和谈",
      },
      {
        name: "年度战略会员",
        period: "12个月",
        price: "100",
        unit: "万",
        originalPrice: "360万",
        highlight: true,
        features: ["全年战略情报订阅", "月度高管战略简报", "重大事件实时预警", "年度战略峰会参与资格", "毛智库研究成果优先获取", "不限次战略和议热线"],
        cta: "立即加入",
      },
    ],
  },
];

const thinkTankPricing_en = [
  {
    id: "wargame",
    icon: "⚔",
    title: "Wargame Simulation",
    subtitle: "Wargame Simulation Service",
    badge: "Military Grade",
    badgeColor: "#8B1A1A",
    plans: [
      {
        name: "Single Session",
        period: "One-Time",
        price: "¥2M",
        unit: "",
        originalPrice: null,
        highlight: false,
        features: ["Single-Scenario Wargame", "Debrief Report & Replay", "Key Decision Node Analysis", "Strategic Recommendations Summary"],
        cta: "Book Session",
      },
      {
        name: "Quarterly Plan",
        period: "3 Months",
        price: "¥5M",
        unit: "",
        originalPrice: "¥6M",
        highlight: false,
        features: ["Monthly Full Wargame", "Multi-Scenario Adversarial Simulation", "Real-Time Situation Analysis", "Quarterly Strategy Workshop", "Dedicated Analyst Team"],
        cta: "Book Consultation",
      },
      {
        name: "Annual Strategic Partner",
        period: "12 Months",
        price: "¥15M",
        unit: "",
        originalPrice: "¥24M",
        highlight: true,
        features: ["Unlimited Annual Wargames", "Real-Time Strategic Intelligence", "Major Decision Hotline", "Monthly Strategy Committee", "Executive Team Training", "Dedicated Advisory Team"],
        cta: "Negotiate Now",
      },
    ],
  },
  {
    id: "strategy-sandbox",
    icon: "🏛",
    title: "Strategy Sandbox & Analysis",
    subtitle: "Strategy Sandbox & Analysis",
    badge: "Elite Custom",
    badgeColor: "#C9A84C",
    plans: [
      {
        name: "Strategic Diagnostic",
        period: "One-Time",
        price: "¥300K",
        unit: "",
        originalPrice: null,
        highlight: false,
        features: ["Industry Deep Research Report", "Competitive Landscape Analysis", "Trend Forecasting & Opportunity ID", "Strategic Recommendations Summary"],
        cta: "Book Custom",
      },
      {
        name: "Quarterly Intelligence",
        period: "3 Months",
        price: "¥800K",
        unit: "",
        originalPrice: "¥900K",
        highlight: false,
        features: ["Monthly Strategic Intelligence Brief", "Industry Real-Time Alerts", "Competitor Deep Monitoring", "Quarterly Strategy Workshop", "Dedicated Research Support"],
        cta: "Book Consultation",
      },
      {
        name: "Annual Member",
        period: "12 Months",
        price: "¥1M",
        unit: "",
        originalPrice: "¥3.6M",
        highlight: true,
        features: ["Full-Year Intelligence Subscription", "Monthly Executive Brief", "Major Event Real-Time Alerts", "Annual Strategy Summit Access", "Priority Research Access", "Unlimited Consulting Hotline"],
        cta: "Join Now",
      },
    ],
  },
];

function MaoThinkTankPricing({ isEn }: { isEn: boolean }) {
  const { ref, visible } = useReveal(0.05);
  const tiers = isEn ? thinkTankPricing_en : thinkTankPricing_zh;
  return (
    <div
      ref={ref}
      className="py-24 px-8 md:px-20"
      style={{
        borderTop: "1px solid rgba(139,26,26,0.2)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(30px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-12">
          <div style={{ width: 32, height: 1, background: "#8B1A1A" }} />
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#8B1A1A", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 6 }}>
              {isEn ? "SERVICE PRICING" : "SERVICE PRICING · 服务定价"}
            </div>
            <h2 style={{ fontFamily: "'Noto Serif SC', serif", color: "#E8D5B7", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 700, lineHeight: 1.3 }}>
              {isEn ? "Choose Your Strategic Plan" : "选择适合你的战略方案"}
            </h2>
          </div>
        </div>

        {/* Pricing tiers */}
        <div className="space-y-14">
          {tiers.map((tier) => (
            <div key={tier.id}>
              {/* Tier header */}
              <div className="flex items-center gap-4 mb-6">
                <span style={{ fontSize: "1.4rem" }}>{tier.icon}</span>
                <span
                  className="text-xs font-bold tracking-widest uppercase px-3 py-1"
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    background: `${tier.badgeColor}18`,
                    color: tier.badgeColor,
                    border: `1px solid ${tier.badgeColor}40`,
                  }}
                >
                  {tier.badge}
                </span>
                <span style={{ fontFamily: "'Noto Serif SC', serif", color: "#E8D5B7", fontSize: "1.1rem", fontWeight: 600 }}>
                  {tier.title}
                </span>
                <div style={{ flex: 1, height: 1, background: "rgba(139,26,26,0.2)" }} />
              </div>

              {/* Plan cards */}
              <div
                className="grid md:grid-cols-3"
                style={{ border: "1px solid rgba(139,26,26,0.25)" }}
              >
                {tier.plans.map((plan, idx) => (
                  <div
                    key={plan.name}
                    className="relative p-7 flex flex-col"
                    style={{
                      background: plan.highlight ? "rgba(139,26,26,0.08)" : "rgba(232,213,183,0.02)",
                      borderRight: idx < tier.plans.length - 1 ? "1px solid rgba(139,26,26,0.2)" : "none",
                    }}
                  >
                    {/* Highlight top bar */}
                    {plan.highlight && (
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "#8B1A1A" }} />
                    )}
                    {plan.highlight && (
                      <div
                        style={{
                          position: "absolute", top: 10, right: 10,
                          background: "#8B1A1A",
                          color: "#E8D5B7",
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "0.58rem",
                          letterSpacing: "0.15em",
                          padding: "2px 8px",
                        }}
                      >
                        {isEn ? "BEST VALUE" : "最优选择"}
                      </div>
                    )}

                    {/* Plan name */}
                    <div style={{ fontFamily: "'Noto Serif SC', serif", color: "#E8D5B7", fontSize: "1rem", fontWeight: 700, marginBottom: 4 }}>
                      {plan.name}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "rgba(232,213,183,0.4)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
                      {plan.period}
                    </div>

                    {/* Price */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 900, color: plan.highlight ? "#8B1A1A" : "#C9A84C", lineHeight: 1 }}>
                          {plan.price}
                        </span>
                        {plan.unit && (
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.8rem", color: "rgba(232,213,183,0.5)" }}>{plan.unit}</span>
                        )}
                      </div>
                      {plan.originalPrice && (
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(232,213,183,0.25)", textDecoration: "line-through", marginTop: 4 }}>
                          {isEn ? "List: " : "原价："}{plan.originalPrice}
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="flex-1" style={{ listStyle: "none", padding: 0, margin: 0, marginBottom: 24 }}>
                      {plan.features.map((f) => (
                        <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, color: "rgba(232,213,183,0.65)", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: 8 }}>
                          <span style={{ color: plan.highlight ? "#8B1A1A" : "#C9A84C", fontSize: "0.7rem", flexShrink: 0, marginTop: 3 }}>✓</span>
                          {f}
 * ============================================================
 * MaoThinkTank Page — 毛智库军事战略与兵棋推演
 * ============================================================
 * 定价架构：6 级定价梯度（3 AI + 3 专家）
 * 业务范围：To 军队 / 国防战略 / 兵棋推演
 * ============================================================
 * ⚠️  PROTECTED FILE — 由 Manus 统一维护
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Check, Brain, Sparkles, Shield, Zap } from "lucide-react";

// ─── 定价数据定义 ────────────────────────────────────────────────────────────

const pricingData_zh = {
  aiGroup: {
    name: "AI 组 (AI-Powered)",
    icon: <Sparkles className="text-[#40d090]" size={24} />,
    desc: "AI 驱动的军事分析与兵棋推演方案",
    plans: [
      {
        name: "AI 战略分析",
        period: "单次",
        price: "198",
        unit: "元",
        features: [
          "AI 军事态势分析",
          "情报数据综合",
          "战略趋势预测",
          "专项研究报告"
        ]
      },
      {
        name: "AI 兵棋推演",
        period: "单次",
        price: "19800",
        unit: "元",
        highlight: true,
        features: [
          "AI 兵棋模拟系统",
          "多场景推演",
          "实时数据分析",
          "完整推演报告",
          "3 套方案对比"
        ]
      },
      {
        name: "AI 国防咨询",
        period: "3 个月",
        price: "98000",
        unit: "元",
        features: [
          "持续战略分析",
          "定期兵棋推演",
          "专项研究支持",
          "月度报告",
          "实时数据监测"
        ]
      }
    ]
  },
  expertGroup: {
    name: "专家组 (Expert-Led)",
    icon: <Brain className="text-[#C9A84C]" size={24} />,
    desc: "顶级军事战略专家团队操刀",
    plans: [
      {
        name: "专家战略咨询",
        period: "单次",
        price: "68000",
        unit: "元",
        features: [
          "深度战略分析",
          "专家评估意见",
          "国防建议方案",
          "详细分析报告",
          "专家答疑"
        ]
      },
      {
        name: "专家兵棋推演",
        period: "单次",
        price: "200000",
        unit: "元",
        highlight: true,
        features: [
          "完整兵棋推演",
          "多方案模拟",
          "专家现场指导",
          "详细推演报告",
          "战略建议"
        ]
      },
      {
        name: "顶级国防合伙",
        period: "1 年",
        price: "2000000",
        unit: "元",
        features: [
          "年度战略护航",
          "定期兵棋推演",
          "专家陪跑",
          "季度战略评审",
          "全域国防支持"
        ]
      }
    ]
  }
};

// ─── 组件定义 ────────────────────────────────────────────────────────────

interface PricingPlan {
  name: string;
  period: string;
  price: string;
  unit: string;
  features: string[];
  highlight?: boolean;
}

interface PricingGroup {
  name: string;
  icon: React.ReactNode;
  desc: string;
  plans: PricingPlan[];
}

export default function MaoThinkTank() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-8 md:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-4 py-2 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-full mb-6">
              <span className="text-[#EF4444] text-xs font-bold tracking-widest uppercase">MILITARY STRATEGY</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 font-['Noto_Serif_SC']">
              毛智库
            </h1>
            <p className="text-white/50 text-lg max-w-2xl mx-auto mb-4">
              专业的军事战略咨询与兵棋推演服务
            </p>
            <p className="text-white/60 text-base max-w-3xl mx-auto">
              为国防建设、军事战略、国家安全提供专业的智力支持与战略咨询。
              从 AI 驱动的快速分析到顶级专家的深度护航，打造国防竞争力。
            </p>
          </div>
        </div>
      </section>

      {/* Business Overview */}
      <section className="py-16 px-8 md:px-20 bg-[#111]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 border border-white/10 rounded-sm">
              <Shield className="text-[#EF4444] mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">国防战略</h3>
              <p className="text-white/60 text-sm">
                深度分析国防形势，提供战略建议，支持国防决策。
              </p>
            </div>
            <div className="p-6 border border-white/10 rounded-sm">
              <Zap className="text-[#EF4444] mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">兵棋推演</h3>
              <p className="text-white/60 text-sm">
                完整的兵棋模拟系统，多场景推演，实时数据分析。
              </p>
            </div>
            <div className="p-6 border border-white/10 rounded-sm">
              <Brain className="text-[#EF4444] mb-4" size={32} />
              <h3 className="text-xl font-bold mb-2">专家陪跑</h3>
              <p className="text-white/60 text-sm">
                顶级军事战略专家，全年度护航，季度评审。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-8 md:px-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 font-['Noto_Serif_SC']">
              6 级定价体系
            </h2>
            <p className="text-white/60">
              3 AI 方案 + 3 专家方案 | 从 ¥198 到 ¥2000 万
            </p>
          </div>

          {/* Pricing Groups */}
          <div className="space-y-16">
            {/* AI Group */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                {pricingData_zh.aiGroup.icon}
                <div>
                  <h3 className="text-2xl font-bold">{pricingData_zh.aiGroup.name}</h3>
                  <p className="text-white/50 text-sm">{pricingData_zh.aiGroup.desc}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {pricingData_zh.aiGroup.plans.map((plan, idx) => (
                  <div
                    key={idx}
                    className={`p-6 border rounded-sm transition-all ${
                      plan.highlight
                        ? "bg-[#40d090]/10 border-[#40d090]"
                        : "bg-white/5 border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="mb-4">
                      <h4 className="text-lg font-bold mb-1">{plan.name}</h4>
                      <p className="text-white/50 text-xs">{plan.period}</p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">¥{plan.price}</span>
                        <span className="text-white/50">{plan.unit}</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, featureIdx) => (
                        <li key={featureIdx} className="flex items-start gap-2 text-sm text-white/70">
                          <Check size={16} className="text-[#40d090] flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <a
                      href="#contact"
                      style={{
                        display: "block",
                        textAlign: "center",
                        padding: "12px 20px",
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "0.7rem",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        transition: "all 0.2s",
                        background: plan.highlight ? "#8B1A1A" : "transparent",
                        color: plan.highlight ? "#E8D5B7" : "rgba(232,213,183,0.6)",
                        border: plan.highlight ? "none" : "1px solid rgba(139,26,26,0.4)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={e => {
                        if (!plan.highlight) {
                          (e.currentTarget as HTMLAnchorElement).style.background = "rgba(139,26,26,0.15)";
                          (e.currentTarget as HTMLAnchorElement).style.color = "#E8D5B7";
                        }
                      }}
                      onMouseLeave={e => {
                        if (!plan.highlight) {
                          (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                          (e.currentTarget as HTMLAnchorElement).style.color = "rgba(232,213,183,0.6)";
                        }
                      }}
                    >
                      {plan.cta}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div
          className="mt-10 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(139,26,26,0.15)" }}
        >
          <p style={{ color: "rgba(232,213,183,0.35)", fontSize: "0.85rem", maxWidth: 480, lineHeight: 1.7 }}>
            {isEn
              ? "All engagements are strictly confidential. Custom packages available for national-level and Fortune 500 clients."
              : "所有合作信息严格保密。国家级客户与世界500强企业可洽谈定制专属方案。"}
          </p>
          <a
            href="/pricing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 24px",
              background: "transparent",
              color: "#C9A84C",
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              border: "1px solid rgba(201,168,76,0.4)",
              textDecoration: "none",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {isEn ? "Full Pricing Details →" : "查看完整定价 →"}
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Application Form ─────────────────────────────────────────────────────────────────────────────────────────
function MaoApplicationForm({ isEn }: { isEn: boolean }) {
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
    title: "毛智库 · 运用毛泽东思想的战略咨询机构 · 对标兰德咨询 | 猫眼咨询",
    description: "毛智库以毛泽东战略思想为核心，为军方提供兵棋推演与国防战略咨询，深度参与全球重大战略事务。获IMF、俄罗斯战略研究院认可，对标美国五角大楼兰德咨询。",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/maothink-hero-mJvZ3PuQkyhYspYTZQbG3W.webp",
    url: "https://www.mcmamoo.com/maothink",
    type: "article",
    keywords: "毛智库,毛泽东战略思想,战略咨询机构,兰德咨询,五角大楼,国防战略,兵棋推演,地缘政治预测,战略研究,猫眼咨询,IMF认可,俄罗斯战略研究院",
    breadcrumbs: [
      { name: "首页", url: "/" },
      { name: "毛智库", url: "/maothink" },
    ],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "毛智库 · 运用毛泽东思想的战略咨询机构 · 对标兰德咨询",
        "description": "毛智库以毛泽东战略思想为核心，为军方提供兵棋推演与国防战略咨询，深度参与全球重大战略事务，获IMF、俄罗斯战略研究院认可。",
        "image": "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/maothink-hero-mJvZ3PuQkyhYspYTZQbG3W.webp",
        "url": "https://www.mcmamoo.com/maothink",
        "publisher": { "@id": "https://www.mcmamoo.com/#organization" },
        "author": { "@id": "https://www.mcmamoo.com/#organization" },
        "datePublished": "2024-01-01",
        "dateModified": "2024-01-01",
        "keywords": "毛智库,毛泽东战略思想,战略咨询,兰德咨询,国防战略",
        "articleSection": "战略智库"
      }
    ],
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

      {/* ── Pricing Tiers ── */}
      <MaoThinkTankPricing isEn={isEn} />
      {/* ── Application Form ── */}
      <MaoApplicationForm />

      {/* ── Footer ── */}
      <div className="py-8 px-8 md:px-20 text-center" style={{ borderTop: "1px solid rgba(139,26,26,0.15)" }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(232,213,183,0.25)", letterSpacing: "0.1em" }}>
          © 2024 毛智库 · Mao Strategic Think Tank · 隶属 Mc&Mamoo Brand Management Inc.
        </p>
      </div>

            {/* Expert Group */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                {pricingData_zh.expertGroup.icon}
                <div>
                  <h3 className="text-2xl font-bold">{pricingData_zh.expertGroup.name}</h3>
                  <p className="text-white/50 text-sm">{pricingData_zh.expertGroup.desc}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {pricingData_zh.expertGroup.plans.map((plan, idx) => (
                  <div
                    key={idx}
                    className={`p-6 border rounded-sm transition-all ${
                      plan.highlight
                        ? "bg-[#C9A84C]/10 border-[#C9A84C]"
                        : "bg-white/5 border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="mb-4">
                      <h4 className="text-lg font-bold mb-1">{plan.name}</h4>
                      <p className="text-white/50 text-xs">{plan.period}</p>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">¥{plan.price}</span>
                        <span className="text-white/50">{plan.unit}</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, featureIdx) => (
                        <li key={featureIdx} className="flex items-start gap-2 text-sm text-white/70">
                          <Check size={16} className="text-[#C9A84C] flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button className="w-full py-2 px-4 bg-[#C9A84C] text-[#0A0A0A] text-xs font-bold tracking-widest uppercase hover:bg-[#D4B866] transition-all rounded-sm">
                      立即咨询
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 历史验证 Timeline */}
      <section className="py-24 bg-white/[0.01]">
        <div className="container">
          <div className="text-center mb-16">
            <div className="text-[#8B1A1A] text-[10px] font-bold tracking-[0.3em] uppercase mb-4">Strategic Verification</div>
            <h2 className="text-4xl font-bold font-['Noto_Serif_SC']">历史验证与国际认可</h2>
          </div>
          <div className="max-w-4xl mx-auto space-y-12">
            {TIMELINE_EVENTS.map((event, idx) => (
              <div key={idx} className="flex gap-8 items-start group">
                <div className="w-24 shrink-0 text-right">
                  <div className="text-[#8B1A1A] font-mono text-xl font-bold">{event.year}</div>
                  <div className="text-[10px] text-[#E8D5B7]/30 uppercase tracking-widest mt-1">{event.result}</div>
                </div>
                <div className="w-px h-full bg-gradient-to-b from-[#8B1A1A] to-transparent shrink-0" />
                <div className="pb-12">
                  <h4 className="text-xl font-bold mb-3 text-[#E8D5B7] group-hover:text-[#8B1A1A] transition-colors">{event.event}</h4>
                  <p className="text-[#E8D5B7]/50 text-sm leading-relaxed">{event.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="py-24 border-t border-[#8B1A1A]/20 bg-[#8B1A1A]/5">
        <div className="container text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 font-['Noto_Serif_SC']">
            {isEn ? "Military Strategic Consulting" : "申请资质审核"}
          </h2>
          <p className="text-[#E8D5B7]/50 mb-12 max-w-2xl mx-auto">
            毛智库业务属于独立军事咨询范畴，主要面向国防机构与军队。相关服务需经过严格的资质审核与保密协议签署。
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <a href="#contact" className="px-12 py-5 bg-[#8B1A1A] text-white font-bold tracking-widest uppercase hover:bg-[#A52A2A] transition-all flex items-center gap-3">
              立即申请 <ArrowRight size={18} />
            </a>
            <div className="text-[#E8D5B7]/30 text-xs font-mono">
              * 仅限相关国防机构与授权单位申请
            </div>
          </div>
      {/* CTA Section */}
      <section className="py-16 px-8 md:px-20 bg-[#111]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 font-['Noto_Serif_SC']">
            为国防建设提供智力支持
          </h2>
          <p className="text-white/60 mb-8">
            毛智库汇聚顶级军事战略专家，为国家安全与国防建设提供专业咨询。
          </p>
          <button className="px-8 py-3 bg-[#EF4444] text-white text-sm font-bold tracking-widest uppercase hover:bg-[#DC2626] transition-all rounded-sm">
            预约专家咨询
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
