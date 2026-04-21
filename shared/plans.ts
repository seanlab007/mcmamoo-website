/**
 * MaoAI 定价方案 v10.0 — 积分制
 * 
 * 核心架构：
 * - 客户购买「积分」（Credits），用积分兑换服务
 * - 内部 token 消耗完全不对客户透明
 * - 免费版：固定次数，用完即终止，零 API 成本（限模型+限功能）
 * - 加价率 ≥ 1000x（基于积分成本）
 * - 所有价格以 9 结尾
 * 
 * 品牌：Mc&Mamoo Growth Engine
 * 官网统一：毛智库价格写入 mcmamoo.com Pricing 页面
 * 
 * 更新日期：2026-04-22
 */

// ============================================================
// 积分体系常量
// ============================================================

/** 积分单位名称 */
export const CREDIT_NAME = 'MaoCredits';
export const CREDIT_SYMBOL = 'MC';

/** 1 积分的对外售价（元）—— 必须以9结尾 */
export const CREDIT_PRICE_PER_UNIT = 0.99; // ¥0.99 / 积分

// ---- 各套餐的积分包配置 ----
export interface CreditPack {
  id: string;
  name: string;
  nameEn: string;
  credits: number;           // 包含积分数
  price: number;             // 售价（元），以9结尾
  bonus?: number;            // 赠送积分
  popular?: boolean;         // 热门推荐
}

/** 可购买的积分包 */
export const CREDIT_PACKS: CreditPack[] = [
  { id: 'trial',    name: '尝鲜包',   nameEn: 'Trial',     credits: 100,  price: 9.9,   bonus: 0 },
  { id: 'starter',  name: '入门包',   nameEn: 'Starter',   credits: 500,  price: 49.9,  bonus: 50,  popular: true },
  { id: 'pro',      name: '专业包',   nameEn: 'Pro',       credits: 2000, price: 199.9, bonus: 300 },
  { id: 'strategic',name: '战略包',   nameEn: 'Strategic', credits: 8000, price: 799.9, bonus: 1500 },
  { id: 'enterprise',name:'企业包',  nameEn: 'Enterprise',credits:40000,price:3999.9,bonus:8000 },
];

// ---- 积分消耗规则（内部使用，不对客户展示）----
// 不同操作消耗不同积分，与实际 token 成本解耦
export const CREDIT_COSTS = {
  // 基础对话（每条消息）
  chat_basic: 1,
  // R1 推理模式
  chat_r1_reasoning: 5,
  // 图片理解
  image_understand: 8,
  // 代码生成/执行
  code_generation: 6,
  // Web搜索
  web_search: 2,
  // TriadLoop 博弈推理（每轮）
  triadloop_round: 20,
  // 五层分权决策
  five_layer_decision: 15,
  // 毛泽东思想向量检索
  mao_vector_search: 25,
  // 战略级博弈推演
  strategic_game: 50,
};

// ============================================================
// 订阅套餐定义（月付/年付订阅 → 赠送每月积分额度）
// ============================================================

export interface Plan {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  
  // ---- 定价 ----
  monthlyPrice: number;        // 月付（元），以9结尾
  yearlyPrice: number;          // 年付（元），以9结尾
  
  // ---- 积分配额 ----
  creditsPerMonth: number;      // 每月赠送积分数
  creditsPerDay?: number;       // 每日积分数（免费版用）
  
  // ---- 权益 ----
  modelTier: 'basic' | 'advanced' | 'strategic';
  features: string[];
  unlockedCapabilities: string[];  // 相比上一级解锁的能力
  
  // ---- UI ----
  highlight?: boolean;
  badge?: string;
  
  // ---- 销售 ----
  salesHook: string;
}

