/**
 * MaoAI Industrial Architecture - 工业级流处理引擎
 */

import { Response } from "express";
import { modelRouter, semanticCache, StreamingOptimizer, dataFlywheel, TokenTimer } from "./index";
import type { RoutingResult } from "./index";

// ─── 会话上下文 ──────────────────────────────────────────────────────────────

interface StreamContext {
  sessionId: string;
  userId?: string;
  messageId: string;
  startTime: number;
  tokenTimer: TokenTimer;
  model: string;
  cacheHit: boolean;
}

// ─── 工业级流处理 ─────────────────────────────────────────────────────────────

export class IndustrialStreamProcessor {
  async preProcess(
    userInput: string,
    sessionId: string,
    userId?: string,
    preferModel?: string
  ): Promise<{
    cacheHit: boolean;
    cachedResponse?: string;
    routing: RoutingResult;
    context: StreamContext;
  }> {
    const context: StreamContext = {
      sessionId,
      userId,
      messageId: `msg_${Date.now()}`,
      startTime: Date.now(),
      tokenTimer: new TokenTimer(),
      model: preferModel || "deepseek-chat",
      cacheHit: false,
    };

    const cacheResult = semanticCache.get(userInput);
    if (cacheResult.hit) {
      console.log(`[IndustrialStream] Cache HIT for session ${sessionId}`);
      return {
        cacheHit: true,
        cachedResponse: cacheResult.response,
        routing: { modelKey: context.model, modelTier: "cheap", reason: "cache_hit", confidence: 1.0, estimatedCost: 0 },
        context: { ...context, cacheHit: true },
      };
    }

    const routing = modelRouter.route(userInput, preferModel);
    console.log(`[IndustrialStream] Routed "${userInput.slice(0, 50)}..." -> ${routing.modelKey}`);

    return {
      cacheHit: false,
      routing,
      context: { ...context, model: routing.modelKey },
    };
  }

  sendCachedResponse(res: Response, cachedResponse: string, context: StreamContext): void {
    StreamingOptimizer.sendChunk(res, cachedResponse);
    StreamingOptimizer.sendDone(res, {
      totalTokens: Math.ceil(cachedResponse.length / 4),
      latencyMs: Date.now() - context.startTime,
      model: "CACHE",
    });
  }

  getStats() {
    return { cache: semanticCache.getStats() };
  }
}

export const industrialProcessor = new IndustrialStreamProcessor();

export async function quickRoute(userInput: string, sessionId: string, preferModel?: string): Promise<RoutingResult> {
  const result = await industrialProcessor.preProcess(userInput, sessionId, undefined, preferModel);
  return result.routing;
}

export function checkCache(userInput: string): { hit: boolean; response?: string } {
  return semanticCache.get(userInput);
}

export function recordFeedback(sessionId: string, messageId: string, type: "thumbs_up" | "thumbs_down" | "follow_up", userId?: string) {
  dataFlywheel.recordFeedback({ sessionId, messageId, userId, type });
}
