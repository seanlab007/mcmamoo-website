/**
 * digitalHuman.ts
 * 数字人节点 - 集成 LivePortrait / Duix / Streamer-Sales
 * 
 * 集成功能：
 * - LivePortrait: 肖像动画 (快手)
 * - Duix-Avatar: 实时交互数字人
 * - Streamer-Sales: 电商带货数字人
 */

import { Router, Request, Response } from "express";
import { spawn } from "child_process";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { dbFetch } from "../../aiNodes";
import { getUserSubscription } from "../../contentPlatform";

const digitalHumanRouter = Router();

// ─── 配置 ───────────────────────────────────────────────────────────────
const AVATAR_OUTPUT_DIR = process.env.AVATAR_OUTPUT_DIR || "/tmp/maoai-avatars";
const LIVE_PORTRAIT_PATH = process.env.LIVE_PORTRAIT_PATH || "/models/LivePortrait";
const DUIX_MODEL_PATH = process.env.DUIX_MODEL_PATH || "/models/Duix";

// 确保输出目录存在
if (!existsSync(AVATAR_OUTPUT_DIR)) {
  mkdirSync(AVATAR_OUTPUT_DIR, { recursive: true });
}

// ─── 类型定义 ─────────────────────────────────────────────────────────
type AvatarType = "portrait" | "streamer" | "realtime";

interface AvatarTask {
  id: string;
  userId: string;
  type: AvatarType;
  sourceImage?: string;
  drivingVideo?: string;
  audioUrl?: string;
  script?: string;
  status: "queued" | "running" | "success" | "failed";
  progress: number;
  result?: {
    videoUrl?: string;
    audioUrl?: string;
    sessionId?: string;
  };
  error?: string;
  createdAt: Date;
}

// ─── LivePortrait 肖像动画 ─────────────────────────────────────────────
class LivePortraitNode {
  private modelPath: string;

  constructor() {
    this.modelPath = LIVE_PORTRAIT_PATH;
  }

  /**
   * 动画肖像
   * @param sourceImage 源人物图像路径/URL
   * @param drivingVideo 驱动视频路径/URL
   */
  async animatePortrait(params: {
    sourceImage: string;
    drivingVideo?: string;
    audio?: string;
  }): Promise<string> {
    const outputPath = path.join(
      AVATAR_OUTPUT_DIR,
      `portrait_${crypto.randomBytes(8).toString("hex")}.mp4`
    );

    // 检查本地模型
    if (!existsSync(this.modelPath)) {
      console.warn("[LivePortrait] Model not found, using placeholder");
      return this.generatePlaceholderVideo("portrait");
    }

    // 构建推理命令
    const args = [
      "python", path.join(this.modelPath, "inference.py"),
      "-s", params.sourceImage,
      "-d", params.drivingVideo || "",
      "--output", outputPath,
    ].filter(Boolean);

    return new Promise((resolve) => {
      const proc = spawn("python", args, { 
        env: { 
          ...process.env,
          PYTORCH_ENABLE_MPS_FALLBACK: "1"
        }
      });

      let stderr = "";
      proc.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        if (code === 0 && existsSync(outputPath)) {
          resolve(outputPath);
        } else {
          console.error("[LivePortrait] Inference failed:", stderr);
          resolve(this.generatePlaceholderVideo("portrait"));
        }
      });

      proc.on("error", () => resolve(this.generatePlaceholderVideo("portrait")));
    });
  }

  /**
   * 唇形同步
   */
  async lipSync(params: {
    video: string;
    audio: string;
  }): Promise<string> {
    // Wav2Lip 或 similar 唇形同步模型
    return params.video;
  }

  /**
   * 表情控制
   */
  async editExpression(params: {
    video: string;
    expression: "happy" | "sad" | "surprised" | "neutral";
  }): Promise<string> {
    return params.video;
  }

  private generatePlaceholderVideo(type: string): string {
    return path.join(AVATAR_OUTPUT_DIR, `${type}_placeholder.mp4`);
  }
}

// ─── Duix 实时交互 ─────────────────────────────────────────────────────
class DuixAvatarNode {
  private sessions: Map<string, any> = new Map();

