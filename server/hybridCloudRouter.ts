/**
 * Hybrid Cloud Router - 异构云路由器
 * 本地 MaoAI / 云端 mcmamoo.com / WorkBuddy 三端隔离运行
 *
 * mao_corpus 三端数据源（各自独立，互不影响）：
 *   - MaoAI 本地:   /Users/mac/Desktop/mcmamoo-website/server/mao_corpus/
 *   - WorkBuddy:    /Users/mac/.workbuddy/mao_corpus/
 *   - 云端 Supabase: https://fczherphuixpdjuevzsh.supabase.co/storage/v1/object/public/mao-corpus/
 */
import { Router, Request, Response } from "express";

const hybridCloudRouter = Router();

hybridCloudRouter.get("/status", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    endpoints: {
      local:  "http://localhost:3000",
      cloud:  "https://mcmamoo.com",
    },
    mao_corpus: {
      maoai_local:  "/Users/mac/Desktop/mcmamoo-website/server/mao_corpus",
      workbuddy:    "/Users/mac/.workbuddy/mao_corpus",
      cloud_url:    "https://fczherphuixpdjuevzsh.supabase.co/storage/v1/object/public/mao-corpus",
      index_file:   "code_rag_index.json",
      total_chunks: 3178,
    },
    sync_strategy: "isolated_replicas",  // 各自独立，共享同一份云端 source of truth
  });
});

export { hybridCloudRouter };
