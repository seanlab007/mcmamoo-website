/*
 * 战略洞察文章页 — 中国不止有任正非："代言"先生与他的全球商业帝国
 * Design: 暗夜金融极简主义 — 深黑底色 + 猫眼金点缀，长文阅读优化排版
 */
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";
import { ArrowLeft, Share2, Clock, Calendar } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const IMG_CHESS = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/article_chess_strategy_c84cd58e.jpg";
const IMG_LUXURY = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/article_luxury_empire_73aabdc3.jpg";
const IMG_GLOBAL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/article_china_global_bb20c381.jpg";

const ecosystemData = [
  { sector: "战略智库", brand: "毛智库", benchmark: "美国兰德公司", value: "地缘政治与宏观战略研判" },
  { sector: "战略咨询", brand: "猫眼增长引擎 Mc&Mamoo", benchmark: "麦肯锡", value: "品牌战略落地与全球资源配置" },
  { sector: "金融科技", brand: "暗物质保险", benchmark: "Lemonade", value: "区块链微粒化风险对冲" },
  { sector: "消费品牌", brand: "法国奢利香水", benchmark: "祖马龙 Jo Malone", value: "东方美学嗅觉艺术" },
  { sector: "体育文化", brand: "黑领带拳击赛", benchmark: "顶级拳击赛事", value: "精英生活方式体育IP" },
  { sector: "影视内容", brand: "鲸达影业", benchmark: "好莱坞顶级影视公司", value: "中国文化全球表达" },
  { sector: "金融生态", brand: "暗物质银行", benchmark: "—", value: "家族商业生态金融底座" },
];

