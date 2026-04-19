/**
 * 图谱存储 - Graph Store
 * 
 * 知识图谱的向量存储与查询
 * 基于 Qdrant 的语义搜索
 * 
 * @see https://github.com/rowboatlabs/rowboat
 */

import { nanoid } from 'nanoid';
import { Entity, Relation, GraphQueryResult } from './types';

export interface GraphStoreConfig {
  url?: string;
  collection?: string;
  vectorSize?: number;
}

export interface SearchOptions {
  limit?: number;
  scoreThreshold?: number;
  filters?: Record<string, any>;
}

/**
 * 图谱存储
 * 
 * 支持两种模式：
 * 1. 内存模式（开发/测试）
 * 2. Qdrant 模式（生产环境）
 */
export class GraphStore {
  private url: string;
  private collection: string;
  private vectorSize: number;
  private inMemory: boolean;
  
  // 内存存储（备用）
  private entities: Map<string, Entity> = new Map();
  private relations: Map<string, Relation> = new Map();
  private vectors: Map<string, number[]> = new Map();

  constructor(config: GraphStoreConfig = {}) {
    this.url = config.url || 'http://localhost:6333';
    this.collection = config.collection || 'maoai-knowledge-graph';
    this.vectorSize = config.vectorSize || 1536;
    this.inMemory = !config.url; // 如果没有 URL 则使用内存模式
  }

  /**
   * 初始化存储
   */
  async initialize(): Promise<void> {
    if (this.inMemory) {
      console.log('[GraphStore] 运行在内存模式');
      return;
    }

    // Qdrant 初始化逻辑
    try {
      const response = await fetch(`${this.url}/collections/${this.collection}`, {
        method: 'GET',
      });

      if (response.status === 404) {
        // 创建 collection
        await fetch(`${this.url}/collections/${this.collection}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vectors: {
              size: this.vectorSize,
              distance: 'Cosine',
            },
          }),
        });
        console.log(`[GraphStore] 创建 Qdrant collection: ${this.collection}`);
      }
    } catch (error) {
      console.warn('[GraphStore] Qdrant 连接失败，切换到内存模式');
      this.inMemory = true;
    }
  }

  /**
   * 添加实体
   */
  async addEntity(entity: Entity, vector?: number[]): Promise<void> {
    this.entities.set(entity.id, entity);
    
    if (vector) {
      this.vectors.set(entity.id, vector);
    }

    if (!this.inMemory) {
      // Qdrant 存储
      await this.qdrantUpsert(entity.id, vector || this.randomVector());
    }
  }

  /**
   * 添加关系
   */
  async addRelation(relation: Relation): Promise<void> {
    this.relations.set(relation.id, relation);
  }

  /**
   * 批量添加实体和关系
   */
  async addEntitiesAndRelations(
    entities: Entity[],
    relations: Relation[],
    vectors?: Map<string, number[]>
  ): Promise<void> {
    for (const entity of entities) {
      await this.addEntity(entity, vectors?.get(entity.id));
    }
    for (const relation of relations) {
      await this.addRelation(relation);
    }
  }

  /**
   * 语义搜索
   */
  async semanticSearch(query: string, options: SearchOptions = {}): Promise<GraphQueryResult> {
    const limit = options.limit || 10;
    const scoreThreshold = options.scoreThreshold || 0.5;

    if (this.inMemory) {
      // 内存模式：简单关键词匹配
      const queryLower = query.toLowerCase();
      const matchedEntities = Array.from(this.entities.values())
        .filter(e => 
          e.name.toLowerCase().includes(queryLower) ||
          e.type.toLowerCase().includes(queryLower)
        )
        .slice(0, limit);

      return {
        entities: matchedEntities,
        relations: [],
        score: matchedEntities.length > 0 ? 1 : 0,
      };
    }

    // Qdrant 搜索
    try {
      const queryVector = await this.generateEmbedding(query);
      const response = await fetch(`${this.url}/collections/${this.collection}/points/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vector: queryVector,
          limit,
          score_threshold: scoreThreshold,
          with_payload: true,
        }),
      });

