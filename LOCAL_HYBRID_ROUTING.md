# 本地模型 + 云端模型混合路由方案

**文档版本**: v1.0  
**更新日期**: 2026-04-19  
**目标**: 打通 Ollama ↔ WorkBuddy ↔ MaoAI ↔ OpenClaw，实现零 Token 消耗的本地运行

---

## 🎯 核心目标

1. **节省 Token 成本** - 本地运行 Ollama 模型，零 API 费用
2. **无缝切换** - 根据任务复杂度自动/手动切换本地/云端模型
3. **统一接口** - WorkBuddy、MaoAI、OpenClaw 共享同一套本地模型池
4. **技能复用** - 本地模型支持 Skills 系统，与云端模型能力对齐

---

## 🏗️ 架构设计

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              用户层 (User Layer)                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  WorkBuddy   │  │    MaoAI     │  │   OpenClaw   │  │    CLI       │    │
│  │   (IDE)      │  │   (Web UI)   │  │  (Agent)     │  │  (Terminal)  │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
└─────────┼─────────────────┼─────────────────┼─────────────────┼────────────┘
          │                 │                 │                 │
          └─────────────────┴─────────┬───────┴─────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MaoAI Gateway (Port 3000)                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Smart Router (智能路由)                         │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │    │
│  │  │ 本地节点优先  │  │ 云端模型备用  │  │   混合模式 (Hybrid)       │  │    │
│  │  │ (useLocal)   │  │  (Cloud)     │  │  简单任务→本地            │  │    │
│  │  └──────┬───────┘  └──────┬───────┘  │  复杂任务→云端            │  │    │
│  │         │                 │          └──────────────────────────┘  │    │
│  │         └────────┬────────┘                                        │    │
│  │                  ▼                                                 │    │
│  │  ┌─────────────────────────────────────────────────────────────┐   │    │
│  │  │              AI Nodes Registry (节点注册表)                   │   │    │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐  │   │    │
│  │  │  │ Ollama   │ │WorkBuddy │ │ OpenClaw │ │  Cloud Models  │  │   │    │
│  │  │  │ 本地节点  │ │ 本地节点  │ │ 本地节点  │ │ (DeepSeek等)   │  │   │    │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └────────────────┘  │   │    │
│  │  └─────────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────────────┐
│   Ollama        │      │  WorkBuddy      │      │    Cloud Providers      │
│ (Port 11434)    │      │  (Port 8080)    │      │  (DeepSeek/Claude/etc)  │
│                 │      │                 │      │                         │
│ • gemma3:4b     │      │ • Skills        │      │ • 付费 API              │
│ • qwen2.5:7b    │      │ • Tools         │      │ • 高性能                │
│ • qwen2.5:3b    │      │ • Agents        │      │ • 大上下文              │
│ • nomic-embed   │      │                 │      │                         │
└─────────────────┘      └─────────────────┘      └─────────────────────────┘
```

---

## 🔧 当前状态

### ✅ 已就绪

| 组件 | 状态 | 说明 |
|------|------|------|
| Ollama | ✅ 运行中 | Port 11434，已有 6 个模型 |
| MaoAI | ✅ 支持本地节点 | 自动发现 Ollama 模型 |
| Node Registry | ✅ 可用 | `/api/ai/node/register` |
| Skills Sync | ✅ 可用 | `/api/ai/node/skills/sync` |

### 📊 当前 Ollama 模型

```json
{
  "models": [
    {"name": "gemma3:4b", "parameter_size": "4.3B", "quantization": "Q4_K_M"},
    {"name": "qwen2.5:7b", "parameter_size": "7.6B", "quantization": "Q4_K_M"},
    {"name": "qwen2.5:3b", "parameter_size": "3.1B", "quantization": "Q4_K_M"},
    {"name": "nomic-embed-text", "parameter_size": "137M", "quantization": "F16"},
    {"name": "all-minilm", "parameter_size": "23M", "quantization": "F16"}
  ]
}
```

---

## 🚀 快速开始

### 1. 启动 MaoAI 本地开发服务器

```bash
cd /Users/daiyan/Desktop/mcmamoo-website