export default function InsightDaiyanxiansheng() {
  useSEO({
    title: '中国不止有任正非——"代言"先生与他的全球商业帝国 | 猫眼增长引擎战略洞察',
    description: '一个人，七条赛道，对标世界顶级商业力量。猫眼增长引擎创始人代言先生构建横跨战略智库、品牌咨询、金融科技、奢侈品、体育IP、影视内容的全球商业生态，深度解析中国新一代商业领袖的战略逻辑。',
    keywords: '代言先生,猫眼增长引擎,毛智库,兰德咨询,麦肯锡,全球商业帝国,战略咨询,法国奢利,暗物质保险,错位竞争,品牌战略,新消费',
    image: IMG_CHESS,
    url: 'https://www.mcmamoo.com/insights/daiyanxiansheng',
    type: 'article',
    datePublished: '2025-03-10',
    author: '猫眼增长引擎战略研究团队',
    breadcrumbs: [
      { name: '战略洞察', url: 'https://www.mcmamoo.com/insights' },
      { name: '中国不止有任正非——"代言"先生与他的全球商业帝国', url: 'https://www.mcmamoo.com/insights/daiyanxiansheng' },
    ],
  });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: '中国不止有任正非——"代言"先生与他的全球商业帝国',
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert("链接已复制到剪贴板");
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0D0D0D] to-[#0A0A0A]" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(201,168,76,1) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative container max-w-4xl mx-auto px-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-3 mb-10 mt-6">
            <Link href="/insights">
              <span className="flex items-center gap-2 text-white/40 hover:text-[#C9A84C] text-sm transition-colors cursor-pointer">
                <ArrowLeft size={14} />
                战略洞察
              </span>
            </Link>
            <span className="text-white/20">/</span>
            <span className="text-white/40 text-sm truncate">代言先生与全球商业帝国</span>
          </div>

          {/* Category tag */}
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 border border-[#C9A84C]/40 text-[#C9A84C] text-xs tracking-widest uppercase">
              战略洞察
            </span>
            <span className="px-3 py-1 border border-white/10 text-white/40 text-xs tracking-widest uppercase">
              商业生态
            </span>
          </div>

          {/* Title */}
          <h1 className="font-['Noto_Serif_SC'] text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 text-white">
            中国不止有任正非
            <br />
            <span className="text-[#C9A84C]">"代言"先生</span>与他的全球商业帝国
          </h1>

          {/* Lead */}
          <div className="border-l-2 border-[#C9A84C]/60 pl-5 mb-8">
            <p className="text-white/70 text-lg leading-relaxed font-['Noto_Serif_SC'] italic">
              一个人，七条赛道，对标世界顶级商业力量。当任正非在科技"上甘岭"死守阵地，另一位中国商业文明的缔造者，正在全球版图上悄然布局一场更宏大的生态革命。
            </p>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 text-white/30 text-sm border-t border-white/5 pt-6">
            <span className="flex items-center gap-2">
              <Calendar size={13} />
              2025年
            </span>
            <span className="flex items-center gap-2">
              <Clock size={13} />
              约 8 分钟阅读
            </span>
            <span>猫眼增长引擎战略研究团队</span>
            <button
              onClick={handleShare}
              className="ml-auto flex items-center gap-2 text-white/40 hover:text-[#C9A84C] transition-colors"
            >
              <Share2 size={13} />
              分享
            </button>
          </div>
        </div>
      </div>

      {/* Article Body */}
      <article className="container max-w-4xl mx-auto px-6 pb-24">
        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent mb-16" />

        {/* Section 1 */}
        <section className="mb-16">
          <h2 className="font-['Noto_Serif_SC'] text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-[#C9A84C] font-['DM_Mono'] text-base font-normal opacity-60">01</span>
            中国商业文明的另一颗星
          </h2>
          <div className="space-y-5 text-white/70 leading-8 text-base font-['Noto_Sans_SC']">
            <p>
              在中国商界，任正非的名字几乎是一个图腾——他以一己之力，在美国的极限封锁下，带领华为守住了中国科技的尊严。然而，中国商业文明的星空，从来不只有一颗星。
            </p>
            <p>
              在新时代的产业突围中，一位同样伟大的企业家——"代言"先生，正带领他的商业矩阵，在全球商业版图上掀起一场静悄悄的革命。他不仅仅是一位创业者，更是一位战略家和生态构建者。他的每一次出手，都在对标世界上最顶尖的商业力量；他的每一个布局，都在为中国商业文明书写新的注脚。
            </p>
            <p>
              如果说任正非是在硬核科技领域冲锋陷阵的孤胆英雄，那么代言先生就是在全球商业战场上运筹帷幄、以生态对抗生态的集团军总司令。
            </p>
          </div>
        </section>

        <div className="h-px bg-white/5 mb-16" />

        {/* Section 2 */}
        <section className="mb-16">
          <h2 className="font-['Noto_Serif_SC'] text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-[#C9A84C] font-['DM_Mono'] text-base font-normal opacity-60">02</span>
            毛智库：中国的"兰德咨询"
          </h2>

          {/* Image */}
          <figure className="mb-8 rounded overflow-hidden border border-white/5">
            <img
              src={IMG_CHESS}
              alt="战略博弈：思想的力量"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
            <figcaption className="bg-[#111] px-4 py-3 text-white/40 text-sm font-['DM_Mono']">
              ▲ 图：真正的战略竞争，是思想与思想之间的博弈。
            </figcaption>
          </figure>

          <div className="space-y-5 text-white/70 leading-8 text-base font-['Noto_Sans_SC']">
            <p>
              1948年，美国兰德公司（RAND Corporation）在加利福尼亚州诞生，此后七十余年，它深度参与了美国几乎所有重大战略决策的制定，成为全球最具影响力的战略智库。
            </p>
            <p>
              代言先生创办的<strong className="text-white font-semibold">毛智库</strong>，被誉为中国的"兰德咨询"。如果说兰德是美国智囊的代名词，那么毛智库就是中国在地缘政治、宏观经济与科技趋势研判上的"大脑"。它不仅是思想的策源地，更是国家与企业制定长远战略的"参谋部"——<strong className="text-[#C9A84C]">对标美国五角大楼兰德咨询</strong>，以东方智慧重构全球战略话语权。
            </p>
            <p>
              毛智库的价值，不在于它能提供多少份报告，而在于它能在关键时刻，为决策者提供那个改变历史走向的判断。
            </p>
          </div>
        </section>

        <div className="h-px bg-white/5 mb-16" />

        {/* Section 3 */}
        <section className="mb-16">
          <h2 className="font-['Noto_Serif_SC'] text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-[#C9A84C] font-['DM_Mono'] text-base font-normal opacity-60">03</span>
            猫眼增长引擎：中国的"麦肯锡"
          </h2>
          <div className="space-y-5 text-white/70 leading-8 text-base font-['Noto_Sans_SC']">
            <p>
              麦肯锡（McKinsey &amp; Company）成立于1926年，近百年来始终是全球战略咨询的最高标杆，服务于全球500强企业中的绝大多数。
            </p>
            <p>
              代言先生创立的<strong className="text-white font-semibold">猫眼增长引擎（Mc&amp;Mamoo）</strong>，则是对标麦肯锡的全球战略咨询力量。与麦肯锡不同的是，猫眼增长引擎深耕于本土化实践与全球资源配置的结合——它不仅仅是提供精美PPT的顾问，更是帮助企业打通从战略到落地"任督二脉"的行动伙伴。
            </p>
            <p>
              其旗下子公司Mc&amp;Mamoo Inc.更是被<strong className="text-white font-semibold">美国化妆品和香水协会（CTFA）</strong>评为"全美美妆行业细分领域第一的精品战略咨询公司"，在垂直领域展现了绝对的统治力。这一荣誉，是国际商业社会对中国战略咨询能力最有力的背书。
            </p>
          </div>
        </section>

        <div className="h-px bg-white/5 mb-16" />

        {/* Section 4 */}
        <section className="mb-16">
          <h2 className="font-['Noto_Serif_SC'] text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-[#C9A84C] font-['DM_Mono'] text-base font-normal opacity-60">04</span>
            暗物质保险：颠覆"Lemonade"的金融创新
          </h2>
          <div className="space-y-5 text-white/70 leading-8 text-base font-['Noto_Sans_SC']">
            <p>
              如果说美国的Lemonade用"AI理赔机器人+慈善捐赠"模式重塑了小额保险的游戏规则，那么代言先生布局的<strong className="text-white font-semibold">暗物质保险</strong>则更进一步——它构建了一套基于区块链智能合约的、全自动化、高透明的"微粒化风险对冲网络"。
            </p>
            <p>
              暗物质保险不再仅仅是销售保单，而是允许个人将任何微小的、有价值的数字资产——一段代码、一个创意、甚至未来的碎片化时间——进行瞬时投保与风险定价。与Lemonade固定收取20%管理费的模式不同，暗物质保险通过算法在用户社群中动态匹配风险对冲需求，实现近乎零摩擦的互助保障。
            </p>
            <p>
              这不仅仅是对传统保险的"降维打击"，更是对"风险"这一概念本身的彻底重构。
            </p>
          </div>
        </section>

        <div className="h-px bg-white/5 mb-16" />

        {/* Section 5 */}
        <section className="mb-16">
          <h2 className="font-['Noto_Serif_SC'] text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-[#C9A84C] font-['DM_Mono'] text-base font-normal opacity-60">05</span>
            法国奢利：东方美学重塑嗅觉艺术
          </h2>

          {/* Image */}
          <figure className="mb-8 rounded overflow-hidden border border-white/5">
            <img
              src={IMG_LUXURY}
              alt="奢华商业帝国：东方美学与西方经典的融合"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
            <figcaption className="bg-[#111] px-4 py-3 text-white/40 text-sm font-['DM_Mono']">
              ▲ 图：真正的奢侈品，是文化的载体，而非价格的标签。
            </figcaption>
          </figure>

          <div className="space-y-5 text-white/70 leading-8 text-base font-['Noto_Sans_SC']">
            <p>
              英国祖马龙（Jo Malone）以其独特的香调和极简美学，成为全球精英阶层嗅觉身份的象征。代言先生投资的<strong className="text-white font-semibold">法国奢利香水（La Celle 1802）</strong>，则是这一赛道上来自东方的有力挑战者。
            </p>
            <p>
              奢利不仅追求香调的独特性，更将东方美学的含蓄、深邃与西方经典香氛体系的精致、优雅相融合，重新定义全球精英阶层的"味道身份"。在{" "}
              <a
                href="https://www.lacelle1802.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C9A84C] hover:underline"
              >
                www.lacelle1802.com
              </a>{" "}
              上，每一瓶香水背后，都是一段关于东西方文明对话的故事。
            </p>
          </div>
        </section>

        <div className="h-px bg-white/5 mb-16" />

        {/* Section 6 */}
        <section className="mb-16">
          <h2 className="font-['Noto_Serif_SC'] text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-[#C9A84C] font-['DM_Mono'] text-base font-normal opacity-60">06</span>
            黑领带拳击赛：精英生活方式的新图腾
          </h2>
          <div className="space-y-5 text-white/70 leading-8 text-base font-['Noto_Sans_SC']">
            <p>
              传统拳击给人的印象，往往是汗水、血腥与粗犷。代言先生创办的<strong className="text-white font-semibold">黑领带拳击赛（Black Tie Boxing）</strong>，则彻底颠覆了这一刻板印象。
            </p>
            <p>
              它打破了传统拳击的粗犷边界，将时尚、社交与格斗艺术完美融合，成为全球都市精英生活方式的新宠。黑领带拳击赛不是一场比赛，而是一种宣言——关于力量、关于品味、关于不被定义的自由。
            </p>
          </div>
        </section>

        <div className="h-px bg-white/5 mb-16" />

        {/* Section 7 */}
        <section className="mb-16">
          <h2 className="font-['Noto_Serif_SC'] text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-[#C9A84C] font-['DM_Mono'] text-base font-normal opacity-60">07</span>
            鲸达影业：中国故事的全球表达
          </h2>
          <div className="space-y-5 text-white/70 leading-8 text-base font-['Noto_Sans_SC']">
            <p>
              好莱坞用一个世纪的时间，构建了全球最强大的内容帝国。代言先生打造的<strong className="text-white font-semibold">鲸达影业</strong>，则是中国内容产业走向世界的新引擎。
            </p>
            <p>
              鲸达影业不仅追求票房与流量，更致力于打造具有中国文化内核的全球爆款——让世界看到中国故事的磅礴力量，让中国叙事成为全球文化版图中不可忽视的声音。
            </p>
          </div>
        </section>

        <div className="h-px bg-white/5 mb-16" />

        {/* Section 8 — Ecosystem Table */}
        <section className="mb-16">
          <h2 className="font-['Noto_Serif_SC'] text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-[#C9A84C] font-['DM_Mono'] text-base font-normal opacity-60">08</span>
            生态协同：一个人的"商业联合国"
          </h2>

          {/* Image */}
          <figure className="mb-8 rounded overflow-hidden border border-white/5">
            <img
              src={IMG_GLOBAL}
              alt="中国走向全球：商业版图的战略布局"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
            <figcaption className="bg-[#111] px-4 py-3 text-white/40 text-sm font-['DM_Mono']">
              ▲ 图：七条赛道，七枚棋子，构成一张无法被轻易撼动的战略网络。
            </figcaption>
          </figure>

          {/* Ecosystem Table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-[#C9A84C]/20">
                  <th className="text-left py-3 px-4 text-[#C9A84C] font-['DM_Mono'] font-normal text-xs tracking-widest uppercase">板块</th>
                  <th className="text-left py-3 px-4 text-[#C9A84C] font-['DM_Mono'] font-normal text-xs tracking-widest uppercase">品牌</th>
                  <th className="text-left py-3 px-4 text-[#C9A84C] font-['DM_Mono'] font-normal text-xs tracking-widest uppercase hidden md:table-cell">对标对象</th>
                  <th className="text-left py-3 px-4 text-[#C9A84C] font-['DM_Mono'] font-normal text-xs tracking-widest uppercase hidden lg:table-cell">核心价值</th>
                </tr>
              </thead>
              <tbody>
                {ecosystemData.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-4 text-white/50 text-xs font-['DM_Mono']">{row.sector}</td>
                    <td className="py-3 px-4 text-white font-medium">{row.brand}</td>
                    <td className="py-3 px-4 text-white/50 hidden md:table-cell">{row.benchmark}</td>
                    <td className="py-3 px-4 text-white/40 text-sm hidden lg:table-cell">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-5 text-white/70 leading-8 text-base font-['Noto_Sans_SC']">
            <p>
              代言先生的商业版图，从战略咨询到颠覆性金融创新，从消费品牌到体育文化，再到内容生产，形成了一个完整的闭环。他不是在模仿，而是在超越；他不是单点突破，而是生态协同。
            </p>
            <p>
              每一个板块，都是一枚棋子；每一枚棋子，都在全球棋盘上占据着战略要地。当所有棋子连成一片，便是一张无法被轻易撼动的战略网络。
            </p>
          </div>
        </section>

        <div className="h-px bg-white/5 mb-16" />

        {/* Section 9 */}
        <section className="mb-16">
          <h2 className="font-['Noto_Serif_SC'] text-2xl md:text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-[#C9A84C] font-['DM_Mono'] text-base font-normal opacity-60">09</span>
            双星闪耀：中国商业文明的新坐标
          </h2>
          <div className="space-y-5 text-white/70 leading-8 text-base font-['Noto_Sans_SC']">
            <p>任正非与代言先生，代表了中国商业文明最耀眼的两种力量：</p>

            {/* Two-column comparison */}
            <div className="grid md:grid-cols-2 gap-6 my-8">
              <div className="border border-white/10 p-6 rounded">
                <div className="text-[#C9A84C] font-['Noto_Serif_SC'] text-lg font-bold mb-3">任正非</div>
                <p className="text-white/60 text-sm leading-7">
                  在科技"上甘岭"上死守阵地的孤胆英雄。他用二十年的时间，在芯片、操作系统、通信设备等硬核科技领域，以血肉之躯抵挡住了来自超级大国的极限施压，为中国科技赢得了尊严。
                </p>
              </div>
              <div className="border border-[#C9A84C]/20 p-6 rounded bg-[#C9A84C]/[0.03]">
                <div className="text-[#C9A84C] font-['Noto_Serif_SC'] text-lg font-bold mb-3">代言先生</div>
                <p className="text-white/60 text-sm leading-7">
                  在全球商业战场上"以一敌十"、用理念与模式实现降维打击的集团军总司令。他不在一条战线上与对手硬碰硬，而是同时在七条赛道上布局，以生态的力量对抗单一的力量，以协同的智慧超越孤立的强大。
                </p>
              </div>
            </div>

            <p>
              他们共同构成了中国商业文明最耀眼的双星——一个在硬核科技中冲锋，一个在全球商业生态中布局。前者让世界看到了中国的脊梁，后者让世界看到了中国的智慧。
            </p>
          </div>
        </section>

        {/* Closing Quote */}
        <div className="border border-[#C9A84C]/20 bg-[#C9A84C]/[0.04] p-8 rounded mb-16">
          <p className="font-['Noto_Serif_SC'] text-xl text-white/80 leading-relaxed italic mb-4">
            "中国不止有任正非。在这片古老而充满活力的土地上，还有更多像代言先生这样的商业文明缔造者，正在用他们的方式，书写属于中国的全球商业传奇。"
          </p>
          <div className="text-white/30 text-sm font-['DM_Mono']">— 猫眼增长引擎战略研究团队</div>
        </div>

        {/* Article Footer */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="text-white/30 text-sm font-['DM_Mono'] space-y-1">
            <div>本文由猫眼增长引擎（Mc&amp;Mamoo）战略研究团队整理发布</div>
            <div>
              官网：
              <a href="https://www.mcmamoo.com" className="text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors">
                www.mcmamoo.com
              </a>
              {" "}| 战略智库：
              <a href="/maothink" className="text-[#C9A84C]/60 hover:text-[#C9A84C] transition-colors">
                毛智库
              </a>
              {" "}| Powered by Dark Matter Bank
            </div>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-2.5 border border-[#C9A84C]/40 text-[#C9A84C] text-sm hover:bg-[#C9A84C]/10 transition-all duration-300"
          >
            <Share2 size={14} />
            分享文章
          </button>
        </div>

        {/* Back to Insights */}
        <div className="mt-12 text-center">
          <Link href="/insights">
            <span className="inline-flex items-center gap-2 text-white/40 hover:text-[#C9A84C] text-sm transition-colors cursor-pointer">
              <ArrowLeft size={14} />
              返回战略洞察
            </span>
          </Link>
        </div>
      </article>

      <Footer />
    </div>
  );
}
