import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Shield, ArrowRight, Gift, Star, Crown } from 'lucide-react';
import { PLANS, BRAND_INFO, CAPABILITY_COMPARISON } from '../../../../shared/plans';
import { useLanguage } from '../../contexts/LanguageContext';

const Pick = ({ cn, en }: { cn: string; en: string }) => {
  const { language } = useLanguage();
  return <>{language === 'zh' ? cn : en}</>;
};

export const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);

  const formatPrice = (plan: any) => {
    if (plan.monthlyPrice === 0) return { price: '免费', period: '' };
    if (plan.id === 'mao_thinktank') {
      // 毛智库特殊显示
      return {
        price: isYearly ? '¥99,999,999+' : '¥9,999,999+',
        period: isYearly ? '/年起' : '/月起',
        note: plan.priceNote || '上不封顶',
      };
    }
    const displayPrice = isYearly ? Math.round(plan.yearlyPrice * 0.83) : plan.monthlyPrice;
    return { price: `¥${displayPrice.toLocaleString()}`, period: isYearly ? '/年' : '/月' };
  };

  const fmtTokens = (n: number) => {
    if (!n) return '∞';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
    if (n >= 1000) return `${Math.round(n / 1000)}K`;
    return n.toString();
  };

  const tierColors: Record<string, string> = {
    free: 'from-green-500/10 to-green-600/5 border-green-500/30',
    starter: 'from-gray-800/50 to-gray-900/30 border-gray-700/50',
    pro: 'from-amber-500/20 to-amber-600/5 border-2 border-amber-500/50',
    strategic: 'from-red-500/10 to-red-600/5 border-red-500/30',
    enterprise: 'from-purple-500/10 to-purple-600/5 border-purple-500/30',
    mao_thinktank: 'bg-gradient-to-b from-yellow-600/20 via-amber-500/10 to-yellow-800/20 border-2 border-yellow-400/60 shadow-lg shadow-yellow-500/10',
  };

  const tierIcons: Record<string, React.ReactNode> = {
    free: <Zap className="w-6 h-6" />,
    starter: <Zap className="w-6 h-6" />,
    pro: <Star className="w-6 h-6" />,
    strategic: <Shield className="w-6 h-6" />,
    enterprise: <Crown className="w-6 h-6" />,
    mao_thinktank: <span className="text-2xl">👑</span>,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      {/* Hero */}
      <div className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-red-500/10 to-yellow-500/10" />
        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-block mb-3 px-4 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-full border border-amber-500/40">
              <span className="text-amber-300 font-bold text-sm tracking-wide">
                {BRAND_INFO.fullName}
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-3 bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
              AI 战略思维定价方案
            </h1>

            <p className="text-lg md:text-xl text-amber-200/80 mb-2">
              {BRAND_INFO.taglineCN} · 加价率 ≥ 1000x · 所有价格以9结尾
            </p>
            <p className="text-sm text-gray-500 mb-8">由 {BRAND_INFO.labName} 倾力打造</p>

            {/* 卖点标签 */}
            <div className="flex flex-wrap justify-center gap-3 mb-8 max-w-3xl mx-auto">
              {BRAND_INFO.heroHighlights.map((h, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-gray-800/70 px-4 py-2 rounded-lg text-sm border border-gray-700/50"
                >{h}</motion.span>
              ))}
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm ${!isYearly ? 'text-amber-400' : 'text-gray-500'}`}>月付</span>
              <button onClick={() => setIsYearly(!isYearly)} className="relative w-16 h-8 bg-gray-700 rounded-full transition-colors hover:bg-gray-600">
                <div className={`absolute top-1 w-6 h-6 bg-amber-400 rounded-full transition-transform ${isYearly ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm ${isYearly ? 'text-amber-400' : 'text-gray-500'}`}>年付</span>
              {isYearly && (
                <span className="text-xs bg-amber-500/15 text-amber-400 px-3 py-1 rounded-full border border-amber-500/30">省 17%</span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* 成本透明条 */}
      <div className="max-w-4xl mx-auto px-4 mb-10">
        <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/25 rounded-xl p-4 text-center">
          <p className="text-amber-300/90 text-sm font-medium">
            📊 API 成本完全透明：每百万 tokens ¥3.6（DeepSeek V3 输入输出混合均值）· 所有套餐加价率 ≥ 1000 倍
          </p>
        </div>
      </div>

      {/* Cards Grid - 6 columns for thinktank */}
      <div className="max-w-[1600px] mx-auto px-4 pb-20">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-${PLANS.length >= 6 ? 6 : 5} gap-4`}>
          {PLANS.map((plan: any, index) => {
            const { price, period, note } = formatPrice(plan);
            const isThinktank = plan.id === 'mao_thinktank';
            const bgClass = tierColors[plan.id] || tierColors.starter;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className={`relative rounded-2xl p-5 ${bgClass} ${isThinktank ? 'scale-[1.02]' : ''}`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 z-10 ${isThinktank
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-black'
                    : 'bg-amber-500 text-black'
                  } text-xs font-bold px-5 py-1.5 rounded-full shadow-lg`}>
                    {plan.badge}
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-4 mt-1">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-2 ${
                    isThinktank
                      ? 'bg-gradient-to-br from-yellow-500/30 to-amber-600/30 border border-yellow-500/40 text-yellow-300'
                      : plan.highlight
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-gray-700/50 text-gray-400'
                  }`}>
                    {tierIcons[plan.id] || <Zap className="w-5 h-5" />}
                  </div>
                  <h3 className={`text-lg font-bold ${isThinktank ? 'text-yellow-300' : ''}`}>
                    {plan.name}
                  </h3>
                  <p className="text-xs text-gray-500">{plan.nameEn}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-4">
                  <div className="flex items-baseline justify-center gap-1 flex-wrap">
                    <span className={`text-3xl font-black ${isThinktank
                      ? 'bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent'
                      : plan.id === 'free' ? 'text-green-400' : 'text-amber-400'
                    }`}>{price}</span>
                    <span className="text-gray-500 text-sm">{period}</span>
                  </div>
                  {note && (
                    <p className="text-xs text-yellow-400/80 mt-1 font-medium">{note}</p>
                  )}
                  {plan.maxAnnualPrice && (
                    <p className="text-xs text-gray-500 mt-1">
                      最高可达 ¥{(plan.maxAnnualPrice / 10000).toLocaleString()} 万 /年（≈${Math.round(plan.maxAnnualPrice / 7).toLocaleString()}M USD）
                    </p>
                  )}
                </div>

                {/* Tokens + Cost */}
                <div className={`rounded-lg p-3 mb-3 text-center ${isThinktank
                  ? 'bg-yellow-500/10 border border-yellow-500/20'
                  : 'bg-gray-900/50'
                }`}>
                  <div className="text-xl font-bold">{fmtTokens(plan.tokenPerMonth)}</div>
                  <div className="text-xs text-gray-500 mt-0.5">tokens / 月</div>
                  <div className="text-xs mt-1.5">
                    <span className="text-gray-600">API成本 ¥{plan.apiCost?.toFixed(2) || '—'}</span>
                    {plan.markup > 0 && (
                      <span className="ml-2 text-amber-400 font-medium">{plan.markup?.toLocaleString()}x 加价</span>
                    )}
                  </div>
                </div>

                {/* Model Description */}
                {!isThinktank && (
                  <div className="text-xs text-center text-gray-400 mb-3 px-1 leading-relaxed">
                    {plan.modelDescription}
                  </div>
                )}

                {/* Thinktank special features preview */}
                {isThinktank && plan.targetCustomers && (
                  <div className="mb-3 space-y-1">
                    <div className="text-xs text-yellow-300/80 font-medium text-center mb-1">目标客户</div>
                    {(plan.targetCustomers as string[]).map((c, i) => (
                      <div key={i} className="text-xs text-gray-400 text-center">• {c}</div>
                    ))}
                  </div>
                )}

                {/* Sales hook */}
                {plan.salesHook && !isThinktank && plan.unlockedPower?.length > 0 && (
                  <div className="bg-gray-900/30 rounded-lg p-2.5 mb-3">
                    <div className="text-[11px] text-amber-400 font-medium mb-1">{plan.salesHook}</div>
                    {plan.unlockedPower.slice(0, 3).map((p: string, i: number) => (
                      <div key={i} className="text-[11px] text-gray-400 flex items-center gap-1"><ArrowRight className="w-2.5 h-2.5 text-amber-500/60 shrink-0" />{p}</div>
                    ))}
                  </div>
                )}

                {/* CTA */}
                <button className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  isThinktank
                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black shadow-md shadow-yellow-500/20'
                    : plan.highlight
                      ? 'bg-amber-500 hover:bg-amber-400 text-black'
                      : plan.id === 'free'
                        ? 'bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}>
                  {plan.id === 'free' ? (<><Gift className="w-4 h-4" />立即体验</>) :
                   isThinktank ? (<><Crown className="w-4 h-4" />联系定制</>) :
                   (<>立即开通<ArrowRight className="w-4 h-4" /></>)}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-8 text-amber-300">📊 完整能力对比</h2>
          {CAPABILITY_COMPARISON.map((section, si) => (
            <div key={si} className="mb-8 overflow-x-auto">
              <h3 className="text-base font-semibold text-amber-400/80 mb-3 pl-1">{section.category}</h3>
              <table className="w-full border-collapse text-sm min-w-[900px]">
                <thead><tr className="border-b border-gray-800">
                  <th className="py-2.5 px-3 text-left text-gray-500 font-medium">功能</th>
                  {PLANS.map(p => (
                    <th key={p.id} className={`py-2.5 px-2 text-center font-semibold whitespace-nowrap ${
                      p.id === 'mao_thinktank' ? 'text-yellow-400' : p.highlight ? 'text-amber-400' : 'text-gray-400'
                    }`}>{(p as any).name}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {section.items.map((row, ri) => (
                    <tr key={ri} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                      <td className="py-2.5 px-3 text-gray-400">{row.feature}</td>
                      {['free','starter','pro','strategic','enterprise','mao_thinktank'].map(col => (
                        <td key={col} className={`py-2.5 px-2 text-center whitespace-nowrap ${
                          col === 'mao_thinktank' ? 'text-yellow-300/90 font-medium' : ''
                        }`}>
                          {(row as any)[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Brand Section */}
        <div className="mt-16 bg-gradient-to-br from-amber-900/15 via-red-900/10 to-amber-900/15 rounded-2xl p-8 md:p-10 border border-amber-500/15">
          <h3 className="text-2xl font-black text-center mb-2 text-amber-300">{BRAND_INFO.fullName}</h3>
          <p className="text-center text-gray-400 mb-8">{BRAND_INFO.taglineCN}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { emoji:'🧠', title:'毛泽东思想向量库', desc:'万亿级历史战略智慧，智能匹配分析决策' },
              { emoji:'⚖️', title:'五层分权架构',   desc:'决策→执行→验证→优化→迭代，闭环决策引擎' },
              { emoji:'🔄', title:'TriadLoop 博弈循环', desc:'5轮深度博弈推理，Coder→Reviewer→Validator' },
              { emoji:'👑', title:'毛智库',           desc:'全球唯一完整智库系统，上不封顶，可超10亿$/年' },
            ].map((item, i) => (
              <div key={i} className="text-center bg-gray-900/50 rounded-xl p-5 border border-gray-800/50">
                <div className="text-4xl mb-3">{item.emoji}</div>
                <h4 className="font-bold text-amber-300 mb-2">{item.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm space-y-2">
          <p className="font-medium text-amber-400/80">{BRAND_INFO.footer}</p>
          <p className="text-gray-600">所有价格以9结尾 · 加价率≥1000倍 · API成本¥3.6/百万tokens</p>
        </div>
      </div>
    </div>
  );
};