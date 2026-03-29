/*
 * 江中猴姑案例详情页
 * Design: 深色大地色调 · 暗绿+金色 · 健康食品品类创新
 */
import { useEffect, useRef, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "wouter";
import RelatedCases from "@/components/RelatedCases";
import ShareBar from "@/components/ShareBar";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/jiangzhong-hero-KXANLzXFb4CfE2Wse65obd.webp";

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

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
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
  return <span ref={ref}>{count}{suffix}</span>;
}

function SectionHeader({ en, zh }: { en: string; zh: string }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease", marginBottom: 40 }}>
      <div className="flex items-center gap-3 mb-3">
        <div style={{ width: 28, height: 1, background: "#C9A84C" }} />
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#C9A84C", letterSpacing: "0.2em", textTransform: "uppercase" }}>{en}</span>
      </div>
      <h2 style={{ fontFamily: "'Noto Serif SC', serif", color: "#F5F0E8", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 700 }}>{zh}</h2>
    </div>
  );
}

function RevealBlock({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

export default function CaseJiangzhong() {
  useSEO({
    title: "江中猴姑饼干 · 上市第一年17亿销售额 · 养胃食品品类创新 | 猫眼增长引擎 Mc&Mamoo Growth Engine",
    description: "猫眼增长引擎 Mc&Mamoo Growth Engine操盘江中猴姑饼干，洞察养胃需求，跨界错位OTC领域进入快消品，上市第一年销售额达17亿元，开创养胃食品新品类，成为天猫养胃食品第一品牌。",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/jiangzhong-hero-KXANLzXFb4CfE2Wse65obd.webp",
    url: "https://www.mcmamoo.com/cases/jiangzhong",
    type: "article",
    keywords: "江中猴姑饼干,养胃食品,品类创新,新消费品牌营销,OTC跨界,猫眼增长引擎 Mc&Mamoo Growth Engine案例,功能性食品,健康食品品牌",
    breadcrumbs: [
      { name: "首页", url: "/" },
      { name: "标杆案例", url: "/#cases" },
      { name: "江中猴姑饼干", url: "/cases/jiangzhong" },
    ],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "江中猴姑饼干 · 上市第一年17亿销售额 · 养胃食品品类开创案例",
        "description": "猫眼增长引擎 Mc&Mamoo Growth Engine操盘江中猴姑饼干，从用户体验出发，错位OTC领域，进入快消品赛道，上市第一年销售额达17亿元。",
        "image": "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/jiangzhong-hero-KXANLzXFb4CfE2Wse65obd.webp",
        "url": "https://www.mcmamoo.com/cases/jiangzhong",
        "publisher": { "@id": "https://www.mcmamoo.com/#organization" },
        "author": { "@id": "https://www.mcmamoo.com/#organization" },
        "datePublished": "2013-01-01",
        "dateModified": "2024-01-01",
        "keywords": "江中猴姑,养胃饼干,品类创新,功能食品品牌",
        "articleSection": "品牌案例"
      }
    ],
  });
  return (
    <div style={{ background: "#080C0A", minHeight: "100vh", color: "#F5F0E8" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: "rgba(8,12,10,0.92)", borderBottom: "1px solid rgba(201,168,76,0.15)", backdropFilter: "blur(12px)" }}>
        <Link href="/"><a className="flex items-center gap-2 hover:opacity-70 transition-opacity" style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(245,240,232,0.5)", letterSpacing: "0.15em" }}>← 返回首页</a></Link>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(201,168,76,0.6)", letterSpacing: "0.15em" }}>CASE STUDY · 标杆案例</span>
        <Link href="/#cases"><a style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#C9A84C", letterSpacing: "0.1em", border: "1px solid rgba(201,168,76,0.4)", padding: "6px 14px", textDecoration: "none" }}>查看更多案例</a></Link>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ height: "100vh", minHeight: 600 }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${HERO_IMG})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.28) saturate(0.7)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(8,12,10,0.85) 45%, transparent 100%)" }} />
        <div className="relative h-full flex flex-col justify-center px-8 md:px-20" style={{ paddingTop: 80 }}>
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 28, height: 1, background: "#C9A84C" }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#C9A84C", letterSpacing: "0.2em" }}>CASE STUDY · 标杆案例</span>
            </div>
            <h1 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "clamp(2rem, 6vw, 5rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: 12, color: "#F5F0E8" }}>江中猴姑饼干</h1>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(0.9rem, 2vw, 1.2rem)", color: "rgba(201,168,76,0.8)", fontStyle: "italic", marginBottom: 24 }}>
              Jiangzhong — Monkey Head Mushroom Biscuit
            </div>
            <p style={{ fontSize: "1rem", lineHeight: 1.9, color: "rgba(245,240,232,0.7)", maxWidth: 520, marginBottom: 48 }}>
              洞察慢性胃病患者的养胃刚需，错位OTC领域，依托江中集团胃药研发优势，
              跨界打造猴姑饼干，上市第一年销售额破17亿元。
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: 17, suffix: "亿", label: "上市第一年销售额" },
                { value: 1, suffix: "年", label: "从0到行业第一" },
                { value: 300, suffix: "%+", label: "超越奥利奥增速" },
                { value: 100, suffix: "%", label: "市场空白占领率" },
              ].map(({ value, suffix, label }) => (
                <div key={label}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem", fontWeight: 900, color: "#C9A84C", lineHeight: 1 }}>
                    <Counter target={value} suffix={suffix} />
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(245,240,232,0.4)", letterSpacing: "0.1em", marginTop: 4 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, background: "linear-gradient(to bottom, transparent, #080C0A)" }} />
      </div>

      {/* Strategy */}
      <div className="py-16 px-8 md:px-20" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHeader en="Strategic Insight" zh="核心洞察与战略" />
          <div className="grid md:grid-cols-2 gap-12">
            <RevealBlock>
              <p style={{ color: "rgba(245,240,232,0.75)", lineHeight: 1.9, fontSize: "0.95rem", marginBottom: 20 }}>
                2013年，中国有超过<strong style={{ color: "#C9A84C" }}>1.2亿慢性胃病患者</strong>，
                他们长期面临一个痛点：市面上没有专门针对养胃需求的日常零食。
                猫眼增长引擎 Mc&Mamoo Growth Engine发现了这个被忽视的巨大市场空白。
              </p>
              <p style={{ color: "rgba(245,240,232,0.75)", lineHeight: 1.9, fontSize: "0.95rem", marginBottom: 20 }}>
                战略核心：<strong style={{ color: "#F5F0E8" }}>错位OTC领域，跨界进入快消品</strong>。
                江中集团拥有猴头菇胃药的研发背书，猫眼增长引擎 Mc&Mamoo Growth Engine建议将这一医药级成分
                转化为日常消费品，以饼干这一高频消费品类为载体，
                与奥利奥等快消品巨头在完全不同的维度竞争。
              </p>
              <p style={{ color: "rgba(245,240,232,0.75)", lineHeight: 1.9, fontSize: "0.95rem" }}>
                定价策略上，猴姑饼干定价远高于普通饼干，但远低于药品，
                精准卡位"<strong style={{ color: "#C9A84C" }}>功能性健康食品</strong>"的价格带，
                建立了竞争对手无法轻易复制的品类壁垒。
              </p>
            </RevealBlock>
            <div className="space-y-4">
              {[
                { icon: "🎯", title: "用户洞察", desc: "1.2亿慢性胃病患者，日常养胃需求长期无产品满足" },
                { icon: "⚡", title: "错位竞争", desc: "不与奥利奥打价格战，在「功能性饼干」赛道独占鳌头" },
                { icon: "🔬", title: "技术壁垒", desc: "依托江中集团猴头菇胃药研发背书，建立信任护城河" },
                { icon: "📺", title: "传播策略", desc: "央视广告+明星代言，快速建立全国性品牌认知" },
              ].map(({ icon, title, desc }) => (
                <RevealBlock key={title}>
                  <div className="flex gap-4 p-5" style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.12)" }}>
                    <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{icon}</span>
                    <div>
                      <div style={{ fontFamily: "'Noto Serif SC', serif", color: "#F5F0E8", fontWeight: 600, marginBottom: 4 }}>{title}</div>
                      <p style={{ color: "rgba(245,240,232,0.55)", fontSize: "0.85rem", lineHeight: 1.7 }}>{desc}</p>
                    </div>
                  </div>
                </RevealBlock>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="py-16 px-8 md:px-20" style={{ background: "rgba(201,168,76,0.02)", borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="max-w-4xl mx-auto">
          <SectionHeader en="Growth Timeline" zh="增长时间轴" />
          <div className="space-y-0">
            {[
              { year: "2013 Q1", event: "猫眼增长引擎 Mc&Mamoo Growth Engine提出猴姑饼干战略方案", detail: "洞察慢性胃病患者养胃需求，提出「功能性饼干」品类创新方向，确定错位竞争核心战略。" },
              { year: "2013 Q3", event: "产品研发与包装设计完成", detail: "将猴头菇提取物融入饼干配方，设计高端健康感包装，定价锚定功能性食品价格带。" },
              { year: "2013 Q4", event: "央视广告投放，全国上市", detail: "大规模央视广告投放，配合明星代言，快速建立「猴姑饼干=养胃」的品类认知。" },
              { year: "2014", event: "上市第一年销售额破17亿元", detail: "成为中国快消品史上增速最快的新品之一，超越众多传统饼干品牌，成为功能性食品标杆案例。" },
            ].map(({ year, event, detail }, i) => (
              <RevealBlock key={year} delay={i * 100}>
                <div className="flex gap-6 pb-8 relative">
                  <div className="flex flex-col items-center" style={{ minWidth: 100 }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#C9A84C", letterSpacing: "0.1em", textAlign: "right", whiteSpace: "nowrap" }}>{year}</div>
                    <div style={{ width: 1, flex: 1, background: "rgba(201,168,76,0.2)", marginTop: 8 }} />
                  </div>
                  <div className="pb-4" style={{ borderLeft: "none" }}>
                    <div style={{ fontFamily: "'Noto Serif SC', serif", color: "#F5F0E8", fontWeight: 700, marginBottom: 6 }}>{event}</div>
                    <p style={{ color: "rgba(245,240,232,0.6)", fontSize: "0.88rem", lineHeight: 1.7 }}>{detail}</p>
                  </div>
                </div>
              </RevealBlock>
            ))}
          </div>
        </div>
      </div>

      {/* Share bar */}
      <div className="px-8 md:px-20 py-6" style={{ borderTop: "1px solid rgba(201,168,76,0.08)" }}>
        <ShareBar title="江中猴姑饥饲饼干" description="养胃食品品类创新，天猫养胃食品第一" />
      </div>

      {/* Related Cases */}
      <RelatedCases current="jiangzhong" />

      {/* CTA */}
      <div className="py-16 px-8 md:px-20 text-center" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="tel:+8613764597723" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 36px", background: "#C9A84C", color: "#0A0A0A", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", letterSpacing: "0.15em", textDecoration: "none", fontWeight: 700 }}>
            预约品牌诊断
          </a>
          <Link href="/#cases">
            <a style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 36px", border: "1px solid rgba(201,168,76,0.4)", color: "rgba(245,240,232,0.7)", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", letterSpacing: "0.15em", textDecoration: "none" }}>
              查看更多案例
            </a>
          </Link>
        </div>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(245,240,232,0.2)", letterSpacing: "0.1em", marginTop: 24 }}>
          © 2024 Mc&Mamoo Brand Management Inc. · 猫眼增长引擎 Mc&Mamoo Growth Engine和询 · 江中猴姑案例
        </p>
      </div>
    </div>
  );
}
