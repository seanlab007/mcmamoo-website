/*
 * 猫眼基本法2.0 页面
 * Design: 暗夜金融极简主义 + 金色点缀
 */
import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ChevronDown, ChevronUp, BookOpen, Sparkles } from "lucide-react";

const chapters = [
  {
    id: "preface",
    title: "前言",
    content: `企业长青必有根本大法，如同国家立宪法、家族立祖训，"思想永远优先于一切资源"。思想停滞则财富溃散、文明断层，思想先行方能穿越周期、跨越星际、永续发展。

猫眼基本法1.0诞生于2024年，参照行业标杆体系搭建，以战略为根基、奋斗为底色，推动猫眼实现高度聚焦式发展，完成全栈自研"MaoAI"核心体系，在高科技、新消费、战略咨询多赛道实现跨越式突破。

历经八年深耕，从2018年创始人首篇个人IP公众号发文起步，对标行业巨头却坚持错位竞争、长期主义，依托战略复利、科技自研、模式创新，猫眼已成长为"全球领先AI原生应用科技企业"。

伴随业务边界拓展、AI全栈能力成型、DMB独立金融体系闭环建成，猫眼已从单一战略咨询公司，进化为AI原生+产业科技+自主金融+星际布局的复合型生态集团。

本基本法立足AI原生底层基因，锚定自研AI体系、DMB全域金融生态两大核心底座，融合毛泽东思想、错位竞争理论、元认知哲学、前沿基础科学，贯通产业、科技、金融、星际四大维度，作为猫眼永久治企纲领、全员行为准则、长期发展宪章，代代践行、持续迭代、万古传承。`,
  },
  {
    id: "chapter1",
    title: "第一章 核心价值观",
    articles: [
      { num: "第一条", title: "终极追求", content: "猫眼的终极追求，是在AI原生驱动、战略底层赋能的新消费产业与全域科技领域，兑现用户价值、实现文明进阶；以代代相传、永不止息的长期艰苦奋斗，确立三千代人永续奋斗纲领，近期目标成为银河系领先、全宇宙级反脆弱生态企业。" },
      { num: "第二条", title: "核心资产", content: "猫眼最核心、不可复制、永续增值的核心资产，是沉淀迭代的战略智慧、全员统一的元认知体系、全栈自研MaoAI全域智能生态、自主运转的数据飞轮，以及驱动一切创新的底层好奇心、探索欲与突破型文化。" },
      { num: "第三条", title: "战略灵魂", content: "战略是猫眼与生俱来的灵魂与第一生产力。我们以战略解决自身发展问题，再以成熟战略方法论赋能全域客户，让战略成为可落地、可商业化、可AI化的核心产品。" },
      { num: "第四条", title: "精神内核", content: "爱祖国、爱人民、爱事业、爱生活，是猫眼组织凝聚力、文化向心力的根本源泉。敢想敢为、大胆突破、批判性思考、实事求是、求真务实，是猫眼全员核心行为准则。" },
      { num: "第五条", title: "利益共同体", content: "依托GP/LP生态体系、maoyan-vip全域会员平台、DMB金融流通体系，团结全域合作力量，构建顾客-员工-战略伙伴-生态合作方多层级利益共同体。" },
      { num: "第六条", title: "文化永续", content: "资源终将枯竭，物质必有周期，唯有思想文化、底层文明生生不息。猫眼文化体系涵盖战略哲学、核心思想、错位竞争方法论、高端品牌管理、全域营销、组织管理、技术研发、金融逻辑、艺术审美等全维度无形生产力要素。" },
      { num: "第七条", title: "社会责任", content: "以产业报国、科教兴国、科技自立为核心社会责任，依托AI科技、产业升级、自主金融体系建设，赋能实体经济高质量发展。" },
    ],
  },
  {
    id: "chapter2",
    title: "第二章 基本目标",
    articles: [
      { num: "第八条", title: "近期目标", content: "未来五年内完成AI全栈能力全球化布局、DMB金融体系跨境流通、星际产业初步探索，实现千亿级营收规模。" },
      { num: "第九条", title: "中期愿景", content: "十五年内成为银河系领先的全域生态企业，在AI科技、自主金融、星际产业三大领域建立不可撼动的领导地位。" },
      { num: "第十条", title: "长期使命", content: "以三千代人为周期，践行全域进化、星际长存的终极追求，为人类跨星球文明延续奠定坚实基础。" },
    ],
  },
  {
    id: "chapter3",
    title: "第三章 战略原则",
    articles: [
      { num: "第十一条", title: "错位竞争", content: "永远不与行业巨头正面竞争。通过品类错位、场景错位、人群错位、技术错位，找到市场空白，快速成为细分领域第一。" },
      { num: "第十二条", title: "战略聚焦", content: "拒绝多元化诱惑，聚焦核心业务。猫眼只做能建立战略壁垒的事，只投能产生复利效应的方向。" },
      { num: "第十三条", title: "长期主义", content: "以十年、百年、千年的视角做决策。牺牲短期利润换取长期价值，是猫眼的核心战略姿态。" },
      { num: "第十四条", title: "生态构建", content: "不追求单体强大，追求生态繁荣。通过平台化、AI化、金融化，构建多方共赢的永久生态体系。" },
    ],
  },
  {
    id: "chapter4",
    title: "第四章 科技政策",
    articles: [
      { num: "第十五条", title: "AI原生", content: "MaoAI是猫眼的战略核心资产与第一产品力。所有业务、所有流程、所有决策，必须以AI原生思维重构优化。" },
      { num: "第十六条", title: "全栈自研", content: "在AI核心算法、模型训练、数据飞轮、产品交互四大层面，坚持自主研发，构建技术护城河，绝不依赖外部技术供给。" },
      { num: "第十七条", title: "开放融合", content: "在确保核心技术自主的前提下，以开放心态拥抱全球顶尖技术成果，以合作加速创新。" },
      { num: "第十八条", title: "前沿探索", content: "深度布局量子计算、可控核聚变、星际通信、生命科学等前沿领域，为人类文明跃迁做好技术储备。" },
    ],
  },
  {
    id: "chapter5",
    title: "第五章 产品战略",
    articles: [
      { num: "第十九条", title: "全域产品矩阵", content: "构建MaoAI、MaoThinkTank、DMB金融、星际科技四大产品线，形成覆盖产业、科技、金融、星际的完整生态闭环。" },
      { num: "第二十条", title: "用户体验至上", content: "产品设计以用户价值为唯一标准。极简交互、极致体验、极限性能，是猫眼产品的永恒追求。" },
      { num: "第二十一条", title: "持续迭代", content: "产品永不完美，永不停歇。以日迭代、周迭代、月迭代的节奏，持续进化产品能力与用户体验。" },
    ],
  },
  {
    id: "chapter6",
    title: "第六章 品牌政策",
    articles: [
      { num: "第二十二条", title: "品牌即信仰", content: "猫眼品牌不是Logo，而是信仰体系。思想立品牌、文化铸品牌、业绩证品牌，让品牌成为用户的精神图腾。" },
      { num: "第二十三条", title: "品类第一", content: "每一个进入的细分领域，目标只有一个：成为该品类用户心智中的第一选择。" },
      { num: "第二十四条", title: "品牌溢价", content: "以战略智慧、高端品质、文化内涵构建品牌溢价能力，实现从价格竞争到价值竞争的跨越。" },
      { num: "第二十五条", title: "品牌全球化", content: "立足中国，布局全球。以星际视野规划品牌发展，让猫眼成为人类跨星球文明时代的标志性品牌。" },
    ],
  },
  {
    id: "chapter7",
    title: "第七章 市场战略",
    articles: [
      { num: "第二十六条", title: "全域覆盖", content: "线上线下、国内国际、公域私域，构建全覆盖的市场网络，不留战略盲区。" },
      { num: "第二十七条", title: "KOL战略", content: "深度整合全域KOL资源，以战略思维构建KOL合作生态，实现品牌传播与销售转化的双重突破。" },
      { num: "第二十八条", title: "渠道为王", content: "渠道是品牌的生命线。自主掌控核心渠道，合作共建生态渠道，永不依赖单一渠道。" },
      { num: "第二十九条", title: "星际布局", content: "以星际视角规划市场拓展，提前布局月球基地、深空产业链、跨星球贸易体系。" },
    ],
  },
  {
    id: "chapter8",
    title: "第八章 财经政策",
    articles: [
      { num: "第三十条", title: "利润优先", content: "利润是企业生存的血液。在确保战略投入的前提下，追求最大化利润，为持续扩张提供充足弹药。" },
      { num: "第三十一条", title: "现金流为王", content: "保持充沛现金流，是应对不确定性的根本保障。宁可牺牲短期增长，也要确保现金流安全。" },
      { num: "第三十二条", title: "战略投资", content: "投资聚焦核心、聚焦长期、聚焦战略价值。拒绝投机思维，坚持价值投资理念。" },
      { num: "第三十三条", title: "资本效率", content: "每一分资本的投入，必须产生可衡量的战略回报。以ROI为标准，持续优化资本配置效率。" },
    ],
  },
  {
    id: "chapter9",
    title: "第九章 组织政策",
    articles: [
      { num: "第三十九条", title: "组织建设方针", content: "锚定战略目标，强化责任落地；简化流程链路，AI降本提效；优化协同效率，降低管理内耗；打通信息壁垒，鼓励创新突破；储备后备人才，保障永续发展。" },
      { num: "第四十条", title: "组织结构原则", content: "战略决定组织架构，是猫眼永久组织准则；所有猫眼品牌、体系、合作项目，保持绝对控制权、核心自主权。" },
      { num: "第四十二条", title: "管理者职责", content: "管理者核心三大使命：引领企业长期前景、保障业务高效运转、赋能员工成长成才。" },
      { num: "第四十四条", title: "架构体系", content: "以MaoAI为全域调度中枢，实现全业务智能链接、数据互通、协同联动；推行专业化事业部划分，打造轻量化、敏捷化、AI化的新型组织形态。" },
    ],
  },
  {
    id: "chapter10",
    title: "第十章 人力资源",
    articles: [
      { num: "第五十五条", title: "人力核心准则", content: "以组织建设、文化建设、AI人才建设为人力核心；全员人格平等，坚守公正、公平、公开三大底线。" },
      { num: "第五十六条", title: "人才选拔", content: "人才招聘聚焦素养、潜能、品格、认知，实行能上能下的干部机制。认知高度决定发展边界。" },
      { num: "第五十七条", title: "激励体系", content: "建立行业领先的薪酬福利体系，确保奋斗者必有回报、贡献者获得尊重。" },
      { num: "第五十八条", title: "学习成长", content: "猫眼全员终身学习、终身破界，以技术自学、科学深耕、战略精进打破发展桎梏。" },
    ],
  },
  {
    id: "chapter11",
    title: "第十一章 控制政策",
    articles: [
      { num: "第七十四条", title: "管控核心", content: "以制度管控、AI管控、流程管控保障战略统一，分层管理、例外授权、分类考核、成果导向。" },
      { num: "第七十五条", title: "风险管理", content: "建立常态化危机预警、快速响应机制，兼顾产业风险、科技风险、金融风险、星际未知风险。" },
      { num: "第七十六条", title: "合规经营", content: "坚守合规底线，以道德经营、诚信经营赢得长期信任，绝不为一时之利牺牲企业声誉。" },
    ],
  },
  {
    id: "chapter12",
    title: "第十二章 传承与永续",
    articles: [
      { num: "第一百条", title: "文化传承", content: "猫眼核心管理经验、思想体系、战略方法论、AI发展成果、DMB金融规则，是企业永久财富，全员继承迭代、持续升级。" },
      { num: "第一百零一条", title: "接班人准则", content: "干部核心考核底线：培育超越自己的接班人；以制度兜底保障企业万年长青。" },
      { num: "第一百零二条", title: "领袖新生", content: "猫眼接班人诞生于集体奋斗、实战历练、战略深耕之中；永久传承初代创业者的奋斗精神、探索勇气、务实底色、家国格局。" },
    ],
  },
  {
    id: "appendix",
    title: "附则",
    content: `1. 本《猫眼基本法2.0》自正式颁布之日起全域生效，为猫眼集团及全系子公司、业务板块、生态合作体系最高纲领；

2. 所有内部制度、管理条例、业务规则、金融政策、AI研发规范，均需以本基本法为基准对齐；

3. 本基本法结合AI技术迭代、DMB金融体系升级、星际战略布局，实行长效动态迭代，版本永续更新；

4. 猫眼全体全员、核心伙伴、生态共建者，必须全员学习、深度认同、严格践行，以基本法统一思想、统一认知、统一行动。`,
  },
];

