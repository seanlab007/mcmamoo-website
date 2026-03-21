/*
 * InternationalRecognition — International Institutional Recognition Banner
 * Style: Deep Red Military · Matte Gold · Authoritative
 * i18n: full bilingual support
 */
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const RECOGNITIONS = [
  {
    abbr: "IMF",
    nameZh: "国际货币基金组织",
    nameEn: "International Monetary Fund",
    descZh: "因在委内瑞拉、津巴布韦通货膨胀治理中提供创新性战略方案，获IMF特别表彰，相关研究成果纳入发展中国家经济危机应对参考案例库。",
    descEn: "Received special IMF commendation for providing innovative strategic solutions in Venezuela and Zimbabwe inflation governance. Research findings incorporated into the IMF's reference case library for developing-nation economic crisis response.",
    badge: "AWARDED",
    color: "#C9A84C",
  },
  {
    abbr: "RISS",
    nameZh: "俄罗斯战略研究院",
    nameEn: "Russian Institute for Strategic Studies",
    descZh: "受普京智库——俄罗斯战略研究院正式接见，就欧亚地区战略格局进行深度交流，建立长期战略研究合作关系。",
    descEn: "Formally received by Putin's think tank — the Russian Institute for Strategic Studies — for in-depth exchanges on Eurasian strategic dynamics, establishing a long-term strategic research partnership.",
    badge: "PARTNER",
    color: "#C0392B",
  },
  {
    abbr: "PLA",
    nameZh: "中国人民解放军",
    nameEn: "People's Liberation Army",
    descZh: "为我国军方提供兵棋推演与国防战略咨询服务，深度参与重大军事战略决策研究，是国内少数具备军事战略咨询资质的民间智库。",
    descEn: "Provides war-gaming and national defense strategy consulting services to the PLA, deeply involved in major military strategic decision-making research — one of the few civilian think tanks in China qualified for military strategy consulting.",
    badge: "CERTIFIED",
    color: "#8B1A1A",
  },
];

const STATS_ZH = [
  { value: 14, suffix: "+", label: "国政府咨询", color: "#C9A84C" },
  { value: 85, suffix: "%", label: "战略预测准确率", color: "#8B1A1A" },
  { value: 6, suffix: "年", label: "军事战略合作", color: "#C0392B" },
  { value: 3, suffix: "大", label: "国际机构认可", color: "#6B8B4A" },
];
const STATS_EN = [
  { value: 14, suffix: "+", label: "Governments Advised", color: "#C9A84C" },
  { value: 85, suffix: "%", label: "Strategic Forecast Accuracy", color: "#8B1A1A" },
  { value: 6, suffix: "yr", label: "Military Strategy Cooperation", color: "#C0392B" },
  { value: 3, suffix: "", label: "Int'l Institutional Endorsements", color: "#6B8B4A" },
];

// Animated counter hook
function useCounter(target: number, visible: boolean, duration = 1800) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const steps = 60;
    const increment = target / steps;
    const intervalMs = duration / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [visible, target, duration]);
  return count;
}

