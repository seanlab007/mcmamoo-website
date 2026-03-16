/*
 * Platform Page — 猫眼运营平台
 * 将猫眼自动运营平台（localhost:8766）嵌入官网
 * 以全屏 iframe 方式展示，并提供独立标签页打开入口
 */
import { useState } from "react";
import { ExternalLink, Loader2, AlertCircle, RefreshCw } from "lucide-react";

const PLATFORM_URL = "http://localhost:8766";

export default function Platform() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
      iframe.src = PLATFORM_URL;
    }
  };

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
            href={PLATFORM_URL}
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
        {loading && (
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
                无法访问运营平台，请确认服务已在本地启动
              </div>
              <div className="text-white/25 text-xs font-mono mb-6">
                cd ~/WorkBuddy/20260314214658 &amp;&amp; bash start.sh
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
                href={PLATFORM_URL}
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

        {/* 平台 iframe */}
        <iframe
          id="platform-iframe"
          src={PLATFORM_URL}
          className="w-full h-full border-0"
          title="猫眼运营平台"
          onLoad={handleLoad}
          onError={handleError}
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
