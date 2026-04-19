# Claude Design + Google AI Studio 集成方案

**文档版本**: v1.0  
**更新日期**: 2026-04-19  
**作者**: 润之 (Agent)  
**项目**: seanlab007/mcmamoo-website - 猫眼内容平台 / MaoAI

---

## 📋 概述

本文档描述如何将 **Claude Design (Anthropic)** 和 **Google AI Studio** 深度集成到 MaoAI / 猫眼内容平台中。整合后，用户可以在统一的聊天界面中选择使用以下模型：

| 提供商 | 模型 | 特点 |
|--------|------|------|
| **Anthropic** | Claude Opus 4.5 | 最强推理，支持视觉 |
| **Anthropic** | Claude Sonnet 4.5 | 均衡性能，支持视觉 |
| **Anthropic** | Claude Haiku 4 | 极速响应，轻量级 |
| **Google AI Studio** | Gemma 4 E2B | 移动端优化，全模态 |
| **Google AI Studio** | Gemma 4 E4B | 边缘设备优化，全模态 |
| **Google AI Studio** | Gemma 4 26B | MoE架构，256K上下文 |
| **Google AI Studio** | Gemma 4 31B | 密集架构，最强性能 |

---

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────────────┐
│                        MaoAI 前端 (React)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ Chat.tsx    │  │ 模型选择器   │  │ 消息流 (SSE)            │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MaoAI 后端 (Express)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ aiStream.ts │  │ models.ts   │  │ 智能路由 (AI Nodes)      │  │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────┐  ┌─────────────────┐  ┌─────────────────────────┐
│ DeepSeek    │  │ Anthropic       │  │ Google AI Studio        │
│ API         │  │ Claude API      │  │ Gemini / Gemma API      │
└─────────────┘  └─────────────────┘  └─────────────────────────┘
```

---

## 🔧 已完成的集成

### 1. 后端模型配置 (`server/models.ts`)

已添加以下模型配置：

```typescript
// Anthropic Claude 模型
"claude-opus-4-5": {
  name: "Claude Opus 4.5",
  badge: "MAX",
  provider: "anthropic",
  model: "claude-opus-4-5-20251101",
  baseUrl: "https://api.anthropic.com/v1",
  maxTokens: 8192,
  supportsVision: true,
  supportsReasoning: true,
},
"claude-sonnet-4-5": {
  name: "Claude Sonnet 4.5",
  badge: "PRO",
  provider: "anthropic",
  model: "claude-sonnet-4-5-20251101",
  baseUrl: "https://api.anthropic.com/v1",
  maxTokens: 8192,
  supportsVision: true,
  supportsReasoning: true,
},
"claude-haiku-4": {
  name: "Claude Haiku 4",
  badge: "FAST",
  provider: "anthropic",
  model: "claude-haiku-4-20251101",
  baseUrl: "https://api.anthropic.com/v1",
  maxTokens: 4096,
  supportsVision: true,
},

