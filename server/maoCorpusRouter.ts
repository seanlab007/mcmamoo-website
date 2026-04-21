/**
 * MaoCorpus Router - 毛泽东思想向量库 API
 * 三端隔离运行，各自独立引用同一云端 Source of Truth
 *
 * 数据源配置：
 *   1. 本地优先: server/mao_corpus/
 *   2. 云端备选: Supabase Storage (公共 bucket)
 */
import { Router, Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const maoCorpusRouter = Router();

// ============== 配置 ==============
const CLOUD_SUPABASE_URL = "https://fczherphuixpdjuevzsh.supabase.co";
const CLOUD_BUCKET = "mao-corpus";
const CLOUD_INDEX_URL = `${CLOUD_SUPABASE_URL}/storage/v1/object/public/${CLOUD_BUCKET}/code_rag_index.json`;

const LOCAL_CORPUS_DIR = path.resolve(__dirname, "mao_corpus");
const LOCAL_INDEX_PATH = path.join(LOCAL_CORPUS_DIR, "code_rag_index.json");

const WORKBUDDY_CORPUS_DIR = path.join(os.homedir(), ".workbuddy/mao_corpus");
const WORKBUDDY_INDEX_PATH = path.join(WORKBUDDY_CORPUS_DIR, "code_rag_index.json");

// ============== 辅助函数 ==============
async function fetchCloudIndex(): Promise<any | null> {
  try {
    const res = await fetch(CLOUD_INDEX_URL);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore
  }
  return null;
}

function getLocalIndex(): any | null {
  const candidates = [LOCAL_INDEX_PATH, WORKBUDDY_INDEX_PATH];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, "utf-8"));
      } catch {
        // ignore
      }
    }
  }
  return null;
}

// 简单的中文关键词匹配（用于无 embedding 模型时的降级）
function keywordSearch(index: any, query: string, topK: number = 5): any[] {
  const chunks = index?.chunks || [];

  const scored = chunks.map((chunk: any) => {
    const title = (chunk.title || "").toLowerCase();
    const content = (chunk.content || "").toLowerCase();
    const file = (chunk.metadata?.file || "").toLowerCase();
    const queryLower = query.toLowerCase();
    let score = 0;
    // 标题匹配权重更高
    if (title.includes(queryLower)) score += 3;
    if (file.includes(queryLower)) score += 1;
    // 内容包含查询词
    if (content.includes(queryLower)) score += 1;
    return { chunk, score };
  });

  return scored
    .filter((x: any) => x.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, topK)
    .map((x: any) => ({
      id: x.chunk.id,
      title: x.chunk.title,
      content: x.chunk.content,
      score: x.score,
    }));
}

// ============== API 端点 ==============

/** GET /api/mao-corpus/status - 状态检查 */
maoCorpusRouter.get("/status", (_req: Request, res: Response) => {
  const localExists = fs.existsSync(LOCAL_INDEX_PATH);
  const workbuddyExists = fs.existsSync(WORKBUDDY_INDEX_PATH);

  res.json({
    status: "online",
    data_sources: {
      maoai_local:  { path: LOCAL_CORPUS_DIR,        available: localExists },
      workbuddy:    { path: WORKBUDDY_CORPUS_DIR,      available: workbuddyExists },
      cloud:        { url: CLOUD_INDEX_URL,             available: null }, // 动态检测
    },
    total_chunks: null, // 动态获取
    version: null,
  });
});

/** GET /api/mao-corpus/search?q=xxx - 搜索 */
maoCorpusRouter.get("/search", async (req: Request, res: Response) => {
  const query = (req.query.q as string) || "";
  const topK = Math.min(parseInt(req.query.k as string) || 5, 20);

  if (!query.trim()) {
    res.json({ results: [], message: "请提供查询参数 q" });
    return;
  }

  // 优先本地
  let index = getLocalIndex();

  // 本地没有则尝试云端
  if (!index) {
    console.log("[MaoCorpus] 本地索引未找到，尝试云端...");
    index = await fetchCloudIndex();
    if (index) console.log("[MaoCorpus] 云端索引加载成功");
  }

  if (!index) {
    res.status(503).json({
      results: [],
      error: "无法加载向量索引（本地和云端均不可用）",
    });
    return;
  }

  const results = keywordSearch(index, query, topK);

  res.json({
    query,
    total_chunks: index.chunks?.length || 0,
    results,
    source: fs.existsSync(LOCAL_INDEX_PATH)
      ? "maoai_local"
      : fs.existsSync(WORKBUDDY_INDEX_PATH)
      ? "workbuddy"
      : "cloud",
  });
});

/** GET /api/mao-corpus/refresh - 刷新云端索引到本地 */
maoCorpusRouter.get("/refresh", async (_req: Request, res: Response) => {
  try {
    const index = await fetchCloudIndex();
    if (!index) {
      res.status(502).json({ error: "云端索引获取失败" });
      return;
    }

    // 保存到 MaoAI 本地目录
    const targetPath = LOCAL_INDEX_PATH;
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.writeFileSync(targetPath, JSON.stringify(index, null, 2));

    res.json({
      success: true,
      saved_to: targetPath,
      total_chunks: index.chunks?.length || 0,
      total_files: index.total_files || 0,
      version: index.version || "unknown",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

export { maoCorpusRouter };
