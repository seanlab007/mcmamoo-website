/**
 * 对话中的升级提示组件
 * 
 * 功能：
 * - 次数警告时展示销售钩子
 * - 功能锁定时提示升级
 * - 模型差异实时展示
 * 
 * 更新日期：2026-04-22
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Lock, ArrowUp, Star, Crown, Sparkles } from 'lucide-react';
import { PLANS, UPGRADE_PROMPTS } from '../../../../shared/plans';
import { useLanguage } from '../../contexts/LanguageContext';

const Pick = ({ cn, en }: { cn: string; en: string }) => {
  const { language } = useLanguage();
  return <>{language === 'zh' ? cn : en}</>;
};

interface UpgradePromptProps {
  type: 'low_calls' | 'feature_locked' | 'upgrade_suggestion';
  planId: string;
  featureName?: string;
  onUpgrade?: () => void;
  onClose?: () => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  type,
  planId,
  featureName,
  onUpgrade,
  onClose,
}) => {
  const plan = PLANS.find(p => p.id === planId);
  if (!plan) return null;

  const getPromptContent = () => {
    switch (type) {
      case 'low_calls':
        return {
          icon: <Zap className="w-5 h-5 text-amber-400" />,
          title: <Pick cn="🎯 今日次数即将用完" en="🎯 Running low on today's calls" />,
          message: UPGRADE_PROMPTS.lowCallsWarning(plan),
        };
      case 'feature_locked':
        return {
          icon: <Lock className="w-5 h-5 text-red-400" />,
          title: <Pick cn={`🔒 功能锁定：${featureName}`} en={`🔒 Feature Locked: ${featureName}`} />,
          message: UPGRADE_PROMPTS.featureLocked(featureName || '', plan),
        };
      case 'upgrade_suggestion':
        return {
          icon: <Sparkles className="w-5 h-5 text-amber-400" />,
          title: <Pick cn="💡 解锁更多可能" en="💡 Unlock More Possibilities" />,
          message: UPGRADE_PROMPTS.upgradeSuggestion(plan),
        };
      default:
        return null;
    }
  };

  const content = getPromptContent();
  if (!content) return null;

  const getNextPlan = () => {
    const planIndex = PLANS.findIndex(p => p.id === planId);
    if (planIndex < PLANS.length - 1) {
      return PLANS[planIndex + 1];
    }
    return null;
  };

  const nextPlan = getNextPlan();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed bottom-4 right-4 z-50 w-80 max-w-[90vw]"
      >
        <div className="bg-gray-900 border border-amber-500/30 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500/20 to-red-500/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {content.icon}
              <span className="font-medium text-amber-400">{content.title}</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {/* 当前版本信息 */}
            <div className="bg-gray-800/50 rounded-lg p-3 mb-3">
              <div className="text-xs text-gray-400 mb-1">
                <Pick cn="当前版本" en="Current Plan" />
              </div>
              <div className="font-bold text-white">{plan.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                {plan.modelDescription}
              </div>
            </div>

            {/* 销售钩子 */}
            <div className="text-sm text-gray-300 mb-4 whitespace-pre-wrap">
              {content.message}
            </div>

            {/* 升级按钮 */}
            {nextPlan && (
              <button
                onClick={onUpgrade}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-medium flex items-center justify-center gap-2 transition-all"
              >
                <ArrowUp className="w-4 h-4" />
                <Pick 
                  cn={`升级到 ${nextPlan.name} · ¥${nextPlan.monthlyPrice}/月`} 
                  en={`Upgrade to ${nextPlan.nameEn} · ¥${nextPlan.monthlyPrice}/mo`} 
                />
              </button>
            )}

            {/* 查看定价 */}
            <button
              onClick={() => window.location.href = '/maoai/pricing'}
              className="w-full py-2 mt-2 text-sm text-gray-400 hover:text-amber-400 transition-colors"
            >
              <Pick cn="查看完整定价方案 →" en="View full pricing →" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// 调用次数显示组件
interface CallsRemainingProps {
  calls: number;
  total: number;
  planId: string;
}

export const CallsRemaining: React.FC<CallsRemainingProps> = ({ calls, total, planId }) => {
  const percentage = (calls / total) * 100;
  const isLow = percentage <= 20;
  const plan = PLANS.find(p => p.id === planId);

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1">
        <Zap className={`w-4 h-4 ${isLow ? 'text-red-400' : 'text-amber-400'}`} />
        <span className={isLow ? 'text-red-400' : 'text-gray-400'}>
          <Pick cn="剩余" en="Left" />
        </span>
      </div>
      <span className={`font-bold ${isLow ? 'text-red-400' : 'text-white'}`}>
        {calls}
      </span>
      <span className="text-gray-500">/ {total}</span>
      
      {/* 进度条 */}
      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${
            percentage <= 20 ? 'bg-red-500' : 
            percentage <= 50 ? 'bg-amber-500' : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* 低次数警告 */}
      {isLow && (
        <span className="text-xs text-red-400 animate-pulse">
          ⚠️ <Pick cn="即将用完" en="Running out" />
        </span>
      )}
    </div>
  );
};

