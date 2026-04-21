/**
 * 升级提示组件 v10.0 —— 积分制版本
 * 
 * - 积分不足时提示充值或升级
 * - 不展示 token/cost 信息
 * - 销售钩子引导购买积分或订阅
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowUp, Gift, Coins, Crown } from 'lucide-react';
import { PLANS, CREDIT_PACKS, CREDIT_SYMBOL, BRAND_INFO } from '../../../../shared/plans';

interface UpgradePromptProps {
  type: 'low_credits' | 'feature_locked' | 'upgrade_suggestion' | 'daily_reset';
  planId?: string;
  remainingCredits?: number;
  onUpgrade?: () => void;
  onClose?: () => void;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  type, planId = 'free', remainingCredits = 0, onUpgrade, onClose,
}) => {
  const plan = PLANS.find(p => p.id === planId);
  if (!plan) return null;

  const nextPlan = PLANS.find(p => p.id === 
    planId === 'free' ? 'starter' : 
    planId === 'starter' ? 'pro' : 
    planId === 'pro' ? 'strategic' : 'enterprise'
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed bottom-4 right-4 z-50 w-80 max-w-[90vw]"
      >
        <div className="bg-gray-900 border border-amber-500/30 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500/20 to-red-500/20 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {type==='low_credits'?<Zap className="w-4 h-4 text-red-400"/>:
               type==='feature_locked'?<Crown className="w-4 h-4 text-red-400"/>:
               type==='daily_reset'?<Gift className="w-4 h-4 text-green-400"/>:
               <Coins className="w-4 h-4 text-amber-400"/>}
              <span className="font-medium text-sm">
                {type==='low_credits'?'积分即将用完':
                 type==='feature_locked'?'功能需要解锁':
                 type==='daily_reset'?'今日积分已重置':
                 '升级解锁更多'}
              </span>
            </div>
            {onClose && <button onClick={onClose} className="text-gray-400 hover:text-white text-xs">✕</button>}
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">
            {/* Current status */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">当前：{plan.name}</div>
              <div className="font-bold text-white">{plan.nameEn}</div>
              {type==='low_credits' && (
                <div className="flex items-center gap-2 mt-2">
                  <Coins className="w-3.5 h-3.5 text-amber-400"/>
                  <span className="text-sm font-bold text-amber-400">{remainingCredits}</span>
                  <span className="text-xs text-gray-500">{CREDIT_SYMBOL} 剩余</span>
                </div>
              )}
            </div>

            {/* Sales hook */}
            {plan.salesHook && (
              <p className="text-xs text-gray-300 leading-relaxed">{plan.salesHook}</p>
            )}

            {/* Options */}
            <div className="space-y-2">
              {/* Credit packs quick buy */}
              <div className="text-xs text-amber-400 mb-1">💰 快速充值：</div>
              <div className="grid grid-cols-3 gap-1.5">
                {CREDIT_PACKS.slice(0,3).map(pack => (
                  <button key={pack.id} onClick={onUpgrade}
                    className="text-center p-1.5 bg-gray-800 rounded hover:bg-gray-700 transition-colors">
                    <div className="text-[10px] text-gray-400">{pack.credits+(pack.bonus||0)}{CREDIT_SYMBOL}</div>
                    <div className="text-xs font-bold text-amber-400">¥{pack.price}</div>
                  </button>
                ))}
              </div>

              {/* Upgrade subscription */}
              {nextPlan && (
                <button onClick={onUpgrade}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-medium text-sm flex items-center justify-center gap-2 transition-all">
                  <ArrowUp className="w-4 h-4" />
                  升级到 {nextPlan.name} · ¥{nextPlan.monthlyPrice}/月
                </button>
              )}

              <button onClick={() => window.location.href='/maoai/pricing'}
                className="w-full py-1.5 text-xs text-gray-400 hover:text-amber-400 transition-colors text-center">
                查看完整定价方案 →
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/** 积分余额显示 */
interface CreditsDisplayProps {
  credits: number;
  maxCredits?: number;
}

export const CreditsDisplay: React.FC<CreditsDisplayProps> = ({ credits, maxCredits }) => {
  const percentage = maxCredits ? (credits / maxCredits) * 100 : 50;
  const isLow = percentage <= 20;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Coins className={`w-4 h-4 ${isLow ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
      <span className={isLow ? 'text-red-400 font-bold' : 'text-gray-300'}>{credits}</span>
      <span className="text-xs text-gray-500">{CREDIT_SYMBOL}</span>
      {maxCredits && (
        <>
          <div className="flex-1 mx-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${percentage}%` }}
              className={`h-full rounded-full ${percentage<=20?'bg-red-500':percentage<=50?'bg-amber-500':'bg-green-500'}`}
            />
          </div>
          {isLow && <span className="text-xs text-red-400 animate-pulse">⚠️ 即将用完</span>}
        </>
      )}
    </div>
  );
};