// Google AI Studio 模型 (已存在)
"gemma-4-e2b-it": { ... },
"gemma-4-e4b-it": { ... },
"gemma-4-26b-it": { ... },
"gemma-4-31b-it": { ... },
```

### 2. 前端模型选择器 (`client/src/pages/Chat.tsx`)

已更新 MODELS 数组：

```typescript
const MODELS = [
  // DeepSeek
  { id: "deepseek-chat",     label: "DeepSeek Chat",      desc: "主力 · 推荐",    group: "DeepSeek" },
  { id: "deepseek-reasoner", label: "DeepSeek Reasoner",  desc: "深度推理",       group: "DeepSeek" },
  
  // Anthropic Claude (新增)
  { id: "claude-opus-4-5",   label: "Claude Opus 4.5",    desc: "Anthropic · 最强", group: "Claude" },
  { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5",  desc: "Anthropic · 均衡", group: "Claude" },
  { id: "claude-haiku-4",    label: "Claude Haiku 4",     desc: "Anthropic · 极速", group: "Claude" },
  
  // Groq、智谱、Gemini、Google AI (已存在)
  ...
];
```

### 3. 环境变量配置 (`.env.example`)

```bash
# ── Anthropic Claude ──────────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ── Google AI Studio ───────────────────────────────────────────────────
GOOGLE_AI_STUDIO_API_KEY=your-google-ai-studio-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

---

## 🚀 部署步骤

### 本地开发环境

```bash
# 1. 进入项目目录
cd /Users/daiyan/Desktop/mcmamoo-website

# 2. 复制环境变量模板
cp .env.example .env.local

# 3. 编辑 .env.local，添加 API Keys
# ANTHROPIC_API_KEY=sk-ant-api03-...
# GOOGLE_AI_STUDIO_API_KEY=...

# 4. 安装依赖
pnpm install

# 5. 启动开发服务器
pnpm dev
```

### 生产环境 (Railway/Render/Vercel)

1. 在部署平台的 Environment Variables 中添加：
   - `ANTHROPIC_API_KEY`
   - `GOOGLE_AI_STUDIO_API_KEY`
   - `GEMINI_API_KEY`

2. 重新部署应用

---

## 📊 模型对比

| 模型 | 提供商 | 上下文 | 视觉 | 音频 | 视频 | 价格级别 | 适用场景 |
|------|--------|--------|------|------|------|----------|----------|
| Claude Opus 4.5 | Anthropic | 200K | ✅ | ❌ | ❌ | $$$ | 复杂推理、代码生成 |
| Claude Sonnet 4.5 | Anthropic | 200K | ✅ | ❌ | ❌ | $$ | 日常对话、内容创作 |
| Claude Haiku 4 | Anthropic | 200K | ✅ | ❌ | ❌ | $ | 快速响应、轻量任务 |
| Gemma 4 E2B | Google | 128K | ✅ | ✅ | ✅ | 免费额度 | 移动端、多模态 |
| Gemma 4 E4B | Google | 128K | ✅ | ✅ | ✅ | 免费额度 | 边缘设备、多模态 |
| Gemma 4 26B | Google | 256K | ✅ | ✅ | ✅ | 免费额度 | 长文本、MoE架构 |
| Gemma 4 31B | Google | 256K | ✅ | ✅ | ✅ | 免费额度 | 最强开源性能 |

---

## 🔌 API 接口

### 聊天流式接口

```http
POST /api/ai/chat/stream
Content-Type: application/json

{
  "model": "claude-opus-4-5",
  "messages": [
    { "role": "user", "content": "你好，请介绍一下自己" }
  ]
}
```

### OpenAI 兼容接口

```http
POST /api/ai/v1/chat/completions
Authorization: Bearer <maoai_session_token>
Content-Type: application/json

{
  "model": "claude-sonnet-4-5",
  "messages": [...],
  "stream": true
}
```

### 获取模型列表

```http
GET /api/ai/v1/models
```

---

## 🛠️ 高级功能

### 1. 视觉能力 (Vision)

Claude 和 Gemma 4 都支持图像输入：

```typescript
// 前端发送图片消息
const message = {
  role: "user",
  content: [
    { type: "text", text: "描述这张图片" },
    { type: "image_url", image_url: { url: "data:image/jpeg;base64,..." } }
  ]
};
```

### 2. 工具调用 (Function Calling)

所有云模型都支持 OpenAI 风格的工具调用：

```typescript
// aiStream.ts 自动处理工具调用循环
const toolDefs = [...];
const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
  body: JSON.stringify({
    model: cfg.model,
    messages,
    tools: toolDefs,
    tool_choice: "auto"
  })
});
```

### 3. 本地节点集成

通过 AI Nodes 系统，可以将 Claude/Gemma 与本地 Ollama 模型混合使用：

```typescript
// 管理员专用：使用本地节点
{ "model": "local:1", "useLocal": true }
```

---

## 🔒 安全注意事项

1. **API Key 保护**
   - 不要在代码中硬编码 API Key
   - 使用环境变量管理
   - 定期轮换密钥

2. **访问控制**
   - 所有 API 调用都经过身份验证
   - 本地节点仅限管理员使用
   - 敏感操作需要管理员权限

3. **输入验证**
   - 所有用户输入严格验证
   - 防止注入攻击
   - 文件上传限制类型和大小

---

## 📈 监控指标

建议监控以下指标：

| 指标 | 目标值 | 说明 |
|------|--------|------|
| API 调用成功率 | > 99% | 各模型提供商的可用性 |
| 响应时间 P95 | < 3秒 | 首 token 返回时间 |
| 错误率 | < 1% | 包含网络错误和 API 错误 |
| 成本监控 | 每日 | 按模型统计 token 使用量 |

---

## 🔄 回滚方案

如果出现兼容性问题：

1. **环境变量回滚**：移除 `ANTHROPIC_API_KEY`
2. **代码回滚**：`git revert <commit-hash>`
3. **模型禁用**：在前端 `MODELS` 数组中注释掉新模型

---

## 📝 更新日志

### 2026-04-19
- ✅ 添加 Claude Opus 4.5 / Sonnet 4.5 / Haiku 4 支持
- ✅ 集成 Google AI Studio Gemma 4 系列
- ✅ 更新前端模型选择器
- ✅ 创建集成文档

---

## 📞 技术支持

- **项目负责人**: Sean Dai (Benedict Ashford)
- **GitHub**: https://github.com/seanlab007/mcmamoo-website
- **技术栈**: TypeScript + React + Node.js + Express

---

*本文档由 AI Agent 自动生成，如有疑问请联系开发团队。*
