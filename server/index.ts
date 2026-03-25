import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { aiNodesRouter } from "./aiNodes";
import { chatRouter } from "./chat";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Parse JSON request bodies
  app.use(express.json());

  // ── AI 节点协同 API（OpenClaw × MaoAI 协同架构）────────────────────────────
  // POST /api/ai/node/register    节点注册（携带技能清单）
  // POST /api/ai/node/heartbeat   心跳维持
  // POST /api/ai/node/deregister  节点注销
  // POST /api/ai/node/skills/sync 增量技能更新
  // GET  /api/ai/node/list        节点列表（管理员）
  // POST /api/ai/skill/invoke     技能调用转发
  // POST /api/ai/skill/match      技能关键词匹配
  app.use("/api/ai", aiNodesRouter);
  // MaoAI Chat API
  app.use("/api/chat", chatRouter);

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
  });
}

startServer().catch(console.error);
