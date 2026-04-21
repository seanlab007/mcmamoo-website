import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown, Shield, Target, Lock, ArrowRight, Gift, Star, Infinity } from 'lucide-react';
import { PLANS, MODEL_POWER, CAPABILITY_COMPARISON, UPGRADE_PROMPTS } from '../../../../shared/plans';
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

  const getCallsDisplay = (plan: any) => {
    if (plan.callsPerDay) return `${plan.callsPerDay}次/天`;
    return <Infinity className="w-5 h-5 inline" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-16 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-red-500/5 to-amber-500/5" />
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <Pick cn="MaoAI 定价方案" en="MaoAI Pricing" />
            </h1>
            <p className="text-xl text-gray-400 mb-6">
              <Pick 
                cn="相同强大模型，不同调用次数 · 升级解锁无限可能" 
                en="Same powerful models, different call limits · Upgrade for unlimited" 
              />
            </p>
            
            {/* 核心卖点 */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {[
                { icon: '🔥', text: '模型相同强大' },
                { icon: '⏱️', text: '次数限制' },
                { icon: '💰', text: '价格以9结尾' },
                { icon: '💎', text: '升级解锁全部' },
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

      {/* 重要提示 */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
          <p className="text-amber-400 font-medium">
            <Gift className="w-4 h-4 inline mr-2" />
            <Pick 
              cn="💡 免费版和专业版使用相同的强大模型！区别仅在于调用次数" 
              en="💡 Free and Pro use the same powerful models! Only call limits differ." 
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

                {/* Model Power - 强调模型相同强大 */}
                <div className={`rounded-lg p-3 mb-4 ${isFree ? 'bg-green-500/10 border border-green-500/30' : 'bg-gray-900/50'}`}>
                  <div className="text-xs text-center text-gray-400 mb-2">
                    <Pick cn="🔧 模型能力" en="🔧 Model Power" />
                  </div>
                  <div className="text-sm text-center font-medium text-white mb-1">
                    {plan.modelDescription}
                  </div>
                  {isFree && (
                    <div className="text-xs text-center text-green-400 mt-2">
                      ✅ 与专业版模型相同！
                    </div>
                  )}
                </div>

                {/* 调用次数 */}
                <div className={`text-center rounded-lg p-3 mb-4 ${isFree ? 'bg-red-500/10' : 'bg-gray-900/30'}`}>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-xl font-bold ${isFree ? 'text-red-400' : 'text-white'}`}>
                      {getCallsDisplay(plan)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {isFree ? (
                      <Pick cn="📅 今日剩余" en="📅 Today" />
                    ) : plan.id === 'starter' ? (
                      <Pick cn="📅 每日" en="📅 Daily" />
                    ) : (
                      <Pick cn="📅 无限制" en="📅 Unlimited" />
                    )}
                  </div>
                </div>

                {/* 销售钩子 - 解锁什么 */}
                {!isStrategic && plan.unlockedPower.length > 0 && (
                  <div className={`rounded-lg p-3 mb-4 ${isHighlight ? 'bg-amber-500/10' : 'bg-gray-900/30'}`}>
                    <div className="text-xs text-center text-amber-400 mb-2 font-medium">
                      {plan.salesHook}
                    </div>
                    <div className="text-xs text-gray-400">
                      {plan.unlockedPower.slice(0, 3).map((power, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-amber-400" />
                          <span>{power}</span>
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
            <Pick cn="🚀 模型能力对比" en="🚀 Model Capability Comparison" />
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

        {/* 战略版特别说明 */}
        <div className="mt-12 bg-gradient-to-r from-red-900/20 via-amber-900/20 to-red-900/20 rounded-2xl p-8 border border-red-500/20">
          <h3 className="text-xl font-bold text-center mb-6">
            <Pick cn="💎 MaoAI 核心差异化" en="💎 MaoAI Core Differentiation" />
          </h3>
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
                  cn="5轮博弈推理，Coder→Reviewer→Validator评分机制" 
                  en="5-round game reasoning, Coder→Reviewer→Validator" 
                />
              </p>
            </div>
          </div>
        </div>

        {/* FAQ / 销售话术 */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-center mb-6">
            <Pick cn="❓ 常见问题" en="❓ FAQ" />
          </h3>
          <div className="space-y-4">
            {[
              {
                q: <Pick cn="免费版和专业版有什么区别？" en="What's the difference between Free and Pro?" />,
                a: <Pick 
                    cn="模型能力完全相同！免费版每天10次调用，专业版无限次。升级后您将体验到完全无限制的强大AI能力。" 
                    en="Model capabilities are identical! Free gives 10 calls/day, Pro gives unlimited. Upgrade to enjoy full unrestricted AI power." 
                  />,
              },
              {
                q: <Pick cn="为什么免费版要限制次数？" en="Why limit calls for free tier?" />,
                a: <Pick 
                    cn="我们希望提供公平的AI服务。通过限制次数，您可以体验完整能力后再决定是否升级。免费版已包含全部高级功能！" 
                    en="We aim to provide fair AI service. By limiting calls, you can experience full capabilities before deciding to upgrade. Free tier already includes all advanced features!" 
                  />,
              },
              {
                q: <Pick cn="毛泽东战略AI和其他AI有什么不同？" en="How is Mao Strategic AI different?" />,
                a: <Pick 
                    cn="我们融合了毛泽东思想的历史智慧、五层分权决策架构和TriadLoop博弈推理，为您提供独特的战略级AI决策支持。" 
                    en="We integrate Mao Zedong Thought wisdom, five-layer architecture, and TriadLoop reasoning for unique strategic AI decision support." 
                  />,
              },
            ].map((item, i) => (
              <div key={i} className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                <h4 className="font-medium text-amber-400 mb-2">{item.q}</h4>
                <p className="text-sm text-gray-400">{item.a}</p>
              </div>
            ))}
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