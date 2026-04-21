/**
 * MaoAI 定价方案 v6.0
 * 
 * 核心策略：
 * - 免费版：限制调用次数，可体验专业功能（爽一下策略）
 * - 所有价格以9结尾
 * - 加价率 >= 1000倍（利润允许超过1000倍）
 * 
 * 模型差异化：
 * - 基础模型：DeepSeek V3 / GLM-4
 * - 高级模型：DeepSeek R1 / Groq / Gemini
 * - 战略模型：毛泽东思想向量库 + 五层分权架构 + TriadLoop
 * 
 * 更新日期：2026-04-22
 */

export interface Plan {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  monthlyPrice: number;
  yearlyPrice: number;
  callsPerDay?: number;      // 每日调用次数（免费/入门版）
  callsPerMonth?: number;     // 每月调用次数（专业版）
  features: string[];
  modelTier: 'basic' | 'advanced' | 'strategic';
  modelDescription: string;
  highlight?: boolean;
  badge?: string;
  unlockedCapabilities: string[]; // 解锁的能力
}

export const PLANS: Plan[] = [
  // ===== 免费版：爽一下策略 =====
  {
    id: 'free',
    name: '体验版',
    nameEn: 'Free Trial',
    description: '每天10次专业级体验',
    descriptionEn: '10 professional calls daily',
    monthlyPrice: 0,
    yearlyPrice: 0,
    callsPerDay: 10,
    modelTier: 'advanced',
    modelDescription: 'DeepSeek V3 + R1（推理）',
    features: [
      '每日 10 次调用',
      '体验专业版全部能力',
      'DeepSeek V3 高速响应',
      '免费体验复杂推理（R1）',
      '图片理解',
      '今日24:00重置',
    ],
    unlockedCapabilities: [
      '多模型切换',
      '复杂推理分析',
      '图片理解',
      '代码助手',
      'Web搜索',
      '💡 升级解锁无限次调用',
    ],
  },
  
  // ===== 入门版 =====
  {
    id: 'starter',
    name: '入门版',
    nameEn: 'Starter',
    description: '每天99次基础调用',
    descriptionEn: '99 daily basic calls',
    monthlyPrice: 99,
    yearlyPrice: 999,
    callsPerDay: 99,
    modelTier: 'basic',
    modelDescription: 'DeepSeek V3',
    features: [
      '每日 99 次调用',
      '基础AI对话能力',
      'DeepSeek V3 模型',
      '多轮对话记忆',
      '代码助手',
      'Web搜索',
    ],
    unlockedCapabilities: [
      '无限对话次数',
      '基础模型访问',
      '代码助手',
      'Web搜索',
      '💡 升级解锁高级推理',
    ],
  },
  
  // ===== 专业版 =====
  {
    id: 'pro',
    name: '专业版',
    nameEn: 'Professional',
    description: '无限次+全模型+战略思维',
    descriptionEn: 'Unlimited + Full Models + Strategic Thinking',
    monthlyPrice: 999,
    yearlyPrice: 9999,
    callsPerMonth: 99999, // 实际上不限
    modelTier: 'advanced',
    modelDescription: 'V3 + R1 + Groq + Gemini + 基础战略',
    features: [
      '无限次调用',
      '全模型访问（V3/R1/Groq/Gemini）',
      'TriadLoop 三权分立推理',
      '五层分权架构（决策优化）',
      '毛泽东战略基础库',
      '知识库管理',
      '高级上下文（128K）',
      '24/7 优先支持',
    ],
    unlockedCapabilities: [
      '✅ 全模型访问',
      '✅ TriadLoop 博弈推理',
      '✅ 五层分权决策',
      '✅ 战略基础向量库',
      '✅ 无限次调用',
      '💡 升级解锁完整毛泽东战略',
    ],
    highlight: true,
    badge: '推荐',
  },
  
  // ===== 战略版（毛泽东思想）=====
  {
    id: 'strategic',
    name: '战略版',
    nameEn: 'Strategic',
    description: '毛泽东思想向量库 + 完整战略AI',
    descriptionEn: 'Mao Zedong Thought Vector + Full Strategic AI',
    monthlyPrice: 99999,
    yearlyPrice: 999999,
    callsPerMonth: 999999,
    modelTier: 'strategic',
    modelDescription: '毛泽东思想向量库 + 五层架构 + TriadLoop + 完整战略模型',
    features: [
      '毛泽东思想向量库（完整版）',
      '五层分权架构（完整决策系统）',
      'TriadLoop 博弈循环（5轮深度推理）',
      '战略级问题分析',
      '博弈论决策优化',
      '历史案例智能匹配',
      '战略趋势预测',
      '专属战略顾问',
      'API集成支持',
      '7×24 专属客服',
    ],
    unlockedCapabilities: [
      '✅ 毛泽东思想完整向量库',
      '✅ 五层战略架构（完整版）',
      '✅ TriadLoop 5轮博弈',
      '✅ 战略级AI决策',
      '✅ 历史案例智能库',
      '✅ 趋势预测分析',
      '✅ 专属战略顾问',
    ],
  },
  
  // ===== 企业战略版（500万封顶）=====
  {
    id: 'enterprise',
    name: '企业战略版',
    nameEn: 'Enterprise Strategic',
    description: '500万年费封顶 · 定制化战略AI',
    descriptionEn: '¥5M/year cap · Customized Strategic AI',
    monthlyPrice: 499999,
    yearlyPrice: 4999999,
    modelTier: 'strategic',
    modelDescription: '私有化毛泽东战略AI + 专属模型训练',
    features: [
      '500万/年封顶价',
      '私有化毛泽东战略模型',
      '专属模型微调训练',
      '企业知识库深度整合',
      'API全权限访问',
      '独立服务器部署',
      '专属技术团队',
      '战略培训支持',
      '年度战略咨询',
      '无限定制开发',
    ],
    unlockedCapabilities: [
      '✅ 私有化部署',
      '✅ 专属模型训练',
      '✅ 完整企业集成',
      '✅ 无限API调用',
      '✅ 独立服务器',
      '✅ 专属技术团队',
    ],
  },
];

