/**
 * videoProcessing.ts
 * 猫眼视频处理工具 API 代理
 *
 * 职责：
 *  1. 代理 /api/video/* 请求到 FastAPI 微服务 (localhost:8080)
 *  2. 提供统一的视频处理接口（剪切、字幕、拼接等）
 *  3. 支持本地/云端双模式
 */

import { Router, Request, Response } from "express";
import { requireAuth } from "./contentPlatform";

const videoProcessingRouter = Router();

const VIDEO_API_URL = process.env.VIDEO_API_URL || "http://localhost:8080";
const VIDEO_API_ENABLED = process.env.VIDEO_API_ENABLED !== "false";

// ─── 代理工具函数 ────────────────────────────────────────────────────────────
async function proxyToVideoAPI(
  method: "GET" | "POST",
  path: string,
  body?: any
): Promise<{ ok: boolean; data?: any; error?: string }> {
  if (!VIDEO_API_ENABLED) {
    return { ok: false, error: "VIDEO_API_ENABLED is disabled" };
  }

  try {
    const url = `${VIDEO_API_URL}${path}`;
    const options: RequestInit = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);
    const data = await res.json();

    return { ok: res.ok, data };
  } catch (err: any) {
    return { ok: false, error: err?.message || "Failed to connect to video API" };
  }
}

// ─── 错误响应 ───────────────────────────────────────────────────────────────
function errorResponse(res: Response, status: number, message: string) {
  return res.status(status).json({ error: message });
}

// ═══════════════════════════════════════════════════════════════════════════════
// API Routes
// ═══════════════════════════════════════════════════════════════════════════════

// ── GET /api/video/health ────────────────────────────────────────────────────
videoProcessingRouter.get("/health", async (_req: Request, res: Response) => {
  if (!VIDEO_API_ENABLED) {
    return res.json({ status: "disabled", message: "Video API is disabled" });
  }

  const result = await proxyToVideoAPI("GET", "/health");
  if (result.ok) {
    return res.json({ status: "online", ...result.data });
  }
  return res.json({ status: "offline", error: result.error });
});

// ── POST /api/video/clip ─────────────────────────────────────────────────────
videoProcessingRouter.post("/clip", async (req: Request, res: Response) => {
  const user = await requireAuth(req);
  if (!user) return errorResponse(res, 401, "未登录");

  const { video_path, start, end, output_path } = req.body;
  if (!video_path || start === undefined || end === undefined) {
    return errorResponse(res, 400, "video_path, start, end 不能为空");
  }

  const result = await proxyToVideoAPI("POST", "/api/v1/video/clip", {
    video_path,
    start,
    end,
    output_path,
  });

  if (result.ok) return res.json(result.data);
  return errorResponse(res, 500, result.error || "视频剪切失败");
});

// ── POST /api/video/batch-clip ──────────────────────────────────────────────
videoProcessingRouter.post("/batch-clip", async (req: Request, res: Response) => {
  const user = await requireAuth(req);
  if (!user) return errorResponse(res, 401, "未登录");

  const { clips } = req.body;
  if (!clips || !Array.isArray(clips)) {
    return errorResponse(res, 400, "clips 必须是数组");
  }

  const result = await proxyToVideoAPI("POST", "/api/v1/video/batch-clip", { clips });

  if (result.ok) return res.json(result.data);
  return errorResponse(res, 500, result.error || "批量剪切失败");
});

// ── POST /api/video/concat ──────────────────────────────────────────────────
videoProcessingRouter.post("/concat", async (req: Request, res: Response) => {
  const user = await requireAuth(req);
  if (!user) return errorResponse(res, 401, "未登录");

  const { video_paths, output_path } = req.body;
  if (!video_paths || !Array.isArray(video_paths)) {
    return errorResponse(res, 400, "video_paths 必须是数组");
  }

  const result = await proxyToVideoAPI("POST", "/api/v1/video/concat", {
    video_paths,
    output_path,
  });

  if (result.ok) return res.json(result.data);
  return errorResponse(res, 500, result.error || "视频拼接失败");
});

