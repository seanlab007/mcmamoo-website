/**
 * taskQueue.ts
 * MaoAI 任务分发队列管理器
 *
 * 功能：
 *  1. 优先级任务队列（FIFO + 优先级）
 *  2. 多节点并行调度（支持手机/云端/本地异构节点）
 *  3. 任务取消/重试机制
 *  4. WebSocket 实时状态推送
 *  5. 任务超时控制
 */

import { dbFetch } from "./aiNodes";
import { wsServer } from "./wsServer";

// ─── 类型定义 ──────────────────────────────────────────────────────────────────

export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type TaskStatus = "pending" | "queued" | "running" | "completed" | "failed" | "cancelled" | "retrying";

export interface QueuedTask {
  id: string;
  skillId: string;
  nodeId?: number;
  userId: string;
  params: Record<string, unknown>;
  priority: TaskPriority;
  status: TaskStatus;
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  abortController?: AbortController;
}

export interface TaskResult {
  taskId: number;
  status: TaskStatus;
  result?: Record<string, unknown>;
  error?: string;
  duration?: number;
}

// ─── 常量配置 ──────────────────────────────────────────────────────────────────

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

const MAX_RETRIES = 3;
const TASK_TIMEOUT_MS = 120_000; // 2 分钟

// ─── 任务队列管理器 ─────────────────────────────────────────────────────────────

class TaskQueue {
  private queue: QueuedTask[] = [];
  private runningTasks: Map<string, QueuedTask> = new Map(); // taskId -> task
  private maxConcurrent: number = 5; // 最大并发数
  private processing: boolean = false;
  private nodeAvailability: Map<number, boolean> = new Map(); // nodeId -> available

  constructor() {
    console.log("[TaskQueue] Initialized");
  }

  /**
   * 添加任务到队列
   */
  async enqueue(
    skillId: string,
    userId: string,
    params: Record<string, unknown> = {},
    options: {
      priority?: TaskPriority;
      nodeId?: number;
      maxRetries?: number;
    } = {}
  ): Promise<string> {
    const {
      priority = "normal",
      nodeId,
      maxRetries: customMaxRetries = MAX_RETRIES,
    } = options;

    // 生成任务 ID
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const task: QueuedTask = {
      id: taskId,
      skillId,
      nodeId,
      userId,
      params,
      priority,
      status: "queued",
      retryCount: 0,
      maxRetries: customMaxRetries,
      createdAt: new Date(),
      abortController: new AbortController(),
    };

    // 插入到队列（按优先级排序）
    this.insertByPriority(task);

    console.log(`[TaskQueue] Enqueued: ${taskId} (skill=${skillId}, priority=${priority})`);

    // 广播队列状态
    wsServer.broadcastTaskUpdate(taskId, {
      task_id: taskId,
      status: "queued",
      progress: 0,
      message: "任务已加入队列",
    });

    // 触发处理
    this.processQueue();

    return taskId;
  }

  /**
   * 按优先级插入队列
   */
  private insertByPriority(task: QueuedTask): void {
    const weight = PRIORITY_WEIGHT[task.priority];
    let insertIndex = this.queue.length;

    for (let i = 0; i < this.queue.length; i++) {
      if (PRIORITY_WEIGHT[this.queue[i].priority] < weight) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, task);
  }

