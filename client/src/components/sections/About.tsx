/*
 * About Section — About Mc&Mamoo Growth Engine
 * Design: dark background, left-right split, gold accent
 * i18n: full bilingual support via useTranslation
 */
import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "react-i18next";

// 创始人照片画廊
const FOUNDER_PHOTOS = [
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/b299f2e7cff5536312288493433b451d_f2fef724.jpg",
    label: "Strategist",
    badge: "",
    position: "object-top",
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/91fc24c033da2339894815a01b3ff3d7_6bdbc316.jpg",
    label: "Business",
    badge: "",
    position: "object-top",
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/a76735ada2e72d271c5339a337553b98_a5176a5f.jpg",
    label: "Tsingtao",
    badge: "",
    position: "object-top",
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/dd64d5784a2adcd4ee0da7232aff22ab_15cb7651.jpg",
    label: "Speaking",
    badge: "",
    position: "object-center",
  },
  {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/84427e2c90b42cb82793a200ff3dc0d6_41c1c43f.jpg",
    label: "Huatang Summit Expert",
    badge: "2024 Huatang Summit · Expert Forum",
    position: "object-top",
  },
];

const credentialsZh = [
  "美国暗物质资本（Dark Matter Capital）合伙人",
  "全球顶奢品牌增长战略专家",
  "博商管理研究院企业教练",
  "混沌大学客座讲师",
  "中欧商学院特邀品牌战略专家",
  "前德勤咨询高级分析师 | 北美注册会计师（ACCA）",
  "伦敦国际华文金奖 | 戛纳广告金奖获得者",
];

const credentialsEn = [
  "Partner, Dark Matter Capital (USA)",
  "Global Ultra-Luxury Brand Growth Strategy Expert",
  "Executive Coach, Boshang Management Institute",
  "Guest Lecturer, Chaos University",
  "Invited Brand Strategy Expert, CEIBS",
  "Former Senior Analyst, Deloitte Consulting | CPA (ACCA)",
  "London International Awards Gold | Cannes Lions Gold Winner",
];

const differentiatorsZh = [
  { from: "提供研究报告", to: "打造爆品，利润倍增" },
  { from: "传统甲乙关系", to: "深度战略合伙人" },
  { from: "无法负责销量", to: "全域增长，打爆天猫" },
  { from: "短期项目指导", to: "品牌显贵，长期护航" },
];

const differentiatorsEn = [
  { from: "Research Reports", to: "Blockbuster Products & Profit Multiplication" },
  { from: "Traditional Client-Agency", to: "Deep Strategic Partnership" },
  { from: "No Sales Accountability", to: "Omni-Channel Growth, Tmall Domination" },
  { from: "Short-Term Consulting", to: "Brand Prestige, Long-Term Guardianship" },
];

const highlightsZh = [
  { icon: "◆", title: "品牌显贵", desc: "从大众品牌到奢侈品溢价，系统性提升品牌势能与定价权" },
  { icon: "◆", title: "利润倍增", desc: "通过品牌溢价与渠道优化，帮助客户实现毛利率大幅提升" },
  { icon: "◆", title: "全域增长", desc: "线上线下、公域私域、国内国际，构建全渠道增长飞轮" },
];

const highlightsEn = [
  { icon: "◆", title: "Brand Prestige", desc: "From mass-market to luxury premium — systematically elevating brand equity and pricing power" },
  { icon: "◆", title: "Profit Multiplication", desc: "Through brand premium and channel optimization, helping clients achieve significant gross margin growth" },
  { icon: "◆", title: "Omni-Channel Growth", desc: "Online & offline, public & private domains, domestic & international — building a full-channel growth flywheel" },
];

