/**
 * wsServer.ts
 * MaoAI 实时 WebSocket 服务器
 *
 * 功能：
 *  1. 支持多端连接（手机/云端/本地 Web 端）
 *  2. 任务状态实时推送
 *  3. 心跳保活
 *  4. 订阅/取消订阅任务频道
 *  5. 广播系统通知
 *
 * 前端连接地址：ws://localhost:8000/api/v1/ws/{userId}
 */

import { WebSocketServer, WebSocket } from "ws";
import { createServer, Server as HttpServer } from "http";
import { URL } from "url";

// ─── 类型定义 ──────────────────────────────────────────────────────────────────

export interface WSMessage {
  type: string;
  [key: string]: unknown;
}

export interface TaskUpdatePayload {
  type: "task_update";
  task_id: string;
  status: string;
  progress?: number;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface TaskProgressPayload {
  type: "task_progress_update";
  task_id?: string;
  project_id: string;
  status: "running" | "completed" | "failed";
  progress: number;
  step_name: string;
  message?: string;
  timestamp: string;
}

export interface SystemNotificationPayload {
  type: "system_notification";
  notification_type: string;
  title: string;
  message: string;
  level: "info" | "success" | "warning" | "error";
  timestamp: string;
}

export type BroadcastPayload = TaskUpdatePayload | TaskProgressPayload | SystemNotificationPayload;

// ─── 连接管理 ──────────────────────────────────────────────────────────────────

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  subscribedTasks: Set<string>;
  subscribedProjects: Set<string>;
  lastPing: number;
}

class WSServer {
  private wss: WebSocketServer | null = null;
  private httpServer: HttpServer | null = null;
  private clients: Map<string, ClientConnection> = new Map(); // userId -> connection
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private port: number = 8000;

