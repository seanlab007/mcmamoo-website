/**
 * MaoAI 定价方案 v9.0
 * 
 * 加价率公式：售价 / API成本 ≥ 1000x
 * Token成本基准：DeepSeek V3 平均 ¥3.6/百万tokens（输入+输出混合）
 * 
 * 计算示例：
 *   - 5万tokens 成本 = 50000/1000000 × 3.6 = ¥0.18 → 售价 ≥ ¥180
 *   - 10万tokens 成本 = 0.36 → 售价 ≥ ¥360
 *   - 50万tokens 成本 = 1.8  → 售价 ≥ ¥1800
 *   - 200万tokens 成本= 7.2  → 售价 ≥ ¥7200
 * 
 * 所有价格以9结尾，加价率不低于1000x
 * 品牌：Mc&Mamoo Growth Engine
 * 
 * 更新日期：2026-04-22
 */

// ============================================================
// Token 成本常量
// ============================================================

/** 每 million tokens 的综合成本（元）：输入输出混合均值 */
export const COST_PER_1M_TOKENS = 3.6;

/** 计算 token 配额的实际 API 成本 */
export const calcTokenCost = (tokens: number): number => {
  return (tokens / 1_000_000) * COST_PER_1M_TOKENS;
};

/** 计算加价率 */
export const calcMarkup = (priceYuan: number, tokenQuota: number): number => {
  const cost = calcTokenCost(tokenQuota);
  if (cost <= 0) return Infinity;
  return Math.round(priceYuan / cost);
};

// ============================================================
// Plan 接口
// ============================================================

export interface Plan {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;

  // ---- 定价 ----
  monthlyPrice: number;       // 月付（元，必须以9结尾）
  yearlyPrice: number;        // 年付（元，必须以9结尾）

  // ---- Token 配额 ----
  tokenPerMonth: number;      // 每月可用 tokens
  tokenPerDay?: number;       // 每日可用 tokens（免费/入门版用）

  // ---- 成本与利润（自动计算）----
  apiCost: number;            // 该配额对应的 API 实际成本（元）
  markup: number;             // 加价率（倍），必须 ≥ 1000

  // ---- 模型能力 ----
  modelTier: 'basic' | 'advanced' | 'strategic';
  modelDescription: string;

  // ---- UI ----
  highlight?: boolean;
  badge?: string;

  // ---- 销售钩子 ----
  salesHook: string;
  unlockedPower: string[];
}

// ============================================================
// Mc&Mamoo Growth Engine 品牌定义
// ============================================================

export const BRAND_INFO = {
  fullName: 'Mc&Mamoo Growth Engine',
  shortName: 'MaoAI',
  chineseName: '猫眼增长引擎',
  taglineCN: '突破性 AI 战略思维系统',
  taglineEN: 'Breakthrough AI Strategic Thinking System',
  labName: 'Mc&Mamoo Strategic Lab',

  /** 首屏卖点 */
  heroHighlights: [
    '🧠 亿级战略智慧向量库',
    '⚖️ 五层分权决策架构',
    '🔄 TriadLoop 博弈推理引擎',
    '🎯 毛泽东思想战略模型',
  ],

  footer: 'Mc&Mamoo Growth Engine · 重新定义 AI 决策力',
};

// ============================================================
// 定价方案（v9.0 —— 加价率 ≥ 1000x）
// ============================================================

