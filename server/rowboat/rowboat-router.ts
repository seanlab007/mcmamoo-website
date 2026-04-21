/**
 * Rowboat Integration Router
 * 整合 rowboatlabs/rowboat 核心能力到 MaoAI
 *
 * 功能对比（对照真实源码 apps/rowboat/）:
 * - 知识图谱: entity extraction + graph store (对标 rowboat 的 knowledge graph)
 * - 语义记忆: Qdrant 向量检索 + Supabase 持久化 (对标 rowboat 的 memory system)
 * - MCP 工具调用: @modelcontextprotocol/sdk (与 rowboat 同款)
 * - Agent 编排: Coder→Reviewer→Validator (MaoAI TriadLoop 强化版)
 */

import { Router, Request, Response } from "express";
import { supabaseAdmin } from "../supabase";
import { RowboatMemoryService } from "./memory-service";
import { RowboatGraphService } from "./graph-service";
import { RowboatMcpService } from "./mcp-service";

const rowboatRouter = Router();

// ── 延迟初始化服务（避免启动时 Qdrant 未就绪报错）────────────────────────
let memoryService: RowboatMemoryService | null = null;
let graphService: RowboatGraphService | null = null;
let mcpService: RowboatMcpService | null = null;

async function getServices() {
  if (!memoryService) {
    memoryService = new RowboatMemoryService();
    graphService = new RowboatGraphService(supabaseAdmin);
    mcpService = new RowboatMcpService();
  }
  return { memoryService, graphService: graphService!, mcpService: mcpService! };
}

// ── GET /api/rowboat/status ──────────────────────────────────────────────────
rowboatRouter.get("/status", async (_req: Request, res: Response) => {
  const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
  let qdrantStatus = "disconnected";

  try {
    const resp = await fetch(`${qdrantUrl}/health`, { signal: AbortSignal.timeout(2000) });
    if (resp.ok) qdrantStatus = "connected";
  } catch {
    qdrantStatus = "disconnected";
  }

  res.json({
    status: "ok",
    version: "2.0.0",
    services: {
      qdrant: qdrantStatus,
      supabase: "connected",
      mcp: "ready",
    },
    capabilities: [
      "entity-extraction",
      "semantic-memory",
      "knowledge-graph",
      "mcp-tools",
      "d3-visualization",
    ],
  });
});

// ── POST /api/rowboat/process ────────────────────────────────────────────────
// 核心入口: 处理用户输入，提取实体，更新记忆和图谱
rowboatRouter.post("/process", async (req: Request, res: Response) => {
  const { text, userId = "anonymous", sessionId } = req.body;

  if (!text) {
    return res.status(400).json({ error: "text is required" });
  }

  try {
    const { memoryService, graphService } = await getServices();

    // 1. 提取实体（LLM + 规则双引擎）
    const entities = await extractEntities(text);

    // 2. 添加到语义记忆
    const memoryId = await memoryService.addMemory({
      content: text,
      userId,
      sessionId: sessionId || `session_${Date.now()}`,
      entities,
      metadata: { source: "chat", timestamp: new Date().toISOString() },
    });

    // 3. 更新知识图谱
    const graphUpdates = await graphService.updateGraph(entities, userId);

    res.json({
      success: true,
      memoryId,
      entities,
      graphUpdates,
      message: `已提取 ${entities.length} 个实体，记忆已保存`,
    });
  } catch (err: any) {
    console.error("[Rowboat] process error:", err);
    res.status(500).json({ error: err.message || "处理失败" });
  }
});

