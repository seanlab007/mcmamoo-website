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
  Bot, Eye, TestTube2, Target, ChevronDown, ChevronUp, RefreshCw,
  Scan, ScanLine, Camera, Globe, Cpu
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
  reality_checking: "现实验证中",
  converging: "收敛中",
  completed: "已完成",
  error: "错误",
};

// Phase 7: 现实验证状态
interface RealityCheckState {
  isActive: boolean;
  stage: "idle" | "screenshot" | "dom_check" | "api_check" | "visual_diff" | "completed";
  screenshotPath?: string;
  domCheckResult?: { exists: boolean; found: number; missing: number };
  apiCheckResult?: { reachable: boolean; tested: number; failed: number };
  visualDiff?: { diffPercentage: number; significant: boolean };
  progress: number;
}

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
  const [realityCheck, setRealityCheck] = useState<RealityCheckState>({
    isActive: false,
    stage: "idle",
    progress: 0,
  });
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
    event?: string;
    data?: any;
  }) => {
    // Phase 7: 处理现实验证事件
    if (data.type === "reality_check") {
      const eventData = data.data || {};
      
      switch (data.event) {
        case "started":
          setRealityCheck({
            isActive: true,
            stage: "screenshot",
            progress: 10,
          });
          setState(prev => ({ ...prev, currentPhase: "reality_checking" }));
          break;
        case "screenshot_complete":
          setRealityCheck(prev => ({
            ...prev,
            stage: "dom_check",
            progress: 30,
            screenshotPath: eventData.path,
          }));
          break;
        case "concurrent_checks_complete":
          setRealityCheck(prev => ({
            ...prev,
            stage: "visual_diff",
            progress: 70,
            domCheckResult: eventData.dom_exists !== undefined ? {
              exists: eventData.dom_exists,
              found: eventData.dom_found || 0,
              missing: eventData.dom_missing || 0,
            } : undefined,
            apiCheckResult: eventData.api_reachable !== undefined ? {
              reachable: eventData.api_reachable,
              tested: eventData.api_tested || 0,
              failed: eventData.api_failed || 0,
            } : undefined,
          }));
          break;
        case "visual_diff_complete":
          setRealityCheck(prev => ({
            ...prev,
            stage: "completed",
            progress: 100,
            visualDiff: eventData.diff_percentage !== undefined ? {
              diffPercentage: eventData.diff_percentage,
              significant: eventData.significant_change,
            } : undefined,
          }));
          break;
        case "completed":
          setRealityCheck(prev => ({ ...prev, isActive: false, stage: "idle" }));
          break;
      }
      return;
    }

    if (data.type === "session_started") {
      setState(prev => ({ ...prev, isRunning: true }));
      setRealityCheck({ isActive: false, stage: "idle", progress: 0 });
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
      setRealityCheck({ isActive: false, stage: "idle", progress: 0 });
      return;
    }

    // 解析阶段更新
    if (data.phase) {
      const phaseMap: Record<string, TriadPhase> = {
        strategist: "strategist_analyzing",
        coders: "coders_generating",
        reviewer: "reviewer_reviewing",
        validator: "validator_testing",
        reality_check: "reality_checking",
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

        {/* Phase 7: 现实扫描仪状态 */}
        {realityCheck.isActive && (
          <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 animate-pulse">
            <Scan size={12} className="text-emerald-400" />
            <span className="text-[10px] text-emerald-400 font-medium">现实扫描</span>
            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${realityCheck.progress}%` }}
              />
            </div>
            <span className="text-[10px] text-emerald-400/70">{realityCheck.progress}%</span>
          </div>
        )}

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

          {/* Phase 7: 现实验证详情面板 */}
          {realityCheck.isActive && (
            <div className="px-4 py-3 bg-emerald-950/20 border-t border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <ScanLine size={12} className="text-emerald-400" />
                <span className="text-[10px] text-emerald-400 font-medium">现实验证详情</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {/* 截图状态 */}
                <div className={`
                  flex items-center gap-1.5 px-2 py-1 border text-[10px]
                  ${realityCheck.stage !== "idle" 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : "bg-white/5 border-white/10 text-white/30"}
                `}>
                  <Camera size={10} />
                  <span>截图</span>
                  {realityCheck.stage !== "idle" && realityCheck.stage !== "screenshot" && (
                    <CheckCircle2 size={10} className="ml-auto" />
                  )}
                  {realityCheck.stage === "screenshot" && (
                    <Loader2 size={10} className="ml-auto animate-spin" />
                  )}
                </div>

                {/* DOM检查状态 */}
                <div className={`
                  flex items-center gap-1.5 px-2 py-1 border text-[10px]
                  ${realityCheck.stage === "dom_check" || realityCheck.stage === "visual_diff" || realityCheck.stage === "completed"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : "bg-white/5 border-white/10 text-white/30"}
                `}>
                  <Globe size={10} />
                  <span>DOM检查</span>
                  {(realityCheck.stage === "visual_diff" || realityCheck.stage === "completed") && (
                    <CheckCircle2 size={10} className="ml-auto" />
                  )}
                  {realityCheck.stage === "dom_check" && (
                    <Loader2 size={10} className="ml-auto animate-spin" />
                  )}
                </div>

                {/* API检查状态 */}
                <div className={`
                  flex items-center gap-1.5 px-2 py-1 border text-[10px]
                  ${realityCheck.stage === "api_check" || realityCheck.stage === "visual_diff" || realityCheck.stage === "completed"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : "bg-white/5 border-white/10 text-white/30"}
                `}>
                  <Cpu size={10} />
                  <span>API检查</span>
                  {(realityCheck.stage === "visual_diff" || realityCheck.stage === "completed") && (
                    <CheckCircle2 size={10} className="ml-auto" />
                  )}
                  {realityCheck.stage === "api_check" && (
                    <Loader2 size={10} className="ml-auto animate-spin" />
                  )}
                </div>
              </div>

              {/* 检查结果详情 */}
              {(realityCheck.domCheckResult || realityCheck.apiCheckResult) && (
                <div className="mt-2 space-y-1 text-[10px]">
                  {realityCheck.domCheckResult && (
                    <div className="flex items-center gap-2 text-white/60">
                      <span>DOM元素:</span>
                      <span className={realityCheck.domCheckResult.exists ? "text-emerald-400" : "text-red-400"}>
                        {realityCheck.domCheckResult.exists ? "✓ 通过" : "✗ 失败"}
                      </span>
                      <span className="text-white/40">
                        (找到 {realityCheck.domCheckResult.found}, 缺失 {realityCheck.domCheckResult.missing})
                      </span>
                    </div>
                  )}
                  {realityCheck.apiCheckResult && (
                    <div className="flex items-center gap-2 text-white/60">
                      <span>API端点:</span>
                      <span className={realityCheck.apiCheckResult.reachable ? "text-emerald-400" : "text-red-400"}>
                        {realityCheck.apiCheckResult.reachable ? "✓ 可达" : "✗ 失败"}
                      </span>
                      <span className="text-white/40">
                        (测试 {realityCheck.apiCheckResult.tested}, 失败 {realityCheck.apiCheckResult.failed})
                      </span>
                    </div>
                  )}
                  {realityCheck.visualDiff && (
                    <div className="flex items-center gap-2 text-white/60">
                      <span>视觉差异:</span>
                      <span className={realityCheck.visualDiff.significant ? "text-amber-400" : "text-emerald-400"}>
                        {(realityCheck.visualDiff.diffPercentage * 100).toFixed(1)}%
                      </span>
                      <span className="text-white/40">
                        {realityCheck.visualDiff.significant ? "(显著变化)" : "(正常范围)"}
                      </span>
                    </div>
                  )}
                </div>
              )}
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
