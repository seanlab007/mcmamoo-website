/*
 * Footer — Mc&Mamoo Growth Engine
 * i18n: full bilingual support
 */
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { i18n } = useTranslation();
  const isEn = i18n.language !== 'zh';

  const links = isEn
    ? [
        { label: "About Us", href: "#about" },
        { label: "Methodology", href: "#methodology" },
        { label: "Services", href: "#services" },
        { label: "Cases", href: "#cases" },
        { label: "Contact", href: "#contact" },
      ]
    : [
        { label: "关于我们", href: "#about" },
        { label: "核心方法论", href: "#methodology" },
        { label: "服务体系", href: "#services" },
        { label: "标杆案例", href: "#cases" },
        { label: "联系我们", href: "#contact" },
      ];

  return (
    <footer className="bg-[#0A0A0A] border-t border-white/5 py-12">
      <div className="container">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Logo & tagline */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <svg width="28" height="18" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="18" cy="12" rx="17" ry="11" stroke="#C9A84C" strokeWidth="1" fill="none"/>
                <circle cx="18" cy="12" r="7" stroke="#C9A84C" strokeWidth="0.8" fill="none"/>
                <path d="M18 5 L20.5 12 L18 19 L15.5 12 Z" stroke="#C9A84C" strokeWidth="1" fill="#C9A84C" fillOpacity="0.15"/>
              </svg>
              <span className="text-[#C9A84C] font-['Cormorant_Garamond'] font-semibold text-base tracking-wide">
                {isEn ? "Mc&Mamoo Growth Engine" : "Mc&Mamoo Brand Management Inc."}
              </span>
            </div>
            <p className="text-white/30 text-xs tracking-wide">
              {isEn
                ? "Maoyan Enterprise Development (Shanghai) Co., Ltd. · Global #1 New Consumer Brand Management Company"
                : "猫眼企业发展（上海）有限公司 · 全球新消费第一品牌管理公司"}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-6">
            {links.map((item) => (
              <button
                key={item.href}
                onClick={() => document.querySelector(item.href)?.scrollIntoView({ behavior: "smooth" })}
                className="text-white/30 text-xs hover:text-[#C9A84C] transition-colors tracking-wide"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-white/5 my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-xs">
            {isEn
              ? "©2024 Mc&Mamoo Growth Engine. Maoyan Enterprise Development (Shanghai) Co., Ltd. All Rights Reserved."
              : "©2024 Mc&Mamoo Brand Management Inc. 猫眼企业发展（上海）有限公司 版权所有"}
          </p>
          <p className="text-white/20 text-xs font-['DM_Mono']">
            www.mcmamoo.com
          </p>
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
          <span className="text-white/10 text-xs font-['DM_Mono'] tracking-widest hidden sm:inline">
            {isEn ? "— Global Financial Ecosystem Under the Same Family" : "— 同一家族旗下的全球金融生态"}
          </span>
        </div>
      </div>
    </footer>
  );
}
