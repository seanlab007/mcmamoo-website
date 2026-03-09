/*
 * GlobalCases Section — 全球品牌案例
 * Design: 深色背景 + 国际品牌 LOGO 展示 + 案例卡片
 * Theme: 全球顶级品牌合作与研究
 */
import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const globalCases = [
  {
    brand: "Mastercard",
    category: "全球支付 / Global Payment",
    region: "美国",
    flag: "🇺🇸",
    result: "三年逆势增长70亿美金",
    period: "2019–2022",
    desc: "疫情冲击全球经济，Mastercard面临线下支付场景大幅萎缩的挑战。通过战略重构，深度布局数字支付与无接触支付赛道，同步强化品牌溢价体系，实现三年逆势增长70亿美金的历史性突破。",
    tags: ["品牌溢价", "数字化转型", "全球增长"],
  },
  {
    brand: "法国奢利 LA CELLE",
    category: "奢侈香水 / Luxury Perfume",
    region: "法国",
    flag: "🇫🇷",
    result: "单日售出2万瓶，跨境品类标杆",
    period: "2022",
    desc: "法国百年奢侈香水品牌进入中国市场。通过品牌显贵化定位、小红书+抖音头部KOL矩阵种草、直播带货全域转化，实现单日2万瓶的爆发式增长，成为跨境奢品品类标杆案例。",
    tags: ["品牌显贵", "跨境电商", "KOL矩阵"],
  },
  {
    brand: "Deloitte 德勤",
    category: "专业服务 / Professional Services",
    region: "全球",
    flag: "🌐",
    result: "品牌战略研究合作",
    period: "2018–2020",
    desc: "与德勤咨询联合开展中国新消费品牌战略研究，为多个快消品企业提供品牌升级与数字化转型的联合解决方案，研究成果被多家头部企业采纳。",
    tags: ["战略研究", "品牌升级", "数字化"],
  },
  {
    brand: "特劳特咨询",
    category: "战略咨询 / Strategy Consulting",
    region: "美国",
    flag: "🇺🇸",
    result: "全球营销两大流派并列",
    period: "2015–至今",
    desc: "猫眼咨询创始人Sean DAI独创的全域增长品牌管理体系，与特劳特定位理论并称全球营销学两大流派，在中国新消费领域形成差异化竞争优势，被多所商学院收录为教学案例。",
    tags: ["理论创新", "营销流派", "学术认可"],
  },
  {
    brand: "青岛啤酒",
    category: "快消品 / FMCG",
    region: "中国",
    flag: "🇨🇳",
    result: "夜猫子系列单周增长16倍，伦敦国际奖金奖",
    period: "2018",
    desc: "为青岛啤酒打造夜猫子IP，通过情感连接Z世代用户，广告片播放量破2亿，微博话题阅读量破1亿、讨论量超125万，荣获伦敦国际广告节华文金奖，成为中国啤酒品牌年轻化经典案例。",
    tags: ["品牌年轻化", "IP打造", "国际大奖"],
  },
  {
    brand: "小仙炖",
    category: "新消费 / New Consumer",
    region: "中国",
    flag: "🇨🇳",
    result: "5年20亿营收，天猫品类第一",
    period: "2014–2019",
    desc: "洞察鲜炖燕窝消费升级趋势，通过品类创新+场景错位+明星背书+小红书内容营销，将小仙炖打造为鲜炖燕窝品类代名词，实现天猫品类第一，5年累计营收超20亿元。",
    tags: ["品类创新", "内容营销", "天猫第一"],
  },
  {
    brand: "李渡酒",
    category: "白酒 / Baijiu",
    region: "中国",
    flag: "🇨🇳",
    result: "港股白酒第一股，市值58.6亿港元",
    period: "2019–2022",
    desc: "在白酒红海市场，通过全域增长战略重构品牌定位，聚焦高端文化白酒赛道，成功登陆港股，成为港股白酒第一股，市值达58.6亿港元，实现品牌显贵化与资本化双重突破。",
    tags: ["品牌显贵", "资本化", "港股上市"],
  },
  {
    brand: "美国长盛天 NAD+",
    category: "健康科技 / Health Tech",
    region: "美国",
    flag: "🇺🇸",
    result: "上市后销售500万，单月订单500万",
    period: "2023",
    desc: "美国哈佛研究院合作，FDA认证背书，通过Instagram/TikTok全球种草、亚马逊跨境带货、京东国内开店的全域增长矩阵，实现上市即爆发，国内分销商单月500万订单。",
    tags: ["全域增长", "跨境出海", "健康科技"],
  },
];

const regions = ["全部", "中国", "美国", "法国", "全球"];

export default function GlobalCases() {
  const [activeRegion, setActiveRegion] = useState("全部");
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();

  const filtered = activeRegion === "全部"
    ? globalCases
    : globalCases.filter(c => c.region === activeRegion);

  return (
    <section id="global-cases" className="bg-[#0A0A0A] py-24 lg:py-32">
      <div className="container">
        {/* Header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-12">
          <div className="section-label mb-4">05 — Global Cases</div>
          <div className="flex items-end gap-6 mb-6">
            <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold leading-tight">
              全球品牌案例
            </h2>
            <div className="hidden md:block h-px flex-1 bg-white/10 mb-3" />
          </div>
          <p className="text-white/50 max-w-2xl text-base leading-relaxed">
            服务覆盖中国、美国、法国等多个国家，合作品牌涵盖全球顶级支付机构、奢侈品牌、快消巨头及新消费独角兽。
          </p>

          {/* Region filter */}
          <div className="flex gap-3 mt-8 flex-wrap">
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => setActiveRegion(r)}
                className={`px-4 py-1.5 text-xs tracking-widest font-['DM_Mono'] transition-all duration-200 ${
                  activeRegion === r
                    ? "bg-[#C9A84C] text-[#0A0A0A] font-semibold"
                    : "border border-white/20 text-white/40 hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Cases grid */}
        <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal grid md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div
              key={c.brand}
              className="p-8 border border-white/10 hover:border-[#C9A84C]/40 transition-all duration-300 group"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{c.flag}</span>
                    <h3 className="font-['Noto_Serif_SC'] text-white text-xl font-bold group-hover:text-[#C9A84C] transition-colors">
                      {c.brand}
                    </h3>
                  </div>
                  <div className="text-white/30 text-xs font-['DM_Mono']">{c.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-white/20 text-xs font-['DM_Mono']">{c.period}</div>
                  <div className="text-xs px-2 py-0.5 border border-white/10 text-white/30 mt-1">{c.region}</div>
                </div>
              </div>

              {/* Result badge */}
              <div className="flex items-center gap-2 px-3 py-2 bg-[#C9A84C]/10 border border-[#C9A84C]/30 mb-4">
                <span className="text-[#C9A84C] text-xs">▶</span>
                <span className="text-[#C9A84C] font-semibold text-sm">{c.result}</span>
              </div>

              <p className="text-white/50 text-sm leading-relaxed mb-4">{c.desc}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {c.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs border border-white/10 text-white/30 group-hover:border-[#C9A84C]/20 group-hover:text-[#C9A84C]/50 transition-all"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