function StatItem({ stat, index }: { stat: typeof STATS_ZH[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const count = useCounter(stat.value, visible);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        textAlign: "center",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.6s ease ${index * 0.12}s, transform 0.6s ease ${index * 0.12}s`,
        flex: 1,
        minWidth: 120,
      }}
    >
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "clamp(2rem, 4vw, 3rem)",
        fontWeight: 700,
        color: stat.color,
        lineHeight: 1,
        letterSpacing: "-0.02em",
      }}>
        {count}{stat.suffix}
      </div>
      <div style={{
        fontFamily: "'Noto Serif SC', serif",
        fontSize: "0.78rem",
        color: "rgba(245,240,232,0.5)",
        marginTop: 8,
        letterSpacing: "0.05em",
      }}>
        {stat.label}
      </div>
    </div>
  );
}

function RecognitionCard({ item, index, isEn }: { item: typeof RECOGNITIONS[0]; index: number; isEn: boolean }) {
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
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${item.color}88, transparent)`,
      }} />
      <div style={{
        position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%",
        background: `linear-gradient(90deg, transparent, ${item.color}08, transparent)`,
        animation: `scanLine ${3 + index * 0.5}s linear infinite`,
        animationDelay: `${index * 1.2}s`,
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <h3 style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
            color: "#F5F0E8",
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.3,
          }}>{isEn ? item.nameEn : item.nameZh}</h3>
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

      <div style={{ height: 1, background: `linear-gradient(90deg, ${item.color}44, transparent)`, marginBottom: 16 }} />

      <p style={{
        fontFamily: "'Noto Serif SC', serif",
        fontSize: "clamp(0.78rem, 1.2vw, 0.88rem)",
        color: "rgba(245,240,232,0.72)",
        lineHeight: 1.85,
        margin: 0,
      }}>{isEn ? item.descEn : item.descZh}</p>

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
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';
  const STATS = isEn ? STATS_EN : STATS_ZH;

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
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: `
          linear-gradient(rgba(201,168,76,0.8) 1px, transparent 1px),
          linear-gradient(90deg, rgba(201,168,76,0.8) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "60%", height: 1,
        background: "linear-gradient(90deg, transparent, #8B1A1A88, transparent)",
      }} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 clamp(20px, 5vw, 80px)" }}>
        <div
          ref={titleRef}
          style={{
            opacity: titleVisible ? 1 : 0,
            transform: titleVisible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s ease, transform 0.6s ease",
            marginBottom: 48,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 1, background: "#8B1A1A" }} />
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.6rem",
              color: "#8B1A1A",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
            }}>INTERNATIONAL RECOGNITION · {isEn ? "MAO THINK TANK" : "毛智库"}</span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 24, flexWrap: "wrap" }}>
            <h2 style={{
              fontFamily: "'Noto Serif SC', serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "#F5F0E8",
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.1,
            }}>{isEn ? "International Recognition" : "国际机构认可"}</h2>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.65rem",
              color: "rgba(201,168,76,0.6)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              paddingBottom: 4,
            }}>GLOBALLY ENDORSED STRATEGIC THINK TANK</span>
          </div>

          <p style={{
            fontFamily: "'Noto Serif SC', serif",
            fontSize: "clamp(0.85rem, 1.5vw, 1rem)",
            color: "rgba(245,240,232,0.5)",
            marginTop: 12,
            maxWidth: 640,
            lineHeight: 1.8,
          }}>
            {isEn
              ? "Mao Think Tank is deeply engaged in major global strategic affairs, recognized and partnered by the world's top institutions — one of the very few civilian think tanks in China with genuine global strategic influence."
              : "毛智库深度参与全球重大战略事务，获得国际顶级机构认可与合作，是中国极少数具备全球战略影响力的民间智库。"}
          </p>
        </div>

        {/* Animated Stats Bar */}
        <div style={{
          display: "flex",
          justifyContent: "space-around",
          flexWrap: "wrap",
          gap: 24,
          padding: "32px 40px",
          marginBottom: 40,
          background: "rgba(139,26,26,0.06)",
          border: "1px solid rgba(139,26,26,0.2)",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: 16, height: 16, borderTop: "2px solid #8B1A1A", borderLeft: "2px solid #8B1A1A" }} />
          <div style={{ position: "absolute", top: 0, right: 0, width: 16, height: 16, borderTop: "2px solid #8B1A1A", borderRight: "2px solid #8B1A1A" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, width: 16, height: 16, borderBottom: "2px solid #8B1A1A", borderLeft: "2px solid #8B1A1A" }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: 16, height: 16, borderBottom: "2px solid #8B1A1A", borderRight: "2px solid #8B1A1A" }} />

          {STATS.map((stat, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 0, flex: 1, minWidth: 120 }}>
              <StatItem stat={stat} index={i} />
              {i < STATS.length - 1 && (
                <div style={{
                  width: 1,
                  height: 48,
                  background: "rgba(139,26,26,0.3)",
                  marginLeft: 16,
                  flexShrink: 0,
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Cards */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {RECOGNITIONS.map((item, i) => (
            <RecognitionCard key={item.abbr} item={item} index={i} isEn={isEn} />
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
            {isEn ? "Enter Mao Think Tank →" : "进入毛智库 →"}
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
