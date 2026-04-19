#!/bin/bash
#==============================================================================
# Rowboat 整合到 MaoAI - 自动执行脚本
# 使用方式: bash scripts/integrate-rowboat.sh
#==============================================================================

set -e

<<<<<<< HEAD
TARGET_DIR="/Users/daiyan/Desktop/mcmamoo-website"
ROWBOAT_DIR="$TARGET_DIR/rowboat-source"
FORK_URL="git@github.com:seanlab007/rowboat.git"

echo "🚀 Rowboat 整合脚本启动..."
echo "=========================================="

# 1. 检查网络连接
echo "📡 检查 GitHub 连接..."
if ! curl -s --connect-timeout 5 https://api.github.com > /dev/null 2>&1; then
=======
echo "🚀 Rowboat 整合脚本启动..."
echo "=========================================="

# 配置
ROWBOAT_REMOTE="git@github.com:seanlab007/rowboat.git"
TARGET_DIR="/Users/daiyan/Desktop/mcmamoo-website"
ROWBOAT_DIR="$TARGET_DIR/rowboat"

# 1. 检查网络连接
echo "📡 检查 GitHub 连接..."
if ! curl -s --connect-timeout 5 https://api.github.com > /dev/null; then
>>>>>>> 44900e2 (feat: integrate Claude Design + Google AI Studio, add local hybrid routing)
    echo "❌ 无法连接到 GitHub，请检查网络后重试"
    exit 1
fi
echo "✅ GitHub 连接正常"

# 2. Fork 检查
echo "📦 检查 Rowboat Fork..."
<<<<<<< HEAD
if ! gh repo view seanlab007/rowboat > /dev/null 2>&1; then
    echo "📌 创建 Fork..."
    gh repo fork rowboatlabs/rowboat
    echo "⏳ 等待 Fork 完成（15秒）..."
    sleep 15
=======
FORK_CHECK=$(gh api repos/seanlab007/rowboat 2>/dev/null || echo "NOT_FOUND")
if [[ "$FORK_CHECK" == "NOT_FOUND" ]]; then
    echo "📌 创建 Fork..."
    gh repo fork rowboatlabs/rowboat
    echo "⏳ 等待 Fork 完成（10秒）..."
    sleep 10
>>>>>>> 44900e2 (feat: integrate Claude Design + Google AI Studio, add local hybrid routing)
else
    echo "✅ Fork 已存在"
fi

# 3. 克隆 Rowboat
echo "📥 克隆 Rowboat 仓库..."
if [ -d "$ROWBOAT_DIR" ]; then
<<<<<<< HEAD
    echo "   Rowboat 源目录已存在，更新中..."
=======
    echo "   Rowboat 目录已存在，更新中..."
>>>>>>> 44900e2 (feat: integrate Claude Design + Google AI Studio, add local hybrid routing)
    cd "$ROWBOAT_DIR"
    git pull origin main
else
    echo "   执行 git clone..."
<<<<<<< HEAD
    git clone "$FORK_URL" "$ROWBOAT_DIR"
=======
    git clone "$ROWBOAT_REMOTE" "$ROWBOAT_DIR"
>>>>>>> 44900e2 (feat: integrate Claude Design + Google AI Studio, add local hybrid routing)
    cd "$ROWBOAT_DIR"
fi

# 4. 分析 Rowboat 结构
echo "📊 分析 Rowboat 项目结构..."
echo "   packages/:"
ls -la "$ROWBOAT_DIR/packages/" 2>/dev/null || echo "   (未找到)"
echo "   apps/:"
ls -la "$ROWBOAT_DIR/apps/" 2>/dev/null || echo "   (未找到)"

<<<<<<< HEAD
# 5. 复制核心代码
=======
# 5. 创建目录结构
echo "📁 创建 MaoAI 目录结构..."
mkdir -p "$TARGET_DIR/packages/rowboat-core"
mkdir -p "$TARGET_DIR/packages/rowboat-graph"  
mkdir -p "$TARGET_DIR/packages/rowboat-memory"
mkdir -p "$TARGET_DIR/server/rowboat"
mkdir -p "$TARGET_DIR/client/src/features/maoai/components/KnowledgeGraph"
mkdir -p "$TARGET_DIR/client/src/features/maoai/components/MemoryPanel"
mkdir -p "$TARGET_DIR/client/src/features/maoai/hooks"

# 6. 复制核心代码
>>>>>>> 44900e2 (feat: integrate Claude Design + Google AI Studio, add local hybrid routing)
echo "📋 复制 Rowboat 核心代码..."

