/**
 * Runway API Integration
 *
 * 支持的接口:
 * 1. Gen-3 Alpha Turbo — 文字生成视频 (text-to-video)
 * 2. Image-to-Video — 图片生成视频 (image-to-video)
 * 3. 任务状态查询
 *
 * 使用 Runway REST API (api.dev.runwayml.com)
 */

import { storagePut } from "../storage";

const RUNWAY_BASE_URL = "https://api.dev.runwayml.com/v1";
const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY || "";

export interface RunwayGen3Options {
  /** Text prompt describing the video */
  promptText: string;
  /** Negative prompt (what to avoid) */
  negativePromptText?: string;
  /** Duration in seconds: 5 or 10 */
  duration?: 5 | 10;
  /** Seed for reproducible results */
  seed?: number;
  /** Model version, default "gen3a_turbo" */
  model?: string;
}

export interface RunwayImageToVideoOptions {
  /** Input image URL (must be publicly accessible) */
  promptImage: string;
  /** Optional motion prompt */
  promptText?: string;
  /** Negative prompt */
  negativePromptText?: string;
  /** Duration in seconds: 5 or 10 */
  duration?: 5 | 10;
  /** Seed */
  seed?: number;
  /** Model version */
  model?: string;
}

export interface RunwayTask {
  id: string;
  status: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELLED";
  progress?: number;
  createdAt: string;
  completedAt?: string;
  output?: Array<{ url: string; seed?: number }>;
  failure?: string;
  failureCode?: string;
}

/**
 * Text-to-Video: Generate video from text prompt
 */
export async function runwayTextToVideo(
  options: RunwayGen3Options
): Promise<{ taskId: string }> {
  if (!RUNWAY_API_KEY) {
    throw new Error("RUNWAY_API_KEY 未配置。请在 .env 中设置 RUNWAY_API_KEY");
  }

  const body: Record<string, unknown> = {
    model: options.model || "gen3a_turbo",
    promptText: options.promptText,
    duration: options.duration || 5,
  };
  if (options.negativePromptText) body.negativePromptText = options.negativePromptText;
  if (options.seed !== undefined) body.seed = options.seed;

  const resp = await fetch(`${RUNWAY_BASE_URL}/image_to_video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RUNWAY_API_KEY}`,
      "X-Runway-Version": "2024-11-06",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(`Runway Text-to-Video 失败 (${resp.status}): ${err}`);
  }

  const data = (await resp.json()) as { id: string };
  return { taskId: data.id };
}

/**
 * Image-to-Video: Generate video from input image
 */
export async function runwayImageToVideo(
  options: RunwayImageToVideoOptions
): Promise<{ taskId: string }> {
  if (!RUNWAY_API_KEY) {
    throw new Error("RUNWAY_API_KEY 未配置");
  }

  const body: Record<string, unknown> = {
    model: options.model || "gen3a_turbo",
    promptImage: options.promptImage,
    duration: options.duration || 5,
  };
  if (options.promptText) body.promptText = options.promptText;
  if (options.negativePromptText) body.negativePromptText = options.negativePromptText;
  if (options.seed !== undefined) body.seed = options.seed;

  const resp = await fetch(`${RUNWAY_BASE_URL}/image_to_video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RUNWAY_API_KEY}`,
      "X-Runway-Version": "2024-11-06",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(`Runway Image-to-Video 失败 (${resp.status}): ${err}`);
  }

  const data = (await resp.json()) as { id: string };
  return { taskId: data.id };
}

/**
 * Get task status and result
 */
export async function runwayTaskStatus(taskId: string): Promise<RunwayTask> {
  if (!RUNWAY_API_KEY) {
    throw new Error("RUNWAY_API_KEY 未配置");
  }

  const resp = await fetch(`${RUNWAY_BASE_URL}/tasks/${taskId}`, {
    headers: {
      "Authorization": `Bearer ${RUNWAY_API_KEY}`,
      "X-Runway-Version": "2024-11-06",
    },
  });

  if (!resp.ok) {
    throw new Error(`Runway 任务查询失败 (${resp.status})`);
  }

  return (await resp.json()) as RunwayTask;
}

/**
 * Download generated video and save to storage
 */
export async function downloadAndStoreVideo(
  videoUrl: string,
  prefix: string = "runway"
): Promise<{ url: string }> {
  const resp = await fetch(videoUrl);
  if (!resp.ok) throw new Error(`下载视频失败 (${resp.status})`);
  const buffer = Buffer.from(await resp.arrayBuffer());

  const { url } = await storagePut(
    `${prefix}/${Date.now()}.mp4`,
    buffer,
    "video/mp4"
  );
  return { url };
}