  /**
   * 初始化 WebSocket 服务器
   * 在独立端口 8000 上监听
   */
  init(_httpServer?: HttpServer): void {
    this.port = parseInt(process.env.WS_PORT || "8000");

    // 创建独立的 HTTP 服务器用于 WebSocket
    this.httpServer = createServer();

    // 创建 WebSocket 服务器（不限制路径，在 connection 中处理）
    this.wss = new WebSocketServer({
      server: this.httpServer,
    });

    // 处理连接
    this.wss.on("connection", (ws: WebSocket, request: any) => {
      // 从 URL 路径提取 userId：/api/v1/ws/{userId}
      const rawUrl = request.url || "";
      const url = new URL(rawUrl, `http://localhost:${this.port}`);
      const pathname = url.pathname;

      // 检查路径是否以 /api/v1/ws 开头
      if (!pathname.startsWith("/api/v1/ws")) {
        console.log(`[WSS] Rejected: invalid path ${pathname}`);
        ws.close(400, "Invalid path");
        return;
      }

      // 提取 userId（路径格式：/api/v1/ws/{userId}）
      const segments = pathname.split("/").filter(Boolean);
      const userId = segments[segments.length - 1] || `anon-${Date.now()}`;

      console.log(`[WSS] Client connected: ${userId}`);

      // 存储连接
      const client: ClientConnection = {
        ws,
        userId,
        subscribedTasks: new Set(),
        subscribedProjects: new Set(),
        lastPing: Date.now(),
      };
      this.clients.set(userId, client);

      // 发送连接成功消息
      this.sendToClient(userId, {
        type: "connected",
        userId,
        timestamp: new Date().toISOString(),
      });

      // 消息处理
      ws.on("message", (data) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          this.handleMessage(userId, message);
        } catch (err) {
          console.error("[WSS] Failed to parse message:", err);
        }
      });

      // 关闭处理
      ws.on("close", () => {
        console.log(`[WSS] Client disconnected: ${userId}`);
        this.clients.delete(userId);
      });

      // 错误处理
      ws.on("error", (err) => {
        console.error(`[WSS] Error for ${userId}:`, err.message);
        this.clients.delete(userId);
      });

      // 心跳响应
      ws.on("pong", () => {
        const client = this.clients.get(userId);
        if (client) {
          client.lastPing = Date.now();
        }
      });
    });

    // 启动服务器
    this.httpServer.listen(this.port, () => {
      console.log(`[WSS] WebSocket server running on ws://localhost:${this.port}/api/v1/ws`);
    });

    // 启动心跳检测
    this.startHeartbeat();
  }

  /**
   * 处理客户端消息
   */
  private handleMessage(userId: string, message: WSMessage): void {
    const client = this.clients.get(userId);
    if (!client) return;

    switch (message.type) {
      case "ping":
        // 响应心跳
        this.sendToClient(userId, { type: "pong", timestamp: new Date().toISOString() });
        break;

      case "subscribe":
        // 订阅频道
        this.subscribeToTopic(userId, message.topic as string);
        break;

      case "unsubscribe":
        this.unsubscribeFromTopic(userId, message.topic as string);
        break;

      case "subscribe_task":
        if (message.task_id) {
          client.subscribedTasks.add(String(message.task_id));
          console.log(`[WSS] ${userId} subscribed to task ${message.task_id}`);
        }
        break;

      case "unsubscribe_task":
        if (message.task_id) {
          client.subscribedTasks.delete(String(message.task_id));
        }
        break;

      case "subscribe_project":
        if (message.project_id) {
          client.subscribedProjects.add(String(message.project_id));
        }
        break;

      case "unsubscribe_project":
        if (message.project_id) {
          client.subscribedProjects.delete(String(message.project_id));
        }
        break;

      case "sync_subscriptions":
        // 批量同步订阅
        if (Array.isArray(message.project_ids)) {
          client.subscribedProjects = new Set(message.project_ids.map(String));
        }
        if (Array.isArray(message.channels)) {
          message.channels.forEach((ch: string) => {
            if (ch.startsWith("task:")) {
              client.subscribedTasks.add(ch.replace("task:", ""));
            } else {
              client.subscribedProjects.add(ch);
            }
          });
        }
        console.log(`[WSS] ${userId} synced subscriptions: tasks=${[...client.subscribedTasks]}, projects=${[...client.subscribedProjects]}`);
        break;

      case "get_status":
        this.sendToClient(userId, {
          type: "status",
          clients: this.clients.size,
          subscribedTasks: [...client.subscribedTasks],
          subscribedProjects: [...client.subscribedProjects],
          timestamp: new Date().toISOString(),
        });
        break;

      default:
        console.log(`[WSS] Unknown message type: ${message.type}`);
    }
  }

  /**
   * 订阅主题
   */
  private subscribeToTopic(userId: string, topic: string): void {
    const client = this.clients.get(userId);
    if (!client) return;

    if (topic.startsWith("task:")) {
      client.subscribedTasks.add(topic.replace("task:", ""));
    } else {
      client.subscribedProjects.add(topic);
    }
    console.log(`[WSS] ${userId} subscribed to: ${topic}`);
  }

  /**
   * 取消订阅主题
   */
  private unsubscribeFromTopic(userId: string, topic: string): void {
    const client = this.clients.get(userId);
    if (!client) return;

    if (topic.startsWith("task:")) {
      client.subscribedTasks.delete(topic.replace("task:", ""));
    } else {
      client.subscribedProjects.delete(topic);
    }
  }

  /**
   * 发送消息给指定客户端
   */
  sendToClient(userId: string, message: object): boolean {
    const client = this.clients.get(userId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error(`[WSS] Failed to send to ${userId}:`, err);
      return false;
    }
  }

  /**
   * 广播消息给所有订阅了指定任务的客户端
   */
  broadcastTaskUpdate(taskId: string, payload: Omit<TaskUpdatePayload, "type" | "timestamp">): void {
    const message: TaskUpdatePayload = {
      type: "task_update",
      task_id: taskId,
      timestamp: new Date().toISOString(),
      ...payload,
    };

    let sent = 0;
    this.clients.forEach((client) => {
      if (client.subscribedTasks.has(taskId)) {
        if (this.sendToClient(client.userId, message)) {
          sent++;
        }
      }
    });

    if (sent > 0) {
      console.log(`[WSS] Broadcast task_update to ${sent} client(s): task=${taskId}, status=${payload.status}`);
    }
  }

  /**
   * 广播项目进度更新
   */
  broadcastProgressUpdate(projectId: string, payload: { task_id?: string; status: "running" | "completed" | "failed"; progress: number; step_name: string; message?: string }): void {
    const message: TaskProgressPayload = {
      type: "task_progress_update",
      project_id: projectId,
      task_id: payload.task_id ?? projectId,
      timestamp: new Date().toISOString(),
      status: payload.status,
      progress: payload.progress,
      step_name: payload.step_name,
      message: payload.message,
    };

    let sent = 0;
    this.clients.forEach((client) => {
      if (client.subscribedProjects.has(projectId)) {
        if (this.sendToClient(client.userId, message)) {
          sent++;
        }
      }
    });

    if (sent > 0) {
      console.log(`[WSS] Broadcast progress_update to ${sent} client(s): project=${projectId}`);
    }
  }

  /**
   * 广播系统通知给指定用户
   */
  broadcastNotification(userId: string, payload: Omit<SystemNotificationPayload, "type" | "timestamp">): void {
    const message: SystemNotificationPayload = {
      type: "system_notification",
      timestamp: new Date().toISOString(),
      ...payload,
    };

    this.sendToClient(userId, message);
  }

  /**
   * 广播系统通知给所有在线用户
   */
  broadcastToAll(payload: Omit<SystemNotificationPayload, "type" | "timestamp">): void {
    const message: SystemNotificationPayload = {
      type: "system_notification",
      timestamp: new Date().toISOString(),
      ...payload,
    };

    let sent = 0;
    this.clients.forEach((client) => {
      if (this.sendToClient(client.userId, message)) {
        sent++;
      }
    });

    console.log(`[WSS] Broadcast notification to ${sent} client(s)`);
  }

  /**
   * 启动心跳检测（每 30 秒 ping 一次）
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 60 秒无响应视为断开

      this.clients.forEach((client, userId) => {
        if (client.ws.readyState === WebSocket.OPEN) {
          // 发送 ping
          try {
            client.ws.ping();

            // 检查是否超时
            if (now - client.lastPing > timeout) {
              console.log(`[WSS] Client ${userId} heartbeat timeout, closing`);
              client.ws.terminate();
              this.clients.delete(userId);
            }
          } catch (err) {
            console.error(`[WSS] Heartbeat error for ${userId}:`, err);
            this.clients.delete(userId);
          }
        }
      });
    }, 30000);
  }

  /**
   * 关闭服务器
   */
  shutdown(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.clients.forEach((client) => {
      client.ws.close(1000, "Server shutting down");
    });
    this.clients.clear();

    if (this.httpServer) {
      this.httpServer.close();
    }

    if (this.wss) {
      this.wss.close();
    }

    console.log("[WSS] WebSocket server shut down");
  }

  /**
   * 获取连接统计
   */
  getStats(): { connectedClients: number; details: Array<{ userId: string; tasks: number; projects: number }> } {
    const details: Array<{ userId: string; tasks: number; projects: number }> = [];
    let connectedClients = 0;

    this.clients.forEach((client) => {
      details.push({
        userId: client.userId,
        tasks: client.subscribedTasks.size,
        projects: client.subscribedProjects.size,
      });
      connectedClients++;
    });

    return { connectedClients, details };
  }
}

// ─── 单例导出 ──────────────────────────────────────────────────────────────────

export const wsServer = new WSServer();
export default wsServer;
