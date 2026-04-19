# Rowboat 整合到 MaoAI 方案

## 📋 任务概述

1. **Fork** `rowboatlabs/rowboat` → `seanlab007/rowboat` ✅ (已完成)
2. **整合** Rowboat 的核心能力到 `mcmamoo-website` MaoAI 模块

---

## 🎯 Rowboat 核心能力分析

### 1. 知识图谱系统
| 组件 | 功能 | 复用价值 |
|------|------|----------|
| Qdrant 向量数据库 | 语义搜索、实体关系 | 🔴 高 - 直接集成 |
| 实体提取 (Entity Extraction) | 从内容中识别人物/项目/决策 | 🔴 高 |
| 关系图谱 | 实体之间的关联网络 | 🔴 高 |
| 本地 Markdown 存储 | Obsidian 兼容双向链接 | 🟡 中 - 可参考 |

### 2. MCP (Model Context Protocol)
| 组件 | 功能 | 复用价值 |
|------|------|----------|
| MCP Server | 标准化工具调用协议 | 🔴 高 - 复用现有 mcp-server.ts |
| Composio 集成 | 100+ 工具连接 | 🟡 中 - Slack/Linear/Jira |
| Google 集成 | Gmail/Calendar API | 🟡 中 - 已有 OAuth |

### 3. 记忆系统
| 组件 | 功能 | 复用价值 |
|------|------|----------|
| 长期记忆 vs 临时检索 | 持久化上下文 | 🔴 高 |
| @mentions 机制 | 自动追踪人物/话题 | 🟢 借鉴 |
| 会议简报生成 | 基于历史决策准备 | 🟡 中 |

### 4. 工具生态
| 工具 | 说明 | 复用价值 |
|------|------|----------|
| Fireflies | 会议录制 | 🟢 参考 |
| Deepgram | 语音转文字 | 🟢 参考 |
| ElevenLabs | 语音合成 | 🟢 参考 |
| Exa | 网络搜索 | 🟡 中 |

---

## 🔧 整合架构

### 方案 A: 模块化集成（推荐）

```
mcmamoo-website/
├── rowboat/                    # Rowboat 核心代码（submodule 或复制）
│   ├── apps/                   # Rowboat Electron 应用
│   │   └── rowboat/           # 主应用代码
│   │       ├── graph/         # 知识图谱
│   │       ├── memory/        # 记忆系统
│   │       └── tools/         # MCP 工具
│   ├── packages/
│   │   ├── core/             # 核心库
│   │   └── mcp-server/       # MCP 服务器
│   └── docker-compose.yml    # Qdrant + 服务
│
├── client/src/features/maoai/
│   ├── components/
│   │   ├── KnowledgeGraph/   # 新增：知识图谱可视化
│   │   ├── MemoryPanel/     # 新增：记忆面板
│   │   └── RowboatTools/    # 新增：Rowboat 工具集成
│   └── hooks/
│       ├── useKnowledgeGraph.ts
│       └── useMemory.ts
│
├── server/
│   ├── _core/
│   │   └── mcp-server.ts     # 扩展支持 Rowboat MCP
│   ├── agents/
│   │   └── rowboat-agent.ts  # 新增：Rowboat Agent
│   └── rowboat/
│       ├── graph-engine.ts   # 新增：图谱引擎
│       ├── memory-store.ts   # 新增：记忆存储
│       └── entity-extractor.ts # 新增：实体提取
│
└── docker-compose.yml         # 追加 Qdrant
```

### 方案 B: 服务化集成（适合微服务架构）

```
┌─────────────────────────────────────────────┐
│  mcmamoo-website (Frontend + API)           │
│  localhost:3000                             │
└─────────────────┬───────────────────────────┘
                  │ REST/WebSocket
                  ↓
┌─────────────────────────────────────────────┐
│  rowboat-api (独立服务)                     │
│  localhost:4000                             │
│  - 知识图谱 API                             │
│  - 记忆管理 API                             │
│  - MCP 协议端点                             │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ↓                   ↓
┌───────────────┐   ┌───────────────┐
│  Qdrant       │   │  Rowboat DB   │
│  (向量数据库)  │   │  (SQLite)     │
└───────────────┘   └───────────────┘
```

---

## 📦 需要添加的依赖

```json
// package.json
{
  "dependencies": {
    "@rowboat/core": "workspace:*",      // Rowboat 核心库
    "qdrant-client": "^1.9.0",          // Qdrant 客户端
    "langchain": "^0.1.0",               // LLM 框架
    "@langchain/community": "^0.0.0",
    "nanoid": "^5.0.0"                   // 已有
  }
}
```

### Rowboat 依赖提取清单

从 `rowboat/packages/core` 和 `rowboat/apps/rowboat` 提取：

