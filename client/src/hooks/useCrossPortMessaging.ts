/**
 * useCrossPortMessaging.ts
 * 跨端口双向通信 Hook
 * 
 * 功能：
 *  1. 主站(3000)监听 iframe(3001) 的消息
 *  2. iframe 向主站发送任务状态更新
 *  3. 主站侧边栏自动弹出通知
 * 
 * 使用方式：
 *   // 主站端 (3000)
 *   const { sendToIframe, lastMessage, subscribe } = useCrossPortMessaging();
 *   
 *   // iframe 端 (3001)
 *   const { postMessageToParent } = useCrossPortMessaging({ isChild: true });
 */

import { useState, useEffect, useCallback, useRef } from "react";

// 消息类型定义
export interface CrossPortMessage {
  type: "TASK_CREATED" | "TASK_COMPLETED" | "TASK_FAILED" | "VIDEO_READY" | "PING" | "PONG";
  payload?: any;
  timestamp: number;
  source: "main" | "iframe";
}

export interface TaskCreatedPayload {
  taskId: number;
  skillId: string;
  triggerType: "manual" | "scheduled" | "api";
}

export interface VideoReadyPayload {
  taskId: number;
  outputPath: string;
  previewUrl: string;
}

// 消息类型到Payload的映射
export type MessagePayloadMap = {
  TASK_CREATED: TaskCreatedPayload;
  TASK_COMPLETED: { taskId: number; status: string };
  TASK_FAILED: { taskId: number; error: string };
  VIDEO_READY: VideoReadyPayload;
  PING: undefined;
  PONG: undefined;
};

// 回调类型
type MessageCallback<T extends CrossPortMessage["type"]> = (
  payload: MessagePayloadMap[T]
) => void;

const LISTENER_KEY = "cross-port-messaging";

/**
 * 跨端口消息 Hook
 * 
 * @param options.isChild - 是否为 iframe 端（默认 false，即主站端）
 * @param options.debug - 是否开启调试日志
 */
export function useCrossPortMessaging(options: { isChild?: boolean; debug?: boolean } = {}) {
  const { isChild = false, debug = false } = options;
  
  const [lastMessage, setLastMessage] = useState<CrossPortMessage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbacksRef = useRef<Map<CrossPortMessage["type"], Set<MessageCallback<any>>>>(new Map());
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 调试日志
  const log = useCallback((...args: any[]) => {
    if (debug) {
      console.log(`[CrossPortMessaging${isChild ? "-Child" : "-Main"}]`, ...args);
    }
  }, [debug, isChild]);

  // 发送消息
  const sendMessage = useCallback((message: Omit<CrossPortMessage, "timestamp" | "source">) => {
    const fullMessage: CrossPortMessage = {
      ...message,
      timestamp: Date.now(),
      source: isChild ? "iframe" : "main"
    };

    log("发送消息:", fullMessage);

    if (isChild) {
      // iframe 端 -> 发送给 parent
      window.parent.postMessage(fullMessage, "*");
    } else {
      // 主站端 -> 广播给所有 iframe（通过事件）
      window.dispatchEvent(new CustomEvent(LISTENER_KEY, { detail: fullMessage }));
    }
  }, [isChild, log]);

  // 监听消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent<CrossPortMessage>) => {
      // 验证消息格式
      if (!event.data || typeof event.data.type !== "string") return;
      
      const message = event.data;
      
      // 忽略自己发送的消息
      if (message.source === (isChild ? "iframe" : "main")) return;

      log("收到消息:", message);
      setLastMessage(message);

      // 调用对应的回调
      const callbacks = callbacksRef.current.get(message.type);
      if (callbacks) {
        callbacks.forEach((callback) => {
          try {
            callback(message.payload);
          } catch (error) {
            console.error(`[CrossPortMessaging] Callback error for ${message.type}:`, error);
          }
        });
      }

      // 自动回复 PONG
      if (message.type === "PING") {
        sendMessage({ type: "PONG" });
      }
    };

    // 主站端：同时监听 window.message 和自定义事件
    const handleCustomEvent = (event: CustomEvent<CrossPortMessage>) => {
      log("收到自定义事件:", event.detail);
      setLastMessage(event.detail);

      const callbacks = callbacksRef.current.get(event.detail.type);
      if (callbacks) {
        callbacks.forEach((callback) => {
          try {
            callback(event.detail.payload);
          } catch (error) {
            console.error(`[CrossPortMessaging] Callback error:`, error);
          }
        });
      }
    };

    window.addEventListener("message", handleMessage);
    
    // 主站端额外监听自定义事件
    if (!isChild) {
      window.addEventListener(LISTENER_KEY, handleCustomEvent as EventListener);
    }

    // 设置连接状态
    setIsConnected(true);

    // 定期发送 PING 保持连接
    if (!isChild) {
      pingIntervalRef.current = setInterval(() => {
        sendMessage({ type: "PING" });
      }, 5000);
    }

    return () => {
      window.removeEventListener("message", handleMessage);
      if (!isChild) {
        window.removeEventListener(LISTENER_KEY, handleCustomEvent as EventListener);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      setIsConnected(false);
    };
  }, [isChild, log, sendMessage]);

  // 订阅特定类型的消息
  const subscribe = useCallback(<T extends CrossPortMessage["type"]>(
    type: T,
    callback: MessageCallback<T>
  ) => {
    if (!callbacksRef.current.has(type)) {
      callbacksRef.current.set(type, new Set());
    }
    callbacksRef.current.get(type)!.add(callback);

    // 返回取消订阅函数
    return () => {
      callbacksRef.current.get(type)?.delete(callback);
    };
  }, []);

  // 发送便捷方法
  const notifyTaskCreated = useCallback((payload: TaskCreatedPayload) => {
    sendMessage({ type: "TASK_CREATED", payload });
  }, [sendMessage]);

  const notifyTaskCompleted = useCallback((payload: { taskId: number; status: string }) => {
    sendMessage({ type: "TASK_COMPLETED", payload });
  }, [sendMessage]);

  const notifyTaskFailed = useCallback((payload: { taskId: number; error: string }) => {
    sendMessage({ type: "TASK_FAILED", payload });
  }, [sendMessage]);

  const notifyVideoReady = useCallback((payload: VideoReadyPayload) => {
    sendMessage({ type: "VIDEO_READY", payload });
  }, [sendMessage]);

  return {
    lastMessage,
    isConnected,
    sendMessage,
    subscribe,
    // 便捷方法
    notifyTaskCreated,
    notifyTaskCompleted,
    notifyTaskFailed,
    notifyVideoReady
  };
}

/**
 * 独立的 postMessage 工具函数（用于 iframe 端简单调用）
 */
export function postMessageToParent(message: Omit<CrossPortMessage, "timestamp" | "source">) {
  const fullMessage: CrossPortMessage = {
    ...message,
    timestamp: Date.now(),
    source: "iframe"
  };
  
  if (window.parent !== window) {
    window.parent.postMessage(fullMessage, "*");
  } else {
    console.warn("[CrossPortMessaging] Not in an iframe, cannot post to parent");
  }
}

export default useCrossPortMessaging;
