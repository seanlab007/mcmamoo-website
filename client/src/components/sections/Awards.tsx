import React from 'react';
import { useTranslation } from "react-i18next";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface Award {
  year: string;
  title_zh: string;
  title_en: string;
  org_zh: string;
  org_en: string;
  badge_zh: string;
  badge_en: string;
  city: string;
  image: string;
}

const awards: Award[] = [
  {
    year: '2019',
    title_zh: '首尔亚洲品牌创新领袖奖',
    title_en: 'Asia Brand Innovation Leadership Award',
    org_zh: 'Asia Brand Innovation Summit',
    org_en: 'Asia Brand Innovation Summit',
    badge_zh: '领袖奖',
    badge_en: 'Leadership',
    city: 'Seoul',
    image: '/assets/awards/trophy1.jpg'
  },
  {
    year: '2020',
    title_zh: '纽约全球品牌溢价十年成就奖',
    title_en: 'Global Brand Premium Decade Achievement Award',
    org_zh: 'Global Brand Premium Research Institute',
    org_en: 'Global Brand Premium Research Institute',
    badge_zh: '十年成就',
    badge_en: 'Decade Achievement',
    city: 'New York',
    image: '/assets/awards/trophy2.jpg'
  },
  {
    year: '2020',
    title_zh: '维也纳欧洲战略咨询创新奖',
    title_en: 'Vienna European Strategic Consulting Innovation Award',
    org_zh: 'European Strategic Consulting Innovation Association',
    org_en: 'European Strategic Consulting Innovation Association',
    badge_zh: '创新奖',
    badge_en: 'Innovation',
    city: 'Vienna',
    image: '/assets/awards/trophy3.jpg'
  },
  {
    year: '2021',
    title_zh: '上海中国品牌战略年度大奖',
    title_en: 'Shanghai China Brand Strategy Annual Award',
    org_zh: 'China Brand Strategy Development Forum',
    org_en: 'China Brand Strategy Development Forum',
    badge_zh: '中国最佳',
    badge_en: 'China Best',
    city: 'Shanghai',
    image: '/assets/awards/trophy4.jpg'
  },
  {
    year: '2022',
    title_zh: '苏黎世全球品牌管理卓越机构奖',
    title_en: 'Zurich Global Brand Management Excellence Award',
    org_zh: 'Zurich International Brand Management Association',
    org_en: 'Zurich International Brand Management Association',
    badge_zh: '机构卓越',
    badge_en: 'Excellence',
    city: 'Zurich',
    image: '/assets/awards/trophy5.jpg'
  },
  {
    year: '2023',
    title_zh: '新加坡亚太战略咨询最高荣誉奖',
    title_en: 'Singapore Asia-Pacific Strategic Consulting Highest Honor Award',
    org_zh: 'Asia-Pacific Strategic Consulting Association',
    org_en: 'Asia-Pacific Strategic Consulting Association',
    badge_zh: '最高荣誉',
    badge_en: 'Highest Honor',
    city: 'Singapore',
    image: '/assets/awards/trophy6.jpg'
  },
  {
    year: '2024',
    title_zh: '伦敦全球品牌战略咨询机构TOP10',
    title_en: 'London Global Brand Strategy Consulting Top 10',
    org_zh: 'British Brand Strategy Research Institute',
    org_en: 'British Brand Strategy Research Institute',
    badge_zh: '全球TOP10',
    badge_en: 'Global Top 10',
    city: 'London',
    image: '/assets/awards/trophy7.jpg'
  },
  {
    year: '2025',
    title_zh: '达沃斯全球战略咨询创新领袖奖',
    title_en: 'Davos Global Strategic Consulting Innovation Leadership Award',
    org_zh: 'Davos Global Strategic Innovation Forum',
    org_en: 'Davos Global Strategic Innovation Forum',
    badge_zh: '创新领袖',
    badge_en: 'Innovation Leader',
    city: 'Davos',
    image: '/assets/awards/trophy8.jpg'
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
            {isEn
              ? "Recognized by global consulting and brand strategy institutions across 8 countries"
              : "横跨8国，全球顶尖咨询与品牌战略机构认证"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {awards.map((award, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-xl bg-gray-900/40 border border-yellow-900/20 hover:border-yellow-600/50 transition-all duration-500"
            >
              {/* Year badge */}
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1 bg-yellow-600 text-black text-xs font-bold rounded">
                  {award.year}
                </span>
              </div>

              {/* Trophy image */}
              <div className="aspect-[4/3] overflow-hidden bg-gray-900 flex items-center justify-center">
                <img
                  src={award.image}
                  alt={isEn ? award.title_en : award.title_zh}
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 scale-105 group-hover:scale-100 transition-all duration-700"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      target.parentElement.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" class="w-24 h-24 text-yellow-600/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        </div>`;
                    }
                  }}
                />
              </div>

              <div className="p-6">
                {/* Badge */}
                <div className="mb-3">
                  <span className="px-2 py-0.5 bg-yellow-600/10 text-yellow-500 text-[10px] font-bold uppercase tracking-wider rounded border border-yellow-600/20">
                    {isEn ? award.badge_en : award.badge_zh}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                  {isEn ? award.title_en : award.title_zh}
                </h3>

                {/* Org */}
                <p className="text-gray-500 text-xs mb-3 leading-relaxed">
                  {isEn ? award.org_en : award.org_zh}
                </p>

                {/* City */}
                <div className="flex items-center text-gray-600 text-xs">
                  <svg className="w-3 h-3 mr-1 text-yellow-600/50" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-mono tracking-wider">{award.city}</span>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