export const PLANS: Plan[] = [
  // ══════════════════════════════════
  // 🆓 体验版 —— 零成本，用完终止
  // ══════════════════════════════════
  // 规则：
  //   - 每天 10 积分（约 10 条基础对话）
  //   - 仅基础对话 + 图片理解
  //   - 不消耗 API 额度（使用缓存/轻量模型）
  //   - 24:00 重置，用完即止
  //   - 不显示任何 token/cost 信息
  {
    id: 'free',
    name: '体验版',
    nameEn: 'Free Trial',
    description: '每天 10 次免费体验',
    descriptionEn: '10 free interactions daily',
    monthlyPrice: 0,
    yearlyPrice: 0,
    creditsPerDay: 10,
    creditsPerMonth: 300,      // 不对客户展示此数字
    modelTier: 'basic',
    features: [
      '📅 每天 10 积分（约 10 条对话）',
      '💬 基础 AI 对话能力',
      '🔍 文字理解与分析',
      '⏰ 24:00 自动重置',
      '🚫 用完即终止，无隐藏费用',
    ],
    unlockedCapabilities: [],
    salesHook: '体验满意？升级获取更多积分与强大功能：',
  },

  // ══════════════════════════════════
  // 💎 入门版 —— 小额尝鲜
  // ══════════════════════════════════
  {
    id: 'starter',
    name: '入门版',
    nameEn: 'Starter',
    description: '每月 500 积分，日常够用',
    descriptionEn: '500 Credits/month for daily use',
    monthlyPrice: 19.9,
    yearlyPrice: 199.9,
    creditsPerMonth: 500,
    modelTier: 'basic',
    features: [
      '✅ 每月 500 积分',
      '💬 无限次基础对话（受积分限制）',
      '🧠 DeepSeek V3 高速响应',
      '📊 对话历史记录',
      '💾 30天记忆保留',
    ],
    unlockedCapabilities: [
      '🔓 R1 深度推理模式',
      '🔓 图片理解能力',
      '🔓 代码生成助手',
    ],
    salesHook: '想要更强大的战略AI？升级解锁：',
    highlight: false,
  },

  // ══════════════════════════════════
  // ⚡ 专业版
  // ══════════════════════════════════
  {
    id: 'pro',
    name: '专业版',
    nameEn: 'Professional',
    description: '每月 2500 积分 + 全模型 + 基础战略',
    descriptionEn: '2500 Credits + Full Models + Basic Strategy',
    monthlyPrice: 99.9,
    yearlyPrice: 999.9,
    creditsPerMonth: 2500,
    modelTier: 'advanced',
    features: [
      '✅ 每月 2,500 积分',
      '✅ 全模型访问（V3/R1/Groq/Gemini）',
      '✅ 图片理解 + 代码生成',
      '✅ Web搜索集成',
      '✅ TriadLoop 三权分立推理',
      '✅ 90天记忆保留',
    ],
    unlockedCapabilities: [
      '🔓 五层分权决策架构',
      '🔓 毛泽东思想向量库（入门）',
      '🔓 知识库管理',
    ],
    salesHook: '想要最高级战略AI？升级解锁完整版：',
    highlight: true,
    badge: '推荐',
  },

  // ══════════════════════════════════
  // 🎯 战略版
  // ══════════════════════════════════
  {
    id: 'strategic',
    name: '战略版',
    nameEn: 'Strategic',
    description: '每月 12000 积分 + 毛泽东完整向量库',
    descriptionEn: '12K Credits + Complete Mao Vector DB',
    monthlyPrice: 499.9,
    yearlyPrice: 4999.9,
    creditsPerMonth: 12000,
    modelTier: 'strategic',
    features: [
      '✅ 每月 12,000 积分',
      '🧠 毛泽东思想完整向量库',
      '⚖️ 五层分权决策架构（完整）',
      '🔄 TriadLoop 5轮博弈推理',
      '🎯 战略级问题分析',
      '📊 历史案例智能匹配',
      '🔮 趋势预测',
      '✉️ 优先客服通道',
    ],
    unlockedCapabilities: ['👑 升级至毛智库'],
    salesHook: '企业级需求？升级至毛智库：',
  },

  // ══════════════════════════════════
  // 🏢 企业版
  // ══════════════════════════════════
  {
    id: 'enterprise',
    name: '企业版',
    nameEn: 'Enterprise',
    description: '自定义积分量 · 私有化部署',
    descriptionEn: 'Custom credits · Private deployment',
    monthlyPrice: 4999.9,
    yearlyPrice: 49999.9,
    creditsPerMonth: 999999,  // 实际上不限
    modelTier: 'strategic',
    features: [
      '✅ 自定义积分量（上不封顶）',
      '🏢 私有化部署',
      '🎓 专属模型微调训练',
      '📦 企业知识库深度整合',
      '🔗 API 全权限',
      '👥 专属技术团队',
      '📋 年度战略咨询',
    ],
    unlockedCapabilities: ['👑 升级至毛智库'],
    salesHook: '',
  },
];

