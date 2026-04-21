import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';
import { PLANS } from '../../../../shared/plans';
import { useLanguage } from '../../contexts/LanguageContext';

const Pick = ({ cn, en }: { cn: string; en: string }) => {
  const { language } = useLanguage();
  return <>{language === 'zh' ? cn : en}</>;
};

export const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);

  const formatPrice = (price: number, isYearly: boolean) => {
    if (price === 0) return { price: '0', period: '永久免费', yearly: false };
    const displayPrice = isYearly ? Math.round(price * 0.83) : price;
    const period = isYearly ? `/年` : `/月`;
    return { price: displayPrice.toString(), period, yearly: isYearly };
  };

  const getTokensDisplay = (tokens: number) => {
    if (tokens >= 1_000_000) return `${tokens / 1_000_000}百万`;
    if (tokens >= 1000) return `${tokens / 1000}万`;
    return tokens.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <Pick cn="AI 能力定价方案" en="AI Pricing Plans" />
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            <Pick 
              cn="基于 API 成本的 1000 倍+ 加价率定价 · 所有价格以9结尾" 
              en="1000x+ Markup Pricing · All prices end in 9" 
            />
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm ${!isYearly ? 'text-amber-400' : 'text-gray-500'}`}>
              <Pick cn="月付" en="Monthly" />
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className="relative w-14 h-7 bg-gray-700 rounded-full transition-colors"
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
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan, index) => {
            const { price, period, yearly } = formatPrice(
              isYearly ? plan.yearlyPrice : plan.monthlyPrice,
              isYearly
            );
            const isHighlight = plan.highlight;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl p-6 ${
                  isHighlight 
                    ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/5 border-2 border-amber-500/50' 
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
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-400">{plan.nameEn}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-amber-400">¥{price}</span>
                    <span className="text-gray-500 ml-1">{period}</span>
                  </div>
                  {yearly && plan.monthlyPrice > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      <Pick cn="月均" en="Avg" /> ¥{Math.round(plan.yearlyPrice / 12)}
                    </p>
                  )}
                </div>

                {/* Tokens */}
                <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-white">
                      {getTokensDisplay(plan.tokensPerMonth)}
                    </span>
                    <span className="text-sm text-gray-400 ml-1">
                      <Pick cn="tokens/月" en="tokens/mo" />
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 text-center mt-2">
                    <Pick cn="API成本仅" en="API cost only" /> ¥{plan.costEstimate.toFixed(2)}
                    {plan.markup > 0 && (
                      <span className="text-amber-400 ml-2">
                        {Math.round(plan.markup).toLocaleString()}x <Pick cn="加价" en="markup" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-6">
                  {plan.features.slice(0, 6).map((feature, i) => (
                    <li key={i} className="flex items-start text-sm">
                      <Check className="w-4 h-4 text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button className={`w-full py-3 rounded-lg font-medium transition-all ${
                  isHighlight
                    ? 'bg-amber-500 hover:bg-amber-400 text-black'
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}>
                  <Pick cn="立即开始" en="Get Started" />
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            <Pick 
              cn="所有价格均以9结尾 · 加价率 1000 倍以上 · 利润允许超过 1000 倍" 
              en="All prices end in 9 · Markup 1000x+ · Profit allowed to exceed 1000x" 
            />
          </p>
          <p className="mt-2">
            <Pick 
              cn="支持微信、支付宝、银行卡 · 7×24 小时自动发货" 
              en="WeChat Pay, Alipay, Bank Card · 24/7 instant delivery" 
            />
          </p>
        </div>

        {/* Comparison Table */}
        <div className="mt-16 overflow-x-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            <Pick cn="套餐对比" en="Plan Comparison" />
          </h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-4 px-4 text-left text-gray-400"><Pick cn="功能" en="Feature" /></th>
                {PLANS.map(plan => (
                  <th key={plan.id} className="py-4 px-4 text-center text-sm font-medium">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800">
                <td className="py-4 px-4 text-gray-300"><Pick cn="每月Token" en="Monthly Tokens" /></td>
                {PLANS.map(plan => (
                  <td key={plan.id} className="py-4 px-4 text-center text-amber-400 font-medium">
                    {getTokensDisplay(plan.tokensPerMonth)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-4 px-4 text-gray-300"><Pick cn="月费" en="Monthly Price" /></td>
                {PLANS.map(plan => (
                  <td key={plan.id} className="py-4 px-4 text-center">
                    ¥{plan.monthlyPrice}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-4 px-4 text-gray-300"><Pick cn="API成本" en="API Cost" /></td>
                {PLANS.map(plan => (
                  <td key={plan.id} className="py-4 px-4 text-center text-gray-500">
                    ¥{plan.costEstimate.toFixed(2)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-4 px-4 text-gray-300"><Pick cn="加价率" en="Markup" /></td>
                {PLANS.map(plan => (
                  <td key={plan.id} className="py-4 px-4 text-center text-amber-400">
                    {plan.markup > 0 ? `${Math.round(plan.markup).toLocaleString()}x` : '—'}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-4 px-4 text-gray-300"><Pick cn="可用模型" en="Available Models" /></td>
                {PLANS.map(plan => {
                  const models: Record<string, string> = {
                    'free': 'DeepSeek V3',
                    'starter': 'V3 + GLM-4',
                    'pro': 'V3/R1 + Groq + Gemini',
                    'enterprise': '全部模型',
                  };
                  return (
                    <td key={plan.id} className="py-4 px-4 text-center text-sm">
                      {models[plan.id] || '—'}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};