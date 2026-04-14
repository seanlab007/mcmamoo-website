/**
 * TriadLoopStatus - 三权分立博弈可视化组件
 *
 * 显示 Coder / Reviewer / Validator 三方实时状态：
 * - WebSocket 连接状态
 * - 当前执行阶段
 * - 实时消息流
 * - 收敛分数
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { MAOAI_CORE_2_CONFIG } from "../constants";
import type { TriadLoopState, TriadAgentType, TriadPhase, TriadMessage } from "../types";
import {
  Wifi, WifiOff, Loader2, CheckCircle2, XCircle, AlertTriangle,
  Bot, Eye, TestTube2, Target, ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";

const AGENT_ICONS: Record<TriadAgentType, React.ReactNode> = {
  strategist: <Target size={14} />,
  coders: <Bot size={14} />,
  reviewer: <Eye size={14} />,
  validator: <TestTube2 size={14} />,
};

const AGENT_LABELS: Record<TriadAgentType, string> = {
  strategist: "战略家",
  coders: "编码器",
  reviewer: "审查员",
  validator: "验证器",
};

const PHASE_LABELS: Record<TriadPhase, string> = {
  idle: "待机",
  strategist_analyzing: "战略分析中",
  coders_generating: "代码生成中",
  reviewer_reviewing: "审查中",
  validator_testing: "测试中",
  converging: "收敛中",
  completed: "已完成",
  error: "错误",
};

interface TriadLoopStatusProps {
  modelId: string;
  onStateChange?: (state: TriadLoopState) => void;
  compact?: boolean;
}

export function TriadLoopStatus({ modelId, onStateChange, compact = false }: TriadLoopStatusProps) {
  const [state, setState] = useState<TriadLoopState>({
    isConnected: false,
    isRunning: false,
    currentPhase: "idle",
    currentAgent: null,
    currentRound: 0,
    totalRounds: 0,
    messages: [],
    score: null,
    error: undefined,
  });
  const [expanded, setExpanded] = useState(!compact);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isStrategicMode = modelId === "maoai-core-2";

  const reconnectCountRef = useRef(0);

  const connect = useCallback(() => {
    if (!isStrategicMode || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(MAOAI_CORE_2_CONFIG.websocketUrl);

      ws.onopen = () => {
        console.log("[TriadLoopStatus] WebSocket connected");
        reconnectCountRef.current = 0;
        setState(prev => ({ ...prev, isConnected: true, error: undefined }));
        onStateChange?.({ ...state, isConnected: true });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (e) {
          console.error("[TriadLoopStatus] Failed to parse message:", e);
        }
      };

      ws.onerror = (error) => {
        console.error("[TriadLoopStatus] WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("[TriadLoopStatus] WebSocket disconnected");
        setState(prev => ({ ...prev, isConnected: false }));
        onStateChange?.({ ...state, isConnected: false });

        const { maxAttempts, intervalMs } = MAOAI_CORE_2_CONFIG.reconnect;
        if (reconnectCountRef.current < maxAttempts) {
          reconnectCountRef.current += 1;
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isStrategicMode) connect();
          }, intervalMs);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("[TriadLoopStatus] Failed to create WebSocket:", error);
    }
  }, [isStrategicMode, onStateChange, state]);

  const handleMessage = (data: {
    type?: string;
    agent?: string;
    phase?: string;
    content?: string;
    round?: number;
    score?: number;
    code?: string;
    error?: string;
    messages?: TriadMessage[];
  }) => {
    if (data.type === "session_started") {
      setState(prev => ({ ...prev, isRunning: true }));
      return;
    }

    if (data.type === "session_ended") {
      setState(prev => ({
        ...prev,
        isRunning: false,
        currentPhase: data.error ? "error" : "completed",
        error: data.error,
        score: data.score ?? prev.score,
        finalCode: data.code,
      }));
      return;
    }

    // 解析阶段更新
    if (data.phase) {
      const phaseMap: Record<string, TriadPhase> = {
        strategist: "strategist_analyzing",
        coders: "coders_generating",
        reviewer: "reviewer_reviewing",
        validator: "validator_testing",
        converge: "converging",
      };
      const newPhase = phaseMap[data.phase] || "idle";
      setState(prev => ({
        ...prev,
        currentPhase: newPhase,
        currentAgent: data.agent as TriadAgentType || prev.currentAgent,
        currentRound: data.round ?? prev.currentRound,
      }));
    }

    // 解析分数
    if (data.score !== undefined) {
      setState(prev => ({ ...prev, score: data.score ?? null }));
    }

    // 解析消息
    if (data.content && data.agent) {
      const message: TriadMessage = {
        agent: data.agent as TriadAgentType,
        type: data.type as any || "thinking",
        content: data.content,
        timestamp: new Date().toISOString(),
        round: data.round ?? 1,
      };
      setState(prev => ({
        ...prev,
        messages: [...prev.messages.slice(-99), message], // 保留最近 100 条
      }));
      onStateChange?.(state);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isConnected: false,
      isRunning: false,
      currentPhase: "idle",
    }));
  };

  // 连接/断开 WebSocket
  useEffect(() => {
    if (isStrategicMode) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isStrategicMode]);

  // 如果不是战略模式，不渲染任何内容
  if (!isStrategicMode) return null;

  const { isConnected, isRunning, currentPhase, currentAgent, currentRound, messages, score, error } = state;

  // ── 紧凑模式 ──────────────────────────────────────────────────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-2 py-1 bg-[#C9A84C]/10 border border-[#C9A84C]/20">
        {/* 连接状态 */}
        {isConnected ? (
          <Wifi size={10} className="text-emerald-400" />
        ) : (
          <WifiOff size={10} className="text-white/30" />
        )}

        {/* 当前阶段 */}
        <span className="text-[10px] text-[#C9A84C]/80 font-medium">
          {isRunning ? PHASE_LABELS[currentPhase] : "待机"}
        </span>

        {/* 分数 */}
        {score !== null && (
          <span className="text-[10px] text-emerald-400 font-mono">
            {score.toFixed(1)}
          </span>
        )}

        {/* 错误 */}
        {error && <XCircle size={10} className="text-red-400" />}

        {/* 展开按钮 */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 hover:bg-white/10"
        >
          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      </div>
    );
  }

  // ── 完整模式 ──────────────────────────────────────────────────────────────
  return (
    <div className="border border-[#C9A84C]/20 bg-[#0a0a0a]">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#1a1a2e] to-[#0f0f1a] border-b border-[#C9A84C]/20">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#C9A84C] font-bold tracking-widest">TRIAD LOOP</span>

          {/* 连接状态 */}
          <div className="flex items-center gap-1.5">
            {isConnected ? (
              <>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <Wifi size={10} className="text-emerald-400" />
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-white/20" />
                <WifiOff size={10} className="text-white/30" />
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 分数 */}
          {score !== null && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30">
              <CheckCircle2 size={10} className="text-emerald-400" />
              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                {score.toFixed(2)}
              </span>
            </div>
          )}

          {/* 错误 */}
          {error && (
            <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 border border-red-500/30">
              <XCircle size={10} className="text-red-400" />
              <span className="text-[10px] text-red-400">错误</span>
            </div>
          )}

          {/* 展开/折叠 */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-white/10 text-white/40"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* 三方状态栏 */}
      <div className="flex items-center gap-4 px-4 py-2 bg-black/40">
        {(Object.keys(AGENT_LABELS) as TriadAgentType[]).map((agent) => {
          const isActive = currentAgent === agent && isRunning;
          const phaseForAgent: TriadPhase = `${agent}s` as `${TriadAgentType}s` ||
            (agent === "coders" ? "coders_generating" :
             agent === "reviewer" ? "reviewer_reviewing" :
             agent === "validator" ? "validator_testing" :
             agent === "strategist" ? "strategist_analyzing" : "idle");
          const config = MAOAI_CORE_2_CONFIG.phases[agent];

          return (
            <div
              key={agent}
              className={`
                flex items-center gap-1.5 px-2 py-1 border transition-all
                ${isActive
                  ? "bg-[#C9A84C]/20 border-[#C9A84C]/40 text-[#C9A84C]"
                  : "bg-white/5 border-white/10 text-white/40"
                }
              `}
            >
              <span className={config?.color || "text-white/60"}>
                {config?.icon && <span className="text-xs">{config.icon}</span>}
              </span>
              <span className="text-[10px] font-medium">{AGENT_LABELS[agent]}</span>
              {isActive && <Loader2 size={8} className="animate-spin" />}
            </div>
          );
        })}

        {/* 当前轮次 */}
        {currentRound > 0 && (
          <div className="ml-auto text-[10px] text-white/40">
            Round {currentRound}
          </div>
        )}
      </div>

      {/* 展开内容 */}
      {expanded && (
        <div className="border-t border-[#C9A84C]/10">
          {/* 消息流 */}
          {messages.length > 0 && (
            <div className="max-h-48 overflow-y-auto p-2 space-y-1 bg-black/60">
              {messages.slice(-20).map((msg, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px]">
                  <span className="shrink-0 w-12 text-[#C9A84C]/40 font-mono">
                    {msg.agent.slice(0, 3)}
                  </span>
                  <span className={`
                    shrink-0 w-8 font-mono
                    ${msg.type === "thinking" ? "text-blue-400" :
                      msg.type === "action" ? "text-emerald-400" :
                      msg.type === "result" ? "text-amber-400" :
                      msg.type === "feedback" ? "text-purple-400" :
                      msg.type === "error" ? "text-red-400" : "text-white/40"
                    }
                  `}>
                    {msg.type}
                  </span>
                  <span className="text-white/60 flex-1 truncate">
                    {msg.content.slice(0, 100)}
                    {msg.content.length > 100 && "..."}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 状态摘要 */}
          <div className="px-4 py-2 bg-[#1a1a2e]/50 border-t border-white/5">
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-4">
                <span className="text-white/40">
                  阶段: <span className="text-[#C9A84C]">{PHASE_LABELS[currentPhase]}</span>
                </span>
                {currentAgent && (
                  <span className="text-white/40">
                    当前: <span className="text-white/70">{AGENT_LABELS[currentAgent]}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-white/40">
                  消息: <span className="text-white/70">{messages.length}</span>
                </span>
                <button
                  onClick={connect}
                  className="flex items-center gap-1 px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 hover:text-white/60"
                >
                  <RefreshCw size={8} />
                  重连
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TriadLoopStatus;