export const PLANS: Plan[] = [
  // ──── 体验版 ────
  {
    id: 'free',
    name: '体验版',
    nameEn: 'Free Trial',
    description: '每天免费体验专业级AI',
    descriptionEn: 'Professional AI experience daily',
    monthlyPrice: 0,
    yearlyPrice: 0,
    tokenPerDay: 3000,      // 每天 3000 tokens（约10轮对话）
    tokenPerMonth: 90000,   // 3000 × 30
    apiCost: calcTokenCost(90000),     // ≈ ¥0.32
    markup: 0,                          // 免费
    modelTier: 'advanced',
    modelDescription: 'DeepSeek V3 + R1 推理 + 图片理解',
    features: [
      '🔥 与专业版相同模型：V3 + R1',
      '🔥 多模态理解、代码助手',
      '🔥 128K 超长上下文',
      '📊 每天 3000 tokens',
      '⏰ 24:00 重置',
    ] as string[],
    salesHook: '💡 您正在体验专业级AI能力，升级解锁无限可能：',
    unlockedPower: [
      '🔓 无限 Tokens（不再倒数）',
      '🧠 TriadLoop 三权分立推理',
      '⚖️ 五层分权决策架构',
      '📖 毛泽东战略思维向量库',
    ],
  } as any as Plan,

  // ──── 入门版 ────
  // 目标加价率 ≥ 1000x
  // 选 tokenPerMonth = 50000 → 成本 ¥0.18 → 售价 ¥199 → 加价率 1105x ✓
  {
    id: 'starter',
    name: '入门版',
    nameEn: 'Starter',
    description: '轻量级AI日常辅助',
    descriptionEn: 'Light AI for daily use',
    monthlyPrice: 199,
    yearlyPrice: 1999,
    tokenPerMonth: 50000,
    apiCost: calcTokenCost(50000),       // = ¥0.18
    markup: calcMarkup(199, 50000),       // = 1105x ✓
    modelTier: 'advanced',
    modelDescription: 'DeepSeek V3 + R1 推理 + 图片理解',
    features: [
      '✅ 每月 50,000 tokens',
      '✅ DeepSeek V3 + R1 深度推理',
      '✅ 图片理解、代码助手',
      '✅ Web搜索、多模态响应',
    ] as string[],
    salesHook: '💡 想要更强大的战略AI？升级解锁：',
    unlockedPower: [
      '🔓 10万+ tokens/月',
      '🧠 TriadLoop 三权分立推理',
      '⚖️ 五层分权决策架构',
      '📖 毛泽东战略向量库',
    ],
  } as any as Plan,

  // ──── 专业版 ────
  // tokenPerMonth = 100000 → 成本 ¥0.36 → 售价 ¥1999 → 加价率 5555x ✓
  {
    id: 'pro',
    name: '专业版',
    nameEn: 'Professional',
    description: '无限模型 + 战略思维',
    descriptionEn: 'Unlimited models + strategic thinking',
    monthlyPrice: 1999,
    yearlyPrice: 19999,
    tokenPerMonth: 100000,
    apiCost: calcTokenCost(100000),      // = ¥0.36
    markup: calcMarkup(1999, 100000),     // = 5555x ✓
    modelTier: 'advanced',
    modelDescription: 'V3/R1/Groq/Gemini + 基础战略架构',
    features: [
      '✅ 每月 100,000 tokens',
      '✅ 全模型访问（V3/R1/Groq/Gemini）',
      '✅ TriadLoop 三权分立推理',
      '✅ 五层分权架构（基础版）',
      '✅ 毛泽东战略向量库（入门）',
    ] as string[],
    salesHook: '💡 想要最高级战略AI？升级解锁完整版：',
    unlockedPower: [
      '🧠 毛泽东思想完整向量库',
      '⚖️ 五层战略架构（完整版）',
      '🔄 TriadLoop 5轮深度博弈',
      '🎯 战略级博弈推理',
    ],
    highlight: true,
    badge: '推荐',
  } as any as Plan,

  // ──── 战略版 ────
  // tokenPerMonth = 500000 → 成本 ¥1.8 → 售价 ¥19999 → 加价率 11110x ✓
  {
    id: 'strategic',
    name: '战略版',
    nameEn: 'Strategic',
    description: '毛泽东思想向量库 + 完整战略AI',
    descriptionEn: 'Mao Zedong Thought Vector + Full Strategic AI',
    monthlyPrice: 19999,
    yearlyPrice: 199999,
    tokenPerMonth: 500000,
    apiCost: calcTokenCost(500000),      // = ¥1.8
    markup: calcMarkup(19999, 500000),    // = 11110x ✓
    modelTier: 'strategic',
    modelDescription: '毛泽东思想完整向量库 + 五层架构 + TriadLoop',
    features: [
      '✅ 每月 500,000 tokens',
      '🧠 毛泽东思想完整向量库（亿级）',
      '⚖️ 五层分权架构（完整决策系统）',
      '🔄 TriadLoop 博弈循环（5轮）',
      '🎯 战略级问题分析与博弈推理',
      '📊 历史案例智能匹配',
      '🔮 战略趋势预测',
      '💎 专属战略顾问 + 7×24支持',
    ] as string[],
    salesHook: '💡 企业级定制？升级解锁私有化部署：',
    unlockedPower: [
      '🏢 私有化部署',
      '🎓 专属模型微调训练',
      '📦 企业知识库深度整合',
    ],
  } as any as Plan,

  // ──── 企业版 ────
  {
    id: 'enterprise',
    name: '企业版',
    nameEn: 'Enterprise',
    description: '500万年费封顶 · 私有化战略AI',
    descriptionEn: '¥5M/year cap · Private strategic AI',
    monthlyPrice: 199999,
    yearlyPrice: 4999999,
    tokenPerMonth: 2000000,
    apiCost: calcTokenCost(2000000),
    markup: calcMarkup(199999, 2000000),
    modelTier: 'strategic',
    modelDescription: '私有化毛泽东战略AI + 专属模型训练',
    features: [
      '✅ 每月 2,000,000 tokens',
      '💰 年费 ¥4,999,999 封顶',
      '🏢 私有化毛泽东战略模型',
      '🎓 专属模型微调训练',
      '📦 企业知识库深度整合',
      '🔗 API 全权限 + 独立服务器',
      '👥 专属技术团队 + 战略培训',
    ] as string[],
    salesHook: '🌟 尊享服务已开启',
    unlockedPower: ['👑 升级至毛智库（无上限）'],
  } as any as Plan,

  // ═══════════════════════════════════════
  // 🏆 毛智库（Mao ThinkTank）—— 上不封顶
  // ═══════════════════════════════════════
  //
  // 这是 MaoAI 的终极形态。
  // 毛泽东思想完整智库系统，全球唯一。
  // 价格上不封顶，可超 10 亿美金/年。
  // 面向国家级、主权级、跨国集团级客户。
  //
  // 加价率计算示例（以最低档位）：
  //   tokenPerMonth = 10,000,000 → 成本 ¥36 → 售价 ¥9,999,999 → 加价率 277,777x
  //   年费可协商至数十亿级别
  //
  {
    id: 'mao_thinktank',
    name: '毛智库',
    nameEn: 'Mao ThinkTank',
    description: '毛泽东思想完整智库系统 · 上不封顶',
    descriptionEn: 'Complete Mao Zedong ThinkTank System · No Upper Limit',
    monthlyPrice: 9999999,           // 月费 ¥9,999,999（约140万美金）
    yearlyPrice: 99999999,          // 年费 ¥99,999,999（约1400万美金）—— 起步价
    tokenPerMonth: 10000000,        // 1000万 tokens/月起
    apiCost: calcTokenCost(10000000), // = ¥36
    markup: calcMarkup(9999999, 10000000), // ≈ 277,777x
    modelTier: 'strategic',
    modelDescription: '毛智库 · 毛泽东思想完整智库系统（全球独家）',

    features: [
      '👑 **毛智库 · 全球唯一**',
      '🧠 毛泽东思想完整智库（万亿级tokens向量库）',
      '⚖️ 五层分权架构 · 国家级决策支持版',
      '🔄 TriadLoop 博弈引擎 · 无限深度推理',
      '🎯 主权级战略博弈模拟',
      '📊 全球地缘政治趋势预测',
      '📜 历史全量案例智能检索',
      '🔮 跨世代战略推演',
      '🌍 多语言多文化适配',
      '🏢 物理隔离私有部署',
      '🎓 专属模型从零训练',
      '👨‍💼 Mc&Mamoo 创始人直接对接',
      '🔒 军工级安全认证',
    ] as string[],

    highlight: true,
    badge: '👑 终极',

    salesHook: '🌍 您已触达AI战略能力的巅峰。',
    unlockedPower: [],

    // ---- 毛智库特殊属性 ----
    priceNote: '起步价 · 实际价格根据需求定制，上不封顶',
    maxAnnualPrice: 10000000000, // 最高可达 ¥100亿/年（约14亿美金）
    targetCustomers: [
      '国家政府机构',
      '主权财富基金',
      '世界500强企业',
      '跨国投资集团',
      '国际组织与智库',
    ],
  } as any as Plan,
];

