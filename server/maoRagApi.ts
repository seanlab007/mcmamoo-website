/**
 * mao_corpus RAG API 服务
 * 提供 /api/mao-rag/search 接口供前端调用
 *
 * 集成方式：
 * 1. 启动 Python RAG 服务 (uvicorn server.mao_rag_server:app --port 8766)
 * 2. 在 routers.ts 中引入并注册路由
 */

import express, { Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";

const router = express.Router();

/**
 * GET /api/mao-rag/search
 * 查询语料库
 * Query: q (string) - 搜索关键词
 * Query: topK (number) - 返回数量，默认 3
 */
router.get("/search", async (req: Request, res: Response) => {
  const { q, topK = "3" } = req.query as { q?: string; topK?: string };

  if (!q || typeof q !== "string" || !q.trim()) {
    res.status(400).json({ error: "缺少查询参数 'q'" });
    return;
  }

  const k = Math.min(parseInt(topK || "3", 10), 10);
  const query = q.trim();

  try {
    const results = await searchCorpus(query, k);
    res.json({
      success: true,
      query,
      count: results.length,
      results,
    });
  } catch (err) {
    console.error("[mao_rag] 检索失败:", err);
    res.status(500).json({
      error: "语料库检索失败",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * GET /api/mao-rag/stats
 * 获取语料库统计
 */
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const stats = await getCorpusStats();
    res.json({ success: true, ...stats });
  } catch (err) {
    res.status(500).json({ error: "获取统计失败", detail: String(err) });
  }
});

/**
 * 通过 Python 子进程调用 RAG 检索
 */
function searchCorpus(query: string, topK: number): Promise<CorpusResult[]> {
  return new Promise((resolve, reject) => {
    const serverRoot = path.resolve(__dirname, "..");
    const script = path.join(serverRoot, "server/mao_corpus_rag.py");

    const proc = spawn("python3", [
      "-c",
      `
import sys
sys.path.insert(0, '${serverRoot}/server')
from mao_corpus_rag import MaoCorpusRAG, get_query_embedding, cosine_similarity
import json

query = """${query.replace(/"/g, '\\"')}"""
top_k = ${topK}

rag = MaoCorpusRAG()
results = rag.search(query, top_k)
print(json.dumps(results, ensure_ascii=False))
`,
    ], {
      cwd: serverRoot,
      timeout: 15000,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.stderr.on("data", (d) => { stderr += d.toString(); });

    proc.on("close", (code) => {
      if (code !== 0) {
        console.error("[mao_rag] Python stderr:", stderr);
        reject(new Error(`Python 进程退出码 ${code}: ${stderr}`));
        return;
      }
      try {
        const results = JSON.parse(stdout.trim());
        resolve(results);
      } catch (e) {
        reject(new Error(`JSON 解析失败: ${stdout.slice(0, 200)}`));
      }
    });

    proc.on("error", (err) => reject(err));
  });
}

/**
 * 获取语料库统计
 */
function getCorpusStats(): Promise<{ total_chunks: number; with_vectors: number }> {
  return new Promise((resolve, reject) => {
    const serverRoot = path.resolve(__dirname, "..");

    const proc = spawn("python3", [
      "-c",
      `
import sys
sys.path.insert(0, '${serverRoot}/server')
from mao_corpus_rag import MaoCorpusRAG
import json
rag = MaoCorpusRAG()
print(json.dumps(rag.get_stats()))
`,
    ], { cwd: serverRoot, timeout: 10000 });

    let stdout = "";

    proc.stdout.on("data", (d) => { stdout += d.toString(); });
    proc.on("close", (code) => {
      if (code !== 0) { reject(new Error(`退出码 ${code}`)); return; }
      try { resolve(JSON.parse(stdout.trim())); } catch { reject(new Error("解析失败")); }
    });
    proc.on("error", reject);
  });
}

interface CorpusResult {
  text: string;
  metadata: Record<string, unknown>;
  score: number;
  source: string;
}

export default router;
