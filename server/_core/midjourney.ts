/**
 * Midjourney API Integration
 *
 * 支持的接口:
 * 1. /imagine  — 文字生成图片 (text-to-image)
 * 2. /upscale  — 放大指定索引的图片
 * 3. /vary     — 变体生成
 * 4. /blend    — 多图混合
 *
 * 两种使用方式:
 * - 官方 API (需要 Midjourney API Key，推荐 midjourney-api 代理)
 * - 通过 GoAPI 等第三方代理服务
 */

import { storagePut } from "../storage";

const MIDJOURNEY_BASE_URL =
  process.env.MIDJOURNEY_BASE_URL || "https://api.goapi.xyz/mj";
const MIDJOURNEY_API_KEY = process.env.MIDJOURNEY_API_KEY || "";

export interface MidjourneyImagineOptions {
  prompt: string;
  aspectRatio?: "1:1" | "2:3" | "3:2" | "4:5" | "5:4" | "9:16" | "16:9";
  quality?: "0.25" | "0.5" | "1";
  style?: "raw" | "vivid";
  version?: "v6.1" | "v6" | "v5.2" | "v5.1" | "v5" | "niji6" | "niji5";
  webhookUrl?: string;
}

export interface MidjourneyTaskResult {
  taskId: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  imageUrl?: string;
  progress?: number;
  failReason?: string;
}

/**
 * 提交 Imagine 任务（文字生成图片）
 */
export async function midjourneyImagine(
  options: MidjourneyImagineOptions
): Promise<{ taskId: string }> {
  if (!MIDJOURNEY_API_KEY) {
    throw new Error("MIDJOURNEY_API_KEY 未配置。请在 .env 中设置 MIDJOURNEY_API_KEY");
  }

  // 构建完整 prompt
  let fullPrompt = options.prompt;
  if (options.aspectRatio) fullPrompt += ` --ar ${options.aspectRatio}`;
  if (options.quality) fullPrompt += ` --q ${options.quality}`;
  if (options.style) fullPrompt += ` --s ${options.style}`;
  if (options.version) fullPrompt += ` --${options.version}`;

  const resp = await fetch(`${MIDJOURNEY_BASE_URL}/v2/imagine`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": MIDJOURNEY_API_KEY,
    },
    body: JSON.stringify({
      prompt: fullPrompt,
      base64Array: [],
      notifyHook: options.webhookUrl || undefined,
      state: "",
    }),
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => "");
    throw new Error(`Midjourney Imagine 失败 (${resp.status}): ${err}`);
  }

  const data = (await resp.json()) as { taskId?: string; taskIdDisplay?: string; code: number };
  if (data.code !== 200 && data.code !== 1) {
    throw new Error(`Midjourney API 返回错误码: ${data.code}`);
  }

  return { taskId: data.taskId || data.taskIdDisplay || "" };
}

/**
 * 查询任务状态和结果
 */
export async function midjourneyTaskStatus(
  taskId: string
): Promise<MidjourneyTaskResult> {
  if (!MIDJOURNEY_API_KEY) {
    throw new Error("MIDJOURNEY_API_KEY 未配置");
  }

  const resp = await fetch(`${MIDJOURNEY_BASE_URL}/v2/imagine/fetch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": MIDJOURNEY_API_KEY,
    },
    body: JSON.stringify({ taskId }),
  });

  if (!resp.ok) {
    throw new Error(`Midjourney 任务查询失败 (${resp.status})`);
  }

  const data = (await resp.json()) as {
    status: number;
    progress?: string;
    imageUrl?: string;
    failReason?: string;
    buttons?: Array<{ customId: string; emoji?: string; label?: string; type: number }>;
  };

  // Map status codes
  const statusMap: Record<number, MidjourneyTaskResult["status"]> = {
    1: "pending",       // Not started
    21: "in_progress",   // Submitting
    22: "in_progress",   // Running
    31: "completed",     // Success
    32: "failed",        // Failed
  };

  const status = statusMap[data.status] || "pending";
  const progress = data.progress ? parseInt(data.progress, 10) : undefined;

  return {
    taskId,
    status,
    imageUrl: data.imageUrl,
    progress,
    failReason: data.failReason,
  };
}

/**
 * 提交 Upscale 任务
 */
export async function midjourneyUpscale(
  taskId: string,
  index: number,
  webhookUrl?: string
): Promise<{ taskId: string }> {
  if (!MIDJOURNEY_API_KEY) {
    throw new Error("MIDJOURNEY_API_KEY 未配置");
  }

  const resp = await fetch(`${MIDJOURNEY_BASE_URL}/v2/upscale`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": MIDJOURNEY_API_KEY,
    },
    body: JSON.stringify({
      taskId,
      index,
      notifyHook: webhookUrl || undefined,
      state: "",
    }),
  });

  if (!resp.ok) throw new Error(`Midjourney Upscale 失败 (${resp.status})`);
  const data = (await resp.json()) as { taskId?: string; code: number };
  if (data.code !== 200 && data.code !== 1) {
    throw new Error(`Midjourney API 返回错误码: ${data.code}`);
  }
  return { taskId: data.taskId || "" };
}

/**
 * 提交 Variation 任务
 */
export async function midjourneyVary(
  taskId: string,
  index: number,
  webhookUrl?: string
): Promise<{ taskId: string }> {
  if (!MIDJOURNEY_API_KEY) {
    throw new Error("MIDJOURNEY_API_KEY 未配置");
  }

  const resp = await fetch(`${MIDJOURNEY_BASE_URL}/v2/variation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": MIDJOURNEY_API_KEY,
    },
    body: JSON.stringify({
      taskId,
      index,
      notifyHook: webhookUrl || undefined,
      state: "",
    }),
  });

  if (!resp.ok) throw new Error(`Midjourney Vary 失败 (${resp.status})`);
  const data = (await resp.json()) as { taskId?: string; code: number };
  if (data.code !== 200 && data.code !== 1) {
    throw new Error(`Midjourney API 返回错误码: ${data.code}`);
  }
  return { taskId: data.taskId || "" };
}

/**
 * 下载 Midjourney 生成的图片并保存到 S3/Supabase Storage
 */
export async function downloadAndStoreImage(
  imageUrl: string,
  prefix: string = "midjourney"
): Promise<{ url: string }> {
  const resp = await fetch(imageUrl);
  if (!resp.ok) throw new Error(`下载图片失败 (${resp.status})`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  const mimeType = resp.headers.get("content-type") || "image/png";
  const ext = mimeType.includes("webp") ? "webp" : mimeType.includes("png") ? "png" : "jpg";

  const { url } = await storagePut(
    `${prefix}/${Date.now()}.${ext}`,
    buffer,
    mimeType
  );
  return { url };
}
