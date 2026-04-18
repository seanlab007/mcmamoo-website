/*
 * BusinessDivision — 两大业务入口分区
 * Design: 品牌全案（金色粒子流）vs 毛智库（深红扫描线）双面对称布局
 * 位置：首页 Hero 下方，直接展示公司双业务定位
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

function useReveal(threshold = 0.12) {
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

// Gold particle canvas for Brand panel
function GoldParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number; alphaDir: number }[] = [];
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        alphaDir: Math.random() > 0.5 ? 1 : -1,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha += p.alphaDir * 0.004;
        if (p.alpha > 0.6 || p.alpha < 0.05) p.alphaDir *= -1;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,76,${p.alpha})`;
        ctx.fill();
      }
      // Draw faint connecting lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(201,168,76,${0.06 * (1 - dist / 80)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

// Red scan line canvas for Mao panel
function RedScanLines() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanY = useRef(0);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Horizontal grid lines
      ctx.strokeStyle = "rgba(139,26,26,0.06)";
      ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += 28) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      // Vertical grid lines
      for (let x = 0; x < canvas.width; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Moving scan line
      scanY.current = (scanY.current + 1.2) % canvas.height;
      const grad = ctx.createLinearGradient(0, scanY.current - 30, 0, scanY.current + 30);
      grad.addColorStop(0, "rgba(139,26,26,0)");
      grad.addColorStop(0.5, "rgba(139,26,26,0.18)");
      grad.addColorStop(1, "rgba(139,26,26,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY.current - 30, canvas.width, 60);

      // Bright scan line
      ctx.beginPath();
      ctx.moveTo(0, scanY.current);
      ctx.lineTo(canvas.width, scanY.current);
      ctx.strokeStyle = "rgba(139,26,26,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

export default function BusinessDivision() {
  const { ref, visible } = useReveal();

  return (
    <section
      id="business"
      ref={ref}
      className="relative overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}
    >
      {/* Section label */}
      <div className="text-center py-10 px-8" style={{ borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
        <div className="flex items-center justify-center gap-3">
          <div style={{ width: 40, height: 1, background: "rgba(201,168,76,0.4)" }} />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.62rem", color: "rgba(201,168,76,0.6)", letterSpacing: "0.25em", textTransform: "uppercase" }}>
            Two Core Businesses · 双核业务
          </span>
          <div style={{ width: 40, height: 1, background: "rgba(201,168,76,0.4)" }} />
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="grid md:grid-cols-2" style={{ minHeight: "auto" }}>

        {/* Left — 品牌全案 */}
        <BizPanel
          side="left"
          accent="#C9A84C"
          accentBg="rgba(201,168,76,0.04)"
          borderColor="rgba(201,168,76,0.12)"
          tag="Brand Management · 品牌全案"
          title="品牌全案"
          subtitle="Make Brands Premium"
          desc="运用猫眼「错位竞争」方法论，从品牌定位、KOL矩阵到全域营销一体化操盘，帮助品牌在竞争红海中找到高溢价增长路径。"
          metrics={[
            { val: "8亿+", label: "蟹太太年营收" },
            { val: "20亿", label: "小仙炖5年营收" },
            { val: "500+", label: "头部KOL合作" },
          ]}
          cta={{ label: "查看品牌案例", href: "/#cases" }}
          isExternal={false}
          decorChar="◆"
          bg={<GoldParticles />}
        />

        {/* Divider */}
        <div
          className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(201,168,76,0.2) 20%, rgba(139,26,26,0.2) 80%, transparent)", transform: "translateX(-50%)" }}
        />

        {/* Right — 毛智库 */}
        <BizPanel
          side="right"
          accent="#8B1A1A"
          accentBg="rgba(139,26,26,0.04)"
          borderColor="rgba(139,26,26,0.12)"
          tag="Strategic Think Tank · 战略智库"
          title="毛智库"
          subtitle="Mao Strategic Think Tank"
          desc="运用毛泽东战略思想体系，为国家机构、军方及国际组织提供兵棋推演、地缘战略咨询与重大决策支持。对标美国兰德公司。"
          metrics={[
            { val: "受邀", label: "普京智库接见" },
            { val: "IMF", label: "国际货币基金组织认可" },
            { val: "PLA", label: "解放军战略合作" },
          ]}
          cta={{ label: "了解毛智库", href: "/maothink" }}
          isExternal={true}
          decorChar="◈"
          bg={<RedScanLines />}
        />
      </div>
    </section>
  );
}

