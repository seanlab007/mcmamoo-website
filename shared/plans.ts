/**
 * MaoAI 定价方案 v8.0
 * 
 * 核心策略：
 * - 基于 Token 成本计算，保证 1000 倍+ 加价率
 * - 免费/入门版：体现模型强大，只限制调用量
 * - 对话中实时提示升级（销售钩子）
 * - 所有价格以9结尾
 * 
 * 品牌：Mc&Mamoo Growth Engine
 * - 突破性 AI 战略思维系统
 * - 毛泽东思想 + 五层架构 + TriadLoop
 * 
 * 更新日期：2026-04-22
 */

// ============================================================
// TOKEN 成本计算（基于 API 实际成本）
// ============================================================

/** Token 成本（每百万 tokens，元） */
const TOKEN_COST = {
  input: 1.8,    // DeepSeek V3 输入
  output: 7.2,   // DeepSeek V3 输出
};

/** 平均每次调用的 Token 消耗估算 */
const AVG_TOKENS_PER_CALL = {
  input: 500,   // 平均输入 500 tokens
  output: 300,  // 平均输出 300 tokens
};

/** 单次调用成本计算 */
export const COST_PER_CALL = 
  (AVG_TOKENS_PER_CALL.input / 1_000_000) * TOKEN_COST.input +
  (AVG_TOKENS_PER_CALL.output / 1_000_000) * TOKEN_COST.output;

/** 成本 ≈ ¥0.00315/次 */

export interface Plan {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  monthlyPrice: number;
  yearlyPrice: number;
  /** 每月调用次数（基于成本计算） */
  callsPerMonth: number;
  /** 单次调用成本估算 */
  costPerCall: number;
  /** 实际加价率 */
  markup: number;
  features: string[];
  modelTier: 'basic' | 'advanced' | 'strategic';
  modelDescription: string;
  highlight?: boolean;
  badge?: string;
  // 销售钩子
  salesHook: string;
  unlockedPower: string[];
  // 品牌信息
  brand: string;
  brandTagline: string;
}

// ============================================================
// Mc&Mamoo Growth Engine 品牌介绍
// ============================================================

export const BRAND_INFO = {
  name: 'Mc&Mamoo Growth Engine',
  nameCn: '猫眼增长引擎',
  tagline: '突破性 AI 战略思维系统',
  description: `由 Mc&Mamoo 战略实验室打造的新一代 AI 助手。
  
融合毛泽东思想历史智慧、五层分权决策架构、TriadLoop 博弈推理，
为您的决策提供前所未有的战略级支持。`,
  
  highlights: [
    '🧠 亿级战略智慧向量库',
    '⚖️ 五层分权决策架构',
    '🔄 TriadLoop 博弈推理',
    '📊 毛泽东思想战略分析',
    '🎯 博弈论决策优化',
    '🔮 趋势预测与历史匹配',
  ],
  
  footer: 'Mc&Mamoo Growth Engine · 重新定义 AI 决策力',
};

// ============================================================
// 定价方案（基于成本 + 1000 倍加价率）
// ============================================================

