/**
 * ============================================================
 * File: embedding.ts
 * Description: 文本嵌入服务 - 支持 Ollama 本地嵌入模型
 *              用于 RAG、语义搜索、文本相似度计算
 * Author: Work Buddy
 * Date: 2026-04-19
 * ============================================================
 */

import { MODEL_CONFIGS } from "./models";

export interface EmbeddingConfig {
  model: string;
  baseUrl: string;
  dimensions: number;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  dimensions: number;
}

// 默认嵌入模型配置
const DEFAULT_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text:latest";
const DEFAULT_EMBEDDING_DIMENSIONS = parseInt(process.env.OLLAMA_EMBEDDING_DIMENSIONS || "768");
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

/**
 * 生成文本嵌入向量
 * @param text 输入文本
 * @param model 模型名称 (默认 nomic-embed-text)
 * @returns 嵌入向量结果
 */
export async function generateEmbedding(
  text: string,
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<EmbeddingResult> {
  // 检查是否为 Ollama 嵌入模型
  if (model.includes("ollama") || !model.includes(":")) {
    return generateOllamaEmbedding(text, model.replace("ollama-", "").replace(/-/g, ":"));
  }

  // 云端嵌入模型支持 (未来扩展)
  throw new Error(`Unsupported embedding model: ${model}`);
}

/**
 * 使用 Ollama 生成本地嵌入
 */
async function generateOllamaEmbedding(
  text: string,
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<EmbeddingResult> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    embedding: data.embedding,
    model,
    dimensions: data.embedding.length,
  };
}

/**
 * 批量生成嵌入
 * @param texts 文本数组
 * @param model 模型名称
 * @returns 嵌入向量数组
 */
export async function generateEmbeddings(
  texts: string[],
  model: string = DEFAULT_EMBEDDING_MODEL
): Promise<EmbeddingResult[]> {
  return Promise.all(texts.map(text => generateEmbedding(text, model)));
}

/**
 * 计算两个向量的余弦相似度
 * @param a 向量 A
 * @param b 向量 B
 * @returns 相似度分数 (-1 到 1)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same dimensions");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 查找最相似的文本
 * @param query 查询文本
 * @param candidates 候选文本数组
 * @param topK 返回前 K 个结果
 * @returns 相似度排序后的结果
 */
export async function findSimilarTexts(
  query: string,
  candidates: string[],
  topK: number = 5
): Promise<{ text: string; similarity: number; index: number }[]> {
  // 生成查询向量
  const queryEmbedding = await generateEmbedding(query);
  
  // 生成候选向量
  const candidateEmbeddings = await generateEmbeddings(candidates);
  
  // 计算相似度
  const similarities = candidateEmbeddings.map((result, index) => ({
    text: candidates[index],
    similarity: cosineSimilarity(queryEmbedding.embedding, result.embedding),
    index,
  }));
  
  // 按相似度排序并返回前 K 个
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/**
 * 获取可用的嵌入模型列表
 */
export function getEmbeddingModels(): { id: string; name: string; dimensions: number }[] {
  return Object.entries(MODEL_CONFIGS)
    .filter(([_, config]) => config.isEmbedding)
    .map(([id, config]) => ({
      id,
      name: config.name,
      dimensions: config.maxTokens === 512 ? 768 : config.maxTokens,
    }));
}

/**
 * 健康检查 - 测试 Ollama 嵌入服务
 */
export async function checkEmbeddingHealth(): Promise<{
  ok: boolean;
  model: string;
  dimensions: number;
  error?: string;
}> {
  try {
    const result = await generateEmbedding("test", DEFAULT_EMBEDDING_MODEL);
    return {
      ok: true,
      model: result.model,
      dimensions: result.dimensions,
    };
  } catch (error) {
    return {
      ok: false,
      model: DEFAULT_EMBEDDING_MODEL,
      dimensions: DEFAULT_EMBEDDING_DIMENSIONS,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
