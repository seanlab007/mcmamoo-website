# Rowboat 整合到 MaoAI - 实施报告

## 📋 任务概述

| 任务 | 状态 | 说明 |
|------|------|------|
| Fork rowboat | ✅ 完成 | GitHub API 创建成功到 seanlab007 |
| 创建 rowboat-core 包 | ✅ 完成 | 实体提取、记忆管理、图谱存储 |
| 创建 MCP Server | ✅ 完成 | 支持 MCP 协议工具调用 |
| 创建 Rowboat Agent | ✅ 完成 | 整合三大核心能力 |
| 注册 API 路由 | ✅ 完成 | `/api/rowboat/*` |
| 创建前端组件 | ✅ 完成 | KnowledgeGraph、MemoryPanel |
| 创建 Docker 配置 | ✅ 完成 | Qdrant 向量数据库 |
| 克隆真实源码 | ⏳ 待完成 | 网络恢复后执行 scripts/integrate-rowboat.sh |

---

## 📁 创建的文件

```
mcmamoo-website/
├── packages/
│   └── rowboat-core/                    # 新增
│       ├── package.json
│       ├── tsconfig.json
│       ├── README.md
│       └── src/
│           ├── index.ts                 # 入口
│           ├── types.ts                 # 类型定义
│           ├── entity-extractor.ts      # 实体提取器
│           ├── memory-manager.ts        # 记忆管理器
│           └── graph-store.ts           # 图谱存储
│
├── server/rowboat/                      # 新增
│   ├── mcp-server.ts                   # MCP 服务器
│   ├── rowboat-agent.ts                 # Rowboat Agent
│   └── router.ts                       # API 路由
│
├── client/src/features/maoai/components/
│   ├── KnowledgeGraph/                  # 新增
│   │   └── index.tsx                   # 知识图谱可视化
│   └── MemoryPanel/                     # 新增
│       └── index.tsx                   # 记忆面板
│
├── docker-compose.rowboat.yml          # 新增
├── docs/
│   └── ROWBOAT_DOCKER.md               # Docker 配置说明
└── scripts/
    └── integrate-rowboat.sh            # 自动整合脚本
```

---

## 🔧 API 端点

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/rowboat/process` | 处理输入，提取实体，存储记忆 |
| GET | `/api/rowboat/graph` | 查询知识图谱 |
| GET | `/api/rowboat/memories` | 获取用户记忆 |
| POST | `/api/rowboat/memory` | 添加新记忆 |
| GET | `/api/rowboat/export` | 导出用户数据 |
| GET | `/api/rowboat/tools` | 获取 MCP 工具列表 |
| POST | `/api/rowboat/tools/call` | 调用 MCP 工具 |
| GET | `/api/rowboat/status` | 健康检查 |

---

## 🚀 启动步骤

### 1. 启动 Qdrant 向量数据库
```bash
docker compose -f docker-compose.rowboat.yml up -d
```

### 2. 安装依赖
```bash
cd /Users/daiyan/Desktop/mcmamoo-website
pnpm install
```

### 3. 启动开发服务器
```bash
pnpm dev
```

### 4. 测试 API
```bash
curl http://localhost:3000/api/rowboat/status
```

---

## 🎨 前端使用

```tsx
import { KnowledgeGraph } from './features/maoai/components/KnowledgeGraph';
import { MemoryPanel } from './features/maoai/components/MemoryPanel';

// 知识图谱
<KnowledgeGraph
  nodes={entities}
  links={relations}
  onNodeClick={(node) => console.log(node)}
  onSearch={(q) => searchGraph(q)}
  height={400}
/>

// 记忆面板
<MemoryPanel
  userId="user123"
  onMemoryClick={(memory) => showDetail(memory)}
/>
```

---

## 🔌 MCP 工具

| 工具名 | 功能 |
|--------|------|
| `extract_entities` | 从文本提取实体和关系 |
| `add_memory` | 添加长期记忆 |
| `search_memories` | 搜索相关记忆 |
| `query_graph` | 查询知识图谱 |
| `get_subgraph` | 获取局部子图 |
| `export_memory` | 导出记忆（Markdown/JSON） |

---

## 📊 技术架构

```
┌─────────────────────────────────────────────┐
│  前端 (React)                               │
│  ├── KnowledgeGraph (D3 力导向图)           │
│  └── MemoryPanel (记忆列表)                 │
└─────────────────┬───────────────────────────┘
                  │ REST API
                  ↓
┌─────────────────────────────────────────────┐
│  后端 (Express/Node.js)                    │
│  └── Rowboat Agent                         │
│      ├── EntityExtractor (实体提取)         │
│      ├── MemoryManager (记忆存储)          │
│      └── GraphStore (Qdrant 接口)           │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ↓                   ↓
┌───────────────┐   ┌───────────────┐
│  Qdrant       │   │  内存存储      │
│  (向量数据库)  │   │  (开发模式)    │
└───────────────┘   └───────────────┘
```

---

## 📝 后续工作

1. **克隆真实源码** (网络恢复后)
   ```bash
   bash scripts/integrate-rowboat.sh
   ```

2. **数据迁移**
   - 将现有 MaoAI RAG 数据导入 Qdrant
   - 转换现有记忆到新格式

3. **功能增强**
   - 集成真实 LLM 用于实体提取
   - 添加 Obsidian 双向链接导出
   - 实现 @mentions 自动追踪

---

*生成时间: 2026-04-19*
