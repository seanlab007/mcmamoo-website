/*
 * Team Section — Core Team
 * i18n: full bilingual support
 */
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useTranslation } from "react-i18next";

const team_zh = [
  { name: "Sean DAI（代言）", role: "创始人 / 首席战略专家", en: "Founder & Chief Strategy Expert", bio: "错位竞争理论创始人，与特劳特定位理论并称全球营销两大流派。14年主导孵化8个10亿级大单品，帮助MasterCard三年逆势增长70亿美金。前德勤咨询高级分析师，北美注册会计师（ACCA）。", tags: ["错位竞争理论", "暗物质资本合伙人", "中欧商学院特邀专家"] },
  { name: "王琳 Elva Wong", role: "合伙人 / Partner", en: "Partner", bio: "多年品牌营销经验，集团层面品牌管理者，百亿品牌幕后推手。深度参与Skinow、益盛汉参、张裕醉诗仙等消费品战略破局，从0到1，从1到10。拥有丰富电商经验，手里拥有海量一线网红资源。", tags: ["品牌营销", "电商运营", "网红资源"] },
  { name: "黄和可 Koko HUANG", role: "导演 / Director", en: "Director · Whale Studio", bio: "服务的青啤夜猫子、青啤1903、崂山啤酒、健达巧克力等都成为经典，助力客户突破百亿。主导的居康成为经典品类案例，两年销售从0到10亿。夜猫子等多部作品刷屏，播放量2亿+。", tags: ["伦敦国际奖华文金奖", "中国胖鲸智库专家", "爆款视频"] },
  { name: "图拉古", role: "导演 / Director", en: "Director · Film Director", bio: "中国内地影视导演，毕业于北京电影学院、南加州大学电影艺术学院，福布斯FGA500精英。2015年凭借推理电影获得巴黎电影节单片最佳导演奖。2021年推出超级电影工业系统。", tags: ["巴黎电影节最佳导演", "北京电影学院", "南加州大学"] },
];

const team_en = [
  { name: "Sean DAI", role: "Founder & Chief Strategy Expert", en: "Founder & Chief Strategy Expert", bio: "Founder of Dislocation Competition Theory, recognized alongside Trout's Positioning Theory as one of the two major global marketing schools of thought. Led the incubation of 8 billion-RMB hero products over 14 years; helped MasterCard achieve counter-cyclical growth of $7B over three years. Former Senior Analyst at Deloitte Consulting; ACCA Certified Accountant.", tags: ["Dislocation Competition Theory", "Dark Matter Capital Partner", "CEIBS Guest Expert"] },
  { name: "Elva Wong (王琳)", role: "Partner", en: "Partner", bio: "Years of brand marketing experience as a group-level brand manager and the behind-the-scenes driver of billion-dollar brands. Deeply involved in strategic breakthroughs for Skinow, Yisheng Han Ginseng, Changyu Zuishixian, and other consumer brands — from 0 to 1, and from 1 to 10. Extensive e-commerce experience with a vast network of top-tier influencer resources.", tags: ["Brand Marketing", "E-commerce Operations", "Influencer Network"] },
  { name: "Koko HUANG (黄和可)", role: "Director · Whale Studio", en: "Director · Whale Studio", bio: "Works for Tsingtao Night Owl, Tsingtao 1903, Laoshan Beer, and Kinder Chocolate have all become classics, helping clients break through ¥10B. Led Jukang to become a classic category case, growing from 0 to ¥1B in two years. Night Owl and other works went viral with 200M+ views.", tags: ["London International Awards Chinese Gold", "China Fat Whale Think Tank Expert", "Viral Video"] },
  { name: "Tulagu (图拉古)", role: "Director · Film Director", en: "Director · Film Director", bio: "Chinese mainland film director, graduated from Beijing Film Academy and USC School of Cinematic Arts, Forbes FGA500 Elite. Won Best Director at the Paris Film Festival in 2015 for a mystery film. Launched the Super Film Industrial System in 2021.", tags: ["Paris Film Festival Best Director", "Beijing Film Academy", "USC School of Cinematic Arts"] },
];

export default function Team() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';
  const ref1 = useScrollReveal();
  const ref2 = useScrollReveal();
  const team = isEn ? team_en : team_zh;


  return (
    <section id="team" className="bg-[#0A0A0A] py-24 lg:py-32">
      <div className="container">
        {/* Team header */}
        <div ref={ref1 as React.RefObject<HTMLDivElement>} className="reveal mb-16">
          <div className="section-label mb-4">05 — Core Team</div>
          <h2 className="font-['Noto_Serif_SC'] text-white text-4xl md:text-5xl font-bold">
            {isEn ? "Core Team" : "核心团队"}
          </h2>
        </div>

        {/* Team cards */}
        <div ref={ref2 as React.RefObject<HTMLDivElement>} className="reveal grid md:grid-cols-2 gap-4 mb-24">
          {team.map((member, i) => (
            <div key={member.name} className="p-8 border border-white/10 hover:border-[#C9A84C]/40 transition-all duration-300 group" style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-['Noto_Serif_SC'] text-white text-xl font-bold mb-1 group-hover:text-[#C9A84C] transition-colors">{member.name}</h3>
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
                  <span key={tag} className="px-2.5 py-1 text-xs border border-white/10 text-white/40 group-hover:border-[#C9A84C]/30 group-hover:text-[#C9A84C]/70 transition-all">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
