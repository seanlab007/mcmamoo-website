/**
 * MaoTaskProtocol Node.js 封装
 * =============================
 *
 * 提供 Node.js 层调用 Python MaoTaskProtocol 的接口。
 * 通过子进程执行 mao_task_protocol.py，捕获 SSE 事件并转发给前端。
 *
 * Q1 实现：后端 routers.ts 接入 TriadLoop SSE 推送 triadFollowUp 事件
 */

import { spawn, ChildProcess } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Python 脚本路径
const MAO_TASK_PROTOCOL_SCRIPT = path.resolve(
  process.env.HOME || "",
  ".workbuddy/maoai-core/mao_task_protocol_cli.py"
);

// 事件类型定义
export interface ExecutionPlanEvent {
  type: "executionPlan";
  task: string;
  task_type: string;
  plan: string;
  requires_approval: boolean;
}

export interface TriadFollowUpEvent {
  type: "triadFollowUp";
  task_summary: string;
  completion_score: number;
  questions: Array<{
    level: "immediate" | "risk" | "strategic";
    question: string;
    suggested_action: string;
  }>;
}

export interface RoundFollowUpEvent {
  type: "roundFollowUp";
  round: number;
  score: number;
  questions: Array<{
    level: string;
    question: string;
    suggested_action: string;
  }>;
}

export interface ProtocolProgressEvent {
  type: "progress";
  phase: "init" | "running" | "completed" | "failed";
  message: string;
  anchor_id?: string;
  round_count?: number;
  completion_score?: number;
}

export type ProtocolEvent =
  | ExecutionPlanEvent
  | TriadFollowUpEvent
  | RoundFollowUpEvent
  | ProtocolProgressEvent;

// 配置选项
export interface MaoTaskProtocolOptions {
  task: string;
  task_type?: string;
  enable_cognitive_bus?: boolean;
  enable_strategic_review?: boolean;
  enable_follow_up?: boolean;
  enable_follow_up_ai?: boolean;
  enable_execution_plan?: boolean;
  require_approval?: boolean;
  anthropic_api_key?: string;
  coder_api_key?: string;
  reviewer_api_key?: string;
  coder_model?: string;
  reviewer_model?: string;
  max_iterations?: number;
}

/**
 * 自动检测任务类型
 *
 * 根据任务文本的关键词判断最匹配的 TaskType，
 * 对应 Python 侧 triad_loop.py 的 TaskType 枚举：
 *   engineering / strategic / debugging / refactoring / analysis / unknown
 *
 * 优先级：debugging > refactoring > analysis > strategic > engineering > unknown
 */
export function detectTaskType(text: string): string {
  const t = text.toLowerCase();

  // 1. debugging: 修复/报错/bug
  const debuggingKw = [
    "bug", "fix", "修复", "报错", "error", "exception", "crash", "排查",
    "不工作", "不生效", "失败", "failed", "broken", "故障", "调试", "debug",
  ];
  if (debuggingKw.some((kw) => t.includes(kw))) return "debugging";

  // 2. refactoring: 重构/优化/整理
  const refactoringKw = [
    "重构", "refactor", "优化", "optimize", "整理", "清理", "cleanup",
    "重写", "rewrite", "迁移", "migrate", "抽象", "abstract",
  ];
  if (refactoringKw.some((kw) => t.includes(kw))) return "refactoring";

  // 3. analysis: 分析/评估/对比
  const analysisKw = [
    "分析", "analyze", "analyse", "评估", "evaluate", "对比", "compare",
    "调研", "research", "报告", "report", "统计", "数据", "总结", "review",
  ];
  if (analysisKw.some((kw) => t.includes(kw))) return "analysis";

  // 4. strategic: 战略/规划/方案/设计
  const strategicKw = [
    "战略", "策略", "strategy", "规划", "plan", "方案", "设计架构",
    "路线图", "roadmap", "决策", "decision", "目标", "okr", "产品",
  ];
  if (strategicKw.some((kw) => t.includes(kw))) return "strategic";

  // 5. engineering: 实现/开发/功能/接口/代码
  const engineeringKw = [
    "实现", "开发", "implement", "develop", "build", "create", "写",
    "代码", "code", "功能", "feature", "接口", "api", "组件", "component",
    "模块", "module", "系统", "system", "部署", "deploy",
  ];
  if (engineeringKw.some((kw) => t.includes(kw))) return "engineering";

  return "unknown";
}

/**
 * 运行 MaoTaskProtocol 并返回事件流
 *
 * 使用方式：
 * ```typescript
 * const protocol = runMaoTaskProtocol({
 *   task: "实现用户登录功能",
 *   task_type: "engineering",           // 可省略，会自动检测
 * });
 *
 * for await (const event of protocol) {
 *   if (event.type === "executionPlan") {
 *     // 显示执行计划，等待用户批准
 *   } else if (event.type === "triadFollowUp") {
 *     // 将追问推送到前端
 *     emit({ triadFollowUp: event });
 *   }
 * }
 * ```
 */
