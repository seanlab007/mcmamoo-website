/**
 * IPAndWhale Section — 首页 IP 授权 + Whale Pictures 展示板块
 * 位置：Awards 之后，Contact 之前
 */
import { useTranslation } from "react-i18next";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV";

const featuredIPs = [
  { name: "Marilyn Monroe", nameCn: "玛丽莲·梦露", image: `${CDN}/marilyn-monroe_bc773e51.jpg`, tag: "ABG" },
  { name: "Bruce Lee", nameCn: "李小龙", image: `${CDN}/bruce_lee_portrait_3c7cc2b5.jpg`, tag: "Bruce Lee Ent." },
  { name: "Muhammad Ali", nameCn: "穆罕默德·阿里", image: `${CDN}/muhammad_ali_portrait_54f6cb91.jpg`, tag: "ABG" },
  { name: "Audrey Hepburn", nameCn: "奥黛丽·赫本", image: `${CDN}/audrey-hepburn_331f00a4.jpg`, tag: "Hepburn Estate" },
  { name: "Van Gogh", nameCn: "梵高", image: `${CDN}/van-gogh_99c13193.jpg`, tag: "独家授权" },
  { name: "Che Guevara", nameCn: "切·格瓦拉", image: `${CDN}/che-guevara_9cf42a64.jpg`, tag: "国家级授权" },
];

