/**
 * MaoAI Industrial Architecture - Semantic Cache
 */

import * as crypto from "crypto";

interface EmbeddingVector {
  dimensions: number[];
  hash: string;
}

function generateSemanticHash(text: string): string {
  const normalized = text.toLowerCase().trim().replace(/\s+/g, " ");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  if (a.hash === b.hash) return 1.0;
  let dotProduct = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.dimensions.length; i++) {
    dotProduct += a.dimensions[i] * b.dimensions[i];
    normA += a.dimensions[i] * a.dimensions[i];
    normB += b.dimensions[i] * b.dimensions[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

interface CacheEntry {
  key: string;
  embedding: EmbeddingVector;
  response: string;
  metadata: { createdAt: number; hitCount: number; lastHitAt: number; modelKey: string; userId?: string };
}

export class SemanticCache {
  private cache: Map<string, CacheEntry> = new Map();
  private accessOrder: string[] = [];
  private maxSize: number;
  private similarityThreshold: number;
  private ttlMs: number;
  
  constructor(options?: { maxSize?: number; similarityThreshold?: number; ttlHours?: number }) {
    this.maxSize = options?.maxSize || 10000;
    this.similarityThreshold = options?.similarityThreshold || 0.95;
    this.ttlMs = (options?.ttlHours || 24) * 60 * 60 * 1000;
  }
  
  get(text: string): { hit: boolean; response?: string; similarity?: number } {
    const queryEmbedding = this.getDimensionsFromText(text);
    let bestMatch: { entry: CacheEntry; similarity: number } | null = null;
    
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      const entry = this.cache.get(key)!;
      if (Date.now() - entry.metadata.createdAt > this.ttlMs) {
        this.cache.delete(key);
        continue;
      }
      if (queryEmbedding.hash === entry.embedding.hash) return this.hit(entry);
      const similarity = cosineSimilarity(queryEmbedding, entry.embedding);
      if (similarity >= this.similarityThreshold && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { entry, similarity };
      }
    }
    if (bestMatch) return this.hit(bestMatch.entry);
    return { hit: false };
  }
  
  set(text: string, response: string, metadata?: { modelKey?: string; userId?: string }): void {
    if (this.cache.size >= this.maxSize) {
      this.evictExpired();
      if (this.cache.size >= this.maxSize) this.evictLRU();
    }
    const key = generateSemanticHash(text);
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.response = response;
      entry.metadata.lastHitAt = Date.now();
      return;
    }
    const entry: CacheEntry = { key, embedding: this.getDimensionsFromText(text), response, metadata: { createdAt: Date.now(), hitCount: 0, lastHitAt: Date.now(), modelKey: metadata?.modelKey || "unknown", userId: metadata?.userId } };
    this.cache.set(key, entry);
    this.accessOrder.push(key);
  }
  
  invalidate(text: string): boolean { return this.cache.delete(generateSemanticHash(text)); }
  clear(): void { this.cache.clear(); this.accessOrder = []; }
  
  getStats(): { size: number; hitRate: number; totalHits: number; avgAge: number } {
    let totalHits = 0, totalAge = 0;
    for (const entry of Array.from(this.cache.values())) {
      totalHits += entry.metadata.hitCount;
      totalAge += Date.now() - entry.metadata.createdAt;
    }
    return { size: this.cache.size, hitRate: this.cache.size > 0 ? totalHits / this.cache.size : 0, totalHits, avgAge: this.cache.size > 0 ? totalAge / this.cache.size / 1000 / 60 : 0 };
  }
  
  private hit(entry: CacheEntry): { hit: boolean; response: string; similarity: number } { entry.metadata.hitCount++; entry.metadata.lastHitAt = Date.now(); return { hit: true, response: entry.response, similarity: 1.0 }; }
  private getDimensionsFromText(text: string): EmbeddingVector { const hash = generateSemanticHash(text); const dimensions: number[] = []; for (let i = 0; i < 16; i++) { const chunk = hash.slice(i * 4, (i + 1) * 4); dimensions.push(parseInt(chunk, 16) / 0xFFFF); } return { dimensions, hash }; }
  private evictExpired(): void { const now = Date.now(); for (const key of Array.from(this.cache.keys())) { if (now - this.cache.get(key)!.metadata.createdAt > this.ttlMs) { this.cache.delete(key); this.accessOrder = this.accessOrder.filter(k => k !== key); } } }
  private evictLRU(): void { if (this.accessOrder.length > 0) { const lruKey = this.accessOrder.shift(); if (lruKey) this.cache.delete(lruKey); } }
}

export class RedisSemanticCache extends SemanticCache { constructor(redisClient: any, options?: { maxSize?: number; similarityThreshold?: number; ttlHours?: number }) { super(options); } }

export const semanticCache = new SemanticCache({ maxSize: 10000, similarityThreshold: 0.95, ttlHours: 24 });
