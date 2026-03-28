/*
 * ============================================================
 * Home Page — 猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎官网首页
 * ============================================================
 * Design : 暗夜金融极简主义 — 深黑底色 + 猫眼增长引擎 (Mc&Mamoo Growth Engine)金点缀
 * Theme  : 品牌显贵 · 利润倍增 · 全域增长
 *
 * Sections（顺序）:
 *   IPAndWhale（IP授权 + Whale Pictures，首屏视觉冲击）
 *   → Hero → InternationalRecognition → BusinessDivision
 *   → About → Awards → KOL → Services（含分级定价）
 *   → Cases → GlobalCases → Methodology
 *   → Team → LogoWall → MaoIndustry（猫眼增长引擎 (Mc&Mamoo Growth Engine)工业，置底）
 *   → FAQ → Contact → Footer
 *
 * ⚠️  PROTECTED FILE — 由 Manus 统一维护
 *     禁止 Work Buddy / OpenClaw 直接修改本文件。
 *     如需变更，请通过 Pull Request 并在描述中注明修改目的。
 * ============================================================
 */
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/Navbar";
import IPAndWhale from "@/components/sections/IPAndWhale";
import Hero from "@/components/sections/Hero";
import BusinessDivision from "@/components/sections/BusinessDivision";
import InternationalRecognition from "@/components/sections/InternationalRecognition";
import About from "@/components/sections/About";
import Awards from "@/components/sections/Awards";
import KOL from "@/components/sections/KOL";
import Services from "@/components/sections/Services";
import Cases from "@/components/sections/Cases";
import GlobalCases from "@/components/sections/GlobalCases";
import Methodology from "@/components/sections/Methodology";
import Team from "@/components/sections/Team";
import MaoIndustry from "@/components/sections/MaoIndustry";
import CaseShowcase from "@/components/sections/CaseShowcase";
import LogoWall from "@/components/sections/LogoWall";
import FAQ from "@/components/sections/FAQ";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/Footer";

const HOME_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": "https://www.mcmamoo.com/#service",
    "name": "猫眼增长引擎 (Mc&Mamoo Growth Engine)品牌战略服务",
    "description": "猫眼增长引擎 (Mc&Mamoo Growth Engine)为新消费品牌提供全案战略咨询、爆品营销策划、天猫流量池构建、整合营销带货四大核心服务。",
    "provider": { "@id": "https://www.mcmamoo.com/#organization" },
    "areaServed": "CN",
    "serviceType": "品牌战略咨询",
    "url": "https://www.mcmamoo.com"
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "猫眼增长引擎 (Mc&Mamoo Growth Engine)的核心服务是什么？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "猫眼增长引擎 (Mc&Mamoo Growth Engine)提供四大核心服务：新消费第一品牌全案战略咨询、爆品营销策划、天猫流量池构建、整合营销带货。独创错位竞争理论，帮助品牌实现品类第一。"
        }
      },
      {
        "@type": "Question",
        "name": "猫眼增长引擎 (Mc&Mamoo Growth Engine)服务过哪些知名品牌？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "猫眼增长引擎 (Mc&Mamoo Growth Engine)服务过江中猴姑饼干（上市第一年17亿销售额）、小鲜炖鲜炖燕窝（5年20亿在线营收、天猫品类第一）、小罐茶、蟹太太大闸蟹（全网蟹券销量连续多年第一）、胖哥食品等10亿级大单品品牌。"
        }
      },
      {
        "@type": "Question",
        "name": "什么是错位竞争理论？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "错位竞争是猫眼增长引擎 (Mc&Mamoo Growth Engine)独创的品牌战略理论，核心是帮助品牌避开正面竞争，通过品类错位、场景错位、人群错位等方式找到市场空白，实现快速成为细分品类第一。"
        }
      },
      {
        "@type": "Question",
        "name": "猫眼增长引擎 (Mc&Mamoo Growth Engine)与麦肯锡等传统咨询公司有什么区别？",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "猫眼增长引擎 (Mc&Mamoo Growth Engine)不提供研究报告，而是打造爆品使利润倍增；不是传统甲乙关系，而是深度战略合伙人；不只给建议，而是全域增长打爆天猫；不做短期项目指导，而是品牌显贵长期护航。"
        }
      }
    ]
  }
];

export default function Home() {
  useSEO({
    title: "猫眼增长引擎 (Mc&Mamoo Growth Engine) · Mc&Mamoo Brand Management Inc. | 中国新消费第一品牌战略咨询公司",
    description: "猫眼增长引擎 (Mc&Mamoo Growth Engine)（Mc&Mamoo Brand Management Inc.）独创错位竞争理论，服务江中猴姑、小鲜炖、小罐茶、蟹太太等10亿级大单品。品牌显贵·利润倍增·全域增长，成为您的深度战略合伙人。",
    url: "https://www.mcmamoo.com/",
    image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/hero-bg-d7eizqgBbqatPTyug6Apqv.webp",
    keywords: "猫眼增长引擎 (Mc&Mamoo Growth Engine),Mc&Mamoo,品牌战略咨询,新消费品牌,错位竞争,品牌定位,爆品策划,天猫运营,品牌管理公司,战略咨询,消费品牌升级,品类战略",
    jsonLd: HOME_JSON_LD,
    breadcrumbs: [{ name: "首页", url: "/" }],
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <main>
        {/* ── 01 IP授权 + Whale Pictures 联合板块 ── */}
        <IPAndWhale />
        {/* ── 02 Hero 主视觉 ── */}
        <Hero />
        {/* ── 03 国际机构认可 ── */}
        <InternationalRecognition />
        {/* ── 04 业务板块 ── */}
        <BusinessDivision />
        {/* ── 05 关于我们 ── */}
        <About />
        {/* ── 06 荣誉奖项 ── */}
        <Awards />
        {/* ── 07 KOL 合作 ── */}
        <KOL />
        {/* ── 08 服务体系（含分级定价） ── */}
        <Services />
        {/* ── 09 国内案例 ── */}
        <Cases />
        {/* ── 10 全球案例 ── */}
        <GlobalCases />
        {/* ── 11 方法论 ── */}
        <Methodology />
        {/* ── 11.5 国际奖项与案例墙 ── */}
        <CaseShowcase />
        {/* ── 12 团队 ── */}
        <Team />
        {/* ── 12.5 客户 Logo 墙 ── */}
        <LogoWall />
        {/* ── 13 猫眼增长引擎 (Mc&Mamoo Growth Engine)工业（置底） ── */}
        <MaoIndustry />
        {/* ── 14 常见问题 ── */}
        <FAQ />
        {/* ── 15 联系我们 ── */}
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
