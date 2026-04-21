/**
 * MaoAI 定价方案 v7.0
 * 
 * 核心策略：
 * - 免费/入门版：体现模型强大，只限制次数（销售钩子）
 * - 对话中实时提示升级优势
 * - 所有价格以9结尾，加价率>=1000倍
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
  callsPerDay?: number;
  callsPerMonth?: number;
  features: string[];
  modelTier: 'basic' | 'advanced' | 'strategic';
  modelDescription: string;
  highlight?: boolean;
  badge?: string;
  // 销售钩子
  salesHook: string;          // 对话中展示的销售话术
  unlockedPower: string[];    // 解锁后的强大能力
}

export const PLANS: Plan[] = [
  // ===== 免费版：模型强大，次数有限 =====
  {
    id: 'free',
    name: '体验版',
    nameEn: 'Free Trial',
    description: '专业级AI能力，每日免费体验',
    descriptionEn: 'Professional AI, free daily experience',
    monthlyPrice: 0,
    yearlyPrice: 0,
    callsPerDay: 10,
    modelTier: 'advanced',
    modelDescription: 'DeepSeek V3 + R1 + 图片理解',
    features: [
      '🔥 相同模型能力：V3 + R1 推理',
      '🔥 相同功能：多模态理解、代码助手',
      '🔥 相同质量：128K 超长上下文',
      '📊 每日 10 次调用（今日剩余：X）',
      '⏰ 24:00 免费重置',
    ],
    // 销售钩子
    salesHook: '💡 这只是冰山一角！升级后解锁：',
    unlockedPower: [
      '🔓 无限次调用（不再倒数）',
      '🧠 DeepSeek R1 深度推理模式',
      '⚡ Groq 极速响应（3倍速）',
      '📚 毛泽东战略思维（博弈推理）',
      '💎 专业级知识库管理',
    ],
  },
  
  // ===== 入门版 =====
  {
    id: 'starter',
    name: '入门版',
    nameEn: 'Starter',
    description: '强大的AI助手，每天99次',
    descriptionEn: 'Powerful AI assistant, 99 daily',
    monthlyPrice: 99,
    yearlyPrice: 999,
    callsPerDay: 99,
    modelTier: 'advanced',
    modelDescription: 'DeepSeek V3 + R1 + 图片理解',
    features: [
      '🔥 全模型能力：V3 + R1 + 图片理解',
      '🔥 专业功能：代码助手、Web搜索',
      '🔥 无限记忆：多轮对话上下文',
      '📊 每日 99 次调用（今日剩余：X）',
      '⚡ 高速响应，优先队列',
    ],
    salesHook: '💡 想要更强大的AI？升级解锁：',
    unlockedPower: [
      '🔓 无限次调用（不再限制次数）',
      '🧠 TriadLoop 三权分立推理',
      '⚖️ 五层分权决策架构',
      '📖 毛泽东思想向量库',
      '🎯 战略级问题分析',
    ],
  },
  
  // ===== 专业版 =====
  {
    id: 'pro',
    name: '专业版',
    nameEn: 'Professional',
    description: '无限次 + 全模型 + 战略思维',
    descriptionEn: 'Unlimited + Full Models + Strategic Thinking',
    monthlyPrice: 999,
    yearlyPrice: 9999,
    callsPerMonth: 99999,
    modelTier: 'advanced',
    modelDescription: 'V3 + R1 + Groq + Gemini + 基础战略',
    features: [
      '✅ 无限次调用（无限制）',
      '✅ 全模型访问：V3/R1/Groq/Gemini',
      '✅ TriadLoop 三权分立推理',
      '✅ 五层分权架构（基础版）',
      '✅ 毛泽东战略基础向量库',
      '✅ 知识库管理 + 128K上下文',
    ],
    salesHook: '💡 想要最高级战略AI？升级解锁：',
    unlockedPower: [
      '🧠 毛泽东思想完整向量库',
      '⚖️ 五层战略架构（完整版）',
      '🔄 TriadLoop 5轮深度博弈',
      '🎯 战略级博弈推理',
      '📊 历史案例智能匹配',
      '💎 专属战略顾问支持',
    ],
    highlight: true,
    badge: '推荐',
  },
  
  // ===== 战略版 =====
  {
    id: 'strategic',
    name: '战略版',
    nameEn: 'Strategic',
    description: '毛泽东思想向量库 + 完整战略AI',
    descriptionEn: 'Mao Zedong Thought Vector + Full Strategic AI',
    monthlyPrice: 99999,
    yearlyPrice: 999999,
    modelTier: 'strategic',
    modelDescription: '毛泽东思想向量库 + 五层架构 + TriadLoop',
    features: [
      '🧠 毛泽东思想完整向量库（亿级tokens）',
      '⚖️ 五层分权架构（完整决策系统）',
      '🔄 TriadLoop 博弈循环（5轮推理）',
      '🎯 战略级问题分析',
      '📊 历史案例智能匹配',
      '📈 博弈论决策优化',
      '🔮 战略趋势预测',
      '💎 专属战略顾问 + 7×24支持',
    ],
    salesHook: '💡 企业级定制？升级解锁：',
    unlockedPower: [
      '🏢 私有化部署',
      '🎓 专属模型微调训练',
      '📦 企业知识库深度整合',
      '🔗 API全权限访问',
      '🛡️ 独立服务器 + 技术团队',
    ],
  },
  
  // ===== 企业版 =====
  {
    id: 'enterprise',
    name: '企业版',
    nameEn: 'Enterprise',
    description: '500万年费封顶 · 定制化战略AI',
    descriptionEn: '¥5M/year cap · Customized Strategic AI',
    monthlyPrice: 499999,
    yearlyPrice: 4999999,
    modelTier: 'strategic',
    modelDescription: '私有化毛泽东战略AI + 专属模型',
    features: [
      '💰 500万/年封顶价',
      '🏢 私有化毛泽东战略模型',
      '🎓 专属模型微调训练',
      '📦 企业知识库深度整合',
      '🔗 API全权限 + 独立服务器',
      '👥 专属技术团队 + 战略培训',
      '📋 年度战略咨询',
      '⚙️ 无限定制开发',
    ],
    salesHook: '🌟 尊享服务已开启',
    unlockedPower: [],
  },
];

// 升级提示组件配置
export const UPGRADE_PROMPTS = {
  // 对话中使用次数警告时的销售钩子
  lowCallsWarning: (plan: Plan) => `
🎯 **今日剩余次数不足**

您正在使用的是 ${plan.name}，包含以下强大功能：
${plan.features.slice(0, 3).map(f => `- ${f}`).join('\n')}

${plan.salesHook}
${plan.unlockedPower.slice(0, 3).map(p => `- ${p}`).join('\n')}

💰 升级到 ${plan.id === 'free' ? '入门版 ¥99/月' : '专业版 ¥999/月'}
即可解锁无限次调用和更多高级功能！
  `,
  
  // 升级建议话术
  upgradeSuggestion: (plan: Plan) => `
💡 **升级解锁更多可能**

当前 ${plan.name} 的强大能力：
${plan.features.slice(0, 3).map((f, i) => `${i + 1}. ${f}`).join('\n')}

${plan.salesHook}
${plan.unlockedPower.map(p => `- ${p}`).join('\n')}

✨ 现在升级，享受 **17% 年付优惠**！
  `,
  
  // 功能解锁提示
  featureLocked: (feature: string, plan: Plan) => `
🔒 **功能锁定：${feature}**

此功能需要 ${plan.name} 或更高版本。

${plan.salesHook}
${plan.unlockedPower.slice(0, 2).map(p => `- ${p}`).join('\n')}

升级解锁此功能，每月仅需 ¥${plan.monthlyPrice || 99} 起！
  `,
};

// 模型能力说明
export const MODEL_POWER = {
  basic: {
    name: '基础模型',
    power: '🚀 高速响应，智能对话',
    models: ['DeepSeek V3'],
    icon: '⚡',
  },
  advanced: {
    name: '高级模型',
    power: '🧠 专业推理，多模态理解',
    models: ['V3', 'R1（推理）', '图片理解', '代码助手'],
    icon: '🔥',
  },
  strategic: {
    name: '战略模型',
    power: '🎯 博弈推理，战略决策',
    models: ['毛泽东思想向量', '五层架构', 'TriadLoop'],
    icon: '💎',
  },
};

// 能力对比表
export const CAPABILITY_COMPARISON = [
  // 调用相关
  { category: '📊 调用限制', items: [
    { feature: '每日调用次数', free: '10次', starter: '99次', pro: '无限', strategic: '无限', enterprise: '无限' },
  ]},
  // 模型能力
  { category: '🧠 模型能力', items: [
    { feature: 'DeepSeek V3（基础对话）', free: '✅', starter: '✅', pro: '✅', strategic: '✅', enterprise: '✅' },
    { feature: 'DeepSeek R1（深度推理）', free: '✅', starter: '✅', pro: '✅', strategic: '✅', enterprise: '✅' },
    { feature: '图片理解', free: '✅', starter: '✅', pro: '✅', strategic: '✅', enterprise: '✅' },
    { feature: '代码助手', free: '✅', starter: '✅', pro: '✅', strategic: '✅', enterprise: '✅' },
    { feature: 'Groq 极速响应（3x）', free: '❌', starter: '❌', pro: '✅', strategic: '✅', enterprise: '✅' },
    { feature: 'Gemini 多模态', free: '❌', starter: '❌', pro: '✅', strategic: '✅', enterprise: '✅' },
  ]},
  // 战略能力
  { category: '⚖️ 战略思维', items: [
    { feature: 'TriadLoop 三权分立', free: '❌', starter: '❌', pro: '✅', strategic: '✅', enterprise: '✅' },
    { feature: '五层分权架构', free: '❌', starter: '❌', pro: '⚠️ 基础', strategic: '✅ 完整', enterprise: '✅ 完整' },
    { feature: '毛泽东思想向量库', free: '❌', starter: '❌', pro: '⚠️ 入门', strategic: '✅ 完整', enterprise: '✅ 企业级' },
    { feature: '战略博弈推理', free: '❌', starter: '❌', pro: '❌', strategic: '✅', enterprise: '✅' },
    { feature: '历史案例智能匹配', free: '❌', starter: '❌', pro: '❌', strategic: '✅', enterprise: '✅' },
  ]},
  // 企业能力
  { category: '🏢 企业服务', items: [
    { feature: 'API 访问', free: '❌', starter: '❌', pro: '⚠️ 基础', strategic: '✅', enterprise: '✅' },
    { feature: '私有化部署', free: '❌', starter: '❌', pro: '❌', strategic: '❌', enterprise: '✅' },
    { feature: '专属模型训练', free: '❌', starter: '❌', pro: '❌', strategic: '❌', enterprise: '✅' },
    { feature: '专属技术团队', free: '❌', starter: '❌', pro: '❌', strategic: '❌', enterprise: '✅' },
  ]},
];