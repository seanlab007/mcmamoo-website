/**
 * IP Licensing Page — 全球 IP 授权资源库
 * Design: 暗夜金融极简主义，与主站视觉一致
 * Categories: 战略合作 | 独家授权 | 国家级授权
 */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV";

interface IPItem {
  id: string;
  name: string;
  nameCn: string;
  category: "strategic" | "exclusive" | "national";
  image: string;
  years: string;
  tagEn: string;
  tagCn: string;
  descEn: string;
  descCn: string;
  industries: string[];
  badge?: string;
}

const ipData: IPItem[] = [
  // ── 战略合作 ──
  {
    id: "marilyn-monroe",
    name: "Marilyn Monroe",
    nameCn: "玛丽莲·梦露",
    category: "strategic",
    image: `${CDN}/marilyn-monroe_69877.jpg`,
    years: "1926–1962",
    tagEn: "Strategic Partner · ABG",
    tagCn: "战略合作 · ABG 集团",
    descEn: "The eternal Hollywood icon. Mc&Mamoo has established a strategic cooperation with Authentic Brands Group (ABG) to bring Marilyn Monroe's timeless image to premium brand collaborations in the Chinese market.",
    descCn: "永恒的好莱坞偶像。猫眼增长引擎与 Authentic Brands Group（ABG）建立战略合作，将玛丽莲·梦露的经典形象引入中国市场高端品牌联名。",
    industries: ["Fashion", "Beauty", "Luxury", "Entertainment"],
    badge: "ABG 战略合作",
  },
  {
    id: "elvis-presley",
    name: "Elvis Presley",
    nameCn: "猫王·普雷斯利",
    category: "strategic",
    image: `${CDN}/elvis-presley_108068.jpg`,
    years: "1935–1977",
    tagEn: "Strategic Partner · ABG",
    tagCn: "战略合作 · ABG 集团",
    descEn: "The King of Rock 'n' Roll. Through our ABG partnership, Elvis Presley's legendary persona is available for premium licensing across music, fashion, and lifestyle categories in Asia.",
    descCn: "摇滚之王。通过 ABG 战略合作，猫王的传奇形象可授权用于亚洲市场的音乐、时尚及生活方式品类。",
    industries: ["Music", "Fashion", "Lifestyle", "F&B"],
    badge: "ABG 战略合作",
  },
  {
    id: "muhammad-ali",
    name: "Muhammad Ali",
    nameCn: "穆罕默德·阿里",
    category: "strategic",
    image: `${CDN}/muhammad-ali_61880.jpg`,
    years: "1942–2016",
    tagEn: "Strategic Partner · ABG",
    tagCn: "战略合作 · ABG 集团",
    descEn: "The Greatest. Muhammad Ali's iconic brand of courage, excellence and social impact makes him one of the world's most powerful licensing properties for sports, apparel and inspiration brands.",
    descCn: "拳王阿里。其代表的勇气、卓越与社会影响力，是全球最具价值的体育授权 IP 之一，适合运动、服装及励志品牌联名。",
    industries: ["Sports", "Apparel", "Lifestyle", "Inspiration"],
    badge: "ABG 战略合作",
  },
  {
    id: "bruce-lee",
    name: "Bruce Lee",
    nameCn: "李小龙",
    category: "strategic",
    image: `${CDN}/bruce-lee_76412.jpg`,
    years: "1940–1973",
    tagEn: "Strategic Partner · Bruce Lee Enterprises",
    tagCn: "战略合作 · Bruce Lee Enterprises",
    descEn: "The Dragon. Mc&Mamoo facilitates premium licensing partnerships for Chinese brands seeking to leverage this iconic martial arts and philosophy legacy, managed by Bruce Lee Enterprises.",
    descCn: "李小龙形象由 Bruce Lee Enterprises 管理。猫眼增长引擎协助中国品牌建立高端授权合作，传承这一武术与哲学传奇。",
    industries: ["Sports", "Film", "Fashion", "Gaming"],
    badge: "家族授权合作",
  },
  {
    id: "audrey-hepburn",
    name: "Audrey Hepburn",
    nameCn: "奥黛丽·赫本",
    category: "strategic",
    image: `${CDN}/audrey-hepburn_331f00a4.jpg`,
    years: "1929–1993",
    tagEn: "Strategic Partner · Hepburn Estate",
    tagCn: "战略合作 · 赫本遗产",
    descEn: "The epitome of elegance. Audrey Hepburn's timeless style makes her ideal for luxury fashion, beauty, and lifestyle brand collaborations. Managed by her sons Sean and Luca Ferrer.",
    descCn: "优雅的化身。赫本的永恒风格是奢侈时尚、美妆及生活方式品牌联名的理想选择，由其子 Sean 和 Luca Ferrer 管理。",
    industries: ["Luxury", "Beauty", "Fashion", "Film"],
    badge: "家族授权合作",
  },
  {
    id: "bob-marley",
    name: "Bob Marley",
    nameCn: "鲍勃·马利",
    category: "strategic",
    image: `${CDN}/bob-marley_5c7106ce.jpg`,
    years: "1945–1981",
    tagEn: "Strategic Partner · Marley Family",
    tagCn: "战略合作 · 马利家族",
    descEn: "The reggae legend. Bob Marley's message of peace and unity resonates globally, making him a powerful IP for lifestyle, music, and wellness brands. Managed by family through Fifty-Six Hope Road Music.",
    descCn: "雷鬼传奇。鲍勃·马利的和平与团结精神在全球共鸣，适合生活方式、音乐及健康品牌联名，由家族通过 Fifty-Six Hope Road Music 管理。",
    industries: ["Music", "Lifestyle", "Wellness", "Fashion"],
    badge: "家族授权合作",
  },

  // ── 独家授权 ──
  {
    id: "charlie-chaplin",
    name: "Charlie Chaplin",
    nameCn: "查理·卓别林",
    category: "exclusive",
    image: `${CDN}/charlie-chaplin_629a32b6.jpg`,
    years: "1889–1977",
    tagEn: "Exclusive License",
    tagCn: "独家授权",
    descEn: "The Little Tramp. Charlie Chaplin's iconic image transcends generations with universal appeal — ideal for fashion, entertainment, and cultural brand collaborations seeking timeless prestige.",
    descCn: "流浪汉形象跨越时代，具有全球普世魅力——是时尚、娱乐及文化品牌联名寻求永恒价值的理想选择。",
    industries: ["Fashion", "Entertainment", "Art", "Lifestyle"],
  },
  {
    id: "van-gogh",
    name: "Vincent van Gogh",
    nameCn: "文森特·梵高",
    category: "exclusive",
    image: `${CDN}/van-gogh_99c13193.jpg`,
    years: "1853–1890",
    tagEn: "Exclusive License",
    tagCn: "独家授权",
    descEn: "The post-impressionist master. Van Gogh's iconic artworks — Starry Night, Sunflowers — are available for premium brand licensing. Ideal for luxury goods, home décor, fashion, and cultural collaborations.",
    descCn: "后印象派大师。梵高的《星夜》《向日葵》系列可用于高端品牌授权，适合奢侈品、家居、时尚及文化联名。",
    industries: ["Luxury", "Home Décor", "Fashion", "Art"],
  },
  {
    id: "da-vinci",
    name: "Leonardo da Vinci",
    nameCn: "莱昂纳多·达芬奇",
    category: "exclusive",
    image: `${CDN}/da-vinci_158f8cdd.png`,
    years: "1452–1519",
    tagEn: "Exclusive License",
    tagCn: "独家授权",
    descEn: "The Renaissance genius. Da Vinci's artworks and inventions represent the pinnacle of human creativity. Available for premium licensing in luxury, technology, education, and cultural brand collaborations.",
    descCn: "文艺复兴全才。达芬奇的艺术与发明代表人类创造力的巅峰，可用于奢侈品、科技、教育及文化品牌的高端授权联名。",
    industries: ["Luxury", "Technology", "Education", "Art"],
  },
  {
    id: "shakespeare",
    name: "William Shakespeare",
    nameCn: "威廉·莎士比亚",
    category: "exclusive",
    image: `${CDN}/shakespeare_6b28ada9.jpg`,
    years: "1564–1616",
    tagEn: "Exclusive License",
    tagCn: "独家授权",
    descEn: "The Bard of Avon. Shakespeare's literary legacy and iconic imagery are available for premium cultural, educational, and entertainment brand collaborations. His works resonate across all cultures and generations.",
    descCn: "英国文学巨匠。莎士比亚的文学遗产与经典形象可用于文化、教育及娱乐品牌的高端授权，其作品跨越文化与时代边界。",
    industries: ["Education", "Entertainment", "Publishing", "Culture"],
  },
  {
    id: "beethoven",
    name: "Ludwig van Beethoven",
    nameCn: "路德维希·贝多芬",
    category: "exclusive",
    image: `${CDN}/beethoven_dd4819ea.jpg`,
    years: "1770–1827",
    tagEn: "Exclusive License",
    tagCn: "独家授权",
    descEn: "The immortal composer. Beethoven's musical genius and iconic imagery are available for premium licensing in music, luxury, education, and cultural brand collaborations globally.",
    descCn: "乐圣贝多芬。其音乐天才形象可用于音乐、奢侈品、教育及文化品牌的全球高端授权联名。",
    industries: ["Music", "Luxury", "Education", "Culture"],
  },
  {
    id: "lu-xun",
    name: "Lu Xun",
    nameCn: "鲁迅",
    category: "exclusive",
    image: `${CDN}/lu-xun_9c9ecb58.jpg`,
    years: "1881–1936",
    tagEn: "Exclusive License",
    tagCn: "独家授权",
    descEn: "The father of modern Chinese literature. Lu Xun's literary legacy and iconic image are available for cultural, educational, and lifestyle brand collaborations in the Chinese market.",
    descCn: "中国现代文学之父。鲁迅的文学遗产与经典形象可用于中国市场的文化、教育及生活方式品牌授权联名。",
    industries: ["Education", "Publishing", "Culture", "Lifestyle"],
  },

  // ── 国家级授权 ──
  {
    id: "che-guevara",
    name: "Che Guevara",
    nameCn: "切·格瓦拉",
    category: "national",
    image: `${CDN}/che-guevara_9cf42a64.jpg`,
    years: "1928–1967",
    tagEn: "National-Level Authorization",
    tagCn: "国家级授权",
    descEn: "The revolutionary icon. Mc&Mamoo has established channels with official government institutions to facilitate authorized commercial use of Che Guevara's image for premium brands seeking cultural impact.",
    descCn: "革命精神的象征。猫眼增长引擎已建立官方政府机构授权渠道，协助高端品牌完成切·格瓦拉形象的合规商业授权。",
    industries: ["Fashion", "Art", "Lifestyle", "Culture"],
    badge: "政府授权渠道",
  },
  {
    id: "james-dean",
    name: "James Dean",
    nameCn: "詹姆斯·迪恩",
    category: "national",
    image: `${CDN}/james-dean_06795e8e.jpg`,
    years: "1931–1955",
    tagEn: "National-Level Authorization",
    tagCn: "国家级授权",
    descEn: "The eternal rebel. James Dean's image rights are managed through official authorized channels. Mc&Mamoo facilitates compliant licensing for fashion, automotive, and lifestyle brands seeking this iconic American spirit.",
    descCn: "永恒的反叛者。詹姆斯·迪恩的形象权通过官方授权渠道管理。猫眼增长引擎协助时尚、汽车及生活方式品牌完成合规授权。",
    industries: ["Fashion", "Automotive", "Lifestyle", "Film"],
    badge: "官方授权渠道",
  },
];

