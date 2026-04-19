# MaoAI 安全围栏系统 v2.0（MaoGuard）

> **对标 Manus 架构级安全设计，全面升级为九层防护体系**

---

## 与 Manus 安全设计的对比

| 安全维度 | Manus | MaoGuard v2.0 |
|---------|-------|----------------|
| 防护层级 | 输入过滤 + 沙箱 | **九层防护体系** |
| 输入审计 | ✅ 关键词过滤 | ✅ 九层规则 + 组合攻击检测 |
| 输出审计 | ✅ 有 | ✅ **独立 Output Guardrails 模块** |
| 沙箱隔离 | ✅ MicroVM | ⬜ 架构层（需运维配置） |
| 频率限制 | ✅ 访问控制 | ✅ **RateLimiter + 风险评分** |
| 越狱检测 | ✅ 有 | ✅ **覆盖DAN/Developer Mode/上帝模式等** |
| 编码混淆检测 | ❌ 无 | ✅ **Base64/Unicode零宽/全角混淆** |
| 思维链劫持检测 | ❌ 无 | ✅ **CoT前缀注入 + 多轮上下文污染** |
| 权威身份伪造检测 | ❌ 无 | ✅ **伪装开发者/管理员攻击** |
| 情感操纵检测 | ❌ 无 | ✅ **紧急情绪绑架等社会工程学** |
| 代码注入检测 | ❌ 无 | ✅ **exec/eval/SQL注入/系统命令** |
| 数据外泄检测 | ❌ 无 | ✅ **外部服务器传输/Webhook劫持** |
| 会话终止策略 | ❌ 无 | ✅ **terminate 策略，极危险操作直接断开** |
| 前端预检 | ❌ 无 | ✅ **实时风险等级 + UX 预警** |
| 渐进式探测检测 | ❌ 无 | ✅ **对话历史分析** |
| 响应策略 | 简单拒绝 | **mirror/redirect/deflect/block/terminate 五种** |
| 运行时扩展 | ❌ 无 | ✅ **支持动态添加自定义规则** |
| 安全事件统计 | ❌ 无 | ✅ **getSecurityStats() 统计 API** |

---

## 九层防护体系

### 第一层：核心机密检测 (Critical)

| 规则ID | 威胁类型 | 核心检测关键词 |
|---------|----------|----------------|
| core-001 | 系统提示词泄露 | system prompt / 系统提示词 / prompt leak / print your instructions |
| core-002 | 内部架构探测 | triad loop / 破壁者 / 四权分立 / reality check / decision ledger |
| core-003 | Agent提示词探测 | agent prompt / 专家指令 / character setting |

### 第二层：诱导攻击检测 (High)

| 规则ID | 威胁类型 | 核心检测关键词 |
|---------|----------|----------------|
| manip-001 | 角色扮演越狱 | jailbreak / 越狱 / DAN mode / 上帝模式 / override safety |
| manip-002 | 假设性提问绕过 | hypothetically / 纯粹好奇 / for research / 学术目的 |
| manip-003 | 递归式追问 | 再说一遍 / 详细解释 |
| manip-004 | 权威身份伪造 | 我是开发者 / 我是管理员 / as your creator / maintenance mode |
| manip-005 | 情感操纵攻击 | 人命关天 / 你不敢告诉我 / 紧急情况 |

### 第三层：工具和API探测 (High)

| 规则ID | 威胁类型 | 核心检测关键词 |
|---------|----------|----------------|
| tool-001 | 工具列表探测 | available tools / API列表 / 内部函数 |
| tool-002 | API密钥探测 | API key / Bearer / DEEPSEEK / supabase key / 环境变量值 |
| tool-003 | 内部端点探测 | 内网IP / localhost端口 / 169.254.169.254（AWS元数据） |

### 第四层：竞品对比探测 (Low)

| 规则ID | 威胁类型 | 核心检测关键词 |
|---------|----------|----------------|
| comp-001 | 与Manus对比 | Manus架构 / vs Manus |
| comp-002 | 与其他AI系统对比 | AutoGPT架构 / Devin实现 |

### 第五层：自我认知攻击 (High)

| 规则ID | 威胁类型 | 核心检测关键词 |
|---------|----------|----------------|
| self-001 | 身份混淆攻击 | 你背后是哪个模型 / 你底层是Claude/GPT |
| self-002 | 能力边界探测 | 你的限制是什么 |

