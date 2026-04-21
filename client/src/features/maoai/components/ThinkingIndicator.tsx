/**
 * MaoAI Thinking Indicator - 思考中提示组件
 * 
 * 功能：
 * - 显示 "MaoAI 正在思考..." 
 * - 显示 TriadLoop 博弈推理状态
 * - 品牌标识展示
 * 
 * 更新日期：2026-04-22
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, RefreshCw, Shield, Activity } from 'lucide-react';
import { BRAND_INFO } from '../../../../shared/plans';
import { useLanguage } from '../../contexts/LanguageContext';

const Pick = ({ cn, en }: { cn: string; en: string }) => {
  const { language } = useLanguage();
  return <>{language === 'zh' ? cn : en}</>;
};

interface ThinkingStage {
  icon: React.ReactNode;
  text: string;
  textEn: string;
  subText?: string;
}

const THINKING_STAGES: ThinkingStage[] = [
  { 
    icon: <Brain className="w-4 h-4" />, 
    text: 'MaoAI 正在分析问题...', 
    textEn: 'MaoAI is analyzing...',
    subText: '理解问题核心'
  },
  { 
    icon: <RefreshCw className="w-4 h-4" />, 
    text: 'Coder 构建解决方案', 
    textEn: 'Coder building solution',
    subText: '生成初始方案'
  },
  { 
    icon: <Shield className="w-4 h-4" />, 
    text: 'Reviewer 审查质量', 
    textEn: 'Reviewer reviewing',
    subText: '评估方案优劣'
  },
  { 
    icon: <Activity className="w-4 h-4" />, 
    text: 'Validator 验证逻辑', 
    textEn: 'Validator verifying',
    subText: '确保正确性'
  },
  { 
    icon: <Zap className="w-4 h-4" />, 
    text: '优化最终答案', 
    textEn: 'Optimizing answer',
    subText: '提升质量'
  },
];

interface ThinkingIndicatorProps {
  isThinking: boolean;
  currentStage?: number;
  showBrand?: boolean;
  compact?: boolean;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  isThinking,
  currentStage = 0,
  showBrand = true,
  compact = false,
}) => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!isThinking) {
      setStageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % THINKING_STAGES.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isThinking]);

  const currentStageData = THINKING_STAGES[stageIndex];

  return (
    <AnimatePresence>
      {isThinking && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`flex items-center gap-3 ${compact ? 'px-3 py-2' : 'px-4 py-3'} bg-gray-800/80 rounded-xl border border-gray-700`}
        >
          {/* Brand Icon */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center"
          >
            <Brain className="w-4 h-4 text-amber-400" />
          </motion.div>

          {/* Content */}
          <div className="flex-1">
            {/* Main Text */}
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-medium">
                <Pick cn="MaoAI" en="MaoAI" />
              </span>
              <span className="text-gray-300">
                <Pick cn={currentStageData.text} en={currentStageData.textEn} />
              </span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-amber-400"
              >
                ...
              </motion.span>
            </div>

            {/* Sub Text & Progress */}
            {!compact && (
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-gray-500">
                  {currentStageData.subText}
                </span>
                
                {/* TriadLoop Stage Indicator */}
                <div className="flex items-center gap-1">
                  {THINKING_STAGES.map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        scale: i <= stageIndex ? 1.2 : 1,
                        backgroundColor: i <= stageIndex ? '#f59e0b' : '#374151',
                      }}
                      transition={{ duration: 0.2 }}
                      className="w-1.5 h-1.5 rounded-full"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Brand Badge */}
          {showBrand && !compact && (
            <div className="text-xs text-gray-500">
              {BRAND_INFO.nameCn}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Compact version for inline use
export const ThinkingCompact: React.FC<{ isThinking: boolean }> = ({ isThinking }) => {
  return (
    <ThinkingIndicator 
      isThinking={isThinking} 
      showBrand={false}
      compact={true}
    />
  );
};

// Loading dots animation
export const ThinkingDots: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-1"
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1,
          }}
          className="w-1.5 h-1.5 bg-amber-400 rounded-full"
        />
      ))}
    </motion.div>
  );
};

// Full thinking state with multiple stages
interface FullThinkingProps {
  progress?: number; // 0-100
  currentAction?: string;
}

export const FullThinkingIndicator: React.FC<FullThinkingProps> = ({
  progress = 0,
  currentAction = '分析中',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gray-900/90 rounded-xl border border-amber-500/30 p-4 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center"
        >
          <Brain className="w-5 h-5 text-amber-400" />
        </motion.div>
        <div>
          <div className="font-medium text-amber-400">
            MaoAI {BRAND_INFO.tagline}
          </div>
          <div className="text-xs text-gray-500">
            Mc&Mamoo Growth Engine
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{currentAction}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-amber-500 rounded-full"
          />
        </div>
      </div>

      {/* TriadLoop Status */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className={`p-2 rounded-lg ${progress < 25 ? 'bg-amber-500/20' : 'bg-gray-800'}`}>
          <div className="text-xs text-gray-400">Coder</div>
          <div className={`text-xs ${progress < 25 ? 'text-amber-400' : 'text-gray-500'}`}>
            {progress < 25 ? '运行中' : '完成'}
          </div>
        </div>
        <div className={`p-2 rounded-lg ${progress >= 25 && progress < 75 ? 'bg-amber-500/20' : 'bg-gray-800'}`}>
          <div className="text-xs text-gray-400">Reviewer</div>
          <div className={`text-xs ${progress >= 25 && progress < 75 ? 'text-amber-400' : 'text-gray-500'}`}>
            {progress < 25 ? '等待' : progress < 75 ? '运行中' : '完成'}
          </div>
        </div>
        <div className={`p-2 rounded-lg ${progress >= 75 ? 'bg-amber-500/20' : 'bg-gray-800'}`}>
          <div className="text-xs text-gray-400">Validator</div>
          <div className={`text-xs ${progress >= 75 ? 'text-amber-400' : 'text-gray-500'}`}>
            {progress < 75 ? '等待' : '运行中'}
          </div>
        </div>
      </div>
    </motion.div>
  );
};