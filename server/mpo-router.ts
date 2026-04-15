/**
 * mpo-router.ts
 * MPO (Multi-Party Orchestration) tRPC 路由层
 *
 * 将 Python MPO 核心系统通过 tRPC 暴露给前端：
 *  - execute: 执行 MPO 并行任务
 *  - status:  查询执行状态
 *  - history: 查询历史记录（Drizzle ORM）
 *  - stats:   聚合统计数据
 *  - ledger:  DecisionLedger 记录查询
 *  - cancel:  取消进行中的任务
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { spawn } from "child_process";
import { join } from "path";
import { db } from "./db";
import { mpoExecutions, mpoDecisionLedger } from "../drizzle/schema";
import { desc, eq, gte, and } from "drizzle-orm";

// ─── Python 脚本路径 ──────────────────────────────────────────────────────────
const MPO_ADAPTER_SCRIPT = join(__dirname, "hyperagents/core/maoai_mpo_adapter.py");
const HYPERAGENTS_DIR = join(__dirname, "hyperagents");

// ─── 内存中的执行状态 Map（进程级缓存，跨请求共享）────────────────────────────
const activeExecutions = new Map<string, {
  pid?: number;
  task: string;
  startedAt: Date;
  status: "running" | "completed" | "failed" | "cancelled";
  result?: any;
  error?: string;
}>();

// ─── 工具函数：调用 Python MPO ──────────────────────────────────────────────
function callMPOAdapter(command: object): Promise<{ success: boolean; data?: any; error?: string }> {
  return new Promise((resolve) => {
    const proc = spawn("python3", [MPO_ADAPTER_SCRIPT, "--json-mode"], {
      cwd: HYPERAGENTS_DIR,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 600_000, // 10分钟
      env: { ...process.env, PYTHONPATH: HYPERAGENTS_DIR },
    });

    // 通过 stdin 传递命令
    proc.stdin?.write(JSON.stringify(command) + "\n");
    proc.stdin?.end();

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (chunk) => { stdout += chunk.toString(); });
    proc.stderr?.on("data", (chunk) => { stderr += chunk.toString(); });

    proc.on("close", (code) => {
      // 提取最后一个完整 JSON 结果
      const jsonLines = stdout.split("\n").filter(l => {
        try { JSON.parse(l); return true; } catch { return false; }
      });

      if (jsonLines.length > 0) {
        try {
          const result = JSON.parse(jsonLines[jsonLines.length - 1]);
          resolve({ success: result.success !== false, data: result });
          return;
        } catch { /* fall through */ }
      }

      // 从 stdout 提取任意 JSON 对象
      const match = stdout.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const result = JSON.parse(match[0]);
          resolve({ success: code === 0, data: result });
          return;
        } catch { /* fall through */ }
      }

      resolve({
        success: false,
        error: stderr || `MPO adapter exited with code ${code}`,
      });
    });

    proc.on("error", (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

// ─── MPO Router ───────────────────────────────────────────────────────────────
export const mpoRouter = router({
  /**
   * 执行 MPO 并行任务
   * 支持：simple_task / parallel_task / triad_loop
   */
  execute: protectedProcedure
    .input(z.object({
      task: z.string().min(1).max(10_000).describe("任务描述"),
      mode: z.enum(["auto", "serial", "parallel", "triad"]).default("auto"),
      maxWorkers: z.number().int().min(1).max(20).default(5),
      language: z.string().default("python"),
      context: z.record(z.any()).optional().default({}),
      enableParallel: z.boolean().default(true),
      scoreThreshold: z.number().min(0).max(1).default(0.8),
    }))
    .mutation(async ({ input, ctx }) => {
      const executionId = `mpo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // 注册到活跃 Map
      activeExecutions.set(executionId, {
        task: input.task.slice(0, 200),
        startedAt: new Date(),
        status: "running",
      });

      // 写入数据库（fire-and-forget）
      db.insert(mpoExecutions).values({
        executionId,
        userId: ctx.user.id,
        task: input.task,
        mode: input.mode,
        status: "running",
        context: input.context,
        startedAt: new Date(),
      }).catch((e) => console.error("[MPO] DB insert failed:", e));

      // 异步执行
      setImmediate(async () => {
        try {
          const result = await callMPOAdapter({
            command: "execute",
            execution_id: executionId,
            task: input.task,
            mode: input.mode,
            max_workers: input.maxWorkers,
            language: input.language,
            context: input.context,
            enable_parallel: input.enableParallel,
            score_threshold: input.scoreThreshold,
          });

          const state = activeExecutions.get(executionId);
          if (state && state.status === "running") {
            activeExecutions.set(executionId, {
              ...state,
              status: result.success ? "completed" : "failed",
              result: result.data,
              error: result.error,
            });
          }

          // 更新数据库
          await db.update(mpoExecutions)
            .set({
              status: result.success ? "completed" : "failed",
              result: result.data,
              errorMessage: result.error,
              completedAt: new Date(),
              durationMs: Date.now() - (activeExecutions.get(executionId)?.startedAt?.getTime() ?? Date.now()),
            })
            .where(eq(mpoExecutions.executionId, executionId));

        } catch (err: any) {
          console.error("[MPO] Execution error:", err);
          activeExecutions.set(executionId, {
            ...(activeExecutions.get(executionId) as any),
            status: "failed",
            error: err.message,
          });
        }
      });

      return { executionId, status: "running", startedAt: new Date().toISOString() };
    }),

  /**
   * 查询执行状态（轮询或单次）
   */
  status: publicProcedure
    .input(z.object({ executionId: z.string() }))
    .query(({ input }) => {
      const state = activeExecutions.get(input.executionId);
      if (!state) {
        return { found: false, status: "unknown" as const };
      }
      return {
        found: true,
        executionId: input.executionId,
        status: state.status,
        task: state.task,
        startedAt: state.startedAt.toISOString(),
        result: state.result,
        error: state.error,
        durationMs: Date.now() - state.startedAt.getTime(),
      };
    }),

  /**
   * 取消进行中的任务
   */
  cancel: protectedProcedure
    .input(z.object({ executionId: z.string() }))
    .mutation(({ input }) => {
      const state = activeExecutions.get(input.executionId);
      if (!state || state.status !== "running") {
        return { success: false, message: "任务不存在或已结束" };
      }
      activeExecutions.set(input.executionId, { ...state, status: "cancelled" });
      return { success: true, message: "已发送取消信号" };
    }),

  /**
   * 查询历史执行记录
   */
  history: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(100).default(20),
      offset: z.number().int().min(0).default(0),
      status: z.enum(["running", "completed", "failed", "cancelled", "all"]).default("all"),
    }))
    .query(async ({ input, ctx }) => {
      const conditions = [eq(mpoExecutions.userId, ctx.user.id)];
      if (input.status !== "all") {
        conditions.push(eq(mpoExecutions.status, input.status));
      }

      const rows = await db.select()
        .from(mpoExecutions)
        .where(and(...conditions))
        .orderBy(desc(mpoExecutions.startedAt))
        .limit(input.limit)
        .offset(input.offset);

      return { records: rows, total: rows.length };
    }),

  /**
   * 聚合统计（汇总所有用户数据，仅管理员）
   */
  stats: protectedProcedure
    .query(async () => {
      // 从活跃 Map 统计
      let running = 0, completed = 0, failed = 0, cancelled = 0;
      let totalDuration = 0, durationCount = 0;

      for (const [, state] of activeExecutions) {
        switch (state.status) {
          case "running": running++; break;
          case "completed": completed++; break;
          case "failed": failed++; break;
          case "cancelled": cancelled++; break;
        }
        const dur = Date.now() - state.startedAt.getTime();
        totalDuration += dur;
        durationCount++;
      }

      const total = running + completed + failed + cancelled;
      return {
        total_tasks: total,
        running_tasks: running,
        completed_tasks: completed,
        failed_tasks: failed,
        cancelled_tasks: cancelled,
        success_rate: total > 0 ? (completed / total) * 100 : 0,
        average_duration_ms: durationCount > 0 ? Math.floor(totalDuration / durationCount) : 0,
      };
    }),

  /**
   * 读取 DecisionLedger 记录
   */
  ledger: protectedProcedure
    .input(z.object({
      executionId: z.string().optional(),
      limit: z.number().int().min(1).max(200).default(50),
      since: z.string().datetime().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const conditions = [eq(mpoDecisionLedger.userId, ctx.user.id)];
      if (input.executionId) {
        conditions.push(eq(mpoDecisionLedger.executionId, input.executionId));
      }
      if (input.since) {
        conditions.push(gte(mpoDecisionLedger.timestamp, new Date(input.since)));
      }

      const rows = await db.select()
        .from(mpoDecisionLedger)
        .where(and(...conditions))
        .orderBy(desc(mpoDecisionLedger.timestamp))
        .limit(input.limit);

      return { entries: rows };
    }),

  /**
   * 健康检查：验证 Python MPO 环境是否可用
   */
  healthCheck: publicProcedure.query(async () => {
    const result = await callMPOAdapter({ command: "health_check" });
    return {
      available: result.success,
      message: result.data?.message || result.error,
      timestamp: new Date().toISOString(),
    };
  }),
});

export type MPORouter = typeof mpoRouter;