export default function MaoYanBasicLaw() {
  const [openChapters, setOpenChapters] = useState<Set<string>>(
    new Set(["preface", "chapter1"])
  );

  const toggleChapter = (id: string) => {
    setOpenChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useSEO({
    title: "猫眼基本法2.0 | Mc&Mamoo Growth Engine",
    description: "猫眼基本法2.0正式颁布版——AI原生底层基因，锚定自研AI体系、DMB全域金融生态两大核心底座，作为猫眼永久治企纲领、全员行为准则、长期发展宪章。",
    keywords: "猫眼基本法,Mc&Mamoo,企业宪章,AI原生,战略咨询,品牌管理",
  });

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#C9A84C]/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-40 bg-gradient-to-b from-[#C9A84C]/50 to-transparent" />
        
        <div className="container relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C] text-xs tracking-widest mb-8">
            <BookOpen size={14} />
            <span>企业根本大法 · 永久治企纲领</span>
          </div>
          
          <h1 className="font-['Noto_Serif_SC'] text-white text-5xl md:text-7xl font-bold mb-6">
            猫眼基本法<span className="text-[#C9A84C]">2.0</span>
          </h1>
          
          <p className="text-white/60 text-lg md:text-xl max-w-3xl mx-auto mb-8 leading-relaxed">
            立足AI原生底层基因<br />
            锚定自研AI体系、DMB全域金融生态<br />
            贯通产业、科技、金融、星际四大维度
          </p>
          
          <div className="flex items-center justify-center gap-8 text-white/40 text-sm">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#C9A84C]" />
              <span>12章 · 100+条款</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <span>2024年正式颁布</span>
            <div className="w-px h-4 bg-white/20" />
            <span>永久迭代更新</span>
          </div>
        </div>
      </section>

      {/* Chapters */}
      <section className="pb-32">
        <div className="container max-w-4xl">
          <div className="space-y-4">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className="border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300"
              >
                {/* Chapter Header */}
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
                      <span className="text-[#C9A84C] font-['DM_Mono'] text-sm">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <h2 className="font-['Noto_Serif_SC'] text-white text-xl font-semibold">
                      {chapter.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    {chapter.articles && (
                      <span className="text-white/30 text-xs">
                        {chapter.articles.length}条
                      </span>
                    )}
                    {openChapters.has(chapter.id) ? (
                      <ChevronUp size={20} className="text-[#C9A84C]" />
                    ) : (
                      <ChevronDown size={20} className="text-white/40" />
                    )}
                  </div>
                </button>

                {/* Chapter Content */}
                {openChapters.has(chapter.id) && (
                  <div className="px-8 pb-8 border-t border-white/5">
                    {/* Preface / Single content */}
                    {chapter.content && (
                      <div className="pt-6">
                        {chapter.content.split("\n\n").map((para, i) => (
                          <p key={i} className="text-white/60 leading-relaxed mb-4 last:mb-0">
                            {para}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Articles */}
                    {chapter.articles && (
                      <div className="pt-6 space-y-6">
                        {chapter.articles.map((article) => (
                          <div key={article.num} className="relative pl-6 border-l border-[#C9A84C]/20">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-[#C9A84C] font-['DM_Mono'] text-xs bg-[#C9A84C]/10 px-2 py-1">
                                {article.num}
                              </span>
                              <h3 className="text-white font-semibold text-base">
                                {article.title}
                              </h3>
                            </div>
                            <p className="text-white/60 leading-relaxed text-sm">
                              {article.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