export default function IPAndWhale() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';

  return (
    <section id="ip-licensing" className="py-24 bg-[#0A0A0A] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#C9A84C]/3 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-[#F59E0B]/3 rounded-full blur-3xl -translate-y-1/2" />
      </div>

      <div className="max-w-7xl mx-auto px-4">

        {/* ── Section 1: IP 授权 ── */}
        <div className="mb-24">
          {/* Header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span style={{ width: 8, height: 8, background: "#C9A84C", transform: "rotate(45deg)", display: "inline-block", boxShadow: "0 0 10px #C9A84C" }} />
                <span className="text-[#C9A84C]/60 text-xs font-mono tracking-[0.3em] uppercase">
                  {isEn ? "Global IP Resource Library" : "全球 IP 资源库"}
                </span>
              </div>
              <h2 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl text-white font-light">
                {isEn ? "IP Licensing" : "IP 授权"}
              </h2>
              <p className="text-[#C9A84C] font-['Cormorant_Garamond'] text-xl italic mt-1">
                {isEn ? "Global Icons · Premium Brand Partnerships" : "全球传奇 · 高端品牌授权"}
              </p>
            </div>
            <a
              href="/ip-licensing"
              className="hidden md:flex items-center gap-2 text-[#C9A84C]/60 hover:text-[#C9A84C] font-mono text-xs tracking-wider transition-colors duration-200"
            >
              {isEn ? "View All IPs" : "查看全部 IP"}
              <span>→</span>
            </a>
          </div>

          <p className="text-white/40 text-sm leading-relaxed max-w-2xl mb-10">
            {isEn
              ? "Mc&Mamoo curates the world's most iconic IP resources — from Hollywood legends to global cultural icons — offering brands exclusive licensing partnerships through our strategic alliance with Authentic Brands Group (ABG) and global IP management agencies."
              : "猫眼增长引擎精选全球最具影响力的 IP 资源——从好莱坞传奇到全球文化符号——通过与 ABG 集团及全球 IP 管理机构的战略联盟，为品牌提供独家授权合作。"}
          </p>

          {/* IP Grid */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {featuredIPs.map((ip) => (
              <a
                key={ip.name}
                href="/ip-licensing"
                className="group relative overflow-hidden border border-white/10 hover:border-[#C9A84C]/40 transition-all duration-300"
                style={{ aspectRatio: "3/4" }}
              >
                <img
                  src={ip.image}
                  alt={ip.name}
                  className="w-full h-full object-cover object-top grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ip.name)}&background=1a1a1a&color=C9A84C&size=300&bold=true`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <div className="text-white text-[10px] font-['Cormorant_Garamond'] leading-tight">{ip.name}</div>
                  <div className="text-white/40 text-[8px] font-mono">{ip.nameCn}</div>
                  <div className="text-[#C9A84C] text-[7px] font-mono tracking-wider mt-0.5">{ip.tag}</div>
                </div>
              </a>
            ))}
          </div>

          {/* Stats row */}
          <div className="flex gap-8 mt-8 pt-8 border-t border-white/5">
            {[
              { num: "15+", labelEn: "Global IPs", labelCn: "全球 IP 资源" },
              { num: "3", labelEn: "License Types", labelCn: "授权类别" },
              { num: "ABG", labelEn: "Strategic Partner", labelCn: "战略合作伙伴" },
              { num: "∞", labelEn: "Brand Potential", labelCn: "品牌溢价空间" },
            ].map(s => (
              <div key={s.num}>
                <div className="text-[#C9A84C] font-['Cormorant_Garamond'] text-2xl font-light">{s.num}</div>
                <div className="text-white/25 text-[9px] tracking-widest uppercase mt-0.5">{isEn ? s.labelEn : s.labelCn}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#contact"
              onClick={(e) => { e.preventDefault(); document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="inline-flex items-center gap-3 px-7 py-3 bg-[#C9A84C] text-[#0A0A0A] font-mono text-xs tracking-wider font-bold hover:bg-[#D4B866] transition-all duration-300"
            >
              <span style={{ width: 5, height: 5, background: "#0A0A0A", transform: "rotate(45deg)", display: "inline-block" }} />
              {isEn ? "Book IP Licensing Consultation" : "预约 IP 授权合作洽谈"}
            </a>
            <a
              href="/ip-licensing"
              className="inline-flex items-center gap-3 px-6 py-3 border border-[#C9A84C]/40 text-[#C9A84C]/80 font-mono text-xs tracking-wider hover:border-[#C9A84C] hover:text-[#C9A84C] hover:bg-[#C9A84C]/5 transition-all duration-300"
            >
              {isEn ? "Browse IP Library →" : "浏览 IP 资源库 →"}
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-24" />

        {/* ── Section 2: Whale Pictures ── */}
        <div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span style={{ width: 8, height: 8, background: "#F59E0B", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 10px #F59E0B" }} />
                <span className="text-[#F59E0B]/60 text-xs font-mono tracking-[0.3em] uppercase">
                  {isEn ? "Subsidiary" : "旗下子公司"}
                </span>
              </div>
              <h2 className="font-['Cormorant_Garamond'] text-4xl md:text-5xl text-white font-light mb-2">
                Whale Pictures
              </h2>
              <p className="text-[#F59E0B] font-['Cormorant_Garamond'] text-xl italic mb-6">
                {isEn ? "Premium Visual Production" : "高端影像制作"}
              </p>
              <p className="text-white/40 text-sm leading-relaxed mb-8">
                {isEn
                  ? "Whale Pictures is Mc&Mamoo's premium visual production subsidiary, specializing in TVC advertising, international model management (500+ foreign models), and AI-powered short drama production — delivering world-class visual content for global brands."
                  : "鲸图影像是猫眼增长引擎旗下高端影像制作子公司，专注于 TVC 广告拍摄、外籍模特经纪（500+ 外模资源）及 AI 短剧制作，为全球品牌提供世界级视觉内容。"}
              </p>

              {/* Services */}
              <div className="space-y-3 mb-8">
                {[
                  { icon: "🎬", titleEn: "TVC Production", titleCn: "TVC 广告拍摄", descEn: "International-standard commercial production", descCn: "国际标准广告片制作" },
                  { icon: "👤", titleEn: "Model Agency", titleCn: "外籍模特经纪", descEn: "500+ international models database", descCn: "500+ 外籍模特资源库" },
                  { icon: "🤖", titleEn: "AI Drama", titleCn: "AI 短剧制作", descEn: "Next-gen AI-powered content creation", descCn: "下一代 AI 内容创作" },
                ].map(s => (
                  <div key={s.titleEn} className="flex items-center gap-3 py-2 border-b border-white/5">
                    <span className="text-lg">{s.icon}</span>
                    <div>
                      <div className="text-white/70 text-sm font-mono">{isEn ? s.titleEn : s.titleCn}</div>
                      <div className="text-white/30 text-xs">{isEn ? s.descEn : s.descCn}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <a
                  href="/whale-pictures"
                  className="inline-flex items-center gap-2 px-6 py-2.5 border border-[#F59E0B]/40 text-[#F59E0B]/80 font-mono text-xs tracking-wider hover:border-[#F59E0B] hover:text-[#F59E0B] hover:bg-[#F59E0B]/5 transition-all duration-300"
                >
                  {isEn ? "View Services & Pricing →" : "查看服务与报价 →"}
                </a>
                <a
                  href="https://whalepictures.vip"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-white/30 hover:text-white/60 font-mono text-xs tracking-wider transition-colors duration-200"
                >
                  whalepictures.vip ↗
                </a>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <div className="bg-[#111] border border-[#F59E0B]/20 p-6 text-center">
                    <div className="text-[#F59E0B] font-['Cormorant_Garamond'] text-4xl font-light">500+</div>
                    <div className="text-white/30 text-[10px] font-mono tracking-wider mt-1">{isEn ? "INTL MODELS" : "外籍模特"}</div>
                  </div>
                  <div className="bg-[#111] border border-white/10 p-6 text-center">
                    <div className="text-white font-['Cormorant_Garamond'] text-4xl font-light">TVC</div>
                    <div className="text-white/30 text-[10px] font-mono tracking-wider mt-1">{isEn ? "PRODUCTION" : "广告制作"}</div>
                  </div>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="bg-[#111] border border-white/10 p-6 text-center">
                    <div className="text-white font-['Cormorant_Garamond'] text-4xl font-light">AI</div>
                    <div className="text-white/30 text-[10px] font-mono tracking-wider mt-1">{isEn ? "SHORT DRAMA" : "AI 短剧"}</div>
                  </div>
                  <div className="bg-[#111] border border-[#F59E0B]/20 p-6 text-center">
                    <div className="text-[#F59E0B] font-['Cormorant_Garamond'] text-4xl font-light">30+</div>
                    <div className="text-white/30 text-[10px] font-mono tracking-wider mt-1">{isEn ? "COUNTRIES" : "覆盖国家"}</div>
                  </div>
                </div>
              </div>
              {/* Glow effect */}
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#F59E0B]/10 rounded-full blur-2xl pointer-events-none" />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
