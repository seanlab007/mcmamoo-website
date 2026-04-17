import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { aiNodesRouter } from "./aiNodes";
import aiStreamRouter from "./aiStream";
import { chatRouter } from "./chat";
import { contentPlatformRouter, initScheduler } from "./contentPlatform";
import { execFile } from "child_process";

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

  // ── AI Stream & Skill Management API ────────────────────────────────────────
  // POST /api/ai/chat/stream       SSE 聊天流（含 skill 匹配）
  // GET  /api/ai/skill/status      技能缓存状态
  // GET  /api/ai/status            服务状态
  // POST /api/ai/node/skills/sync  技能同步（aiStreamRouter 版本，含 toggle）
  // POST /api/ai/v1/chat/completions  OpenAI 兼容接口
  // ...more endpoints in aiStream.ts
  app.use("/api/ai", aiStreamRouter);

  // ── Skill Bridge Sync Endpoint ─────────────────────────────────────────────
  // POST /api/skill-bridge  — 触发 skill-bridge.mjs 同步脚本
  app.post("/api/skill-bridge", async (_req, res) => {
    try {
      const scriptPath = path.resolve(__dirname, "..", "scripts", "skill-bridge.mjs");
      execFile("node", [scriptPath], { timeout: 60_000 }, (err, stdout, stderr) => {
        if (err) {
          console.error("[SkillBridge] Sync error:", stderr);
          res.status(500).json({ success: false, error: stderr?.slice(0, 500) || err.message });
          return;
        }
        console.log("[SkillBridge] Sync output:", stdout?.slice(0, 200));
        // Extract count from output if possible
        const countMatch = stdout?.match(/(\d+)\s*(?:skills|技能)/i);
        res.json({ success: true, output: stdout?.slice(0, 1000), count: countMatch?.[1] || "completed" });
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // MaoAI Chat API
  app.use("/api/chat", chatRouter);
  // 猫眼内容平台协调 API
  // GET  /api/content/subscription            当前用户订阅信息
  // GET  /api/content/tasks                   内容任务列表
  // POST /api/content/tasks                   手动触发内容生产
  // GET  /api/content/admin/jobs              管理员：定时任务列表
  // POST /api/content/admin/jobs              管理员：创建定时任务
  // PATCH/DELETE /api/content/admin/jobs/:id  管理员：更新/删除定时任务
  // POST /api/content/admin/jobs/:id/run      管理员：立即运行
  // GET  /api/content/admin/subscriptions     管理员：用户订阅列表
  // POST /api/content/admin/subscriptions     管理员：开通/变更套餐
  app.use("/api/content", contentPlatformRouter);

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
