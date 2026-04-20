/**
 * MaoAI Industrial Architecture - Semantic Cache
 * 
 * 语义缓存：基于向量相似度的高速缓存
 * 当新请求与缓存请求的语义相似度 > 0.95 时，直接返回缓存结果
 * 目标：响应时间 < 50ms，节省 40%+ API 调用
 */

import crypto from "crypto";

// ─── 简化的向量嵌入 ───────────────────────────────────────────────────────────

interface EmbeddingVector {
  dimensions: number[];
  hash: string;
}

/**
 * 生成文本的语义哈希（简化版嵌入）
 * 生产环境应使用 ollama-nomic-embed 或 openai-embeddings
 */
function generateSemanticHash(text: string): string {
  // 预处理
  const normalized = text.toLowerCase().trim().replace(/\s+/g, " ");
  
  // 提取关键词（简化）
  const words = normalized.split(" ");
  const keywords = words.filter(w => w.length > 2);
  
  // 生成哈希
  const hash = crypto.createHash("sha256").update(normalized).digest("hex");
  
  // 简化维度向量（取前16维的哈希值）
  const dimensions: number[] = [];
  for (let i = 0; i < 16; i++) {
    const chunk = hash.slice(i * 4, (i + 1) * 4);
    dimensions.push(parseInt(chunk, 16) / 0xFFFF);
  }
  
  return hash;
}

/**
 * 计算余弦相似度
 */
