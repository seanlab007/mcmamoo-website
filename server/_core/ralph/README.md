# Ralph × MaoAI Core 2.0 PoC

## 概述

Ralph 是一个 AI 自主迭代工作流框架，而非传统意义上的"高并发任务编排引擎"。其核心价值在于**任务粒度控制 + 质量门禁 + 知识沉淀**。

## 核心定位修正

| 原认知 | 修正后定位 |
|--------|-----------|
| 高并发任务调度 | AI 自主迭代工作流框架 |
| 任务并行执行 | 串行迭代执行（每次一个 Story） |
| 数据流处理 | 代码生成质量守门员 |

## 架构整合

Ralph Scheduler (Task Level) 控制任务编排，Triad Loop (Implementation Level) 控制具体实现。

## 文件结构

- `ralph-adapter.ts` - 核心适配器
- `prd-schema.ts` - 扩展 Schema

## 快速开始

```typescript
import { createRalphAdapter } from "./ralph-adapter";
import { validatePrd } from "./prd-schema";

const adapter = createRalphAdapter("/path/to/workspace");
await adapter.initPrd({
  project: "My Project",
  description: "Project description",
  createdBy: "user@example.com",
});

await adapter.addUserStory({
  title: "Implement login API",
  description: "As a user, I want to login...",
  acceptanceCriteria: ["Reviewer scores >= 80"],
  priority: 1,
  triadConfig: {
    coder: "claude-sonnet-4",
    reviewer: "gpt-4o",
    validatorType: "docker",
    scoreThreshold: 80,
  },
});

const result = await adapter.runLoop();
```

## 后续计划

- Phase 1: Ralph Adapter + prd-schema（当前 PoC）
- Phase 2: 集成 Decision Ledger 双向同步
- Phase 3: WebSocket 实时推送
- Phase 4: 前端任务看板 UI