export default function About() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();
  const ref4 = useScrollReveal();

  const highlights = isEn ? highlightsEn : highlightsZh;
  const differentiators = isEn ? differentiatorsEn : differentiatorsZh;
  const credentials = isEn ? credentialsEn : credentialsZh;

  return (
    <section id="about" className="bg-[#0A0A0A] py-24 lg:py-32">
      <div className="container">
        {/* Section header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="section-label mb-4">01 — About</div>
          <div className="flex items-end gap-6">
            <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold leading-tight">
              {isEn ? "About Mc&Mamoo Growth Engine" : "关于猫眼增长引擎"}
            </h2>
            <div className="hidden md:block h-px flex-1 bg-white/10 mb-3" />
          </div>
        </div>

        {/* Three highlights */}
        <div ref={ref4 as React.RefObject<HTMLDivElement>} className="reveal grid md:grid-cols-3 gap-0 mb-16 border border-white/10">
          {highlights.map((h, i) => (
            <div
              key={h.title}
              className={`p-8 ${i < 2 ? "border-r border-white/10" : ""} group hover:bg-[#C9A84C]/5 transition-all duration-300`}
            >
              <div className="text-[#C9A84C] text-xs mb-3 font-['DM_Mono'] tracking-widest">{h.icon} 0{i + 1}</div>
              <h3 className="font-['Noto_Serif_SC'] text-white text-2xl font-bold mb-3 group-hover:text-[#C9A84C] transition-colors">
                {h.title}
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">
          {/* Left: Company intro */}
          <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal">
            {isEn ? (
              <>
                <p className="text-white/70 text-base leading-relaxed mb-6">
                  <strong className="text-white font-semibold">Mc&amp;Mamoo Brand Management Inc.</strong> (Mc&amp;Mamoo Growth Engine) is an international top-tier brand management company founded in Chicago, USA, with deep roots in Shanghai, China. It was established with investment from <span className="text-[#C9A84C]">Dark Matter Capital</span>.
                </p>
                <p className="text-white/70 text-base leading-relaxed mb-6">
                  Our team brings together elite talent from McKinsey, BCG, Bain, and Deloitte, dedicated to helping brands achieve <span className="text-[#C9A84C] font-semibold">prestige upgrades, profit multiplication, and omni-channel growth</span>.
                </p>
                <p className="text-white/70 text-base leading-relaxed mb-10">
                  We deeply integrate <span className="text-[#C9A84C] font-semibold">500+ top KOL strategic resources</span> across Xiaohongshu, Douyin, Weibo, Bilibili and all major platforms, with a complete cross-border expansion system serving clients across China, the USA, France, Japan, and beyond.
                </p>
              </>
            ) : (
              <>
                <p className="text-white/70 text-base leading-relaxed mb-6">
                  <strong className="text-white font-semibold">Mc&amp;Mamoo Brand Management Inc.</strong>（猫眼增长引擎）是一家发源于美国芝加哥、根植中国上海的国际顶级品牌管理公司，由<span className="text-[#C9A84C]">暗物质资本（Dark Matter Capital）</span>投资创立。
                </p>
                <p className="text-white/70 text-base leading-relaxed mb-6">
                  公司团队汇聚来自麦肯锡（McKinsey）、波士顿咨询（BCG）、贝恩咨询（Bain）及德勤咨询（Deloitte）等全球顶尖机构的精英人才，专注于帮助品牌实现<span className="text-[#C9A84C] font-semibold">显贵化升级、利润倍增与全域增长</span>。
                </p>
                <p className="text-white/70 text-base leading-relaxed mb-10">
                  我们深度整合<span className="text-[#C9A84C] font-semibold">500+头部KOL战略资源</span>，覆盖小红书、抖音、微博、B站等全平台，同时拥有完整的跨境出海增长体系，服务客户遍及中国、美国、法国、日本等多个国家和地区。
                </p>
              </>
            )}

            {/* Differentiators */}
            <div className="space-y-0">
              <div className="text-white/40 text-xs tracking-widest uppercase mb-4 font-['DM_Mono']">
                {isEn ? "Mc&Mamoo Growth Engine vs. Traditional Consulting" : "猫眼增长引擎 vs 传统咨询"}
              </div>
              {differentiators.map((d) => (
                <div
                  key={d.from}
                  className="flex items-center gap-4 py-3 border-b border-white/5 group"
                >
                  <span className="text-white/30 text-sm line-through w-40 flex-shrink-0">{d.from}</span>
                  <span className="text-[#C9A84C]/60 text-sm">→</span>
                  <span className="text-white font-semibold text-sm group-hover:text-[#C9A84C] transition-colors">{d.to}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Founder card with photo gallery */}
          <div ref={ref3 as React.RefObject<HTMLDivElement>} className="reveal" style={{ transitionDelay: "0.2s" }}>
            <FounderCard credentials={credentials} isEn={isEn} />
          </div>
        </div>
      </div>
    </section>
  );
}

function FounderCard({ credentials, isEn }: { credentials: string[]; isEn: boolean }) {
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const currentPhoto = FOUNDER_PHOTOS[activePhoto];

  return (
    <>
      {/* Lightbox overlay */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 cursor-zoom-out"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-3xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={currentPhoto.url}
              alt={`Sean DAI - ${currentPhoto.label}`}
              className="w-full h-full object-contain max-h-[85vh]"
            />
            {currentPhoto.badge && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                <div className="bg-[#C9A84C] text-[#0A0A0A] text-xs font-semibold px-4 py-1.5 tracking-wide">
                  {currentPhoto.badge}
                </div>
              </div>
            )}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-2 right-2 w-8 h-8 bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}

    <div className="relative overflow-hidden border border-white/10">
      {/* Photo area */}
      <div
        className="relative h-80 overflow-hidden cursor-zoom-in group"
        onClick={() => setLightboxOpen(true)}
        title={isEn ? "Click to enlarge" : "点击放大"}
      >
        <img
          src={currentPhoto.url}
          alt={`Sean DAI - ${currentPhoto.label}`}
          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${currentPhoto.position}`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0A]/20 to-[#0A0A0A]/90" />
        {/* Gold top border */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#C9A84C]" />
        {/* Trust badge (for special photos) */}
        {currentPhoto.badge && (
          <div className="absolute top-3 left-3">
            <div className="bg-[#C9A84C] text-[#0A0A0A] text-[0.6rem] font-bold px-2.5 py-1 tracking-wide leading-tight">
              {currentPhoto.badge}
            </div>
          </div>
        )}
        {/* Zoom hint */}
        <div className="absolute top-3 right-3 w-7 h-7 bg-black/40 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1h4M1 1v4M11 1H7M11 1v4M1 11h4M1 11V7M11 11H7M11 11V7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        {/* Photo thumbnails */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-4">
          {FOUNDER_PHOTOS.map((photo, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setActivePhoto(i); }}
              className={`transition-all duration-300 overflow-hidden rounded-sm ${
                activePhoto === i
                  ? "w-12 h-8 border border-[#C9A84C] opacity-100"
                  : "w-8 h-8 border border-white/20 opacity-60 hover:opacity-90"
              }`}
            >
              <img src={photo.url} alt={photo.label} className={`w-full h-full object-cover ${photo.position}`} />
            </button>
          ))}
        </div>
      </div>

      {/* Info area */}
      <div className="p-8">
        <div className="section-label mb-3">{isEn ? "Founder" : "创始人 / Founder"}</div>
        <h3 className="font-['Cormorant_Garamond'] text-white text-3xl font-semibold mb-1">
          Sean DAI
        </h3>
        <div className="text-[#C9A84C] text-sm mb-6 tracking-wide">
          {isEn ? "Chief Brand Growth Expert" : "代言 · 首席品牌增长专家"}
        </div>

        <div className="space-y-2">
          {credentials.map((c) => (
            <div key={c} className="flex items-start gap-2.5">
              <span className="text-[#C9A84C] mt-1 text-xs flex-shrink-0">◆</span>
              <span className="text-white/70 text-sm leading-relaxed">{c}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="text-white/40 text-xs tracking-widest uppercase mb-2 font-['DM_Mono']">
            {isEn ? "14 Years · Key Achievements" : "14年 · 核心战绩"}
          </div>
          <p className="text-white/70 text-sm leading-relaxed">
            {isEn
              ? <>Led the incubation of <span className="text-[#C9A84C] font-semibold">8 blockbuster products each exceeding ¥1B</span>. During the pandemic, helped MasterCard achieve counter-cyclical growth of <span className="text-[#C9A84C] font-semibold">$7B</span> over three years. Serving brand clients across 20+ countries worldwide.</>
              : <>主导孵化 <span className="text-[#C9A84C] font-semibold">8个10亿级大单品</span>，疫情期间帮助MasterCard三年逆势增长 <span className="text-[#C9A84C] font-semibold">70亿美金</span>，服务品牌客户遍及全球20+国家。</>
            }
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
