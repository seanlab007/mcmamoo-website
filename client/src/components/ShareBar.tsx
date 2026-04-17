/*
 * ShareBar — 案例页分享功能组件
 * 功能：微信/朋友圈（二维码弹窗）、复制链接、X.com 分享
 * Design: 与案例页暗金风格一致
 */
import { useState } from "react";

interface ShareBarProps {
  title: string;       // 案例标题，用于分享文案
  description?: string; // 分享描述
}

export default function ShareBar({ title, description }: ShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
<<<<<<< HEAD
  const shareText = `${title} — 猫眼咨询标杆案例 | ${description || ""}`;
=======
  const shareText = `${title} — 猫眼增长引擎 (Mc&Mamoo Growth Engine)增长引擎 (Mc&Mamoo Growth Engine)标杆案例 | ${description || ""}`;
>>>>>>> origin/fix/final-navbar-restructure-1774631973

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement("textarea");
      el.value = currentUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleXShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      {/* Share bar */}
      <div
        className="flex items-center gap-3 flex-wrap"
        style={{ padding: "12px 0" }}
      >
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(245,240,232,0.3)", letterSpacing: "0.15em" }}>
          SHARE
        </span>

        {/* WeChat / 朋友圈 */}
        <button
          onClick={() => setShowQR(true)}
          title="分享到微信"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 14px",
            background: "rgba(7,193,96,0.08)",
            border: "1px solid rgba(7,193,96,0.25)",
            color: "rgba(7,193,96,0.8)",
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.62rem",
            letterSpacing: "0.1em",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(7,193,96,0.14)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(7,193,96,0.08)")}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.5 10.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 13v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          微信分享
        </button>

        {/* Copy link */}
        <button
          onClick={handleCopyLink}
          title="复制链接"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 14px",
            background: copied ? "rgba(201,168,76,0.12)" : "rgba(201,168,76,0.06)",
            border: `1px solid ${copied ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.2)"}`,
            color: copied ? "#C9A84C" : "rgba(201,168,76,0.6)",
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.62rem",
            letterSpacing: "0.1em",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          {copied ? "已复制 ✓" : "复制链接"}
        </button>

        {/* X.com */}
        <button
          onClick={handleXShare}
          title="分享到 X (Twitter)"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 14px",
            background: "rgba(245,240,232,0.04)",
            border: "1px solid rgba(245,240,232,0.12)",
            color: "rgba(245,240,232,0.45)",
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.62rem",
            letterSpacing: "0.1em",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(245,240,232,0.08)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(245,240,232,0.04)")}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          X.com
        </button>
      </div>

      {/* WeChat QR modal */}
      {showQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowQR(false)}
        >
          <div
            className="relative p-8 text-center"
            style={{ background: "#111", border: "1px solid rgba(201,168,76,0.3)", maxWidth: 320, width: "90%" }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQR(false)}
              style={{ position: "absolute", top: 12, right: 16, background: "none", border: "none", color: "rgba(245,240,232,0.4)", fontSize: "1.2rem", cursor: "pointer" }}
            >
              ✕
            </button>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(201,168,76,0.6)", letterSpacing: "0.2em", marginBottom: 16 }}>
              SHARE VIA WECHAT
            </div>
            <div style={{ fontFamily: "'Noto Serif SC', serif", color: "#F5F0E8", fontSize: "1rem", fontWeight: 700, marginBottom: 6 }}>
              分享此案例
            </div>
            <p style={{ color: "rgba(245,240,232,0.5)", fontSize: "0.8rem", lineHeight: 1.7, marginBottom: 20 }}>
              截图后在微信中识别二维码，或直接复制下方链接发送给好友
            </p>
            {/* Link display */}
            <div
              style={{
                background: "rgba(201,168,76,0.05)",
                border: "1px solid rgba(201,168,76,0.15)",
                padding: "10px 14px",
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.6rem",
                color: "rgba(245,240,232,0.5)",
                wordBreak: "break-all",
                marginBottom: 12,
                textAlign: "left",
              }}
            >
              {currentUrl}
            </div>
            <button
              onClick={handleCopyLink}
              style={{
                width: "100%", padding: "10px",
                background: copied ? "#C9A84C" : "rgba(201,168,76,0.12)",
                border: "1px solid rgba(201,168,76,0.3)",
                color: copied ? "#0A0A0A" : "#C9A84C",
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.12em",
                cursor: "pointer",
                transition: "all 0.2s",
                fontWeight: copied ? 700 : 400,
              }}
            >
              {copied ? "链接已复制 ✓" : "复制页面链接"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