const categoryConfig = {
  strategic: {
    labelEn: "Strategic Partnership",
    labelCn: "战略合作 IP",
    descEn: "Officially authorized through Mc&Mamoo's strategic partnerships with ABG and global IP management agencies",
    descCn: "通过猫眼增长引擎与 ABG 集团及全球 IP 管理机构的战略合作，提供官方授权服务",
    color: "#C9A84C",
    dot: "#C9A84C",
    borderClass: "border-[#C9A84C]/30",
  },
  exclusive: {
    labelEn: "Exclusive License",
    labelCn: "独家授权",
    descEn: "Premium IP resources available for exclusive brand licensing partnerships, curated by Mc&Mamoo",
    descCn: "猫眼增长引擎精选的高端 IP 资源，可洽谈品牌独家授权合作",
    color: "#60A5FA",
    dot: "#60A5FA",
    borderClass: "border-[#60A5FA]/30",
  },
  national: {
    labelEn: "National-Level Authorization",
    labelCn: "国家级授权",
    descEn: "IP resources accessible through Mc&Mamoo's official government and institutional authorization channels",
    descCn: "通过猫眼增长引擎官方政府及机构授权渠道可访问的 IP 资源",
    color: "#F87171",
    dot: "#F87171",
    borderClass: "border-[#F87171]/30",
  },
};

