/**
 * MaoAI Token Optimization Suite
 *
 * 整合 5 个开源项目的 token 节省技术：
 *   - TokenSaver: 提示词预处理器（去除冗余空白/重复实体）
 *   - Claw-Compactor: 多阶段输出压缩（AST感知 → 语义压缩）
 *   - RTK: CLI 输出代理压缩（过滤/压缩命令输出）
 *   - MiniMind: 超小型本地 LLM（26M参数，$3训练）
 *   - awesome-llm-token-optimization: 策略参考库
 *
 * 在 aiStream.ts 的 chat/stream 流程中，token 优化按以下顺序执行：
 *   1. InputPreprocessor — 压缩用户输入和 system prompt
 *   2. LLM 调用 — 使用压缩后的 messages
 *   3. OutputCompactor — 压缩工具输出（run_shell/run_code）
 *   4. TokenCounter — 统计节省量，通过 SSE 推送前端
 */

export { InputPreprocessor } from "./inputPreprocessor";
export { OutputCompactor } from "./outputCompactor";
export { CliProxyCompressor } from "./cliProxyCompressor";
export { TokenCounter } from "./tokenCounter";
export { TokenOptimizationPipeline, type TokenOptimizationResult } from "./pipeline";
