import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown, Shield, Target, Lock } from 'lucide-react';
import { PLANS, MODEL_TIERS, CAPABILITY_COMPARISON } from '../../../../shared/plans';
import { useLanguage } from '../../contexts/LanguageContext';

const Pick = ({ cn, en }: { cn: string; en: string }) => {
  const { language } = useLanguage();
  return <>{language === 'zh' ? cn : en}</>;
};

// 图标映射
const TierIcon = ({ tier }: { tier: string }) => {
  switch (tier) {
    case 'basic': return <Zap className="w-5 h-5" />;
    case 'advanced': return <Sparkles className="w-5 h-5" />;
    case 'strategic': return <Shield className="w-5 h-5" />;
    default: return <Target className="w-5 h-5" />;
  }
};

// 能力展示组件
const CapabilityBadge = ({ text, unlocked }: { text: string; unlocked: boolean }) => (
  <span className={`inline-block px-2 py-1 text-xs rounded-full mr-1 mb-1 ${
    unlocked ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-700 text-gray-500'
  }`}>
    {unlocked ? '✅' : '❌'} {text}
  </span>
);

export const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [showCapabilities, setShowCapabilities] = useState(false);

  const formatPrice = (price: number) => {
    if (price === 0) return { price: '免费', period: '', suffix: '' };
    const displayPrice = isYearly ? Math.round(price * 0.83) : price;
    const period = isYearly ? '/年' : '/月';
    const suffix = isYearly ? '（省17%）' : '';
    return { price: displayPrice.toString(), period, suffix };
  };

  const getCallsDisplay = (plan: any) => {
    if (plan.callsPerDay) return `${plan.callsPerDay}次/天`;
    if (plan.callsPerMonth) return '无限次';
    return '无限次';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-red-500/10" />
        <div className="relative max-w-5xl mx-auto text-center">
          {/* 标题 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <Pick cn="MaoAI 定价方案" en="MaoAI Pricing" />
            </h1>
            <p className="text-xl text-gray-400">
              <Pick 
                cn="基于模型能力的差异化定价 · 所有价格以9结尾" 
                en="Differentiated pricing by model capability · All prices end in 9" 
              />
            </p>
          </motion.div>

          {/* 核心卖点 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-4 mb-8"
          >
            {[
              { icon: '🎯', text: '体验专业级' },
              { icon: '⚡', text: '高速响应' },
              { icon: '🧠', text: '战略思维' },
              { icon: '💰', text: '1000倍+加价' },
            ].map((item, i) => (
              <span key={i} className="bg-gray-800/50 px-4 py-2 rounded-full text-sm">
                {item.icon} {item.text}
              </span>
            ))}
          </motion.div>

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
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {PLANS.map((plan, index) => {
            const { price, period, suffix } = formatPrice(
              isYearly ? plan.yearlyPrice : plan.monthlyPrice
            );
            const isHighlight = plan.highlight;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`relative rounded-2xl p-5 ${
                  isHighlight 
                    ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/5 border-2 border-amber-500/50' 
                    : plan.id === 'strategic' || plan.id === 'enterprise'
                      ? 'bg-gradient-to-b from-red-500/20 to-red-600/5 border border-red-500/30'
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
                    plan.modelTier === 'strategic' 
                      ? 'bg-red-500/20 text-red-400' 
                      : plan.modelTier === 'advanced'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-gray-700 text-gray-400'
                  }`}>
                    <TierIcon tier={plan.modelTier} />
                  </div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-xs text-gray-500">{plan.nameEn}</p>
                </div>

                {/* Price */}
                <div className="text-center mb-4">
                  <div className="flex items-baseline justify-center">
                    <span className={`text-3xl font-bold ${plan.id === 'free' ? 'text-green-400' : 'text-amber-400'}`}>
                      ¥{price}
                    </span>
                    {period && <span className="text-gray-500 ml-1 text-sm">{period}</span>}
                  </div>
                  {suffix && <p className="text-xs text-amber-400 mt-1">{suffix}</p>}
                </div>

                {/* Calls & Model */}
                <div className={`rounded-lg p-3 mb-4 ${
                  plan.id === 'free' 
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-gray-900/50'
                }`}>
                  <div className="text-center mb-2">
                    <span className="text-lg font-bold text-white">
                      {getCallsDisplay(plan)}
                    </span>
                  </div>
                  <div className="text-xs text-center text-gray-400">
                    {plan.modelDescription}
                  </div>
                  {plan.id === 'free' && (
                    <div className="text-xs text-center text-green-400 mt-2">
                      ✨ 体验专业版全部能力
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button className={`w-full py-2 rounded-lg font-medium text-sm transition-all ${
                  isHighlight
                    ? 'bg-amber-500 hover:bg-amber-400 text-black'
                    : plan.id === 'strategic' || plan.id === 'enterprise'
                      ? 'bg-red-500 hover:bg-red-400 text-white'
                      : plan.id === 'free'
                        ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}>
                  {plan.id === 'free' ? (
                    <Pick cn="立即体验" en="Try Now" />
                  ) : (
                    <Pick cn="立即开通" en="Get Started" />
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* 能力对比表 */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              <Pick cn="模型能力对比" en="Model Capabilities" />
            </h2>
            <button
              onClick={() => setShowCapabilities(!showCapabilities)}
              className="text-sm text-amber-400 hover:text-amber-300"
            >
              {showCapabilities ? '收起详情' : '查看详情'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 px-4 text-left text-gray-400"><Pick cn="能力" en="Capability" /></th>
                  {PLANS.map(plan => (
                    <th key={plan.id} className={`py-3 px-4 text-center font-medium ${
                      plan.highlight ? 'text-amber-400' : plan.modelTier === 'strategic' ? 'text-red-400' : 'text-gray-300'
                    }`}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAPABILITY_COMPARISON.map((row, i) => (
                  <tr key={i} className={`border-b border-gray-800 ${row.feature.includes('调用') ? 'bg-gray-900/30' : ''}`}>
                    <td className="py-3 px-4 text-gray-400">{row.feature}</td>
                    <td className="py-3 px-4 text-center">{row.free}</td>
                    <td className="py-3 px-4 text-center">{row.starter}</td>
                    <td className="py-3 px-4 text-center text-amber-400">{row.pro}</td>
                    <td className="py-3 px-4 text-center text-red-400">{row.strategic}</td>
                    <td className="py-3 px-4 text-center text-red-400">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 战略版特别说明 */}
        <div className="mt-12 bg-gradient-to-r from-red-900/30 via-amber-900/30 to-red-900/30 rounded-2xl p-8 border border-red-500/20">
          <h3 className="text-xl font-bold text-center mb-4">
            <Pick cn="🌟 毛泽东思想战略AI - 核心差异化" en="🌟 Mao Zedong Thought Strategic AI - Core Differentiation" />
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">🧠</div>
              <h4 className="font-bold text-amber-400 mb-2">
                <Pick cn="毛泽东思想向量库" en="Mao Zedong Thought Vector" />
              </h4>
              <p className="text-sm text-gray-400">
                <Pick 
                  cn="亿级tokens历史战略智慧，智能匹配分析" 
                  en="Billion-token historical strategic wisdom, intelligent matching" 
                />
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">⚖️</div>
              <h4 className="font-bold text-amber-400 mb-2">
                <Pick cn="五层分权架构" en="Five-Layer Decentralized Architecture" />
              </h4>
              <p className="text-sm text-gray-400">
                <Pick 
                  cn="决策层→执行层→验证层→优化层→迭代层" 
                  en="Decision→Execution→Validation→Optimization→Iteration" 
                />
              </p>
            </div>
            <div>
              <div className="text-3xl mb-2">🔄</div>
              <h4 className="font-bold text-amber-400 mb-2">
                <Pick cn="TriadLoop 博弈循环" en="TriadLoop Game Loop" />
              </h4>
              <p className="text-sm text-gray-400">
                <Pick 
                  cn="5轮博弈推理，Coder→Reviewer→Validator评分" 
                  en="5-round game reasoning, Coder→Reviewer→Validator scoring" 
                />
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            <Pick 
              cn="所有价格均以9结尾 · 加价率1000倍以上 · 利润允许超过1000倍" 
              en="All prices end in 9 · Markup 1000x+ · Profit allowed to exceed 1000x" 
            />
          </p>
          <p className="mt-2">
            <Pick 
              cn="支持微信、支付宝、银行卡 · 7×24 小时自动发货 · 年付享17%优惠" 
              en="WeChat Pay, Alipay, Bank Card · 24/7 instant delivery · Yearly save 17%" 
            />
          </p>
        </div>
      </div>
    </div>
  );
};