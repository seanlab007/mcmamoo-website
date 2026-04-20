# MaoAI 工业级架构方案

> 基于肖弘先生提出的三大工程支柱设计

## 一、架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                     MaoAI Industrial Architecture                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐   │
│  │   Client    │───>│   Router    │───>│  Semantic Cache │   │
│  │   Request   │    │  (Model)    │    │  (<50ms hit)    │   │
│  └─────────────┘    └──────┬──────┘    └─────────────────┘   │
│                             │                                  │
│         ┌───────────────────┼───────────────────┐              │
│         │                   │                   │              │
│         ▼                   ▼                   ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐   │
│  │   FREE      │    │   CHEAP     │    │   EXPENSIVE     │   │
│  │  (GLM-4    │    │ (DeepSeek)  │    │  (Claude/GPT)   │   │
│  │   Flash)   │    │             │    │                 │   │
│  └─────────────┘    └─────────────┘    └─────────────────┘   │
│         │                   │                   │              │
│         └───────────────────┼───────────────────┘              │
│                             │                                  │
│                             ▼                                  │
│                    ┌─────────────┐                            │
│                    │  Inference  │                            │
│                    │ Optimizer   │                            │
│                    │  (SSE/SSE)  │                            │
│                    └─────────────┘                            │
│                             │                                  │
│                             ▼                                  │
│                    ┌─────────────┐                            │
│                    │ Data        │                            │
│                    │ Flywheel    │                            │
│                    │ (Feedback)  │                            │
│                    └─────────────┘                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 二、三大核心模块

### 2.1 模型路由 (Model Routing)

**目标**：成本节省 60%-80%

**三级路由体系**：
1. **一级路由（关键词/长度）**：<20字符简单请求 → 免费模型
2. **二级路由（意图分类）**：正则+关键词匹配请求复杂度
3. **三级路由（动态重试）**：置信度低时自动升级

**成本映射**：
| Tier | 模型 | 成本/1K tokens |
|------|------|----------------|
| free | GLM-4 Flash | $0.001 |
| cheap | DeepSeek Chat | $0.014 |
| expensive | Claude Sonnet | $0.03 |
| max | Claude Opus | $0.075 |

### 2.2 语义缓存 (Semantic Cache)

**目标**：响应时间 < 50ms，节省 40%+ API 调用

- 使用向量哈希生成语义指纹
- 余弦相似度匹配（阈值 0.95）
- LRU + TTL 淘汰策略

### 2.3 推理加速 (Inference Optimization)

**SSE 流式输出**：
- 首字响应 < 200ms（TTFT）
- 支持心跳保活
- 实时进度推送

### 2.4 数据闭环 (Data Flywheel)

**自动化流水线**：
1. 埋点采集：点赞/点踩、追问、修改
2. 负面样本提取：自动筛选低质量对话
3. LLM-as-a-Judge：模型审计分析
4. 自动 Prompt 优化：A/B Test 框架

## 三、集成方式

```typescript
import { 
  industrialProcessor, 
  quickRoute, 
  checkCache, 
  recordFeedback 
} from "./server/industrial-ai";

// 路由选择
const routing = await quickRoute(userInput, sessionId, preferModel);

// 缓存检查
const cached = checkCache(userInput);
if (cached.hit) return cached.response;

// 记录反馈
recordFeedback(sessionId, messageId, "thumbs_up");
```

## 四、性能目标

| 指标 | 目标 | 实现 |
|------|------|------|
| 首字响应 (TTFT) | < 200ms | SSE Streaming |
| 缓存命中响应 | < 50ms | Semantic Cache |
| API 成本节省 | 60-80% | Model Routing |
| 负面样本识别 | 自动 | Data Flywheel |

---
生成时间：2026-04-21
