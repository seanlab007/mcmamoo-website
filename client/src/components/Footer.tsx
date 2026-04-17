/*
<<<<<<< HEAD
<<<<<<< HEAD
 * Footer — 猫眼咨询官网页脚
=======
 * Footer — 猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)官网页脚
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
 * Footer — 猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)官网页脚
>>>>>>> origin/deploy/trigger-build-1774631965
 * SEO优化：添加更多关键词链接和结构化内容
 */
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-white/5 py-12">
      <div className="container">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Logo & tagline */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <svg width="28" height="18" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="18" cy="12" rx="17" ry="11" stroke="#C9A84C" strokeWidth="1" fill="none"/>
                <circle cx="18" cy="12" r="7" stroke="#C9A84C" strokeWidth="0.8" fill="none"/>
                <path d="M18 5 L20.5 12 L18 19 L15.5 12 Z" stroke="#C9A84C" strokeWidth="1" fill="#C9A84C" fillOpacity="0.15"/>
              </svg>
              <span className="text-[#C9A84C] font-['Cormorant_Garamond'] font-semibold text-base tracking-wide">
                Mc&amp;Mamoo Brand Management Inc.
              </span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-md mb-4">
<<<<<<< HEAD
<<<<<<< HEAD
              猫眼咨询（Mc&Mamoo）是中国新消费领域领先的品牌战略咨询公司，独创错位竞争理论，服务江中猴姑、小仙炖、小罐茶、蟹太太等10亿级大单品品牌。
            </p>
            <p className="text-white/30 text-xs tracking-wide">
              猫眼企业发展（上海）有限公司 · 全球新消费第一品牌管理公司
=======
=======
>>>>>>> origin/deploy/trigger-build-1774631965
              猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)（Mc&Mamoo）是中国新消费领域领先的品牌战略咨询公司，独创错位竞争理论，服务江中猴姑、小仙炖、小罐茶、蟹太太等10亿级大单品品牌。
            </p>
            <p className="text-white/30 text-xs tracking-wide">
              猫眼增长引擎 (Mc&Mamoo Growth Engine)企业发展（上海）有限公司 · 全球新消费第一品牌管理公司
<<<<<<< HEAD
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
>>>>>>> origin/deploy/trigger-build-1774631965
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white/60 text-xs font-medium mb-4 tracking-wider uppercase">快速导航</h4>
            <div className="flex flex-col gap-2">
              {[
<<<<<<< HEAD
<<<<<<< HEAD
                { label: "关于猫眼", href: "#about" },
=======
                { label: "关于猫眼增长引擎 (Mc&Mamoo Growth Engine)", href: "#about" },
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
                { label: "关于猫眼增长引擎 (Mc&Mamoo Growth Engine)", href: "#about" },
>>>>>>> origin/deploy/trigger-build-1774631965
                { label: "核心方法论", href: "#methodology" },
                { label: "服务体系", href: "#services" },
                { label: "标杆案例", href: "#cases" },
                { label: "常见问题", href: "#faq" },
                { label: "联系我们", href: "#contact" },
              ].map((item) => (
                <button
                  key={item.href}
                  onClick={() => document.querySelector(item.href)?.scrollIntoView({ behavior: "smooth" })}
                  className="text-white/40 text-sm hover:text-[#C9A84C] transition-colors text-left"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Case Links - SEO Keywords */}
          <div>
            <h4 className="text-white/60 text-xs font-medium mb-4 tracking-wider uppercase">标杆案例</h4>
            <div className="flex flex-col gap-2">
              <Link href="/cases/xietaitai">
                <a className="text-white/40 text-sm hover:text-[#C9A84C] transition-colors">蟹太太大闸蟹</a>
              </Link>
              <Link href="/cases/xiaoxiandun">
                <a className="text-white/40 text-sm hover:text-[#C9A84C] transition-colors">小仙炖鲜炖燕窝</a>
              </Link>
              <Link href="/cases/jiangzhong">
                <a className="text-white/40 text-sm hover:text-[#C9A84C] transition-colors">江中猴姑饼干</a>
              </Link>
              <Link href="/cases/xiaoguan">
                <a className="text-white/40 text-sm hover:text-[#C9A84C] transition-colors">小罐茶</a>
              </Link>
              <Link href="/cases/pangge">
                <a className="text-white/40 text-sm hover:text-[#C9A84C] transition-colors">湖南胖哥食品</a>
              </Link>
              <Link href="/maothink">
                <a className="text-white/40 text-sm hover:text-[#C9A84C] transition-colors">毛智库</a>
              </Link>
            </div>
          </div>
        </div>

        {/* Keywords Row - SEO */}
        <div className="py-6 border-t border-white/5 border-b">
          <p className="text-white/20 text-xs leading-relaxed">
            <span className="text-white/30">服务领域：</span>
            品牌战略咨询 · 错位竞争理论 · 新消费品牌打造 · 爆品营销策划 · 天猫运营增长 · 品类创新 · 品牌定位策划 · 视觉锤设计 · KOL营销矩阵 · 整合营销带货
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6">
          <p className="text-white/20 text-xs">
<<<<<<< HEAD
<<<<<<< HEAD
            ©2024 Mc&amp;Mamoo Brand Management Inc. 猫眼企业发展（上海）有限公司 版权所有
=======
            ©2024 Mc&amp;Mamoo Brand Management Inc. 猫眼增长引擎 (Mc&Mamoo Growth Engine)企业发展（上海）有限公司 版权所有
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
            ©2024 Mc&amp;Mamoo Brand Management Inc. 猫眼增长引擎 (Mc&Mamoo Growth Engine)企业发展（上海）有限公司 版权所有
>>>>>>> origin/deploy/trigger-build-1774631965
          </p>
          <div className="flex items-center gap-4">
            <a href="/sitemap.xml" className="text-white/20 text-xs hover:text-[#C9A84C]/60 transition-colors">
              网站地图
            </a>
            <span className="text-white/10">|</span>
            <p className="text-white/20 text-xs font-['DM_Mono']">
              www.mcmamoo.com
            </p>
          </div>
        </div>

        {/* Powered by Dark Matter Bank */}
        <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-center gap-2">
          <span className="text-white/15 text-xs font-['DM_Mono'] tracking-widest">— POWERED BY —</span>
          <a
            href="https://darkmatterbank.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 text-white/25 hover:text-[#C9A84C]/70 transition-all duration-300"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50 group-hover:opacity-100 transition-opacity">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1"/>
              <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.3"/>
              <path d="M2 12 Q6 6 12 12 Q18 18 22 12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
              <path d="M2 12 Q6 18 12 12 Q18 6 22 12" stroke="currentColor" strokeWidth="0.8" fill="none"/>
            </svg>
            <span className="text-xs font-['DM_Mono'] tracking-[0.15em] font-medium">
              DARK MATTER BANK
            </span>
          </a>
          <span className="text-white/10 text-xs font-['DM_Mono'] tracking-widest hidden sm:inline">— 同一家族旗下的全球金融生态</span>
        </div>
      </div>
    </footer>
  );
}
