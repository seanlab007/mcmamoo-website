/**
 * MaoAI Token Optimization Suite v2
 *
 * 整合 5 个开源项目的 token 节省技术：
 *   - TokenSaver: 提示词预处理器（去除冗余空白/重复实体/啰嗦措辞）
 *   - Claw-Compactor: 8 阶段输出压缩（ANSI→重复行→路径→时间戳→堆栈→JSON→表格→截断）
 *   - RTK: CLI 输出代理压缩（过滤/压缩命令输出，减少 60-90% token）
 *   - MiniMind: 超小型本地 LLM（26M参数，$3训练，Ollama 部署）
 *   - awesome-llm-token-optimization: 策略参考库
 *
 * v2 改进：
 *   - System prompt 关键指令提取与啰嗦措辞压缩
 *   - 对话历史去重（重复提问检测）
 *   - JSON/表格结构化输出压缩
 *   - 路径简化跳过代码块
 *   - RAG 上下文压缩
 *   - 对话历史旧消息截断
 *   - Ollama 精确 token 计数接口
 *   - LRU 内存安全（最多 500 会话）
 *   - Admin API 统计接口
 *   - 前端实时 token 节省指示器
 *
 * 在 aiStream.ts 的 chat/stream 流程中，token 优化按以下顺序执行：
 *   1. RAG 压缩 — 压缩检索到的文档片段
 *   2. InputPreprocessor — 压缩用户输入和 system prompt
 *   3. LLM 调用 — 使用压缩后的 messages
 *   4. OutputCompactor — 压缩工具输出（run_shell/run_code）
 *   5. TokenCounter — 统计节省量，通过 SSE 推送前端
 */

export { InputPreprocessor } from "./inputPreprocessor";
export type { PreprocessOptions, PreprocessResult } from "./inputPreprocessor";

export { OutputCompactor } from "./outputCompactor";
export type { CompactOptions, CompactResult } from "./outputCompactor";

export { CliProxyCompressor } from "./cliProxyCompressor";

export { TokenCounter, tokenCounter } from "./tokenCounter";
export type { TokenCountResult, SessionTokenStats } from "./tokenCounter";

export { TokenOptimizationPipeline } from "./pipeline";
export type { PipelineOptions, TokenOptimizationResult, SessionSummary } from "./pipeline";
