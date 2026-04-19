/**
 * Rowboat API Router
 * 
 * Express 路由：/api/rowboat/*
 */

import { Router } from 'express';
import { getRowboatAgent } from './rowboat-agent';

const rowboatRouter = Router();
export { rowboatRouter };
export default rowboatRouter;

// 初始化 Agent
let agent = getRowboatAgent({
  qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
});

/**
 * POST /api/rowboat/process
 * 处理用户输入，提取实体并存储记忆
 */
rowboatRouter.post('/process', async (req, res) => {
  try {
    const { input, userId, sessionId } = req.body;

    if (!input) {
      return res.status(400).json({ error: '缺少 input 参数' });
    }

    const result = await agent.process(input, { userId, sessionId });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[Rowboat] 处理失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/rowboat/graph
 * 查询知识图谱
 */
rowboatRouter.get('/graph', async (req, res) => {
  try {
    const { q, entity_id, depth } = req.query;

    const result = await agent.queryGraph(q as string || '');

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[Rowboat] 图谱查询失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/rowboat/memories
 * 获取用户记忆
 */
rowboatRouter.get('/memories', async (req, res) => {
  try {
    const { userId, limit } = req.query;

    const memories = await agent.getUserMemories(
      userId as string || 'default',
      parseInt(limit as string) || 20
    );

    res.json({
      success: true,
      memories,
      total: memories.length,
    });
  } catch (error: any) {
    console.error('[Rowboat] 获取记忆失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/rowboat/memory
 * 添加新记忆
 */
rowboatRouter.post('/memory', async (req, res) => {
  try {
    const { content, userId, tags, type } = req.body;

    if (!content) {
      return res.status(400).json({ error: '缺少 content 参数' });
    }

    const result = await agent.process(content, { userId });

    res.json({
      success: true,
      memory_id: result.memories[0]?.id,
      entities: result.entities,
    });
  } catch (error: any) {
    console.error('[Rowboat] 添加记忆失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/rowboat/export
 * 导出用户数据
 */
rowboatRouter.get('/export', async (req, res) => {
  try {
    const { userId } = req.query;

    const data = await agent.exportUserData(userId as string || 'default');

    res.json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    console.error('[Rowboat] 导出失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/rowboat/tools
 * 获取可用工具列表
 */
rowboatRouter.get('/tools', (req, res) => {
  const mcpServer = agent.getMCPServer();
  const tools = mcpServer.getTools();

  res.json({
    success: true,
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.inputSchema.properties,
    })),
  });
});

/**
 * POST /api/rowboat/tools/call
 * 调用 MCP 工具
 */
rowboatRouter.post('/tools/call', async (req, res) => {
  try {
    const mcpServer = agent.getMCPServer();
    const result = await mcpServer.handleRequest({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: req.body,
    });

    res.json(result);
  } catch (error: any) {
    console.error('[Rowboat] 工具调用失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/rowboat/status
 * 健康检查
 */
rowboatRouter.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    version: '0.1.0',
    features: [
      'entity_extraction',
      'memory_storage',
      'graph_search',
      'mcp_tools',
    ],
  });
});
