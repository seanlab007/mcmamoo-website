/**
 * MaoAI 定价方案 v5.0
 * 
 * 定价原则：
 * - 所有价格以9结尾
 * - 加价率 >= 1000倍（成本¥1 → 收费≥¥1000）
 * - 利润允许超过1000倍
 * 
 * 更新日期：2026-04-22
 */

export interface Plan {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  monthlyPrice: number;      // 月付（单位：元）
  yearlyPrice: number;      // 年付（单位：元，享83折）
  tokensPerMonth: number;    // 每月Token限额
  costEstimate: number;      // API成本估算（单位：元）
  markup: number;            // 加价率（倍）
  features: string[];
  highlight?: boolean;       // 是否推荐
  badge?: string;           // 标签（如"推荐"）
}

// Token成本估算（基于DeepSeek V3输入¥1.8/百万，输出¥7.2/百万，均值约¥3.6/百万）
// 平均消息：600 input + 300 output tokens
// 单条消息成本：600/1,000,000 × ¥1.8 + 300/1,000,000 × ¥7.2 = ¥0.003
// 但我们用更保守的估算：¥3/百万tokens

const TOKEN_COST_PER_MILLION = 3; // 元/百万tokens

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: '免费版',
    nameEn: 'Free',
    description: '零成本体验AI能力',
    descriptionEn: 'Zero-cost AI experience',
    monthlyPrice: 0,
    yearlyPrice: 0,
    tokensPerMonth: 10000,
    costEstimate: TOKEN_COST_PER_MILLION * 0.01, // ¥0.03
    markup: 0, // 免费
    features: [
      '每日 10,000 tokens',
      'DeepSeek V3 模型',
      '基础对话能力',
      '多轮对话记忆',
      'Web搜索集成',
      '今日24:00重置',
    ],
  },
  {
    id: 'starter',
    name: '入门版',
    nameEn: 'Starter',
    description: '轻量级AI辅助',
    descriptionEn: 'Light AI assistance',
    monthlyPrice: 99,
    yearlyPrice: 999,
    tokensPerMonth: 30000,
    costEstimate: TOKEN_COST_PER_MILLION * 0.03, // ¥0.09
    markup: 99 / 0.09, // 1100x
    features: [
      '每月 30,000 tokens',
      'DeepSeek V3 模型',
      '多模型切换（GLM-4）',
      '增强上下文记忆',
      '图片理解',
      '代码助手',
      '优先响应',
      '年付仅 ¥999/年',
    ],
  },
  {
    id: 'pro',
    name: '专业版',
    nameEn: 'Professional',
    description: '高强度创作利器',
    descriptionEn: 'High-intensity creative tool',
    monthlyPrice: 999,
    yearlyPrice: 9999,
    tokensPerMonth: 100000,
    costEstimate: TOKEN_COST_PER_MILLION * 0.1, // ¥0.3
    markup: 999 / 0.3, // 3330x
    features: [
      '每月 100,000 tokens',
      'DeepSeek V3 + R1',
      'Groq 极速模型',
      'Gemini 多模态',
      '专业级Agent能力',
      '知识库管理',
      '高级上下文（128K）',
      '24/7优先支持',
      '年付仅 ¥9,999/年',
    ],
    highlight: true,
    badge: '推荐',
  },
  {
    id: 'enterprise',
    name: '旗舰版',
    nameEn: 'Enterprise',
    description: '企业级AI解决方案',
    descriptionEn: 'Enterprise AI solution',
    monthlyPrice: 9999,
    yearlyPrice: 99999,
    tokensPerMonth: 1000000,
    costEstimate: TOKEN_COST_PER_MILLION * 1, // ¥1
    markup: 9999, // 9999x
    features: [
      '每月 1,000,000 tokens',
      '全部模型访问权限',
      'Claude/Gemini Pro',
      '无限Agent工作流',
      '私有知识库',
      'API集成支持',
      '专属客户经理',
      'SLA保障',
      '定制化训练',
      '年付仅 ¥99,999/年',
    ],
  },
];

// Token成本计算
export const calculateTokenCost = (tokens: number): number => {
  return (tokens / 1_000_000) * TOKEN_COST_PER_MILLION;
};

// 辅助函数：获取plan显示价格
export const getDisplayPrice = (plan: Plan, isYearly: boolean): string => {
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  if (price === 0) return '免费';
  return `¥${price}`;
};

// 辅助函数：获取月均价格（年付时）
export const getMonthlyAverage = (plan: Plan): string => {
  if (plan.yearlyPrice === 0) return '免费';
  const monthly = plan.yearlyPrice / 12;
  return `¥${Math.round(monthly)}/月`;
};