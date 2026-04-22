import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Shield, ArrowRight, Gift, Star, Crown, Coins } from 'lucide-react';
import { PLANS, CREDIT_PACKS, CREDIT_NAME, CREDIT_SYMBOL, BRAND_INFO, CAPABILITY_COMPARISON } from '@shared/plans';
import { useLanguage } from '../contexts/LanguageContext';

const Pick = ({ cn, en }: { cn: string; en: string }) => {
  const { language } = useLanguage();
  return <>{language === 'zh' ? cn : en}</>;
};

export const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [showCreditPacks, setShowCreditPacks] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      {/* Hero */}
      <div className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/10" />
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-block mb-4 px-4 py-1.5 bg-amber-500/20 rounded-full border border-amber-500/30">
              <span className="text-amber-400 text-sm font-medium">{BRAND_INFO.fullName}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3">AI 战略思维定价</h1>
            <p className="text-lg text-gray-400 mb-2">{BRAND_INFO.taglineCN} · 积分制 · 所有价格以9结尾</p>
            <p className="text-xs text-gray-500 mb-6">由 {BRAND_INFO.labName} 打造</p>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-sm ${!isYearly ? 'text-amber-400' : 'text-gray-500'}`}>月付</span>
              <button onClick={() => setIsYearly(!isYearly)} className="relative w-14 h-7 bg-gray-700 rounded-full transition-colors hover:bg-gray-600">
                <div className={`absolute top-1 w-5 h-5 bg-amber-400 rounded-full transition-transform ${isYearly ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm ${isYearly ? 'text-amber-400' : 'text-gray-500'}`}>年付</span>
              {isYearly && <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">省17%</span>}
            </div>

            {/* 积分制说明 */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-full px-4 py-2 text-sm">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300">积分制（{CREDIT_SYMBOL}）· 充值即用，用完可续</span>
              <button onClick={() => setShowCreditPacks(!showCreditPacks)} className="text-amber-300 underline ml-1 text-xs">
                {showCreditPacks ? '收起' : '查看充值包'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Credit Packs 展开区 */}
      {showCreditPacks && (
        <motion.div initial={{ opacity:0,height:0 }} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0 }}
          className="max-w-4xl mx-auto px-4 mb-8">
          <div className="bg-gray-800/50 border border-amber-500/20 rounded-xl p-6">
            <h3 className="font-bold text-amber-400 mb-4 flex items-center gap-2"><Coins className="w-5 h-5" />积分充值包（{CREDIT_NAME}）</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {CREDIT_PACKS.map(pack => (
                <div key={pack.id} className={`p-3 rounded-lg text-center ${pack.popular ? 'bg-amber-500/15 border border-amber-500/40' : 'bg-gray-900/50 border border-gray-700/50'}`}>
                  <div className="text-xs text-gray-400">{pack.name}</div>
                  <div className="text-lg font-bold text-white my-1">{pack.credits + (pack.bonus || 0)} {CREDIT_SYMBOL}</div>
                  {pack.bonus && <div className="text-[10px] text-green-400">+{pack.bonus}赠送</div>}
                  <div className="text-amber-400 font-semibold mt-1">¥{pack.price}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Subscription Plans */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {PLANS.map((plan, index) => {
            const price = plan.monthlyPrice === 0 ? '免费' :
              `¥${isYearly ? Math.round(plan.yearlyPrice * 0.83) : plan.monthlyPrice}`;
            const period = isYearly ? '/年' : '/月';
            const isThink = plan.id === 'enterprise';

            return (
              <motion.div key={plan.id}
                initial={{ opacity:0,y:20 }} animate={{opacity:1,y:0 }} transition={{delay:index*0.06}}
                className={`relative rounded-2xl p-5 ${
                  plan.highlight ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/5 border-2 border-amber-500/50'
                    : plan.modelTier==='strategic' ? 'bg-gradient-to-b from-red-500/10 to-red-600/5 border border-red-500/30'
                    : plan.id==='free' ? 'bg-green-500/5 border border-green-500/30'
                    : 'bg-gray-800/50 border border-gray-700/50'
                }`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-4 py-1 rounded-full">{plan.badge}</div>
                )}
                
                {/* Header */}
                <div className="text-center mb-3">
                  <div className={`inline-flex items-center justify-center w-9 h-9 rounded-full mb-2 ${
                    plan.id==='free'?'bg-green-500/20 text-green-400':plan.highlight?'bg-amber-500/20 text-amber-400':
                    plan.modelTier==='strategic'?'bg-red-500/20 text-red-400':'bg-gray-700 text-gray-400'}`}>
                    {plan.id==='free'?<Gift/>:plan.highlight?<Star/>:plan.modelTier==='strategic'?<Shield/>:<Zap/>}
                  </div>
                  <h3 className="text-base font-bold">{plan.name}</h3>
                  <p className="text-[10px] text-gray-500">{plan.nameEn}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-3">
                  <div className="flex items-baseline justify-center">
                    <span className={`text-2xl font-bold ${plan.id==='free'?'text-green-400':'text-amber-400'}`}>{price}</span>
                    {plan.monthlyPrice>0 && <span className="text-gray-500 text-xs ml-1">{period}</span>}
                  </div>
                </div>

                {/* Credits */}
                <div className={`rounded-lg p-2.5 mb-3 text-center ${plan.id==='free'?'bg-green-500/10':'bg-gray-900/50'}`}>
                  <div className="flex items-center justify-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-sm font-bold text-white">
                      {plan.creditsPerDay ? `${plan.creditsPerDay}/天` : plan.creditsPerMonth.toLocaleString()+'/月'}
                    </span>
                    <span className="text-[10px] text-gray-500">{CREDIT_SYMBOL}</span>
                  </div>
                  {plan.id==='free' && <div className="text-[10px] text-green-400 mt-1">✅ 用完即终止，零隐藏费用</div>}
                </div>

                {/* Features */}
                <ul className="space-y-1.5 mb-3">
                  {plan.features.slice(0,4).map((f,i)=>(
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-300"><Check className="w-3 h-3 text-amber-400 mt-0.5 shrink-0"/>{f}</li>
                  ))}
                </ul>

                {/* Sales Hook / Unlocked */}
                {plan.salesHook && plan.unlockedCapabilities.length>0 && (
                  <div className="bg-gray-900/30 rounded-lg p-2 mb-3">
                    <div className="text-[10px] text-amber-400 mb-1">{plan.salesHook}</div>
                    {plan.unlockedCapabilities.slice(0,3).map((c,i)=><div key={i} className="flex items-center gap-1 text-[10px] text-gray-500"><ArrowRight className="w-2.5 h-2.5 shrink-0"/>{c}</div>)}
                  </div>
                )}

                {/* CTA */}
                <button className={`w-full py-2 rounded-lg font-medium text-xs transition-all flex items-center justify-center gap-1.5 ${
                  plan.id==='free'?'bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25':
                  plan.highlight?'bg-amber-500 hover:bg-amber-400 text-black':
                  plan.modelTier==='strategic'?'bg-red-500 hover:bg-red-400 text-white':'bg-gray-700 hover:bg-gray-600 text-white'
                }`}>{plan.id==='free'?(<><Gift className="w-3.5 h-3.5"/>立即体验</>):(<>立即开通<ArrowRight className="w-3.5 h-3.5"/></>)}</button>
              </motion.div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="mt-16 overflow-x-auto">
          <h2 className="text-xl font-bold text-center mb-6 text-amber-300">📊 能力对比</h2>
          {CAPABILITY_COMPARISON.map((sec,si)=>(
            <div key={si} className="mb-6">
              <h3 className="text-sm font-medium text-amber-400/70 mb-2 pl-1">{sec.category}</h3>
              <table className="w-full border-collapse text-xs min-w-[700px]">
                <thead><tr className="border-b border-gray-800">
                  <th className="py-2 px-3 text-left text-gray-500">功能</th>
                  {PLANS.map(p=><th key={p.id} className={`py-2 px-2 text-center font-semibold ${p.highlight?'text-amber-400':p.modelTier==='strategic'?'text-red-400':'text-gray-400'}`}>{p.name}</th>)}
                </tr></thead>
                <tbody>
                  {sec.items.map((row,ri)=>(
                    <tr key={ri} className="border-b border-gray-800/40 hover:bg-gray-800/20">
                      <td className="py-2 px-3 text-gray-400">{row.feature}</td>
                      {['free','starter','pro','strategic','enterprise'].map(c=><td key={c} className="py-2 px-2 text-center">{(row as any)[c]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Brand */}
        <div className="mt-12 bg-gradient-to-br from-amber-900/15 via-red-900/10 to-amber-900/15 rounded-2xl p-8 border border-amber-500/15 text-center">
          <h3 className="text-xl font-bold text-amber-300 mb-2">{BRAND_INFO.fullName}</h3>
          <p className="text-gray-400 text-sm mb-6">{BRAND_INFO.taglineCN}</p>
          <div className="flex flex-wrap justify-center gap-4">{BRAND_INFO.heroHighlights.map((h,i)=><span key={i} className="bg-gray-800/50 px-3 py-1.5 rounded-lg text-xs border border-gray-700/50">{h}</span>)}</div>
          <p className="mt-6 text-xs text-gray-600">{BRAND_INFO.footer}</p>
        </div>
      </div>
    </div>
  );
};
export default Pricing;
