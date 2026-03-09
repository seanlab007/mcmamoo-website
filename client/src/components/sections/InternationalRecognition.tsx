/**
 * InternationalRecognition — 首页国际机构认可横幅
 * 放置在 Hero 正下方，进门第一眼看到的核心信任背书
 * 风格：深红军事 · 哑金 · 权威震慑
 */
import { useEffect, useRef, useState } from "react";

const RECOGNITIONS = [
  {
    abbr: "IMF",
    name: "国际货币基金组织",
    nameEn: "International Monetary Fund",
    desc: "因在委内瑞拉、津巴布韦通货膨胀治理中提供创新性战略方案，获IMF特别表彰，相关研究成果纳入发展中国家经济危机应对参考案例库。",
    badge: "AWARDED",
    color: "#C9A84C",
  },
  {
    abbr: "RISS",
    name: "俄罗斯战略研究院",
    nameEn: "Russian Institute for Strategic Studies",
    desc: "受普京智库——俄罗斯战略研究院正式接见，就欧亚地区战略格局进行深度交流，建立长期战略研究合作关系。",
    badge: "PARTNER",
    color: "#C0392B",
  },
  {
    abbr: "PLA",
    name: "中国人民解放军",
    nameEn: "People's Liberation Army",
    desc: "为我国军方提供兵棋推演与国防战略咨询服务，深度参与重大军事战略决策研究，是国内少数具备军事战略咨询资质的民间智库。",
    badge: "CERTIFIED",
    color: "#8B1A1A",
  },
];

function RecognitionCard({ item, index }: { item: typeof RECOGNITIONS[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s ease ${index * 0.15}s, transform 0.7s ease ${index * 0.15}s`,
        background: "rgba(10,0,0,0.7)",
        border: `1px solid ${item.color}33`,
        borderTop: `2px solid ${item.color}`,
        padding: "32px 28px",
        position: "relative",
        overflow: "hidden",
        flex: 1,
        minWidth: 0,
      }}
    >
      {/* Background glow */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${item.color}88, transparent)`,
      }} />

      {/* Scan line animation */}
      <div style={{
        position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%",
        background: `linear-gradient(90deg, transparent, ${item.color}08, transparent)`,
        animation: `scanLine ${3 + index * 0.5}s linear infinite`,
        animationDelay: `${index * 1.2}s`,
      }} />

      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h3 style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
            color: "#F5F0E8",
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.3,
          }}>{item.name}</h3>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.6rem",
            color: `${item.color}99`,
            letterSpacing: "0.12em",
            margin: "6px 0 0",
            textTransform: "uppercase",
          }}>{item.nameEn}</p>
        </div>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          flexShrink: 0, marginLeft: 16,
        }}>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "1rem",
            fontWeight: 700,
            color: item.color,
            letterSpacing: "0.08em",
            border: `1px solid ${item.color}66`,
            padding: "4px 10px",
            lineHeight: 1,
          }}>{item.abbr}</div>
          <div style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.45rem",
            color: `${item.color}88`,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}>{item.badge}</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: `linear-gradient(90deg, ${item.color}44, transparent)`, marginBottom: 16 }} />

      {/* Description */}
      <p style={{
        fontFamily: "'Noto Serif SC', serif",
        fontSize: "clamp(0.78rem, 1.2vw, 0.88rem)",
        color: "rgba(245,240,232,0.72)",
        lineHeight: 1.85,
        margin: 0,
      }}>{item.desc}</p>

      {/* Corner accent */}
      <div style={{
        position: "absolute", bottom: 0, right: 0,
        width: 40, height: 40,
        borderTop: `1px solid ${item.color}44`,
        borderLeft: `1px solid ${item.color}44`,
        transform: "rotate(180deg)",
      }} />
    </div>
  );
}

export default function InternationalRecognition() {
  const titleRef = useRef<HTMLDivElement>(null);
  const [titleVisible, setTitleVisible] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTitleVisible(true); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section style={{
      background: "linear-gradient(180deg, #0A0A0A 0%, #0D0000 40%, #0A0A0A 100%)",
      padding: "80px 0 72px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Tactical grid background */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: `
          linear-gradient(rgba(201,168,76,0.8) 1px, transparent 1px),
          linear-gradient(90deg, rgba(201,168,76,0.8) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
      }} />

      {/* Red glow top */}
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "60%", height: 1,
        background: "linear-gradient(90deg, transparent, #8B1A1A88, transparent)",
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 80px)" }}>

        {/* Section header */}
        <div
          ref={titleRef}
          style={{
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
            marginBottom: 48,
          }}
        >
          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 1, background: "#8B1A1A" }} />
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.6rem",
              color: "#8B1A1A",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
            }}>INTERNATIONAL RECOGNITION · 毛智库</span>
          </div>

          {/* Title */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap" }}>
            <h2 style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "#F5F0E8",
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.1,
            }}>国际机构认可</h2>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.65rem",
              color: "rgba(201,168,76,0.6)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              paddingBottom: 4,
            }}>GLOBALLY ENDORSED STRATEGIC THINK TANK</span>
          </div>

          {/* Subtitle */}
          <p style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "clamp(0.85rem, 1.5vw, 1rem)",
            color: "rgba(245,240,232,0.5)",
            marginTop: 12,
            maxWidth: 640,
            lineHeight: 1.8,
          }}>
            毛智库深度参与全球重大战略事务，获得国际顶级机构认可与合作，
            是中国极少数具备全球战略影响力的民间智库。
          </p>
        </div>

        {/* Cards */}
        <div style={{
          display: "flex",
          gap: 20,
          flexWrap: "wrap",
        }}>
          {RECOGNITIONS.map((item, i) => (
            <RecognitionCard key={item.abbr} item={item} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div style={{
          marginTop: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          borderTop: "1px solid rgba(139,26,26,0.2)",
          paddingTop: 32,
          opacity: titleVisible ? 1 : 0,
          transition: "opacity 0.6s ease 0.6s",
        }}>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.65rem",
            color: "rgba(245,240,232,0.3)",
            letterSpacing: "0.12em",
            margin: 0,
            textTransform: "uppercase",
          }}>
            STRATEGIC INTELLIGENCE · GLOBAL INFLUENCE · MAOZHIKU THINK TANK
          </p>
          <a
            href="/maothink"
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.65rem",
              color: "#8B1A1A",
              letterSpacing: "0.15em",
              textDecoration: "none",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "color 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#C9A84C")}
            onMouseLeave={e => (e.currentTarget.style.color = "#8B1A1A")}
          >
            进入毛智库 →
          </a>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0% { left: -60%; }
          100% { left: 160%; }
        }
      `}</style>
    </section>
  );
}