interface BizPanelProps {
  side: "left" | "right";
  accent: string;
  accentBg: string;
  borderColor: string;
  tag: string;
  title: string;
  subtitle: string;
  desc: string;
  metrics: { val: string; label: string }[];
  cta: { label: string; href: string };
  isExternal: boolean;
  decorChar: string;
  bg: React.ReactNode;
}

function BizPanel({ side, accent, accentBg, borderColor, tag, title, subtitle, desc, metrics, cta, isExternal, decorChar, bg }: BizPanelProps) {
  const [hovered, setHovered] = useState(false);

  const content = (
    <div
      className="relative h-full flex flex-col justify-between p-8 sm:p-10 md:p-14 cursor-pointer overflow-hidden"
      style={{
        background: hovered ? accentBg : "transparent",
        borderRight: side === "left" ? `1px solid ${borderColor}` : "none",
        borderBottom: `1px solid ${borderColor}`,
        transition: "background 0.35s ease",
        minHeight: 380,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Dynamic background canvas */}
      {bg}

      {/* Decorative corner char */}
      <div
        style={{
          position: "absolute",
          top: 24,
          right: side === "left" ? 24 : "auto",
          left: side === "right" ? 24 : "auto",
          fontFamily: "'Playfair Display', serif",
          fontSize: "4rem",
          color: accent,
          opacity: hovered ? 0.15 : 0.06,
          lineHeight: 1,
          transition: "opacity 0.35s ease",
          userSelect: "none",
          zIndex: 1,
        }}
      >
        {decorChar}
      </div>

      {/* Top section */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: accent, letterSpacing: "0.2em", marginBottom: 20, opacity: 0.8 }}>
          {tag}
        </div>
        <h3 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "#F5F0E8", lineHeight: 1.1, marginBottom: 8 }}>
          {title}
        </h3>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", color: accent, fontStyle: "italic", marginBottom: 24, opacity: 0.8 }}>
          {subtitle}
        </div>
        <p style={{ color: "rgba(245,240,232,0.6)", fontSize: "0.9rem", lineHeight: 1.85, maxWidth: 420 }}>
          {desc}
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 my-8" style={{ position: "relative", zIndex: 1 }}>
        {metrics.map(({ val, label }) => (
          <div key={label}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.3rem", fontWeight: 900, color: accent, marginBottom: 4 }}>
              {val}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "rgba(245,240,232,0.35)", letterSpacing: "0.08em", lineHeight: 1.4 }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          className="inline-flex items-center gap-3"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.7rem",
            color: accent,
            letterSpacing: "0.12em",
            borderBottom: `1px solid ${accent}`,
            paddingBottom: 4,
            opacity: hovered ? 1 : 0.7,
            transition: "opacity 0.25s ease",
          }}
        >
          {cta.label}
          <span style={{ transform: hovered ? "translateX(4px)" : "translateX(0)", transition: "transform 0.25s ease", display: "inline-block" }}>→</span>
        </div>
      </div>
    </div>
  );

  if (isExternal) {
    return <a href={cta.href} style={{ textDecoration: "none", display: "block" }}>{content}</a>;
  }
  return (
    <Link href={cta.href}>
      <a style={{ textDecoration: "none", display: "block" }}>{content}</a>
    </Link>
  );
}
