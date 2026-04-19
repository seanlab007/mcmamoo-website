/**
 * 实体提取器 - Entity Extractor
 * 
 * 从文本内容中提取实体和关系
 * 类似 Rowboat 的 NER + 关系抽取能力
 */

import { nanoid } from 'nanoid';
import { Entity, Relation, ExtractionResult, MemoryContext } from './types';

export class EntityExtractor {
  private patterns: Map<string, RegExp>;
  
  constructor() {
    this.patterns = new Map([
      // 人物模式
      ['person', /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g],
      // 项目模式
      ['project', /\b([A-Z][a-z]+(?:[A-Z][a-z]+)+)\b/g],
      // 公司模式
      ['company', /\b([A-Z][a-zA-Z]+ (?:Inc|LLC|Corp|Ltd|Co)\.?)\b/g],
      // 邮箱模式
      ['email', /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g],
      // URL模式
      ['url', /\b(https?:\/\/[^\s]+)\b/g],
      // 日期模式
      ['date', /\b(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})\b/g],
    ]);
  }

  /**
   * 提取文本中的实体
   */
  async extract(text: string, context?: MemoryContext): Promise<ExtractionResult> {
    const entities: Entity[] = [];
    const relations: Relation[] = [];
    const entityMap = new Map<string, Entity>();

    // 1. 实体识别
    for (const [type, pattern] of this.patterns.entries()) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const name = match[1] || match[0];
        if (!entityMap.has(name.toLowerCase())) {
          const entity: Entity = {
            id: nanoid(),
            type: type as Entity['type'],
            name,
            properties: {},
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
              confidence: this.calculateConfidence(type, match[0]),
            },
          };
          entities.push(entity);
          entityMap.set(name.toLowerCase(), entity);
        }
      }
    }

    // 2. 关键词实体识别
    const keywords = this.extractKeywords(text);
    for (const keyword of keywords) {
      if (!entityMap.has(keyword.toLowerCase())) {
        const entity: Entity = {
          id: nanoid(),
          type: 'topic',
          name: keyword,
          properties: {},
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            confidence: 0.7,
          },
        };
        entities.push(entity);
        entityMap.set(keyword.toLowerCase(), entity);
      }
    }

    // 3. 关系抽取（基于共现）
    for (const entity1 of entities) {
      for (const entity2 of entities) {
        if (entity1.id !== entity2.id) {
          const relationType = this.detectRelation(entity1, entity2, text);
          if (relationType) {
            relations.push({
              id: nanoid(),
              sourceId: entity1.id,
              targetId: entity2.id,
              type: relationType,
              properties: {},
              metadata: {
                createdAt: new Date(),
              },
            });
          }
        }
      }
    }

    // 4. 生成摘要
    const summary = this.generateSummary(entities, text);

    return { entities, relations, summary };
  }

  /**
   * 提取关键词
   */
  private extractKeywords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
      'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
      '的', '了', '是', '在', '和', '与', '或', '以及'
    ]);

    // 简单分词
    const words = text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    // 词频统计
    const freq = new Map<string, number>();
    for (const word of words) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }

    // 返回高频词
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * 检测两个实体之间的关系
   */
  private detectRelation(entity1: Entity, entity2: Entity, text: string): Relation['type'] | null {
    const patterns: [RegExp, Relation['type']][] = [
      // works_on: 某人从事某项目
      [/(?:working on|working with|building|developing|creating)\s+.+/i, 'works_on'],
      // related_to: 一般关联
      [/(?:related to|connected to|associated with)\s+.+/i, 'related_to'],
      // mentioned_in: 被提及
      [/(?:mentioned|discussed|talked about)\s+.+/i, 'mentioned_in'],
    ];

    const entity1Name = entity1.name.toLowerCase();
    const entity2Name = entity2.name.toLowerCase();

    // 检查两个实体是否在文本中同时出现
    if (!text.toLowerCase().includes(entity1Name) || !text.toLowerCase().includes(entity2Name)) {
      return null;
    }

    // 检查关系模式
    for (const [pattern, relationType] of patterns) {
      if (pattern.test(text)) {
        return relationType;
      }
    }

    return 'related_to'; // 默认关系
  }

  /**
   * 计算实体识别的置信度
   */
  private calculateConfidence(type: string, match: string): number {
    let confidence = 0.5;

    // 基于类型的置信度调整
    switch (type) {
      case 'email':
      case 'url':
        confidence = 0.95;
        break;
      case 'date':
        confidence = 0.9;
        break;
      case 'person':
        confidence = match.includes(' ') ? 0.8 : 0.5;
        break;
      case 'company':
        confidence = 0.85;
        break;
      case 'project':
        confidence = 0.7;
        break;
    }

    return confidence;
  }

  /**
   * 生成摘要
   */
  private generateSummary(entities: Entity[], text: string): string {
    if (entities.length === 0) {
      return text.slice(0, 200);
    }

    const entityNames = entities.map(e => e.name).slice(0, 5);
    return `包含 ${entities.length} 个实体 (${entityNames.join(', ')}) 的内容`;
  }
}

export default EntityExtractor;
