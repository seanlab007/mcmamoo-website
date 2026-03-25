/**
 * Image generation helper
 *
 * Priority order:
 * 1. Together AI FLUX (requires TOGETHER_API_KEY + credits)
 * 2. Stable Horde (completely free, no API key required)
 * 3. Internal Forge API (requires BUILT_IN_FORGE_API_URL + BUILT_IN_FORGE_API_KEY)
 */
import { storagePut } from "server/storage";
import { ENV } from "./env";

export type GenerateImageOptions = {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

// ── Together AI FLUX ──────────────────────────────────────────────────────────
async function generateImageViaTogetherAI(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const model = "black-forest-labs/FLUX.1-schnell-Free";
  const body: Record<string, unknown> = {
    model,
    prompt: options.prompt,
    width: options.width ?? 1024,
    height: options.height ?? 1024,
    steps: options.steps ?? 4,
    n: 1,
    response_format: "b64_json",
    output_format: "png",
  };

  const response = await fetch("https://api.together.xyz/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ENV.togetherApiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Together AI image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as {
    data: Array<{ b64_json?: string; url?: string }>;
  };

  const item = result.data?.[0];
  if (!item) throw new Error("Together AI returned empty data");

  if (item.b64_json) {
    const buffer = Buffer.from(item.b64_json, "base64");
    const { url } = await storagePut(`generated/${Date.now()}.png`, buffer, "image/png");
    return { url };
  }

  if (item.url) return { url: item.url };
  throw new Error("Together AI returned no image data");
}

// ── Stable Horde (completely free, anonymous key) ─────────────────────────────
async function generateImageViaStableHorde(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const apiKey = ENV.stableHordeApiKey || "0000000000";

  // Step 1: Submit generation job
  const submitRes = await fetch("https://stablehorde.net/api/v2/generate/async", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
      "Client-Agent": "MaoAI:1.0:mcmamoo",
    },
    body: JSON.stringify({
      prompt: options.prompt,
      params: {
        width: options.width ?? 512,
        height: options.height ?? 512,
        steps: options.steps ?? 20,
        n: 1,
        sampler_name: "k_euler_a",
        cfg_scale: 7,
      },
      models: ["stable_diffusion"],
      r2: true,
      shared: false,
    }),
  });

  if (!submitRes.ok) {
    const detail = await submitRes.text().catch(() => "");
    throw new Error(`Stable Horde submit failed (${submitRes.status}): ${detail}`);
  }

  const { id: jobId } = (await submitRes.json()) as { id: string };
  if (!jobId) throw new Error("Stable Horde did not return a job ID");

  // Step 2: Poll for completion (max 3 minutes)
  const maxAttempts = 36;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 5000));

    const checkRes = await fetch(`https://stablehorde.net/api/v2/generate/check/${jobId}`, {
      headers: { "Client-Agent": "MaoAI:1.0:mcmamoo" },
    });

    if (!checkRes.ok) continue;

    const check = (await checkRes.json()) as {
      done?: boolean;
      faulted?: boolean;
      wait_time?: number;
    };

    if (check.faulted) throw new Error("Stable Horde generation faulted");
    if (!check.done) continue;

    // Step 3: Retrieve result
    const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${jobId}`, {
      headers: { "Client-Agent": "MaoAI:1.0:mcmamoo" },
    });

    if (!statusRes.ok) throw new Error(`Stable Horde status fetch failed (${statusRes.status})`);

    const status = (await statusRes.json()) as {
      generations?: Array<{ img: string; censored?: boolean }>;
    };

    const gen = status.generations?.[0];
    if (!gen) throw new Error("Stable Horde returned no generations");

    const imgData = gen.img;

    // If it's a URL (R2 storage), return directly
    if (imgData.startsWith("http")) {
      return { url: imgData };
    }

    // If it's base64, upload to S3
    const buffer = Buffer.from(imgData, "base64");
    const { url } = await storagePut(`generated/${Date.now()}.webp`, buffer, "image/webp");
    return { url };
  }

  throw new Error("Stable Horde generation timed out after 3 minutes");
}

// ── Forge API (legacy fallback) ───────────────────────────────────────────────
async function generateImageViaForge(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const baseUrl = ENV.forgeApiUrl!.endsWith("/") ? ENV.forgeApiUrl! : `${ENV.forgeApiUrl}/`;
  const fullUrl = new URL("images.v1.ImageService/GenerateImage", baseUrl).toString();

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "connect-protocol-version": "1",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({ prompt: options.prompt, original_images: options.originalImages || [] }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Forge image generation failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
    );
  }

  const result = (await response.json()) as { image: { b64Json: string; mimeType: string } };
  const buffer = Buffer.from(result.image.b64Json, "base64");
  const { url } = await storagePut(`generated/${Date.now()}.png`, buffer, result.image.mimeType);
  return { url };
}

// ── Main export: auto-select provider ────────────────────────────────────────
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  // Try Together AI first (if key is set)
  if (ENV.togetherApiKey) {
    try {
      return await generateImageViaTogetherAI(options);
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.includes("credit") || msg.includes("Credit") || msg.includes("billing")) {
        console.warn("[ImageGen] Together AI credit limit, falling back to Stable Horde");
      } else {
        throw err;
      }
    }
  }

  // Stable Horde: completely free, no API key required
  try {
    return await generateImageViaStableHorde(options);
  } catch (err: any) {
    console.warn("[ImageGen] Stable Horde failed:", err?.message);
  }

  // Legacy Forge fallback
  if (ENV.forgeApiUrl && ENV.forgeApiKey) {
    return generateImageViaForge(options);
  }

  throw new Error(
    "图像生成暂时不可用，请稍后重试。如需提升稳定性，请联系管理员配置 TOGETHER_API_KEY。"
  );
}