function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  if (a.hash === b.hash) return 1.0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.dimensions.length; i++) {
    dotProduct += a.dimensions[i] * b.dimensions[i];
    normA += a.dimensions[i] * a.dimensions[i];
    normB += b.dimensions[i] * b.dimensions[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ─── 缓存条目 ─────────────────────────────────────────────────────────────────

interface CacheEntry {
  key: string;
  embedding: EmbeddingVector;
  response: string;
  metadata: {
    createdAt: number;
    hitCount: number;
    lastHitAt: number;
    modelKey: string;
    userId?: string;
  };
}

// ─── 语义缓存主类 ─────────────────────────────────────────────────────────────

export class SemanticCache {
  private cache: Map<string, CacheEntry> = new Map();
  private accessOrder: string[] = [];
  private maxSize: number;
  private similarityThreshold: number;
  private ttlMs: number; // Time to live in milliseconds
  
  constructor(options?: {
    maxSize?: number;
    similarityThreshold?: number;
    ttlHours?: number;
  }) {
    this.maxSize = options?.maxSize || 10000;
    this.similarityThreshold = options?.similarityThreshold || 0.95;
    this.ttlMs = (options?.ttlHours || 24) * 60 * 60 * 1000;
  }
  
  /**
   * 查找缓存
   * 返回最相似的缓存条目（相似度 > 阈值）
   */
  get(text: string): { hit: boolean; response?: string; similarity?: number } {
    const queryEmbedding = {
      dimensions: this.getDimensionsFromText(text),
      hash: generateSemanticHash(text),
    };
    
    let bestMatch: { entry: CacheEntry; similarity: number } | null = null;
    
    for (const entry of this.cache.values()) {
      // 检查 TTL
      if (Date.now() - entry.metadata.createdAt > this.ttlMs) {
        this.cache.delete(entry.key);
        continue;
      }
      
      // 快速哈希匹配
      if (queryEmbedding.hash === entry.embedding.hash) {
        return this.hit(entry);
      }
      
      // 语义相似度匹配
      const similarity = cosineSimilarity(queryEmbedding, entry.embedding);
      if (similarity >= this.similarityThreshold) {
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { entry, similarity };
        }
      }
    }
    
    if (bestMatch) {
      return this.hit(bestMatch.entry);
    }
    
    return { hit: false };
  }
  
  /**
   * 设置缓存
   */
  set(text: string, response: string, metadata?: { modelKey?: string; userId?: string }): void {
    // 淘汰策略：LRU + TTL
    if (this.cache.size >= this.maxSize) {
      this.evictExpired();
      if (this.cache.size >= this.maxSize) {
        this.evictLRU();
      }
    }
    
    const key = generateSemanticHash(text);
    
    // 检查是否已存在
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.response = response;
      entry.metadata.lastHitAt = Date.now();
      return;
    }
    
    const entry: CacheEntry = {
      key,
      embedding: {
        dimensions: this.getDimensionsFromText(text),
        hash: key,
      },
      response,
      metadata: {
        createdAt: Date.now(),
        hitCount: 0,
        lastHitAt: Date.now(),
        modelKey: metadata?.modelKey || "unknown",
        userId: metadata?.userId,
      },
    };
    
    this.cache.set(key, entry);
    this.accessOrder.push(key);
  }
  
  /**
   * 批量设置（用于预热）
   */
  setMany(entries: Array<{ text: string; response: string; metadata?: { modelKey?: string } }>): number {
    let count = 0;
    for (const entry of entries) {
      this.set(entry.text, entry.response, entry.metadata);
      count++;
    }
    return count;
  }
  
  /**
   * 失效缓存
   */
  invalidate(text: string): boolean {
    const key = generateSemanticHash(text);
    return this.cache.delete(key);
  }
  
  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }
  
  /**
   * 获取缓存统计
   */
  getStats(): {
    size: number;
    hitRate: number;
    totalHits: number;
    avgAge: number;
  } {
    let totalHits = 0;
    let totalAge = 0;
    
    for (const entry of this.cache.values()) {
      totalHits += entry.metadata.hitCount;
      totalAge += Date.now() - entry.metadata.createdAt;
    }
    
    return {
      size: this.cache.size,
      hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0,
      totalHits,
      avgAge: this.cache.size > 0 ? totalAge / this.cache.size / 1000 / 60 : 0, // minutes
    };
  }
  
  /**
   * 导出缓存（用于持久化）
   */
  export(): Array<{ text: string; response: string; metadata: CacheEntry["metadata"] }> {
    const entries: Array<{ text: string; response: string; metadata: CacheEntry["metadata"] }> = [];
    for (const entry of this.cache.values()) {
      entries.push({
        text: entry.key, // 注意：这里实际存的是hash
        response: entry.response,
        metadata: entry.metadata,
      });
    }
    return entries;
  }
  
  // ─── 私有方法 ──────────────────────────────────────────────────────────────
  
  private hit(entry: CacheEntry): { hit: boolean; response: string; similarity: number } {
    entry.metadata.hitCount++;
    entry.metadata.lastHitAt = Date.now();
    return { hit: true, response: entry.response, similarity: 1.0 };
  }
  
  private getDimensionsFromText(text: string): number[] {
    const hash = generateSemanticHash(text);
    const dimensions: number[] = [];
    for (let i = 0; i < 16; i++) {
      const chunk = hash.slice(i * 4, (i + 1) * 4);
      dimensions.push(parseInt(chunk, 16) / 0xFFFF);
    }
    return dimensions;
  }
  
  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.metadata.createdAt > this.ttlMs) {
        this.cache.delete(key);
        this.accessOrder = this.accessOrder.filter(k => k !== key);
      }
    }
  }
  
  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift();
      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }
  }
}

// ─── Redis 缓存适配器（生产环境）─────────────────────────────────────────────

export class RedisSemanticCache extends SemanticCache {
  private redis: any; // Redis client
  
  constructor(redisClient: any, options?: { maxSize?: number; similarityThreshold?: number; ttlHours?: number }) {
    super(options);
    this.redis = redisClient;
  }
  
  async getAsync(text: string): Promise<{ hit: boolean; response?: string; similarity?: number }> {
    // 生产环境：从 Redis 获取并计算相似度
    // 这里简化处理，实际需要 Redis + 向量搜索插件
    return this.get(text);
  }
  
  async setAsync(text: string, response: string, metadata?: { modelKey?: string; userId?: string }): Promise<void> {
    this.set(text, response, metadata);
    // 生产环境：同时写入 Redis
  }
}

// ─── 全局实例 ─────────────────────────────────────────────────────────────────

export const semanticCache = new SemanticCache({
  maxSize: 10000,
  similarityThreshold: 0.95,
  ttlHours: 24,
});
