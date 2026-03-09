/*
 * 小仙炖案例详情页
 * Design: 深夜奢华 · 深蓝+金色 · 燕窝品类开创者
 */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/xiaoxiandun-hero-MSw4oXFtJRpVC9YWG9wg4G.webp";

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
  return <span ref={ref}>{prefix}{count}{suffix}</span>;
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

export default function CaseXiaoxiandun() {
  return (
    <div style={{ background: "#080C14", minHeight: "100vh", color: "#F5F0E8" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: "rgba(8,12,20,0.92)", borderBottom: "1px solid rgba(201,168,76,0.15)", backdropFilter: "blur(12px)" }}>
        <Link href="/"><a className="flex items-center gap-2 hover:opacity-70 transition-opacity" style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(245,240,232,0.5)", letterSpacing: "0.15em" }}>← 返回首页</a></Link>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(201,168,76,0.6)", letterSpacing: "0.15em" }}>CASE STUDY · 标杆案例</span>
        <Link href="/#cases"><a style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#C9A84C", letterSpacing: "0.1em", border: "1px solid rgba(201,168,76,0.4)", padding: "6px 14px", textDecoration: "none" }}>查看更多案例</a></Link>
      </nav>

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ height: "100vh", minHeight: 600 }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${HERO_IMG})`, backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.3) saturate(0.8)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.06) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(8,12,20,0.8) 40%, transparent 100%)" }} />
        <div className="relative h-full flex flex-col justify-center px-8 md:px-20" style={{ paddingTop: 80 }}>
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4">
              <div style={{ width: 28, height: 1, background: "#C9A84C" }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "#C9A84C", letterSpacing: "0.2em" }}>CASE STUDY · 标杆案例</span>
            </div>
            <h1 style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "clamp(2.5rem, 7vw, 5.5rem)", fontWeight: 900, lineHeight: 1, marginBottom: 12, color: "#F5F0E8" }}>小仙炖</h1>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(0.9rem, 2vw, 1.2rem)", color: "rgba(201,168,76,0.8)", fontStyle: "italic", marginBottom: 24 }}>
              Xiaoxiandun — Fresh Bird's Nest Pioneer
            </div>
            <p style={{ fontSize: "1rem", lineHeight: 1.9, color: "rgba(245,240,232,0.7)", maxWidth: 520, marginBottom: 48 }}>
              开创鲜炖燕窝品类，5年实现20亿在线营收，天猫燕窝品类连续多年第一，
              成为中国新消费滋补赛道的标杆品牌。
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: 20, suffix: "亿", label: "5年在线营收" },
                { value: 1, suffix: "位", label: "天猫品类排名" },
                { value: 5, suffix: "年", label: "从0到行业第一" },
                { value: 300, suffix: "%+", label: "年均增速" },
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
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120, background: "linear-gradient(to bottom, transparent, #080C14)" }} />
      </div>

      {/* Brand Origin */}
      <div className="py-16 px-8 md:px-20" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHeader en="Brand Origin" zh="品牌起源" />
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <RevealBlock>
              <p style={{ color: "rgba(245,240,232,0.75)", lineHeight: 1.9, fontSize: "0.95rem", marginBottom: 20 }}>
                2014年，燕窝市场被传统干燕窝和即食燕窝主导，消费者对燕窝的认知停留在"贵而不实用"的固有印象。
                猫眼咨询洞察到一个关键空白：<strong style={{ color: "#C9A84C" }}>鲜炖燕窝</strong>——这一兼具营养活性与便捷性的全新品类，
                市场几乎为零。
              </p>
              <p style={{ color: "rgba(245,240,232,0.75)", lineHeight: 1.9, fontSize: "0.95rem", marginBottom: 20 }}>
                核心战略：<strong style={{ color: "#F5F0E8" }}>品类错位 + 场景错位 + 渠道错位</strong>。
                在竞争对手还在传统渠道打价格战时，小仙炖率先以微商起家，
                锁定高端女性健康消费场景，建立"小仙炖 = 鲜炖燕窝"的强品类认知。
              </p>
              <p style={{ color: "rgba(245,240,232,0.75)", lineHeight: 1.9, fontSize: "0.95rem" }}>
                明星策略上，引入演员<strong style={{ color: "#C9A84C" }}>陈数入股并担任品牌代言人</strong>，
                借助小红书种草营销构建精准用户口碑，锚定高端价格体系，
                成功将小仙炖从微商品牌升级为天猫旗舰店品类第一。
              </p>
            </RevealBlock>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "品类创新", value: "鲜炖燕窝", desc: "开创全新品类赛道" },
                { label: "渠道策略", value: "微商→天猫", desc: "精准渠道升级路径" },
                { label: "明星背书", value: "陈数入股", desc: "深度绑定品牌信任" },
                { label: "内容营销", value: "小红书", desc: "KOL种草矩阵" },
              ].map(({ label, value, desc }) => (
                <RevealBlock key={label}>
                  <div className="p-5" style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.15)" }}>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(201,168,76,0.5)", letterSpacing: "0.12em", marginBottom: 6 }}>{label}</div>
                    <div style={{ fontFamily: "'Noto Serif SC', serif", color: "#C9A84C", fontSize: "1rem", fontWeight: 700, marginBottom: 4 }}>{value}</div>
                    <div style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.45)" }}>{desc}</div>
                  </div>
                </RevealBlock>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Strategy */}
      <div className="py-16 px-8 md:px-20" style={{ background: "rgba(201,168,76,0.03)", borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHeader en="Strategic Execution" zh="猫眼咨询操盘策略" />
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "品类定义", desc: "将「鲜炖燕窝」从无到有打造为独立品类，通过产品创新（冷链配送、72小时新鲜）建立品类壁垒，让小仙炖成为品类代名词。" },
              { step: "02", title: "价格锚定", desc: "拒绝价格战，坚守高端定位。通过陈数入股背书、明星KOL种草，将价格体系锚定在竞品2-3倍区间，建立高溢价品牌认知。" },
              { step: "03", title: "全域爆发", desc: "从微商私域起步，逐步扩展至天猫旗舰店、京东、抖音直播。每个渠道采用差异化内容策略，形成全域协同增长飞轮。" },
            ].map(({ step, title, desc }) => (
              <RevealBlock key={step}>
                <div className="p-7" style={{ border: "1px solid rgba(201,168,76,0.15)", height: "100%" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "3rem", fontWeight: 900, color: "rgba(201,168,76,0.15)", lineHeight: 1, marginBottom: 12 }}>{step}</div>
                  <div style={{ fontFamily: "'Noto Serif SC', serif", color: "#F5F0E8", fontSize: "1.05rem", fontWeight: 700, marginBottom: 12 }}>{title}</div>
                  <p style={{ color: "rgba(245,240,232,0.65)", fontSize: "0.88rem", lineHeight: 1.8 }}>{desc}</p>
                </div>
              </RevealBlock>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="py-16 px-8 md:px-20" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHeader en="Results" zh="核心成果" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-12">
            {[
              { num: "20亿", label: "5年在线营收" },
              { num: "#1", label: "天猫燕窝品类" },
              { num: "300%+", label: "年均增速" },
              { num: "500万+", label: "忠实用户" },
            ].map(({ num, label }) => (
              <RevealBlock key={label}>
                <div className="p-6 text-center" style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.15)" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 900, color: "#C9A84C", marginBottom: 8 }}>{num}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(245,240,232,0.45)", letterSpacing: "0.1em" }}>{label}</div>
                </div>
              </RevealBlock>
            ))}
          </div>
          <RevealBlock>
            <div className="p-8" style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)" }}>
              <p style={{ color: "rgba(245,240,232,0.75)", lineHeight: 1.9, fontSize: "0.95rem" }}>
                小仙炖案例证明：在传统滋补品赛道，通过<strong style={{ color: "#C9A84C" }}>品类创新 + 场景重构 + 明星深度绑定</strong>，
                完全可以从零开始打造出具有强大护城河的新消费品牌。
                猫眼咨询的错位竞争战略，帮助小仙炖在5年内从微商品牌跃升为天猫品类第一，
                成为中国新消费滋补赛道不可复制的标杆案例。
              </p>
            </div>
          </RevealBlock>
        </div>
      </div>

      {/* Footer CTA */}
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
          © 2024 Mc&Mamoo Brand Management Inc. · 猫眼咨询 · 小仙炖案例
        </p>
      </div>
    </div>
  );
}