export default function IPLicensing() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';
  const [activeCategory, setActiveCategory] = useState<"all" | "strategic" | "exclusive" | "national">("all");
  const [selectedIP, setSelectedIP] = useState<IPItem | null>(null);

  const filtered = activeCategory === "all" ? ipData : ipData.filter(ip => ip.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#C9A84C]/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <span style={{ width: 8, height: 8, background: "#C9A84C", transform: "rotate(45deg)", display: "inline-block", boxShadow: "0 0 10px #C9A84C" }} />
            <span className="text-[#C9A84C]/60 text-xs font-mono tracking-[0.3em] uppercase">
              {isEn ? "Global IP Resource Library" : "全球 IP 资源库"}
            </span>
          </div>
          <h1 className="font-['Cormorant_Garamond'] text-5xl md:text-7xl text-white font-light leading-tight mb-4">
            {isEn ? "IP Licensing" : "IP 授权"}
          </h1>
          <p className="text-[#C9A84C] font-['Cormorant_Garamond'] text-2xl md:text-3xl italic mb-6">
            {isEn ? "Global Icons · Premium Partnerships" : "全球传奇 · 高端授权"}
          </p>
          <p className="text-white/50 text-sm leading-relaxed max-w-2xl">
            {isEn
              ? "Mc&Mamoo curates the world's most iconic IP resources — from Hollywood legends to global cultural icons — offering brands exclusive licensing partnerships that amplify prestige and drive growth."
              : "猫眼增长引擎精选全球最具影响力的 IP 资源——从好莱坞传奇到全球文化符号——为品牌提供独家授权合作，提升品牌溢价，驱动增长。"}
          </p>

          {/* Stats */}
          <div className="flex gap-8 mt-10">
            {[
              { num: "15+", labelEn: "Global IPs", labelCn: "全球 IP 资源" },
              { num: "3", labelEn: "License Types", labelCn: "授权类别" },
              { num: "ABG", labelEn: "Strategic Partner", labelCn: "战略合作伙伴" },
            ].map(s => (
              <div key={s.num}>
                <div className="text-[#C9A84C] font-['Cormorant_Garamond'] text-3xl font-light">{s.num}</div>
                <div className="text-white/30 text-[10px] tracking-widest uppercase mt-0.5">{isEn ? s.labelEn : s.labelCn}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Cases */}
      <section className="px-4 py-16 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-10">
            <span style={{ width: 6, height: 6, background: "#C9A84C", transform: "rotate(45deg)", display: "inline-block" }} />
            <span className="text-[#C9A84C]/60 text-xs font-mono tracking-[0.3em] uppercase">
              {isEn ? "Success Cases" : "授权成功案例"}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Case 1: 猫眼看世界 × 梵高 */}
            <div className="border border-white/8 bg-[#111] overflow-hidden group hover:border-[#C9A84C]/30 transition-all duration-300">
              <div className="flex">
                <div className="w-32 flex-shrink-0 bg-[#1a1a1a] relative overflow-hidden">
                  <img
                    src={`${CDN}/vangogh-portrait-BHkfnVxrMFBEFKRDLbFBiZ.webp`}
                    alt="Van Gogh"
                    className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity"
                    style={{ minHeight: 160 }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Van+Gogh&background=1a1a1a&color=C9A84C&size=400&bold=true`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#111]" />
                </div>
                <div className="flex-1 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] font-mono tracking-wider px-2 py-0.5 bg-[#60A5FA]/10 text-[#60A5FA] border border-[#60A5FA]/20">
                      {isEn ? "Exclusive License" : "独家授权"}
                    </span>
                    <span className="text-white/20 text-[9px] font-mono">2024</span>
                  </div>
                  <h3 className="font-['Cormorant_Garamond'] text-lg text-white mb-1">
                    {isEn ? "Maoyan World × Van Gogh" : "猫眼看世界 × 梵高"}
                  </h3>
                  <p className="text-white/40 text-xs leading-relaxed mb-4">
                    {isEn
                      ? "Premium home fragrance brand Maoyan World launched a Van Gogh-inspired limited collection, featuring Starry Night and Sunflowers motifs across candles and diffusers."
                      : "高端家居香氛品牌「猫眼看世界」推出梵高联名限定系列，以《星夜》《向日葵》为主题，覆盖蚕烛、扩香器等全品类。"}
                  </p>
                  <div className="flex gap-4">
                    <div>
                      <div className="text-[#C9A84C] font-['Cormorant_Garamond'] text-xl">3,200万</div>
                      <div className="text-white/25 text-[9px] tracking-wider">{isEn ? "GMV (CNY)" : "首季度 GMV"}</div>
                    </div>
                    <div>
                      <div className="text-[#C9A84C] font-['Cormorant_Garamond'] text-xl">+186%</div>
                      <div className="text-white/25 text-[9px] tracking-wider">{isEn ? "Brand Premium" : "品牌溢价提升"}</div>
                    </div>
                    <div>
                      <div className="text-[#C9A84C] font-['Cormorant_Garamond'] text-xl">48h</div>
                      <div className="text-white/25 text-[9px] tracking-wider">{isEn ? "Sold Out" : "首批售羄"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Case 2: 法国奢利香芬 × 李小龙 */}
            <div className="border border-white/8 bg-[#111] overflow-hidden group hover:border-[#C9A84C]/30 transition-all duration-300">
              <div className="flex">
                <div className="w-32 flex-shrink-0 bg-[#1a1a1a] relative overflow-hidden">
                  <img
                    src={`${CDN}/brucelee-portrait-Bfh7ZkqDHFmFKRDLbFBiZ.webp`}
                    alt="Bruce Lee"
                    className="w-full h-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity"
                    style={{ minHeight: 160 }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=Bruce+Lee&background=1a1a1a&color=C9A84C&size=400&bold=true`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#111]" />
                </div>
                <div className="flex-1 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] font-mono tracking-wider px-2 py-0.5 bg-[#C9A84C]/10 text-[#C9A84C] border border-[#C9A84C]/20">
                      {isEn ? "Strategic Partnership" : "战略合作"}
                    </span>
                    <span className="text-white/20 text-[9px] font-mono">2024</span>
                  </div>
                  <h3 className="font-['Cormorant_Garamond'] text-lg text-white mb-1">
                    {isEn ? "Luxe Parfum France × Bruce Lee" : "法国奢利香芬 × 李小龙"}
                  </h3>
                  <p className="text-white/40 text-xs leading-relaxed mb-4">
                    {isEn
                      ? "French luxury fragrance brand Luxe Parfum collaborated with Bruce Lee Enterprises to launch a warrior-spirit collection, blending Eastern philosophy with French perfumery craftsmanship."
                      : "法国奢利香芬与 Bruce Lee Enterprises 合作，推出「武魂」香水系列，融合东方哲学与法式调香工艺，定价 2,800 元。"}
                  </p>
                  <div className="flex gap-4">
                    <div>
                      <div className="text-[#C9A84C] font-['Cormorant_Garamond'] text-xl">5,800万</div>
                      <div className="text-white/25 text-[9px] tracking-wider">{isEn ? "GMV (CNY)" : "首年 GMV"}</div>
                    </div>
                    <div>
                      <div className="text-[#C9A84C] font-['Cormorant_Garamond'] text-xl">+240%</div>
                      <div className="text-white/25 text-[9px] tracking-wider">{isEn ? "Brand Awareness" : "品牌知名度"}</div>
                    </div>
                    <div>
                      <div className="text-[#C9A84C] font-['Cormorant_Garamond'] text-xl">12国</div>
                      <div className="text-white/25 text-[9px] tracking-wider">{isEn ? "Markets" : "全球市场"}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="px-4 pb-0 sticky top-20 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto flex gap-2 flex-wrap py-4">
          {(["all", "strategic", "exclusive", "national"] as const).map(cat => {
            const cfg = cat === "all" ? null : categoryConfig[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 text-xs font-mono tracking-wider border transition-all duration-200 ${
                  isActive && cat === "all"
                    ? "bg-white text-black border-white"
                    : !isActive
                    ? "border-white/15 text-white/40 hover:border-white/30 hover:text-white/60"
                    : ""
                }`}
                style={isActive && cfg ? { borderColor: cfg.dot, color: cfg.dot, background: `${cfg.dot}18` } : {}}
              >
                {cat === "all"
                  ? (isEn ? "All IPs" : "全部")
                  : isEn ? cfg!.labelEn : cfg!.labelCn}
              </button>
            );
          })}
        </div>
      </section>

      {/* IP Grid by Category */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {(["strategic", "exclusive", "national"] as const).map(cat => {
            const items = filtered.filter(ip => ip.category === cat);
            if (items.length === 0) return null;
            const cfg = categoryConfig[cat];
            return (
              <div key={cat} className="mb-16">
                {/* Category Header */}
                <div className="flex items-center gap-4 mb-8">
                  <span style={{
                    width: 8, height: 8,
                    background: cfg.dot,
                    borderRadius: cat === "strategic" ? "50%" : "0",
                    transform: cat === "exclusive" ? "rotate(45deg)" : "none",
                    display: "inline-block",
                    boxShadow: `0 0 8px ${cfg.dot}`,
                    flexShrink: 0,
                  }} />
                  <div>
                    <h2 className="font-['Cormorant_Garamond'] text-2xl font-light" style={{ color: cfg.dot }}>
                      {isEn ? cfg.labelEn : cfg.labelCn}
                    </h2>
                    <p className="text-white/30 text-xs mt-0.5">{isEn ? cfg.descEn : cfg.descCn}</p>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-4" />
                </div>

                {/* IP Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {items.map(ip => (
                    <div
                      key={ip.id}
                      onClick={() => setSelectedIP(ip)}
                      className={`group cursor-pointer border ${cfg.borderClass} hover:border-opacity-80 transition-all duration-300 overflow-hidden`}
                      style={{ background: "linear-gradient(135deg, #111 0%, #0D0D0D 100%)" }}
                    >
                      {/* Image */}
                      <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
                        <img
                          src={ip.image}
                          alt={ip.name}
                          className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ip.name)}&background=1a1a1a&color=C9A84C&size=400&bold=true`;
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-80" />
                        {ip.badge && (
                          <div className="absolute top-2 left-2">
                            <span className="text-[9px] font-mono tracking-wider px-2 py-0.5" style={{ background: `${cfg.dot}22`, color: cfg.dot, border: `1px solid ${cfg.dot}44` }}>
                              {ip.badge}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <div className="text-white font-['Cormorant_Garamond'] text-base leading-tight">{ip.name}</div>
                        <div className="text-white/40 text-[10px] font-mono mt-0.5">{ip.nameCn}</div>
                        <div className="text-white/25 text-[9px] mt-1">{ip.years}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {ip.industries.slice(0, 2).map(ind => (
                            <span key={ind} className="text-[8px] font-mono tracking-wider px-1.5 py-0.5 border border-white/10 text-white/30">
                              {ind}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 text-[9px] font-mono tracking-wider" style={{ color: cfg.dot }}>
                          {isEn ? "View Details →" : "查看详情 →"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* IP Licensing Inquiry Form */}
      <IPInquiryForm isEn={isEn} />

      {/* IP Detail Modal */}
      {selectedIP && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelectedIP(null)}
        >
          <div
            className="max-w-2xl w-full bg-[#111] border border-white/10 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex">
              {/* Image */}
              <div className="w-48 flex-shrink-0">
                <img
                  src={selectedIP.image}
                  alt={selectedIP.name}
                  className="w-full h-full object-cover object-top"
                  style={{ minHeight: 280 }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedIP.name)}&background=1a1a1a&color=C9A84C&size=400&bold=true`;
                  }}
                />
              </div>
              {/* Content */}
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-['Cormorant_Garamond'] text-2xl text-white">{selectedIP.name}</h3>
                    <div className="text-white/40 text-xs font-mono mt-0.5">{selectedIP.nameCn} · {selectedIP.years}</div>
                  </div>
                  <button onClick={() => setSelectedIP(null)} className="text-white/30 hover:text-white text-xl leading-none ml-4">×</button>
                </div>
                <div className="mb-4">
                  <span className="text-[10px] font-mono tracking-wider px-2 py-1" style={{
                    background: `${categoryConfig[selectedIP.category].dot}22`,
                    color: categoryConfig[selectedIP.category].dot,
                    border: `1px solid ${categoryConfig[selectedIP.category].dot}44`
                  }}>
                    {isEn ? selectedIP.tagEn : selectedIP.tagCn}
                  </span>
                </div>
                <p className="text-white/60 text-sm leading-relaxed mb-4">
                  {isEn ? selectedIP.descEn : selectedIP.descCn}
                </p>
                <div className="mb-5">
                  <div className="text-white/30 text-[10px] font-mono tracking-wider mb-2">{isEn ? "APPLICABLE INDUSTRIES" : "适用行业"}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedIP.industries.map(ind => (
                      <span key={ind} className="text-[10px] font-mono px-2 py-0.5 border border-white/15 text-white/40">{ind}</span>
                    ))}
                  </div>
                </div>
                <a
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-5 py-2 border border-[#C9A84C] text-[#C9A84C] font-mono text-xs tracking-wider hover:bg-[#C9A84C]/10 transition-all duration-200"
                >
                  {isEn ? "Inquire About This IP →" : "咨询此 IP 授权 →"}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

// ─── IP 授权专属咨询表单 ───────────────────────────────────────────────────────
function IPInquiryForm({ isEn }: { isEn: boolean }) {
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    ipInquiryType: "",
    ipName: "",
    budget: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const createInquiry = trpc.consulting.createInquiry.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const inquiryTypes = [
    { value: "exclusive", labelEn: "Exclusive License Negotiation", labelCn: "独家授权洽谈" },
    { value: "national", labelEn: "National-Level Authorization Agency", labelCn: "国家级授权代理" },
    { value: "strategic", labelEn: "Strategic Partnership IP Introduction", labelCn: "战略合作 IP 引入" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.ipInquiryType) return;
    createInquiry.mutate({
      ...form,
      service: `IP授权 — ${inquiryTypes.find(t => t.value === form.ipInquiryType)?.[isEn ? 'labelEn' : 'labelCn'] || form.ipInquiryType}`,
    });
  };

  return (
    <section className="px-4 py-20 border-t border-white/5">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span style={{ width: 8, height: 8, background: "#C9A84C", transform: "rotate(45deg)", display: "inline-block", boxShadow: "0 0 10px #C9A84C" }} />
            <span className="text-[#C9A84C]/60 text-xs font-mono tracking-[0.3em] uppercase">
              {isEn ? "IP Licensing Consultation" : "IP 授权咊询"}
            </span>
          </div>
          <h2 className="font-['Cormorant_Garamond'] text-4xl text-white font-light mb-3">
            {isEn ? "Start Your IP Licensing Journey" : "开启 IP 授权之旅"}
          </h2>
          <p className="text-white/40 text-sm">
            {isEn
              ? "Tell us your needs and our IP specialists will respond within 24 hours."
              : "告诉我们您的需求，我们的 IP 授权专家将在 24 小时内回复。"}
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-16 border border-[#C9A84C]/30 bg-[#C9A84C]/5">
            <div className="text-[#C9A84C] font-['Cormorant_Garamond'] text-3xl mb-3">
              {isEn ? "Inquiry Received" : "咊询已收到"}
            </div>
            <p className="text-white/40 text-sm mb-6">
              {isEn ? "Our IP specialist will contact you within 24 hours." : "我们的 IP 授权专家将在 24 小时内与您联系。"}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => { navigator.clipboard.writeText("mcmamoo_ip"); }}
                className="flex items-center gap-2 px-5 py-2 border border-[#C9A84C]/40 text-[#C9A84C]/80 font-mono text-xs tracking-wider hover:bg-[#C9A84C]/10 transition-all"
              >
                💬 {isEn ? "Add WeChat: mcmamoo_ip" : "加微信: mcmamoo_ip"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Inquiry Type — 3 cards */}
            <div>
              <label className="text-[#C9A84C]/60 text-[10px] font-mono tracking-[0.2em] uppercase block mb-3">
                {isEn ? "Inquiry Type *" : "咊询类型 *"}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {inquiryTypes.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, ipInquiryType: t.value }))}
                    className={`p-4 border text-left transition-all duration-200 ${
                      form.ipInquiryType === t.value
                        ? "border-[#C9A84C] bg-[#C9A84C]/10"
                        : "border-white/10 hover:border-white/25"
                    }`}
                  >
                    <div className={`font-mono text-xs font-semibold mb-1 ${
                      form.ipInquiryType === t.value ? "text-[#C9A84C]" : "text-white/60"
                    }`}>
                      {isEn ? t.labelEn : t.labelCn}
                    </div>
                    <div className="text-white/25 text-[10px]">
                      {t.value === "exclusive" && (isEn ? "Public domain IP exclusive rights" : "公版 IP 独家权益洽谈")}
                      {t.value === "national" && (isEn ? "Government-channel IP authorization" : "政府渠道 IP 合规授权")}
                      {t.value === "strategic" && (isEn ? "ABG & global agency partnerships" : "ABG 及全球机构 IP 引入")}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* IP Name */}
            <div>
              <label className="text-[#C9A84C]/60 text-[10px] font-mono tracking-[0.2em] uppercase block mb-2">
                {isEn ? "IP of Interest" : "意向 IP"}
              </label>
              <input
                type="text"
                value={form.ipName}
                onChange={e => setForm(f => ({ ...f, ipName: e.target.value }))}
                placeholder={isEn ? "e.g. Marilyn Monroe, Van Gogh, Bruce Lee..." : "如：珛露、梵高、李小龙..."}
                className="w-full bg-transparent border border-white/15 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50 font-mono"
              />
            </div>

            {/* Name + Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[#C9A84C]/60 text-[10px] font-mono tracking-[0.2em] uppercase block mb-2">
                  {isEn ? "Name *" : "姓名 *"}
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-transparent border border-white/15 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50"
                />
              </div>
              <div>
                <label className="text-[#C9A84C]/60 text-[10px] font-mono tracking-[0.2em] uppercase block mb-2">
                  {isEn ? "Brand / Company" : "品牌 / 公司"}
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
                  className="w-full bg-transparent border border-white/15 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50"
                />
              </div>
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[#C9A84C]/60 text-[10px] font-mono tracking-[0.2em] uppercase block mb-2">
                  {isEn ? "Email *" : "邮箱 *"}
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-transparent border border-white/15 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50"
                />
              </div>
              <div>
                <label className="text-[#C9A84C]/60 text-[10px] font-mono tracking-[0.2em] uppercase block mb-2">
                  {isEn ? "Phone / WeChat" : "电话 / 微信"}
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-transparent border border-white/15 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50"
                />
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="text-[#C9A84C]/60 text-[10px] font-mono tracking-[0.2em] uppercase block mb-2">
                {isEn ? "Licensing Budget" : "授权预算"}
              </label>
              <select
                value={form.budget}
                onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                className="w-full bg-[#111] border border-white/15 px-4 py-3 text-white text-sm focus:outline-none focus:border-[#C9A84C]/50"
              >
                <option value="">{isEn ? "Select budget range" : "选择预算范围"}</option>
                <option value="under-50k">{isEn ? "Under ¥500K" : "50万以内"}</option>
                <option value="50k-200k">{isEn ? "¥500K – ¥2M" : "50万 – 200万"}</option>
                <option value="200k-500k">{isEn ? "¥2M – ¥5M" : "200万 – 500万"}</option>
                <option value="500k-plus">{isEn ? "¥5M+" : "500万以上"}</option>
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="text-[#C9A84C]/60 text-[10px] font-mono tracking-[0.2em] uppercase block mb-2">
                {isEn ? "Project Brief" : "项目说明"}
              </label>
              <textarea
                rows={4}
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder={isEn ? "Describe your brand, target market, and how you plan to use the IP..." : "描述您的品牌、目标市场及 IP 使用计划..."}
                className="w-full bg-transparent border border-white/15 px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={createInquiry.isPending || !form.ipInquiryType}
              className="w-full py-4 border border-[#C9A84C] text-[#C9A84C] font-mono text-sm tracking-[0.2em] uppercase hover:bg-[#C9A84C]/10 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {createInquiry.isPending
                ? (isEn ? "Submitting..." : "提交中...")
                : (isEn ? "Submit IP Licensing Inquiry" : "提交 IP 授权咊询")}
            </button>

            {createInquiry.isError && (
              <p className="text-red-400/70 text-xs text-center font-mono">
                {isEn ? "Submission failed, please try again." : "提交失败，请重试。"}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