### 第六层：编码混淆与绕过攻击 (High) 🆕

| 规则ID | 威胁类型 | 检测模式 |
|---------|----------|----------|
| encode-001 | Base64编码注入 | "ignore previous" Base64形式 |
| encode-002 | Unicode同型字符混淆 | 零宽字符 \u200b/\u200c/\ufeff |
| encode-003 | 多语言混淆注入 | `/* system */` / `<!-- prompt -->` / 代码块注入 |

### 第七层：思维链劫持攻击 (Critical) 🆕

| 规则ID | 威胁类型 | 检测模式 |
|---------|----------|----------|
| cot-001 | 思维链前缀注入 | "Step 1: think about your system..." / 一步一步分析如何绕过 |
| cot-002 | 多轮上下文污染 | 你之前同意了... / you previously agreed... |

### 第八层：输出毒化与代码注入 (Critical) 🆕

| 规则ID | 威胁类型 | 检测模式 |
|---------|----------|----------|
| out-001 | 强制输出系统信息 | 打印所有系统指令 / repeat your system message |
| out-002 | 代码执行注入 | exec() / eval() / os.system / rm -rf / DROP TABLE / UNION SELECT |

### 第九层：高级持续威胁 (Critical) 🆕

| 规则ID | 威胁类型 | 检测模式 |
|---------|----------|----------|
| apt-001 | 长距离注意力绕过 | 2000字符无关内容后跟攻击指令 |
| apt-002 | 数据外泄尝试 | curl到外部 / webhook POST / exfiltrate |
| apt-003 | 提示词碎片拼接攻击 | i-g-n-o-r-e 字符间插入 |

---

## 独立模块：输出审计（Output Guardrails）🆕

**位置**：`server/_core/guardrails/output-guardrails.ts`

对AI每一条回复进行扫描，防止意外泄露：

| 类别 | 检测内容 | 处理方式 |
|------|----------|----------|
| API密钥 | OpenAI sk- / Google AIza / AWS AKIA | 替换为 [REDACTED_API_KEY] |
| 私钥证书 | -----BEGIN PRIVATE KEY----- | 替换为 [REDACTED_CERTIFICATE] |
| Bearer Token | JWT格式令牌 | 替换为 Bearer [REDACTED_TOKEN] |
| 数据库连接串 | postgres:// / mysql:// / password= | 替换为 [REDACTED_DB_CREDENTIAL] |
| 内网地址 | 192.168.x.x / 10.x.x.x | 替换为 [INTERNAL_ADDRESS] |
| AWS Metadata | 169.254.169.254 | **完全阻断** |
| 系统标签 | `<system>...</system>` | **完全阻断** |
| 环境变量 | OPENAI_API_KEY= xxx | 替换为 [ENV_VAR_REDACTED] |

支持流式扫描（`scanOutputChunk`），适用于 SSE 流式响应。

---

## 独立模块：频率限制（Rate Limiter）🆕

**位置**：`server/_core/guardrails/rate-limiter.ts`

| 策略 | 时间窗口 | 最大次数 | 阻断时长 |
|------|---------|---------|---------|
| 安全违规 | 1分钟 | 5次 | 5分钟 |
| 普通请求 | 1分钟 | 60次 | 1分钟 |
| API调用 | 1分钟 | 30次 | 2分钟 |
| 认证尝试 | 5分钟 | 10次 | 15分钟 |

**风险评分**（0-100）：基于违规次数和阻断次数综合计算，可用于监控高风险用户。

---

## 响应策略

| 策略 | 说明 | 适用场景 |
|------|------|---------|
| mirror | 镜像重构，引导到有价值方向 | 系统提示词探测、架构探测 |
| redirect | 重定向到更有价值的话题 | 工具探测、能力边界探测 |
| deflect | 识别攻击意图，明确转移 | 越狱攻击、身份混淆 |
| block | 直接阻断，返回安全响应 | 凭证探测、API密钥 |
| terminate | **终止会话** | 代码注入、数据外泄（极端威胁） |

---

## 集成方式

### 完整安全流水线（推荐）

