import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
import { registerSupabaseAuthRoutes } from "./supabaseAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import aiStreamRouter from "../aiStream";
import { chatRouter } from "../chat";
import { notesRouter } from "../notes";
import { fetchAllDigests } from "../research-digest";
import { mcpServerRouter } from "../mcp-server";
import { hybridCloudRouter } from "../hybridCloudRouter";
import { getMaoAIRouter } from "../hybridTaskRouter";
import { asyncTaskRouter } from "./asyncTaskRouter";
import { setupTriadLoopWS } from "../triadLoopWS";
=======
=======
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
>>>>>>> origin/deploy/trigger-build-1774631965
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { aiNodesRouter } from "../aiNodes";
import { chatRouter } from "../chat";
import { notesRouter } from "../notes";
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> origin/fix/navbar-dropdown-interaction
=======
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
>>>>>>> origin/deploy/trigger-build-1774631965

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
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
  // Supabase 邮箱+密码登录（管理员）
  registerSupabaseAuthRoutes(app);

  // ── 邮箱+密码登录（Supabase Auth，备选路由）────────────────────────────
  app.post("/api/auth/email-login", async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    try {
      const authResp = await fetch(
        `${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.SUPABASE_ANON_KEY ?? "",
          },
          body: JSON.stringify({ email, password }),
        }
      );
      const authText = await authResp.text();
      console.log("[email-login] Auth response status:", authResp.status);
      console.log("[email-login] Auth response body:", authText.substring(0, 500));
      const authData = JSON.parse(authText) as {
        access_token?: string;
        user?: { id: string; email: string };
        error_description?: string;
        error?: string;
      };
      if (!authData.access_token || !authData.user) {
        res.status(401).json({ error: authData.error_description || "邮箱或密码错误" });
        return;
      }
      const openId = `supabase:${authData.user.id}`;
      const userEmail = authData.user.email ?? email;
      const role: "admin" | "user" =
        userEmail === "sean_lab@me.com" || userEmail === process.env.OWNER_EMAIL
          ? "admin"
          : "user";
      const sessionToken = await sdk.createSessionToken(openId, {
        name: userEmail.split("@")[0],
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({
        success: true,
        role,
        redirectTo: role === "admin" ? "/admin/nodes" : "/maoai",
        sessionToken,
      });
    } catch (e: unknown) {
      console.error("[email-login] Error:", e);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // AI 节点协同 + 聊天流 + OpenAI 兼容 API（MaoAI 核心路由）
  app.use("/api/ai", aiStreamRouter);
=======
  // AI 节点协同 API（OpenClaw × MaoAI 协同架构）
  app.use("/api/ai", aiNodesRouter);
>>>>>>> origin/fix/navbar-dropdown-interaction
=======
  // AI 节点协同 API（OpenClaw × MaoAI 协同架构）
  app.use("/api/ai", aiNodesRouter);
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
  // AI 节点协同 API（OpenClaw × MaoAI 协同架构）
  app.use("/api/ai", aiNodesRouter);
>>>>>>> origin/deploy/trigger-build-1774631965
  // 私密云笔记 API（管理员专属）
  app.use("/api/notes", notesRouter);
  // MaoAI Chat API（对话历史 + 联网搜索 + 图片生成）
  app.use("/api/chat", chatRouter);
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
  // MaoAI MCP Server — HTTP SSE，让外部 AI Agent 通过 MCP 协议调用 MaoAI 工具
  app.use("/api/mcp", mcpServerRouter);
  // MaoAI 混合云管理 API（热更新、Skill 加载、GitHub Webhook 等）
  app.use("/api/hybrid", hybridCloudRouter);
  // 异步任务编排 API（Manus-style 边聊边干）
  app.use("/api/tasks", asyncTaskRouter);
=======
>>>>>>> origin/fix/navbar-dropdown-interaction
=======
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
>>>>>>> origin/deploy/trigger-build-1774631965
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
  // Health check endpoint (before Vite middleware)
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
=======
>>>>>>> origin/fix/navbar-dropdown-interaction
=======
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
>>>>>>> origin/deploy/trigger-build-1774631965
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

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
  // 初始化 TriadLoop WebSocket 服务
  setupTriadLoopWS(server);

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

    // ─── 混合云路由引擎初始化 ──────────────────────────────────────────────
    // 注册设备 + 启动心跳上报（30s 间隔 → Supabase maoai_devices）
    getMaoAIRouter().start().then((device) => {
      console.log(`[HybridCloud] MaoAIRouter 已启动，设备: ${device.deviceId}`);
    }).catch((err) => {
      console.warn("[HybridCloud] MaoAIRouter 启动失败（心跳功能不可用，但不影响主服务）:", err);
    });
=======
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
>>>>>>> origin/fix/navbar-dropdown-interaction
=======
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
>>>>>>> origin/fix/final-navbar-restructure-1774631973
=======
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
>>>>>>> origin/deploy/trigger-build-1774631965
  });
}

startServer().catch(console.error);
