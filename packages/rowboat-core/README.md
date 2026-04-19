# Rowboat Core - MaoAI 集成

基于 [rowboatlabs/rowboat](https://github.com/rowboatlabs/rowboat) 的核心知识图谱库

## 功能

- **实体提取** - 从文本中自动识别人物、项目、公司等实体
- **关系抽取** - 提取实体之间的关系
- **记忆管理** - 长期记忆存储与检索（Obsidian 兼容）
- **图谱存储** - 支持 Qdrant 向量数据库的语义搜索

## 安装

```bash
pnpm add @maoai/rowboat-core
```

## 使用

```typescript
import { EntityExtractor, MemoryManager, GraphStore } from '@maoai/rowboat-core';

// 初始化
const extractor = new EntityExtractor();
const memory = new MemoryManager();
const graph = new GraphStore({ url: 'http://localhost:6333' });

// 提取实体
const { entities, relations, summary } = await extractor.extract(
  '张三正在开发 MaoAI 项目，与李四合作'
);

// 添加记忆
await memory.add(content, entities, relations, { user: 'zhangsan' });

// 语义搜索
const results = await graph.semanticSearch('MaoAI 项目');
```

## 架构

```
@maoai/rowboat-core/
├── src/
│   ├── index.ts           # 入口
│   ├── types.ts            # 类型定义
│   ├── entity-extractor.ts # 实体提取器
│   ├── memory-manager.ts   # 记忆管理器
│   └── graph-store.ts     # 图谱存储
└── package.json
```

## 许可证

Apache-2.0 (继承自 Rowboat)
