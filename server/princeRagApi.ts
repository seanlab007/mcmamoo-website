/**
 * 《君主论》(The Prince) RAG API 服务
 * 提供 /api/prince/search 接口供前端调用
 *
 * 集成方式（已在 server/index.ts 中注册）:
 * app.use("/api/prince", princeRagRouter)
 *
 * 调用示例：
 *   fetch('/api/prince/search?q=how+should+a+prince+behave&topK=3')
 *   fetch('/api/prince/stats')
 */

import express, { Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";

const router = express.Router();

/**
 * GET /api/prince/search
 * 查询《君主论》知识库
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
    const results = await searchPrince(query, k);
    res.json({
      success: true,
      query,
      count: results.length,
      results,
    });
  } catch (err) {
    console.error("[prince_rag] 检索失败:", err);
    res.status(500).json({
      error: "《君主论》检索失败",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * GET /api/prince/stats
 * 获取《君主论》语料库统计
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
 * GET /api/prince/references
 * 返回可直接注入 prompt 的格式化文本
 */
router.get("/references", async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim();
  const topK = Math.min(parseInt((req.query.topK as string) || "3", 10), 10);

  if (!q) {
    res.status(400).json({ error: "缺少查询参数 'q'" });
    return;
  }

  try {
    const results = await searchPrince(q, topK);
    // 格式化为可注入 system prompt 的文本
    const lines = ["【《君主论》相关引用】"];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      lines.push(`\n--- 引用 ${i + 1} (相关度: ${(r.score * 100).toFixed(1)}%) ---`);
      lines.push(r.text);
    }

    res.json({
      success: true,
      query: q,
      references: lines.join("\n"),
      count: results.length,
      results: results.map((r) => ({
        text: r.text.slice(0, 200) + (r.text.length > 200 ? "..." : ""),
        score: r.score,
        source: r.source,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "检索失败", detail: String(err) });
  }
});

// ── Python 子进程桥接 ─────────────────────────────────────────────

function searchPrince(query: string, topK: number): Promise<PrinceResult[]> {
  return new Promise((resolve, reject) => {
    const serverRoot = path.resolve(__dirname, "..");
    const proc = spawn("python3", [
      "-c",
      `
import sys
sys.path.insert(0, '${serverRoot}/server/mao_corpus')
from prince_rag import PrinceRAG
import json

query = """${query.replace(/"/g, '\\"')}"""
top_k = ${topK}

rag = PrinceRAG()
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
        console.error("[prince_rag] Python stderr:", stderr);
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

    proc.on("error", reject);
  });
}

function getCorpusStats(): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const serverRoot = path.resolve(__dirname, "..");

    const proc = spawn("python3", [
      "-c",
      `
import sys
sys.path.insert(0, '${serverRoot}/server/mao_corpus')
from prince_rag import PrinceRAG
import json
rag = PrinceRAG()
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

interface PrinceResult {
  text: string;
  metadata: Record<string, unknown>;
  score: number;
  source: string;
}

export default router;
