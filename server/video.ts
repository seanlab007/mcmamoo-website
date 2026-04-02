/**
 * MaoAI Video Generation Module
 *
 * 统一接入多平台视频生成 API：
 * - Runway (via useapi.net) - Gen-4.5 / Gen-4 / Veo 3.1 / Sora 2 / Kling / Wan
 * - Kling (快手可灵) - 原生 API
 * - Jimeng (火山引擎即梦) - 原生 API
 *
 * API Docs:
 * - Runway: https://docs.dev.runwayml.com/api/
 * - Kling:  https://klingapi.com/zh/docs
 * - Jimeng: https://www.volcengine.com/docs/85621/1817045
 */

// ─── Video Provider Base URLs ────────────────────────────────────────────────

const RUNWAY_API_URL  = "https://api.useapi.net/v1/runwayml";
const KLING_API_URL    = "https://api.klingapi.com/v1";
// Jimeng: 用户需从火山引擎控制台获取自己的 API 域名
// 格式通常是: https://visual.{{region}}.volces.com
const JIMENG_API_URL   = process.env.JIMENG_API_URL || "https://visual.volces.com";

// ─── API Keys (from env) ────────────────────────────────────────────────────

const RUNWAY_API_KEY  = process.env.RUNWAY_API_KEY  || "";
const KLING_API_KEY   = process.env.KLING_API_KEY   || "";
const JIMENG_API_KEY  = process.env.JIMENG_API_KEY || "";

// ─── Shared Types ───────────────────────────────────────────────────────────

export interface VideoTask {
  taskId: string;
  status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED";
  progress?: number;
  videoUrl?: string;
  error?: string;
}

export interface VideoGenerateOptions {
  prompt: string;
  duration?: number;       // 秒
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3" | "3:4" | "21:9";
  model?: string;         // 视频模型 ID
  imageUrl?: string;      // 图生视频时传入
  negativePrompt?: string; // 负向提示词（仅部分模型支持）
  seed?: number;          // 随机种子
}

// ─── Runway Video Generation ────────────────────────────────────────────────
// Runway 通过 useapi.net 提供统一入口，支持多模型：
// gen4.5, gen4, gen4-turbo, kling-3.0-pro, kling-3.0-standard,
// kling-2.6-pro, kling-2.6-i2v, veo-3.1, sora-2, sora-2-pro,
// wan-2.6-flash, wan-2.2-animate
// ⚠️ Sora 2 / Sora 2 Pro: OpenAI 已于 2026-03-24 关停 Sora 服务，
//    useapi.net 上的 sora-2 / sora-2-pro 可能会陆续失效

