/**
 * IP 授权板块 — 猫眼增长引擎
 * 全球 IP 资源库：公版IP · 战略合作IP · 特殊状态IP
 */
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

// ── IP 数据库 ──────────────────────────────────────────────────────────
const ipDatabase = {
  // 战略合作 IP（有主，需授权谈判）
  strategic: [
    {
      id: "marilyn-monroe",
      name: "玛丽莲·梦露",
      nameEn: "Marilyn Monroe",
      category: "好莱坞传奇",
      categoryEn: "Hollywood Icon",
      status: "strategic",
      statusLabel: "战略合作",
      partner: "Authentic Brands Group (ABG)",
      partnerUrl: "https://corporate.authentic.com",
      description: "全球最具辨识度的女性 IP 之一，ABG 全资收购并严格管理其肖像权、姓名权及相关知识产权。适用于时尚、美妆、奢侈品、娱乐等多个品类。",
      descriptionEn: "One of the world's most recognizable female IPs. ABG owns and strictly manages her likeness, name rights and related IP. Applicable to fashion, beauty, luxury, entertainment.",
      value: "超高",
      categories: ["时尚", "美妆", "奢侈品", "娱乐"],
      note: "与 ABG 集团战略合作，需通过 ABG 授权渠道申请",
      icon: "⭐",
    },
    {
      id: "elvis-presley",
      name: "猫王 · 埃尔维斯·普雷斯利",
      nameEn: "Elvis Presley",
      category: "摇滚传奇",
      categoryEn: "Rock Legend",
      status: "strategic",
      statusLabel: "战略合作",
      partner: "Authentic Brands Group (ABG)",
      partnerUrl: "https://corporate.authentic.com",
      description: "摇滚乐之王，ABG 于 2013 年收购其全部知识产权资产，包括 Graceland 运营权。全球授权年收入超 1 亿美元，适用于音乐、时尚、旅游、娱乐等品类。",
      descriptionEn: "The King of Rock and Roll. ABG acquired all IP assets including Graceland operations in 2013. Global licensing revenue exceeds $100M annually.",
      value: "超高",
      categories: ["音乐", "时尚", "旅游", "娱乐"],
      note: "与 ABG 集团战略合作，需通过 ABG 授权渠道申请",
      icon: "🎸",
    },
    {
      id: "muhammad-ali",
      name: "穆罕默德·阿里",
      nameEn: "Muhammad Ali",
      category: "拳击传奇",
      categoryEn: "Boxing Legend",
      status: "strategic",
      statusLabel: "战略合作",
      partner: "Authentic Brands Group (ABG)",
      partnerUrl: "https://corporate.authentic.com",
      description: "\"世界上最伟大的人\"，ABG 与阿里家族共同管理其 IP，适用于体育、励志、时尚、媒体等品类。全球最具影响力的体育 IP 之一。",
      descriptionEn: "\"The Greatest\". ABG co-manages with the Ali family. Applicable to sports, inspirational, fashion, media categories.",
      value: "超高",
      categories: ["体育", "励志", "时尚", "媒体"],
      note: "与 ABG 集团战略合作，需通过 ABG 授权渠道申请",
      icon: "🥊",
    },
    {
      id: "bruce-lee",
      name: "李小龙",
      nameEn: "Bruce Lee",
      category: "功夫传奇",
      categoryEn: "Martial Arts Icon",
      status: "private",
      statusLabel: "家族直管",
      partner: "Bruce Lee Enterprises (Shannon Lee)",
      partnerUrl: "https://brucelee.com",
      description: "全球最具影响力的华人 IP，由女儿李香凝通过 Bruce Lee Enterprises 管理。适用于功夫、健身、生活方式、影视等品类。在中国市场具有极高认知度，是亚洲品牌联名的首选 IP。",
      descriptionEn: "The most influential Chinese IP globally. Managed by daughter Shannon Lee through Bruce Lee Enterprises. High recognition in China market.",
      value: "极高（亚洲市场）",
      categories: ["功夫", "健身", "生活方式", "影视"],
      note: "需直接联系 Bruce Lee Enterprises 申请授权",
      icon: "🥋",
    },
    {
      id: "bob-marley",
      name: "鲍勃·马利",
      nameEn: "Bob Marley",
      category: "雷鬼传奇",
      categoryEn: "Reggae Legend",
      status: "private",
      statusLabel: "家族直管",
      partner: "Tuff Gong / Marley Family",
      partnerUrl: "https://www.bobmarley.com",
      description: "雷鬼音乐之父，由家族通过 Tuff Gong 品牌管理，约 12 位继承人共同持有遗产。适用于音乐、生活方式、大麻健康、时尚等品类。",
      descriptionEn: "Father of reggae music. Managed by family through Tuff Gong brand. Applicable to music, lifestyle, wellness, fashion.",
      value: "高",
      categories: ["音乐", "生活方式", "健康", "时尚"],
      note: "需通过 Tuff Gong 官方渠道申请授权",
      icon: "🎵",
    },
    {
      id: "audrey-hepburn",
      name: "奥黛丽·赫本",
      nameEn: "Audrey Hepburn",
      category: "时尚传奇",
      categoryEn: "Fashion Icon",
      status: "private",
      statusLabel: "家族直管",
      partner: "Sean Hepburn Ferrer (儿子)",
      partnerUrl: "",
      description: "永恒的时尚偶像，由儿子 Sean Hepburn Ferrer 管理其肖像权及相关 IP。适用于时尚、美妆、奢侈品、慈善等品类。",
      descriptionEn: "Timeless fashion icon. IP managed by son Sean Hepburn Ferrer. Applicable to fashion, beauty, luxury, charity.",
      value: "高",
      categories: ["时尚", "美妆", "奢侈品", "慈善"],
      note: "需直接联系家族代理人申请授权",
      icon: "👑",
    },
  ],

  // 公版 IP（版权已过期，可免费商用）
  publicDomain: [
    {
      id: "charlie-chaplin-early",
      name: "卓别林（早期默片形象）",
      nameEn: "Charlie Chaplin (Early Silent Films)",
      category: "喜剧传奇",
      categoryEn: "Comedy Legend",
      status: "public",
      statusLabel: "公版可用",
      description: "1977年去世，早期默片时代（1920年代前）的形象已进入公版。流浪汉形象（The Tramp）在全球具有极高辨识度，适用于娱乐、时尚、文创等品类。",
      descriptionEn: "Died 1977. Early silent film era images (pre-1920s) are in public domain. The Tramp character has global recognition.",
      value: "高",
      categories: ["娱乐", "时尚", "文创"],
      note: "⚠️ 注意：晚期作品及形象仍受版权保护，使用前需确认具体作品版权状态",
      icon: "🎩",
    },
    {
      id: "lu-xun",
      name: "鲁迅",
      nameEn: "Lu Xun",
      category: "文学巨匠",
      categoryEn: "Literary Master",
      status: "public",
      statusLabel: "公版可用",
      description: "1936年去世，作品已全面进入公版。中国最具影响力的文学 IP 之一，在中国市场具有极高文化认知度。适用于文创、教育、出版、文化品牌等品类。",
      descriptionEn: "Died 1936. Works fully in public domain. One of China's most influential literary IPs with high cultural recognition.",
      value: "高（中国市场）",
      categories: ["文创", "教育", "出版", "文化品牌"],
      note: "作品版权已过期，但其后代对肖像权仍有一定主张，商业使用建议法律咨询",
      icon: "✒️",
    },
    {
      id: "shakespeare",
      name: "莎士比亚",
      nameEn: "William Shakespeare",
      category: "戏剧大师",
      categoryEn: "Dramatic Master",
      status: "public",
      statusLabel: "公版可用",
      description: "全球公版 IP 的鼻祖，1616年去世，所有作品及形象均已进入公版。适用于教育、出版、戏剧、文化品牌等品类，全球通用。",
      descriptionEn: "The grandfather of public domain IPs. Died 1616. All works and imagery in public domain globally.",
      value: "中（文化品牌）",
      categories: ["教育", "出版", "戏剧", "文化品牌"],
      note: "全球公版，无需授权，可自由商用",
      icon: "📜",
    },
    {
      id: "beethoven",
      name: "贝多芬",
      nameEn: "Ludwig van Beethoven",
      category: "古典音乐",
      categoryEn: "Classical Music",
      status: "public",
      statusLabel: "公版可用",
      description: "1827年去世，所有音乐作品及形象均已进入公版。古典音乐领域最具辨识度的 IP，适用于音乐、教育、文化品牌、高端消费品等品类。",
      descriptionEn: "Died 1827. All musical works and imagery in public domain. Most recognizable IP in classical music.",
      value: "中（高端品牌）",
      categories: ["音乐", "教育", "文化品牌", "高端消费品"],
      note: "全球公版，无需授权，可自由商用",
      icon: "🎼",
    },
    {
      id: "van-gogh",
      name: "梵高",
      nameEn: "Vincent van Gogh",
      category: "艺术大师",
      categoryEn: "Art Master",
      status: "public",
      statusLabel: "公版可用",
      description: "1890年去世，所有画作及形象均已进入公版。全球最具商业价值的艺术 IP 之一，适用于时尚、家居、文创、奢侈品等品类。",
      descriptionEn: "Died 1890. All paintings and imagery in public domain. One of the most commercially valuable art IPs globally.",
      value: "高（全球通用）",
      categories: ["时尚", "家居", "文创", "奢侈品"],
      note: "全球公版，无需授权，可自由商用",
      icon: "🌻",
    },
    {
      id: "da-vinci",
      name: "达芬奇",
      nameEn: "Leonardo da Vinci",
      category: "文艺复兴大师",
      categoryEn: "Renaissance Master",
      status: "public",
      statusLabel: "公版可用",
      description: "1519年去世，所有作品均已进入公版。《蒙娜丽莎》《最后的晚餐》等作品具有全球最高辨识度，适用于奢侈品、文创、科技、艺术品牌等品类。",
      descriptionEn: "Died 1519. All works in public domain. Mona Lisa, The Last Supper have the highest global recognition.",
      value: "极高（全球通用）",
      categories: ["奢侈品", "文创", "科技", "艺术品牌"],
      note: "全球公版，无需授权，可自由商用",
      icon: "🎨",
    },
    {
      id: "marx",
      name: "卡尔·马克思",
      nameEn: "Karl Marx",
      category: "思想领袖",
      categoryEn: "Thought Leader",
      status: "public",
      statusLabel: "公版可用",
      description: "1883年去世，所有著作及形象均已进入公版。在全球特别是中国、欧洲市场具有极高认知度，适用于文化品牌、出版、教育等品类。",
      descriptionEn: "Died 1883. All works and imagery in public domain. High recognition globally, especially in China and Europe.",
      value: "中（特定市场）",
      categories: ["文化品牌", "出版", "教育"],
      note: "全球公版，但在特定地区商业使用需注意文化敏感性",
      icon: "📖",
    },
    {
      id: "nieer",
      name: "聂耳",
      nameEn: "Nie Er",
      category: "音乐家",
      categoryEn: "Musician",
      status: "public",
      statusLabel: "公版可用",
      description: "1935年去世，《义勇军进行曲》（中国国歌）作曲者，作品已进入公版。在中国市场具有极高爱国主义文化价值，适用于文创、教育、文化品牌等品类。",
      descriptionEn: "Died 1935. Composer of March of the Volunteers (Chinese national anthem). Works in public domain.",
      value: "高（中国市场）",
      categories: ["文创", "教育", "文化品牌"],
      note: "作品公版，但国歌使用有特殊规定，商业使用需谨慎",
      icon: "🎵",
    },
  ],

  // 特殊状态 IP（国家管理/法律纠纷/混乱状态）
  special: [
    {
      id: "che-guevara",
      name: "切·格瓦拉",
      nameEn: "Che Guevara",
      category: "革命领袖",
      categoryEn: "Revolutionary Leader",
      status: "special",
      statusLabel: "国家/家族共管",
      description: "肖像权由古巴政府及家属共同管理，商业使用需向古巴国家版权中心（CENDA）申请。著名的\"游击队员\"（Guerrillero Heroico）照片版权归摄影师 Alberto Korda 家族所有，但古巴未签署伯尔尼公约，国际法律状态复杂。",
      descriptionEn: "Image rights co-managed by Cuban government and family. Commercial use requires application to Cuba's CENDA. The famous Guerrillero Heroico photo copyright belongs to photographer Alberto Korda's family.",
      value: "高（全球文化符号）",
      categories: ["时尚", "文化品牌", "政治艺术"],
      note: "⚠️ 法律状态复杂，商业使用前必须进行法律尽职调查",
      icon: "⭐",
    },
    {
      id: "james-dean",
      name: "詹姆斯·迪恩",
      nameEn: "James Dean",
      category: "好莱坞传奇",
      categoryEn: "Hollywood Legend",
      status: "special",
      statusLabel: "CMG 代理",
      partner: "CMG Worldwide",
      partnerUrl: "https://www.cmgworldwide.com",
      description: "1955年车祸早逝，未立遗嘱，遗产几经转手后由 CMG Worldwide 代理授权。形象授权相对分散，但 CMG 正积极整合维权（2026年1月刚赢得联邦法院禁令）。适用于时尚、汽车、生活方式等品类。",
      descriptionEn: "Died 1955 in car accident without a will. IP now managed by CMG Worldwide. Won federal court injunction in Jan 2026 against unauthorized sellers.",
      value: "高",
      categories: ["时尚", "汽车", "生活方式"],
      note: "需通过 CMG Worldwide 申请授权，授权流程相对明确",
      icon: "🚗",
    },
    {
      id: "prince",
      name: "普林斯",
      nameEn: "Prince",
      category: "流行音乐",
      categoryEn: "Pop Music",
      status: "special",
      statusLabel: "法院指定管理",
      description: "2016年去世时未立遗嘱，遗产陷入长达6年的法律拉锯战，法院最终指定管理人后才恢复正常授权。目前 IP 授权已逐步规范化，适用于音乐、时尚、娱乐等品类。",
      descriptionEn: "Died 2016 without a will. Estate in legal battle for 6 years. Court-appointed administrator now manages IP licensing.",
      value: "高",
      categories: ["音乐", "时尚", "娱乐"],
      note: "需通过遗产管理人申请授权，建议法律咨询",
      icon: "🎸",
    },
    {
      id: "lei-feng",
      name: "雷锋",
      nameEn: "Lei Feng",
      category: "国家精神符号",
      categoryEn: "National Spirit Symbol",
      status: "special",
      statusLabel: "国家公共资产",
      description: "形象属于国家公共精神财富，商业滥用可能涉及侵犯英烈名誉权（《英雄烈士保护法》），而非简单的 IP 侵权。在中国市场具有极高正能量文化价值，适用于公益、教育、正能量品牌联名。",
      descriptionEn: "Image is national public spiritual heritage. Commercial misuse may violate the Heroes and Martyrs Protection Law in China.",
      value: "特殊（中国市场公益价值）",
      categories: ["公益", "教育", "正能量品牌"],
      note: "⚠️ 商业使用需极度谨慎，建议以公益合作形式切入",
      icon: "⭐",
    },
  ],
};