# 确保环境变量配置正确
cat .env.local << EOF
# 本地 Ollama 配置
OLLAMA_BASE_URL=http://127.0.0.1:11434
NODE_REGISTRATION_TOKEN=your-secret-token

# 云端 API Keys（可选，用于混合模式）
DEEPSEEK_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIzaSy...
EOF

# 启动开发服务器
pnpm dev
```

### 2. 验证本地节点自动发现

```bash
# 检查 Ollama 模型是否被自动注册为本地节点
curl http://localhost:3000/api/ai/v1/models

# 预期输出包含本地节点：
# {
#   "data": [
#     {"id": "local:1", "display_name": "Ollama / gemma3:4b", ...},
#     {"id": "local:2", "display_name": "Ollama / qwen2.5:7b", ...}
#   ]
# }
```

### 3. 使用本地模型聊天

**方式 A：管理员模式（前端）**
1. 登录 MaoAI 管理员账号
2. 在模型选择器中切换到 "本地节点" 分组
3. 选择 Ollama 模型开始对话

**方式 B：API 调用**

```bash
# 使用本地节点（管理员权限）
curl -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -H "Cookie: session=your-admin-session" \
  -d '{
    "model": "local:1",
    "useLocal": true,
    "messages": [{"role": "user", "content": "你好"}]
  }'
```

---

## 🔌 WorkBuddy ↔ MaoAI 打通

### WorkBuddy 配置

在 WorkBuddy 中配置 MaoAI 作为本地模型后端：

```json
// ~/.workbuddy/config.json
{
  "ai": {
    "provider": "maoai-local",
    "baseUrl": "http://localhost:3000/api/ai",
    "nodeRegistrationToken": "your-secret-token"
  }
}
```

### 节点自注册

WorkBuddy 启动时自动向 MaoAI 注册：

```typescript
// WorkBuddy 启动脚本
async function registerWithMaoAI() {
  const res = await fetch('http://localhost:3000/api/ai/node/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: process.env.NODE_REGISTRATION_TOKEN,
      name: 'WorkBuddy / Local',
      baseUrl: 'http://localhost:8080/v1',  // WorkBuddy 本地 API
      type: 'workbuddy',
      modelId: 'workbuddy-local',
      priority: 100
    })
  });
  return res.json();
}
```

---

## 🔄 混合路由策略

### 策略 1：手动切换（当前支持）

用户主动选择使用本地或云端模型：

```typescript
// 前端代码
const [useLocal, setUseLocal] = useState(false);

// 发送请求
fetch('/api/ai/chat/stream', {
  method: 'POST',
  body: JSON.stringify({
    model: useLocal ? 'local:1' : 'deepseek-chat',
    useLocal,  // 管理员权限检查
    messages
  })
});
```

### 策略 2：自动路由（建议实现）

根据任务复杂度自动选择模型：

```typescript
// server/smartRouter.ts
async function autoSelectModel(userMessage: string, userRole: string) {
  // 简单任务 → 本地模型
  const simpleTasks = /^(你好|hi|hello|谢谢|再见|帮助)$/i;
  if (simpleTasks.test(userMessage.trim())) {
    return selectLocalNode('light');  // qwen2.5:3b
  }
  
  // 代码生成 → 本地代码模型
  if (userMessage.includes('```') || userMessage.includes('代码')) {
    return selectLocalNode('code');  // qwen2.5:7b
  }
  
  // 复杂推理 → 云端模型
  if (userMessage.length > 500 || userMessage.includes('分析')) {
    return selectCloudModel('deepseek-reasoner');
  }
  
  // 默认 → 本地轻量模型
  return selectLocalNode('light');
}
```

### 策略 3：Fallback 模式

本地模型失败时自动切换到云端：

```typescript
// server/aiStream.ts
async function streamWithFallback(messages, preferredModel) {
  // 先尝试本地模型
  if (preferredModel.startsWith('local:')) {
    const result = await streamFromNode(node, messages, res);
    if (!result.success) {
      // 本地失败，切换到云端
      console.log('[Fallback] Local node failed, switching to cloud');
      return streamFromCloud('deepseek-chat', messages, res);
    }
  }
}
```

---

## 💰 Token 成本对比

| 使用场景 | 云端模型成本 | 本地模型成本 | 节省比例 |
|----------|-------------|-------------|----------|
| 日常问答 (1K tokens) | ¥0.01-0.05 | ¥0 (电费) | 100% |
| 代码生成 (10K tokens) | ¥0.1-0.5 | ¥0 (电费) | 100% |
| 文档摘要 (50K tokens) | ¥0.5-2.5 | ¥0 (电费) | 100% |
| 复杂推理 (100K tokens) | ¥1-5 | ¥0.5-1 (云端) | 50-80% |

> 注：本地运行主要成本是电费和硬件折旧，M3 MacBook Pro 运行 7B 模型约 30W 功耗。

---

## 🛠️ 高级配置

### 1. 添加更多 Ollama 模型

```bash
# 推荐模型列表
ollama pull llama3.2:3b          # Meta 轻量模型
ollama pull phi4:3b              # Microsoft 轻量模型
ollama pull deepseek-r1:7b       # DeepSeek 推理模型
ollama pull qwen2.5-coder:7b     # 代码专用模型
ollama pull nomic-embed-text     # 文本嵌入模型

