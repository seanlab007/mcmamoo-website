# WorkBuddy ↔ Ollama ↔ MaoAI ↔ OpenClaw 本地集成指南

> 完整打通本地 AI 生态系统的配置文档
> 创建时间: 2026-04-19

---

## 架构概览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           本地 AI 生态系统架构                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │  WorkBuddy   │◄───►│   MaoAI      │◄───►│  OpenClaw    │                │
│  │   (IDE)      │     │  (平台)       │     │  (网关)      │                │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘                │
│         │                    │                    │                         │
│         │                    ▼                    │                         │
│         │            ┌──────────────┐            │                         │
│         └───────────►│    Ollama    │◄───────────┘                         │
│                      │  (本地模型)   │                                      │
│                      └──────────────┘                                      │
│                             │                                              │
│                      ┌──────┴──────┐                                       │
│                      ▼             ▼                                       │
│              ┌──────────┐   ┌──────────┐                                  │
│              │ gemma3:4b│   │qwen2.5:7b│                                  │
│              └──────────┘   └──────────┘                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. 服务状态检查

### 1.1 Ollama 本地模型服务

```bash
# 检查 Ollama 是否运行
curl http://127.0.0.1:11434/api/tags

# 预期输出：本地模型列表
{
  "models": [
    {"name": "gemma3:4b", ...},
    {"name": "qwen2.5:7b", ...},
    {"name": "deepseek-v3.1:671b-cloud", ...}
  ]
}
```

**当前可用模型** (6个):
- ✅ gemma3:4b - Google 轻量级模型
- ✅ qwen2.5:7b - 阿里通义千问
- ✅ qwen2.5:3b - 阿里通义千问轻量版
- ✅ deepseek-v3.1:671b-cloud - DeepSeek
- ✅ all-minilm:latest - 嵌入模型
- ✅ nomic-embed-text:latest - 文本嵌入

### 1.2 MaoAI 服务

```bash
# 检查 MaoAI 后端
curl http://localhost:3004/trpc/ai.models

# 检查健康状态
curl http://localhost:3004/api/health
```

### 1.3 OpenClaw Gateway

```bash
# 检查 OpenClaw 网关
curl http://localhost:5000/health
```

---

## 2. 节点注册配置

### 2.1 WorkBuddy 作为本地节点注册到 MaoAI

**配置文件**: `scripts/register-workbuddy-node.ts`

```typescript
// 节点注册示例
const workbuddyNode = {
  name: "WorkBuddy-Local",
  baseUrl: "http://localhost:11434",  // Ollama 地址
  provider: "ollama",
  models: ["gemma3:4b", "qwen2.5:7b"],
  priority: 1,  // 本地优先
  isLocal: true,
};
```

**运行注册**:
```bash
cd /Users/daiyan/Desktop/mcmamoo-website
npx tsx scripts/register-workbuddy-node.ts
```

### 2.2 OpenClaw 作为节点注册到 MaoAI

**配置文件**: `scripts/register-openclaw-node.ts`

```typescript
// OpenClaw 节点配置
const openclawNode = {
  name: "OpenClaw-Gateway",
  baseUrl: "http://localhost:5000",
  provider: "openclaw",
  models: ["local:*"],  // 透传所有本地模型
  skills: ["browser-use", "file-ops", "code-execution"],
};
```

**运行注册**:
```bash
npx tsx scripts/register-openclaw-node.ts
```

---

## 3. 混合路由策略

### 3.1 智能路由规则