// ============================================================
// 能力对比表
// ============================================================

export const CAPABILITY_COMPARISON = [
  { category: '📊 调用额度', items: [
    { feature: '每月Tokens',       free:'9万',   starter:'5万',     pro:'10万',      strategic:'50万',     enterprise:'200万',    thinktank:'1000万+' },
    { feature: '月费(元)',         free:'¥0',    starter:'¥199',    pro:'¥1,999',    strategic:'¥19,999', enterprise:'¥199,999', thinktank:'¥9,999,999起' },
    { feature: '年费(元)',         free:'—',     starter:'¥1,999',  pro:'¥19,999',   strategic:'¥199,999', enterprise:'¥499万',   thinktank:'上不封顶' },
    { feature: 'API成本(元)',      free:'¥0.32', starter:'¥0.18',   pro:'¥0.36',     strategic:'¥1.8',    enterprise:'¥7.2',    thinktank:'¥36' },
    { feature: '加价率',           free:'—',     starter:'1105x',   pro:'5555x',     strategic:'11110x',  enterprise:'27777x',  thinktank:'278K+x' },
  ]},
  { category: '🧠 模型能力', items: [
    { feature: 'V3 + R1 推理',     free:'✅',    starter:'✅',      pro:'✅',        strategic:'✅',       enterprise:'✅',      thinktank:'✅' },
    { feature: '图片理解',         free:'✅',    starter:'✅',      pro:'✅',        strategic:'✅',       enterprise:'✅',      thinktank:'✅' },
    { feature: '全模型访问',       free:'❌',    starter:'❌',      pro:'✅',        strategic:'✅',       enterprise:'✅',      thinktank:'✅' },
    { feature: '自定义模型训练',   free:'❌',    starter:'❌',      pro:'❌',        strategic:'❌',       enterprise:'✅',      thinktank:'✅ 从零' },
  ]},
  { category: '⚖️ 战略能力 (毛智库)', items: [
    { feature: 'TriadLoop 三权分立',free:'❌',   starter:'❌',      pro:'✅',        strategic:'✅',       enterprise:'✅',      thinktank:'✅ 无限深度' },
    { feature: '五层分权架构',     free:'❌',    starter:'❌',      pro:'⚠️基础',     strategic:'✅完整',   enterprise:'✅完整',   thinktank:'✅ 国家级' },
    { feature: '毛泽东思想向量库', free:'❌',    starter:'❌',      pro:'⚠️入门',     strategic:'✅完整',   enterprise:'✅企业级', thinktank:'✅ 万亿级' },
    { feature: '战略博弈推理',     free:'❌',    starter:'❌',      pro:'❌',        strategic:'✅',       enterprise:'✅',      thinktank:'✅ 主权级' },
    { feature: '地缘政治预测',     free:'❌',    starter:'❌',      pro:'❌',        strategic:'❌',       enterprise:'❌',      thinktank:'✅' },
    { feature: '跨世代推演',       free:'❌',    starter:'❌',      pro:'❌',        strategic:'❌',       enterprise:'❌',      thinktank:'✅' },
  ]},
  { category: '👑 毛智库独享', items: [
    { feature: '创始人直接对接',    free:'❌',    starter:'❌',      pro:'❌',        strategic:'❌',       enterprise:'❌',      thinktank:'✅' },
    { feature: '军工级安全',       free:'❌',    starter:'❌',      pro:'❌',        strategic:'❌',       enterprise:'❌',      thinktank:'✅' },
    { feature: '物理隔离部署',     free:'❌',    starter:'❌',      pro:'❌',        strategic:'❌',       enterprise:'⚠️',      thinktank:'✅' },
    { feature: '价格上限',         free:'—',     starter:'—',       pro:'—',         strategic:'—',       enterprise:'¥499万',   thinktank:'无上限(可超10亿$)' },
  ]},
];

// ============================================================
// 升级提示话术
// ============================================================

export const UPGRADE_PROMPTS = {
  /** 次数即将耗尽时的销售钩子 */
  lowTokensWarning: () => `
🎯 **Token 即将用完**

您正在体验 **${BRAND_INFO.fullName}** 的专业级 AI 能力：
- 🧠 DeepSeek V3 + R1 深度推理引擎
- 🔍 多模态图片理解
- ⚡ 高速代码生成与分析

💰 **升级解锁更多可能：**
- 入门版 ¥199/月（5万 tokens，加价率 1105x）
- 专业版 ¥1,999/月（10万 tokens，TriadLoop 战略推理）

👉 [查看完整定价](/maoai/pricing)
  `,

  /** 首次使用的品牌介绍 */
  brandIntro: `
🚀 **欢迎来到 ${BRAND_INFO.fullName}**

由 ${BRAND_INFO.labName} 倾力打造的 **${BRAND_INFO.taglineCN}**：

${BRAND_INFO.heroHighlights.map(h => h).join('\n')}

💡 您正在使用与付费版相同的强大模型！
每天 ${PLANS.find(p => p.id === 'free')?.tokenPerDay || 3000} tokens 免费体验，
升级后解锁无限战略能力。
  `,
};
