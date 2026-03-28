import React from 'react';
import { useTranslation } from "react-i18next";
import { useScrollReveal } from "@/hooks/useScrollReveal";

interface Case {
  title_zh: string;
  title_en: string;
  description_zh: string;
  description_en: string;
  achievement_zh: string;
  achievement_en: string;
  image: string;
  tags: string[];
}

const cases: Case[] = [
  {
    title_zh: '蟹太太',
    title_en: 'Xie Tai Tai',
    description_zh: '品牌战略升级与全案营销，打造大闸蟹行业领军品牌。',
    description_en: 'Brand strategy upgrade and full-service marketing, creating a leading brand in the hairy crab industry.',
    achievement_zh: '10亿级单品突破',
    achievement_en: 'Billion-level product breakthrough',
    image: '/assets/brand/page_21.jpg',
    tags: ['品牌全案', '战略咨询']
  },
  {
    title_zh: '小鲜炖',
    title_en: 'Xiao Xian Dun',
    description_zh: '鲜炖燕窝品类开创与品牌增长引擎。',
    description_en: 'Freshly stewed bird\'s nest category creation and brand growth engine.',
    achievement_zh: '品类第一',
    achievement_en: 'Category No.1',
    image: '/assets/brand/page_26.jpg',
    tags: ['品类创新', '增长引擎']
  },
  {
    title_zh: '小罐茶',
    title_en: 'Xiao Guan Tea',
    description_zh: '现代派中国茶品牌战略与高端定位。',
    description_en: 'Modern Chinese tea brand strategy and high-end positioning.',
    achievement_zh: '高端茶饮标杆',
    achievement_en: 'High-end tea benchmark',
    image: '/assets/brand/page_46.jpg',
    tags: ['高端定位', '品牌视觉']
  },
  {
    title_zh: '江中',
    title_en: 'Jiangzhong',
    description_zh: '传统医药品牌的现代化转型与单品突破。',
    description_en: 'Modern transformation and product breakthrough of traditional pharmaceutical brands.',
    achievement_zh: '国民级单品',
    achievement_en: 'National-level product',
    image: '/assets/brand/page_41.jpg',
    tags: ['品牌转型', '单品突破']
  },
  {
    title_zh: '胖哥食品',
    title_en: 'Pang Ge',
    description_zh: '休闲食品品牌重塑与全渠道营销。',
    description_en: 'Leisure food brand reshaping and omni-channel marketing.',
    achievement_zh: '市场占有率领先',
    achievement_en: 'Market share leader',
    image: '/assets/brand/page_16.jpg',
    tags: ['品牌重塑', '渠道营销']
  }
];

export default function CaseShowcase() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';
  const revealRef = useScrollReveal();

  return (
    <section id="cases" className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4">
        <div ref={revealRef as React.RefObject<HTMLDivElement>} className="reveal text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-['Noto_Serif_SC']">
            {isEn ? "Success Cases" : "实战案例库"}
          </h2>
          <div className="w-24 h-1 bg-yellow-600 mx-auto mb-6"></div>
          <p className="text-gray-400 text-lg">
            {isEn ? "8 Billion-level products, 14 years of strategic deep cultivation" : "8个10亿级大单品，14年战略深耕成果展示"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {cases.map((item, index) => (
            <div key={index} className="group relative overflow-hidden rounded-2xl bg-gray-900/20 border border-white/5 hover:border-yellow-600/30 transition-all duration-500">
              <div className="aspect-video overflow-hidden">
                <img 
                  src={item.image} 
                  alt={isEn ? item.title_en : item.title_zh}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              </div>
              <div className="p-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white/5 text-white/60 text-xs rounded-full border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {isEn ? item.title_en : item.title_zh}
                </h3>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  {isEn ? item.description_en : item.description_zh}
                </p>
                <div className="flex items-center text-yellow-600 font-bold">
                  <span className="text-sm uppercase tracking-widest mr-2">Achievement:</span>
                  <span className="text-lg">{isEn ? item.achievement_en : item.achievement_zh}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
