/*
 * Team Section — 核心团队 + 荣誉资质
 * Design: 深黑底，团队卡片 + 荣誉列表
 */
import { useScrollReveal } from "@/hooks/useScrollReveal";

const team = [
  {
    name: "Sean DAI（代言）",
    role: "创始人 / 首席战略专家",
    en: "Founder & Chief Strategy Expert",
    bio: "错位竞争理论创始人，与特劳特定位理论并称全球营销两大流派。14年主导孵化8个10亿级大单品，帮助MasterCard三年逆势增长70亿美金。前德勤咨询高级分析师，北美注册会计师（ACCA）。",
    tags: ["错位竞争理论", "暗物质资本合伙人", "中欧商学院特邀专家"],
  },
  {
    name: "王琳 Elva Wong",
    role: "合伙人 / Partner",
    en: "Partner",
    bio: "多年品牌营销经验，集团层面品牌管理者，百亿品牌幕后推手。深度参与Skinow、益盛汉参、张裕醉诗仙等消费品战略破局，从0到1，从1到10。拥有丰富电商经验，手里拥有海量一线网红资源。",
    tags: ["品牌营销", "电商运营", "网红资源"],
  },
  {
    name: "黄和可 Koko HUANG",
    role: "导演 / Director",
    en: "Director · Whale Studio",
    bio: "服务的青啤夜猫子、青啤1903、崂山啤酒、健达巧克力等都成为经典，助力客户突破百亿。主导的居康成为经典品类案例，两年销售从0到10亿。夜猫子等多部作品刷屏，播放量2亿+。",
    tags: ["伦敦国际奖华文金奖", "中国胖鲸智库专家", "爆款视频"],
  },
  {
    name: "图拉古",
    role: "导演 / Director",
    en: "Director · Film Director",
    bio: "中国内地影视导演，毕业于北京电影学院、南加州大学电影艺术学院，福布斯FGA500精英。2015年凭借推理电影获得巴黎电影节单片最佳导演奖。2021年推出超级电影工业系统。",
    tags: ["巴黎电影节最佳导演", "北京电影学院", "南加州大学"],
  },
];

const awards = [
  { year: "2021", award: "伦敦广告节 小金人（London International Awards）" },
  { year: "2016", award: "戛纳广告节 1金1铜（Cannes Lions）" },
  { year: "2015", award: "戛纳广告节 1金1银（Cannes Lions）" },
  { year: "2014", award: "D&AD In Book" },
  { year: "2014", award: "ONE SHOW 铜铅笔" },
  { year: "2014", award: "亚太广告节 铜奖" },
  { year: "2013", award: "戛纳广告节 铜狮（Cannes Lions）" },
  { year: "2013", award: "中国4A金印奖 金奖" },
  { year: "2013", award: "龙玺广告节 1金2银" },
];

const partners = [
  "混沌大学", "博商管理研究院", "中欧商学院",
  "青山资本", "赛马资本", "中国营销企业家俱乐部",
  "中国糖酒会", "暗物质资本（Dark Matter Capital）",
];

export default function Team() {
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const ref3 = useScrollReveal();

  return (
    <section id="team" className="bg-[#0A0A0A] py-24 lg:py-32">
      <div className="container">
        {/* Team header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="section-label mb-4">05 — Core Team</div>
          <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold">
            核心团队
          </h2>
        </div>

        {/* Team cards */}
        <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal grid md:grid-cols-2 gap-4 mb-24">
          {team.map((member, i) => (
            <div
              key={member.name}
              className="p-8 border border-white/10 hover:border-[#C9A84C]/40 transition-all duration-300 group"
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-['Noto_Serif_SC'] text-white text-xl font-bold mb-1 group-hover:text-[#C9A84C] transition-colors">
                    {member.name}
                  </h3>
                  <div className="text-[#C9A84C] text-sm">{member.role}</div>
                  <div className="text-white/30 text-xs font-['DM_Mono'] mt-0.5">{member.en}</div>
                </div>
                <div className="w-8 h-8 border border-[#C9A84C]/30 flex items-center justify-center group-hover:border-[#C9A84C] transition-colors">
                  <span className="text-[#C9A84C] text-xs font-['DM_Mono']">0{i + 1}</span>
                </div>
              </div>

              <div className="h-px bg-white/10 mb-4" />

              <p className="text-white/60 text-sm leading-relaxed mb-4">{member.bio}</p>

              <div className="flex flex-wrap gap-2">
                {member.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 text-xs border border-white/10 text-white/40 group-hover:border-[#C9A84C]/30 group-hover:text-[#C9A84C]/70 transition-all"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Awards + Partners */}
        <div ref={ref3 as React.RefObject<HTMLDivElement>} className="reveal grid lg:grid-cols-2 gap-12">
          {/* Awards */}
          <div>
            <div className="section-label mb-6">荣誉奖项</div>
            <div className="space-y-0">
              {awards.map((a) => (
                <div
                  key={a.award}
                  className="flex items-center gap-4 py-3.5 border-b border-white/10 group hover:border-[#C9A84C]/20 transition-colors"
                >
                  <span className="font-['DM_Mono'] text-[#C9A84C] text-xs w-10 flex-shrink-0">{a.year}</span>
                  <span className="text-white/60 text-sm group-hover:text-white/80 transition-colors">{a.award}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Partners */}
          <div>
            <div className="section-label mb-6">合作机构</div>
            <div className="grid grid-cols-2 gap-3">
              {partners.map((p) => (
                <div
                  key={p}
                  className="p-4 border border-white/10 text-white/50 text-sm hover:border-[#C9A84C]/40 hover:text-white/80 transition-all duration-300"
                >
                  {p}
                </div>
              ))}
            </div>

            {/* Service models */}
            <div className="mt-8 p-6 border border-[#C9A84C]/30 bg-[#C9A84C]/5">
              <div className="text-white/40 text-xs tracking-widest uppercase mb-4 font-['DM_Mono']">
                服务模式
              </div>
              <div className="space-y-3">
                {[
                  { type: "高增长潜力品牌", model: "低服务费 + 大股权置换 + 大额风投" },
                  { type: "稳定增长品牌", model: "中等服务费 + 中股权置换 + 中额风投" },
                  { type: "标准项目", model: "标准服务费" },
                ].map((m) => (
                  <div key={m.type} className="flex items-start gap-3">
                    <span className="text-[#C9A84C] mt-1 text-xs">◆</span>
                    <div>
                      <span className="text-white text-sm font-semibold">{m.type}</span>
                      <span className="text-white/40 text-sm"> — {m.model}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