# 核心库
if [ -d "$ROWBOAT_DIR/packages/core" ]; then
    cp -r "$ROWBOAT_DIR/packages/core/"* "$TARGET_DIR/packages/rowboat-core/"
    echo "   ✅ packages/rowboat-core/"
fi

<<<<<<< HEAD
# 6. 创建索引文件
cat > "$TARGET_DIR/packages/rowboat-core/src/index.ts" << 'EOF'
// Rowboat Core - 整合原始代码
export * from './packages/core';
EOF

# 7. 打印完成信息
echo ""
echo "=========================================="
echo "✅ Rowboat 源码整合完成！"
=======
# 图谱引擎
if [ -d "$ROWBOAT_DIR/packages/graph" ]; then
    cp -r "$ROWBOAT_DIR/packages/graph/"* "$TARGET_DIR/packages/rowboat-graph/"
    echo "   ✅ packages/rowboat-graph/"
fi

# 记忆系统
if [ -d "$ROWBOAT_DIR/packages/memory" ]; then
    cp -r "$ROWBOAT_DIR/packages/memory/"* "$TARGET_DIR/packages/rowboat-memory/"
    echo "   ✅ packages/rowboat-memory/"
fi

# 7. 复制 MCP 相关
if [ -d "$ROWBOAT_DIR/packages/mcp-server" ]; then
    mkdir -p "$TARGET_DIR/server/mcp/rowboat"
    cp -r "$ROWBOAT_DIR/packages/mcp-server/"* "$TARGET_DIR/server/mcp/rowboat/"
    echo "   ✅ server/mcp/rowboat/"
fi

# 8. 复制前端组件（知识图谱可视化）
if [ -d "$ROWBOAT_DIR/apps/rowboat/src/components" ]; then
    # 复制 Graph 相关组件
    find "$ROWBOAT_DIR/apps/rowboat/src/components" -name "*Graph*" -exec sh -c '
        for f; do
            cp "$f" "$TARGET_DIR/client/src/features/maoai/components/KnowledgeGraph/"
        done
    ' _ {} +
    echo "   ✅ KnowledgeGraph 组件"
    
    # 复制 Memory 相关组件
    find "$ROWBOAT_DIR/apps/rowboat/src/components" -name "*Memory*" -exec sh -c '
        for f; do
            cp "$f" "$TARGET_DIR/client/src/features/maoai/components/MemoryPanel/"
        done
    ' _ {} +
    echo "   ✅ MemoryPanel 组件"
fi

# 9. 创建类型定义
echo "📝 创建 TypeScript 类型定义..."
cat > "$TARGET_DIR/packages/rowboat-core/index.ts" << 'EOF'
// Rowboat Core - MaoAI Integration
export * from './graph';
export * from './memory';
export * from './entity-extractor';
EOF

# 10. 更新 package.json
echo "📦 更新 package.json..."
cd "$TARGET_DIR"

# 添加 workspace 依赖
if ! grep -q '"rowboat-core"' package.json; then
    node -e "
    const pkg = require('./package.json');
    pkg.workspaces = pkg.workspaces || [];
    pkg.workspaces.push('packages/rowboat-*');
    pkg.dependencies['@rowboat/core'] = 'workspace:*';
    pkg.dependencies['@rowboat/graph'] = 'workspace:*';
    pkg.dependencies['qdrant-client'] = '^1.9.0';
    require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
    "
    echo "   ✅ package.json 已更新"
fi

# 11. 创建 Qdrant Docker 配置
echo "🐳 更新 docker-compose.yml..."
cat > "$TARGET_DIR/docker-compose.rowboat.yml" << 'EOF'
version: '3.8'
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334

volumes:
  qdrant_data:
EOF

# 12. 创建 Rowboat Agent
echo "🤖 创建 Rowboat Agent..."
cat > "$TARGET_DIR/server/rowboat/rowboat-agent.ts" << 'EOF'
/**
 * Rowboat Agent - 知识图谱驱动的 AI 助手
 * 
 * 整合 Rowboat 的知识图谱能力到 MaoAI
 * - 实体提取与关系图谱
 * - 长期记忆存储
 * - 语义搜索
 */

import { RowboatGraph } from '@rowboat/graph';
import { MemoryStore } from '@rowboat/memory';
import { EntityExtractor } from '@rowboat/core';

export interface RowboatContext {
  graph: RowboatGraph;
  memory: MemoryStore;
  extractor: EntityExtractor;
}

export class RowboatAgent {
  private ctx: RowboatContext;
  
  constructor(ctx: RowboatContext) {
    this.ctx = ctx;
  }