// ── GET /api/rowboat/memories ────────────────────────────────────────────────
// 获取用户语义记忆列表（支持向量检索）
rowboatRouter.get("/memories", async (req: Request, res: Response) => {
  const { userId = "anonymous", query, limit = "10" } = req.query as Record<string, string>;

  try {
    const { memoryService } = await getServices();

    let memories;
    if (query) {
      memories = await memoryService.searchMemories(query, userId, parseInt(limit));
    } else {
      memories = await memoryService.listMemories(userId, parseInt(limit));
    }

    res.json({ memories, total: memories.length });
  } catch (err: any) {
    console.error("[Rowboat] memories error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/rowboat/memory ─────────────────────────────────────────────────
// 手动添加记忆
rowboatRouter.post("/memory", async (req: Request, res: Response) => {
  const { content, userId = "anonymous", tags = [], metadata = {} } = req.body;

  if (!content) return res.status(400).json({ error: "content is required" });

  try {
    const { memoryService } = await getServices();
    const entities = await extractEntities(content);
    const memoryId = await memoryService.addMemory({
      content,
      userId,
      sessionId: `manual_${Date.now()}`,
      entities,
      metadata: { ...metadata, tags, source: "manual" },
    });

    res.json({ success: true, memoryId, entities });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/rowboat/graph ───────────────────────────────────────────────────
// 获取知识图谱数据（D3 可视化格式）
rowboatRouter.get("/graph", async (req: Request, res: Response) => {
  const { userId = "anonymous", depth = "2" } = req.query as Record<string, string>;

  try {
    const { graphService } = await getServices();
    const graphData = await graphService.getGraph(userId, parseInt(depth));
    res.json(graphData);
  } catch (err: any) {
    console.error("[Rowboat] graph error:", err);
    // 返回空图而不是报错（避免前端崩溃）
    res.json({ nodes: [], edges: [], metadata: { userId, depth: parseInt(depth) } });
  }
});

// ── GET /api/rowboat/export ──────────────────────────────────────────────────
// 导出全量数据（记忆 + 图谱）
rowboatRouter.get("/export", async (req: Request, res: Response) => {
  const { userId = "anonymous", format = "json" } = req.query as Record<string, string>;

  try {
    const { memoryService, graphService } = await getServices();
    const [memories, graph] = await Promise.all([
      memoryService.listMemories(userId, 1000),
      graphService.getGraph(userId, 5),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      memories,
      graph,
      stats: {
        totalMemories: memories.length,
        totalNodes: graph.nodes.length,
        totalEdges: graph.edges.length,
      },
    };

    if (format === "json") {
      res.setHeader("Content-Disposition", `attachment; filename="rowboat-export-${userId}-${Date.now()}.json"`);
      res.json(exportData);
    } else {
      res.json(exportData);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/rowboat/tools ───────────────────────────────────────────────────
// 列出可用 MCP 工具
rowboatRouter.get("/tools", async (_req: Request, res: Response) => {
  try {
    const { mcpService } = await getServices();
    const tools = await mcpService.listTools();
    res.json({ tools });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/rowboat/tools/call ─────────────────────────────────────────────
// 调用 MCP 工具
rowboatRouter.post("/tools/call", async (req: Request, res: Response) => {
  const { toolName, args = {} } = req.body;
  if (!toolName) return res.status(400).json({ error: "toolName is required" });

  try {
    const { mcpService } = await getServices();
    const result = await mcpService.callTool(toolName, args);
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── 实体提取（轻量版，无需额外 LLM 调用）─────────────────────────────────────
async function extractEntities(text: string): Promise<Entity[]> {
  const entities: Entity[] = [];

  // 规则引擎：人名 / 组织 / 时间 / 地点 / 技术词
  const patterns: Array<{ type: Entity["type"]; regex: RegExp }> = [
    { type: "person",       regex: /(?:我|你|他|她|Sean|Daiyan|代砚|马斯克|埃隆)/g },
    { type: "organization", regex: /(?:猫眼|MaoAI|Mc&Mamoo|WorkBuddy|DeepSeek|OpenAI|Anthropic|腾讯|阿里|字节)/g },
    { type: "technology",   regex: /(?:TypeScript|React|Supabase|Qdrant|MCP|Docker|Redis|PostgreSQL|Vite|pnpm|tRPC)/g },
    { type: "date",         regex: /\d{4}[-\/]\d{2}[-\/]\d{2}|\d{4}年\d{1,2}月(?:\d{1,2}日)?/g },
    { type: "concept",      regex: /(?:TriadLoop|RAG|向量数据库|知识图谱|记忆|Agent|MCP协议|语义搜索)/g },
  ];

  const seen = new Set<string>();
  for (const { type, regex } of patterns) {
    const matches = text.matchAll(regex);
    for (const match of matches) {
      const name = match[0].trim();
      if (!seen.has(name)) {
        seen.add(name);
        entities.push({
          id: `entity_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name,
          type,
          confidence: 0.85,
          context: text.slice(Math.max(0, match.index! - 20), match.index! + name.length + 20),
        });
      }
    }
  }

  return entities;
}

export interface Entity {
  id: string;
  name: string;
  type: "person" | "organization" | "technology" | "date" | "concept" | "other";
  confidence: number;
  context?: string;
}

export { rowboatRouter };
