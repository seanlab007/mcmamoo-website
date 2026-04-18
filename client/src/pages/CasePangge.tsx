/*
 * CasePangge — 湖南胖哥食品品牌案例详情页
 * Design: dark/gold luxury aesthetic matching site theme
 * Story: 槟榔行业领袖品牌的战略升级与全国扩张
 */
import { useEffect, useRef, useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "wouter";
import { InlineContactTrigger } from "@/components/WechatFloat";
import RelatedCases from "@/components/RelatedCases";
import ShareBar from "@/components/ShareBar";

// ── CDN image URLs ─────────────────────────────────────────────────────────────
const IMGS = {
  cover:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/800511093070b2f8324e764a335e8869_94eff669.jpg",
  team1:    "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/bfd67b667c3704697914deaf091d7bf0_b76aec39.jpg",
  studio:   "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/e94ab72cbc0bc123af9a7f3df6f31a5b_d8e032e3.jpg",
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
        className="text-xs tracking-[0.25em] uppercase mb-2"
        style={{ color: "#C9A84C", fontFamily: "'DM Mono', monospace" }}
      >
        {en}
      </div>
      <h2
        className="text-3xl md:text-4xl font-bold text-white"
        style={{ fontFamily: "'Noto Serif SC', serif" }}
      >
        {zh}
      </h2>
      <div className="mt-4 w-12 h-0.5" style={{ background: "#C9A84C" }} />
    </div>
  );
}

