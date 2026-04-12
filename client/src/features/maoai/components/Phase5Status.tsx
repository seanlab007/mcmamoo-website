import { useState } from "react";
import { Zap, Scissors, AlertCircle } from "lucide-react";

/**
 * AtomicModeToggle - 原子化/传统模式切换
 *
 * Phase 5 核心 UI：
 * - 原子化模式：只传输 diff，Token 节省 90%+
 * - 传统模式：输出完整代码
 */
interface AtomicModeToggleProps {
  enabled?: boolean;
  onChange: (enabled: boolean) => void;
  compact?: boolean;
}

export function AtomicModeToggle({ enabled = true, onChange, compact = false }: AtomicModeToggleProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  if (compact) {
    return (
      <button
        onClick={() => onChange(!enabled)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          relative flex items-center gap-1.5 px-2 py-1 text-[10px] border transition-all
          ${enabled
            ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
            : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
          }
        `}
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        <Zap size={10} />
        <span>{enabled ? "原子" : "传统"}</span>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute left-0 top-full mt-1 w-48 p-2 bg-[#111] border border-white/10 text-[10px] text-white/60 z-50 shadow-xl">
            <div className="font-medium text-white/80 mb-1">
              {enabled ? "原子化模式" : "传统模式"}
            </div>
            {enabled ? (
              <>
                <div>只传输 diff，节省 90%+ Token</div>
                <div className="mt-1 text-emerald-400/60">点击切换为传统模式</div>
              </>
            ) : (
              <>
                <div>输出完整代码，精确控制</div>
                <div className="mt-1 text-amber-400/60">点击切换为原子化模式</div>
              </>
            )}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-black/20 border border-white/5">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <Scissors size={14} className={enabled ? "text-emerald-400" : "text-white/30"} />
        <span className="text-xs font-medium text-white/70">代码生成模式</span>
      </div>

      {/* 切换按钮 */}
      <div className="flex-1 flex items-center gap-2">
        {/* 原子化模式 */}
        <button
          onClick={() => onChange(true)}
          className={`
            flex-1 flex items-center gap-2 px-3 py-2 border transition-all text-left
            ${enabled
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
            }
          `}
        >
          <Zap size={12} />
          <div>
            <div className="text-xs font-medium">原子化模式</div>
            <div className="text-[10px] opacity-60">只传输 diff，Token 节省 90%+</div>
          </div>
        </button>

        {/* 传统模式 */}
        <button
          onClick={() => onChange(false)}
          className={`
            flex-1 flex items-center gap-2 px-3 py-2 border transition-all text-left
            ${!enabled
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
            }
          `}
        >
          <FileIcon size={12} />
          <div>
            <div className="text-xs font-medium">传统模式</div>
            <div className="text-[10px] opacity-60">输出完整代码</div>
          </div>
        </button>
      </div>

      {/* 提示 */}
      {enabled && (
        <div className="flex items-center gap-1 text-[10px] text-emerald-400/50">
          <Zap size={8} />
          <span>推荐</span>
        </div>
      )}
    </div>
  );
}

// 简单的 File 图标组件
function FileIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

/**
 * CodeRAGIndicator - Code RAG 状态指示器
 *
 * 显示 RAG 检索状态和节省的 Token 数
 */
interface CodeRAGIndicatorProps {
  enabled: boolean;
  chunksRetrieved?: number;
  tokenSaved?: number;
}

export function CodeRAGIndicator({ enabled, chunksRetrieved = 0, tokenSaved = 0 }: CodeRAGIndicatorProps) {
  if (!enabled) return null;

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-400">
      <BookOpen size={10} />
      <span>RAG</span>
      {chunksRetrieved > 0 && (
        <span className="opacity-60">{chunksRetrieved} 片段</span>
      )}
      {tokenSaved > 0 && (
        <span className="opacity-60">-{tokenSaved}t</span>
      )}
    </div>
  );
}

/**
 * TokenStats - Token 节省统计
 */
interface TokenStatsProps {
  totalSaved: number;
  messagesProcessed: number;
}

export function TokenStats({ totalSaved, messagesProcessed }: TokenStatsProps) {
  if (totalSaved === 0) return null;

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-emerald-500/5 border border-emerald-500/20 text-[11px]">
      <div className="flex items-center gap-1.5">
        <Zap size={12} className="text-emerald-400" />
        <span className="text-emerald-400 font-medium">
          节省 {totalSaved.toLocaleString()} tokens
        </span>
      </div>
      <div className="text-white/40">
        ({messagesProcessed} 条消息)
      </div>
      <div className="text-emerald-400/60">
        ≈ ${(totalSaved / 1000 * 0.01).toFixed(2)}
      </div>
    </div>
  );
}

/**
 * Phase5Status - Phase 5 状态栏
 *
 * 显示所有 Phase 5 功能的状态
 */
interface Phase5StatusProps {
  atomicMode: boolean;
  codeRAGEnabled: boolean;
  tokenSaved: number;
  messagesProcessed: number;
  onToggleAtomic: (enabled: boolean) => void;
}

export function Phase5Status({
  atomicMode,
  codeRAGEnabled,
  tokenSaved,
  messagesProcessed,
  onToggleAtomic
}: Phase5StatusProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* 原子化模式开关 */}
      <AtomicModeToggle enabled={atomicMode} onChange={onToggleAtomic} compact />

      {/* RAG 指示器 */}
      <CodeRAGIndicator enabled={codeRAGEnabled} />

      {/* Token 节省 */}
      {tokenSaved > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400">
          <Zap size={8} />
          <span>-{tokenSaved.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

export default AtomicModeToggle;
