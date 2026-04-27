/**
 * SuggestedFollowUps Component
 * ─────────────────────────────────────────────────────────────────────────────
 * 在 AI 回复后显示 3 个推荐追问，帮助用户深入探索话题。
 *
 * 支持两种来源：
 * 1. 普通 AI 回复后的通用追问（deep/creative/practical/comparison/summary）
 * 2. TriadLoop 任务完成后的专项追问（immediate/risk/strategic）
 */

import { useTranslation } from "react-i18next";
import { Lightbulb, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { SUGGESTION_DIMENSIONS } from "../constants";
import type { SuggestedQuestion } from "../types";

export type FollowUpSource = "general" | "triad";

export type SuggestedFollowUpsProps = {
  /** 生成的推荐追问列表 */
  suggestions: SuggestedQuestion[];
  /** 点击发送追问的回调 */
  onSend: (question: string) => void;
  /** 是否正在生成中 */
  isLoading?: boolean;
  /** 是否禁用交互 */
  disabled?: boolean;
  /** 来源：general=普通回复, triad=TriadLoop任务完成 */
  source?: FollowUpSource;
  /** TriadLoop 任务名称（source=triad 时显示） */
  taskName?: string;
  /** TriadLoop 完成度分数（source=triad 时显示） */
  completionScore?: number;
};

export function SuggestedFollowUps({
  suggestions,
  onSend,
  isLoading = false,
  disabled = false,
  source = "general",
  taskName,
  completionScore,
}: SuggestedFollowUpsProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language || "zh";
  const isChinese = locale.startsWith("zh");

  const isTriad = source === "triad";

  if (isLoading) {
    return (
      <div className="mt-3 p-3 bg-[#C9A84C]/5 border border-[#C9A84C]/15 rounded-lg">
        <div className="flex items-center gap-2 text-[11px] text-[#C9A84C]/60 mb-2">
          <Loader2 size={12} className="animate-spin" />
          <span>{isChinese ? "正在生成建议..." : "Generating suggestions..."}</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-1 h-9 bg-white/5 animate-pulse rounded border border-white/10"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      className={`mt-3 p-3 rounded-lg animate-fade-in ${
        isTriad
          ? "bg-emerald-950/30 border border-emerald-500/20"
          : "bg-[#C9A84C]/5 border border-[#C9A84C]/15"
      }`}
    >
      {/* 标题行 */}
      <div className="flex items-center justify-between mb-2">
        <div
          className={`flex items-center gap-2 text-[11px] ${
            isTriad ? "text-emerald-400/70" : "text-[#C9A84C]/70"
          }`}
        >
          {isTriad ? (
            <>
              <CheckCircle2 size={12} className="text-emerald-400" />
              <span className="font-medium">
                {isChinese ? "任务完成 · 继续优化" : "Task Done · Keep Improving"}
              </span>
            </>
          ) : (
            <>
              <Lightbulb size={12} />
              <span className="font-medium">
                {isChinese ? "推荐追问" : "Suggested Follow-ups"}
              </span>
            </>
          )}
          <span className="text-white/20">·</span>
          <span className="text-white/40">
            {isChinese ? "点击直接发送" : "Click to send"}
          </span>
        </div>

        {/* TriadLoop 完成度徽章 */}
        {isTriad && completionScore !== undefined && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            {Math.round(completionScore * 100)}%
          </span>
        )}
      </div>

      {/* 任务名称（TriadLoop 模式） */}
      {isTriad && taskName && (
        <div className="mb-2 text-[11px] text-white/30 truncate">
          ↳ {taskName}
        </div>
      )}

      {/* 建议按钮 */}
      <div className="flex flex-col sm:flex-row gap-2">
        {suggestions.map((s, i) => {
          const dim = SUGGESTION_DIMENSIONS[s.dimension] ?? SUGGESTION_DIMENSIONS["deep"];
          const label = isChinese ? dim.label : dim.labelEn;

          const isRisk = s.dimension === "risk";
          const isStrategic = s.dimension === "strategic";
          const isImmediate = s.dimension === "immediate";

          return (
            <button
              key={i}
              onClick={() => onSend(s.question)}
              disabled={disabled}
              className={`group flex items-center gap-2 px-3 py-2 text-left text-sm border transition-all rounded disabled:opacity-50 disabled:cursor-not-allowed
                ${isRisk
                  ? "bg-amber-950/20 hover:bg-amber-900/30 border-amber-500/15 hover:border-amber-500/35 text-amber-200/70 hover:text-amber-200/90"
                  : isStrategic
                  ? "bg-sky-950/20 hover:bg-sky-900/30 border-sky-500/15 hover:border-sky-500/35 text-sky-200/70 hover:text-sky-200/90"
                  : isImmediate
                  ? "bg-emerald-950/20 hover:bg-emerald-900/30 border-emerald-500/15 hover:border-emerald-500/35 text-emerald-200/70 hover:text-emerald-200/90"
                  : "bg-white/5 hover:bg-[#C9A84C]/10 border-white/10 hover:border-[#C9A84C]/30 text-white/70 hover:text-white/90"
                }`}
            >
              <span className="text-base shrink-0">{dim.emoji}</span>
              <div className="min-w-0 flex-1">
                <div
                  className={`text-[10px] uppercase tracking-wider transition-colors
                    ${isRisk
                      ? "text-amber-400/40 group-hover:text-amber-400/60"
                      : isStrategic
                      ? "text-sky-400/40 group-hover:text-sky-400/60"
                      : isImmediate
                      ? "text-emerald-400/40 group-hover:text-emerald-400/60"
                      : "text-white/30 group-hover:text-[#C9A84C]/60"
                    }`}
                >
                  {label}
                </div>
                <div className="truncate font-medium">{s.question}</div>
                {/* suggested_action hint（TriadLoop 模式，hover 显示）*/}
                {(s as any).suggestedAction && (
                  <div className="hidden group-hover:block text-[10px] mt-0.5 opacity-50 truncate">
                    → {(s as any).suggestedAction}
                  </div>
                )}
              </div>
              <Sparkles
                size={12}
                className={`shrink-0 opacity-0 group-hover:opacity-50 transition-opacity
                  ${isRisk ? "text-amber-400" : isStrategic ? "text-sky-400" : "text-[#C9A84C]"}`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
