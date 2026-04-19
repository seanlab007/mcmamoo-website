/**
 * Rowboat 类型定义
 */

// 实体类型
export interface Entity {
  id: string;
  type: 'person' | 'project' | 'company' | 'decision' | 'commitment' | 'topic' | 'event';
  name: string;
  aliases?: string[];
  properties: Record<string, any>;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    source?: string;
    confidence: number;
  };
}

// 关系类型
export interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'works_on' | 'reports_to' | 'related_to' | 'decided' | 'promised' | 'mentioned_in';
  properties: Record<string, any>;
  metadata: {
    createdAt: Date;
    source?: string;
  };
}

// 记忆类型
export interface Memory {
  id: string;
  content: string;
  entities: Entity[];
  relations: Relation[];
  context: MemoryContext;
  embedding?: number[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    type: 'conversation' | 'document' | 'meeting' | 'note' | 'email';
    tags: string[];
  };
}

// 记忆上下文
export interface MemoryContext {
  user?: string;
  project?: string;
  channel?: string;
  thread?: string;
  timestamp?: Date;
}

// 图谱查询结果
export interface GraphQueryResult {
  entities: Entity[];
  relations: Relation[];
  score: number;
  path?: string[];
}

// 实体提取结果
export interface ExtractionResult {
  entities: Entity[];
  relations: Relation[];
  summary: string;
}

// Rowboat 配置
export interface RowboatConfig {
  qdrantUrl?: string;
  qdrantCollection?: string;
  embeddingModel?: string;
  llmModel?: string;
  storagePath?: string;
}
