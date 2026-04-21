/**
 * Rowboat Memory Service
 * 语义记忆服务 - 双存储架构
 * - 向量检索: Qdrant（语义相似度搜索）
 * - 持久存储: Supabase（结构化查询 + 跨会话持久化）
 *
 * 对标 rowboat 真实源码: apps/rowboat/src/application/services/memory
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type { Entity } from "./rowboat-router";

interface MemoryRecord {
  id: string;
  content: string;
  userId: string;
  sessionId: string;
  entities: Entity[];
  metadata: Record<string, any>;
  createdAt: string;
  similarity?: number;
}

interface AddMemoryParams {
  content: string;
  userId: string;
  sessionId: string;
  entities: Entity[];
  metadata: Record<string, any>;
}

export class RowboatMemoryService {
  private qdrantUrl: string;
  private qdrantApiKey: string;
  private collectionName = "rowboat_memories";
  private supabase: SupabaseClient | null = null;

  constructor() {
    this.qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
    this.qdrantApiKey = process.env.QDRANT_API_KEY || "";

    // 延迟导入 Supabase，避免循环依赖
    import("../supabase").then(({ supabaseAdmin }) => {
      this.supabase = supabaseAdmin;
    });
  }

  // ── 添加记忆（Supabase 持久化 + 尝试 Qdrant 向量化）──────────────────────
  async addMemory(params: AddMemoryParams): Promise<string> {
    const memoryId = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    // 1. Supabase 持久化（主存储）
    await this.saveToSupabase({
      id: memoryId,
      ...params,
      createdAt: now,
    });

    // 2. 尝试 Qdrant 向量化（次存储，降级友好）
    try {
      await this.upsertToQdrant(memoryId, params.content, {
        userId: params.userId,
        sessionId: params.sessionId,
        entityNames: params.entities.map((e) => e.name),
        ...params.metadata,
      });
    } catch (err) {
      // Qdrant 不可用时仅记录警告，不阻塞主流程
      console.warn("[Rowboat/Memory] Qdrant upsert skipped:", (err as Error).message);
    }

    return memoryId;
  }

  // ── 语义搜索（优先 Qdrant，降级 Supabase 文本搜索）────────────────────────
  async searchMemories(query: string, userId: string, limit = 10): Promise<MemoryRecord[]> {
    // 尝试 Qdrant 向量检索
    try {
      const qdrantResults = await this.searchQdrant(query, userId, limit);
      if (qdrantResults.length > 0) return qdrantResults;
    } catch {
      // 降级到 Supabase
    }

    // 降级：Supabase ILIKE 文本搜索
    return this.searchSupabase(query, userId, limit);
  }

  // ── 列出记忆（从 Supabase）──────────────────────────────────────────────────
  async listMemories(userId: string, limit = 20): Promise<MemoryRecord[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from("rowboat_memories")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(this.mapRow);
    } catch (err) {
      console.warn("[Rowboat/Memory] listMemories fallback:", (err as Error).message);
      return [];
    }
  }

  // ── Supabase 保存 ─────────────────────────────────────────────────────────
  private async saveToSupabase(record: MemoryRecord) {
    if (!this.supabase) return;

    const { error } = await this.supabase.from("rowboat_memories").upsert({
      id: record.id,
      user_id: record.userId,
      session_id: record.sessionId,
      content: record.content,
      entities: record.entities,
      metadata: record.metadata,
      created_at: record.createdAt,
    });

    if (error) {
      // 表不存在时提示运行 migration
      console.warn("[Rowboat/Memory] Supabase save error (run migration?):", error.message);
    }
  }

  // ── Supabase 文本搜索 ─────────────────────────────────────────────────────
  private async searchSupabase(query: string, userId: string, limit: number): Promise<MemoryRecord[]> {
    if (!this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from("rowboat_memories")
        .select("*")
        .eq("user_id", userId)
        .ilike("content", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map(this.mapRow);
    } catch {
      return [];
    }
  }

  // ── Qdrant 向量 upsert（使用文本哈希模拟 embedding）─────────────────────
  private async upsertToQdrant(id: string, text: string, payload: Record<string, any>) {
    // 使用简单的字符频率向量作为 embedding（生产环境替换为真实 embedding API）
    const vector = this.textToVector(text);

    await this.ensureCollection(vector.length);

    const response = await fetch(`${this.qdrantUrl}/collections/${this.collectionName}/points`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(this.qdrantApiKey ? { "api-key": this.qdrantApiKey } : {}),
      },
      body: JSON.stringify({
        points: [{ id: this.hashId(id), vector, payload: { ...payload, originalId: id, text } }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Qdrant upsert failed: ${response.status}`);
    }
  }

  // ── Qdrant 向量搜索 ───────────────────────────────────────────────────────
  private async searchQdrant(query: string, userId: string, limit: number): Promise<MemoryRecord[]> {
    const vector = this.textToVector(query);

    const response = await fetch(`${this.qdrantUrl}/collections/${this.collectionName}/points/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.qdrantApiKey ? { "api-key": this.qdrantApiKey } : {}),
      },
      body: JSON.stringify({
        vector,
        filter: { must: [{ key: "userId", match: { value: userId } }] },
        limit,
        with_payload: true,
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) throw new Error(`Qdrant search failed: ${response.status}`);

    const data = await response.json() as { result: Array<{ id: number; score: number; payload: any }> };

    return (data.result || []).map((r) => ({
      id: r.payload.originalId,
      content: r.payload.text,
      userId: r.payload.userId,
      sessionId: r.payload.sessionId,
      entities: [],
      metadata: r.payload,
      createdAt: r.payload.timestamp || new Date().toISOString(),
      similarity: r.score,
    }));
  }

  // ── 确保 Qdrant 集合存在 ─────────────────────────────────────────────────
  private async ensureCollection(vectorSize: number) {
    const response = await fetch(`${this.qdrantUrl}/collections/${this.collectionName}`, {
      headers: this.qdrantApiKey ? { "api-key": this.qdrantApiKey } : {},
    });

    if (response.status === 404) {
      await fetch(`${this.qdrantUrl}/collections/${this.collectionName}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(this.qdrantApiKey ? { "api-key": this.qdrantApiKey } : {}),
        },
        body: JSON.stringify({ vectors: { size: vectorSize, distance: "Cosine" } }),
      });
    }
  }

  // ── 工具函数 ──────────────────────────────────────────────────────────────

  /** 简单文本向量化（256 维字符频率）*/
  private textToVector(text: string): number[] {
    const vec = new Array(256).fill(0);
    for (const char of text.slice(0, 512)) {
      vec[char.charCodeAt(0) % 256]++;
    }
    // 归一化
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }

  /** 将字符串 ID 转换为数字（Qdrant 要求数字 ID）*/
  private hashId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  private mapRow(row: any): MemoryRecord {
    return {
      id: row.id,
      content: row.content,
      userId: row.user_id,
      sessionId: row.session_id,
      entities: row.entities || [],
      metadata: row.metadata || {},
      createdAt: row.created_at,
    };
  }
}
