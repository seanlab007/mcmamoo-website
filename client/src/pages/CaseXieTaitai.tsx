/*
 * CaseXieTaitai — 蟹太太品牌案例详情页
 * Design: dark/gold luxury aesthetic matching site theme
 * Story: 从0到8亿营收，大闸蟹行业品牌化第一案例
 */
import { useEffect, useRef, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "wouter";
import { InlineContactTrigger } from "@/components/WechatFloat";
import RelatedCases from "@/components/RelatedCases";
import ShareBar from "@/components/ShareBar";

// ── CDN image URLs ─────────────────────────────────────────────────────────────
const IMGS = {
  cover:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/page-01_aff6a846.png",
  product:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/page-02_c9bd47c0.png",
  huangxm:  "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/page-11_890a5dc4.png",
  stars:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/page-24_5133cd46.png",
  battle:   "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/page-26_aeb16d3f.png",
  live2023: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/page-30_31d4c116.png",
  live2:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/page-42_903c460b.png",
};

// ── Scroll-reveal hook ─────────────────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ value, label, sub }: { value: string; label: string; sub?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className="flex flex-col items-center text-center px-6 py-8"
      style={{
        background: "rgba(201,168,76,0.06)",
        border: "1px solid rgba(201,168,76,0.2)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      <div
        className="text-4xl font-bold mb-1"
        style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif" }}
      >
        {value}
      </div>
      <div className="text-sm font-medium text-white mb-1">{label}</div>
      {sub && <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</div>}
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────
function SectionHeader({ en, zh }: { en: string; zh: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className="mb-10"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      <div
        className="text-xs tracking-widest uppercase mb-2"
        style={{ color: "rgba(201,168,76,0.6)", fontFamily: "'DM Mono', monospace" }}
      >
        {en}
      </div>
      <h2
        className="text-3xl font-bold text-white"
        style={{ fontFamily: "'Noto Serif SC', serif" }}
      >
        {zh}
      </h2>
      <div className="mt-3 h-px w-16" style={{ background: "rgba(201,168,76,0.5)" }} />
    </div>
  );
}

// ── Full-width image block ─────────────────────────────────────────────────────
function RevealImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.97)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      <img src={src} alt={alt} className="w-full object-cover" style={{ display: "block" }} />
      {caption && (
        <div
          className="text-center text-xs py-3"
          style={{ color: "rgba(255,255,255,0.35)", background: "rgba(0,0,0,0.4)", fontFamily: "'DM Mono', monospace" }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}

// ── KOL card (standalone component to avoid hook-in-callback) ────────────────
function KolCard({ kol, gmv, unit }: { kol: string; gmv: string; unit: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className="p-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(201,168,76,0.2)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      <div className="text-sm font-medium mb-2" style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'DM Mono', monospace" }}>
        {kol}
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif" }}>
        {gmv}
      </div>
      <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{unit}</div>
    </div>
  );
}

// ── Timeline item ──────────────────────────────────────────────────────────────
function TimelineItem({ year, title, desc, isLast }: { year: string; title: string; desc: string; isLast?: boolean }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className="flex gap-6"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-20px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      <div className="flex flex-col items-center">
        <div
          className="w-10 h-10 flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{
            background: "rgba(201,168,76,0.15)",
            border: "1px solid rgba(201,168,76,0.5)",
            color: "#C9A84C",
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {year}
        </div>
        {!isLast && <div className="w-px flex-1 mt-2" style={{ background: "rgba(201,168,76,0.2)", minHeight: 40 }} />}
      </div>
      <div className="pb-8">
        <div className="font-semibold text-white mb-1" style={{ fontFamily: "'Noto Serif SC', serif" }}>{title}</div>
        <div className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{desc}</div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CaseXieTaitai() {
  useSEO({
<<<<<<< HEAD
    title: "蟹太太大闸蟹 · 从0到8亿营收 · 明星直播第一 | 猫眼咨询标杆案例",
    description: "猫眼咨询操盘蟹太太大闸蟹品牌，从0孵化到年营收8亿，签约黄晓明代言，500+明星网红合作矩阵，贾乃亮单场5700万，小杨哥单场2000万，全网蟹券销量连续多年第一。",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/hero-video-frame1-9AHtkPtKZTrG9N5GhnTvLQ.png",
    url: "https://www.mcmamoo.com/cases/xietaitai",
    type: "article",
    keywords: "蟹太太大闸蟹,大闸蟹品牌,生鲜品牌营销,明星直播带货,黄晓明代言,猫眼咨询案例,品牌从0到1,大闸蟹电商,错位竞争案例",
=======
    title: "蟹太太大闸蟹 · 从0到8亿营收 · 明星直播第一 | 猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)标杆案例",
    description: "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)操盘蟹太太大闸蟹品牌，从0孵化到年营收8亿，签约黄晓明代言，500+明星网红合作矩阵，贾乃亮单场5700万，小杨哥单场2000万，全网蟹券销量连续多年第一。",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/hero-video-frame1-9AHtkPtKZTrG9N5GhnTvLQ.png",
    url: "https://www.mcmamoo.com/cases/xietaitai",
    type: "article",
    keywords: "蟹太太大闸蟹,大闸蟹品牌,生鲜品牌营销,明星直播带货,黄晓明代言,猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)案例,品牌从0到1,大闸蟹电商,错位竞争案例",
>>>>>>> origin/fix/final-navbar-restructure-1774631973
    breadcrumbs: [
      { name: "首页", url: "/" },
      { name: "标杆案例", url: "/#cases" },
      { name: "蟹太太大闸蟹", url: "/cases/xietaitai" },
    ],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "蟹太太大闸蟹 · 从0孵化到年营收8亿 · 大闸蟹行业品牌化第一案例",
<<<<<<< HEAD
        "description": "猫眼咨询操盘蟹太太大闸蟹，填补行业品牌化空白，签约黄晓明担任品牌代言，构建500+明星网红合作矩阵，全网蟹券销量连续多年第一。",
=======
        "description": "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)操盘蟹太太大闸蟹，填补行业品牌化空白，签约黄晓明担任品牌代言，构建500+明星网红合作矩阵，全网蟹券销量连续多年第一。",
>>>>>>> origin/fix/final-navbar-restructure-1774631973
        "image": "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/hero-video-frame1-9AHtkPtKZTrG9N5GhnTvLQ.png",
        "url": "https://www.mcmamoo.com/cases/xietaitai",
        "publisher": { "@id": "https://www.mcmamoo.com/#organization" },
        "author": { "@id": "https://www.mcmamoo.com/#organization" },
        "datePublished": "2016-01-01",
        "dateModified": "2024-01-01",
        "keywords": "蟹太太,大闸蟹品牌营销,明星代言,直播带货,错位竞争",
        "articleSection": "品牌案例",
        "about": {
          "@type": "Thing",
          "name": "蟹太太大闸蟹品牌战略",
          "description": "通过错位竞争战略和明星营销矩阵，从0孵化到8亿营收的大闸蟹品牌化案例"
        }
      }
    ],
  });
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ background: "#080E18", minHeight: "100vh", color: "white" }}>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ minHeight: "70vh" }}>
        <img
          src={IMGS.cover}
          alt="蟹太太品牌"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.35 }}
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(8,14,24,0.2) 0%, rgba(8,14,24,0.85) 100%)" }}
        />
        <div className="relative z-10 flex flex-col justify-end h-full px-8 md:px-20 pb-16 pt-32">
          {/* Back link */}
          <Link href="/">
            <a
              className="inline-flex items-center gap-2 text-xs mb-8 hover:opacity-70 transition-opacity"
              style={{ color: "rgba(201,168,76,0.7)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              返回首页
            </a>
          </Link>

          <div
            className="text-xs tracking-widest uppercase mb-4"
            style={{ color: "rgba(201,168,76,0.7)", fontFamily: "'DM Mono', monospace" }}
          >
            Case Study · 标杆案例
          </div>
          <h1
            className="text-5xl md:text-7xl font-bold mb-4 leading-tight"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            蟹太太
          </h1>
          <p
            className="text-xl md:text-2xl mb-2"
            style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
          >
            Xie Taitai — Premium Hairy Crab Brand
          </p>
          <p className="text-base max-w-2xl" style={{ color: "rgba(255,255,255,0.6)" }}>
            从0到8亿营收，打造大闸蟹行业首个且唯一一线明星代言品牌，
            连续多年全网蟹券销量第一，成为中国餐饮黑马品牌。
          </p>
        </div>
      </div>

      {/* ── Key metrics ── */}
      <div className="px-8 md:px-20 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard value="8亿+" label="年营收规模" sub="从0起步" />
          <StatCard value="连续多年" label="全网蟹券销量第一" sub="生鲜行业TOP品牌" />
          <StatCard value="500+" label="明星网红合作" sub="覆盖全平台" />
          <StatCard value="3000万" label="单场直播销售额" sub="香菇来了专场" />
        </div>
      </div>

      {/* ── Brand story ── */}
      <div className="px-8 md:px-20 py-12" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHeader en="Brand Origin" zh="品牌起源" />
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>
                2016年，苏州西风阁电子商务有限公司成立，以大闸蟹为主营产品切入生鲜赛道。
                彼时大闸蟹市场品牌化程度极低，消费者对品牌认知几乎为零。
              </p>
              <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>
<<<<<<< HEAD
                猫眼咨询介入后，提出"错位竞争"核心战略：在竞争对手还在打价格战时，
=======
                猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)介入后，提出"错位竞争"核心战略：在竞争对手还在打价格战时，
>>>>>>> origin/fix/final-navbar-restructure-1774631973
                率先以一线明星代言人构建品牌壁垒，填补行业品牌化空白。
              </p>
              <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                2018年，成功签约国内当红明星<strong style={{ color: "#C9A84C" }}>黄晓明</strong>，
                创立"蟹太太"品牌，成为行业首个且唯一一线明星代言的大闸蟹品牌，
                开启了从区域品牌到全国知名品牌的跨越式发展。
              </p>
            </div>
            <div>
              <RevealImage src={IMGS.product} alt="蟹太太产品卖点" caption="黄晓明代言 · 精品好蟹 · 高端礼盒包装" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Celebrity endorsement ── */}
      <div className="py-12" style={{ background: "rgba(201,168,76,0.03)", borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="px-8 md:px-20 max-w-6xl mx-auto">
          <SectionHeader en="Celebrity Endorsement" zh="黄晓明开捕节" />
          <p className="text-base leading-relaxed mb-8 max-w-3xl" style={{ color: "rgba(255,255,255,0.65)" }}>
            每年蟹季，黄晓明亲临蟹太太养殖基地参与"开捕节"，与岳云鹏等明星共同出席，
            制造全国性话题热点。开捕节活动登上各大媒体头条，为品牌带来数亿次曝光，
            将产品品质与明星公信力深度绑定。
          </p>
          <RevealImage src={IMGS.huangxm} alt="黄晓明开捕节" caption="黄晓明 · 岳云鹏 · 蟹太太开捕节现场" />
        </div>
      </div>

      {/* ── Star endorsement wall ── */}
      <div className="py-12 px-8 md:px-20" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHeader en="Star Power" zh="明星网红都爱吃的大闸蟹" />
          <p className="text-base leading-relaxed mb-8 max-w-3xl" style={{ color: "rgba(255,255,255,0.65)" }}>
<<<<<<< HEAD
            通过猫眼咨询构建的全渠道明星矩阵，蟹太太汇聚了黄晓明、刘嘉玲、王宝强、
=======
            通过猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)构建的全渠道明星矩阵，蟹太太汇聚了黄晓明、刘嘉玲、王宝强、
>>>>>>> origin/fix/final-navbar-restructure-1774631973
            汤镇业、郑浩南、胡可、温碧霞、黄奕等数十位一线明星，以及爱尔兰总理、
            新西兰总理等国际政要的自发推荐，形成强大的品牌背书体系。
          </p>
          <RevealImage src={IMGS.stars} alt="明星网红都爱吃的大闸蟹" caption="明星之选 · 品质好蟹 · 星光熠熠 · 有口皆碑" />
        </div>
      </div>

      {/* ── KOL battle report ── */}
      <div className="py-12" style={{ background: "rgba(201,168,76,0.03)", borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="px-8 md:px-20 max-w-6xl mx-auto">
          <SectionHeader en="KOL Battle Report" zh="2023年达播战报" />

          {/* KOL data cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {[
              { kol: "香菇来了", gmv: "3000万", unit: "单场售出100万只大闸蟹" },
              { kol: "小杨哥", gmv: "2000万+", unit: "单场70000+份" },
              { kol: "贾乃亮", gmv: "5700万", unit: "卖出25万张蟹卡" },
              { kol: "朱梓骁", gmv: "1500万+", unit: "两日销售额" },
              { kol: "蜂蜜惊喜社", gmv: "1500万+", unit: "单场销售额" },
              { kol: "烈儿宝贝", gmv: "800万", unit: "累计售出30000+份" },
            ].map(({ kol, gmv, unit }) => (
              <KolCard key={kol} kol={kol} gmv={gmv} unit={unit} />
            ))}
          </div>

          <RevealImage src={IMGS.battle} alt="2023年达播战报" caption="2023年蟹季达播战报 · 香菇来了 · 烈儿宝贝 · 蜂蜜惊喜社 · 朱梓骁 · 贾乃亮 · 小杨哥" />
        </div>
      </div>

      {/* ── Live broadcast highlights ── */}
      <div className="py-12 px-8 md:px-20" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHeader en="Live Broadcast Highlights" zh="2023年直播精彩回放" />
          <p className="text-base leading-relaxed mb-8 max-w-3xl" style={{ color: "rgba(255,255,255,0.65)" }}>
            TVB识货、大左、胡可、吉杰、李好、烈儿宝贝、林依轮、刘仪伟、蜂蜜惊喜社等
            数十位头部主播和明星，在蟹季黄金时段密集直播，形成全平台立体轰炸式传播矩阵。
          </p>
          <RevealImage src={IMGS.live2023} alt="2023年直播精彩回放" caption="TVB识货 · 大左 · 胡可 · 吉杰 · 李好 · 烈儿宝贝 · 林依轮 · 刘仪伟 · 蜂蜜惊喜社" />

          <div className="mt-8">
            <RevealImage src={IMGS.live2} alt="更多直播回放" caption="郭小胖 · 韩小浪 · 吉克隽逸 · 交个朋友 · 李老板 · 烈儿 · 马北北 · 毛光光 · 琦儿 · 邱莹莹" />
          </div>
        </div>
      </div>

      {/* ── Strategy timeline ── */}
      <div className="py-12" style={{ background: "rgba(201,168,76,0.03)", borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="px-8 md:px-20 max-w-4xl mx-auto">
<<<<<<< HEAD
          <SectionHeader en="Strategic Journey" zh="猫眼咨询操盘历程" />
=======
          <SectionHeader en="Strategic Journey" zh="猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)操盘历程" />
>>>>>>> origin/fix/final-navbar-restructure-1774631973
          <div>
            <TimelineItem
              year="2016"
              title="品牌0到1 — 赛道切入"
<<<<<<< HEAD
              desc="猫眼咨询完成市场调研，发现大闸蟹行业品牌化空白，制定差异化竞争战略，协助苏州西风阁完成品牌定位与视觉体系搭建。"
=======
              desc="猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)完成市场调研，发现大闸蟹行业品牌化空白，制定差异化竞争战略，协助苏州西风阁完成品牌定位与视觉体系搭建。"
>>>>>>> origin/fix/final-navbar-restructure-1774631973
            />
            <TimelineItem
              year="2018"
              title="明星代言 — 品牌破圈"
              desc="成功签约黄晓明担任品牌代言人，创立「蟹太太」品牌，成为行业首个一线明星代言品牌，迅速建立消费者认知与信任。"
            />
            <TimelineItem
              year="2019"
              title="全渠道布局 — 流量爆发"
              desc="构建微博、微信、抖音、快手、淘宝直播全渠道传播矩阵，批量签约头部KOL，形成蟹季集中爆发的流量战略。"
            />
            <TimelineItem
              year="2021"
              title="直播电商 — 规模跃升"
              desc="深度布局直播电商，与贾乃亮、小杨哥、烈儿宝贝等头部主播建立长期合作，单场直播销售额突破千万级别。"
            />
            <TimelineItem
              year="2023"
              title="营收8亿 — 行业标杆"
              desc="年营收突破8亿，连续多年蝉联全网蟹券销量第一，成为中国大闸蟹行业品牌化运营的标杆案例。"
              isLast
            />
          </div>
        </div>
      </div>

      {/* ── Results summary ── */}
      <div className="py-16 px-8 md:px-20" style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <div className="max-w-4xl mx-auto text-center">
          <div
            className="text-xs tracking-widest uppercase mb-4"
            style={{ color: "rgba(201,168,76,0.6)", fontFamily: "'DM Mono', monospace" }}
          >
            Results · 核心成果
          </div>
          <h2
            className="text-3xl font-bold text-white mb-6"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            从大闸蟹到品牌资产
          </h2>
          <p className="text-base leading-relaxed mb-12 max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
            蟹太太案例证明：即使是最传统的农产品赛道，通过精准的品牌战略、
            明星背书体系和全域流量运营，同样可以实现从0到8亿的品牌跨越，
            打造出具有强大溢价能力和用户忠诚度的消费品牌。
          </p>

          <div
            className="p-8 mb-10 text-left"
            style={{
              background: "rgba(201,168,76,0.06)",
              border: "1px solid rgba(201,168,76,0.25)",
            }}
          >
            <div
              className="text-xs tracking-widest uppercase mb-4"
              style={{ color: "rgba(201,168,76,0.5)", fontFamily: "'DM Mono', monospace" }}
            >
<<<<<<< HEAD
              猫眼咨询核心贡献
=======
              猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)核心贡献
>>>>>>> origin/fix/final-navbar-restructure-1774631973
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                ["品牌定位", "填补行业品牌化空白，确立高端大闸蟹礼品赛道第一品牌地位"],
                ["明星策略", "签约黄晓明等一线明星，构建行业唯一明星代言壁垒"],
                ["KOL矩阵", "打造500+明星网红合作体系，覆盖抖音/快手/淘宝/微博全平台"],
                ["直播战略", "建立蟹季集中爆发的直播打法，单场销售额最高达3000万"],
              ].map(([title, desc]) => (
                <div key={title} className="flex gap-3">
                  <div className="w-1 flex-shrink-0 mt-1" style={{ background: "#C9A84C" }} />
                  <div>
                    <div className="text-sm font-semibold text-white mb-1">{title}</div>
                    <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <InlineContactTrigger label="预约品牌诊断" />
            <Link href="/">
              <a
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all hover:opacity-80"
                style={{
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                查看更多案例
              </a>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Share bar ── */}
      <div className="px-8 md:px-20 py-6" style={{ borderTop: "1px solid rgba(201,168,76,0.08)" }}>
        <ShareBar title="蟹太太大闸蟹" description="从0做到8亿营收的品牌操盘全案" />
      </div>

      {/* ── Related Cases ── */}
      <RelatedCases current="xietaitai" />

      {/* ── Footer ── */}
      <div
        className="py-8 px-8 md:px-20 text-center text-xs"
        style={{ borderTop: "1px solid rgba(201,168,76,0.1)", color: "rgba(255,255,255,0.2)" }}
      >
<<<<<<< HEAD
        © 2024 Mc&Mamoo Brand Management Inc. · 猫眼和询 · 蟹太太案例
=======
        © 2024 Mc&Mamoo Brand Management Inc. · 猫眼增长引擎 (Mc&Mamoo Growth Engine)和询 · 蟹太太案例
>>>>>>> origin/fix/final-navbar-restructure-1774631973
      </div>
    </div>
  );
}
