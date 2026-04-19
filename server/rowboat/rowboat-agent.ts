/**
 * Rowboat Agent
 * 
 * 知识图谱驱动的 AI 助手
 * 整合 Rowboat 能力到 MaoAI Agent 系统
 */

import { EntityExtractor, MemoryManager, GraphStore } from '@maoai/rowboat-core';
import { Entity, Memory, ExtractionResult } from '@maoai/rowboat-core';
import { RowboatMCPServer } from './mcp-server';

export interface RowboatContext {
  userId?: string;
  sessionId?: string;
  currentTime?: Date;
}

export interface RowboatResponse {
  content: string;
  entities: Partial<Entity>[];
  memories: Partial<Memory>[];
  suggestions?: string[];
  metadata: {
    processingTime: number;
    entitiesExtracted: number;
    memoriesFound: number;
  };
}

/**
 * Rowboat Agent
 */
export class RowboatAgent {
  private extractor: EntityExtractor;
  private memory: MemoryManager;
  private graph: GraphStore;
  private mcpServer: RowboatMCPServer;

  constructor(config: { qdrantUrl?: string } = {}) {
    this.extractor = new EntityExtractor();
    this.memory = new MemoryManager();
    this.graph = new GraphStore({ url: config.qdrantUrl });
    this.mcpServer = new RowboatMCPServer(config);

    // 初始化图谱存储
    this.graph.initialize();
  }

  /**
   * 处理用户输入
   */
  async process(
    input: string,
    context: RowboatContext = {}
  ): Promise<RowboatResponse> {
    const startTime = Date.now();

    // 1. 实体提取
    const extraction: ExtractionResult = await this.extractor.extract(input, {
      user: context.userId,
    });

    // 2. 存储到知识图谱
    await this.graph.addEntitiesAndRelations(extraction.entities, extraction.relations);

    // 3. 添加记忆
    const memory = await this.memory.add(input, extraction.entities, extraction.relations, {
      user: context.userId,
      timestamp: context.currentTime || new Date(),
    });

    // 4. 查找相关记忆
    const relatedMemories = await this.memory.getRelated(memory.id, 5);

    // 5. 生成响应
    const content = this.generateResponse(input, extraction, relatedMemories);

    // 6. 生成建议
    const suggestions = this.generateSuggestions(extraction, relatedMemories);

    return {
      content,
      entities: extraction.entities.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
      })),
      memories: relatedMemories.map(m => ({
        id: m.id,
        content: m.content.slice(0, 200),
        metadata: m.metadata,
      })),
      suggestions,
      metadata: {
        processingTime: Date.now() - startTime,
        entitiesExtracted: extraction.entities.length,
        memoriesFound: relatedMemories.length,
      },
    };
  }

  /**
   * 生成响应
   */
  private generateResponse(
    input: string,
    extraction: ExtractionResult,
    relatedMemories: Memory[]
  ): string {
    const parts: string[] = [];

    // 实体摘要
    if (extraction.entities.length > 0) {
      const entitySummary = extraction.entities
        .slice(0, 5)
        .map(e => `${e.type}: ${e.name}`)
        .join(', ');
      parts.push(`我识别到了以下实体：${entitySummary}`);
    }

    // 相关记忆
    if (relatedMemories.length > 0) {
      parts.push(`\n\n根据我的记忆，之前我们讨论过类似的话题。相关记录：`);
      for (const memory of relatedMemories.slice(0, 2)) {
        parts.push(`- ${memory.content.slice(0, 100)}...`);
      }
    }

    // 如果没有相关内容
    if (parts.length === 0) {
      parts.push(`我已经记录了这段内容。如果有需要可以随时调用我的知识图谱能力。`);
    }

    return parts.join('');
  }

  /**
   * 生成建议
   */
  private generateSuggestions(
    extraction: ExtractionResult,
    relatedMemories: Memory[]
  ): string[] {
    const suggestions: string[] = [];

    // 基于实体的建议
    const projects = extraction.entities.filter(e => e.type === 'project');
    for (const project of projects.slice(0, 2)) {
      suggestions.push(`查看 ${project.name} 项目的详细信息`);
    }

    // 基于记忆的建议
    if (relatedMemories.length > 0) {
      suggestions.push('继续之前的讨论');
      suggestions.push('查看相关记忆');
    }

    // 通用建议
    suggestions.push('在知识图谱中搜索');

    return suggestions.slice(0, 4);
  }

  /**
   * 查询知识图谱
   */
  async queryGraph(question: string): Promise<{
    entities: Entity[];
    relations: any[];
    context: string;
  }> {
    const results = await this.graph.semanticSearch(question);

    // 构建上下文
    const entityNames = results.entities.map(e => e.name).join(', ');
    const context = results.entities.length > 0
      ? `找到了 ${results.entities.length} 个相关实体：${entityNames}`
      : '没有找到匹配的实体';

    return {
      entities: results.entities,
      relations: results.relations,
      context,
    };
  }

  /**
   * 获取用户记忆历史
   */
  async getUserMemories(userId: string, limit: number = 20): Promise<Memory[]> {
    return this.memory.query({}).then(memories =>
      memories.filter(m => m.context.user === userId).slice(0, limit)
    );
  }

  /**
   * 导出用户数据
   */
  async exportUserData(userId: string): Promise<{
    memories: Memory[];
    graph: { entities: Entity[]; relations: any[] };
  }> {
    const memories = await this.getUserMemories(userId, 1000);
    const graphData = await this.graph.export();

    return {
      memories,
      graph: graphData,
    };
  }

  /**
   * 获取 MCP 服务器
   */
  getMCPServer(): RowboatMCPServer {
    return this.mcpServer;
  }
}

// 单例
let agentInstance: RowboatAgent | null = null;

export function getRowboatAgent(config?: { qdrantUrl?: string }): RowboatAgent {
  if (!agentInstance) {
    agentInstance = new RowboatAgent(config);
  }
  return agentInstance;
}

export default RowboatAgent;
