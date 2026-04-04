import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import aiStreamRouter from "./aiStream";
import { chatRouter } from "./chat";
import { contentPlatformRouter, initScheduler } from "./contentPlatform";
import { registerOAuthRoutes } from "./_core/oauth";
import { registerSupabaseAuthRoutes } from "./_core/supabaseAuth";
import { mcpServerRouter } from "./mcp-server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Parse JSON request bodies
  app.use(express.json());

  // ── AI 节点协同 + 聊天流 + OpenAI 兼容 API（MaoAI 核心路由）──────────────
  registerOAuthRoutes(app);
  registerSupabaseAuthRoutes(app);  // 邮箱+密码登录（内容平台/MaoAI 管理员登录）
  app.use("/api/ai", aiStreamRouter);
  // MaoAI Chat API（历史对话 + 联网搜索 + 图片生成）
  app.use("/api/chat", chatRouter);
  // 猫眼内容平台协调 API
  app.use("/api/content", contentPlatformRouter);
  // MaoAI MCP Server — 允许外部 AI Agent 通过 MCP 协议调用 MaoAI 工具
  app.use("/api/mcp", mcpServerRouter);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // 启动定时任务调度器（加载 DB 中的激活任务）
    initScheduler().catch((e) => console.warn("[Scheduler] Init failed:", e));
  });
}

startServer().catch(console.error);
