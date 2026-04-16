
import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

/**
 * 初始化 TriadLoop WebSocket 服务
 * 处理前端 TriadLoopStatus.tsx 的实时状态推送
 */
export function setupTriadLoopWS(server: Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;

    if (pathname === "/ws/triad-loop") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", (ws: WebSocket) => {
    console.log("[TriadLoopWS] 客户端已连接");

    // 发送初始状态
    ws.send(JSON.stringify({
      type: "status",
      data: {
        phase: "idle",
        step: "waiting_for_task",
        message: "准备就绪，等待任务...",
        timestamp: new Date().toISOString()
      }
    }));

    ws.on("message", (message) => {
      try {
        const payload = JSON.parse(message.toString());
        console.log("[TriadLoopWS] 收到消息:", payload);
        
        // 模拟心跳响应
        if (payload.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", timestamp: new Date().toISOString() }));
        }
      } catch (e) {
        console.error("[TriadLoopWS] 消息解析失败:", e);
      }
    });

    ws.on("close", () => {
      console.log("[TriadLoopWS] 客户端已断开");
    });
  });

  return wss;
}
