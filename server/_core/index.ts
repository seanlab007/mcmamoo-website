// dotenv 必须在所有 import 之前加载（通过 --require ./server/_core/preload.cjs 实现）
import "dotenv/config";

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
import { setupTriadLoopWS } from "../triadLoopWS";
import { getMaoAIRouter } from "../hybridTaskRouter";

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
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // OAuth 路由
  registerOAuthRoutes(app);
  // Supabase 邮箱+密码登录
  registerSupabaseAuthRoutes(app);

  // AI 节点协同 + 聊天流
  app.use("/api/ai", aiStreamRouter);
  // 私密云笔记 API
  app.use("/api/notes", notesRouter);
  // MaoAI Chat API
  app.use("/api/chat", chatRouter);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

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

  // 初始化 TriadLoop WebSocket
  setupTriadLoopWS(server);

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    // 混合云路由引擎初始化
    getMaoAIRouter().start().then((device) => {
      console.log(`[HybridCloud] MaoAIRouter 已启动，设备: ${device.deviceId}`);
    }).catch((err) => {
      console.warn("[HybridCloud] MaoAIRouter 启动失败（不影响主服务）:", err);
    });
  });
}

startServer().catch(console.error);
