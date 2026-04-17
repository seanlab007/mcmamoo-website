# MaoAI 节点接入指南

本文档说明如何将 OpenManus、OpenClaw、WorkBuddy 等 AI 节点接入 MaoAI 统一控制中心。

---

## 方式一：管理员手动添加节点（推荐）

登录 MaoAI → 侧边栏底部点击 **盾牌图标** → 进入管理员控制台 → **节点管理** → **添加节点**。

填写以下信息：

| 字段 | 说明 |
|------|------|
| 节点名称 | 显示名称，如 "OpenManus 云端" |
| 节点类型 | 选择对应类型（openmanus / openclaw / workbuddy / claude_api / openai_compat） |
| API 地址 | 节点的 OpenAI 兼容 API 地址，如 `http://your-server:8000/v1` |
| API Key | 节点的访问密钥（若无则留空） |
| 默认模型 | 节点使用的模型 ID，如 `claude-3-5-sonnet-20241022` |
| 是否付费 | 付费节点（Claude API 等）标记为是，本地/免费节点标记为否 |
| 优先级 | 数字越小优先级越高（默认 100） |

---

## 方式二：节点自动注册 API

节点启动时可调用以下接口自动注册到 MaoAI：

```bash
curl -X POST https://your-maoai-domain.com/api/ai/node/register \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_NODE_REGISTRATION_TOKEN",
    "name": "OpenManus 本地节点",
    "baseUrl": "http://192.168.1.100:8000/v1",
    "type": "openmanus",
    "modelId": "claude-3-5-sonnet-20241022"
  }'
```

`NODE_REGISTRATION_TOKEN` 在 MaoAI 管理员控制台的 Secrets 中配置。

---

## 节点类型说明

| 类型 | 说明 | 适用场景 |
|------|------|---------|
| `claude_api` | 直接调用 Anthropic Claude API | 付费订阅时使用 |
| `openmanus` | OpenManus 代理节点 | 云端/本地 OpenManus 部署 |
| `openclaw` | OpenClaw 节点 | 本地 OpenClaw 实例 |
| `workbuddy` | WorkBuddy 节点 | WorkBuddy 自动化节点 |
| `openai_compat` | 任意 OpenAI 兼容 API | 自定义模型服务 |
| `custom` | 自定义节点 | 其他兼容服务 |

---

## 路由策略配置

在管理员控制台 → **路由策略** 中配置智能路由规则：

- **自动模式（auto）**：根据优先级自动选择最优节点
- **付费优先（paid）**：优先使用 Claude API 等付费节点
- **免费优先（free）**：优先使用本地/免费节点（省钱模式）
- **手动指定（manual）**：固定使用指定节点列表

**负载均衡策略：**
- `priority`：按优先级顺序（默认）
- `round_robin`：轮询分发
- `least_latency`：最低延迟优先

---

## 24 小时多机分工方案

推荐配置：

```
白天（工作时间）→ 路由策略：付费优先
  └── Claude API（云端）— 高质量任务

夜间/非工作时间 → 路由策略：免费优先
  ├── OpenManus（云端）— 自动化任务
  ├── OpenClaw（本地）— 代码分析
  └── WorkBuddy（本地）— 工作流自动化
```

---

## 故障转移

智能路由引擎内置故障转移机制：
1. 首选节点请求失败 → 自动切换到下一优先级节点
2. 所有注册节点失败 → 回退到内置模型（DeepSeek/GLM/Groq）
3. 每次调用自动记录延迟和状态到调用日志

---

## 节点健康检查

管理员可在节点管理页面手动 Ping 节点，检查连通性和延迟。
系统会记录 `lastPingMs` 用于最低延迟路由策略。