  /**
   * 处理队列
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.queue.length > 0 && this.runningTasks.size < this.maxConcurrent) {
        const task = this.queue.shift();
        if (!task) break;

        // 检查是否已被取消
        if (task.status === "cancelled") {
          continue;
        }

        await this.executeTask(task);
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * 执行单个任务
   */
  private async executeTask(task: QueuedTask): Promise<void> {
    const startTime = Date.now();
    task.status = "running";
    task.startedAt = new Date();

    console.log(`[TaskQueue] Executing: ${task.id} (skill=${task.skillId})`);

    // 广播运行状态
    this.broadcastProgressUpdate(task.userId, task.id, {
      status: "running",
      progress: 0,
      step_name: "任务启动",
    });

    this.runningTasks.set(task.id, task);

    try {
      // 获取节点信息
      let nodeBaseUrl: string;
      let nodeToken: string;

      if (task.nodeId) {
        const nodeRes = await dbFetch(`/ai_nodes?id=eq.${task.nodeId}&select=baseUrl,token&limit=1`);
        const node = (nodeRes.data as any[])?.[0];
        if (!node) throw new Error(`Node ${task.nodeId} not found`);
        nodeBaseUrl = node.baseUrl;
        nodeToken = node.token;
      } else {
        // 默认使用第一个可用节点
        const availableNode = await this.findAvailableNode();
        if (!availableNode) throw new Error("No available node found");
        nodeBaseUrl = availableNode.baseUrl;
        nodeToken = availableNode.token;
        task.nodeId = availableNode.id;
      }

      // 广播进度 30%
      this.broadcastProgressUpdate(task.userId, task.id, {
        status: "running",
        progress: 30,
        step_name: "调用 AI 节点",
      });

      // 调用节点执行
      const response = await fetch(`${nodeBaseUrl}/skill/invoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${nodeToken}`,
        },
        body: JSON.stringify({
          skillId: task.skillId,
          params: task.params,
          requestId: task.id,
        }),
        signal: AbortSignal.timeout(TASK_TIMEOUT_MS),
      });