      const data = await response.json();
      const entities = data.result.map((point: any) => 
        this.entities.get(point.id) || point.payload
      );

      return {
        entities,
        relations: [],
        score: data.result[0]?.score || 0,
      };
    } catch (error) {
      console.error('[GraphStore] Qdrant 搜索失败:', error);
      return { entities: [], relations: [], score: 0 };
    }
  }

  /**
   * 获取实体的关联实体
   */
  async getConnectedEntities(entityId: string): Promise<Entity[]> {
    const connectedIds = new Set<string>();

    for (const relation of this.relations.values()) {
      if (relation.sourceId === entityId) {
        connectedIds.add(relation.targetId);
      }
      if (relation.targetId === entityId) {
        connectedIds.add(relation.sourceId);
      }
    }

    return Array.from(connectedIds)
      .map(id => this.entities.get(id))
      .filter(Boolean) as Entity[];
  }

  /**
   * 获取实体的关系
   */
  async getRelations(entityId: string): Promise<Relation[]> {
    return Array.from(this.relations.values()).filter(
      r => r.sourceId === entityId || r.targetId === entityId
    );
  }

  /**
   * 获取子图（指定实体的局部图谱）
   */
  async getSubgraph(entityId: string, depth: number = 2): Promise<{
    entities: Entity[];
    relations: Relation[];
  }> {
    const subgraphEntities = new Set<string>([entityId]);
    const subgraphRelations: Relation[] = [];
    const visited = new Set<string>([entityId]);

    for (let d = 0; d < depth; d++) {
      const currentEntities = Array.from(visited);
      visited.clear();

      for (const eid of currentEntities) {
        const connected = await this.getConnectedEntities(eid);
        const relations = await this.getRelations(eid);

        for (const entity of connected) {
          if (!subgraphEntities.has(entity.id)) {
            subgraphEntities.add(entity.id);
            visited.add(entity.id);
          }
        }

        for (const relation of relations) {
          if (!subgraphRelations.find(r => r.id === relation.id)) {
            subgraphRelations.push(relation);
          }
        }
      }
    }

    return {
      entities: Array.from(subgraphEntities)
        .map(id => this.entities.get(id))
        .filter(Boolean) as Entity[],
      relations: subgraphRelations,
    };
  }

  /**
   * 获取所有实体
   */
  async getAllEntities(): Promise<Entity[]> {
    return Array.from(this.entities.values());
  }

  /**
   * 获取所有关系
   */
  async getAllRelations(): Promise<Relation[]> {
    return Array.from(this.relations.values());
  }

  /**
   * 生成向量嵌入
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // 简化的嵌入生成（生产环境应使用 OpenAI/Cohere 等）
    // 这里使用基于字符的伪嵌入用于开发测试
    const vector = new Array(this.vectorSize).fill(0);
    for (let i = 0; i < text.length; i++) {
      vector[i % this.vectorSize] += text.charCodeAt(i);
    }
    // 归一化
    const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return vector.map(v => v / norm);
  }

  /**
   * 生成随机向量
   */
  private randomVector(): number[] {
    return Array.from({ length: this.vectorSize }, () => Math.random() - 0.5);
  }

  /**
   * Qdrant upsert
   */
  private async qdrantUpsert(id: string, vector: number[]): Promise<void> {
    await fetch(`${this.url}/collections/${this.collection}/points`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        points: [{
          id,
          vector,
          payload: this.entities.get(id),
        }],
      }),
    });
  }

  /**
   * 导出图谱数据
   */
  async export(): Promise<{ entities: Entity[]; relations: Relation[] }> {
    return {
      entities: await this.getAllEntities(),
      relations: await this.getAllRelations(),
    };
  }

  /**
   * 导入图谱数据
   */
  async import(data: { entities: Entity[]; relations: Relation[] }): Promise<void> {
    await this.addEntitiesAndRelations(data.entities, data.relations);
  }
}

export default GraphStore;