// 功能锁定提示
interface FeatureLockedProps {
  featureName: string;
  requiredPlan: string;
  onUpgrade?: () => void;
}

export const FeatureLockedBanner: React.FC<FeatureLockedProps> = ({
  featureName,
  requiredPlan,
  onUpgrade,
}) => {
  const plan = PLANS.find(p => p.id === requiredPlan);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-red-900/50 to-amber-900/50 border border-red-500/30 rounded-lg p-3 mb-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-red-400" />
          <span className="text-sm">
            <Lock className="w-3 h-3 inline text-red-400 mr-1" />
            <span className="text-gray-300">{featureName}</span>
            <span className="text-gray-500 ml-1">
              <Pick cn="需要" en="requires" />
            </span>
            <span className="text-amber-400 font-medium ml-1">
              {plan?.name || requiredPlan}
            </span>
          </span>
        </div>
        {onUpgrade && (
          <button
            onClick={onUpgrade}
            className="text-xs bg-amber-500 hover:bg-amber-400 text-black px-3 py-1 rounded-full font-medium transition-colors"
          >
            <Pick cn="立即升级" en="Upgrade" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// 模型能力提示（在回复前展示）
interface ModelPowerTipProps {
  modelTier: 'basic' | 'advanced' | 'strategic';
}

export const ModelPowerTip: React.FC<ModelPowerTipProps> = ({ modelTier }) => {
  const powerInfo = {
    basic: { name: '基础模型', icon: '⚡', color: 'gray' },
    advanced: { name: '高级模型', icon: '🔥', color: 'amber' },
    strategic: { name: '战略模型', icon: '💎', color: 'red' },
  };

  const info = powerInfo[modelTier];

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-${info.color}-500/10 border border-${info.color}-500/30 text-xs`}>
      <span>{info.icon}</span>
      <span className={`text-${info.color}-400 font-medium`}>
        {info.name}
      </span>
    </div>
  );
};

// 升级引导语生成器
export const generateUpgradeGuide = (planId: string, remainingCalls: number): string => {
  const plan = PLANS.find(p => p.id === planId);
  if (!plan) return '';

  const nextPlan = PLANS.find(p => p.id === planId.replace('free', 'starter').replace('starter', 'pro').replace('pro', 'strategic'));

  if (plan.id === 'free' && remainingCalls <= 3) {
    return `
🔥 **您正在体验专业级AI能力**

免费版已让您体验了全部高级功能：
- ✅ DeepSeek V3 + R1 深度推理
- ✅ 图片理解与代码助手
- ✅ 多模态理解能力

⏰ 今日剩余 **${remainingCalls}** 次

💡 **升级解锁无限次**

每月仅需 **¥99** 即可：
- 每日 99 次调用
- 无限对话记忆
- 优先响应队列

👉 [立即升级入门版](/maoai/pricing)
    `.trim();
  }

  return '';
};