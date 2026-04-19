/**
 * mao_corpus RAG 向量检索服务（纯 TypeScript）
 * 直接加载 .code_rag_index.json，在内存中做向量检索
 * 无需 Python 子进程，快速且无跨进程开销
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// 配置
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INDEX_FILE = path.join(__dirname, "mao_corpus/.code_rag_index.json");

// 类型定义
interface ChunkEntry {
  text: string;
  vector: number[];
  metadata: {
    source?: string;
    title?: string;
    [key: string]: unknown;
  };
}

interface SearchResult {
  text: string;
  metadata: Record<string, unknown>;
  score: number;
  source: string;
}

// 预加载向量索引
let chunks: ChunkEntry[] = [];
let isLoaded = false;

/** 余弦相似度 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const d = Math.sqrt(normA) * Math.sqrt(normB);
  return d === 0 ? 0 : dot / d;
}

/** 加载索引（惰性加载，只执行一次） */
function loadIndex(): void {
  if (isLoaded) return;
  try {
    const raw = fs.readFileSync(INDEX_FILE, "utf-8");
    chunks = JSON.parse(raw) as ChunkEntry[];
    isLoaded = true;
    console.log(`[mao_rag] ✅ 加载语料库: ${chunks.length} chunks`);
  } catch (e) {
    console.error("[mao_rag] ❌ 加载索引失败:", e);
    throw e;
  }
}

/** 计算文本相似度（基于字符重叠，非向量版本备选） */
function textSimilarity(query: string, text: string): number {
  const qWords = new Set(query.toLowerCase().split(/\s+/).filter(Boolean));
  const tWords = new Set(text.toLowerCase().split(/\s+/).filter(Boolean));
  if (qWords.size === 0) return 0;
  let overlap = 0;
  qWords.forEach((w) => {
    if (tWords.has(w) || text.toLowerCase().includes(w)) overlap++;
  });
  return overlap / qWords.size;
}

/** 获取查询的向量嵌入（通过 Ollama 本地 API） */
async function getQueryEmbedding(query: string): Promise<number[]> {
  const url = "http://localhost:11434/api/embeddings";
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "nomic-embed-text", prompt: query }),
    signal: AbortSignal.timeout(30000),
  });
  if (!resp.ok) throw new Error(`Ollama API 失败: ${resp.status}`);
  const data = (await resp.json()) as { embedding: number[] };
  return data.embedding;
}

/** 核心检索函数 */
async function searchCorpus(query: string, topK: number = 5): Promise<SearchResult[]> {
  loadIndex();

  if (!query.trim()) return [];

  let queryEmb: number[];
  try {
    queryEmb = await getQueryEmbedding(query);
  } catch (e) {
    console.warn("[mao_rag] Ollama 不可用，切换到文本相似度:", e);
    // 回退：纯文本相似度
    return chunks
      .map((c) => ({
        text: c.text,
        metadata: c.metadata,
        score: textSimilarity(query, c.text),
        source: c.metadata?.source ?? "unknown",
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  // 向量检索
  const results = chunks
    .filter((c) => c.vector && c.vector.length > 0)
    .map((c) => ({
      text: c.text,
      metadata: c.metadata,
      score: cosineSimilarity(queryEmb, c.vector),
      source: c.metadata?.source ?? "unknown",
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return results;
}

/** 格式化为可注入 system prompt 的文本 */
function formatForPrompt(results: SearchResult[]): string {
  if (!results.length) return "";
  const lines = ["【毛泽东选集相关语料引用】"];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    lines.push(`\n--- 引用 ${i + 1} (相关度: ${(r.score * 100).toFixed(1)}%) ---`);
    lines.push(r.text);
  }
  return lines.join("");
}

/** 获取统计信息 */
function getStats(): { total: number; withVectors: number } {
  loadIndex();
  return {
    total: chunks.length,
    withVectors: chunks.filter((c) => c.vector && c.vector.length > 0).length,
  };
}

// ─── Express Route Handler ────────────────────────────────────────────────

import type { Request, Response } from "express";

export function registerMaoRagRouter(app: import("express").Application): void {
  loadIndex();

  // GET /api/mao-rag/search?q=关键词&topK=3
  app.get("/api/mao-rag/search", async (req: Request, res: Response) => {
    const q = (req.query.q as string | undefined)?.trim();
    const topK = Math.min(parseInt((req.query.topK as string) || "3", 10), 10);

    if (!q) {
      res.status(400).json({ error: "缺少查询参数 'q'" });
      return;
    }

    try {
      const results = await searchCorpus(q, topK);
      res.json({
        success: true,
        query: q,
        count: results.length,
        results,
      });
    } catch (err) {
      console.error("[mao_rag] 检索失败:", err);
      res.status(500).json({ error: "检索失败", detail: String(err) });
    }
  });

  // GET /api/mao-rag/stats
  app.get("/api/mao-rag/stats", (_req: Request, res: Response) => {
    res.json({ success: true, ...getStats() });
  });

  // GET /api/mao-rag/references?q=关键词 — 返回可直接注入 prompt 的文本
  app.get("/api/mao-rag/references", async (req: Request, res: Response) => {
    const q = (req.query.q as string | undefined)?.trim();
    const topK = Math.min(parseInt((req.query.topK as string) || "3", 10), 10);

    if (!q) {
      res.status(400).json({ error: "缺少查询参数 'q'" });
      return;
    }

    try {
      const results = await searchCorpus(q, topK);
      const promptText = formatForPrompt(results);
      res.json({
        success: true,
        query: q,
        references: promptText,
        count: results.length,
        results: results.map((r) => ({ text: r.text.slice(0, 200) + (r.text.length > 200 ? "..." : ""), score: r.score, source: r.source })),
      });
    } catch (err) {
      res.status(500).json({ error: "检索失败", detail: String(err) });
    }
  });

  console.log("[mao_rag] ✅ 已注册 /api/mao-rag 路由");
}

export { searchCorpus, formatForPrompt, getStats };