const statusConfig = {
  strategic: { label: "战略合作 IP", labelEn: "Strategic Partnership", color: "bg-[#122849] text-white", dot: "bg-blue-400" },
  private: { label: "家族直管 IP", labelEn: "Family Managed", color: "bg-amber-900 text-amber-100", dot: "bg-amber-400" },
  public: { label: "公版 IP", labelEn: "Public Domain", color: "bg-green-900 text-green-100", dot: "bg-green-400" },
  special: { label: "特殊状态 IP", labelEn: "Special Status", color: "bg-red-900 text-red-100", dot: "bg-red-400" },
};

type FilterType = "all" | "strategic" | "private" | "public" | "special";

export default function IPLicensing() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedIP, setSelectedIP] = useState<string | null>(null);

  const allIPs = [
    ...ipDatabase.strategic,
    ...ipDatabase.publicDomain,
    ...ipDatabase.special,
  ];

  const filteredIPs = activeFilter === "all"
    ? allIPs
    : allIPs.filter(ip => ip.status === activeFilter);

  const selectedIPData = selectedIP ? allIPs.find(ip => ip.id === selectedIP) : null;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Navbar />

      {/* ── HERO ── */}
      <section className="pt-32 pb-20 px-6 md:px-16 lg:px-24 border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs font-medium tracking-[4px] uppercase text-[#C9A84C]/70 mb-6">
            IP Licensing Platform · IP 授权平台
          </div>
          <h1 className="font-serif text-5xl md:text-7xl font-light text-white mb-6 leading-tight">
            全球 IP 资源库
          </h1>
          <p className="text-xl text-white/50 max-w-3xl leading-relaxed mb-4">
            Global IP Resource Database
          </p>
          <p className="text-base text-white/40 max-w-3xl leading-relaxed mb-12">
            猫眼增长引擎整合全球顶级 IP 资源，涵盖公版 IP、战略合作 IP 及特殊状态 IP，
            为品牌提供一站式 IP 授权咨询与商业化落地服务。
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { num: "20+", label: "全球 IP 资源", en: "Global IPs" },
              { num: "3", label: "授权类别", en: "License Types" },
              { num: "150+", label: "覆盖国家", en: "Countries" },
              { num: "∞", label: "商业价值", en: "Business Value" },
            ].map(s => (
              <div key={s.num}>
                <div className="font-serif text-4xl text-[#C9A84C] mb-2">{s.num}</div>
                <div className="text-xs tracking-[3px] uppercase text-white/40">{s.label}</div>
                <div className="text-xs text-white/20 mt-1">{s.en}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FILTER TABS ── */}
      <section className="py-8 px-6 md:px-16 lg:px-24 border-b border-white/10 sticky top-[70px] bg-[#0A0A0A] z-10">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-3">
          {[
            { key: "all", label: "全部 IP", count: allIPs.length },
            { key: "strategic", label: "战略合作", count: ipDatabase.strategic.length },
            { key: "private", label: "家族直管", count: ipDatabase.strategic.filter(ip => ip.status === "private").length },
            { key: "public", label: "公版可用", count: ipDatabase.publicDomain.length },
            { key: "special", label: "特殊状态", count: ipDatabase.special.length },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key as FilterType)}
              className={`px-4 py-2 text-xs tracking-[2px] uppercase border transition-all ${
                activeFilter === f.key
                  ? "border-[#C9A84C] text-[#C9A84C] bg-[#C9A84C]/10"
                  : "border-white/20 text-white/50 hover:border-white/40 hover:text-white/70"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      </section>

      {/* ── IP GRID ── */}
      <section className="py-16 px-6 md:px-16 lg:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIPs.map(ip => {
              const cfg = statusConfig[ip.status as keyof typeof statusConfig];
              return (
                <div
                  key={ip.id}
                  className="border border-white/10 p-6 cursor-pointer hover:border-[#C9A84C]/50 transition-all group bg-white/[0.02]"
                  onClick={() => setSelectedIP(selectedIP === ip.id ? null : ip.id)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{ip.icon}</div>
                    <span className={`text-[10px] font-medium tracking-[2px] uppercase px-2 py-1 ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="font-serif text-xl text-white mb-1 group-hover:text-[#C9A84C] transition-colors">
                    {ip.name}
                  </h3>
                  <div className="text-xs text-white/40 tracking-[1px] mb-3">{ip.nameEn}</div>

                  {/* Category */}
                  <div className="text-xs tracking-[2px] uppercase text-[#C9A84C]/70 mb-4">
                    {ip.category} · {ip.categoryEn}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-white/50 leading-relaxed mb-4 line-clamp-3">
                    {ip.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {ip.categories.map(cat => (
                      <span key={cat} className="text-[10px] tracking-[1px] px-2 py-1 border border-white/10 text-white/30">
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Value */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div>
                      <div className="text-[10px] tracking-[2px] uppercase text-white/30 mb-1">商业价值</div>
                      <div className="text-xs text-[#C9A84C]">{ip.value}</div>
                    </div>
                    <div className="text-[10px] text-white/30 tracking-[1px]">
                      {selectedIP === ip.id ? "收起 ▲" : "详情 ▼"}
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {selectedIP === ip.id && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
                      {'partner' in ip && ip.partner && (
                        <div>
                          <div className="text-[10px] tracking-[2px] uppercase text-white/30 mb-1">管理方 / Manager</div>
                          <div className="text-xs text-white/60">{ip.partner}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-[10px] tracking-[2px] uppercase text-white/30 mb-1">授权说明 / License Note</div>
                        <div className="text-xs text-amber-400/80 leading-relaxed">{ip.note}</div>
                      </div>
                      <div>
                        <div className="text-[10px] tracking-[2px] uppercase text-white/30 mb-1">英文说明 / English</div>
                        <div className="text-xs text-white/40 leading-relaxed">{ip.descriptionEn}</div>
                      </div>
                      <Button
                        className="w-full mt-2 bg-transparent border border-[#C9A84C]/50 text-[#C9A84C] hover:bg-[#C9A84C]/10 text-xs tracking-[2px] uppercase rounded-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          document.getElementById('ip-contact')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        咨询此 IP 授权 · Inquire
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── IP 分类说明 ── */}
      <section className="py-20 px-6 md:px-16 lg:px-24 bg-white/[0.02] border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-xs tracking-[4px] uppercase text-[#C9A84C]/70 mb-4">IP Classification · IP 分类说明</div>
          <h2 className="font-serif text-4xl text-white mb-12">三大授权类别</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🤝",
                title: "战略合作 IP",
                titleEn: "Strategic Partnership IP",
                desc: "由 ABG 集团等国际顶级 IP 管理公司持有，版权清晰、授权流程规范。猫眼作为中国区合作伙伴，可协助品牌完成授权申请、本土化落地及商业化运营。",
                descEn: "Held by top international IP management companies like ABG. Clear copyright, standardized licensing process.",
                examples: ["玛丽莲·梦露", "猫王", "穆罕默德·阿里"],
                color: "border-blue-500/30",
              },
              {
                icon: "🌐",
                title: "公版 IP",
                titleEn: "Public Domain IP",
                desc: "版权保护期已过（作者去世后50-70年），任何人均可免费商用，无需授权费用。是品牌联名的高性价比选择，但需注意具体作品的版权状态。",
                descEn: "Copyright protection expired (50-70 years after death). Free commercial use, no licensing fees required.",
                examples: ["卓别林", "鲁迅", "梵高", "达芬奇"],
                color: "border-green-500/30",
              },
              {
                icon: "⚠️",
                title: "特殊状态 IP",
                titleEn: "Special Status IP",
                desc: "包括国家/政府管理的 IP（切格瓦拉）、法律纠纷中的 IP（普林斯）、以及具有特殊文化敏感性的 IP（雷锋）。商业使用需极度谨慎，必须进行法律尽职调查。",
                descEn: "Includes government-managed IPs, IPs in legal disputes, and culturally sensitive IPs. Requires thorough legal due diligence.",
                examples: ["切·格瓦拉", "詹姆斯·迪恩", "雷锋"],
                color: "border-red-500/30",
              },
            ].map(cat => (
              <div key={cat.title} className={`border ${cat.color} p-8`}>
                <div className="text-4xl mb-4">{cat.icon}</div>
                <h3 className="font-serif text-2xl text-white mb-2">{cat.title}</h3>
                <div className="text-xs tracking-[2px] uppercase text-white/30 mb-4">{cat.titleEn}</div>
                <p className="text-sm text-white/50 leading-relaxed mb-6">{cat.desc}</p>
                <div className="text-[10px] tracking-[2px] uppercase text-white/30 mb-2">代表 IP</div>
                <div className="flex flex-wrap gap-2">
                  {cat.examples.map(ex => (
                    <span key={ex} className="text-xs px-2 py-1 border border-white/10 text-white/40">{ex}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="ip-contact" className="py-20 px-6 md:px-16 lg:px-24 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-xs tracking-[4px] uppercase text-[#C9A84C]/70 mb-6">IP Licensing Inquiry · IP 授权咨询</div>
          <h2 className="font-serif text-4xl text-white mb-6">开启 IP 授权合作</h2>
          <p className="text-white/40 text-base leading-relaxed mb-10">
            无论您希望获取公版 IP 的商业化建议，还是需要协助与 ABG 等国际机构进行战略合作谈判，
            猫眼增长引擎的 IP 授权团队将为您提供全程专业支持。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-[#C9A84C] hover:bg-[#B8963A] text-black font-medium tracking-[2px] uppercase text-sm px-8 py-4 rounded-none"
              onClick={() => window.location.href = '/pricing#consulting-form'}
            >
              立即咨询 · Consult Now
            </Button>
            <Button
              className="bg-transparent border border-white/30 text-white hover:border-[#C9A84C] hover:text-[#C9A84C] tracking-[2px] uppercase text-sm px-8 py-4 rounded-none"
              onClick={() => window.location.href = '/pricing'}
            >
              查看服务套餐 · View Packages
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