| 包名 | 用途 |
|------|------|
| `electron-store` | 本地存储 |
| `electron-log` | 日志 |
| `better-sqlite3` | SQLite 数据库 |
| `zod` | 已有 |
| `nanoid` | 已有 |
| `uuid` | ID 生成 |
| `d3` | 图谱可视化 |
| `react-force-graph` | 图谱渲染 |

---

## 🚀 实施步骤

### Phase 1: 环境准备
```bash
# 1. 网络恢复后克隆 Rowboat
git clone git@github.com:seanlab007/rowboat.git

# 2. 添加为 submodule 或复制核心代码
cd mcmamoo-website
git submodule add git@github.com:seanlab007/rowboat.git rowboat

# 3. 启动 Qdrant 向量数据库
docker compose -f rowboat/docker-compose.yml up -d qdrant
```

### Phase 2: 核心模块迁移
```bash
# 复制 Rowboat 核心代码
cp -r rowboat/packages/core packages/rowboat-core
cp -r rowboat/packages/graph packages/rowboat-graph
cp -r rowboat/packages/memory packages/rowboat-memory

# 复制 MCP 相关
cp -r rowboat/packages/mcp-server server/mcp/rowboat-mcp
```

### Phase 3: 前端集成
```bash
# 添加知识图谱可视化
mkdir -p client/src/features/maoai/components/KnowledgeGraph
cp rowboat/apps/rowboat/src/components/GraphView* client/src/features/maoai/components/KnowledgeGraph/

# 添加记忆面板
mkdir -p client/src/features/maoai/components/MemoryPanel
```

### Phase 4: API 扩展
```typescript
// server/rowboat/graph-engine.ts
import { RowboatGraph } from '@rowboat/graph';

export class MaoAIGraphEngine {
  private graph: RowboatGraph;
  
  async extractEntities(text: string): Promise<Entity[]> {
    // 复用 Rowboat 的实体提取
  }
  
  async queryGraph(query: string): Promise<GraphResult> {
    // 语义搜索知识图谱
  }
  
  async addMemory(content: string, context: MemoryContext) {
    // 存储到知识图谱
  }
}
```

### Phase 5: 调试与优化
1. 测试 Qdrant 连接
2. 验证实体提取准确性
3. 性能调优（批量写入、缓存）

---

## 🎨 前端集成示意

```tsx
// client/src/features/maoai/components/MemoryPanel.tsx
import { useKnowledgeGraph } from '../hooks/useKnowledgeGraph';

export function MemoryPanel() {
  const { entities, relations, addMemory } = useKnowledgeGraph();
  
  return (
    <div className="memory-panel">
      <div className="graph-view">
        <ForceGraph2D 
          graphData={{ nodes: entities, links: relations }}
        />
      </div>
      <div className="memory-input">
        <textarea 
          placeholder="记录新记忆..."
          onBlur={(e) => addMemory(e.target.value)}
        />
      </div>
      <div className="entity-list">
        {entities.map(entity => (
          <EntityCard key={entity.id} entity={entity} />
        ))}
      </div>
    </div>
  );
}
```

---

## ⚠️ 注意事项

1. **许可证**: Rowboat 使用 Apache-2.0，可商用但需保留版权声明
2. **依赖冲突**: Rowboat 可能使用不同版本的 React/Node 需处理
3. **数据迁移**: 现有 MaoAI RAG 数据需要导入到 Qdrant
4. **性能**: 知识图谱渲染使用 D3/ForceGraph，需考虑大数据集虚拟化

---

## 📊 价值评估

| 能力 | Rowboat 现状 | MaoAI 现状 | 整合后提升 |
|------|--------------|------------|------------|
| 知识图谱 | ⭐⭐⭐⭐⭐ 完整 | ⭐⭐ 基础 RAG | ⭐⭐⭐⭐⭐ |
| 长期记忆 | ⭐⭐⭐⭐⭐ | ⭐⭐ 无持久化 | ⭐⭐⭐⭐⭐ |
| MCP 支持 | ⭐⭐⭐⭐ | ⭐⭐⭐ 基础 | ⭐⭐⭐⭐⭐ |
| Obsidian 兼容 | ⭐⭐⭐⭐⭐ | ⭐ 无 | ⭐⭐⭐⭐ |
| 实体提取 | ⭐⭐⭐⭐⭐ | ⭐ 无 | ⭐⭐⭐⭐⭐ |

---

## 🔗 相关资源

- **Rowboat GitHub**: https://github.com/rowboatlabs/rowboat
- **MCP 协议**: https://modelcontextprotocol.io
- **Qdrant**: https://qdrant.tech
- **本地方案**: `docs/ROWBOAT_INTEGRATION_LOCAL.md`

---

*文档生成时间: 2026-04-19*