      // 广播进度 60%
      this.broadcastProgressUpdate(task.userId, task.id, {
        status: "running",
        progress: 60,
        step_name: "处理中",
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Node returned ${response.status}: ${errText}`);
      }

      const result = await response.json();

      // 任务完成
      task.status = "completed";
      task.completedAt = new Date();

      console.log(`[TaskQueue] Completed: ${task.id} (${Date.now() - startTime}ms)`);

      // 广播完成状态
      this.broadcastTaskUpdate(task.userId, task.id, {
        status: "completed",
        progress: 100,
        message: "任务完成",
      });

      // 回写到数据库
      await this.updateDbTask(task.id.replace("task-", ""), "success", result);
    } catch (err: any) {
      const errorMessage = err?.message ?? String(err);

      // 检查是否被取消
      if (task.abortController?.signal.aborted) {
        task.status = "cancelled";
        console.log(`[TaskQueue] Cancelled: ${task.id}`);
        return;
      }

      console.error(`[TaskQueue] Failed: ${task.id}`, errorMessage);

      // 重试逻辑
      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        task.status = "retrying";
        task.error = errorMessage;

        console.log(`[TaskQueue] Retrying ${task.id} (${task.retryCount}/${task.maxRetries})`);

        // 延迟重试
        setTimeout(() => {
          task.status = "queued";
          this.insertByPriority(task);
          this.processQueue();
        }, 2000 * task.retryCount); // 指数退避

        this.broadcastProgressUpdate(task.userId, task.id, {
          status: "running",
          progress: 50,
          step_name: `重试中 (${task.retryCount}/${task.maxRetries})`,
        });
      } else {
        task.status = "failed";
        task.error = errorMessage;
        task.completedAt = new Date();

        // 广播失败状态
        this.broadcastTaskUpdate(task.userId, task.id, {
          status: "failed",
          progress: 0,
          error: errorMessage,
        });

        // 回写到数据库
        await this.updateDbTask(task.id.replace("task-", ""), "failed", undefined, errorMessage);
      }
    } finally {
      this.runningTasks.delete(task.id);
      this.processQueue(); // 继续处理队列
    }
  }

  /**
   * 查找可用节点
   */
  private async findAvailableNode(): Promise<{ id: number; baseUrl: string; token: string } | null> {
    // 从数据库获取所有可用节点
    const res = await dbFetch(`/ai_nodes?isActive=eq.true&select=id,baseUrl,token`);
    const nodes = (res.data as any[]) ?? [];

    for (const node of nodes) {
      if (this.nodeAvailability.get(node.id) !== false) {
        return node;
      }
    }

    // 如果没有可用节点，返回第一个（降级处理）
    return nodes[0] ?? null;
  }

  /**
   * 取消任务
   */
  cancel(taskId: string): boolean {
    const runningTask = this.runningTasks.get(taskId);
    if (runningTask) {
      runningTask.abortController?.abort();
      runningTask.status = "cancelled";
      this.runningTasks.delete(taskId);
      console.log(`[TaskQueue] Cancelled running task: ${taskId}`);
      return true;
    }

    // 从队列中移除
    const queueIndex = this.queue.findIndex((t) => t.id === taskId);
    if (queueIndex !== -1) {
      const task = this.queue.splice(queueIndex, 1)[0];
      task.status = "cancelled";
      console.log(`[TaskQueue] Cancelled queued task: ${taskId}`);
      this.broadcastTaskUpdate(task.userId, taskId, {
        status: "cancelled",
        progress: 0,
        message: "任务已取消",
      });
      return true;
    }

    return false;
  }

  /**
   * 重试任务
   */
  retry(taskId: string): boolean {
    const queueIndex = this.queue.findIndex((t) => t.id === taskId);
    if (queueIndex !== -1) {
      const task = this.queue[queueIndex];
      if (task.status === "failed") {
        task.retryCount = 0;
        task.status = "queued";
        task.error = undefined;
        console.log(`[TaskQueue] Retrying: ${taskId}`);
        this.broadcastProgressUpdate(task.userId, taskId, {
          status: "running",
          progress: 0,
          step_name: "重新加入队列",
        });
        this.processQueue();
        return true;
      }
    }
    return false;
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): { status: TaskStatus; progress?: number; error?: string } | null {
    const runningTask = this.runningTasks.get(taskId);
    if (runningTask) {
      return {
        status: runningTask.status,
        error: runningTask.error,
      };
    }

    const queuedTask = this.queue.find((t) => t.id === taskId);
    if (queuedTask) {
      return {
        status: queuedTask.status,
        error: queuedTask.error,
      };
    }

    return null;
  }

  /**
   * 获取队列统计
   */
  getStats(): {
    queueLength: number;
    runningCount: number;
    maxConcurrent: number;
  } {
    return {
      queueLength: this.queue.length,
      runningCount: this.runningTasks.size,
      maxConcurrent: this.maxConcurrent,
    };
  }

  /**
   * 广播任务更新
   */
  private broadcastTaskUpdate(
    userId: string,
    taskId: string,
    payload: { status: string; progress?: number; message?: string; error?: string }
  ): void {
    wsServer.broadcastTaskUpdate(taskId, {
      task_id: taskId,
      ...payload,
    });
  }

  /**
   * 广播进度更新
   */
  private broadcastProgressUpdate(
    userId: string,
    taskId: string,
    payload: { status: "running" | "completed" | "failed"; progress: number; step_name: string; message?: string }
  ): void {
    wsServer.broadcastProgressUpdate(taskId, {
      task_id: taskId,
      project_id: taskId,
      ...payload,
    });
  }

  /**
   * 更新数据库任务状态
   */
  private async updateDbTask(
    dbTaskId: string,
    status: "success" | "failed",
    result?: Record<string, unknown>,
    error?: string
  ): Promise<void> {
    try {
      const numericId = parseInt(dbTaskId, 10);
      if (isNaN(numericId)) return;

      await dbFetch(`/content_tasks?id=eq.${numericId}`, {
        method: "PATCH",
        body: {
          status: status === "success" ? "success" : "failed",
          result: result ?? null,
          error_message: error ?? null,
          finished_at: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error("[TaskQueue] Failed to update DB task:", err);
    }
  }
}

// ─── 单例导出 ──────────────────────────────────────────────────────────────────

export const taskQueue = new TaskQueue();
export default taskQueue;