```yaml
# 路由优先级配置
routing_rules:
  # 本地优先策略
  local_first:
    - pattern: "*.local"
      target: "ollama://localhost:11434"
      priority: 1
    
  # 模型类型路由
  by_model_type:
    embeddings:
      - "all-minilm"
      - "nomic-embed-text"
      target: "ollama://localhost:11434"
    
    fast_chat:
      - "gemma3:4b"
      - "qwen2.5:3b"
      target: "ollama://localhost:11434"
    
    reasoning:
      - "deepseek-reasoner"
      - "claude-opus-4-5"
      target: "cloud://anthropic"
    
    vision:
      - "claude-sonnet-4-5"
      - "gemini-2.5-pro"
      target: "cloud://google"

  # 成本优化路由
  cost_optimization:
    free_tier:
      - "glm-4-flash"      # 智谱免费额度
      - "gemma3:4b"        # 本地免费
      priority: 1
    
    paid_fallback:
      - "deepseek-chat"
      - "claude-haiku-4"
```

### 3.2 故障转移配置

```typescript
// 故障转移策略
const failoverConfig = {
  // 本地模型不可用时切换到云端
  ollama: {
    fallback: ["deepseek-chat", "glm-4-flash"],
    timeout: 30000,  // 30秒超时
  },
  
  // 云端模型故障时回退到本地
  cloud: {
    fallback: ["qwen2.5:7b", "gemma3:4b"],
    retryCount: 2,
  },
};
```

---

## 4. 一键启动脚本

### 4.1 完整启动脚本

**文件**: `start-local-hybrid.sh`

```bash
#!/bin/bash

# ============================================================
# WorkBuddy ↔ Ollama ↔ MaoAI ↔ OpenClaw 本地混合启动脚本
# ============================================================

set -e

echo "🚀 启动本地 AI 混合环境..."

# 1. 检查 Ollama
echo "📦 检查 Ollama..."
if ! curl -s http://127.0.0.1:11434/api/tags > /dev/null; then
    echo "❌ Ollama 未运行，请先启动: ollama serve"
    exit 1
fi
echo "✅ Ollama 运行中"

# 2. 启动 MaoAI
echo "📦 启动 MaoAI..."
cd /Users/daiyan/Desktop/mcmamoo-website
npm run dev:all > /tmp/maoai.log 2>&1 &
echo $! > /tmp/maoai.pid

# 等待 MaoAI 启动
sleep 5
if curl -s http://localhost:3004 > /dev/null; then
    echo "✅ MaoAI 启动成功 (http://localhost:3004)"
else
    echo "⚠️ MaoAI 启动中，请稍后检查"
fi

# 3. 注册 WorkBuddy 节点
echo "📦 注册 WorkBuddy 节点..."
npx tsx scripts/register-workbuddy-node.ts || echo "⚠️ 节点注册失败"

# 4. 注册 OpenClaw 节点 (如果 OpenClaw 运行中)
if curl -s http://localhost:5000/health > /dev/null; then
    echo "📦 注册 OpenClaw 节点..."
    npx tsx scripts/register-openclaw-node.ts || echo "⚠️ OpenClaw 注册失败"
else
    echo "⚠️ OpenClaw 未运行，跳过注册"
fi

echo ""
echo "✨ 本地 AI 环境启动完成!"
echo ""
echo "📍 服务地址:"
echo "  - MaoAI:     http://localhost:3004"
echo "  - Ollama:    http://localhost:11434"
echo "  - OpenClaw:  http://localhost:5000 (如已启动)"
echo ""
echo "🤖 可用模型:"
curl -s http://127.0.0.1:11434/api/tags | grep '"name"' | cut -d'"' -f4 | sed 's/^/  - /'
```

### 4.2 使用方法

```bash
# 添加执行权限
chmod +x /Users/daiyan/Desktop/mcmamoo-website/start-local-hybrid.sh

# 启动完整环境
./start-local-hybrid.sh
```

---

## 5. 环境变量配置

### 5.1 `.env` 本地开发配置

