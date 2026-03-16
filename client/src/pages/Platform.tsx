/*
 * Platform Page — 猫眼运营平台
 * 将猫眼自动运营平台嵌入官网
 * 已登录用户：iframe 携带 ?uid= 传入 Supabase user_id，供后端双轨 AI 路由鉴权
 * 未登录：跳转登录页
 */
import { useState } from "react";
import { ExternalLink, Loader2, AlertCircle, RefreshCw, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";

// 运营平台后端地址（本地或云端）
const PLATFORM_BASE_URL = import.meta.env.VITE_PLATFORM_URL || "http://localhost:8766";

export default function Platform() {
  const { data: me, isLoading: authLoading } = trpc.auth.me.useQuery();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 构造带用户身份的 URL
  const platformUrl = me?.id
    ? `${PLATFORM_BASE_URL}?uid=${encodeURIComponent(String(me.id))}`
    : PLATFORM_BASE_URL;

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(false);
    const iframe = document.getElementById("platform-iframe") as HTMLIFrameElement;
    if (iframe) {
      iframe.src = platformUrl;
    }
  };

  // 未登录提示
  if (!authLoading && !me) {
    return (
      <div className="flex flex-col h-screen bg-[#0A0A0A] items-center justify-center gap-6">
        <Lock size={40} className="text-[#C9A84C]/60" />
        <div className="text-center">
          <div className="text-white/80 font-semibold text-lg mb-2">需要登录</div>
          <div className="text-white/40 text-sm mb-6">
            运营平台为付费功能，请先登录后使用
          </div>
          <a
            href="/login"
            className="px-6 py-2.5 rounded bg-[#C9A84C] text-black text-sm font-semibold hover:bg-[#e8c96a] transition-all"
          >
            立即登录
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0A0A0A]">
      {/* 顶部栏 */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 h-12 bg-[#111118] border-b border-white/5">
        <div className="flex items-center gap-3">
          {/* 返回官网 */}
          <a
            href="/"
            className="flex items-center gap-2 text-[#C9A84C] hover:text-[#e8c96a] transition-colors text-sm"
          >
            <span className="text-lg">←</span>
            <span className="font-['Cormorant_Garamond'] tracking-wide">Mc&amp;Mamoo</span>
          </a>
          <span className="text-white/15">/</span>
          <span className="text-white/50 text-sm">猫眼运营平台</span>
        </div>

        <div className="flex items-center gap-3">
          {/* 当前用户 */}
          {me && (
            <span className="text-white/30 text-xs">
              {me.name || me.email || "已登录"}
            </span>
          )}
          {/* 刷新按钮 */}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 transition-all"
          >
            <RefreshCw size={12} />
            刷新
          </button>
          {/* 新标签页打开 */}
          <a
            href={platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-[#C9A84C] border border-[#C9A84C]/40 hover:bg-[#C9A84C]/10 transition-all"
          >
            <ExternalLink size={12} />
            独立窗口
          </a>
        </div>
      </div>

      {/* iframe 容器 */}
      <div className="flex-1 relative">
        {/* 加载中 */}
        {(authLoading || loading) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f] z-10 gap-4">
            <Loader2 size={32} className="text-[#C9A84C] animate-spin" />
            <div className="text-white/50 text-sm">正在加载猫眼运营平台...</div>
          </div>
        )}

        {/* 加载失败 */}
        {error && !loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0f] z-10 gap-5">
            <AlertCircle size={40} className="text-red-400/70" />
            <div className="text-center">
              <div className="text-white/80 font-semibold mb-1">连接失败</div>
              <div className="text-white/40 text-sm mb-4">
                运营平台暂时无法访问，请稍后重试
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 px-4 py-2 rounded border border-[#C9A84C]/50 text-[#C9A84C] text-sm hover:bg-[#C9A84C]/10 transition-all"
              >
                <RefreshCw size={14} />
                重试
              </button>
              <a
                href={platformUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded border border-white/20 text-white/60 text-sm hover:bg-white/5 transition-all"
              >
                <ExternalLink size={14} />
                直接访问
              </a>
            </div>
          </div>
        )}

        {/* 平台 iframe（auth 加载完才渲染，避免 URL 中 uid 不对） */}
        {!authLoading && (
          <iframe
            id="platform-iframe"
            src={platformUrl}
            className="w-full h-full border-0"
            title="猫眼运营平台"
            onLoad={handleLoad}
            onError={handleError}
            allow="clipboard-read; clipboard-write"
          />
        )}
      </div>
    </div>
  );
}
