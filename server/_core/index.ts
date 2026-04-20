// dotenv 必须在所有 import 之前加载！
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerSupabaseAuthRoutes } from "./supabaseAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import aiStreamRouter from "../aiStream";
import { chatRouter } from "../chat";
import { notesRouter } from "../notes";
import { fetchAllDigests } from "../research-digest";
import { mcpServerRouter } from "../mcp-server";
import { registerMaoRagRouter } from "../maoRagServer";

// ── 内容平台 & 任务调度 ───────────────────────────────────────────────────
import { contentPlatformRouter, initScheduler } from "../contentPlatform";

// ── WebSocket 服务器 ────────────────────────────────────────────────────────
import { wsServer } from "../wsServer";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  // 生产环境跳过端口探测（Railway 等平台端口通常是可用的）
  if (process.env.NODE_ENV === "production") {
    console.log(`[Server] Production mode: using port ${startPort}`);
    return startPort;
  }
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  console.log("[Server] Starting server...");
  console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV || "development"}`);
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // Supabase 邮箱+密码登录（管理员）
  registerSupabaseAuthRoutes(app);
  // AI 节点协同 + 聊天流 + OpenAI 兼容 API（MaoAI 核心路由）
  app.use("/api/ai", aiStreamRouter);
  // 私密云笔记 API（管理员专属）
  app.use("/api/notes", notesRouter);
  // MaoAI Chat API（对话历史 + 联网搜索 + 图片生成）
  app.use("/api/chat", chatRouter);
  // MaoAI MCP Server — HTTP SSE，让外部 AI Agent 通过 MCP 协议调用 MaoAI 工具
  app.use("/api/mcp", mcpServerRouter);
  // 猫眼内容平台协调 API（订阅/任务调度/定时任务）
  app.use("/api/content", contentPlatformRouter);
  // MaoAI 语料库 RAG 检索（毛泽东选集向量引用）
  registerMaoRagRouter(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Health check endpoint (before Vite middleware)
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    // ─── 研究摘要定时任务 ────────────────────────────────────────────────────
    // 每天早上 8:00 自动预热缓存（背景抓取，不阻塞启动）
    function scheduleNextDigestFetch() {
      const now = new Date();
      const target = new Date(now);
      target.setHours(8, 0, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1); // 若已过今天8点，推到明天
      const delay = target.getTime() - now.getTime();
      setTimeout(() => {
        console.log("[ResearchDigest] 定时任务：开始抓取 HBR + 学术期刊...");
        fetchAllDigests().then((result) => {
          console.log(
            `[ResearchDigest] 抓取完成：HBR=${result.hbrItems.length} 条，科学论文=${result.scienceItems.length} 条，猫眼相关=${result.maoyanRelevantItems.length} 条`
          );
        }).catch((e) => {
          console.warn("[ResearchDigest] 定时抓取失败：", e);
        });
        // 设置下一次（24小时后）
        setInterval(() => {
          fetchAllDigests().then((result) => {
            console.log(
              `[ResearchDigest] 每日更新：HBR=${result.hbrItems.length}，论文=${result.scienceItems.length}，猫眼=${result.maoyanRelevantItems.length}`
            );
          }).catch((e) => console.warn("[ResearchDigest] 每日更新失败：", e));
        }, 24 * 60 * 60 * 1000);
      }, delay);
      console.log(`[ResearchDigest] 下次自动更新：${target.toLocaleString("zh-CN")}`);
    }

    scheduleNextDigestFetch();
  });
}

startServer().catch(console.error);
