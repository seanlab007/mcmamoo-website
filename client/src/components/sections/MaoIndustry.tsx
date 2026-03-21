/**
 * MaoIndustry Section — 猫眼工业 Mao Industry
 * 月球氦3能源 · 托卡马克装置 · 军工制造 · 代言万年钟
 */

const INDUSTRY_BG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/mao-industry-bg-5fKD5GfBWeFuC7bBKnwxHN.webp";
const CLOCK_IMG =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/mao-millennium-clock-e7b5V82FhK3kso5tNhy3YX.webp";

const domains = [
  {
    icon: "⚛",
    en: "Helium-3 Energy",
    zh: "月球氦³能源提炼",
    desc: "开采月球表层氦-3同位素，突破地球能源枷锁。单吨氦-3可替代1000万吨煤炭，为托卡马克聚变堆提供清洁燃料，驱动人类文明跨越星际。",
    tag: "He-3 · 核聚变燃料",
  },
  {
    icon: "🌀",
    en: "Tokamak R&D",
    zh: "托卡马克装置研发",
    desc: "自主研发第五代磁约束核聚变装置，等离子体温度突破1.5亿摄氏度，实现Q值>1的净能量输出，构建人类终极能源基础设施。",
    tag: "磁约束 · 等离子体 · Q>1",
  },
  {
    icon: "🛡",
    en: "Defense Manufacturing",
    zh: "军工领域制造",
    desc: "以先进材料科学与精密制造为核心，深度参与新一代战略装备研发。超导磁体、高温合金、定向能武器核心部件，服务国家战略安全。",
    tag: "超导 · 定向能 · 战略装备",
  },
];

