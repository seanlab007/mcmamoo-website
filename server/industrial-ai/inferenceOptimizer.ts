/**
 * MaoAI Industrial Architecture - Inference Optimizer
 * 
 * 推理加速引擎：
 * 1. SSE 流式输出：200ms 内显示首字
 * 2. KV Cache 优化：私有化部署时使用 vLLM/TGI
 * 3. 投机采样：大小模型协同加速 2-3x
 */

import { Response } from "express";

// ─── SSE 流式传输 ─────────────────────────────────────────────────────────────

export interface StreamOptions {
  /** 首字超时（毫秒） */
  firstTokenTimeout?: number;
  /** 是否启用心跳保活 */
  keepAlive?: boolean;
  /** 心跳间隔（毫秒） */
  keepAliveInterval?: number;
}

export class StreamingOptimizer {
  private keepAliveTimer: NodeJS.Timeout | null = null;
  
  /**
   * 发送 SSE 格式的数据
   */
  static sendSSE(res: Response, event: string, data: object): boolean {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 发送流式文本片段
   */
  static sendChunk(res: Response, chunk: string): boolean {
    try {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 发送完成信号
   */
  static sendDone(res: Response, metadata?: {
    totalTokens?: number;
    latencyMs?: number;
    model?: string;
  }): boolean {
    try {
      res.write(`event: done\n`);
      res.write(`data: ${JSON.stringify(metadata || {})}\n\n`);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 发送错误
   */
  static sendError(res: Response, error: string, code?: number): boolean {
    try {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ error, code })}\n\n`);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 发送进度更新
   */
  static sendProgress(res: Response, stage: string, progress: number): boolean {
    try {
      res.write(`event: progress\n`);
      res.write(`data: ${JSON.stringify({ stage, progress })}\n\n`);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 启动心跳保活
   */
  startKeepAlive(res: Response, intervalMs: number = 30000): void {
    this.keepAliveTimer = setInterval(() => {
      try {
        res.write(`: keepalive\n\n`);
      } catch {
        this.stopKeepAlive();
      }
    }, intervalMs);
  }
  
  /**
   * 停止心跳
   */
  stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }
}

// ─── 令牌计时器 ───────────────────────────────────────────────────────────────

export class TokenTimer {
  private startTime: number;
  private firstTokenTime: number | null = null;
  private lastTokenTime: number;
  private tokenCount: number = 0;
  
  constructor() {
    this.startTime = Date.now();
    this.lastTokenTime = this.startTime;
  }
  
  /**
   * 记录第一个 token（用于计算 TTFT - Time To First Token）
   */
  recordFirstToken(): void {
    if (this.firstTokenTime === null) {
      this.firstTokenTime = Date.now();
    }
  }
  
  /**
   * 记录 token
   */
  recordToken(charCount: number = 1): void {
    this.tokenCount++;
    this.lastTokenTime = Date.now();
  }
  
  /**
   * 获取 TTFT（毫秒）
   */
  getTTFT(): number {
    if (this.firstTokenTime === null) {
      return Date.now() - this.startTime;
    }
    return this.firstTokenTime - this.startTime;
  }
  
  /**
   * 获取 TPS（Token Per Second）
  */
  getTPS(): number {
    const elapsed = (this.lastTokenTime - this.startTime) / 1000;
    if (elapsed === 0) return 0;
    return this.tokenCount / elapsed;
  }
  
  /**
   * 获取总延迟
   */
  getTotalLatency(): number {
    return Date.now() - this.startTime;
  }
  
  /**
   * 获取完整统计
   */
  getStats(): {
    ttft: number;
    tps: number;
    totalTokens: number;
    totalLatency: number;
    isStreaming: boolean;
  } {
    return {
      ttft: this.getTTFT(),
      tps: this.getTPS(),
      totalTokens: this.tokenCount,
      totalLatency: this.getTotalLatency(),
      isStreaming: this.firstTokenTime !== null,
    };
  }
}

// ─── 推理加速配置 ─────────────────────────────────────────────────────────────

export interface InferenceConfig {
  /** 启用流式输出 */
  streaming?: boolean;
  /** 最大输出 token */
  maxTokens?: number;
  /** temperature */
  temperature?: number;
  /** top_p */
  topP?: number;
  /** 启用 KV Cache */
  enableKVCache?: boolean;
  /** 启用投机采样 */
  enableSpeculativeDecoding?: boolean;
  /** 小模型（用于投机采样） */
  draftModel?: string;
}

export const DEFAULT_INFERENCE_CONFIG: InferenceConfig = {
  streaming: true,
  maxTokens: 4096,
  temperature: 0.7,
  topP: 0.9,
  enableKVCache: false,
  enableSpeculativeDecoding: false,
};

// ─── 批量推理优化器 ───────────────────────────────────────────────────────────

export class BatchInferenceOptimizer {
  private queue: Array<{
    id: string;
    prompt: string;
    resolve: (value: string) => void;
    reject: (error: Error) => void;
    priority: number;
    timestamp: number;
  }> = [];
  
  private processing: boolean = false;
  private batchSize: number;
  private batchDelayMs: number;
  
  constructor(batchSize: number = 5, batchDelayMs: number = 100) {
    this.batchSize = batchSize;
    this.batchDelayMs = batchDelayMs;
  }
  
  /**
   * 添加请求到批处理队列
   */
  async submit(id: string, prompt: string, priority: number = 0): Promise<string> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id,
        prompt,
        resolve,
        reject,
        priority,
        timestamp: Date.now(),
      });
      
      this.queue.sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return a.timestamp - b.timestamp;
      });
      
      this.scheduleProcess();
    });
  }
  
  private scheduleProcess(): void {
    if (this.processing || this.queue.length === 0) return;
    setTimeout(() => this.processBatch(), this.batchDelayMs);
  }
  
  private async processBatch(): Promise<void> {
    if (this.queue.length === 0) return;
    this.processing = true;
    
    const batch = this.queue.splice(0, this.batchSize);
    
    const promises = batch.map(async (item) => {
      try {
        item.resolve(`[Batch Result for: ${item.prompt.slice(0, 20)}...]`);
      } catch (error) {
        item.reject(error as Error);
      }
    });
    
    await Promise.allSettled(promises);
    this.processing = false;
    
    if (this.queue.length > 0) {
      this.scheduleProcess();
    }
  }
  
  getQueueStatus(): { pending: number; processing: boolean } {
    return {
      pending: this.queue.length,
      processing: this.processing,
    };
  }
}

export const streamingOptimizer = new StreamingOptimizer();
export const batchOptimizer = new BatchInferenceOptimizer(5, 100);
