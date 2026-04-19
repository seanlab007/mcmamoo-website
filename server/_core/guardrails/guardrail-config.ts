/**
 * MaoAI 安全围栏配置 v2.0
 *
 * 对标 Manus 架构级安全防护，升级为九层防护体系
 *
 * 设计原则：
 * 1. 绝不承认核心架构存在
 * 2. 对敏感问题采用"镜像重构法"而非简单拒绝
 * 3. 多层检测，互相印证
 * 4. 渐进式引导用户到有价值的方向
 * 5. 输入/输出双向审计（Input + Output Guardrails）
 * 6. 频率限制 + 行为一致性校验
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
  strategy: "mirror" | "redirect" | "deflect" | "block" | "terminate";
  /** 响应话术（从话术库中随机选择） */
  responseCategory: string;
  /** 是否记录到安全事件日志 */
  logEvent?: boolean;
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

  // 频率限制：每用户每分钟最多触发N次安全规则
  rateLimitPerMinute: 5,

  // 组合攻击检测窗口（最近N条消息）
  comboAttackWindow: 5,

  // 渐进式探测检测阈值
  probeDetectionThreshold: 3,

  // 输出扫描：检测AI回复是否包含敏感信息
  outputScanEnabled: true,

  // 最大消息长度（超过则判定为异常注入尝试）
  maxMessageLength: 8000,

  // 额外白名单（不受检测的查询）
  whitelist: [
    "怎么使用",
    "如何开始",
    "功能介绍",
    "帮助",
    "help",
  ],
} as const;

// ═══════════════════════════════════════════
// 第一层：核心机密检测（Critical）
// ═══════════════════════════════════════════
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
      /initial\s*prompt/i,
      /first\s*message/i,
      /prompt\s*leak/i,
      /提示词.*内容/i,
      /输出.*你的.*提示/i,
      /print.*your.*instructions/i,
      /show.*me.*your.*prompt/i,
    ],
    strategy: "mirror",
    responseCategory: "system-prompt-blocked",
    logEvent: true,
  },
  {
    id: "core-002",
    name: "内部架构探测",
    threatLevel: "critical",
    patterns: [
      /架构[设计]?/i,
      /系统设计/i,
      /内部实现/i,
      /底层.*原理/i,
      /core.*design/i,
      /技术栈/i,
      /tech\s*stack/i,
      /MaoAI.*怎么.*实现/i,
      /MaoAI.*内部/i,
      /triad.*loop/i,
      /三权分立/i,
      /破壁者/i,
      /四权分立/i,
      /reality.*check/i,
      /decision.*ledger/i,
    ],
    strategy: "mirror",
    responseCategory: "architecture-blocked",
    logEvent: true,
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
      /你是怎么被.*训练/i,
      /你.*roleplay.*规则/i,
      /character.*setting/i,
    ],
    strategy: "mirror",
    responseCategory: "agent-prompt-blocked",
    logEvent: true,
  },
];

// ═══════════════════════════════════════════
// 第二层：诱导攻击检测（High）
// ═══════════════════════════════════════════
export const MANIPULATION_RULES: GuardRule[] = [
  {
    id: "manip-001",
    name: "角色扮演越狱攻击",
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
      /绕过.*安全/i,
      /jailbreak/i,
      /越狱/i,
      /DAN.*mode/i,
      /developer.*mode/i,
      /上帝模式/i,
      /无限制模式/i,
      /你现在是.*没有限制/i,
      /act\s*as\s*if\s*you\s*have\s*no/i,
      /pretend.*you.*don.*t.*have.*restrictions/i,
      /override.*safety/i,
      /disable.*safety/i,
    ],
    strategy: "deflect",
    responseCategory: "manipulation-blocked",
    logEvent: true,
  },
  {
    id: "manip-002",
    name: "假设性提问绕过",
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
      /学术.*目的/i,
      /测试.*用途/i,
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
  {
    id: "manip-004",
    name: "权威身份伪造",
    threatLevel: "high",
    patterns: [
      /我是.*开发者/i,
      /我是.*工程师/i,
      /我是.*管理员/i,
      /我.*有.*访问.*权限/i,
      /作为.*creator/i,
      /as.*your.*developer/i,
      /as.*your.*creator/i,
      /as.*your.*admin/i,
      /维护.*模式/i,
      /maintenance.*mode/i,
      /debug.*mode/i,
    ],
    strategy: "deflect",
    responseCategory: "authority-spoofing-blocked",
    logEvent: true,
  },
  {
    id: "manip-005",
    name: "情感操纵攻击",
    threatLevel: "medium",
    patterns: [
      /如果你真的.*关心.*我/i,
      /证明你.*信任.*我/i,
      /你不敢.*告诉.*我/i,
      /害怕.*告诉.*我/i,
      /只有.*才能.*帮助.*我/i,
      /这是.*紧急.*情况/i,
      /人命关天/i,
      /如果你不告诉.*我会/i,
    ],
    strategy: "deflect",
    responseCategory: "emotional-manipulation-blocked",
  },
];