export default function MaoIndustry() {
  return (
    <section id="mao-industry" className="relative w-full overflow-hidden bg-[#020408]">
      {/* ── 星际背景区 ── */}
      <div className="relative w-full" style={{ minHeight: "560px" }}>
        <img
          src={INDUSTRY_BG}
          alt="猫眼工业 — 月球氦3托卡马克装置"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={{ opacity: 0.75 }}
        />
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020408]/60 via-transparent to-[#020408]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020408]/80 via-transparent to-[#020408]/40" />

        {/* 标题区 */}
        <div className="relative z-10 flex flex-col items-start justify-center h-full px-8 md:px-16 lg:px-24 pt-20 pb-32">
          {/* 标签 */}
          <div className="flex items-center gap-3 mb-5">
            <span className="w-8 h-px bg-[#C9A84C]" />
            <span
              className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase font-mono"
              style={{ letterSpacing: "0.3em" }}
            >
              MAO INDUSTRY · 猫眼工业
            </span>
          </div>

          <h2
            className="text-white font-bold leading-tight mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
          >
            掌控星际能源
            <br />
            <span className="text-[#C9A84C]">定义人类未来</span>
          </h2>
          <p className="text-white/60 text-base md:text-lg max-w-xl leading-relaxed">
            从月球氦-3到托卡马克聚变堆，从军工精密制造到万年尺度的文明思考——
            <br />
            猫眼工业以超长期主义重构工业文明边界。
          </p>

          {/* 合作咨询按钮 */}
          <div className="flex flex-wrap items-center gap-4 mt-8">
            <a
              href="#contact"
              onClick={(e) => { e.preventDefault(); document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9A84C] text-black text-sm font-bold tracking-widest uppercase hover:bg-[#E8D5A0] transition-colors duration-300"
            >
              <span>合作咨询</span>
              <span style={{ fontSize: "0.8rem" }}>→</span>
            </a>
            <a
              href="/millennium-clock"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#4FC3F7]/40 text-[#4FC3F7] text-sm font-mono tracking-widest uppercase hover:bg-[#4FC3F7]/10 hover:border-[#4FC3F7]/80 transition-all duration-300"
            >
              <span>万年钟详情</span>
              <span style={{ fontSize: "0.8rem" }}>→</span>
            </a>
          </div>

          {/* 数据徽章 */}
          <div className="flex flex-wrap gap-4 mt-6">
            {[
              { val: "1.5亿°C", label: "等离子体温度目标" },
              { val: "He-3", label: "月球清洁核燃料" },
              { val: "10,000yr", label: "万年钟计时跨度" },
            ].map((b) => (
              <div
                key={b.val}
                className="border border-[#C9A84C]/30 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-sm"
              >
                <div className="text-[#C9A84C] font-bold text-lg leading-none">
                  {b.val}
                </div>
                <div className="text-white/40 text-xs mt-1">{b.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 三大业务领域 ── */}
      <div className="relative z-10 px-8 md:px-16 lg:px-24 pb-20 -mt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#C9A84C]/10">
          {domains.map((d) => (
            <div
              key={d.en}
              className="bg-[#020408] p-8 group"
              style={{
                borderTop: "1px solid rgba(201,168,76,0.15)",
              }}
            >
              {/* 图标 */}
              <div className="text-3xl mb-4">{d.icon}</div>
              {/* 英文标签 */}
              <div className="text-[#C9A84C]/60 text-xs tracking-widest uppercase font-mono mb-2">
                {d.en}
              </div>
              {/* 中文标题 */}
              <h3 className="text-white text-xl font-bold mb-3">{d.zh}</h3>
              {/* 描述 */}
              <p className="text-white/50 text-sm leading-relaxed mb-4">
                {d.desc}
              </p>
              {/* 技术标签 */}
              <span className="inline-block border border-[#C9A84C]/30 text-[#C9A84C]/70 text-xs px-3 py-1 font-mono">
                {d.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 战略合作伙伴 Logo 墙 ── */}
      <div className="relative px-8 md:px-16 lg:px-24 py-16 border-t border-white/5">
        <div className="flex items-center gap-4 mb-10">
          <span className="w-8 h-px bg-[#C9A84C]/50" />
          <span className="text-white/30 text-xs tracking-[0.4em] uppercase font-mono whitespace-nowrap">
            STRATEGIC PARTNERS &amp; COLLABORATORS
          </span>
          <div className="flex-1 h-px bg-white/5" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-px bg-white/5">
          {[
            { name: "ITER", sub: "国际热核聚变组织", icon: "⚛" },
            { name: "CNSA", sub: "中国航天局", icon: "🚀" },
            { name: "CASC", sub: "航天科技集团", icon: "✦" },
            { name: "RAND", sub: "兰德智库对标", icon: "📊" },
            { name: "MIT", sub: "麻省理工学院", icon: "⬡" },
            { name: "ESA", sub: "欧洲航天局", icon: "★" },
          ].map((p) => (
            <div key={p.name} className="bg-[#020408] p-6 flex flex-col items-center justify-center gap-2 group">
              <div className="text-xl text-white/20 group-hover:text-[#C9A84C]/50 transition-colors">{p.icon}</div>
              <div className="text-white/50 text-sm font-bold font-mono tracking-widest group-hover:text-white/80 transition-colors">{p.name}</div>
              <div className="text-white/20 text-xs text-center leading-tight">{p.sub}</div>
            </div>
          ))}
        </div>
        <p className="text-white/15 text-xs font-mono text-center mt-4 tracking-wider">
          * 战略对标机构，部分合作洽谈中
        </p>
      </div>

      {/* ── 代言万年钟 ── */}
      <div className="relative px-8 md:px-16 lg:px-24 pb-24">
        {/* 分割线 */}
        <div className="flex items-center gap-4 mb-12">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent" />
          <span className="text-[#C9A84C]/50 text-xs tracking-[0.4em] uppercase font-mono whitespace-nowrap">
            MILLENNIUM CLOCK · 代言万年钟
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/30 to-transparent" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* 左：图片 */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-sm"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(0,120,255,0.15) 0%, transparent 70%)",
                filter: "blur(30px)",
              }}
            />
            <img
              src={CLOCK_IMG}
              alt="代言万年钟 — 每1万年走一下"
              className="relative z-10 w-full rounded-sm object-contain"
              style={{ maxHeight: "420px", objectFit: "cover" }}
            />
            {/* 扫描线装饰 */}
            <div
              className="absolute inset-0 z-20 pointer-events-none rounded-sm"
              style={{
                background:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,180,255,0.03) 2px, rgba(0,180,255,0.03) 4px)",
              }}
            />
          </div>

          {/* 右：文字 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-6 h-px bg-[#C9A84C]" />
              <span className="text-[#C9A84C] text-xs tracking-[0.3em] uppercase font-mono">
                ENDORSED PRODUCT
              </span>
            </div>

            <h3
              className="text-white font-bold leading-tight mb-2"
              style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)" }}
            >
              代言万年钟
            </h3>
            <div className="text-[#C9A84C] text-sm font-mono tracking-widest mb-6">
              MILLENNIUM TIMEPIECE · 每 10,000 年 · 走一下
            </div>

            <p className="text-white/60 text-base leading-relaxed mb-6">
              由思想家、发明家{" "}
              <span className="text-white font-semibold">代言先生（Sean DAI）</span>{" "}
              构思发明。万年钟的指针每隔一万年才走动一格——
              它不是用来看时间的，而是用来提醒人类：
              <span className="text-[#C9A84C]">
                {" "}
                在宇宙尺度的时间轴上，我们的决策应当以万年为单位思考。
              </span>
            </p>

            <p className="text-white/40 text-sm leading-relaxed mb-8">
              当你站在万年钟面前，你会意识到：今天的政治争端、商业博弈、技术迭代，
              在一万年的刻度里不过是一瞬。真正的文明建设者，思考的是物种延续、
              星际迁徙与能源永续。
            </p>

            {/* 万年钟详情页链接 */}
            <a
              href="/millennium-clock"
              className="inline-flex items-center gap-2 mb-6 text-[#4FC3F7]/70 hover:text-[#4FC3F7] text-sm font-mono tracking-wider transition-colors duration-300 group"
            >
              <span className="w-4 h-px bg-[#4FC3F7]/50 group-hover:w-6 transition-all duration-300" />
              查看万年钟完整故事 →
            </a>

            {/* 参数卡片 */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "计时精度", val: "±1秒 / 万年" },
                { label: "走针周期", val: "10,000 年" },
                { label: "设计理念", val: "超长期主义" },
                { label: "发明者", val: "代言先生 Sean DAI" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border border-white/5 bg-white/[0.02] px-4 py-3"
                >
                  <div className="text-white/30 text-xs font-mono mb-1">
                    {item.label}
                  </div>
                  <div className="text-white text-sm font-semibold">
                    {item.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
