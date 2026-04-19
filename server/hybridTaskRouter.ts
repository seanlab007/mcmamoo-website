/**
 * hybridTaskRouter.ts
 * MaoAI 混合云任务路由引擎（TypeScript 版本）
 *
 * 核心职责：
 *  1. 心跳检测 — 本地每 30s 上报状态到 Supabase（maoai_devices.last_seen_at）
 *  2. 任务分级 — 根据任务类型决定执行策略（CLOUD_PREFERRED / LOCAL_REQUIRED / CLOUD_FALLBACK）
 *  3. 动态路由 — 根据本地设备在线状态 + 任务分级，选择 LOCAL / CLOUD / QUEUE 三条路径
 *  4. 影子执行 — 本地离线时将 CLOUD_FALLBACK 任务暂存到 maoai_pending_commands 等待本地恢复
 *
 * 与现有模块的关系：
 *  - hybridCloudRouter.ts：HTTP API 层（REST 路由），本模块为其提供路由决策逻辑
 *  - cloud_tunnel.py：Python 层命令拉取执行器，本模块决定哪些命令写入队列
 *  - 0008_hybrid_cloud_queue.sql：PostgreSQL 命令队列 schema
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import os from "os";
import crypto from "crypto";

// ═══════════════════════════════════════════════════════════════════
// AI Headquarters 集成 — 自动上报到 n8n 总控系统
// ═══════════════════════════════════════════════════════════════════

/** HQ Proxy 地址（与 hq-local-proxy.js 对应） */
const HQ_URL = process.env.HQ_URL || "http://127.0.0.1:5680";

interface HQReport {
  protocolVersion: string;
  agentId: string;
  agentType: string;
  accountId: string;
  machineId: string;
  machineName: string;
  action: "register" | "heartbeat" | "task-update" | "task-complete" | "task-failed" | "error";
  payload: Record<string, unknown>;
  okrLink?: { businessId: string; objectiveIndex: number; krIndex: number };
}

/**
 * 向 AI Headquarters 发送上报（非阻塞，失败不影响主流程）
 * 协议兼容: POST /webhook/ai-hq-report
 */