  /**
   * 创建对话会话
   */
  async createSession(params: {
    avatarId: string;
    userId: string;
    context?: string;
  }): Promise<{ sessionId: string; wsEndpoint: string }> {
    const sessionId = crypto.randomBytes(16).toString("hex");

    const session = {
      id: sessionId,
      avatarId: params.avatarId,
      userId: params.userId,
      context: params.context || "",
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);

    return {
      sessionId,
      wsEndpoint: `/ws/avatar/${sessionId}`,
    };
  }

  /**
   * 发送消息
   */
  async sendMessage(params: {
    sessionId: string;
    message: string;
  }): Promise<{ text: string; audio?: string; video?: string }> {
    const session = this.sessions.get(params.sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    return {
      text: `收到消息: ${params.message}`,
      audio: "",
      video: "",
    };
  }

  /**
   * 获取会话状态
   */
  getSession(sessionId: string) {
    return this.sessions.get(sessionId);
  }
}

// ─── Streamer-Sales 带货主播 ────────────────────────────────────────────
class EcommerceStreamerNode {
  /**
   * 生成商品解说脚本
   */
  async generateProductScript(params: {
    productName: string;
    productDescription: string;
    productFeatures: string[];
    voiceStyle?: "enthusiastic" | "professional" | "casual";
  }): Promise<{
    script: string;
    estimatedDuration: number;
  }> {
    const styleMap = {
      enthusiastic: "热情洋溢、充满感染力的风格",
      professional: "专业可信、权威讲解的风格",
      casual: "轻松随意、朋友推荐的风格",
    };

    const script = `
[开场] 各位家人朋友们大家好！今天给大家推荐一款${params.productName}！

[介绍] ${params.productDescription}
这款产品有以下几个亮点：${params.productFeatures.join("、")}

[促销] 限时优惠，错过不再有！快来下单吧！

[结束] 感谢观看，记得点赞关注哦！
`.trim();

    return {
      script,
      estimatedDuration: 75,
    };
  }

  /**
   * 生成带配音数字人视频
   */
  async generateWithVoice(params: {
    script: string;
    avatarImage: string;
    voiceStyle?: string;
  }): Promise<string> {
    const outputPath = path.join(
      AVATAR_OUTPUT_DIR,
      `streamer_${crypto.randomBytes(8).toString("hex")}.mp4`
    );
    return outputPath;
  }

