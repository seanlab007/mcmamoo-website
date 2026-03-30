/*
 * 小罐茶案例详情页
 * Design: 极致奢黑+哑金 · 高端礼品茶品类重塑
 */
import { useEffect, useRef, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "wouter";
import RelatedCases from "@/components/RelatedCases";
import ShareBar from "@/components/ShareBar";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/xiaoguan-hero-VMo5tD5EjgTVTXUiupePuQ.webp";

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

export default function CaseXiaoguan() {
  useSEO({
    title: "小罐茶 · 重塑中国高端礼品茶 · 大师作品牌壁垒 | 猫眼增长引擎 Mc&Mamoo Growth Engine",
    description: "猫眼增长引擎 Mc&Mamoo Growth Engine助力小罐茶重定义中国高端茶礼，聚焦送礼场景，辐射原点人群，聚合八大产地大师作，2亿营收，天猫茶叶礼品市场第一。",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/xiaoguan-hero-VMo5tD5EjgTVTXUiupePuQ.webp",
    url: "https://www.mcmamoo.com/cases/xiaoguan",
    type: "article",
    keywords: "小罐茶,高端礼品茶,茶叶品牌营销,送礼场景,大师作茶,品类创新,茶礼品牌,天猫茶叶第一,猫眼增长引擎 Mc&Mamoo Growth Engine案例",
    breadcrumbs: [
      { name: "首页", url: "/" },
      { name: "标杆案例", url: "/#cases" },
      { name: "小罐茶", url: "/cases/xiaoguan" },
    ],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "小罐茶 · 重新定义中国高端茶礼 · 天猫茶叶礼品市场第一",
        "description": "猫眼增长引擎 Mc&Mamoo Growth Engine助力小罐茶，聚焦送礼场景，辐射原点人群，用小罐品相进行品类创新，聚合八大产地大师作，建立竞争壁垒。",
        "image": "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/xiaoguan-hero-VMo5tD5EjgTVTXUiupePuQ.webp",
        "url": "https://www.mcmamoo.com/cases/xiaoguan",
        "publisher": { "@id": "https://www.mcmamoo.com/#organization" },
        "author": { "@id": "https://www.mcmamoo.com/#organization" },
        "datePublished": "2015-01-01",
        "dateModified": "2024-01-01",
        "keywords": "小罐茶,高端茶礼,品类创新,送礼场景",
        "articleSection": "品牌案例"
      }
    ],
  });
  return (
    <div style={{ background: "#080808", minHeight: "100vh", color: "#F5F0E8" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: "rgba(8,8,8,0.92)", borderBottom: "1px solid rgba(201,168,76,0.15)", backdropFilter: "blur(12px)" }}>
        <Link href="/"><a className="flex items-center gap-2 hover:opacity-70 transition-opacity" style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(245,240,232,0.5)", letterSpacing: "0.15em" }}>← 返回首页</a></Link>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(201,168,76,0.6)", letterSpacing: "0.15em" }}>CASE STUDY · 标杆案例</span>
        <Link href="/#cases"><a style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#C9A84C", letterSpacing: "0.1em", border: "1px solid rgba(201,168,76,0.4)", padding: "6px 14px", textDecoration: "none" }}>查看更多案例</a></Link>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ height: "100vh", minHeight: 600 }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${HERO_IMG})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.25) saturate(0.6)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 60% 50%, rgba(201,168,76,0.08) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(8,8,8,0.9) 50%, transparent 100%)" }} />
        <div className="relative h-full flex flex-col justify-center px-8 md:px-20" style={{ paddingTop: 80 }}>
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 28, height: 1, background: "#C9A84C" }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#C9A84C", letterSpacing: "0.2em" }}>CASE STUDY · 标杆案例</span>
            </div>
            <h1 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "clamp(2.5rem, 7vw, 5.5rem)", fontWeight: 900, lineHeight: 1, marginBottom: 12, color: "#F5F0E8" }}>小罐茶</h1>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(0.9rem, 2vw, 1.2rem)", color: "rgba(201,168,76,0.8)", fontStyle: "italic", marginBottom: 24 }}>
              Xiaoguan Tea — Redefining Chinese Premium Tea Gift
            </div>
            <p style={{ fontSize: "1rem", lineHeight: 1.9, color: "rgba(245,240,232,0.7)", maxWidth: 520, marginBottom: 48 }}>
              聚焦送礼场景，重新定义中国高端茶礼。以小罐品相进行品类创新，
              聚合八大产地大师作，实现2亿营收，成为中国高端茶礼第一品牌。
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: 2, suffix: "亿", label: "年营收" },
                { value: 8, suffix: "大", label: "产地茶叶聚合" },
                { value: 1, suffix: "位", label: "高端茶礼品类" },
                { value: 500, suffix: "%+", label: "溢价倍数" },
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
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, background: "linear-gradient(to bottom, transparent, #080808)" }} />
      </div>

      {/* Core Strategy */}
      <div className="py-16 px-8 md:px-20" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHeader en="Core Strategy" zh="核心战略" />
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <RevealBlock>
              <p style={{ color: "rgba(245,240,232,0.75)", lineHeight: 1.9, fontSize: "0.95rem", marginBottom: 20 }}>
                中国茶叶市场长期存在一个悖论：茶叶是中国最古老的奢侈品，
                却没有一个真正意义上的高端茶叶品牌。猫眼增长引擎 Mc&Mamoo Growth Engine洞察到这一矛盾，
                提出了<strong style={{ color: "#C9A84C" }}>「场景重构 + 品相创新」</strong>的核心战略。
              </p>
              <p style={{ color: "rgba(245,240,232,0.75)", lineHeight: 1.9, fontSize: "0.95rem", marginBottom: 20 }}>
                战略核心：<strong style={{ color: "#F5F0E8" }}>聚焦送礼场景，辐射原点人群</strong>。
                中国商务送礼市场每年超过万亿，但茶叶礼品长期停留在散装、无品牌的低端形态。
                小罐茶以统一规格的小罐包装，将八大产地顶级茶叶标准化、礼品化，
                彻底改变了消费者对茶叶礼品的认知。
              </p>
              <p style={{ color: "rgba(245,240,232,0.75)", lineHeight: 1.9, fontSize: "0.95rem" }}>
                <strong style={{ color: "#C9A84C" }}>大师作</strong>战略是另一关键壁垒：
                邀请八大茶类非遗传承人担任「制茶大师」，
                将工匠精神与现代品牌营销结合，
                构建了竞争对手难以复制的品质信任体系。
              </p>
            </RevealBlock>
            <div className="space-y-4">
              {[
                { num: "1", title: "场景聚焦", desc: "锁定高端商务送礼场景，不做大众茶，只做礼品茶" },
                { num: "2", title: "品相革命", desc: "统一小罐包装，将散装茶标准化，解决送礼「不上档次」的痛点" },
                { num: "3", title: "大师背书", desc: "八大茶类非遗传承人联名，建立无法被复制的工艺信任壁垒" },
                { num: "4", title: "价格锚定", desc: "定价远高于普通茶叶，以高溢价建立「高端茶礼第一品牌」认知" },
              ].map(({ num, title, desc }) => (
                <RevealBlock key={num}>
                  <div className="flex gap-5 p-5" style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.12)" }}>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 900, color: "rgba(201,168,76,0.25)", lineHeight: 1, flexShrink: 0 }}>{num}</div>
                    <div>
                      <div style={{ fontFamily: "'Noto Serif SC', serif", color: "#F5F0E8", fontWeight: 700, marginBottom: 4 }}>{title}</div>
                      <p style={{ color: "rgba(245,240,232,0.55)", fontSize: "0.85rem", lineHeight: 1.7 }}>{desc}</p>
                    </div>
                  </div>
                </RevealBlock>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Eight Masters */}
      <div className="py-16 px-8 md:px-20" style={{ background: "rgba(201,168,76,0.02)", borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHeader en="Eight Masters" zh="八大产地 · 大师作" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { tea: "西湖龙井", master: "龙井茶非遗传承人", region: "浙江杭州" },
              { tea: "黄山毛峰", master: "毛峰茶制作大师", region: "安徽黄山" },
              { tea: "大红袍", master: "武夷岩茶非遗传承人", region: "福建武夷山" },
              { tea: "铁观音", master: "铁观音制作大师", region: "福建安溪" },
              { tea: "普洱茶", master: "普洱茶制作大师", region: "云南西双版纳" },
              { tea: "滇红茶", master: "滇红茶制作大师", region: "云南凤庆" },
              { tea: "白毫银针", master: "白茶非遗传承人", region: "福建福鼎" },
              { tea: "太平猴魁", master: "猴魁茶制作大师", region: "安徽太平" },
            ].map(({ tea, master, region }) => (
              <RevealBlock key={tea}>
                <div className="p-5 text-center" style={{ border: "1px solid rgba(201,168,76,0.15)", background: "rgba(201,168,76,0.03)" }}>
                  <div style={{ fontFamily: "'Noto Serif SC', serif", color: "#C9A84C", fontSize: "1rem", fontWeight: 700, marginBottom: 4 }}>{tea}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(245,240,232,0.35)", letterSpacing: "0.08em", marginBottom: 4 }}>{region}</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(245,240,232,0.5)" }}>{master}</div>
                </div>
              </RevealBlock>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="py-16 px-8 md:px-20" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHeader en="Results & Impact" zh="成果与影响" />
          <div className="grid md:grid-cols-2 gap-8">
            <RevealBlock>
              <div className="p-8" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", fontWeight: 900, color: "#C9A84C", marginBottom: 8 }}>2亿+</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", color: "#F5F0E8", fontWeight: 700, marginBottom: 12 }}>年营收规模</div>
                <p style={{ color: "rgba(245,240,232,0.65)", fontSize: "0.88rem", lineHeight: 1.8 }}>
                  在传统茶叶市场「散、乱、弱」的格局中，小罐茶以品牌化、标准化、礼品化三大策略，
                  成功建立高端茶礼品类第一品牌地位，年营收突破2亿元。
                </p>
              </div>
            </RevealBlock>
            <RevealBlock delay={100}>
              <div className="p-8" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", fontWeight: 900, color: "#C9A84C", marginBottom: 8 }}>#1</div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", color: "#F5F0E8", fontWeight: 700, marginBottom: 12 }}>重新定义中国高端茶礼</div>
                <p style={{ color: "rgba(245,240,232,0.65)", fontSize: "0.88rem", lineHeight: 1.8 }}>
                  小罐茶案例证明：中国传统品类同样可以通过现代品牌战略实现高端化重塑。
                  「小罐茶=高端茶礼」的品类认知，已成为中国茶叶行业品牌化转型的标杆参照。
                </p>
              </div>
            </RevealBlock>
          </div>
        </div>
      </div>

      {/* Share bar */}
      <div className="px-8 md:px-20 py-6" style={{ borderTop: "1px solid rgba(201,168,76,0.08)" }}>
        <ShareBar title="小罐茶" description="高端礼品茶品类重塑，天猫茶叶礼品市场第一" />
      </div>

      {/* Related Cases */}
      <RelatedCases current="xiaoguan" />

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
          © 2024 Mc&Mamoo Inc. · 猫眼增长引擎 Mc&Mamoo Growth Engine和询 · 小罐茶案例
        </p>
      </div>
    </div>
  );
}
