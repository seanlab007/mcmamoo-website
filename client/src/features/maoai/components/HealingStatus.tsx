/**
 * HealingStatus - 自愈过程可视化组件
 * ═══════════════════════════════════════════════════════════════════════════════
 * 实时显示 HealingAgent 的自愈过程：错误检测 → 分析 → 生成补丁 → 验证 → 应用
 *
 * @author MaoAI Core 2.0
 * @version 3.0.0 "破壁者"
 */

import React, { useEffect, useState } from "react";
import { AlertCircle, Bandage, CheckCircle, XCircle, RefreshCw, Activity } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HealingPatch {
  patch_id: string;
  explanation: string;
  confidence: number;
  validation_result?: boolean;
}

interface HealingReport {
  error_hash: string;
  error_type: string;
  function?: string;
  status: "detected" | "analyzing" | "generating" | "validating" | "applied" | "failed" | "escalated";
  attempts: number;
  max_attempts: number;
  duration_ms: number;
  patches: HealingPatch[];
  timestamp: string;
}

interface HealingStatusProps {
  report?: HealingReport;
  isActive?: boolean;
  compact?: boolean;
}

// ─── Components ───────────────────────────────────────────────────────────────

export const HealingStatus: React.FC<HealingStatusProps> = ({
  report,
  isActive = false,
  compact = false,
}) => {
  const [animatedDots, setAnimatedDots] = useState("");

  // 动画效果
  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setAnimatedDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    
    return () => clearInterval(interval);
  }, [isActive]);

  // 状态配置
  const statusConfig = {
    detected: {
      icon: AlertCircle,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/30",
      label: "发现异常",
    },
    analyzing: {
      icon: Activity,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      label: "分析根因",
    },
    generating: {
      icon: RefreshCw,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      label: "生成补丁",
    },
    validating: {
      icon: Activity,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30",
      label: "验证补丁",
    },
    applied: {
      icon: CheckCircle,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      label: "修复成功",
    },
    failed: {
      icon: XCircle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      label: "修复失败",
    },
    escalated: {
      icon: AlertCircle,
      color: "text-orange-400",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30",
      label: "升级人工",
    },
  };

  // 紧凑模式
  if (compact) {
    if (!report && !isActive) return null;
    
    const status = report?.status || "analyzing";
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <div
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full
          ${config.bgColor} border ${config.borderColor}
          text-xs font-medium ${config.color}
          animate-pulse
        `}
      >
        <Icon className="w-3.5 h-3.5" />
        <span>🩹 {config.label}{animatedDots}</span>
        {report && (
          <span className="opacity-60">
            ({report.attempts}/{report.max_attempts})
          </span>
        )}
      </div>
    );
  }

  // 完整模式
  if (!report && !isActive) {
    return (
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-700/50 text-center">
        <Bandage className="w-12 h-12 mx-auto text-slate-500 mb-3" />
        <p className="text-slate-400 text-sm">自愈系统待命中</p>
        <p className="text-slate-500 text-xs mt-1">当出现运行时异常时将自动启动</p>
      </div>
    );
  }

  const status = report?.status || "analyzing";
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`
      rounded-xl border ${config.borderColor} ${config.bgColor} overflow-hidden
      transition-all duration-300
    `}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.color} ${isActive ? "animate-spin" : ""}`} />
          <span className={`font-semibold ${config.color}`}>
            🩹 HealingAgent {config.label}{animatedDots}
          </span>
        </div>
        {report && (
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>尝试: {report.attempts}/{report.max_attempts}</span>
            <span>耗时: {report.duration_ms}ms</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* 错误信息 */}
        {report?.error_type && (
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-rose-400 font-medium">{report.error_type}</span>
              {report.function && (
                <span className="text-slate-500 ml-2">in {report.function}()</span>
              )}
            </div>
          </div>
        )}

        {/* 进度条 */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>修复进度</span>
            <span>{getProgressPercent(status)}%</span>
          </div>
          <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                status === "applied"
                  ? "bg-emerald-500 w-full"
                  : status === "failed" || status === "escalated"
                  ? "bg-red-500 w-full"
                  : "bg-amber-500 animate-pulse"
              }`}
              style={{ width: `${getProgressPercent(status)}%` }}
            />
          </div>
        </div>

        {/* 补丁列表 */}
        {report?.patches && report.patches.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              生成的补丁
            </h4>
            {report.patches.map((patch, idx) => (
              <div
                key={patch.patch_id}
                className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 text-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 font-mono text-xs">
                    #{idx + 1} {patch.patch_id.slice(0, 8)}...
                  </span>
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full
                    ${patch.confidence > 0.8
                      ? "bg-emerald-500/20 text-emerald-400"
                      : patch.confidence > 0.5
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-red-500/20 text-red-400"
                    }
                  `}>
                    置信度: {Math.round(patch.confidence * 100)}%
                  </span>
                </div>
                <p className="text-slate-400 text-xs">{patch.explanation}</p>
                {patch.validation_result !== undefined && (
                  <div className="mt-2 flex items-center gap-1 text-xs">
                    {patch.validation_result ? (
                      <>
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">验证通过</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-red-400" />
                        <span className="text-red-400">验证失败</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 时间戳 */}
        {report?.timestamp && (
          <div className="text-right text-xs text-slate-500">
            {new Date(report.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getProgressPercent(status: string): number {
  const progressMap: Record<string, number> = {
    detected: 10,
    analyzing: 25,
    generating: 50,
    validating: 75,
    applied: 100,
    failed: 100,
    escalated: 100,
  };
  return progressMap[status] || 0;
}

// ─── Default Export ───────────────────────────────────────────────────────────

export default HealingStatus;
