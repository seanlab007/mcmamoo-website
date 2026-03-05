/*
 * Home Page — 猫眼咨询官网首页
 * Design: 暗夜金融极简主义 — 深黑底色 + 猫眼金点缀
 * Sections: Hero → About → Methodology → Services → Cases → Team → Contact → Footer
 */
import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Methodology from "@/components/sections/Methodology";
import Services from "@/components/sections/Services";
import Cases from "@/components/sections/Cases";
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
      <Services />
      <Cases />
      <Team />
      <Contact />
      <Footer />
    </div>
  );
}