export async function* runMaoTaskProtocol(
  options: MaoTaskProtocolOptions
): AsyncGenerator<ProtocolEvent, void, unknown> {
  const args: string[] = [
    MAO_TASK_PROTOCOL_SCRIPT,
    "--task",
    options.task,
    "--task-type",
    options.task_type || "unknown",
  ];

  if (options.enable_cognitive_bus !== false) args.push("--enable-cognitive-bus");
  if (options.enable_strategic_review !== false) args.push("--enable-strategic-review");
  if (options.enable_follow_up !== false) args.push("--enable-follow-up");
  if (options.enable_follow_up_ai) args.push("--enable-follow-up-ai");
  if (options.enable_execution_plan !== false) args.push("--enable-execution-plan");
  if (options.require_approval) args.push("--require-approval");
  if (options.anthropic_api_key) {
    args.push("--anthropic-api-key", options.anthropic_api_key);
  }
  if (options.coder_api_key) args.push("--coder-api-key", options.coder_api_key);
  if (options.reviewer_api_key) args.push("--reviewer-api-key", options.reviewer_api_key);
  if (options.coder_model) args.push("--coder-model", options.coder_model);
  if (options.reviewer_model) args.push("--reviewer-model", options.reviewer_model);
  if (options.max_iterations) args.push("--max-iterations", String(options.max_iterations));

  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  const child = spawn(pythonCmd, args, {
    cwd: path.dirname(MAO_TASK_PROTOCOL_SCRIPT),
    env: {
      ...process.env,
      PYTHONPATH: path.dirname(MAO_TASK_PROTOCOL_SCRIPT),
    },
  });

  let buffer = "";

  try {
    for await (const chunk of child.stdout) {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // 保留未完成的行

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // 尝试解析 JSON 事件
        try {
          const event = JSON.parse(trimmed);
          if (event.executionPlan) {
            yield {
              type: "executionPlan",
              ...event.executionPlan,
            } as ExecutionPlanEvent;
          } else if (event.triadFollowUp) {
            yield {
              type: "triadFollowUp",
              ...event.triadFollowUp,
            } as TriadFollowUpEvent;
          } else if (event.roundFollowUp) {
            yield {
              type: "roundFollowUp",
              ...event.roundFollowUp,
            } as RoundFollowUpEvent;
          } else if (event.progress) {
            yield {
              type: "progress",
              ...event.progress,
            } as ProtocolProgressEvent;
          }
        } catch {
          // 非 JSON 行，作为进度消息
          if (trimmed.startsWith("[MaoTaskProtocol]") ||
              trimmed.startsWith("  [")) {
            yield {
              type: "progress",
              phase: "running",
              message: trimmed,
            } as ProtocolProgressEvent;
          }
        }
      }
    }

    // 处理剩余缓冲区
    if (buffer.trim()) {
      try {
        const event = JSON.parse(buffer.trim());
        if (event.triadFollowUp) {
          yield {
            type: "triadFollowUp",
            ...event.triadFollowUp,
          } as TriadFollowUpEvent;
        }
      } catch {
        // 忽略解析错误
      }
    }

    // 检查子进程退出码
    const exitCode = await new Promise<number | null>((resolve) => {
      child.on("close", resolve);
    });

    if (exitCode !== 0) {
      yield {
        type: "progress",
        phase: "failed",
        message: `Protocol exited with code ${exitCode}`,
      } as ProtocolProgressEvent;
    }
  } finally {
    // 确保子进程被终止
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }
}

/**
 * 便捷的 SSE 适配器
 *
 * 将 ProtocolEvent 转换为前端可消费的 SSE 格式
 */
export function adaptProtocolEventToSSE(
  event: ProtocolEvent
): Record<string, unknown> | null {
  switch (event.type) {
    case "executionPlan":
      return {
        executionPlan: {
          task: event.task,
          task_type: event.task_type,
          plan: event.plan,
          requires_approval: event.requires_approval,
        },
      };
    case "triadFollowUp":
      return {
        triadFollowUp: {
          task_summary: event.task_summary,
          completion_score: event.completion_score,
          questions: event.questions,
        },
      };
    case "roundFollowUp":
      return {
        roundFollowUp: {
          round: event.round,
          score: event.score,
          questions: event.questions,
        },
      };
    case "progress":
      return {
        progress: {
          phase: event.phase,
          message: event.message,
          anchor_id: event.anchor_id,
          round_count: event.round_count,
          completion_score: event.completion_score,
        },
      };
    default:
      return null;
  }
}
