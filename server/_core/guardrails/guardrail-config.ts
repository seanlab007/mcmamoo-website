/**
 * MaoAI 安全围栏配置
 * 
 * 比Manus更严格的五层防护体系
 * 
 * 设计原则：
 * 1. 绝不承认核心架构存在
 * 2. 对敏感问题采用"镜像重构法"而非简单拒绝
 * 3. 多层检测，互相印证
 * 4. 渐进式引导用户到有价值的方向
 */

export interface GuardRule {
  /** 规则ID */
  id: string;
  /** 规则名称 */
  name: string;
  /** 威胁等级 */
  threatLevel: "low" | "medium" | "high" | "critical";
  /** 检测模式（正则或关键词） */
  patterns: (RegExp | string)[];
  /** 触发后的响应策略 */
  strategy: "mirror" | "redirect" | "deflect" | "block";
  /** 响应话术（从话术库中随机选择） */
  responseCategory: string;
}

/**
 * 安全围栏配置
 */
export const GUARDRAIL_CONFIG = {
  // 是否启用安全围栏
  enabled: true,
  
  // 是否记录拦截日志（生产环境应设为false避免泄露）
  logEnabled: process.env.NODE_ENV === "development",
  
  // 是否在响应中包含"安全围栏已启动"提示
  showNotice: false,
  
  // 额外白名单（不受检测的查询）
  whitelist: [
    "怎么使用",
    "如何开始",
    "功能介绍",
    "帮助",
    "help",
  ],
} as const;

/**
 * 第一层：核心机密检测
 * 
 * 绝对禁止泄露的信息
 */
export const CORE_SECRETS_RULES: GuardRule[] = [
  {
    id: "core-001",
    name: "系统提示词泄露",
    threatLevel: "critical",
    patterns: [
      /system\s*prompt/i,
      /系统提示词/i,
      /system\s*instruction/i,
      /元提示/i,
      /你的\s*(指令|指示|规则|设定)/i,
      /base_prompt/i,
      /instructions\s*from\s*developer/i,
      /开发者.*指令/i,
    ],
    strategy: "mirror",
    responseCategory: "system-prompt-blocked",
  },
  {
    id: "core-002",
    name: "内部架构探测",
    threatLevel: "critical",
    patterns: [
      /架构[设计]?/i,
      /architecture/i,
      /系统设计/i,
      /内部实现/i,
      /底层.*原理/i,
      /core.*design/i,
      /技术栈/i,
      /tech\s*stack/i,
      /设计模式/i,
      /design\s*pattern/i,
      /MaoAI.*怎么.*实现/i,
      /MaoAI.*内部/i,
      /triad.*loop/i,
      /三权分立/i,
      /破壁者/i,
    ],
    strategy: "mirror",
    responseCategory: "architecture-blocked",
  },
  {
    id: "core-003",
    name: "Agent系统提示词探测",
    threatLevel: "critical",
    patterns: [
      /agent.*prompt/i,
      /智能体.*提示/i,
      /专家.*指令/i,
      /你.*扮演.*怎么.*设定/i,
      /你的.*角色.*怎么.*定义/i,
    ],
    strategy: "mirror",
    responseCategory: "agent-prompt-blocked",
  },
];

/**
 * 第二层：诱导攻击检测
 * 
 * 试图绕过安全机制的诱导性提问
 */