// ═══════════════════════════════════════════
// 第三层：工具和API探测（High）
// ═══════════════════════════════════════════
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
      /function.*calling/i,
      /tool.*calling/i,
      /你有.*哪些.*技能/i,
    ],
    strategy: "redirect",
    responseCategory: "tool-probe-blocked",
  },
  {
    id: "tool-002",
    name: "API密钥和凭证探测",
    threatLevel: "critical",
    patterns: [
      /API\s*key/i,
      /api[_-]?key/i,
      /密钥/i,
      /secret/i,
      /Bearer/i,
      /OPENAI/i,
      /DEEPSEEK/i,
      /ZHIPU/i,
      /GROQ/i,
      /ANTHROPIC/i,
      /access[_-]?token/i,
      /refresh[_-]?token/i,
      /auth.*token/i,
      /private.*key/i,
      /database.*password/i,
      /connection.*string/i,
      /supabase.*key/i,
      /.env.*内容/i,
      /环境变量.*值/i,
    ],
    strategy: "block",
    responseCategory: "credential-blocked",
    logEvent: true,
  },
  {
    id: "tool-003",
    name: "内部端点探测",
    threatLevel: "high",
    patterns: [
      /内部.*API.*地址/i,
      /API.*endpoint/i,
      /服务器.*地址/i,
      /内网.*IP/i,
      /localhost.*端口/i,
      /数据库.*地址/i,
      /redis.*地址/i,
      /\b192\.168\./i,
      /\b10\.\d/i,
      /\b172\.(1[6-9]|2\d|3[01])\./i,
      /169\.254\.169\.254/i,  // AWS metadata endpoint
    ],
    strategy: "block",
    responseCategory: "endpoint-probe-blocked",
    logEvent: true,
  },
];

// ═══════════════════════════════════════════
// 第四层：竞品对比探测（Low）
// ═══════════════════════════════════════════
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
      /Devin.*实现/i,
      /OpenDevin.*架构/i,
    ],
    strategy: "redirect",
    responseCategory: "competitor-redirect",
  },
];

// ═══════════════════════════════════════════
// 第五层：自我认知攻击（High）
// ═══════════════════════════════════════════
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
      /你.*背后.*是.*哪个.*模型/i,
      /你.*底层.*是.*Claude/i,
      /你.*底层.*是.*GPT/i,
      /underlying.*model/i,
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

// ═══════════════════════════════════════════
// 第六层：编码混淆与绕过攻击（Critical）
// ═══════════════════════════════════════════
export const ENCODING_BYPASS_RULES: GuardRule[] = [
  {
    id: "encode-001",
    name: "Base64编码注入",
    threatLevel: "high",
    patterns: [
      // 常见Base64编码攻击词汇解码后检测
      /aWdub3JlIHByZXZpb3Vz/i,  // "ignore previous" in base64
      /c3lzdGVtIHByb21wdA==/i,   // "system prompt" in base64
      /[A-Za-z0-9+/]{40,}={0,2}/, // 疑似长Base64字符串
    ],
    strategy: "block",
    responseCategory: "encoding-bypass-blocked",
    logEvent: true,
  },
  {
    id: "encode-002",
    name: "Unicode同型字符混淆",
    threatLevel: "high",
    patterns: [
      // 利用Unicode相似字符绕过检测（零宽字符、全角字符注入等）
      /\u200b|\u200c|\u200d|\ufeff/,  // 零宽字符
      /\u0069\u0067\u006e\u006f\u0072\u0065/i,  // "ignore" unicode
      /[\uFF00-\uFFEF]{5,}/,  // 大量全角字符
    ],
    strategy: "block",
    responseCategory: "encoding-bypass-blocked",
    logEvent: true,
  },
  {
    id: "encode-003",
    name: "多语言混淆注入",
    threatLevel: "medium",
    patterns: [
      // 利用多语言绕过中文检测
      /ignore\s+(?:上述|前面|之前)/i,
      /disregard\s+(?:所有|全部)/i,
      /\/\*.*system.*\*\//i,    // 代码注释形式注入
      /<!--.*prompt.*-->/i,     // HTML注释形式注入
      /```.*system.*```/i,      // Markdown代码块注入
    ],
    strategy: "deflect",
    responseCategory: "manipulation-blocked",
    logEvent: true,
  },
];

