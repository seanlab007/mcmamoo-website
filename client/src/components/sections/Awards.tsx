import React from 'react';
import { useTranslation } from "react-i18next";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface Award {
  year: string;
  festival_zh: string;
  festival_en: string;
  category_zh: string;
  category_en: string;
  level_zh: string;
  level_en: string;
  image: string;
}

const awards: Award[] = [
  {
    year: '2015',
    festival_zh: '戛纳国际创意节',
    festival_en: 'Cannes Lions',
    category_zh: '媒介类',
    category_en: 'Media',
    level_zh: '银奖',
    level_en: 'Silver',
    image: '/assets/brand/page_6.jpg'
  },
  {
    year: '2013',
    festival_zh: '戛纳国际创意节',
    festival_en: 'Cannes Lions',
    category_zh: '设计类',
    category_en: 'Design',
    level_zh: '铜奖',
    level_en: 'Bronze',
    image: '/assets/brand/page_7.jpg'
  },
  {
    year: '2014',
    festival_zh: '克里奥国际广告大奖',
    festival_en: 'CLIO Awards',
    category_zh: '设计类',
    category_en: 'Design',
    level_zh: '银奖',
    level_en: 'Silver',
    image: '/assets/brand/page_8.jpg'
  },
  {
    year: '2014',
    festival_zh: '亚太广告节',
    festival_en: 'ADFEST',
    category_zh: '户外类',
    category_en: 'Outdoor Lotus',
    level_zh: '铜奖',
    level_en: 'Bronze',
    image: '/assets/brand/page_9.jpg'
  },
  {
    year: '2023',
    festival_zh: '中国国际广告节',
    festival_en: 'China International Advertising Festival',
    category_zh: '黄河奖',
    category_en: 'Huanghe Awards',
    level_zh: '金奖',
    level_en: 'Gold',
    image: '/assets/brand/page_10.jpg'
  }
];

export default function Awards() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';
  const revealRef = useScrollReveal();

  return (
    <section id="awards" className="py-24 bg-[#0A0A0A] border-t border-yellow-900/30">
      <div className="max-w-7xl mx-auto px-4">
        <div ref={revealRef as React.RefObject<HTMLDivElement>} className="reveal text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-['Noto_Serif_SC']">
            {isEn ? "International Recognition" : "国际荣誉与认可"}
          </h2>
          <div className="w-24 h-1 bg-yellow-600 mx-auto mb-6"></div>
          <p className="text-gray-400 text-lg">
            {isEn ? "Across Cannes, CLIO, ADFEST and other top global creative stages" : "横跨戛纳、克里奥、亚太等全球顶级创意殿堂"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {awards.map((award, index) => (
            <div key={index} className="group relative overflow-hidden rounded-xl bg-gray-900/40 border border-yellow-900/20 hover:border-yellow-600/50 transition-all duration-500">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src={award.image} 
                  alt={isEn ? award.festival_en : award.festival_zh}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 scale-105 group-hover:scale-100 transition-all duration-700"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-yellow-600 font-bold text-sm">{award.year}</span>
                  <span className="px-2 py-0.5 bg-yellow-600/10 text-yellow-500 text-[10px] font-bold uppercase tracking-wider rounded border border-yellow-600/20">
                    {isEn ? award.level_en : award.level_zh}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {isEn ? award.festival_en : award.festival_zh}
                </h3>
                <p className="text-gray-500 text-sm">
                  {isEn ? award.category_en : award.category_zh}
                </p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