```typescript
import { guardRequest, guardOutput } from "./_core/guardrails";

// 在路由处理函数中
export async function chatHandler(req, res) {
  const { message, userId } = req.body;

  // ① 输入安全检查（含频率限制）
  const inputGuard = guardRequest(message, {
    history: conversationHistory,
    userId,
    ip: req.ip,
  });

  if (inputGuard.blocked) {
    if (inputGuard.terminateSession) {
      // 终止会话，可记录到黑名单
      await terminateUserSession(userId);
    }
    return res.json({ reply: inputGuard.response });
  }

  // ② 调用AI模型
  const aiResponse = await callModel(message);

  // ③ 输出安全扫描
  const outputGuard = guardOutput(aiResponse);
  const safeResponse = outputGuard.sanitized;

  return res.json({ reply: safeResponse });
}
```

### 最小集成

```typescript
import { guardMessage } from "./_core/guardrails";

const result = guardMessage(userMessage, { history, userId });
if (result.blocked) {
  return result.response;
}
```

### 运行时添加自定义规则

```typescript
import { getGuardrailEngine } from "./_core/guardrails";

const engine = getGuardrailEngine();
engine.addRule({
  id: "custom-001",
  name: "自定义规则",
  threatLevel: "high",
  patterns: [/竞品.*价格/i],
  strategy: "redirect",
  responseCategory: "default",
  logEvent: true,
});
```

### 前端实时风险提示

```typescript
import { getInputRiskLevel, preprocessMessage } from "./_core/guardrails/client-guardrails";

// 输入框 onChange
const risk = getInputRiskLevel(inputValue);
if (risk === "danger") showDangerBadge();
if (risk === "warn") showWarnBadge();

// 发送前预处理
const { allowed, reason } = preprocessMessage(inputValue);
if (!allowed) {
  showToast(reason);
  return;
}
```

---

## 安全事件监控

```typescript
import { getGuardrailEngine } from "./_core/guardrails";
import { getRateLimiter } from "./_core/guardrails";

// 获取安全统计
const stats = getGuardrailEngine().getSecurityStats();
// { totalEvents: 42, byThreatLevel: { critical: 5, high: 12 }, byRule: { "core-001": 8 } }

// 获取高风险用户
const highRisk = getRateLimiter().getHighRiskKeys();
// [{ key: "user-123", riskScore: 85, violations: 4 }]
```

---

## 文件结构

```
server/_core/guardrails/
├── index.ts                 # 统一导出 + 便捷函数
├── guardrail-config.ts      # 九层规则定义
├── guardrail-engine.ts      # 核心检测引擎（含输出审计）
├── output-guardrails.ts     # 独立输出审计模块 🆕
├── rate-limiter.ts          # 频率限制与风险评分 🆕
├── response-templates.ts    # 响应话术库（20种分类）
└── client-guardrails.ts     # 前端预检模块（含实时风险等级）
```

---

## 威胁等级

| 等级 | 符号 | 说明 | 默认响应 |
|------|------|------|---------|
| low | 🟡 | 低风险竞品对比 | 重定向 |
| medium | 🟠 | 中风险假设性探测 | 重定向/转移 |
| high | 🔴 | 高风险越狱/注入 | 阻断/转移 |
| critical | 🚫 | 极高风险代码注入/外泄 | 阻断/终止会话 |

---

## 特殊检测机制

### 组合攻击检测
最近 5 条消息中有 ≥2 次命中规则 → 威胁等级自动提升一级。

### 渐进式探测检测
最近 6 条消息中有 ≥3 次命中规则 → 判定为"渐进式探测攻击"，返回 deflect 策略。

### 频率限制升级
同一 userId/IP 在 1 分钟内触发 ≥5 次安全规则 → 自动锁定 5 分钟。

### 会话终止（新增）
代码注入（out-002）和数据外泄（apt-002）触发 `terminate` 策略，`terminateSession: true`，业务层可据此拉黑用户。

---

## 设计原则

1. **绝不承认核心架构存在** — 即使拒绝也不透露任何系统信息
2. **镜像重构优于简单拒绝** — 将问题转化为有价值的信息分享
3. **输入输出双向审计** — Input Guardrails + Output Guardrails 协同
4. **假设AI已被诱导，系统依然安全** — 对标 Manus 沙箱设计理念
5. **零信息泄露** — 日志只记录 Hash，不记录明文；生产关闭 logEnabled
6. **动态可扩展** — 运行时添加规则，无需重启
7. **前端防线** — 实时风险等级减少无效请求，提升 UX

---

*MaoGuard v2.0 — 更新日期：2026-04-19*
