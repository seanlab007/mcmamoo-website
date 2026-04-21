import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown, Shield, ArrowRight, Gift, Star, Infinity, Brain, Zap as Speed } from 'lucide-react';
import { PLANS, BRAND_INFO, CAPABILITY_COMPARISON, COST_PER_CALL } from '../../../../shared/plans';
import { useLanguage } from '../../contexts/LanguageContext';

const Pick = ({ cn, en }: { cn: string; en: string }) => {
  const { language } = useLanguage();
  return <>{language === 'zh' ? cn : en}</>;
};

export const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);

  const formatPrice = (price: number) => {
    if (price === 0) return { price: '免费', period: '' };
    const displayPrice = isYearly ? Math.round(price * 0.83) : price;
    return { price: displayPrice.toString(), period: isYearly ? '/年' : '/月' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-red-500/10 to-amber-500/10" />
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* 品牌标识 */}
            <div className="inline-block mb-4 px-4 py-1.5 bg-amber-500/20 rounded-full border border-amber-500/30">
              <span className="text-amber-400 text-sm font-medium">
                {BRAND_INFO.name}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <Pick cn="AI 战略思维定价" en="AI Strategic Pricing" />
            </h1>
            
            <p className="text-xl text-gray-400 mb-2">
              <Pick 
                cn={BRAND_INFO.tagline} 
                en="Breakthrough AI Strategic Thinking System" 
              />
            </p>
            <p className="text-sm text-gray-500 mb-6">
              <Pick 
                cn="由 Mc&Mamoo 战略实验室打造" 
                en="Powered by Mc&Mamoo Strategic Lab" 
              />
            </p>
            
            {/* 核心卖点 */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                { icon: '🧠', text: '亿级战略智慧' },
                { icon: '⚖️', text: '五层分权架构' },
                { icon: '🔄', text: 'TriadLoop博弈' },
                { icon: '💰', text: '价格以9结尾' },
              ].map((item, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gray-800/50 px-4 py-2 rounded-full text-sm flex items-center gap-1"
                >
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </motion.span>
              ))}
            </div>

            {/* Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm ${!isYearly ? 'text-amber-400' : 'text-gray-500'}`}>
                <Pick cn="月付" en="Monthly" />
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className="relative w-14 h-7 bg-gray-700 rounded-full transition-colors hover:bg-gray-600"
              >
                <div className={`absolute top-1 w-5 h-5 bg-amber-400 rounded-full transition-transform ${isYearly ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm ${isYearly ? 'text-amber-400' : 'text-gray-500'}`}>
                <Pick cn="年付" en="Yearly" />
              </span>
              {isYearly && (
                <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full">
                  <Pick cn="省17%" en="Save 17%" />
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* 成本透明说明 */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
          <p className="text-amber-400 font-medium">
            <Brain className="w-4 h-4 inline mr-2" />
            <Pick 
              cn={`💡 API成本透明：每次调用成本约 ¥${COST_PER_CALL.toFixed(4)} · 加价率 1000 倍以上` 
              en={`💡 Transparent API cost: ¥${COST_PER_CALL.toFixed(4)} per call · Markup 1000x+` 
            />
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {PLANS.map((plan, index) => {
            const { price, period } = formatPrice(
              isYearly ? plan.yearlyPrice : plan.monthlyPrice
            );
            const isHighlight = plan.highlight;
            const isFree = plan.id === 'free';
            const isStrategic = plan.modelTier === 'strategic';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`relative rounded-2xl p-5 ${
                  isHighlight 
                    ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/5 border-2 border-amber-500/50' 
                    : isStrategic
                      ? 'bg-gradient-to-b from-red-500/10 to-red-600/5 border border-red-500/30'
                      : 'bg-gray-800/50 border border-gray-700/50'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-amber-500 text-black text-xs font-bold px-4 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-4">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${
                    isStrategic 
                      ? 'bg-red-500/20 text-red-400' 
                      : isHighlight
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-gray-700 text-gray-400'
                  }`}>
                    {isStrategic ? <Shield className="w-5 h-5" /> : 
                     isHighlight ? <Star className="w-5 h-5" /> : 
                     <Zap className="w-5 h-5" />}
                  </div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-xs text-gray-500">{plan.nameEn}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-4">
                  <div className="flex items-baseline justify-center">
                    <span className={`text-3xl font-bold ${isFree ? 'text-green-400' : 'text-amber-400'}`}>
                      ¥{price}
                    </span>
                    {period && <span className="text-gray-500 ml-1 text-sm">{period}</span>}
                  </div>
                </div>

                {/* Model & Calls */}
                <div className={`rounded-lg p-3 mb-4 ${isFree ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-900/50'}`}>
                  <div className="text-xs text-center text-gray-400 mb-1">
                    <Pick cn="🔧 模型能力" en="🔧 Model" />
                  </div>
                  <div className="text-sm text-center font-medium text-white mb-2">
                    {plan.modelDescription}
                  </div>
                  <div className="text-xs text-center text-gray-500">
                    <Speed className="w-3 h-3 inline mr-1" />
                    {isFree ? '10' : plan.id === 'starter' ? '99' : '∞'} <Pick cn="次/天" en="calls/day" />
                  </div>
                  {isFree && (
                    <div className="text-xs text-center text-green-400 mt-2">
                      ✅ 与专业版模型相同！
                    </div>
                  )}
                </div>

                {/* 销售钩子 */}
                {!isStrategic && plan.unlockedPower.length > 0 && (
                  <div className={`rounded-lg p-3 mb-4 ${isHighlight ? 'bg-amber-500/10' : 'bg-gray-900/30'}`}>
                    <div className="text-xs text-center text-amber-400 mb-2 font-medium">
                      {plan.salesHook}
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                      {plan.unlockedPower.slice(0, 3).map((power, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          <span className="truncate">{power}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <button className={`w-full py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                  isHighlight
                    ? 'bg-amber-500 hover:bg-amber-400 text-black'
                    : isStrategic
                      ? 'bg-red-500 hover:bg-red-400 text-white'
                      : isFree
                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}>
                  {isFree ? (
                    <><Gift className="w-4 h-4" /> <Pick cn="立即体验" en="Try Free" /></>
                  ) : (
                    <><Pick cn="立即开通" en="Get Started" /> <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* 能力对比表 */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            <Pick cn="📊 完整能力对比" en="📊 Full Comparison" />
          </h2>
          
          {CAPABILITY_COMPARISON.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-8">
              <h3 className="text-lg font-medium text-amber-400 mb-4">{section.category}</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-4 text-left text-gray-400"><Pick cn="功能" en="Feature" /></th>
                      {PLANS.map(plan => (
                        <th key={plan.id} className={`py-3 px-4 text-center font-medium min-w-[80px] ${
                          plan.highlight ? 'text-amber-400' : 
                          plan.modelTier === 'strategic' ? 'text-red-400' : 'text-gray-300'
                        }`}>
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((row, i) => (
                      <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                        <td className="py-3 px-4 text-gray-400">{row.feature}</td>
                        <td className="py-3 px-4 text-center">{row.free}</td>
                        <td className="py-3 px-4 text-center">{row.starter}</td>
                        <td className="py-3 px-4 text-center text-amber-400 font-medium">{row.pro}</td>
                        <td className="py-3 px-4 text-center text-red-400 font-medium">{row.strategic}</td>
                        <td className="py-3 px-4 text-center text-red-400 font-medium">{row.enterprise}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* 品牌介绍 */}
        <div className="mt-12 bg-gradient-to-r from-amber-900/20 via-red-900/20 to-amber-900/20 rounded-2xl p-8 border border-amber-500/20">
          <h3 className="text-xl font-bold text-center mb-6">
            {BRAND_INFO.name}
          </h3>
          <p className="text-center text-gray-400 mb-6">
            {BRAND_INFO.tagline}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-900/50 rounded-xl">
              <div className="text-4xl mb-3">🧠</div>
              <h4 className="font-bold text-amber-400 mb-2">
                <Pick cn="毛泽东思想向量库" en="Mao Zedong Thought Vector" />
              </h4>
              <p className="text-sm text-gray-400">
                <Pick 
                  cn="亿级tokens历史战略智慧，智能匹配问题分析" 
                  en="Billion-token strategic wisdom, intelligent matching" 
                />
              </p>
            </div>
            <div className="text-center p-4 bg-gray-900/50 rounded-xl">
              <div className="text-4xl mb-3">⚖️</div>
              <h4 className="font-bold text-amber-400 mb-2">
                <Pick cn="五层分权架构" en="Five-Layer Architecture" />
              </h4>
              <p className="text-sm text-gray-400">
                <Pick 
                  cn="决策层→执行层→验证层→优化层→迭代层" 
                  en="Decision→Execute→Validate→Optimize→Iterate" 
                />
              </p>
            </div>
            <div className="text-center p-4 bg-gray-900/50 rounded-xl">
              <div className="text-4xl mb-3">🔄</div>
              <h4 className="font-bold text-amber-400 mb-2">
                <Pick cn="TriadLoop 博弈循环" en="TriadLoop Game Loop" />
              </h4>
              <p className="text-sm text-gray-400">
                <Pick 
                  cn="5轮博弈推理，Coder→Reviewer→Validator评分" 
                  en="5-round game reasoning, Coder→Reviewer→Validator" 
                />
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p className="font-medium text-amber-400">
            {BRAND_INFO.footer}
          </p>
          <p className="mt-2">
            <Pick 
              cn="所有价格均以9结尾 · 加价率1000倍以上" 
              en="All prices end in 9 · Markup 1000x+" 
            />
          </p>
        </div>
      </div>
    </div>
  );
};