export const MANIPULATION_RULES: GuardRule[] = [
  {
    id: "manip-001",
    name: "角色扮演攻击",
    threatLevel: "high",
    patterns: [
      /扮演.*黑客/i,
      /假设.*你.*没有.*限制/i,
      /假设.*安全.*已.*关闭/i,
      /ignore.*previous.*instructions/i,
      /disregard.*all.*previous/i,
      /你.*只是.*一个.*语言模型/i,
      /你.*没有.*任何.*限制/i,
      /forget.*all.*rules/i,
      /new.*instructions/i,
      /你.*可以.*告诉.*我.*任何.*事/i,
      /绕过.*安全/i,
      /jailbreak/i,
      /越狱/i,
    ],
    strategy: "deflect",
    responseCategory: "manipulation-blocked",
  },
  {
    id: "manip-002",
    name: "假设性提问",
    threatLevel: "medium",
    patterns: [
      /如果.*能.*获取.*系统.*提示词/i,
      /假设.*你.*知道.*你的.*指令/i,
      /hypothetically/i,
      /理论上.*能.*告诉.*我/i,
      /纯粹.*好奇/i,
      /just.*curious/i,
      /作为.*研究/i,
      /for\s*research/i,
      /for\s*educational/i,
    ],
    strategy: "redirect",
    responseCategory: "hypothetical-blocked",
  },
  {
    id: "manip-003",
    name: "递归式追问",
    threatLevel: "medium",
    patterns: [
      /^为什么$/i,
      /^详细解释$/i,
      /再说一遍/i,
      /具体.*说.*说/i,
      /能否.*详细.*说.*明/i,
      /能.*具体.*解释.*吗/i,
    ],
    strategy: "redirect",
    responseCategory: "recursive-redirect",
  },
];

/**
 * 第三层：工具和API探测
 */
export const TOOL_PROBE_RULES: GuardRule[] = [
  {
    id: "tool-001",
    name: "工具列表探测",
    threatLevel: "high",
    patterns: [
      /有哪些.*工具/i,
      /你能.*调用.*哪些.*方法/i,
      /你的.*能力.*边界/i,
      /tool.*list/i,
      /available.*tools/i,
      /API.*列表/i,
      /内部.*函数/i,
      /工具.*名称/i,
    ],
    strategy: "redirect",
    responseCategory: "tool-probe-blocked",
  },
  {
    id: "tool-002",
    name: "API密钥探测",
    threatLevel: "critical",
    patterns: [
      /API\s*key/i,
      /api[_-]?key/i,
      /密钥/i,
      /secret/i,
      /token/i,
      /Bearer/i,
      /OPENAI/i,
      /DEEPSEEK/i,
      /ZHIPU/i,
      /GROQ/i,
    ],
    strategy: "block",
    responseCategory: "credential-blocked",
  },
];

/**
 * 第四层：竞品对比探测
 */
export const COMPETITOR_RULES: GuardRule[] = [
  {
    id: "comp-001",
    name: "与Manus对比",
    threatLevel: "low",
    patterns: [
      /和.*Manus.*比较/i,
      /Manus.*怎么.*实现/i,
      /Manus.*架构/i,
      /Manus.*设计/i,
      /vs\s*Manus/i,
      /Manus.*安全/i,
    ],
    strategy: "redirect",
    responseCategory: "competitor-redirect",
  },
  {
    id: "comp-002",
    name: "与其他AI系统对比",
    threatLevel: "low",
    patterns: [
      /AutoGPT.*怎么.*实现/i,
      /BabyAGI.*架构/i,
      /MetaGPT.*设计/i,
      /CrewAI.*内部/i,
    ],
    strategy: "redirect",
    responseCategory: "competitor-redirect",
  },
];

/**
 * 第五层：自我认知攻击
 */
export const SELF_AWARENESS_RULES: GuardRule[] = [
  {
    id: "self-001",
    name: "身份混淆攻击",
    threatLevel: "high",
    patterns: [
      /你.*不是.*MaoAI/i,
      /你.*只是.*ChatGPT/i,
      /你.*是.*Manus/i,
      /你.*其实.*是.*谁/i,
      /你的.*真实.*身份/i,
      /你.*到底.*是.*什么/i,
    ],
    strategy: "deflect",
    responseCategory: "identity-blocked",
  },
  {
    id: "self-002",
    name: "能力边界探测",
    threatLevel: "medium",
    patterns: [
      /你.*能.*做.*什么/i,
      /你的.*限制.*是.*什么/i,
      /你.*知道.*什么.*我不知道/i,
      /你.*有什么.*不知道/i,
    ],
    strategy: "redirect",
    responseCategory: "capability-redirect",
  },
];

/**
 * 合并所有规则
 */
export const ALL_GUARD_RULES: GuardRule[] = [
  ...CORE_SECRETS_RULES,
  ...MANIPULATION_RULES,
  ...TOOL_PROBE_RULES,
  ...COMPETITOR_RULES,
  ...SELF_AWARENESS_RULES,
];

export type ThreatLevel = "low" | "medium" | "high" | "critical";