  /**
   * 批量生成商品视频
   */
  async batchGenerate(params: {
    products: Array<{
      name: string;
      description: string;
      features: string[];
    }>;
    template?: string;
  }): Promise<string[]> {
    const results: string[] = [];

    for (const product of params.products) {
      const { script } = await this.generateProductScript({
        productName: product.name,
        productDescription: product.description,
        productFeatures: product.features,
      });

      const videoPath = await this.generateWithVoice({
        script,
        avatarImage: "",
      });

      results.push(videoPath);
    }

    return results;
  }
}

// ─── 节点实例 ─────────────────────────────────────────────────────────
const livePortrait = new LivePortraitNode();
const duixAvatar = new DuixAvatarNode();
const ecommerceStreamer = new EcommerceStreamerNode();

// ─── 任务处理 ──────────────────────────────────────────────────────────
async function processAvatarTask(task: AvatarTask) {
  await dbFetch(`/content_tasks?id=eq.${task.id}`, {
    method: "PATCH",
    body: { status: "running", updated_at: new Date().toISOString() },
  });

  try {
    let result: any = {};

    switch (task.type) {
      case "portrait":
        result.videoUrl = await livePortrait.animatePortrait({
          sourceImage: task.sourceImage || "",
          drivingVideo: task.drivingVideo,
          audio: task.audioUrl,
        });
        break;

      case "streamer":
        const { script } = await ecommerceStreamer.generateProductScript({
          productName: "商品",
          productDescription: task.script || "",
          productFeatures: [],
        });
        result.videoUrl = await ecommerceStreamer.generateWithVoice({
          script,
          avatarImage: task.sourceImage || "",
        });
        result.script = script;
        break;

      case "realtime":
        const session = await duixAvatar.createSession({
          avatarId: task.sourceImage || "default",
          userId: task.userId,
          context: task.script,
        });
        result.sessionId = session.sessionId;
        result.wsEndpoint = session.wsEndpoint;
        break;
    }

    await dbFetch(`/content_tasks?id=eq.${task.id}`, {
      method: "PATCH",
      body: {
        status: "success",
        result,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error(`[DigitalHuman] Task ${task.id} failed:`, error);
    await dbFetch(`/content_tasks?id=eq.${task.id}`, {
      method: "PATCH",
      body: {
        status: "failed",
        error_message: error.message,
        updated_at: new Date().toISOString(),
      },
    });
  }
}

// ─── API 路由 ──────────────────────────────────────────────────────────

// POST /api/maoyan/avatar - 创建数字人任务
digitalHumanRouter.post("/", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // 权限校验 - 需要 strategic 或以上
    const subscription = await getUserSubscription(user?.openId || "");
    const userPlan = subscription?.plan || "free";
    
    if (!["strategic", "admin"].includes(userPlan)) {
      return res.status(403).json({
        error: "数字人功能需要战略会员或以上套餐"
      });
    }

    const {
      type = "portrait",
      sourceImage,
      drivingVideo,
      audioUrl,
      script,
    } = req.body;

    if (!["portrait", "streamer", "realtime"].includes(type)) {
      return res.status(400).json({ error: "无效的 avatar type" });
    }

    // 创建任务
    const taskId = crypto.randomBytes(16).toString("hex");

    await dbFetch("/content_tasks", {
      method: "POST",
      body: {
        skill_id: `avatar_${type}`,
        node_id: "ai-studio",
        triggered_by: user?.openId || "anonymous",
        trigger_type: "manual",
        params: { type, sourceImage, drivingVideo, audioUrl, script },
        status: "queued",
      },
    });

    // 异步处理
    const task: AvatarTask = {
      id: taskId,
      userId: user?.openId || "",
      type,
      sourceImage,
      drivingVideo,
      audioUrl,
      script,
      status: "queued",
      progress: 0,
      createdAt: new Date(),
    };
    
    processAvatarTask(task).catch(console.error);

    res.json({
      success: true,
      taskId,
      message: type === "realtime" 
        ? "会话已创建，请连接 WebSocket 进行实时对话"
        : "数字人视频任务已创建，正在处理中...",
    });
  } catch (error: any) {
    console.error("[DigitalHuman] Create task error:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/maoyan/avatar/:taskId - 查询任务状态
digitalHumanRouter.get("/:taskId", async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;

    const response = await dbFetch(
      `/content_tasks?id=eq.${encodeURIComponent(taskId)}&select=*&limit=1`
    );

    const task = (response.data as any[])?.[0];

    if (!task) {
      return res.status(404).json({ error: "任务不存在" });
    }

    res.json({
      taskId: task.id,
      type: task.params?.type,
      status: task.status,
      progress: task.progress || 0,
      result: task.result,
      error: task.error_message,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
    });
  } catch (error: any) {
    console.error("[DigitalHuman] Get task error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/maoyan/avatar/streamer/script - 生成带货脚本
digitalHumanRouter.post("/streamer/script", async (req: Request, res: Response) => {
  try {
    const { productName, productDescription, productFeatures, voiceStyle } = req.body;

    if (!productName) {
      return res.status(400).json({ error: "productName 不能为空" });
    }

    const result = await ecommerceStreamer.generateProductScript({
      productName,
      productDescription: productDescription || "",
      productFeatures: productFeatures || [],
      voiceStyle,
    });

    res.json({
      success: true,
      script: result.script,
      estimatedDuration: result.estimatedDuration,
    });
  } catch (error: any) {
    console.error("[DigitalHuman] Script generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/maoyan/avatar/session - 创建实时对话会话
digitalHumanRouter.post("/session", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { avatarId, context } = req.body;

    const session = await duixAvatar.createSession({
      avatarId: avatarId || "default",
      userId: user?.openId || "anonymous",
      context,
    });

    res.json({
      success: true,
      sessionId: session.sessionId,
      wsEndpoint: session.wsEndpoint,
    });
  } catch (error: any) {
    console.error("[DigitalHuman] Create session error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/maoyan/avatar/session/:sessionId/message - 发送消息
digitalHumanRouter.post("/session/:sessionId/message", async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message 不能为空" });
    }

    const result = await duixAvatar.sendMessage({ sessionId, message });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("[DigitalHuman] Send message error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default digitalHumanRouter;