# 验证安装
ollama list
```

### 2. 配置模型优先级

```typescript
// server/models.ts 添加本地模型优先级配置
const LOCAL_MODEL_PRIORITY = {
  'qwen2.5:3b': 100,      // 最高优先级 - 轻量快速
  'gemma3:4b': 90,        // 次高优先级 - 均衡
  'qwen2.5:7b': 70,       // 中等优先级 - 性能较好
  'qwen2.5-coder:7b': 60, // 代码任务专用
};
```

### 3. Skills 系统对接

本地模型支持 Skills 系统：

```bash
# 向 MaoAI 注册 WorkBuddy Skills
curl -X POST http://localhost:3000/api/ai/node/skills/sync \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-secret-token",
    "nodeId": 1,
    "action": "upsert",
    "skills": [
      {
        "skillId": "file_read",
        "name": "读取文件",
        "triggers": ["读文件", "打开文件", "查看文件"],
        "invokeMode": "invoke",
        "required_plan": "free"
      }
    ]
  }'
```

---

## 📊 监控与日志

### 本地节点监控

```bash
# 查看节点状态
curl http://localhost:3000/api/ai/status

# 预期输出：
# {
#   "status": "ok",
#   "models": { ... },
#   "nodes": {
#     "total": 3,
#     "online": 3
#   }
# }
```

### Ollama 性能监控

```bash
# 查看 Ollama 运行状态
ollama ps

# 输出示例：
# NAME          ID    SIZE    PROCESSOR    UNTIL
# qwen2.5:7b    xxx   4.7 GB  100% GPU     4 minutes from now
```

---

## 🔒 安全注意事项

1. **本地节点仅限管理员** - `useLocal` 参数需要管理员权限
2. **Token 保护** - `NODE_REGISTRATION_TOKEN` 不要泄露
3. **网络隔离** - 生产环境建议限制 `OLLAMA_BASE_URL` 为内网地址
4. **资源限制** - 本地模型可能占用大量内存，建议设置上限

---

## 📝 后续优化建议

### Phase 1：完善本地体验（已完成基础）
- [x] Ollama 自动发现
- [x] 本地节点注册
- [x] Skills 同步

### Phase 2：智能路由（建议实现）
- [ ] 任务复杂度自动评估
- [ ] 本地/云端自动切换
- [ ] Fallback 失败重试

### Phase 3：性能优化（未来）
- [ ] 本地模型量化优化
- [ ] GPU 加速支持
- [ ] 模型热加载

### Phase 4：生态打通（未来）
- [ ] OpenClaw 完全集成
- [ ] WorkBuddy Skills 市场
- [ ] 跨设备模型共享

---

## 📞 技术支持

- **项目负责人**: Sean Dai (Benedict Ashford)
- **GitHub**: https://github.com/seanlab007/mcmamoo-website
- **Ollama 文档**: https://ollama.ai/docs

---

*本文档由 AI Agent 自动生成，如有疑问请联系开发团队。*
