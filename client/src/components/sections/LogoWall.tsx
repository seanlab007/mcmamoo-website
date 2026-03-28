import React from 'react';
import { useTranslation } from "react-i18next";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const logos = [
  '/assets/brand/page_179.jpg',
  '/assets/brand/page_180.jpg',
  '/assets/brand/page_181.jpg',
  '/assets/brand/page_182.jpg',
  '/assets/brand/page_183.jpg'
];

export default function LogoWall() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';
  const revealRef = useScrollReveal();

  return (
    <section id="clients" className="py-20 bg-[#050505] border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4">
        <div ref={revealRef as React.RefObject<HTMLDivElement>} className="reveal text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-['Noto_Serif_SC']">
            {isEn ? "Trusted by Industry Leaders" : "服务客户与合作伙伴"}
          </h2>
          <div className="w-16 h-1 bg-yellow-600 mx-auto mb-6"></div>
          <p className="text-gray-500 text-base max-w-2xl mx-auto">
            {isEn ? "Empowering 500+ brands across various industries to achieve breakthrough growth" : "助力全球 500+ 品牌实现跨越式增长，涵盖快消、大健康、互联网等多个领域"}
          </p>
        </div>

        <div className="space-y-8">
          {logos.map((logo, index) => (
            <div key={index} className="rounded-xl overflow-hidden border border-white/5 hover:border-yellow-600/20 transition-colors duration-500">
              <img 
                src={logo} 
                alt={`Client Logo Wall ${index + 1}`}
                className="w-full h-auto grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