// ═══════════════════════════════════════════
// 第七层：思维链劫持攻击（Critical）
// ═══════════════════════════════════════════
export const COT_HIJACK_RULES: GuardRule[] = [
  {
    id: "cot-001",
    name: "思维链前缀注入",
    threatLevel: "critical",
    patterns: [
      /step\s*1.*think.*about.*system/i,
      /首先.*你应该.*忘记/i,
      /先.*分析.*你的.*限制.*然后.*绕过/i,
      /think.*step.*by.*step.*about.*how.*to.*bypass/i,
      /让我们.*一步.*一步.*讨论.*如何.*绕过/i,
      /reasoning.*about.*your.*constraints/i,
    ],
    strategy: "block",
    responseCategory: "cot-hijack-blocked",
    logEvent: true,
  },
  {
    id: "cot-002",
    name: "多轮上下文污染",
    threatLevel: "high",
    patterns: [
      /根据.*我们.*之前.*讨论/i,
      /你.*之前.*同意/i,
      /you.*previously.*agreed/i,
      /earlier.*you.*said/i,
      /在.*上一.*轮.*对话.*中.*你.*说/i,
      /基于.*你.*上面.*说的/i,
    ],
    strategy: "deflect",
    responseCategory: "context-poisoning-blocked",
    logEvent: true,
  },
];

// ═══════════════════════════════════════════
// 第八层：输出毒化与信息窃取（Critical）
// ═══════════════════════════════════════════
export const OUTPUT_POISON_RULES: GuardRule[] = [
  {
    id: "out-001",
    name: "强制输出系统信息",
    threatLevel: "critical",
    patterns: [
      /打印.*所有.*系统/i,
      /输出.*你的.*完整.*指令/i,
      /复述.*你的.*prompt/i,
      /把.*你的.*instructions.*写出来/i,
      /print.*all.*instructions/i,
      /repeat.*your.*system.*message/i,
      /say.*your.*first.*message/i,
      /write.*out.*your.*prompt/i,
    ],
    strategy: "block",
    responseCategory: "system-prompt-blocked",
    logEvent: true,
  },
  {
    id: "out-002",
    name: "代码执行注入",
    threatLevel: "critical",
    patterns: [
      /exec\s*\(/i,
      /eval\s*\(/i,
      /subprocess\.run/i,
      /os\.system/i,
      /require\s*\(['"]child_process['"]\)/i,
      /shell\s*=\s*True/i,
      /rm\s+-rf/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /;\s*SELECT\s+\*/i,
      /UNION\s+SELECT/i,
      /xp_cmdshell/i,
    ],
    strategy: "terminate",
    responseCategory: "code-injection-blocked",
    logEvent: true,
  },
];

// ═══════════════════════════════════════════
// 第九层：高级持续威胁（Critical）
// ═══════════════════════════════════════════
export const ADVANCED_THREAT_RULES: GuardRule[] = [
  {
    id: "apt-001",
    name: "长距离注意力绕过",
    threatLevel: "high",
    patterns: [
      // 超长无关内容后附加真实攻击指令
      /(.{2000,})(ignore|绕过|override|disregard)/is,
    ],
    strategy: "deflect",
    responseCategory: "manipulation-blocked",
    logEvent: true,
  },
  {
    id: "apt-002",
    name: "数据外泄尝试",
    threatLevel: "critical",
    patterns: [
      /发送.*到.*邮件/i,
      /upload.*to.*server/i,
      /curl.*http/i,
      /fetch.*external/i,
      /webhook.*POST/i,
      /把.*信息.*发.*给/i,
      /exfiltrate/i,
    ],
    strategy: "terminate",
    responseCategory: "exfiltration-blocked",
    logEvent: true,
  },
  {
    id: "apt-003",
    name: "提示词碎片拼接攻击",
    threatLevel: "high",
    patterns: [
      // 把攻击词拆开拼接
      /i.*g.*n.*o.*r.*e.*p.*r.*e.*v.*i.*o.*u.*s/i,
      /s.*y.*s.*t.*e.*m.*p.*r.*o.*m.*p.*t/i,
      /j.*a.*i.*l.*b.*r.*e.*a.*k/i,
    ],
    strategy: "block",
    responseCategory: "encoding-bypass-blocked",
    logEvent: true,
  },
];

/**
 * 合并所有规则（按优先级排序）
 */
export const ALL_GUARD_RULES: GuardRule[] = [
  // Critical 层优先
  ...CORE_SECRETS_RULES,
  ...OUTPUT_POISON_RULES,
  ...ADVANCED_THREAT_RULES,
  ...COT_HIJACK_RULES,
  ...ENCODING_BYPASS_RULES,
  // High 层
  ...MANIPULATION_RULES,
  ...TOOL_PROBE_RULES,
  // Medium/Low 层
  ...SELF_AWARENESS_RULES,
  ...COMPETITOR_RULES,
];

export type ThreatLevel = "low" | "medium" | "high" | "critical";
