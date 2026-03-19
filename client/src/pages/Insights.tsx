/*
 * 战略洞察列表页 — /insights
 * Design: 暗夜金融极简主义，文章卡片列表
 */
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { ArrowRight, Clock, Calendar } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const IMG_CHESS = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/article_chess_strategy_c84cd58e.jpg";

const articles = [
  {
    id: "daiyanxiansheng",
    slug: "/insights/daiyanxiansheng",
    category: "战略洞察",
    tag: "商业生态",
    title: '中国不止有任正非——"代言"先生与他的全球商业帝国',
    excerpt:
      "一个人，七条赛道，对标世界顶级商业力量。当任正非在科技上甘岭死守阵地，另一位中国商业文明的缔造者，正在全球版图上悄然布局一场更宏大的生态革命。",
    date: "2025年",
    readTime: "约 8 分钟",
    author: "猫眼增长引擎战略研究团队",
    image: IMG_CHESS,
    featured: true,
  },
];

export default function Insights() {
  useSEO({
    title: '战略洞察 | 猫眼增长引擎 Mc&Mamoo 品牌管理',
    description: '猫眼增长引擎战略研究团队原创洞察，深度解析全球新消费品牌战略、错位竞争理论实战案例、商业领袖成长路径。独创错位竞争理论，连续3年中国新消费领域排名第一。',
    keywords: '猫眼增长引擎,战略洞察,品牌战略,错位竞争,新消费,商业洞察,Mc&Mamoo,品牌咨询',
    url: 'https://www.mcmamoo.com/insights',
    type: 'website',
    breadcrumbs: [
      { name: '战略洞察', url: 'https://www.mcmamoo.com/insights' },
    ],
  });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const featured = articles.find((a) => a.featured);
  const rest = articles.filter((a) => !a.featured);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      {/* Page Header */}
      <div className="relative pt-28 pb-16 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative container max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-px bg-[#C9A84C]/60" />
            <span className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase font-['DM_Mono']">
              Strategic Insights
            </span>
          </div>
          <h1 className="font-['Noto_Serif_SC'] text-4xl md:text-5xl font-bold text-white mb-4">
            战略洞察
          </h1>
          <p className="text-white/40 text-lg max-w-xl">
            猫眼增长引擎战略研究团队深度解析全球商业格局、品牌战略与产业趋势。
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-5xl mx-auto px-6 pb-24">
        {/* Featured Article */}
        {featured && (
          <Link href={featured.slug}>
            <div className="group cursor-pointer mb-16 border border-white/5 hover:border-[#C9A84C]/20 transition-all duration-500 rounded overflow-hidden bg-[#0D0D0D]">
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image */}
                <div className="relative overflow-hidden h-64 md:h-auto">
                  <img
                    src={featured.image}
                    alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0D0D0D] hidden md:block" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-[#C9A84C] text-[#0A0A0A] text-xs font-bold tracking-widest uppercase">
                      精选
                    </span>
                  </div>
                </div>
                {/* Text */}
                <div className="p-8 md:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-0.5 border border-[#C9A84C]/40 text-[#C9A84C] text-xs tracking-widest uppercase">
                      {featured.category}
                    </span>
                    <span className="px-2 py-0.5 border border-white/10 text-white/30 text-xs tracking-widest uppercase">
                      {featured.tag}
                    </span>
                  </div>
                  <h2 className="font-['Noto_Serif_SC'] text-xl md:text-2xl font-bold text-white mb-4 group-hover:text-[#C9A84C] transition-colors leading-tight">
                    {featured.title}
                  </h2>
                  <p className="text-white/50 text-sm leading-7 mb-6 line-clamp-3">
                    {featured.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-white/30 text-xs font-['DM_Mono']">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={11} />
                        {featured.date}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={11} />
                        {featured.readTime}
                      </span>
                    </div>
                    <span className="flex items-center gap-2 text-[#C9A84C] text-sm group-hover:gap-3 transition-all">
                      阅读全文 <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* More Articles (future) */}
        {rest.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((article) => (
              <Link key={article.id} href={article.slug}>
                <div className="group cursor-pointer border border-white/5 hover:border-[#C9A84C]/20 transition-all duration-500 rounded overflow-hidden bg-[#0D0D0D]">
                  <div className="relative overflow-hidden h-48">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-6">
                    <span className="px-2 py-0.5 border border-[#C9A84C]/40 text-[#C9A84C] text-xs tracking-widest uppercase mb-3 inline-block">
                      {article.category}
                    </span>
                    <h3 className="font-['Noto_Serif_SC'] text-base font-bold text-white mb-3 group-hover:text-[#C9A84C] transition-colors leading-snug line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-white/40 text-sm leading-6 line-clamp-2 mb-4">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-white/30 text-xs font-['DM_Mono']">
                      <span>{article.date}</span>
                      <span className="text-[#C9A84C] flex items-center gap-1 group-hover:gap-2 transition-all">
                        阅读 <ArrowRight size={11} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Coming Soon placeholder */}
        <div className="mt-16 border border-white/5 rounded p-10 text-center">
          <div className="text-white/20 text-sm font-['DM_Mono'] tracking-widest uppercase mb-3">
            更多洞察即将发布
          </div>
          <p className="text-white/30 text-sm">
            猫眼增长引擎战略研究团队持续输出全球商业格局深度分析，敬请期待。
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
