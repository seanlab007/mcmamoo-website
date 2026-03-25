/**
 * Image generation helper
 *
 * Primary:  Together AI FLUX (requires TOGETHER_API_KEY)
 * Fallback: Internal Forge API (requires BUILT_IN_FORGE_API_URL + BUILT_IN_FORGE_API_KEY)
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

// Together AI FLUX
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

  if (options.originalImages && options.originalImages.length > 0) {
    const urls = options.originalImages
      .filter((img) => img.url)
      .map((img) => img.url as string);
    if (urls.length > 0) {
      body.reference_images = urls;
    }
  }

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

// Forge API (legacy fallback)
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

// Main export: auto-select provider
export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  if (ENV.togetherApiKey) {
    return generateImageViaTogetherAI(options);
  }
  if (ENV.forgeApiUrl && ENV.forgeApiKey) {
    return generateImageViaForge(options);
  }
  throw new Error(
    "No image generation provider configured. Please set TOGETHER_API_KEY (recommended) or BUILT_IN_FORGE_API_URL + BUILT_IN_FORGE_API_KEY."
  );
}
