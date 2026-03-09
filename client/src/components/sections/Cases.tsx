/*
 * Cases Section — 标杆案例
 * Design: 深色皮革纹理背景 + 时间轴卡片 + 金色结果标签
 */
import { useState } from "react";
import { Link } from "wouter";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const CASES_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/cases-texture-dSgNBgPx3RKUh8PnxTSuRn.webp";

const cases = [
  {
    year: "2013",
    brand: "江中猴姑饼干",
    category: "大健康 / 食品",
    result: "上市第一年销售额破17亿元",
    strategy: "从用户体验出发，洞察慢性胃病客户有养胃需求，错位OTC领域，依托胃药研发优势，借助饼干进入消费品，跨界与奥利奥等快消品巨头竞争，错位切割市场份额。",
  },
  {
    year: "2014",
    brand: "小仙炖鲜炖燕窝",
    category: "滋补 / 新消费",
    result: "5年20亿在线营收，天猫品类第一",
    strategy: "洞察鲜炖燕窝需求，品类错位+场景错位，依托微商优势布局天猫，小仙炖=鲜炖燕窝品类，结合陈数入股和小红书营销，锚定价格体系。",
  },
  {
    year: "2015",
    brand: "张裕解百纳",
    category: "酒类 / 全球化",
    result: "全球20亿大单品",
    strategy: "砍掉低端品相，依托百年张裕品牌资产，聚焦全球中产，以米其林主厨推荐进入全球市场，切割中低市场份额。",
  },
  {
    year: "2015",
    brand: "小罐茶",
    category: "茶叶 / 高端礼品",
    result: "重新定义中国高端茶礼，2亿营收",
    strategy: "聚焦送礼场景，辐射原点人群，用小罐品相进行品类创新，聚合八大产地，大师作构建壁垒。",
  },
  {
    year: "2018",
    brand: "青岛啤酒夜猫子系列",
    category: "啤酒 / 年轻化",
    result: "单周增长16倍，伦敦国际奖华文金奖",
    strategy: "打造夜猫子IP，通过情感连接用户，用内容创造价值。广告片播放量破亿，微博话题阅读量破1亿、讨论量超125万。",
  },
  {
    year: "2019",
    brand: "李渡酒",
    category: "白酒 / 港股上市",
    result: "2022年港股白酒第一股，市值58.6亿港元",
    strategy: "通过错位竞争战略，在白酒红海市场找到独特定位，成功上市港股，成为港股白酒第一股。",
  },
  {
    year: "2019",
    brand: "益盛药业汉参",
    category: "参类 / 国礼",
    result: "2019年营收破10亿",
    strategy: "品牌=品类，汉参=中国人参，采用汉朝文化符号构建品牌资产，区隔韩国正官庄，占领国礼最高场景维度。",
  },
  {
    year: "2022",
    brand: "法国奢利LA CELLE香水",
    category: "香水 / 跨境",
    result: "单日售出2万瓶",
    strategy: "通过错位竞争战略，帮助法国奢利香水在中国市场实现爆发式增长，成为跨境香水品类标杆案例。",
  },
  {
    year: "2016",
    brand: "蟹太太大闸蟹",
    category: "生鲜 / 品牌化",
    result: "从0到8亿营收，全网蟹券销量连续多年第一",
    strategy: "填补大闸蟹行业品牌化空白，签约黄晓明担任品牌代言人，打造行业唯一一线明星代言壁垒。构建500+明星网红合作矩阵，单场直播销售额最高3000万。",
    link: "/cases/xietaitai",
  },
  {
    year: "2023",
    brand: "美国长盛天NAD+",
    category: "健康 / 跨境",
    result: "上市后销售500万，国内分销商单月500万订单",
    strategy: "美国哈佛研究院合作，FDA认证，Instagram/TikTok种草，亚马逊带货，京东开店，单篇小红书带货中50万。",
  },
  {
    year: "疫情期间",
    brand: "MasterCard",
    category: "支付 / 全球",
    result: "三年逆势增长70亿美金",
    strategy: "在全球疫情冲击下，通过战略重构与错位竞争，帮助MasterCard实现三年逆势增长70亿美金的历史性突破。",
  },
];

export default function Cases() {
  const [activeCase, setActiveCase] = useState(0);
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();

  return (
    <section id="cases" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${CASES_BG})` }}
      />
      <div className="absolute inset-0 bg-[#0D1B2A]/92" />

      <div className="relative z-10 container">
        {/* Header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="section-label mb-4">04 — Landmark Cases</div>
          <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold mb-4">
            标杆案例
          </h2>
          <p className="text-white/50 max-w-xl text-base">
            14年，8个10亿级大单品，20+快消品企业战略破局
          </p>
        </div>

        {/* Cases layout: left list + right detail */}
        <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal grid lg:grid-cols-5 gap-0 border border-white/10">
          {/* Left: case list */}
          <div className="lg:col-span-2 border-r border-white/10 overflow-y-auto max-h-[600px]">
            {cases.map((c, i) => (
              <button
                key={c.brand}
                onClick={() => setActiveCase(i)}
                className={`w-full text-left p-5 border-b border-white/10 transition-all duration-200 group ${
                  activeCase === i
                    ? "bg-[#C9A84C]/10 border-l-2 border-l-[#C9A84C]"
                    : "hover:bg-white/5 border-l-2 border-l-transparent"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-['DM_Mono'] text-xs ${activeCase === i ? "text-[#C9A84C]" : "text-white/30"}`}>
                    {c.year}
                  </span>
                  <span className="text-white/20 text-xs">{c.category}</span>
                </div>
                <div className={`font-semibold text-sm ${activeCase === i ? "text-[#C9A84C]" : "text-white/80 group-hover:text-white"} transition-colors`}>
                  {c.brand}
                </div>
              </button>
            ))}
          </div>

          {/* Right: case detail */}
          <div className="lg:col-span-3 p-8 lg:p-10">
            <div className="h-full flex flex-col">
              <div className="section-label mb-2">{cases[activeCase].year} · {cases[activeCase].category}</div>
              <h3 className="font-['Noto_Serif_SC'] text-white text-3xl font-bold mb-4">
                {cases[activeCase].brand}
              </h3>

              {/* Result badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A84C]/15 border border-[#C9A84C]/40 mb-6 self-start">
                <span className="text-[#C9A84C] text-xs">▶</span>
                <span className="text-[#C9A84C] font-semibold text-sm">{cases[activeCase].result}</span>
              </div>

              <div className="text-white/40 text-xs tracking-widest uppercase mb-3 font-['DM_Mono']">
                错位竞争策略
              </div>
              <p className="text-white/70 text-base leading-relaxed flex-1">
                {cases[activeCase].strategy}
              </p>

              {/* CTA: view full case if link exists */}
              {(cases[activeCase] as any).link && (
                <Link href={(cases[activeCase] as any).link}>
                  <a
                    className="inline-flex items-center gap-2 mt-4 mb-2 text-xs font-medium transition-all hover:opacity-80"
                    style={{
                      color: "#C9A84C",
                      fontFamily: "'DM Mono', monospace",
                      letterSpacing: "0.05em",
                    }}
                  >
                    查看完整案例
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </Link>
              )}

              {/* Navigation dots */}
              <div className="flex gap-2 mt-4">
                {cases.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveCase(i)}
                    className={`transition-all duration-300 ${
                      activeCase === i
                        ? "w-6 h-1.5 bg-[#C9A84C]"
                        : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