// ── Battle card ────────────────────────────────────────────────────────────────
function BattleCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className="p-6"
      style={{
        background: "rgba(201,168,76,0.04)",
        border: "1px solid rgba(201,168,76,0.15)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      <div
        className="text-xs font-bold tracking-widest mb-3"
        style={{ color: "#C9A84C", fontFamily: "'DM Mono', monospace" }}
      >
        {num}
      </div>
      <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
        {desc}
      </p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CasePangge() {
  useSEO({
    title: "湖南胖哥食品 · 槟榔行业领袖品牌战略升级 | 猫眼咨询",
    description: "猫眼咨询助力湖南胖哥食品完成品牌战略升级，打响四大战役，成为槟榔行业洗牌期领先品牌。100万+终端网点，400+经销商，覆盖全国主要地级市。",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/800511093070b2f8324e764a335e8869_94eff669.jpg",
    url: "https://www.mcmamoo.com/cases/pangge",
    type: "article",
    keywords: "胖哥食品,槟榔品牌营销,快消品战略,品牌战略升级,渠道扩张,终端网点,经销商管理,猫眼咨询案例,湖南品牌",
    title: "湖南胖哥食品 · 槟榔行业领袖品牌战略升级 | 猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)",
    description: "猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)助力湖南胖哥食品完成品牌战略升级，打响四大战役，成为槟榔行业洗牌期领先品牌。100万+终端网点，400+经销商，覆盖全国主要地级市。",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/800511093070b2f8324e764a335e8869_94eff669.jpg",
    url: "https://www.mcmamoo.com/cases/pangge",
    type: "article",
    keywords: "胖哥食品,槟榔品牌营销,快消品战略,品牌战略升级,渠道扩张,终端网点,经销商管理,猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)案例,湖南品牌",
    breadcrumbs: [
      { name: "首页", url: "/" },
      { name: "标杆案例", url: "/#cases" },
      { name: "湖南胖哥食品", url: "/cases/pangge" },
    ],
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "湖南胖哥食品 · 槟榔行业领袖品牌战略升级案例",
        "description": "猫眼咨询助力湖南胖哥食品完成品牌战略升级，打响四大战役，成为槟榔行业洗牌期领先品牌，100万+终端网点覆盖全国。",
        "image": "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/800511093070b2f8324e764a335e8869_94eff669.jpg",
        "url": "https://www.mcmamoo.com/cases/pangge",
        "publisher": { "@id": "https://www.mcmamoo.com/#organization" },
        "author": { "@id": "https://www.mcmamoo.com/#organization" },
        "datePublished": "2024-01-01",
        "dateModified": "2024-01-01",
        "keywords": "胖哥食品,槟榔品牌,快消品战略,渠道扩张",
        "articleSection": "品牌案例"
      }
    ],
  });

  return (
    <div style={{ background: "#0A0A0A", minHeight: "100vh", color: "#fff" }}>
      {/* ── Nav bar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-12 py-4"
        style={{ background: "rgba(10,10,10,0.95)", borderBottom: "1px solid rgba(201,168,76,0.15)" }}
      >
        <Link href="/">
          <span
            className="text-sm tracking-widest uppercase cursor-pointer hover:text-[#C9A84C] transition-colors"
            style={{ color: "rgba(255,255,255,0.5)", fontFamily: "'DM Mono', monospace" }}
          >
            ← 返回首页
          </span>
        </Link>
        <span
          className="text-xs tracking-widest uppercase hidden md:block"
          style={{ color: "rgba(201,168,76,0.6)", fontFamily: "'DM Mono', monospace" }}
        >
          Case Study · 湖南胖哥食品
        </span>
      </nav>

      {/* ── Hero ── */}
      <div className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <img
          src={IMGS.cover}
          alt="胖哥食品品牌案例"
          className="w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.7) 60%, rgba(10,10,10,0.97) 100%)" }}
        />
        {/* Gold top accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "#C9A84C" }} />

        <div className="absolute bottom-0 left-0 right-0 px-6 md:px-16 pb-14 pt-20">
          <div
            className="text-xs tracking-[0.3em] uppercase mb-4"
            style={{ color: "#C9A84C", fontFamily: "'DM Mono', monospace" }}
          >
            Case Study · 食品饮料快消 · 品牌全案策划
          </div>
          <h1
            className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            湖南胖哥食品
          </h1>
          <p className="text-lg md:text-xl max-w-2xl" style={{ color: "rgba(255,255,255,0.65)" }}>
            打响四大战役，助力槟榔行业领袖品牌完成战略升级与全国市场扩张
          </p>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-20">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
          <StatCard value="30+" label="年发展基础" sub="老牌槟榔企业" />
          <StatCard value="100万+" label="终端网点" sub="覆盖全国" />
          <StatCard value="400+" label="合作经销商" sub="全国主要地级市" />
          <StatCard value="全品类" label="行业唯一" sub="覆盖全品类槟榔" />
        </div>

        {/* Brand background */}
        <div className="mb-20">
          <SectionHeader en="Brand Background" zh="品牌背景" />
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>
                <strong className="text-white">湖南胖哥食品有限责任公司</strong>位于湖南湘潭，是集研发、生产、检测、销售于一体的现代化槟榔食品企业，也是<span style={{ color: "#C9A84C" }}>行业唯一覆盖全品类槟榔产品的领袖企业</span>。
              </p>
              <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.7)" }}>
                经过30余年的发展积累，胖哥已拥有100多万终端网点，400多位经销商，覆盖全国主要地级市，在行业内建立了深厚的渠道壁垒和品牌基础。
              </p>
              <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                然而，面对行业新竞争格局、槟榔新政监管压力以及消费者认知升级，胖哥亟需一次系统性的<span style={{ color: "#C9A84C" }}>品牌战略升级</span>，以巩固领袖地位并开拓增量市场。
              </p>
            </div>
            <div className="relative overflow-hidden" style={{ border: "1px solid rgba(201,168,76,0.2)" }}>
              <img src={IMGS.team1} alt="胖哥食品团队" className="w-full h-64 object-cover object-center" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,10,10,0.6) 0%, transparent 60%)" }} />
              <div
                className="absolute bottom-3 left-3 text-xs px-3 py-1"
                style={{ background: "#C9A84C", color: "#0A0A0A", fontWeight: 700 }}
              >
                猫眼咨询 × 胖哥食品
              </div>
            </div>
          </div>
        </div>

        {/* Challenge */}
        <div className="mb-20">
          <SectionHeader en="Strategic Challenge" zh="战略挑战" />
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: "⚔", title: "新竞争压力", desc: "槟榔行业竞争格局重塑，新兴品牌崛起，老牌企业面临市场份额被蚕食的威胁，品牌差异化亟待重建。" },
              { icon: "⚖", title: "政策合规挑战", desc: "槟榔新政出台，行业进入强监管时代，如何在合规框架内保持品牌活力与市场竞争力成为核心命题。" },
              { icon: "📈", title: "增长引擎重构", desc: "传统渠道增长趋缓，需要在终端决胜和新渠道开拓两个维度同步发力，构建可持续的增长飞轮。" },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="text-2xl mb-3">{item.icon}</div>
                <h3 className="text-base font-bold text-white mb-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Core strategy */}
        <div className="mb-20">
          <SectionHeader en="Core Strategy" zh="核心战略定位" />
          <div
            className="p-8 md:p-12 text-center mb-10"
            style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.03) 100%)", border: "1px solid rgba(201,168,76,0.25)" }}
          >
            <div
              className="text-xs tracking-[0.3em] uppercase mb-4"
              style={{ color: "rgba(201,168,76,0.6)", fontFamily: "'DM Mono', monospace" }}
            >
              Strategic Positioning
            </div>
            <div
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: "#C9A84C", fontFamily: "'Noto Serif SC', serif" }}
            >
              "离男人更近"
            </div>
            <p className="text-lg text-white mb-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              男人的奋斗伴侣
            </p>
            <p className="text-sm max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
              锁定男性消费群体的情感共鸣，以"奋斗精神"为品牌核心价值，构建与竞品的差异化护城河，
              将胖哥槟榔从功能性消费品升维为情感型品牌符号。
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { title: "品牌价值重塑", desc: "从产品功能层面升维到情感价值层面，建立「奋斗男人」的品牌人格，强化品牌溢价空间。" },
              { title: "产品矩阵升级", desc: "围绕核心定位重构产品线，打造高端旗舰品、主力走量品、渠道专供品三层产品矩阵。" },
              { title: "情感营销突破", desc: "以男性奋斗情感为主线，打造系列内容营销战役，在社交媒体和终端场景双向渗透。" },
            ].map((item) => (
              <div
                key={item.title}
                className="p-6"
                style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.15)" }}
              >
                <div className="w-8 h-0.5 mb-4" style={{ background: "#C9A84C" }} />
                <h3 className="text-base font-bold text-white mb-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Four battles */}
        <div className="mb-20">
          <SectionHeader en="Four Strategic Battles" zh="打响四大战役" />
          <div className="grid md:grid-cols-2 gap-4">
            <BattleCard
              num="BATTLE 01"
              title="新竞争下的品牌升级战"
              desc="系统性重构品牌视觉识别体系（VI）、品牌故事与传播语言，建立差异化的品牌势能，在竞争激烈的市场中重新确立领袖地位。"
            />
            <BattleCard
              num="BATTLE 02"
              title="槟榔新政下的市场攻坚战"
              desc="在监管新政框架内，重新规划产品配方、包装设计与传播策略，将政策压力转化为品牌升级的契机，实现合规与增长的双赢。"
            />
            <BattleCard
              num="BATTLE 03"
              title="决胜终端下的新增长引擎"
              desc="深度优化100万+终端网点的陈列标准、促销体系与导购培训，构建终端决胜体系，将渠道优势转化为实际销售转化率的提升。"
            />
            <BattleCard
              num="BATTLE 04"
              title="各区域市场的全面进攻战"
              desc="针对不同区域市场的消费特征和竞争格局，制定差异化的区域进攻策略，实现全国主要地级市的深度覆盖与市场份额扩张。"
            />
          </div>
        </div>

        {/* Studio photo */}
        <div className="mb-20 relative overflow-hidden" style={{ border: "1px solid rgba(201,168,76,0.2)" }}>
          <img src={IMGS.studio} alt="猫眼咨询合作现场" className="w-full h-72 md:h-96 object-cover object-center" />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to right, rgba(10,10,10,0.8) 0%, rgba(10,10,10,0.2) 60%, transparent 100%)" }}
          />
          <div className="absolute inset-0 flex items-center px-8 md:px-16">
            <div className="max-w-sm">
              <div
                className="text-xs tracking-widest uppercase mb-3"
                style={{ color: "#C9A84C", fontFamily: "'DM Mono', monospace" }}
              >
                Strategic Partnership
              </div>
              <p className="text-xl font-bold text-white leading-relaxed" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                深度战略合伙，<br />不只是提供报告
              </p>
              <p className="text-sm mt-3" style={{ color: "rgba(255,255,255,0.6)" }}>
                猫眼咨询团队深度驻场，全程陪跑品牌升级落地
              </p>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-20">
          <SectionHeader en="Results & Impact" zh="项目成果" />
          <div className="space-y-4">
            {[
              { label: "品牌认知度", result: "大幅提升", detail: "通过系统性品牌升级，胖哥在核心消费群体中的品牌认知度和美誉度显著提升，品牌溢价空间扩大。" },
              { label: "渠道覆盖", result: "全国主要地级市", detail: "依托100万+终端网点的渠道优势，结合终端决胜体系优化，实现全国主要地级市的深度覆盖。" },
              { label: "行业地位", result: "洗牌期领先品牌", detail: "在行业政策调整和竞争格局重塑的关键时期，胖哥成功巩固并提升了行业领袖地位。" },
              { label: "经销商体系", result: "400+经销商稳定合作", detail: "通过品牌升级和渠道政策优化，经销商信心大幅提升，合作关系更加稳固，渠道动销明显改善。" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col md:flex-row md:items-center gap-4 p-6"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="md:w-32 flex-shrink-0">
                  <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "rgba(201,168,76,0.6)", fontFamily: "'DM Mono', monospace" }}>
                    {item.label}
                  </div>
                  <div className="text-base font-bold" style={{ color: "#C9A84C" }}>{item.result}</div>
                </div>
                <div className="w-px h-8 hidden md:block" style={{ background: "rgba(201,168,76,0.2)" }} />
                <p className="text-sm leading-relaxed flex-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quote */}
        <div
          className="mb-20 p-8 md:p-12 text-center"
          style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)" }}
        >
          <div className="text-4xl mb-6" style={{ color: "rgba(201,168,76,0.3)" }}>"</div>
          <p
            className="text-xl md:text-2xl font-bold text-white leading-relaxed mb-6"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            品牌升级不是换个logo，<br />而是重构与消费者的情感契约
          </p>
          <div className="w-12 h-0.5 mx-auto mb-4" style={{ background: "#C9A84C" }} />
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)", fontFamily: "'DM Mono', monospace" }}>
            — Sean DAI，猫眼咨询创始人
          </p>
        </div>

        {/* CTA */}
        <div className="text-center mb-20">
          <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
            您的品牌是否也面临类似的战略升级挑战？
          </p>
          <InlineContactTrigger />
        </div>

        <ShareBar title="湖南胖哥食品品牌战略升级案例 | 猫眼咨询" />
        <RelatedCases current="pangge" />
      </div>
    </div>
  );
}
