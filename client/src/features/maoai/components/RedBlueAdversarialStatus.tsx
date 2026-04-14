/**
 * RedBlueAdversarialStatus
 * ─────────────────────────────────────────────────────────────────────────────
 * 红蓝对抗可视化组件（MAOAI_THINKING_PROTOCOL Phase 6+）
 *
 * 架构：
 *   🔴 红队 (Red Team)  — Claude：主动攻击、寻找漏洞、生成极端用例
 *   🔵 蓝队 (Blue Team) — GLM-4：防御加固、逻辑审查、安全修复
 *   ⚔️  裁判 (Judge)    — Strategist：评分收敛、最终裁决
 *
 * 使用：在 Chat.tsx 中引入，当模型为 maoai-core-2 时显示对抗触发按钮
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { MAOAI_CORE_2_CONFIG } from "../constants";
import {
  Swords, Shield, Target, Play, Square,
  ChevronDown, ChevronUp, Wifi, WifiOff,
  Loader2, CheckCircle2, XCircle, AlertTriangle,
} from "lucide-react";

// ── 类型 ─────────────────────────────────────────────────────────────────────

type Team = "red" | "blue" | "judge";

interface AdversarialMessage {
  team: Team;
  type: "attack" | "defend" | "verdict" | "thinking" | "result";
  content: string;
  round: number;
  timestamp: string;
  score?: number;
}

interface AdversarialState {
  isConnected: boolean;
  isRunning: boolean;
  round: number;
  maxRounds: number;
  messages: AdversarialMessage[];
  redScore: number | null;
  blueScore: number | null;
  winner: "red" | "blue" | "draw" | null;
  status: "idle" | "running" | "completed" | "error";
  error?: string;
}

interface RedBlueAdversarialStatusProps {
  modelId: string;
  task?: string;
  onStart?: (task: string) => void;
  onComplete?: (winner: "red" | "blue" | "draw") => void;
  compact?: boolean;
}

// ── 常量 ─────────────────────────────────────────────────────────────────────

const TEAM_CONFIG = {
  red: {
    label: "红队 · Claude",
    icon: <Swords size={14} className="text-rose-400" />,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    role: "攻击者：寻找漏洞、极端用例",
  },
  blue: {
    label: "蓝队 · GLM-4",
    icon: <Shield size={14} className="text-blue-400" />,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    role: "防御者：审查加固、安全修复",
  },
  judge: {
    label: "裁判 · Strategist",
    icon: <Target size={14} className="text-amber-400" />,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    role: "仲裁者：评分收敛、最终裁决",
  },
} as const;

const MSG_TYPE_COLOR: Record<AdversarialMessage["type"], string> = {
  attack:   "text-rose-400",
  defend:   "text-blue-400",
  verdict:  "text-amber-400",
  thinking: "text-white/40",
  result:   "text-emerald-400",
};

// ── 主组件 ────────────────────────────────────────────────────────────────────

export function RedBlueAdversarialStatus({
  modelId,
  task: externalTask,
  onStart,
  onComplete,
  compact = false,
}: RedBlueAdversarialStatusProps) {
  const [state, setState] = useState<AdversarialState>({
    isConnected: false,
    isRunning: false,
    round: 0,
    maxRounds: 3,
    messages: [],
    redScore: null,
    blueScore: null,
    winner: null,
    status: "idle",
  });
  const [inputTask, setInputTask] = useState(externalTask || "");
  const [expanded, setExpanded] = useState(!compact);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const isStrategicMode = modelId === "maoai-core-2";

  // ── WebSocket ──────────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    if (!isStrategicMode || wsRef.current?.readyState === WebSocket.OPEN) return;
    try {
      const ws = new WebSocket(MAOAI_CORE_2_CONFIG.websocketUrl);

      ws.onopen = () => {
        reconnectCountRef.current = 0;
        setState(prev => ({ ...prev, isConnected: true }));
        ws.send(JSON.stringify({ action: "start_session" }));
      };

      ws.onmessage = (event) => {
        try {
          processMessage(JSON.parse(event.data));
        } catch {}
      };

      ws.onclose = () => {
        setState(prev => ({ ...prev, isConnected: false }));
        const { maxAttempts, intervalMs } = MAOAI_CORE_2_CONFIG.reconnect;
        if (reconnectCountRef.current < maxAttempts) {
          reconnectCountRef.current++;
          reconnectTimerRef.current = setTimeout(() => connect(), intervalMs);
        }
      };

      wsRef.current = ws;
    } catch (e) {
      console.error("[RedBlue] WS connect failed:", e);
    }
  }, [isStrategicMode]);

  const disconnect = () => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    wsRef.current?.close();
    wsRef.current = null;
    setState(prev => ({ ...prev, isConnected: false, isRunning: false }));
  };

  useEffect(() => {
    if (isStrategicMode) connect();
    return () => disconnect();
  }, [isStrategicMode]);

  // ── 消息处理 ───────────────────────────────────────────────────────────────

  const processMessage = (data: Record<string, unknown>) => {
    const action = data.action as string | undefined;

    if (action === "session_started") return;

    // 映射 agent → team
    const agentToTeam = (agent: string): Team => {
      const a = agent.toLowerCase();
      if (a.includes("coder") || a.includes("claude") || a.includes("red")) return "red";
      if (a.includes("reviewer") || a.includes("glm") || a.includes("blue")) return "blue";
      return "judge";
    };

    if (data.content && data.agent) {
      const team = agentToTeam(data.agent as string);
      const msgType: AdversarialMessage["type"] =
        (data.type as string) === "thinking" ? "thinking" :
        team === "red"   ? "attack" :
        team === "blue"  ? "defend" :
        "verdict";

      const msg: AdversarialMessage = {
        team,
        type: msgType,
        content: data.content as string,
        round: (data.round as number) ?? 1,
        timestamp: new Date().toISOString(),
        score: data.score as number | undefined,
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages.slice(-199), msg],
        round: (data.round as number) ?? prev.round,
      }));
    }

    // 收敛
    if ((data.type as string) === "converge") {
      const metadata = data.metadata as Record<string, unknown> | undefined;
      const redScore  = (metadata?.redScore  as number | undefined) ?? null;
      const blueScore = (metadata?.blueScore as number | undefined) ?? null;
      const winner    = redScore !== null && blueScore !== null
        ? redScore > blueScore ? "red" : blueScore > redScore ? "blue" : "draw"
        : null;
      setState(prev => ({
        ...prev,
        isRunning: false,
        status: "completed",
        redScore,
        blueScore,
        winner,
      }));
      if (winner) onComplete?.(winner);
    }
  };

  // ── 启动对抗 ───────────────────────────────────────────────────────────────

  const startAdversarial = () => {
    const task = inputTask.trim();
    if (!task || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    setState(prev => ({
      ...prev,
      isRunning: true,
      status: "running",
      messages: [],
      round: 0,
      redScore: null,
      blueScore: null,
      winner: null,
    }));
    onStart?.(task);

    wsRef.current.send(JSON.stringify({
      action: "submit_task",
      task,
      heterogeneous: true,
      mode: "adversarial",
    }));
  };

  const stopAdversarial = () => {
    wsRef.current?.send(JSON.stringify({ action: "stop_session" }));
    setState(prev => ({ ...prev, isRunning: false, status: "idle" }));
  };

  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages]);

  if (!isStrategicMode) return null;

  const { isConnected, isRunning, round, messages, redScore, blueScore, winner, status } = state;

  // ── 紧凑模式 ──────────────────────────────────────────────────────────────
  if (compact) {
    return (
      <button
        onClick={() => setExpanded(!expanded)}
        className={`
          flex items-center gap-2 px-2 py-1 border text-[10px] transition-all
          ${isRunning
            ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
            : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
          }
        `}
      >
        <Swords size={10} />
        <span>红蓝对抗</span>
        {isRunning && <Loader2 size={8} className="animate-spin" />}
        {winner && <span>{winner === "red" ? "🔴" : winner === "blue" ? "🔵" : "🤝"}</span>}
      </button>
    );
  }

  // ── 完整模式 ──────────────────────────────────────────────────────────────
  return (
    <div className="border border-rose-500/20 bg-[#0a0a0a]">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#1a0a0a] to-[#0a0a1a] border-b border-rose-500/20">
        <div className="flex items-center gap-3">
          <Swords size={12} className="text-rose-400" />
          <span className="text-[10px] text-rose-400 font-bold tracking-widest">RED vs BLUE</span>
          <span className="text-[10px] text-white/30">Phase 6 异构博弈</span>

          {isConnected ? (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <Wifi size={8} className="text-emerald-400" />
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <WifiOff size={8} className="text-white/30" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {winner && (
            <div className={`flex items-center gap-1 px-2 py-0.5 border text-[10px] ${
              winner === "red"  ? "bg-rose-500/20 border-rose-500/30 text-rose-400" :
              winner === "blue" ? "bg-blue-500/20 border-blue-500/30 text-blue-400" :
              "bg-amber-500/20 border-amber-500/30 text-amber-400"
            }`}>
              <CheckCircle2 size={8} />
              {winner === "red" ? "红队胜" : winner === "blue" ? "蓝队胜" : "平局"}
            </div>
          )}
          <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-white/10 text-white/40">
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* 双队状态栏 */}
      <div className="flex items-stretch divide-x divide-white/5">
        {(["red", "blue", "judge"] as Team[]).map(team => {
          const cfg = TEAM_CONFIG[team];
          const score = team === "red" ? redScore : team === "blue" ? blueScore : null;
          const isActive = isRunning;
          return (
            <div key={team} className={`
              flex-1 flex flex-col items-center gap-1 px-3 py-2 transition-all
              ${isActive ? cfg.bg : "bg-black/20"}
            `}>
              <div className="flex items-center gap-1.5">
                {cfg.icon}
                <span className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
              </div>
              <span className="text-[8px] text-white/20 text-center">{cfg.role}</span>
              {score !== null && (
                <span className={`text-[10px] font-mono font-bold ${cfg.color}`}>
                  {score.toFixed(1)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {expanded && (
        <div className="border-t border-white/5">
          {/* 任务输入 + 控制 */}
          <div className="flex items-center gap-2 px-3 py-2 bg-black/40">
            <input
              type="text"
              value={inputTask}
              onChange={e => setInputTask(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !isRunning && startAdversarial()}
              placeholder="输入对抗任务（如：审查这段代码的安全性）"
              className="flex-1 px-2 py-1 bg-white/5 border border-white/10 text-[10px] text-white/70 placeholder-white/20 focus:outline-none focus:border-rose-500/40"
              disabled={isRunning}
            />
            {!isRunning ? (
              <button
                onClick={startAdversarial}
                disabled={!inputTask.trim() || !isConnected}
                className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] hover:bg-rose-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Play size={8} />
                开始对抗
              </button>
            ) : (
              <button
                onClick={stopAdversarial}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 border border-white/20 text-white/60 text-[10px] hover:bg-white/20 transition-all"
              >
                <Square size={8} />
                停止
              </button>
            )}
          </div>

          {/* 消息流 */}
          <div className="max-h-52 overflow-y-auto bg-black/60 p-2 space-y-1">
            {messages.length === 0 ? (
              <div className="text-center text-[10px] text-white/20 py-4">
                {isConnected ? "等待对抗任务..." : "WebSocket 未连接（请确保 ws_server.py 已启动）"}
              </div>
            ) : (
              messages.slice(-30).map((msg, i) => (
                <div key={i} className="flex items-start gap-2 text-[10px]">
                  <span className={`shrink-0 w-2 h-2 mt-0.5 rounded-full ${
                    msg.team === "red" ? "bg-rose-400" :
                    msg.team === "blue" ? "bg-blue-400" : "bg-amber-400"
                  }`} />
                  <span className={`shrink-0 font-medium ${TEAM_CONFIG[msg.team].color}`}>
                    {msg.team === "red" ? "红" : msg.team === "blue" ? "蓝" : "裁"}
                  </span>
                  <span className={`shrink-0 w-10 font-mono ${MSG_TYPE_COLOR[msg.type]}`}>
                    [{msg.type.slice(0, 3)}]
                  </span>
                  <span className="text-white/60 flex-1 leading-relaxed">
                    {msg.content.slice(0, 120)}
                    {msg.content.length > 120 && "..."}
                  </span>
                  {msg.score !== undefined && (
                    <span className="shrink-0 text-emerald-400 font-mono">
                      {msg.score.toFixed(0)}
                    </span>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 底部统计 */}
          <div className="flex items-center justify-between px-4 py-1.5 bg-[#1a1a2e]/50 border-t border-white/5 text-[10px]">
            <div className="flex items-center gap-4 text-white/40">
              <span>Round <span className="text-white/60">{round}</span></span>
              <span>消息 <span className="text-white/60">{messages.length}</span></span>
              <span className={
                status === "running" ? "text-amber-400" :
                status === "completed" ? "text-emerald-400" :
                status === "error" ? "text-red-400" : "text-white/30"
              }>
                {status === "running" ? "对抗中..." :
                 status === "completed" ? "对抗完成" :
                 status === "error" ? "发生错误" : "等待中"}
              </span>
            </div>
            {isRunning && (
              <div className="flex items-center gap-1 text-rose-400">
                <Loader2 size={8} className="animate-spin" />
                <span>博弈进行中</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RedBlueAdversarialStatus;
