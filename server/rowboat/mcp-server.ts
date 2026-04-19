/**
 * Rowboat MCP Server
 * 
 * Model Context Protocol 服务器实现
 * 整合 Rowboat 的工具能力到 MaoAI
 * 
 * @see https://modelcontextprotocol.io
 * @see https://github.com/rowboatlabs/rowboat
 */

import { EntityExtractor, MemoryManager, GraphStore } from '@maoai/rowboat-core';
import { Entity, Memory, ExtractionResult } from '@maoai/rowboat-core';

// MCP 协议类型
interface MCPRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, any>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// MCP 工具定义
interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * Rowboat MCP Server
 */
export class RowboatMCPServer {
  private extractor: EntityExtractor;
  private memory: MemoryManager;
  private graph: GraphStore;
  private tools: Map<string, MCPTool>;

  constructor(config: { qdrantUrl?: string } = {}) {
    this.extractor = new EntityExtractor();
    this.memory = new MemoryManager();
    this.graph = new GraphStore({ url: config.qdrantUrl });
    
    this.tools = new Map();
    this.registerTools();
  }

  /**
   * 注册 MCP 工具
   */
  private registerTools(): void {
    // 实体提取工具
    this.tools.set('extract_entities', {
      name: 'extract_entities',
      description: '从文本中提取实体和关系',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: '要分析的文本' },
          context: {
            type: 'object',
            description: '可选上下文信息',
            properties: {
              user: { type: 'string' },
              project: { type: 'string' },
            },
          },
        },
        required: ['text'],
      },
    });

    // 添加记忆工具
    this.tools.set('add_memory', {
      name: 'add_memory',
      description: '添加新的长期记忆',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: '记忆内容' },
          type: {
            type: 'string',
            enum: ['conversation', 'document', 'meeting', 'note', 'email'],
            description: '记忆类型',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: '标签列表',
          },
        },
        required: ['content'],
      },
    });

    // 搜索记忆工具
    this.tools.set('search_memories', {
      name: 'search_memories',
      description: '搜索相关记忆',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词' },
          entity_ids: {
            type: 'array',
            items: { type: 'string' },
            description: '关联的实体 ID',
          },
          limit: { type: 'number', default: 10 },
        },
      },
    });

    // 知识图谱查询工具
    this.tools.set('query_graph', {
      name: 'query_graph',
      description: '查询知识图谱获取相关信息',
      inputSchema: {
        type: 'object',
        properties: {
          question: { type: 'string', description: '查询问题' },
          entity_id: { type: 'string', description: '从指定实体开始查询' },
          depth: { type: 'number', default: 2, description: '查询深度' },
        },
      },
    });

    // 获取子图工具
    this.tools.set('get_subgraph', {
      name: 'get_subgraph',
      description: '获取实体的局部知识图谱',
      inputSchema: {
        type: 'object',
        properties: {
          entity_id: { type: 'string', description: '中心实体 ID' },
          depth: { type: 'number', default: 2 },
        },
        required: ['entity_id'],
      },
    });

    // 导出记忆工具
    this.tools.set('export_memory', {
      name: 'export_memory',
      description: '导出记忆为 Obsidian 兼容的 Markdown',
      inputSchema: {
        type: 'object',
        properties: {
          memory_id: { type: 'string' },
          format: { type: 'string', enum: ['markdown', 'json'], default: 'markdown' },
        },
        required: ['memory_id'],
      },
    });
  }

  /**
   * 处理 MCP 请求
   */
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    try {
      const { method, params, id } = request;

      switch (method) {
        case 'initialize':
          return this.handleInitialize(id);

        case 'tools/list':
          return this.handleListTools(id);

        case 'tools/call':
          return await this.handleCallTool(id, params);

        case 'ping':
          return { jsonrpc: '2.0', id, result: { status: 'ok' } };

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Method not found: ${method}` },
          };
      }
    } catch (error: any) {
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: { code: -32603, message: error.message },
      };
    }
  }

  /**
   * 初始化
   */
  private handleInitialize(id: string | number): MCPResponse {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
        },
        serverInfo: {
          name: 'maoai-rowboat',
          version: '0.1.0',
        },
      },
    };
  }

  /**
   * 列出所有工具
   */
  private handleListTools(id: string | number): MCPResponse {
    const toolsList = Array.from(this.tools.values());
    return {
      jsonrpc: '2.0',
      id,
      result: { tools: toolsList },
    };
  }

  /**
   * 调用工具
   */
  private async handleCallTool(id: string | number, params?: any): Promise<MCPResponse> {
    if (!params?.name) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32602, message: 'Missing tool name' },
      };
    }

    const toolName = params.name;
    const toolParams = params.arguments || {};

    switch (toolName) {
      case 'extract_entities':
        return await this.handleExtractEntities(id, toolParams);

      case 'add_memory':
        return await this.handleAddMemory(id, toolParams);

      case 'search_memories':
        return await this.handleSearchMemories(id, toolParams);

      case 'query_graph':
        return await this.handleQueryGraph(id, toolParams);

      case 'get_subgraph':
        return await this.handleGetSubgraph(id, toolParams);

      case 'export_memory':
        return await this.handleExportMemory(id, toolParams);

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Unknown tool: ${toolName}` },
        };
    }
  }

  /**
   * 提取实体
   */
  private async handleExtractEntities(
    id: string | number,
    params: { text: string; context?: any }
  ): Promise<MCPResponse> {
    const result: ExtractionResult = await this.extractor.extract(params.text, params.context);

    // 同时添加到图谱
    await this.graph.addEntitiesAndRelations(result.entities, result.relations);

    return {
      jsonrpc: '2.0',
      id,
      result: {
        entities: result.entities.map(e => ({
          id: e.id,
          type: e.type,
          name: e.name,
          confidence: e.metadata.confidence,
        })),
        relations: result.relations.map(r => ({
          source: r.sourceId,
          target: r.targetId,
          type: r.type,
        })),
        summary: result.summary,
      },
    };
  }

  /**
   * 添加记忆
   */
  private async handleAddMemory(
    id: string | number,
    params: { content: string; type?: string; tags?: string[] }
  ): Promise<MCPResponse> {
    // 先提取实体
    const { entities, relations } = await this.extractor.extract(params.content);

    // 添加到图谱
    await this.graph.addEntitiesAndRelations(entities, relations);

    // 添加记忆
    const memory = await this.memory.add(params.content, entities, relations, {}, {
      type: params.type as any,
      tags: params.tags,
    });

    return {
      jsonrpc: '2.0',
      id,
      result: {
        memory_id: memory.id,
        entities_count: entities.length,
        tags: memory.metadata.tags,
      },
    };
  }

  /**
   * 搜索记忆
   */
  private async handleSearchMemories(
    id: string | number,
    params: { query?: string; entity_ids?: string[]; limit?: number }
  ): Promise<MCPResponse> {
    const memories = await this.memory.query({
      text: params.query,
      entityIds: params.entity_ids,
    });

    const limited = memories.slice(0, params.limit || 10);

    return {
      jsonrpc: '2.0',
      id,
      result: {
        memories: limited.map(m => ({
          id: m.id,
          content: m.content.slice(0, 500),
          created_at: m.metadata.createdAt,
          entities: m.entities.map(e => ({ id: e.id, name: e.name, type: e.type })),
        })),
        total: memories.length,
      },
    };
  }

  /**
   * 查询图谱
   */
  private async handleQueryGraph(
    id: string | number,
    params: { question?: string; entity_id?: string; depth?: number }
  ): Promise<MCPResponse> {
    let result;

    if (params.entity_id) {
      result = await this.graph.getSubgraph(params.entity_id, params.depth || 2);
    } else if (params.question) {
      result = await this.graph.semanticSearch(params.question);
    } else {
      result = {
        entities: await this.graph.getAllEntities(),
        relations: await this.graph.getAllRelations(),
        score: 1,
      };
    }

    return {
      jsonrpc: '2.0',
      id,
      result: {
        entities: result.entities.map(e => ({
          id: e.id,
          name: e.name,
          type: e.type,
          properties: e.properties,
        })),
        relations: result.relations.map(r => ({
          source: r.sourceId,
          target: r.targetId,
          type: r.type,
        })),
        score: result.score,
      },
    };
  }

  /**
   * 获取子图
   */
  private async handleGetSubgraph(
    id: string | number,
    params: { entity_id: string; depth?: number }
  ): Promise<MCPResponse> {
    const subgraph = await this.graph.getSubgraph(params.entity_id, params.depth || 2);

    return {
      jsonrpc: '2.0',
      id,
      result: {
        center_entity: params.entity_id,
        entities: subgraph.entities,
        relations: subgraph.relations,
        stats: {
          total_entities: subgraph.entities.length,
          total_relations: subgraph.relations.length,
        },
      },
    };
  }

  /**
   * 导出记忆
   */
  private async handleExportMemory(
    id: string | number,
    params: { memory_id: string; format?: string }
  ): Promise<MCPResponse> {
    if (params.format === 'json') {
      const memories = await this.memory.getAll();
      const memory = memories.find(m => m.id === params.memory_id);
      return {
        jsonrpc: '2.0',
        id,
        result: { memory },
      };
    }

    const markdown = await this.memory.exportToMarkdown(params.memory_id);
    return {
      jsonrpc: '2.0',
      id,
      result: { markdown },
    };
  }

  /**
   * 获取所有工具列表（同步方法）
   */
  getTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }
}

export default RowboatMCPServer;