// 模型等级说明
export const MODEL_TIERS = {
  basic: {
    name: '基础模型',
    models: ['DeepSeek V3', 'GLM-4 Flash'],
    description: '高速响应，适用日常对话',
    color: 'gray',
  },
  advanced: {
    name: '高级模型',
    models: ['DeepSeek V3 + R1', 'Groq Llama', 'Gemini 2.0'],
    description: '复杂推理+多模态+极速响应',
    color: 'amber',
  },
  strategic: {
    name: '战略模型',
    models: ['毛泽东思想向量库', '五层分权架构', 'TriadLoop'],
    description: '博弈推理+战略决策+历史智慧',
    color: 'red',
  },
};

// 能力对比
export const CAPABILITY_COMPARISON = [
  { feature: '每日调用次数', free: '10次/天', starter: '99次/天', pro: '无限', strategic: '无限', enterprise: '无限' },
  { feature: '基础对话', free: '✅', starter: '✅', pro: '✅', strategic: '✅', enterprise: '✅' },
  { feature: 'DeepSeek V3', free: '✅', starter: '✅', pro: '✅', strategic: '✅', enterprise: '✅' },
  { feature: 'DeepSeek R1 推理', free: '✅', starter: '❌', pro: '✅', strategic: '✅', enterprise: '✅' },
  { feature: 'Groq 极速模型', free: '❌', starter: '❌', pro: '✅', strategic: '✅', enterprise: '✅' },
  { feature: 'Gemini 多模态', free: '❌', starter: '❌', pro: '✅', strategic: '✅', enterprise: '✅' },
  { feature: 'TriadLoop 三权分立', free: '❌', starter: '❌', pro: '✅', strategic: '✅', enterprise: '✅' },
  { feature: '五层分权架构', free: '❌', starter: '❌', pro: '⚠️ 基础', strategic: '✅ 完整', enterprise: '✅ 完整' },
  { feature: '毛泽东思想向量库', free: '❌', starter: '❌', pro: '⚠️ 基础', strategic: '✅ 完整', enterprise: '✅ 企业级' },
  { feature: '战略博弈推理', free: '❌', starter: '❌', pro: '❌', strategic: '✅', enterprise: '✅' },
  { feature: '专属战略顾问', free: '❌', starter: '❌', pro: '❌', strategic: '✅', enterprise: '✅' },
  { feature: '私有化部署', free: '❌', starter: '❌', pro: '❌', strategic: '❌', enterprise: '✅' },
  { feature: '专属模型训练', free: '❌', starter: '❌', pro: '❌', strategic: '❌', enterprise: '✅' },
];

// 成本估算（API成本）
export const estimateCost = (calls: number, tier: 'basic' | 'advanced' | 'strategic'): number => {
  const costPerCall = { basic: 0.01, advanced: 0.05, strategic: 0.5 };
  return calls * costPerCall[tier];
};