// ── POST /api/video/subtitle ────────────────────────────────────────────────
videoProcessingRouter.post("/subtitle", async (req: Request, res: Response) => {
  const user = await requireAuth(req);
  if (!user) return errorResponse(res, 401, "未登录");

  const { video_path, language, asr_engine, output_format } = req.body;
  if (!video_path) {
    return errorResponse(res, 400, "video_path 不能为空");
  }

  const result = await proxyToVideoAPI("POST", "/api/v1/video/subtitle", {
    video_path,
    language: language || "auto",
    asr_engine: asr_engine || "whisper",
    output_format: output_format || "srt",
  });

  if (result.ok) return res.json(result.data);
  return errorResponse(res, 500, result.error || "字幕生成失败");
});

// ── POST /api/video/subtitle-burn ───────────────────────────────────────────
videoProcessingRouter.post("/subtitle-burn", async (req: Request, res: Response) => {
  const user = await requireAuth(req);
  if (!user) return errorResponse(res, 401, "未登录");

  const { video_path, subtitle_path, output_path, subtitle_mode } = req.body;
  if (!video_path || !subtitle_path) {
    return errorResponse(res, 400, "video_path 和 subtitle_path 不能为空");
  }

  const result = await proxyToVideoAPI("POST", "/api/v1/video/subtitle-burn", {
    video_path,
    subtitle_path,
    output_path,
    subtitle_mode: subtitle_mode || "hard",
  });

  if (result.ok) return res.json(result.data);
  return errorResponse(res, 500, result.error || "字幕烧录失败");
});

// ── POST /api/video/watermark ───────────────────────────────────────────────
videoProcessingRouter.post("/watermark", async (req: Request, res: Response) => {
  const user = await requireAuth(req);
  if (!user) return errorResponse(res, 401, "未登录");

  const { video_path, watermark_path, output_path, position } = req.body;
  if (!video_path || !watermark_path) {
    return errorResponse(res, 400, "video_path 和 watermark_path 不能为空");
  }

  const result = await proxyToVideoAPI("POST", "/api/v1/video/watermark", {
    video_path,
    watermark_path,
    output_path,
    position: position || "bottom-right",
  });

  if (result.ok) return res.json(result.data);
  return errorResponse(res, 500, result.error || "水印添加失败");
});

// ── GET /api/video/info ─────────────────────────────────────────────────────
videoProcessingRouter.get("/info", async (req: Request, res: Response) => {
  const user = await requireAuth(req);
  if (!user) return errorResponse(res, 401, "未登录");

  const { video_path } = req.query;
  if (!video_path) {
    return errorResponse(res, 400, "video_path 参数不能为空");
  }

  const result = await proxyToVideoAPI("GET", `/api/v1/video/info?video_path=${encodeURIComponent(video_path as string)}`);

  if (result.ok) return res.json(result.data);
  return errorResponse(res, 500, result.error || "获取视频信息失败");
});

// ── POST /api/video/short ───────────────────────────────────────────────────
videoProcessingRouter.post("/short", async (req: Request, res: Response) => {
  const user = await requireAuth(req);
  if (!user) return errorResponse(res, 401, "未登录");

  const { script, background_video, voiceover_path, language } = req.body;
  if (!script) {
    return errorResponse(res, 400, "script 不能为空");
  }

  const result = await proxyToVideoAPI("POST", "/api/v1/video/short", {
    script,
    background_video,
    voiceover_path,
    language: language || "en",
  });

  if (result.ok) return res.json(result.data);
  return errorResponse(res, 500, result.error || "短视频生成失败");
});

// ── POST /api/video/auto ────────────────────────────────────────────────────
videoProcessingRouter.post("/auto", async (req: Request, res: Response) => {
  const user = await requireAuth(req);
  if (!user) return errorResponse(res, 401, "未登录");

  const { video_path, target_language, workflow } = req.body;
  if (!video_path) {
    return errorResponse(res, 400, "video_path 不能为空");
  }

  const result = await proxyToVideoAPI("POST", "/api/v1/video/auto", {
    video_path,
    target_language: target_language || "zh",
    workflow: workflow || "subtitle_and_burn",
  });

  if (result.ok) return res.json(result.data);
  return errorResponse(res, 500, result.error || "自动处理失败");
});

export { videoProcessingRouter };