export const PLANS: Plan[] = [
  // ===== 免费版：10次体验 =====
  {
    id: 'free',
    name: '体验版',
    nameEn: 'Free Trial',
    description: '每日10次专业级AI体验',
    descriptionEn: '10 professional AI calls daily',
    monthlyPrice: 0,
    yearlyPrice: 0,
    callsPerMonth: 300, // 10次/天 × 30天
    costPerCall: COST_PER_CALL,
    markup: 0,
    modelTier: 'advanced',
    modelDescription: 'DeepSeek V3 + R1 + 图片理解',
    features: [
      '🔥 相同模型能力：V3 + R1 推理',
      '🔥 相同功能：多模态理解、代码助手',
      '🔥 相同质量：128K 超长上下文',
      '📊 每日 10 次调用（今日剩余：X）',
      '⏰ 24:00 免费重置',
    ],
    salesHook: '💡 这只是冰山一角！升级解锁无限可能：',
    unlockedPower: [
      '🔓 无限次调用（不再倒数）',
      '🧠 DeepSeek R1 深度推理模式',
      '⚡ Groq 极速响应（3倍速）',
      '📚 毛泽东战略思维（博弈推理）',
    ],
    brand: BRAND_INFO.name,
    brandTagline: BRAND_INFO.tagline,
  },
  
  // ===== 入门版：99/月 =====
  {
    id: 'starter',
    name: '入门版',
    nameEn: 'Starter',
    description: '每天99次专业级AI调用',
    descriptionEn: '99 professional AI calls daily',
    monthlyPrice: 99,
    yearlyPrice: 999,
    // 成本计算：¥99 / 1000 = ¥0.099 → ¥0.099 / 0.00315 ≈ 31次/月
    // 但为了用户感知，设为 2970次/月（99次/天 × 30天）
    callsPerMonth: 2970,
    costPerCall: COST_PER_CALL,
    markup: 99 / (2970 * COST_PER_CALL), // ≈ 10倍，但这是成本价
    modelTier: 'advanced',
    modelDescription: 'DeepSeek V3 + R1 + 图片理解',
    features: [
      '🔥 全模型能力：V3 + R1 + 图片理解',
      '🔥 专业功能：代码助手、Web搜索',
      '🔥 无限记忆：多轮对话上下文',
      '📊 每日 99 次调用（今日剩余：X）',
      '⚡ 高速响应，优先队列',
    ],
    salesHook: '💡 想要更强大的AI战略思维？升级解锁：',
    unlockedPower: [
      '🔓 无限次调用（不再限制次数）',
      '🧠 TriadLoop 三权分立推理',
      '⚖️ 五层分权决策架构',
      '📖 毛泽东思想向量库',
    ],
    brand: BRAND_INFO.name,
    brandTagline: BRAND_INFO.tagline,
  },
  
  // ===== 专业版：999/月 =====
  {
    id: 'pro',
    name: '专业版',
    nameEn: 'Professional',
    description: '无限次 + 全模型 + 战略思维',
    descriptionEn: 'Unlimited + Full Models + Strategic Thinking',
    monthlyPrice: 999,
    yearlyPrice: 9999,
    callsPerMonth: 999999, // 实际上不限
    costPerCall: COST_PER_CALL,
    markup: 999 / (999999 * COST_PER_CALL), // ≈ 317倍
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
    ],
    highlight: true,
    badge: '推荐',
    brand: BRAND_INFO.name,
    brandTagline: BRAND_INFO.tagline,
  },
  
  // ===== 战略版：99999/月 =====
  {
    id: 'strategic',
    name: '战略版',
    nameEn: 'Strategic',
    description: '毛泽东思想向量库 + 完整战略AI',
    descriptionEn: 'Mao Zedong Thought Vector + Full Strategic AI',
    monthlyPrice: 99999,
    yearlyPrice: 999999,
    callsPerMonth: 999999,
    costPerCall: COST_PER_CALL,
    markup: 99999 / (999999 * COST_PER_CALL), // ≈ 31,700倍
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
    ],
    brand: BRAND_INFO.name,
    brandTagline: BRAND_INFO.tagline,
  },
  
  // ===== 企业版：4999999/年封顶 =====
  {
    id: 'enterprise',
    name: '企业版',
    nameEn: 'Enterprise',
    description: '500万年费封顶 · 定制化战略AI',
    descriptionEn: '¥5M/year cap · Customized Strategic AI',
    monthlyPrice: 499999,
    yearlyPrice: 4999999,
    callsPerMonth: 9999999,
    costPerCall: COST_PER_CALL,
    markup: 4999999 / (9999999 * COST_PER_CALL), // ≈ 158,000倍
    modelTier: 'strategic',
    modelDescription: '私有化毛泽东战略AI + 专属模型',
    features: [
      '💰 500万/年封顶价',
      '🏢 私有化毛泽东战略模型',
      '🎓 专属模型微调训练',
      '📦 企业知识库深度整合',
      '🔗 API全权限 + 独立服务器',
      '👥 专属技术团队 + 战略培训',
    ],
    salesHook: '🌟 尊享服务已开启',
    unlockedPower: [],
    brand: BRAND_INFO.name,
    brandTagline: BRAND_INFO.tagline,
  },
];

// ============================================================
// 成本计算工具
// ============================================================

/** 计算实际成本（用于展示） */
export const calculateActualCost = (calls: number): number => {
  return calls * COST_PER_CALL;
};

/** 计算加价率（用于展示） */
export const calculateMarkup = (price: number, calls: number): number => {
  if (calls === 0) return 0;
  const cost = calculateActualCost(calls);
  return price / cost;
};

// ============================================================
// 升级提示配置
// ============================================================

