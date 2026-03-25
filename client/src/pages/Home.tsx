/*
 * Home Page — 猫眼增长引擎官网首页
 * Design: 暗夜金融极简主义 — 深黑底色 + 猫眼金点缀
 * Theme: 品牌显贵 · 利润倍增 · 全域增长
 * Sections:
 *   Hero → InternationalRecognition → BusinessDivision → About
 *   → IPAndWhale（IP授权，资质前置）
 *   → Awards（荣誉，资质前置）
 *   → KOL → Services（主业）
 *   → Cases → GlobalCases（案例佐证）
 *   → Methodology（方法论）
 *   → Team → MaoIndustry（猫眼工业，置底）
 *   → Contact → Footer
 */
import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import BusinessDivision from "@/components/sections/BusinessDivision";
import InternationalRecognition from "@/components/sections/InternationalRecognition";
import About from "@/components/sections/About";
import IPAndWhale from "@/components/sections/IPAndWhale";
import Awards from "@/components/sections/Awards";
import KOL from "@/components/sections/KOL";
import Services from "@/components/sections/Services";
import Cases from "@/components/sections/Cases";
import GlobalCases from "@/components/sections/GlobalCases";
import Methodology from "@/components/sections/Methodology";
import Team from "@/components/sections/Team";
import MaoIndustry from "@/components/sections/MaoIndustry";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <Hero />
      <InternationalRecognition />
      <BusinessDivision />
      <About />
      <IPAndWhale />
      <Awards />
      <KOL />
      <Services />
      <Cases />
      <GlobalCases />
      <Methodology />
      <Team />
      <MaoIndustry />
      <Contact />
      <Footer />
    </div>
  );
}
