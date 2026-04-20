/**
 * MaoAI Industrial Architecture - 工业级 AI 架构模块
 * 
 * 整合三大核心支柱：
 * 1. ModelRouter - 模型路由（成本与效能平衡）
 * 2. SemanticCache - 语义缓存（极速响应）
 * 3. InferenceOptimizer - 推理加速（流式输出）
 * 4. DataFlywheel - 数据闭环（自我进化）
 */

export { ModelRouter, modelRouter, CostTracker } from "./modelRouter";
export type { ModelTier, RoutingResult } from "./modelRouter";

export { SemanticCache, semanticCache, RedisSemanticCache } from "./semanticCache";

export { 
  StreamingOptimizer, 
  TokenTimer, 
  BatchInferenceOptimizer,
  streamingOptimizer, 
  batchOptimizer 
} from "./inferenceOptimizer";
export type { InferenceConfig, StreamOptions } from "./inferenceOptimizer";

export { 
  DataFlywheel, 
  FeedbackCollector,
  NegativeSampleExtractor,
  LLMAuditor,
  PromptOptimizer,
  dataFlywheel 
} from "./dataFlywheel";
export type { 
  FeedbackType, 
  FeedbackRecord, 
  ConversationSample, 
  AuditResult,
  PromptVariant 
} from "./dataFlywheel";

export { 
  IndustrialStreamProcessor, 
  industrialProcessor,
  quickRoute,
  checkCache,
  recordFeedback 
} from "./industrialStream";