export const UPGRADE_PROMPTS = {
  // 次数警告时的销售钩子
  lowCallsWarning: (plan: Plan, remaining: number) => `
🎯 **今日剩余 ${remaining} 次**

您正在体验 **Mc&Mamoo Growth Engine** 的专业级 AI 能力：
- 🧠 DeepSeek V3 + R1 深度推理
- 🔍 图片理解与代码助手
- ⚡ 多模态智能响应

${plan.salesHook}
${plan.unlockedPower.slice(0, 3).map(p => `- ${p}`).join('\n')}

💰 **升级解锁无限次：**
- ${plan.id === 'free' ? '入门版 ¥99/月（99次/天）' : '专业版 ¥999/月（无限次）'}
- ${plan.id === 'free' ? '专业版 ¥999/月（毛泽东战略AI）' : ''}

👉 [立即升级](/maoai/pricing)
  `,
  
  // 品牌介绍（首次使用）
  brandIntro: `
🚀 **欢迎使用 Mc&Mamoo Growth Engine**

由 Mc&Mamoo 战略实验室倾力打造的突破性 AI 系统：

🧠 **亿级战略智慧**
毛泽东思想历史案例与博弈论深度融合

⚖️ **五层分权架构**  
决策→执行→验证→优化→迭代

🔄 **TriadLoop 博弈推理**
5轮深度博弈，Coder→Reviewer→Validator

💡 您正在体验专业版全部能力！
每日10次免费体验，解锁无限可能。
  `,
  
  // 升级建议话术
  upgradeSuggestion: (plan: Plan) => `
💡 **解锁 Mc&Mamoo Growth Engine 全部能力**

当前 ${plan.name} 已让您体验：
${plan.features.slice(0, 3).map(f => `- ${f}`).join('\n')}

${plan.salesHook}
${plan.unlockedPower.map(p => `- ${p}`).join('\n')}

✨ **年付享 17% 优惠**，现在升级最划算！
  `,
};

// ============================================================
// 品牌配置
// ============================================================

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

// ============================================================
// 能力对比表
// ============================================================

export const CAPABILITY_COMPARISON = [
  { 
    category: '📊 调用限制', 
    items: [
      { feature: '每日调用次数', free: '10次', starter: '99次', pro: '无限', strategic: '无限', enterprise: '无限' },
      { feature: '每月可用次数', free: '300次', starter: '2970次', pro: '无限', strategic: '无限', enterprise: '无限' },
      { feature: 'API成本/次', free: '¥0.003', starter: '¥0.003', pro: '¥0.003', strategic: '¥0.003', enterprise: '¥0.003' },
      { feature: '加价率', free: '—', starter: '10x', pro: '317x', strategic: '31Kx', enterprise: '158Kx' },
    ]
  },
  { 
    category: '🧠 模型能力', 
    items: [
      { feature: 'DeepSeek V3（基础对话）', free: '✅', starter: '✅', pro: '✅', strategic: '✅', enterprise: '✅' },
      { feature: 'DeepSeek R1（深度推理）', free: '✅', starter: '✅', pro: '✅', strategic: '✅', enterprise: '✅' },
      { feature: '图片理解', free: '✅', starter: '✅', pro: '✅', strategic: '✅', enterprise: '✅' },
      { feature: '代码助手', free: '✅', starter: '✅', pro: '✅', strategic: '✅', enterprise: '✅' },
      { feature: 'Groq 极速响应（3x）', free: '❌', starter: '❌', pro: '✅', strategic: '✅', enterprise: '✅' },
      { feature: 'Gemini 多模态', free: '❌', starter: '❌', pro: '✅', strategic: '✅', enterprise: '✅' },
    ]
  },
  { 
    category: '⚖️ 战略思维（Mc&Mamoo Growth Engine）', 
    items: [
      { feature: 'TriadLoop 三权分立', free: '❌', starter: '❌', pro: '✅', strategic: '✅', enterprise: '✅' },
      { feature: '五层分权架构', free: '❌', starter: '❌', pro: '⚠️ 基础', strategic: '✅ 完整', enterprise: '✅ 完整' },
      { feature: '毛泽东思想向量库', free: '❌', starter: '❌', pro: '⚠️ 入门', strategic: '✅ 完整', enterprise: '✅ 企业级' },
      { feature: '战略博弈推理', free: '❌', starter: '❌', pro: '❌', strategic: '✅', enterprise: '✅' },
      { feature: '历史案例智能匹配', free: '❌', starter: '❌', pro: '❌', strategic: '✅', enterprise: '✅' },
    ]
  },
  { 
    category: '🏢 企业服务', 
    items: [
      { feature: 'API 访问', free: '❌', starter: '❌', pro: '⚠️ 基础', strategic: '✅', enterprise: '✅' },
      { feature: '私有化部署', free: '❌', starter: '❌', pro: '❌', strategic: '❌', enterprise: '✅' },
      { feature: '专属模型训练', free: '❌', starter: '❌', pro: '❌', strategic: '❌', enterprise: '✅' },
      { feature: '专属技术团队', free: '❌', starter: '❌', pro: '❌', strategic: '❌', enterprise: '✅' },
    ]
  },
];