// ════════════════════════════════════════════════════════════
// 👑 毛智库（Mao ThinkTank）—— 上不封顶
// 与官网 mcmamoo.com Pricing 统一
// ════════════════════════════════════════════════════════════

export const MAO_THINKTANK = {
  /** 毛智库套餐（写入官网定价）*/
  tiers: [
    {
      id: 'taste',
      name: 'AI 战略分析·尝鲜',
      period: '单次',
      price: 199,              // ¥199 尝鲜价
      unit: '元',
      desc: '小额尝鲜，体验毛泽东思想AI分析能力',
      features: [
        'AI 军事/商业战略分析',
        '情报综合与趋势预测',
        '基础博弈模拟',
        '报告交付（电子版）',
      ],
      isAIPowered: true,
      highlight: false,        // ← 尝鲜入口
    },
    {
      id: 'ai_full',
      name: 'AI 国防咨询包',
      period: '3个月',
      price: 99999,
      unit: '元',
      desc: 'AI驱动的持续国防战略咨询服务',
      features: [
        '持续战略分析（每周1次）',
        'AI兵棋推演（每月2次）',
        '专项研究报告（季度）',
        '7×24在线支持',
      ],
      isAIPowered: true,
      highlight: true,
    },
    {
      id: 'expert_consult',
      name: '专家战略咨询',
      period: '单次',
      price: 68000,
      unit: '元',
      desc: '资深军事战略专家深度咨询',
      features: [
        '深度战略分析与评估',
        '专家评估与建议方案',
        '详细书面报告',
        '后续跟踪指导',
      ],
      isAIPowered: false,
      highlight: false,
    },
    {
      id: 'expert_wargame',
      name: '专家兵棋推演',
      period: '单次',
      price: 299999,
      unit: '元',
      desc: '完整兵棋推演系统实战演练',
      features: [
        '完整兵棋推演系统',
        '多场景模拟对抗',
        '详细推演报告',
        '复盘优化建议',
      ],
      isAIPowered: false,
      highlight: false,
    },
    {
      id: 'top_partner',
      name: '顶级国防合伙',
      period: '1年',
      price: 50000000,         // ¥5000万/年起
      unit: '元',
      note: '上不封顶，可超 $1亿/年',
      desc: '国家级战略护航合伙方案',
      features: [
        '年度全面战略护航',
        '定期兵棋推演（每月）',
        '专项研究课题（定制）',
        '专家团队驻场陪跑',
        'Mc&Mamoo创始人直接对接',
        '军工级安全保密',
        '物理隔离私有部署',
        '主权级决策支持系统',
      ],
      isAIPowered: false,
      highlight: true,
      badge: '👑 终极',
    },
  ],

  /** 目标客户 */
  targetCustomers: [
    '国家政府机构 / 国防部门',
    '主权财富基金',
    '世界500强跨国集团',
    '国际组织与智库',
    '大型军工/航天企业',
  ],

  /** 核心卖点 */
  highlights: [
    '全球唯一毛泽东思想AI智库',
    '五层分权决策架构 · 国家级',
    'TriadLoop无限深度博弈引擎',
    '万亿级历史战略向量库',
    '地缘政治趋势预测',
    '军工级安全认证',
  ],
};

// ============================================================
// 品牌
// ============================================================

export const BRAND_INFO = {
  fullName: 'Mc&Mamoo Growth Engine',
  shortName: 'MaoAI',
  chineseName: '猫眼增长引擎',
  taglineCN: '突破性 AI 战略思维系统',
  taglineEN: 'Breakthrough AI Strategic Thinking System',
  labName: 'Mc&Mamoo Strategic Lab',
  footer: 'Mc&Mamoo Growth Engine · 重新定义 AI 决策力',
  heroHighlights: [
    '🧠 亿级战略智慧向量库',
    '⚖️ 五层分权决策架构',
    '🔄 TriadLoop 博弈推理引擎',
    '🎯 毛泽东思想战略模型',
  ],
};