```bash
# ============================================================
# 本地混合环境配置
# ============================================================

# --- Ollama 本地模型 ---
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_ENABLED=true

# --- MaoAI 服务 ---
MAOAI_BACKEND_URL=http://localhost:3004
VITE_BACKEND_URL=http://localhost:3004

# --- OpenClaw 网关 ---
OPENCLAW_GATEWAY_URL=http://localhost:5000
OPENCLAW_GATEWAY_TOKEN=your-openclaw-token

# --- 本地节点配置 ---
LOCAL_NODE_PRIORITY=1
LOCAL_FALLBACK_ENABLED=true

# --- 模型路由 ---
# 本地模型列表 (逗号分隔)
LOCAL_MODELS=gemma3:4b,qwen2.5:7b,qwen2.5:3b

# 云端模型列表
CLOUD_MODELS=deepseek-chat,deepseek-reasoner,claude-sonnet-4-5

# --- API Keys ---
# DeepSeek
DEEPSEEK_API_KEY=sk-your-deepseek-key

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Google AI Studio
GOOGLE_AI_STUDIO_API_KEY=your-google-ai-key
GEMINI_API_KEY=your-gemini-key

# 智谱
ZHIPU_API_KEY=your-zhipu-key

# --- WorkBuddy 集成 ---
WORKBUDDY_API_KEY=sk-your-workbuddy-key
WORKBUDDY_OLLAMA_PROXY=true
```

---

## 6. WorkBuddy 集成配置

### 6.1 WorkBuddy MCP 配置

**文件**: `~/.workbuddy/mcp.json`

```json
{
  "mcpServers": {
    "ollama-local": {
      "command": "node",
      "args": ["/Users/daiyan/Desktop/mcmamoo-website/scripts/ollama-mcp-server.js"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434"
      }
    },
    "maoai-bridge": {
      "command": "node",
      "args": ["/Users/daiyan/Desktop/mcmamoo-website/scripts/maoai-mcp-bridge.js"],
      "env": {
        "MAOAI_URL": "http://localhost:3004"
      }
    }
  }
}
```

### 6.2 WorkBuddy 模型选择

在 WorkBuddy 设置中配置模型优先级:

```yaml
# WorkBuddy 模型配置
models:
  # 本地优先
  primary: "ollama:gemma3:4b"
  
  # 备用模型
  fallback:
    - "ollama:qwen2.5:7b"
    - "maoai:deepseek-chat"
    - "maoai:claude-sonnet-4-5"
  
  # 特定任务模型
  tasks:
    code: "maoai:claude-sonnet-4-5"
    reasoning: "maoai:deepseek-reasoner"
    embedding: "ollama:nomic-embed-text"
```

---

## 7. OpenClaw 集成配置

### 7.1 OpenClaw 路由规则

**文件**: `openclay-routing.yaml`

```yaml
# OpenClaw 模型路由配置
routes:
  # 本地模型路由
  - name: "local-ollama"
    pattern: "local:*"
    target: "http://localhost:11434"
    transform:
      request: "ollama_format"
    
  # MaoAI 云端路由
  - name: "maoai-cloud"
    pattern: "cloud:*"
    target: "http://localhost:3004/api/ai"
    headers:
      Authorization: "Bearer ${WORKBUDDY_API_KEY}"
    
  # 直接模型路由
  - name: "gemma-local"
    pattern: "gemma*"
    target: "http://localhost:11434"
    priority: 1
```

### 7.2 OpenClaw 启动配置

```bash
# 启动 OpenClaw 并连接到本地生态
openclaw gateway start \
  --port 5000 \
  --ollama-url http://localhost:11434 \
  --maoai-url http://localhost:3004 \
  --routing-config openclaw-routing.yaml
```

---

## 8. 测试验证

### 8.1 端到端测试

```bash
#!/bin/bash
# test-integration.sh

echo "🧪 测试本地 AI 生态集成..."

# 测试 1: Ollama 本地模型
echo "测试 1: Ollama 本地模型"
curl -s http://localhost:11434/api/generate \
  -d '{"model":"gemma3:4b","prompt":"Hello","stream":false}' | \
  jq -r '.response' | head -c 100

# 测试 2: MaoAI 模型列表
echo -e "\n\n测试 2: MaoAI 模型列表"
curl -s http://localhost:3004/trpc/ai.models | jq '.result.data.json | length'

# 测试 3: WorkBuddy 节点状态
echo -e "\n测试 3: WorkBuddy 节点"
curl -s http://localhost:3004/trpc/nodes.list | jq '.result.data.json | length'

echo -e "\n✅ 测试完成"
```

