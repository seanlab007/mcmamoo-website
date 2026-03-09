/*
 * Home Page — 猫眼咨询官网首页
 * Design: 暗夜金融极简主义 — 深黑底色 + 猫眼金点缀
 * Theme: 品牌显贵 · 利润倍增 · 全域增长
 * Sections: Hero → About → Methodology → KOL → Services → Cases → GlobalCases → Awards → Team → Contact → Footer
 */
import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Methodology from "@/components/sections/Methodology";
import KOL from "@/components/sections/KOL";
import Services from "@/components/sections/Services";
import Cases from "@/components/sections/Cases";
import GlobalCases from "@/components/sections/GlobalCases";
import Awards from "@/components/sections/Awards";
import Team from "@/components/sections/Team";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />
      <Hero />
      <About />
      <Methodology />
      <KOL />
      <Services />
      <Cases />
      <GlobalCases />
      <Awards />
      <Team />
      <Contact />
      <Footer />
    </div>
  );
}
