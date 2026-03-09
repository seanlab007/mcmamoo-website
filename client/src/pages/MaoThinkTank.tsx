/*
 * 毛智库 — Mao Strategic Think Tank
 * Design: 军事战略风格 · 深红+暗金+哑黑 · 兵棋推演地图美学
 * Typography: Playfair Display (titles) + DM Mono (labels) + Noto Serif SC (Chinese)
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MaoThinkTank() {
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
              对标美国兰德公司，深度参与全球重大战略事件。
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: 30, suffix: "+", label: "全球战略事件" },
                { value: 15, suffix: "+", label: "国家级合作" },
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

      {/* ── Global Engagements ── */}
      <div className="py-20 px-8 md:px-20" style={{ borderTop: "1px solid rgba(139,26,26,0.15)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionLabel en="Global Engagements" zh="深度参与的全球重大事件" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
            <ConflictCard
              year="1980–1988"
              name="两伊战争"
              role="战略分析与冲突推演"
              detail="对波斯湾地区地缘战略格局进行深度分析，运用持久战理论研究不对称战争中的战略消耗规律，为后续中东战略布局提供历史参照。"
            />
            <ConflictCard
              year="2003–2011"
              name="伊拉克战争"
              role="反介入战略研究"
              detail="深入研究超级大国单边主义军事干预模式，分析城市游击战与非对称作战的战略逻辑，形成反介入/区域拒止战略理论框架。"
            />
            <ConflictCard
              year="2019–2020"
              name="委内瑞拉经济危机"
              role="通胀治理战略顾问"
              detail="为委内瑞拉政府提供超级通货膨胀治理战略方案，运用战略思维重构货币政策框架，相关建议获国际货币基金组织认可与表彰。"
            />
            <ConflictCard
              year="2020–2021"
              name="津巴布韦经济重建"
              role="国家经济战略咨询"
              detail="协助津巴布韦制定后通胀时代经济复苏战略，整合农业、矿产、外汇储备三大核心资源，构建可持续的国家经济安全体系。"
            />
            <ConflictCard
              year="2022–至今"
              name="俄乌冲突"
              role="战略态势研判"
              detail="受普京智库邀请，就俄乌冲突战略走向提供独立评估。运用持久战理论分析战略消耗节点，为相关方提供冲突管控与战略退出路径建议。"
            />
            <ConflictCard
              year="2023–至今"
              name="中东局势"
              role="地区战略平衡研究"
              detail="深度参与中东地区战略平衡研究，分析多方博弈格局，为相关国家提供地区安全架构重建与战略利益协调的顶层设计建议。"
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

      {/* ── CTA ── */}
      <div
        className="py-24 px-8 md:px-20 text-center relative overflow-hidden"
        style={{ borderTop: "1px solid rgba(139,26,26,0.2)" }}
      >
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(139,26,26,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139,26,26,0.05) 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
        <div className="relative max-w-2xl mx-auto">
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#8B1A1A", letterSpacing: "0.25em", marginBottom: 16 }}>
            CLASSIFIED · 机密咨询
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 4vw, 3rem)", color: "#E8D5B7", fontWeight: 900, marginBottom: 16 }}>
            战略咨询，仅限受邀
          </h2>
          <p style={{ color: "rgba(232,213,183,0.6)", fontSize: "1rem", lineHeight: 1.8, marginBottom: 40 }}>
            毛智库不接受公开委托。如需战略咨询，请通过猫眼咨询官方渠道提交申请，经审核后由专属顾问团队联系。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+8613764597723"
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "14px 36px",
                background: "#8B1A1A",
                color: "#E8D5B7",
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.75rem",
                letterSpacing: "0.15em",
                textDecoration: "none",
                transition: "opacity 0.2s",
              }}
            >
              ☎ 立即联系
            </a>
            <Link href="/">
              <a
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "14px 36px",
                  border: "1px solid rgba(232,213,183,0.3)",
                  color: "rgba(232,213,183,0.7)",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.75rem",
                  letterSpacing: "0.15em",
                  textDecoration: "none",
                  transition: "opacity 0.2s",
                }}
              >
                返回猫眼咨询
              </a>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="py-8 px-8 md:px-20 text-center" style={{ borderTop: "1px solid rgba(139,26,26,0.15)" }}>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(232,213,183,0.25)", letterSpacing: "0.1em" }}>
          © 2024 毛智库 · Mao Strategic Think Tank · 隶属 Mc&Mamoo Brand Management Inc.
        </p>
      </div>
    </div>
  );
}