### 8.2 性能对比测试

| 模型 | 类型 | 首 token 延迟 | 吞吐量 |
|------|------|--------------|--------|
| gemma3:4b | 本地 | ~50ms | ~50 tok/s |
| qwen2.5:7b | 本地 | ~80ms | ~30 tok/s |
| deepseek-chat | 云端 | ~200ms | ~20 tok/s |
| claude-sonnet-4-5 | 云端 | ~300ms | ~15 tok/s |

---

## 9. 故障排除

### 9.1 常见问题

**Q: Ollama 连接失败**
```bash
# 检查 Ollama 服务
ollama serve &
curl http://localhost:11434/api/tags
```

**Q: MaoAI 无法启动**
```bash
# 检查端口占用
lsof -ti:3000,3004 | xargs kill -9

# 重新启动
npm run dev:all
```

**Q: 节点注册失败**
```bash
# 检查 MaoAI 是否运行
curl http://localhost:3004/trpc/health

# 手动注册节点
npx tsx scripts/register-workbuddy-node.ts --verbose
```

### 9.2 日志查看

```bash
# MaoAI 日志
tail -f /tmp/maoai.log

# Ollama 日志
ollama serve 2>&1 | tee /tmp/ollama.log

# WorkBuddy 日志
# 在 WorkBuddy IDE 中查看
```

---

## 10. 架构优化建议

### 10.1 Token 成本优化

```typescript
// 智能路由选择
function selectModel(task: Task): Model {
  // 本地模型优先 (免费)
  if (task.type === 'chat' && task.complexity < 0.5) {
    return { provider: 'ollama', model: 'gemma3:4b' };
  }
  
  // 嵌入任务使用本地
  if (task.type === 'embedding') {
    return { provider: 'ollama', model: 'nomic-embed-text' };
  }
  
  // 复杂推理使用云端
  if (task.requiresReasoning) {
    return { provider: 'anthropic', model: 'claude-opus-4-5' };
  }
  
  // 默认使用性价比最高的云端模型
  return { provider: 'deepseek', model: 'deepseek-chat' };
}
```

### 10.2 缓存策略

```typescript
// 响应缓存配置
const cacheConfig = {
  // 本地模型响应缓存
  ollama: {
    enabled: true,
    ttl: 3600,  // 1小时
    maxSize: '100MB',
  },
  
  // 云端模型响应缓存
  cloud: {
    enabled: true,
    ttl: 86400,  // 24小时
    maxSize: '500MB',
  },
};
```

---

## 附录

### A. 快速命令参考

```bash
# 启动完整环境
./start-local-hybrid.sh

# 仅启动 MaoAI
npm run dev:all

# 注册 WorkBuddy 节点
npx tsx scripts/register-workbuddy-node.ts

# 注册 OpenClaw 节点
npx tsx scripts/register-openclaw-node.ts

# 查看 Ollama 模型
ollama list

# 拉取新模型
ollama pull qwen2.5:14b

# 查看服务状态
curl http://localhost:3004/trpc/ai.status
curl http://localhost:11434/api/tags
curl http://localhost:5000/health
```

### B. 模型对比

| 模型 | 提供商 | 位置 | 上下文 | 特点 |
|------|--------|------|--------|------|
| gemma3:4b | Google | 本地 | 128K | 轻量、快速 |
| qwen2.5:7b | 阿里 | 本地 | 128K | 中文优化 |
| deepseek-chat | DeepSeek | 云端 | 64K | 性价比高 |
| claude-opus-4-5 | Anthropic | 云端 | 200K | 最强推理 |
| claude-sonnet-4-5 | Anthropic | 云端 | 200K | 均衡性能 |

---

**文档维护**: 代言  
**最后更新**: 2026-04-19