// ============================================================
// 能力对比表
// ============================================================

export const CAPABILITY_COMPARISON = [
  { category: '📊 月度权益', items: [
    { feature: '月费(元)',       free:'¥0',    starter:'¥19.9',  pro:'¥99.9',   strategic:'¥499.9', enterprise:'¥4,999.9' },
    { feature: '月积分量',       free:'10/天',  starter:'500',   pro:'2,500',   strategic:'12,000', enterprise:'∞' },
    { feature: '年费(元)',       free:'—',     starter:'¥199.9', pro:'¥999.9',  strategic:'¥4,999.9',enterprise:'¥49,999.9' },
    { feature: '积分单价',       free:'—',     starter:'≈¥0.04',pro:'≈¥0.04', strategic:'≈¥0.04',enterprise:'—' },
  ]},
  { category: '🧠 模型能力', items: [
    { feature: 'V3 基础对话',    free:'✅',     starter:'✅',     pro:'✅',      strategic:'✅',     enterprise:'✅' },
    { feature: 'R1 深度推理',    free:'❌',     starter:'❌',     pro:'✅',      strategic:'✅',     enterprise:'✅' },
    { feature: '图片理解',       free:'❌',     starter:'❌',     pro:'✅',      strategic:'✅',     enterprise:'✅' },
    { feature: '全模型访问',     free:'❌',     starter:'❌',     pro:'✅',      strategic:'✅',     enterprise:'✅' },
    { feature: '自定义模型训练', free:'❌',     starter:'❌',     pro:'❌',      strategic:'❌',     enterprise:'✅ 从零' },
  ]},
  { category: '⚖️ 战略能力', items: [
    { feature: 'TriadLoop 三权分立',free:'❌',   starter:'❌',     pro:'✅',      strategic:'✅',     enterprise:'✅ 无限深' },
    { feature: '五层分权架构',   free:'❌',     starter:'❌',     pro:'⚠️基础',  strategic:'✅完整',  enterprise:'✅ 国家级' },
    { feature: '毛泽东向量库',   free:'❌',     starter:'❌',     pro:'⚠️入门',  strategic:'✅完整',  enterprise:'✅ 万亿级' },
    { feature: '战略博弈推演',   free:'❌',     starter:'❌',     pro:'❌',      strategic:'✅',     enterprise:'✅ 主权级' },
  ]},
  { category: '🏢 企业服务', items: [
    { feature: 'API 访问',       free:'❌',     starter:'❌',     pro:'⚠️',      strategic:'✅',     enterprise:'✅' },
    { feature: '私有化部署',     free:'❌',     starter:'❌',     pro:'❌',      strategic:'❌',     enterprise:'✅' },
    { feature: '专属技术团队',   free:'❌',     starter:'❌',     pro:'❌',      strategic:'❌',     enterprise:'✅' },
    { feature: '创始人对接',     free:'❌',     starter:'❌',     pro:'❌',      strategic:'❌',     enterprise:'✅' },
  ]},
];

// ============================================================
// 销售话术
// ============================================================

export const UPGRADE_PROMPTS = {
  lowCreditsWarning: () => `
🎯 **今日剩余积分不足**

您正在体验 **${BRAND_INFO.fullName}** 的专业级 AI 能力。

💰 **充值或升级获取更多积分：**
- 入门包 ¥49.9 → 550 积分（含赠送）
- 入门版 ¥19.9/月 → 每月 500 积分自动到账
- 专业版 ¥99.9/月 → 每月 2500 积分 + 全模型 + 战略推理

👉 [查看完整定价](/maoai/pricing)
  `,
  brandIntro: `
🚀 **欢迎来到 ${BRAND_INFO.fullName}**

由 ${BRAND_INFO.labName} 打造的 **${BRAND_INFO.taglineCN}**：

${BRAND_INFO.heroHighlights.map(h => h).join('\n')}

💡 您正在使用与付费版相同的核心 AI 能力！
每天 10 积分免费体验。
升级后解锁无限积分与战略级能力。
  `,
};
