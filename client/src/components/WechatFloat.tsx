/*
 * WechatFloat — Fixed floating WeChat contact button
 * Design: dark/gold theme matching site aesthetic
 * Behavior: click to open modal with QR code; click outside or X to close
 */
import { useState, useEffect } from "react";

const WECHAT_QR_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/wechat-qr-sean_f563e2c9.png";

export default function WechatFloat() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  // Show button after slight delay for polish
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Lock body scroll when modal open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Floating button */}
      <div
        className="fixed right-6 bottom-24 z-50 flex flex-col items-center gap-2"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        {/* Pulse ring */}
        <div className="relative">
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ backgroundColor: "rgba(201,168,76,0.35)" }}
          />
          <button
            onClick={() => setOpen(true)}
            aria-label="微信联系"
            className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #1AAD19 0%, #0d8c0c 100%)",
              boxShadow: "0 4px 24px rgba(26,173,25,0.45)",
            }}
          >
            {/* WeChat icon SVG */}
            <svg
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-7 h-7"
            >
              <ellipse cx="14" cy="16" rx="11" ry="9" fill="white" fillOpacity="0.95" />
              <ellipse cx="27" cy="22" rx="9" ry="7.5" fill="white" fillOpacity="0.75" />
              <circle cx="11" cy="15" r="1.8" fill="#1AAD19" />
              <circle cx="17" cy="15" r="1.8" fill="#1AAD19" />
              <circle cx="24.5" cy="21.5" r="1.5" fill="#1AAD19" />
              <circle cx="29.5" cy="21.5" r="1.5" fill="#1AAD19" />
            </svg>
          </button>
        </div>
        {/* Label */}
        <span
          className="text-xs font-medium px-2 py-0.5 rounded"
          style={{
            background: "rgba(13,27,42,0.85)",
            color: "#C9A84C",
            border: "1px solid rgba(201,168,76,0.3)",
            backdropFilter: "blur(4px)",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.05em",
          }}
        >
          微信咨询
        </span>
      </div>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative mx-4 rounded-none"
            style={{
              background: "#0D1B2A",
              border: "1px solid rgba(201,168,76,0.4)",
              boxShadow: "0 0 60px rgba(201,168,76,0.15), 0 24px 64px rgba(0,0,0,0.6)",
              maxWidth: 360,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid rgba(201,168,76,0.2)" }}
            >
              <div>
                <div
                  className="text-xs tracking-widest uppercase mb-1"
                  style={{ color: "rgba(201,168,76,0.6)", fontFamily: "'DM Mono', monospace" }}
                >
                  WeChat · 微信联系
                </div>
                <div
                  className="font-bold text-lg"
                  style={{ color: "white", fontFamily: "'Noto Serif SC', serif" }}
                >
                  代言 Sean DAI
                </div>
                <div className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                  首席品牌增长专家 · 上海 徐汇
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center transition-colors hover:opacity-70"
                style={{ color: "rgba(255,255,255,0.4)" }}
                aria-label="关闭"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* QR Code */}
            <div className="px-6 py-6 flex flex-col items-center">
              <div
                className="p-3 mb-4"
                style={{
                  background: "white",
                  border: "1px solid rgba(201,168,76,0.3)",
                }}
              >
                <img
                  src={WECHAT_QR_URL}
                  alt="微信二维码 - 代言Sean"
                  className="w-48 h-48 object-contain"
                />
              </div>
              <p
                className="text-center text-sm leading-relaxed mb-4"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                扫一扫上面的二维码图案，添加微信好友
              </p>
              <div
                className="w-full text-center py-3 text-sm font-medium"
                style={{
                  background: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  color: "#C9A84C",
                  fontFamily: "'DM Mono', monospace",
                  letterSpacing: "0.05em",
                }}
              >
                ◆ &nbsp; 免费品牌诊断 · 限时开放 &nbsp; ◆
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-6 py-3 text-center text-xs"
              style={{
                borderTop: "1px solid rgba(201,168,76,0.15)",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              工作时间 09:00–22:00 · 通常在1小时内回复
            </div>
          </div>
        </div>
      )}
    </>
  );
}