  /**
   * 处理用户输入：提取实体 + 存储记忆 + 查询图谱
   */
  async process(input: string): Promise<{
    response: string;
    entities: any[];
    relatedMemories: any[];
  }> {
    // 1. 提取实体
    const entities = await this.ctx.extractor.extract(input);
    
    // 2. 存储到知识图谱
    await this.ctx.graph.addEntities(entities);
    
    // 3. 查找相关记忆
    const relatedMemories = await this.ctx.graph.search(input);
    
    // 4. 生成响应
    const response = this.ctx.memory.generateResponse(input, relatedMemories);
    
    return { response, entities, relatedMemories };
  }

  /**
   * 查询知识图谱
   */
  async queryGraph(question: string) {
    return this.ctx.graph.semanticSearch(question);
  }

  /**
   * 添加新记忆
   */
  async addMemory(content: string, metadata?: Record<string, any>) {
    const entities = await this.ctx.extractor.extract(content);
    await this.ctx.graph.addEntities(entities);
    await this.ctx.memory.add(content, { entities, ...metadata });
  }
}

export default RowboatAgent;
EOF

# 13. 创建 React Hook
echo "⚛️ 创建 React Hooks..."
cat > "$TARGET_DIR/client/src/features/maoai/hooks/useKnowledgeGraph.ts" << 'EOF'
/**
 * useKnowledgeGraph - 知识图谱 React Hook
 */
import { useState, useCallback } from 'react';

interface Entity {
  id: string;
  type: string;
  name: string;
  properties: Record<string, any>;
}

interface Relation {
  source: string;
  target: string;
  type: string;
}

interface GraphData {
  nodes: Entity[];
  links: Relation[];
}

export function useKnowledgeGraph() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(false);

  const addMemory = useCallback(async (content: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/rowboat/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const data = await response.json();
      setEntities(prev => [...prev, ...data.entities]);
      setRelations(prev => [...prev, ...data.relations]);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchGraph = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rowboat/search?q=${encodeURIComponent(query)}`);
      return await response.json();
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    entities,
    relations,
    loading,
    addMemory,
    searchGraph,
    graphData: { nodes: entities, links: relations } as GraphData,
  };
}
EOF

# 14. 创建 API 路由
echo "🛣️ 创建 API 路由..."
cat > "$TARGET_DIR/server/rowboat/api.ts" << 'EOF'
/**
 * Rowboat API Routes
 */
import { Router } from 'express';
import { RowboatAgent } from './rowboat-agent';

const router = Router();

// 初始化 Rowboat Agent（单例）
let agent: RowboatAgent;

async function getAgent() {
  if (!agent) {
    const { RowboatGraph } = await import('@rowboat/graph');
    const { MemoryStore } = await import('@rowboat/memory');
    const { EntityExtractor } = await import('@rowboat/core');
    
    agent = new RowboatAgent({
      graph: new RowboatGraph({ url: process.env.QDRANT_URL }),
      memory: new MemoryStore(),
      extractor: new EntityExtractor(),
    });
  }
  return agent;
}

// POST /api/rowboat/memory - 添加记忆
router.post('/memory', async (req, res) => {
  try {
    const agent = await getAgent();
    const { content, metadata } = req.body;
    await agent.addMemory(content, metadata);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/rowboat/search - 搜索图谱
router.get('/search', async (req, res) => {
  try {
    const agent = await getAgent();
    const { q } = req.query;
    const results = await agent.queryGraph(q as string);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/rowboat/graph - 获取图谱数据
router.get('/graph', async (req, res) => {
  try {
    const agent = await getAgent();
    const graphData = await agent.queryGraph('');
    res.json(graphData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
EOF

# 15. 打印完成信息
echo ""
echo "=========================================="
echo "✅ Rowboat 整合脚本执行完成！"
>>>>>>> 44900e2 (feat: integrate Claude Design + Google AI Studio, add local hybrid routing)
echo "=========================================="
echo ""
echo "📋 下一步操作："
echo "   1. 安装依赖: cd $TARGET_DIR && pnpm install"
echo "   2. 启动 Qdrant: docker compose -f docker-compose.rowboat.yml up -d"
echo "   3. 启动开发服务器: pnpm dev"
<<<<<<< HEAD
echo ""
echo "📖 详细方案文档: docs/ROWBOAT_INTEGRATION_REPORT.md"
=======
echo "   4. 访问 MaoAI 测试知识图谱功能"
echo ""
echo "📖 详细方案文档: docs/ROWBOAT_INTEGRATION_PLAN.md"
>>>>>>> 44900e2 (feat: integrate Claude Design + Google AI Studio, add local hybrid routing)
echo ""