async function reportToHQ(report: Partial<HQReport>): Promise<void> {
  try {
    const fullReport: HQReport = {
      protocolVersion: "1.0",
      agentId: "maoai-triad",
      agentType: "maoai",
      accountId: process.env.ACCOUNT_ID || "acc-mbp-main",
      machineId: process.env.MACHINE_ID || "mbp-pro",
      machineName: os.hostname(),
      ...report,
      payload: report.payload || {},
    };

    const res = await fetch(`${HQ_URL}/webhook/ai-hq-report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullReport),
      signal: AbortSignal.timeout(3000), // 3s 超时，不阻塞主流程
    });

    if (res.ok) {
      // 仅在开发环境打印详细日志
      if (process.env.NODE_ENV === "development") {
        const result = await res.json().catch(() => ({}));
        console.log(`[HQ] ${report.action} ✅ (${result.data?.message || "OK"})`);
      }
    } else {
      // HQ 离线时静默忽略
      if (process.env.NODE_ENV === "development") {
        console.warn(`[HQ] ${report.action} ⚠️ HTTP ${res.status} (HQ 可能离线)`);
      }
    }
  } catch (err) {
    // 网络错误静默处理 — HQ 不是关键路径
    if (process.env.NODE_ENV === "development") {
      console.warn(`[HQ] ${report.action} ⚠️ 连接失败: ${(err as Error).message}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// 常量配置
// ═══════════════════════════════════════════════════════════════════

/** 心跳上报间隔（毫秒） */
const HEARTBEAT_INTERVAL_MS = 30_000;

/** 本地设备在线超时（毫秒）—— 超过此时间未收到心跳视为离线 */
const DEVICE_ONLINE_TIMEOUT_MS = 90_000;

/** 命令默认过期时间（秒） */
const COMMAND_TTL_SECONDS = 3600;

// ═══════════════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════════════

/** 任务执行策略 */
export type TaskStrategy = "CLOUD_PREFERRED" | "LOCAL_REQUIRED" | "CLOUD_FALLBACK";

/** 路由决策结果 */
export type RouteDecision =
  | "EXECUTE_LOCAL"        // 立即本地执行
  | "EXECUTE_CLOUD"        // 立即云端执行
  | "QUEUE_FOR_LOCAL";     // 本地离线，暂存队列等恢复

/** 任务类型枚举 */
export type TaskCategory =
  | "code_refactor"        // 代码重构 → 云端优先
  | "web_scraping"         // 需要浏览器 Cookie 的网页抓取 → 必须本地
  | "mobile_control"       // 手机操控 → 必须本地
  | "doc_generation"       // 文档生成 → 云端优先
  | "data_analysis"        // 数据分析 → 云端优先
  | "file_operation"       // 本地文件操作 → 必须本地
  | "system_command"       // 系统命令执行 → 必须本地
  | "ai_chat"              // AI 对话 → 云端优先
  | "notification"         // 通知推送 → 云端优先
  | "cron_job"             // 定时任务 → 云端优先
  | "git_operation"        // Git 操作 → 本地优先
  | "custom";              // 自定义任务

/** 设备状态快照 */
export interface DeviceStatus {
  deviceId: string;
  deviceName: string;
  isOnline: boolean;
  lastSeenAt: string | null;
  lastHeartbeatAt: number; // 本地内存中的上次心跳时间戳
}

/** 路由请求 */
export interface RouteRequest {
  taskType: TaskCategory;
  taskPayload: Record<string, unknown>;
  priority?: number;      // 优先级（数字越大越高），默认 0
  expiresInSeconds?: number; // 命令过期时间，默认 1h
  adminUid?: string;       // 下令的管理员 UID
}

/** 路由响应 */
export interface RouteResponse {
  decision: RouteDecision;
  strategy: TaskStrategy;
  reason: string;
  commandId?: string;      // QUEUE_FOR_LOCAL 时的命令 ID
  localDevice?: DeviceStatus;
}

/** 任务分级映射表 */
const TASK_STRATEGY_MAP: Record<TaskCategory, TaskStrategy> = {
  code_refactor:    "CLOUD_PREFERRED",
  web_scraping:     "LOCAL_REQUIRED",
  mobile_control:   "LOCAL_REQUIRED",
  doc_generation:   "CLOUD_PREFERRED",
  data_analysis:    "CLOUD_PREFERRED",
  file_operation:   "LOCAL_REQUIRED",
  system_command:   "LOCAL_REQUIRED",
  ai_chat:          "CLOUD_PREFERRED",
  notification:     "CLOUD_PREFERRED",
  cron_job:         "CLOUD_PREFERRED",
  git_operation:    "CLOUD_FALLBACK",
  custom:           "CLOUD_FALLBACK",
};

/** 任务策略的可读描述 */
const STRATEGY_DESCRIPTIONS: Record<TaskStrategy, string> = {
  CLOUD_PREFERRED: "云端优先：优先由云端 Claude Code 执行，本地在线也可执行",
  LOCAL_REQUIRED:  "必须本地：需要本地环境（浏览器/Cookie/文件系统/手机连接）",
  CLOUD_FALLBACK:  "云端回退：优先本地执行，本地离线时自动降级到云端执行",
};


// ═══════════════════════════════════════════════════════════════════
// MaoAIRouter 主类
// ═══════════════════════════════════════════════════════════════════

export class MaoAIRouter {
  /** Supabase 客户端 */
  private supabase: SupabaseClient;

  /** 本地设备信息 */
  private deviceStatus: DeviceStatus;

  /** 心跳定时器 */
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  /** 是否已启动 */
  private _started = false;

  /** 路由决策日志回调（可选，用于调试/监控） */
  onRouteDecision?: (req: RouteRequest, res: RouteResponse) => void;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    const url = supabaseUrl || process.env.SUPABASE_URL || "";
    const key = supabaseKey || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || "";

    if (!url || !key) {
      throw new Error("MaoAIRouter: 缺少 Supabase 连接参数（SUPABASE_URL + SUPABASE_SERVICE_KEY）");
    }

    this.supabase = createClient(url, key, {
      auth: { persistSession: false },
    });

    // 初始化本地设备信息
    const hostname = os.hostname().replace(/\s/g, "-");
    const macSuffix = this.getMacSuffix();
    this.deviceStatus = {
      deviceId: `${hostname}-${macSuffix}`,
      deviceName: `${os.type()} ${os.hostname()}`,
      isOnline: false,
      lastSeenAt: null,
      lastHeartbeatAt: 0,
    };
  }

  // ─── 设备注册 ───────────────────────────────────────

  /**
   * 向 Supabase 注册设备（启动时调用一次）
   * 如果设备已存在则更新 last_seen_at
   */
  async registerDevice(): Promise<boolean> {
    try {
      // Upsert 设备记录
      const { error } = await this.supabase
        .from("maoai_devices")
        .upsert(
          {
            device_id: this.deviceStatus.deviceId,
            device_name: this.deviceStatus.deviceName,
            last_seen_at: new Date().toISOString(),
            owner_uid: process.env.OWNER_EMAIL || null,
            is_admin: true,
          },
          { onConflict: "device_id" }
        );

      if (error) {
        console.error("[MaoAIRouter] 设备注册失败:", error.message);
        return false;
      }

      this.deviceStatus.isOnline = true;
      console.log(`[MaoAIRouter] 设备已注册: ${this.deviceStatus.deviceId}`);

      // ★ 向 AI Headquarters 注册
      reportToHQ({
        action: "register",
        payload: {
          version: "3.0",
          capabilities: ["triad-loop", "hybrid-cloud", "tRPC", "websocket"],
          workspace: "/Users/daiyan/Desktop/mcmamoo-website",
        },
      });

      return true;
    } catch (err) {
      console.error("[MaoAIRouter] 设备注册异常:", err);
      return false;
    }
  }

  // ─── 心跳上报 ───────────────────────────────────────

  /**
   * 启动心跳循环（每 30 秒向 Supabase 上报一次）
   */
  startHeartbeat(): void {
    if (this.heartbeatTimer) return;

    // 立即执行一次
    this.sendHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    console.log(`[MaoAIRouter] 心跳已启动，间隔 ${HEARTBEAT_INTERVAL_MS / 1000}s`);
  }

  /**
   * 停止心跳循环
   */
  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      this.deviceStatus.isOnline = false;
      console.log("[MaoAIRouter] 心跳已停止");
    }
  }

  /**
   * 发送一次心跳到 Supabase + AI Headquarters
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      const now = new Date().toISOString();
      const { error } = await this.supabase
        .from("maoai_devices")
        .update({ last_seen_at: now })
        .eq("device_id", this.deviceStatus.deviceId);

      if (error) {
        console.warn("[MaoAIRouter] 心跳上报失败:", error.message);
        this.deviceStatus.isOnline = false;
      } else {
        this.deviceStatus.isOnline = true;
        this.deviceStatus.lastSeenAt = now;
        this.deviceStatus.lastHeartbeatAt = Date.now();

        // ★ 向 HQ 上报心跳（每 30s 一次，非阻塞）
        reportToHQ({
          action: "heartbeat",
          payload: {
            status: "online",
            pendingCommands: await this.getPendingCommandCount(),
          },
        });
      }
    } catch (err) {
      console.warn("[MaoAIRouter] 心跳异常:", err);
      this.deviceStatus.isOnline = false;
    }
  }

  // ─── 本地设备在线检查 ───────────────────────────────

  /**
   * 检查本地设备是否在线
   * 同时检查内存中的心跳状态和数据库中的 last_seen_at
   */
  async checkLocalOnline(): Promise<DeviceStatus> {
    try {
      const { data, error } = await this.supabase
        .from("maoai_devices")
        .select("device_id, device_name, last_seen_at, is_admin")
        .eq("device_id", this.deviceStatus.deviceId)
        .single();

      if (error || !data) {
        this.deviceStatus.isOnline = false;
        return { ...this.deviceStatus };
      }

      // 判断是否在线：数据库中的 last_seen_at 在超时时间内
      const lastSeen = new Date(data.last_seen_at).getTime();
      const isDbOnline = (Date.now() - lastSeen) < DEVICE_ONLINE_TIMEOUT_MS;

      // 综合判断：内存心跳 + 数据库记录
      this.deviceStatus.isOnline = isDbOnline || this.deviceStatus.isOnline;
      this.deviceStatus.lastSeenAt = data.last_seen_at;

      return { ...this.deviceStatus };
    } catch {
      // 数据库异常时，依赖内存中的心跳状态
      return { ...this.deviceStatus };
    }
  }

  // ─── 核心路由决策 ───────────────────────────────────

  /**
   * 路由一个任务
   *
   * 决策逻辑：
   *  1. 根据任务类型获取策略（CLOUD_PREFERRED / LOCAL_REQUIRED / CLOUD_FALLBACK）
   *  2. 检查本地设备在线状态
   *  3. 根据策略 + 在线状态做出最终决策
   *
   *  CLOUD_PREFERRED  + 在线 → EXECUTE_CLOUD（云端优先策略，无论本地是否在线都走云端）
   *  CLOUD_PREFERRED  + 离线 → EXECUTE_CLOUD（同上）
   *  LOCAL_REQUIRED   + 在线 → EXECUTE_LOCAL（必须本地执行）
   *  LOCAL_REQUIRED   + 离线 → QUEUE_FOR_LOCAL（本地离线，暂存队列等恢复）
   *  CLOUD_FALLBACK   + 在线 → EXECUTE_LOCAL（本地在线，优先本地）
   *  CLOUD_FALLBACK   + 离线 → EXECUTE_CLOUD（本地离线，降级到云端）
   */
  async routeTask(request: RouteRequest): Promise<RouteResponse> {
    const device = await this.checkLocalOnline();
    const strategy = TASK_STRATEGY_MAP[request.taskType] || "CLOUD_FALLBACK";
    const strategyDesc = STRATEGY_DESCRIPTIONS[strategy];

    let decision: RouteDecision;
    let reason: string;

    switch (strategy) {
      case "CLOUD_PREFERRED":
        // 云端优先：无论本地是否在线，都直接走云端
        decision = "EXECUTE_CLOUD";
        reason = `${strategyDesc}。任务 "${request.taskType}" 由云端 Claude Code 执行。`;
        break;

      case "LOCAL_REQUIRED":
        if (device.isOnline) {
          decision = "EXECUTE_LOCAL";
          reason = `${strategyDesc}。任务 "${request.taskType}" 需要 ${this.getRequirementDesc(request.taskType)}，本地设备在线，立即本地执行。`;
        } else {
          // 本地离线，写入命令队列
          const commandId = await this.enqueueForLocal(request);
          decision = "QUEUE_FOR_LOCAL";
          reason = `${strategyDesc}。任务 "${request.taskType}" 需要 ${this.getRequirementDesc(request.taskType)}，但本地设备离线（最后心跳: ${device.lastSeenAt}），已写入命令队列等待恢复。`;
          return { decision, strategy, reason, commandId, localDevice: device };
        }
        break;

      case "CLOUD_FALLBACK":
        if (device.isOnline) {
          decision = "EXECUTE_LOCAL";
          reason = `${strategyDesc}。任务 "${request.taskType}" 本地设备在线，优先本地执行。`;
        } else {
          decision = "EXECUTE_CLOUD";
          reason = `${strategyDesc}。任务 "${request.taskType}" 本地设备离线（最后心跳: ${device.lastSeenAt}），降级到云端 Claude Code 执行。`;
        }
        break;
    }

    const response: RouteResponse = { decision, strategy, reason, localDevice: device };

    // 回调通知
    this.onRouteDecision?.(request, response);

    // ★ 向 HQ 上报任务路由决策
    reportToHQ({
      action: "task-update",
      payload: {
        taskId: `route-${request.taskType}-${Date.now()}`,
        title: `路由决策: ${request.taskType} → ${decision}`,
        status: "running",
        progress: 0,
        step: decision,
        strategy,
        reason,
      },
      okrLink: { businessId: "maoai", objectiveIndex: 2, krIndex: 0 },
    });

    // 记录路由决策到遥测日志
    this.logTelemetry("INFO", `Route: ${request.taskType} → ${decision}`, {
      strategy,
      taskType: request.taskType,
      decision,
      deviceOnline: device.isOnline,
    });

    return response;
  }

  // ─── 命令队列操作 ───────────────────────────────────

  /**
   * 将任务写入 maoai_pending_commands 队列，等待本地恢复后拉取执行
   * 本地 cloud_tunnel.py 每秒轮询此队列（FOR UPDATE SKIP LOCKED）
   */
  private async enqueueForLocal(request: RouteRequest): Promise<string | undefined> {
    try {
      const { data, error } = await this.supabase
        .from("maoai_pending_commands")
        .insert({
          device_id: this.deviceStatus.deviceId,
          command_type: request.taskType,
          payload: request.taskPayload,
          priority: request.priority || 0,
          admin_uid: request.adminUid || "system",
          expires_at: new Date(Date.now() + (request.expiresInSeconds || COMMAND_TTL_SECONDS) * 1000).toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        console.error("[MaoAIRouter] 命令入队失败:", error.message);
        return undefined;
      }

      console.log(`[MaoAIRouter] 命令已入队: ${data.id} (${request.taskType})`);
      return data.id;
    } catch (err) {
      console.error("[MaoAIRouter] 命令入队异常:", err);
      return undefined;
    }
  }

  /**
   * 获取当前待执行的命令数量
   */
  async getPendingCommandCount(): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from("maoai_pending_commands")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("device_id", this.deviceStatus.deviceId);

      if (error) return 0;
      return count || 0;
    } catch {
      return 0;
    }
  }

  // ─── 批量路由 ───────────────────────────────────────

  /**
   * 批量路由多个任务，返回每个任务的路由结果
   */
  async routeTasks(requests: RouteRequest[]): Promise<RouteResponse[]> {
    return Promise.all(requests.map((req) => this.routeTask(req)));
  }

  // ─── 遥测日志 ───────────────────────────────────────

  /**
   * 写入遥测日志到 maoai_telemetry_log 表
   */
  private async logTelemetry(
    level: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.supabase.from("maoai_telemetry_log").insert({
        device_id: this.deviceStatus.deviceId,
        level,
        message,
        metadata: metadata || {},
      });
    } catch {
      // 遥测日志写入失败不应影响主流程
    }
  }

  // ─── 启动/停止 ──────────────────────────────────────

  /**
   * 完整启动序列：注册设备 → 心跳上报 → 返回设备信息
   */
  async start(): Promise<DeviceStatus> {
    if (this._started) return this.deviceStatus;

    const registered = await this.registerDevice();
    if (registered) {
      this.startHeartbeat();
    }
    this._started = true;
    return { ...this.deviceStatus };
  }

  /**
   * 停止路由器
   */
  stop(): void {
    this.stopHeartbeat();
    this._started = false;
    console.log("[MaoAIRouter] 路由器已停止");
  }

  // ─── 状态查询 ───────────────────────────────────────

  /** 获取当前设备状态 */
  getStatus(): DeviceStatus {
    return { ...this.deviceStatus };
  }

  /** 获取任务策略映射（供前端展示） */
  getStrategyMap(): Record<TaskCategory, { strategy: TaskStrategy; description: string }> {
    const result: Record<string, { strategy: TaskStrategy; description: string }> = {};
    for (const [category, strategy] of Object.entries(TASK_STRATEGY_MAP)) {
      result[category] = {
        strategy,
        description: STRATEGY_DESCRIPTIONS[strategy],
      };
    }
    return result as Record<TaskCategory, { strategy: TaskStrategy; description: string }>;
  }

  // ─── 工具方法 ───────────────────────────────────────

  private getMacSuffix(): string {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (!net.internal && net.mac && net.mac !== "00:00:00:00:00:00") {
          return net.mac.replace(/:/g, "").slice(-8).toLowerCase();
        }
      }
    }
    return crypto.randomBytes(4).toString("hex");
  }

  private getRequirementDesc(taskType: TaskCategory): string {
    const descMap: Partial<Record<TaskCategory, string>> = {
      web_scraping: "本地浏览器环境和用户 Cookie",
      mobile_control: "本地手机连接（ADB/投屏）",
      file_operation: "本地文件系统访问",
      system_command: "本地系统权限执行命令",
    };
    return descMap[taskType] || "本地环境";
  }
}

// ═══════════════════════════════════════════════════════════════════
// 单例导出
// ═══════════════════════════════════════════════════════════════════

let _routerInstance: MaoAIRouter | null = null;

/**
 * 获取 MaoAIRouter 单例
 */
export function getMaoAIRouter(): MaoAIRouter {
  if (!_routerInstance) {
    _routerInstance = new MaoAIRouter();
  }
  return _routerInstance;
}

/**
 * 重置单例（主要用于测试）
 */
export function resetMaoAIRouter(): void {
  if (_routerInstance) {
    _routerInstance.stop();
    _routerInstance = null;
  }
}
