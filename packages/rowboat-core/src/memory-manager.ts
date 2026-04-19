/**
 * 记忆管理器 - Memory Manager
 * 
 * 长期记忆存储与检索
 * 类似 Rowboat 的 Obsidian 兼容双向链接存储
 */

import { nanoid } from 'nanoid';
import { Memory, MemoryContext, Entity, Relation } from './types';

export interface MemoryQuery {
  text?: string;
  entityIds?: string[];
  type?: Memory['metadata']['type'];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export class MemoryManager {
  private memories: Map<string, Memory> = new Map();
  private entityIndex: Map<string, Set<string>> = new Map(); // entityId -> memoryIds
  private tagIndex: Map<string, Set<string>> = new Map(); // tag -> memoryIds
  private typeIndex: Map<string, Set<string>> = new Map(); // type -> memoryIds

  /**
   * 添加记忆
   */
  async add(
    content: string,
    entities: Entity[],
    relations: Relation[],
    context: MemoryContext = {},
    options: {
      type?: Memory['metadata']['type'];
      tags?: string[];
      embedding?: number[];
    } = {}
  ): Promise<Memory> {
    const memory: Memory = {
      id: nanoid(),
      content,
      entities,
      relations,
      context,
      embedding: options.embedding,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        type: options.type || 'conversation',
        tags: options.tags || [],
      },
    };

    // 存储记忆
    this.memories.set(memory.id, memory);

    // 更新索引
    this.indexMemory(memory);

    return memory;
  }

  /**
   * 为记忆创建索引
   */
  private indexMemory(memory: Memory): void {
    // 实体索引
    for (const entity of memory.entities) {
      if (!this.entityIndex.has(entity.id)) {
        this.entityIndex.set(entity.id, new Set());
      }
      this.entityIndex.get(entity.id)!.add(memory.id);
    }

    // 标签索引
    for (const tag of memory.metadata.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(memory.id);
    }

    // 类型索引
    const type = memory.metadata.type;
    if (!this.typeIndex.has(type)) {
      this.typeIndex.set(type, new Set());
    }
    this.typeIndex.get(type)!.add(memory.id);
  }

  /**
   * 查询记忆
   */
  async query(query: MemoryQuery): Promise<Memory[]> {
    let results = new Set<string>();

    // 初始搜索策略
    if (query.entityIds && query.entityIds.length > 0) {
      // 基于实体的搜索
      for (const entityId of query.entityIds) {
        const memoryIds = this.entityIndex.get(entityId);
        if (memoryIds) {
          memoryIds.forEach(id => results.add(id));
        }
      }
    } else if (query.tags && query.tags.length > 0) {
      // 基于标签的搜索
      for (const tag of query.tags) {
        const memoryIds = this.tagIndex.get(tag);
        if (memoryIds) {
          memoryIds.forEach(id => results.add(id));
        }
      }
    } else if (query.type) {
      // 基于类型的搜索
      const memoryIds = this.typeIndex.get(query.type);
      if (memoryIds) {
        memoryIds.forEach(id => results.add(id));
      }
    } else {
      // 返回所有记忆
      this.memories.forEach((_, id) => results.add(id));
    }

    // 过滤日期范围
    if (query.dateRange) {
      results = new Set(
        Array.from(results).filter(id => {
          const memory = this.memories.get(id);
          if (!memory) return false;
          const createdAt = memory.metadata.createdAt;
          return createdAt >= query.dateRange!.start && createdAt <= query.dateRange!.end;
        })
      );
    }

    // 转换为记忆数组并排序
    return Array.from(results)
      .map(id => this.memories.get(id)!)
      .filter(Boolean)
      .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());
  }

  /**
   * 获取相关记忆
   */
  async getRelated(memoryId: string, limit: number = 5): Promise<Memory[]> {
    const memory = this.memories.get(memoryId);
    if (!memory) return [];

    // 获取与当前记忆共享实体的其他记忆
    const relatedIds = new Set<string>();
    for (const entity of memory.entities) {
      const memoryIds = this.entityIndex.get(entity.id);
      if (memoryIds) {
        memoryIds.forEach(id => {
          if (id !== memoryId) relatedIds.add(id);
        });
      }
    }

    return Array.from(relatedIds)
      .slice(0, limit)
      .map(id => this.memories.get(id)!)
      .filter(Boolean);
  }

  /**
   * 更新记忆
   */
  async update(memoryId: string, updates: Partial<Memory>): Promise<Memory | null> {
    const memory = this.memories.get(memoryId);
    if (!memory) return null;

    const updated: Memory = {
      ...memory,
      ...updates,
      id: memoryId, // 保持 ID 不变
      metadata: {
        ...memory.metadata,
        ...updates.metadata,
        updatedAt: new Date(),
      },
    };

    this.memories.set(memoryId, updated);
    return updated;
  }

  /**
   * 删除记忆
   */
  async delete(memoryId: string): Promise<boolean> {
    return this.memories.delete(memoryId);
  }

  /**
   * 获取所有记忆
   */
  async getAll(): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());
  }

  /**
   * 导出为 Markdown（Obsidian 兼容）
   */
  async exportToMarkdown(memoryId: string): Promise<string> {
    const memory = this.memories.get(memoryId);
    if (!memory) return '';

    let md = `# ${memory.id}\n\n`;
    md += `**创建时间**: ${memory.metadata.createdAt.toISOString()}\n`;
    md += `**类型**: ${memory.metadata.type}\n`;
    md += `**标签**: ${memory.metadata.tags.join(', ') || '无'}\n\n`;
    md += `## 内容\n\n${memory.content}\n\n`;

    if (memory.entities.length > 0) {
      md += `## 实体\n\n`;
      for (const entity of memory.entities) {
        md += `- [[${entity.name}]] (${entity.type})\n`;
      }
      md += `\n`;
    }

    md += `---\n`;
    md += `*由 MaoAI Rowboat 集成生成*\n`;

    return md;
  }
}

export default MemoryManager;
