/**
 * SuggestedFollowUps Component
 * ─────────────────────────────────────────────────────────────────────────────
 * 在 AI 回复后显示 3 个推荐追问，帮助用户深入探索话题。
 */

import { useTranslation } from "react-i18next";
import { Lightbulb, Loader2, Sparkles } from "lucide-react";
import { SUGGESTION_DIMENSIONS } from "../constants";
import type { SuggestedQuestion } from "../types";

export type SuggestedFollowUpsProps = {
  /** 生成的推荐追问列表 */
  suggestions: SuggestedQuestion[];
  /** 点击发送追问的回调 */
  onSend: (question: string) => void;
  /** 是否正在生成中 */
  isLoading?: boolean;
  /** 是否禁用交互 */
  disabled?: boolean;
};

export function SuggestedFollowUps({
  suggestions,
  onSend,
  isLoading = false,
  disabled = false,
}: SuggestedFollowUpsProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language || "zh";
  const isChinese = locale.startsWith("zh");

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
    <div className="mt-3 p-3 bg-[#C9A84C]/5 border border-[#C9A84C]/15 rounded-lg animate-fade-in">
      {/* 标题 */}
      <div className="flex items-center gap-2 text-[11px] text-[#C9A84C]/70 mb-2">
        <Lightbulb size={12} />
        <span className="font-medium">{isChinese ? "推荐追问" : "Suggested Follow-ups"}</span>
        <span className="text-white/20">·</span>
        <span className="text-white/40">{isChinese ? "点击直接发送" : "Click to send"}</span>
      </div>

      {/* 建议按钮 */}
      <div className="flex flex-col sm:flex-row gap-2">
        {suggestions.map((s, i) => {
          const dim = SUGGESTION_DIMENSIONS[s.dimension];
          const label = isChinese ? dim.label : dim.labelEn;
          
          return (
            <button
              key={i}
              onClick={() => onSend(s.question)}
              disabled={disabled}
              className="group flex items-center gap-2 px-3 py-2 text-left text-sm bg-white/5 hover:bg-[#C9A84C]/10 border border-white/10 hover:border-[#C9A84C]/30 text-white/70 hover:text-white/90 transition-all rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-base shrink-0">{dim.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] uppercase tracking-wider text-white/30 group-hover:text-[#C9A84C]/60 transition-colors">
                  {label}
                </div>
                <div className="truncate font-medium">{s.question}</div>
              </div>
              <Sparkles size={12} className="shrink-0 opacity-0 group-hover:opacity-50 transition-opacity text-[#C9A84C]" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