export async function generateRunwayVideo(
  options: VideoGenerateOptions
): Promise<VideoTask> {
  if (!RUNWAY_API_KEY) {
    return { taskId: "", status: "FAILED", error: "RUNWAY_API_KEY 未配置" };
  }

  const body: Record<string, unknown> = {
    model: options.model || "gen4.5",
    text_prompt: options.prompt,
  };

  if (options.duration) body.duration = options.duration;
  if (options.aspectRatio) body.aspect_ratio = options.aspectRatio;
  if (options.imageUrl) {
    // Runway 需要先上传图片获取 assetId，再传入
    // 这里简化处理：直接传 image URL（需先通过 /assets 上传）
    body.imageAssetId1 = options.imageUrl;
  }
  if (options.seed) body.seed = options.seed;
  body.exploreMode = true; // 设为 true 可节省 credits

  try {
    const res = await fetch(`${RUNWAY_API_URL}/videos/create`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RUNWAY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        taskId: "",
        status: "FAILED",
        error: data.error || `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    return {
      taskId: data.task?.id || data.taskId || "",
      status: "PENDING",
    };
  } catch (err) {
    return {
      taskId: "",
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getRunwayTaskStatus(taskId: string): Promise<VideoTask> {
  if (!RUNWAY_API_KEY) {
    return { taskId, status: "FAILED", error: "RUNWAY_API_KEY 未配置" };
  }

  try {
    const res = await fetch(`${RUNWAY_API_URL}/tasks/${taskId}`, {
      headers: { "Authorization": `Bearer ${RUNWAY_API_KEY}` },
    });

    const data = await res.json();
    const artifacts = data.task?.artifacts || [];
    const videoArtifact = artifacts.find(
      (a: { type: string }) => a.type === "video"
    );

    return {
      taskId: data.task?.id || taskId,
      status: mapRunwayStatus(data.task?.status),
      progress: data.task?.progressRatio
        ? parseFloat(data.task.progressRatio) * 100
        : undefined,
      videoUrl: videoArtifact?.url,
      error: data.task?.error?.errorMessage,
    };
  } catch (err) {
    return {
      taskId,
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function mapRunwayStatus(status: string): VideoTask["status"] {
  switch (status) {
    case "PENDING":       return "PENDING";
    case "RUNNING":       return "PROCESSING";
    case "SUCCEEDED":     return "SUCCEEDED";
    case "FAILED":        return "FAILED";
    default:              return "PENDING";
  }
}

// ─── Kling Video Generation (快手可灵) ───────────────────────────────────────
// 支持: kling-video-o1, kling-v2.6-pro, kling-v2.6-std, kling-v2.5-turbo
// 端点: POST /v1/videos/text2video, POST /v1/videos/image2video
// 异步任务，需轮询: GET /v1/videos/{task_id}
// Docs: https://klingapi.com/zh/docs

export async function generateKlingVideo(
  options: VideoGenerateOptions
): Promise<VideoTask> {
  if (!KLING_API_KEY) {
    return { taskId: "", status: "FAILED", error: "KLING_API_KEY 未配置" };
  }

  const endpoint = options.imageUrl
    ? `${KLING_API_URL}/videos/image2video`
    : `${KLING_API_URL}/videos/text2video`;

  const body: Record<string, unknown> = {
    model: options.model || "kling-v2.6-pro",
    prompt: options.prompt,
    duration: options.duration || 5,
    aspect_ratio: options.aspectRatio || "16:9",
    mode: "professional",
  };

  if (options.imageUrl) {
    body.image_url = options.imageUrl;
  }
  if (options.negativePrompt) {
    body.negative_prompt = options.negativePrompt;
  }

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KLING_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        taskId: "",
        status: "FAILED",
        error: data.message || data.error || `HTTP ${res.status}`,
      };
    }

    // Kling 返回 { task_id: "..." }
    const taskId: string = data.data?.task_id || data.task_id || "";

    return { taskId, status: "PENDING" };
  } catch (err) {
    return {
      taskId: "",
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getKlingTaskStatus(taskId: string): Promise<VideoTask> {
  if (!KLING_API_KEY) {
    return { taskId, status: "FAILED", error: "KLING_API_KEY 未配置" };
  }

  try {
    const res = await fetch(`${KLING_API_URL}/videos/${taskId}`, {
      headers: { "Authorization": `Bearer ${KLING_API_KEY}` },
    });

    const data = await res.json();
    const videoData = data.data;

    if (!res.ok || !videoData) {
      return {
        taskId,
        status: "FAILED",
        error: data.message || data.error || `HTTP ${res.status}`,
      };
    }

    // Kling 状态: pending / processing / succeeded / failed
    const status = mapKlingStatus(videoData.status);
    const videoUrl =
      status === "SUCCEEDED" ? videoData.video_url : undefined;

    return {
      taskId,
      status,
      videoUrl,
      error: videoData.failure_reason,
    };
  } catch (err) {
    return {
      taskId,
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function mapKlingStatus(status: string): VideoTask["status"] {
  switch (status) {
    case "pending":    return "PENDING";
    case "processing":return "PROCESSING";
    case "succeeded": return "SUCCEEDED";
    case "failed":    return "FAILED";
    default:          return "PENDING";
  }
}

// ─── Jimeng Video Generation (火山引擎即梦) ─────────────────────────────────
// 模型: jimeng_v30 (720p/1080p, 支持运镜), jimeng_v30_pro (1080p)
// 端点: POST /v1/video/generations
// 查询: GET /v1/video/generations/{task_id}
// Docs: https://www.volcengine.com/docs/85621/1817045
// ⚠️ 需要在火山引擎控制台开通即梦 AI 服务并创建 API Key

export async function generateJimengVideo(
  options: VideoGenerateOptions
): Promise<VideoTask> {
  if (!JIMENG_API_KEY) {
    return { taskId: "", status: "FAILED", error: "JIMENG_API_KEY 未配置" };
  }

  const body: Record<string, unknown> = {
    model: options.model || "jimeng_v30",
    prompt: options.prompt,
    resolution: options.model === "jimeng_v30_pro" ? "1080p" : "720p",
    ratio: options.aspectRatio || "16:9",
    duration: options.duration || 5,
    seed: options.seed ?? -1,
  };

  if (options.imageUrl) {
    body.images = [options.imageUrl];
  }

  try {
    const res = await fetch(`${JIMENG_API_URL}/v1/video/generations`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${JIMENG_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        taskId: "",
        status: "FAILED",
        error: data.message || data.error || `HTTP ${res.status}`,
      };
    }

    const taskId: string = data.task_id || data.data?.task_id || "";

    return { taskId, status: "PENDING" };
  } catch (err) {
    return {
      taskId: "",
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getJimengTaskStatus(taskId: string): Promise<VideoTask> {
  if (!JIMENG_API_KEY) {
    return { taskId, status: "FAILED", error: "JIMENG_API_KEY 未配置" };
  }

  try {
    const res = await fetch(
      `${JIMENG_API_URL}/v1/video/generations/${taskId}`,
      {
        headers: { "Authorization": `Bearer ${JIMENG_API_KEY}` },
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return {
        taskId,
        status: "FAILED",
        error: data.message || data.error || `HTTP ${res.status}`,
      };
    }

    const status = mapJimengStatus(data.status);
    const videoUrl =
      status === "SUCCEEDED"
        ? data.data?.video_url || data.video_url
        : undefined;

    return {
      taskId,
      status,
      videoUrl,
      error: data.error_msg,
    };
  } catch (err) {
    return {
      taskId,
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function mapJimengStatus(status: string): VideoTask["status"] {
  switch (status) {
    case "PENDING":     return "PENDING";
    case "PROCESSING": return "PROCESSING";
    case "SUCCESS":    return "SUCCEEDED";
    case "FAILED":     return "FAILED";
    default:           return "PENDING";
  }
}

// ─── Unified Video Generate (自动路由) ─────────────────────────────────────
// 根据传入的 model 前缀自动选择对应平台

export async function generateVideo(
  options: VideoGenerateOptions
): Promise<VideoTask> {
  const model = options.model || "runway-gen4.5";

  if (model.startsWith("runway-") || model.startsWith("gen4") ||
      model.startsWith("veo-") || model.startsWith("sora-") ||
      model.startsWith("kling-") || model.startsWith("wan-")) {
    // 统一走 Runway 入口（它聚合了多个模型）
    const actualModel = model.replace(/^runway-/, "");
    return generateRunwayVideo({ ...options, model: actualModel });
  }

  if (model.startsWith("kling-")) {
    // Kling 原生 API
    return generateKlingVideo({ ...options, model });
  }

  if (model.startsWith("jimeng-")) {
    // Jimeng 原生 API
    return generateJimengVideo({ ...options, model });
  }

  // 默认走 Runway（支持最多模型）
  return generateRunwayVideo(options);
}

export async function getVideoTaskStatus(
  taskId: string,
  provider: "runway" | "kling" | "jimeng"
): Promise<VideoTask> {
  switch (provider) {
    case "runway": return getRunwayTaskStatus(taskId);
    case "kling":   return getKlingTaskStatus(taskId);
    case "jimeng":  return getJimengTaskStatus(taskId);
    default:        return { taskId, status: "FAILED", error: "Unknown provider" };
  }
}

// ─── Video Model Catalog (供前端展示) ───────────────────────────────────────

export interface VideoModelInfo {
  id: string;
  name: string;
  provider: "runway" | "kling" | "jimeng";
  supportsText2Video: boolean;
  supportsImage2Video: boolean;
  maxDuration: number;   // 秒
  resolutions: string[];
  aspectRatios: string[];
  notes?: string;
}

export const VIDEO_MODELS: VideoModelInfo[] = [
  // ── Runway ────────────────────────────────────────────────────────────────
  {
    id: "runway-gen4.5",
    name: "Runway Gen-4.5",
    provider: "runway",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 10,
    resolutions: ["auto"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
    notes: "最新旗舰模型，支持 2-10s 连续时长，带音频",
  },
  {
    id: "runway-gen4",
    name: "Runway Gen-4",
    provider: "runway",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 10,
    resolutions: ["720p"],
    aspectRatios: ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9"],
  },
  {
    id: "runway-veo-3.1",
    name: "Google Veo 3.1 (via Runway)",
    provider: "runway",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 8,
    resolutions: ["720p", "1080p"],
    aspectRatios: ["16:9", "9:16"],
    notes: "Google DeepMind 视频模型，效果优秀",
  },
  {
    id: "runway-wan-2.6-flash",
    name: "Wan 2.6 Flash (via Runway)",
    provider: "runway",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 15,
    resolutions: ["720p", "1080p"],
    aspectRatios: ["16:9", "9:16", "1:1"],
  },
  // ⚠️ Sora 2 已关停，以下保留仅供参考
  // {
  //   id: "runway-sora-2",
  //   name: "Sora 2 (via Runway) ⚠️ 已关停",
  //   provider: "runway",
  //   supportsText2Video: true,
  //   supportsImage2Video: true,
  //   maxDuration: 12,
  //   resolutions: ["720p", "1080p"],
  //   aspectRatios: ["16:9", "9:16"],
  //   notes: "⚠️ OpenAI 已于 2026-03-24 关停 Sora，此模型可能已失效",
  // },

  // ── Kling ─────────────────────────────────────────────────────────────────
  {
    id: "kling-o1",
    name: "Kling O1 (统一多模态)",
    provider: "kling",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 10,
    resolutions: ["auto"],
    aspectRatios: ["16:9", "9:16", "1:1"],
    notes: "快手最新统一模型，支持多模态理解",
  },
  {
    id: "kling-v2.6-pro",
    name: "Kling v2.6 Pro",
    provider: "kling",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 10,
    resolutions: ["auto"],
    aspectRatios: ["16:9", "9:16", "1:1"],
    notes: "原生音频 + 运动控制，专业模式 ~60s 生成",
  },
  {
    id: "kling-v2.6-std",
    name: "Kling v2.6 Standard",
    provider: "kling",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 10,
    resolutions: ["auto"],
    aspectRatios: ["16:9", "9:16", "1:1"],
    notes: "快速生成，带音频",
  },
  {
    id: "kling-v2.5-turbo",
    name: "Kling v2.5 Turbo",
    provider: "kling",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 5,
    resolutions: ["auto"],
    aspectRatios: ["16:9", "9:16", "1:1"],
    notes: "最快生成速度",
  },

  // ── Jimeng ────────────────────────────────────────────────────────────────
  {
    id: "jimeng-v30",
    name: "即梦 v3.0 (720P)",
    provider: "jimeng",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 10,
    resolutions: ["720p", "1080p"],
    aspectRatios: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"],
    notes: "支持运镜模板（火山引擎），中文理解强",
  },
  {
    id: "jimeng-v30-pro",
    name: "即梦 v3.0 Pro (1080P)",
    provider: "jimeng",
    supportsText2Video: true,
    supportsImage2Video: true,
    maxDuration: 10,
    resolutions: ["1080p"],
    aspectRatios: ["16:9", "4:3", "1:1", "3:4", "9:16", "21:9"],
    notes: "专业级 1080P，分辨率更高",
  },
];
