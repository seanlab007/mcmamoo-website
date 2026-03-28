import React from 'react';

interface Award {
  year: string;
  festival: string;
  category: string;
  level: string;
  project: string;
  client: string;
}

const awards: Award[] = [
  {
    year: '2015',
    festival: 'Cannes Lions',
    category: 'Media',
    level: 'Silver',
    project: 'Search for Free WiFi Search for Missing Children',
    client: 'KOKO Huang / Shineworks'
  },
  {
    year: '2013',
    festival: 'Cannes Lions',
    category: 'Design',
    level: 'Bronze',
    project: 'Frozen Bullets',
    client: 'Peace One Day'
  },
  {
    year: '2014',
    festival: 'CLIO Awards',
    category: 'Design',
    level: 'Silver',
    project: 'Frozen Bullets',
    client: 'Peace One Day'
  },
  {
    year: '2014',
    festival: 'ADFEST',
    category: 'Outdoor Lotus',
    level: 'Bronze',
    project: 'Frozen Bullets',
    client: 'ShineWorks Shanghai'
  },
  {
    year: '2023',
    festival: '中国国际广告节',
    category: '黄河奖',
    level: '金奖',
    project: '品牌战略创意',
    client: '郭育明导演'
  }
];

export default function CaseShowcase() {
  return (
    <section className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4">
        {/* 案例墙标题 */}
        <div className="mb-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            国际奖项与成就
          </h2>
          <p className="text-xl text-gray-400">
            14 年品牌战略经验 | 8 个 10 亿大单品 | 500+ 深度文章
          </p>
        </div>

        {/* 奖项展示网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {awards.map((award, index) => (
            <div
              key={index}
              className="border border-yellow-600 rounded-lg p-6 hover:shadow-lg hover:shadow-yellow-600/50 transition-all duration-300 bg-gray-900/50"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-yellow-500 font-bold text-sm">{award.year}</p>
                  <h3 className="text-white font-bold text-lg">{award.festival}</h3>
                </div>
                <span className="px-3 py-1 bg-yellow-600/20 text-yellow-500 rounded-full text-xs font-semibold">
                  {award.level}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-gray-300 text-sm">
                  <span className="text-yellow-500">类别：</span>{award.category}
                </p>
                <p className="text-gray-400 text-sm">
                  {award.project}
                </p>
                <p className="text-gray-500 text-xs">
                  客户：{award.client}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <p className="text-yellow-600 text-xs font-semibold">国际创意奖项</p>
              </div>
            </div>
          ))}
        </div>

        {/* 核心成就统计 */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-4xl font-bold text-yellow-500">14</p>
            <p className="text-gray-400 mt-2">年品牌战略经验</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-yellow-500">8</p>
            <p className="text-gray-400 mt-2">个 10 亿大单品</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-yellow-500">500+</p>
            <p className="text-gray-400 mt-2">篇深度文章</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-yellow-500">70B</p>
            <p className="text-gray-400 mt-2">MasterCard 增长</p>
          </div>
        </div>

        {/* Sean DAI 创始人介绍 */}
        <div className="mt-20 border border-yellow-600 rounded-lg p-8 bg-gray-900/50">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-white mb-4">Sean DAI</h3>
              <p className="text-yellow-500 font-semibold mb-4">
                《错位竞争理论》开创者 | 品牌战略专家
              </p>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>✓ 与《定位理论》并称全球两大流派</li>
                <li>✓ 《巴黎商业周刊》评论：21 世纪中国营销学最重要贡献者</li>
                <li>✓ 美国暗物质资本合伙人 (Partner of Dark Matter Capital)</li>
                <li>✓ 中欧商学院特邀讲师 | 港澳大学客座讲师</li>
                <li>✓ Dior 品牌顾问 | 法国 LA CELLE 品牌顾问</li>
                <li>✓ 前德勤咨询高级分析师 | 北美注册会计师 ACCA</li>
              </ul>
            </div>
            <div className="flex-1">
              <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-lg p-1">
                <div className="bg-gray-900 rounded-lg p-8 text-center">
                  <p className="text-yellow-500 font-bold text-2xl">Sean DAI</p>
                  <p className="text-gray-400 text-sm mt-2">品牌战略专家</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
