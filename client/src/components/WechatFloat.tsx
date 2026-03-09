/*
 * WechatFloat — Fixed floating contact button with multi-channel modal
 * Design: dark/gold theme matching site aesthetic
 * Features:
 *   - Scroll-triggered visibility (shows after passing hero section)
 *   - WeChat QR + copy WeChat ID
 *   - Phone / WhatsApp call link
 *   - Telegram / Instagram / X placeholders (shown when configured)
 */
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

const WECHAT_QR_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663405311158/V3i2B4simdfhuwmzceY7AV/wechat-qr-sean_f563e2c9.png";

const CONTACT = {
  wechatId: "K70727072",
  phone: "13764597723",
  whatsapp: "8613764597723", // international format
  telegram: "",   // fill when ready
  instagram: "",  // fill when ready
  twitter: "",    // fill when ready
};

// ─── Icon components ──────────────────────────────────────────────────────────

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.59.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.01l-2.2 2.21z" />
    </svg>
  );
}

function IconWhatsApp() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.847L0 24l6.335-1.508A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-5.003-1.366l-.36-.213-3.76.895.952-3.665-.235-.376A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
    </svg>
  );
}

function IconTelegram() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.19 13.967l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.958.592z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function WechatFloat() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [copied, setCopied] = useState(false);

  // Show button only after scrolling past hero (~100vh)
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(CONTACT.wechatId).then(() => {
      setCopied(true);
      toast.success("微信号已复制", { description: CONTACT.wechatId, duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const channelBtnClass =
    "flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all duration-200 border hover:scale-[1.02] active:scale-95";

  return (
    <>
      {/* ── Floating trigger button ── */}
      <div
        className="fixed right-6 bottom-24 z-50 flex flex-col items-center gap-2"
        style={{
          opacity: scrolled ? 1 : 0,
          transform: scrolled ? "translateY(0)" : "translateY(16px)",
          pointerEvents: scrolled ? "auto" : "none",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        <div className="relative">
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ backgroundColor: "rgba(201,168,76,0.3)" }}
          />
          <button
            onClick={() => setOpen(true)}
            aria-label="联系我们"
            className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #1AAD19 0%, #0d8c0c 100%)",
              boxShadow: "0 4px 24px rgba(26,173,25,0.45)",
            }}
          >
            <svg viewBox="0 0 40 40" fill="none" className="w-7 h-7">
              <ellipse cx="14" cy="16" rx="11" ry="9" fill="white" fillOpacity="0.95" />
              <ellipse cx="27" cy="22" rx="9" ry="7.5" fill="white" fillOpacity="0.75" />
              <circle cx="11" cy="15" r="1.8" fill="#1AAD19" />
              <circle cx="17" cy="15" r="1.8" fill="#1AAD19" />
              <circle cx="24.5" cy="21.5" r="1.5" fill="#1AAD19" />
              <circle cx="29.5" cy="21.5" r="1.5" fill="#1AAD19" />
            </svg>
          </button>
        </div>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded"
          style={{
            background: "rgba(13,27,42,0.9)",
            color: "#C9A84C",
            border: "1px solid rgba(201,168,76,0.3)",
            backdropFilter: "blur(4px)",
            fontFamily: "'DM Mono', monospace",
            letterSpacing: "0.05em",
          }}
        >
          联系我们
        </span>
      </div>

      {/* ── Modal overlay ── */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full"
            style={{ maxWidth: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "#0D1B2A",
                border: "1px solid rgba(201,168,76,0.4)",
                boxShadow: "0 0 60px rgba(201,168,76,0.12), 0 24px 64px rgba(0,0,0,0.7)",
              }}
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
                    Contact · 联系我们
                  </div>
                  <div className="font-bold text-lg text-white" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                    代言 Sean DAI
                  </div>
                  <div className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                    首席品牌增长专家 · 上海 徐汇
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 flex items-center justify-center hover:opacity-70 transition-opacity"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                  aria-label="关闭"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* QR Code */}
              <div className="px-6 pt-5 pb-3 flex flex-col items-center">
                <div className="p-3 mb-3" style={{ background: "white", border: "1px solid rgba(201,168,76,0.3)" }}>
                  <img src={WECHAT_QR_URL} alt="微信二维码" className="w-44 h-44 object-contain" />
                </div>
                <p className="text-center text-sm mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
                  扫一扫二维码，添加微信好友
                </p>

                {/* Copy WeChat ID */}
                <div
                  className="w-full flex items-center justify-between px-4 py-2.5 mb-4"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(201,168,76,0.2)",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono', monospace" }}>
                      微信号
                    </span>
                    <span className="text-sm font-medium text-white" style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>
                      {CONTACT.wechatId}
                    </span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all duration-200 hover:opacity-80 active:scale-95"
                    style={{
                      background: copied ? "rgba(26,173,25,0.15)" : "rgba(201,168,76,0.12)",
                      border: `1px solid ${copied ? "rgba(26,173,25,0.5)" : "rgba(201,168,76,0.35)"}`,
                      color: copied ? "#1AAD19" : "#C9A84C",
                    }}
                  >
                    {copied ? <IconCheck /> : <IconCopy />}
                    {copied ? "已复制" : "复制"}
                  </button>
                </div>

                {/* Promo banner */}
                <div
                  className="w-full text-center py-2.5 text-xs font-medium mb-4"
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

              {/* Multi-channel contact */}
              <div
                className="px-6 pb-5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  className="text-xs tracking-widest uppercase pt-4 mb-3"
                  style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}
                >
                  其他联系方式
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {/* Phone */}
                  <a
                    href={`tel:+${CONTACT.phone}`}
                    className={channelBtnClass}
                    style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.03)" }}
                  >
                    <IconPhone />
                    <span>电话拨打</span>
                  </a>

                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/${CONTACT.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={channelBtnClass}
                    style={{ borderColor: "rgba(37,211,102,0.3)", color: "rgba(37,211,102,0.85)", background: "rgba(37,211,102,0.05)" }}
                  >
                    <IconWhatsApp />
                    <span>WhatsApp</span>
                  </a>

                  {/* Telegram */}
                  <a
                    href={CONTACT.telegram ? `https://t.me/${CONTACT.telegram}` : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={channelBtnClass}
                    style={{
                      borderColor: CONTACT.telegram ? "rgba(0,136,204,0.35)" : "rgba(255,255,255,0.08)",
                      color: CONTACT.telegram ? "rgba(0,136,204,0.85)" : "rgba(255,255,255,0.2)",
                      background: CONTACT.telegram ? "rgba(0,136,204,0.06)" : "rgba(255,255,255,0.02)",
                      pointerEvents: CONTACT.telegram ? "auto" : "none",
                    }}
                  >
                    <IconTelegram />
                    <span>Telegram</span>
                    {!CONTACT.telegram && <span className="text-[10px] ml-auto opacity-40">即将开通</span>}
                  </a>

                  {/* Instagram */}
                  <a
                    href={CONTACT.instagram ? `https://instagram.com/${CONTACT.instagram}` : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={channelBtnClass}
                    style={{
                      borderColor: CONTACT.instagram ? "rgba(225,48,108,0.35)" : "rgba(255,255,255,0.08)",
                      color: CONTACT.instagram ? "rgba(225,48,108,0.85)" : "rgba(255,255,255,0.2)",
                      background: CONTACT.instagram ? "rgba(225,48,108,0.05)" : "rgba(255,255,255,0.02)",
                      pointerEvents: CONTACT.instagram ? "auto" : "none",
                    }}
                  >
                    <IconInstagram />
                    <span>Instagram</span>
                    {!CONTACT.instagram && <span className="text-[10px] ml-auto opacity-40">即将开通</span>}
                  </a>

                  {/* X / Twitter */}
                  <a
                    href={CONTACT.twitter ? `https://x.com/${CONTACT.twitter}` : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${channelBtnClass} col-span-2`}
                    style={{
                      borderColor: CONTACT.twitter ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
                      color: CONTACT.twitter ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)",
                      background: CONTACT.twitter ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                      pointerEvents: CONTACT.twitter ? "auto" : "none",
                      justifyContent: "center",
                    }}
                  >
                    <IconX />
                    <span>X (Twitter)</span>
                    {!CONTACT.twitter && <span className="text-[10px] ml-2 opacity-40">即将开通</span>}
                  </a>
                </div>
              </div>

              {/* Footer */}
              <div
                className="px-6 py-3 text-center text-xs"
                style={{ borderTop: "1px solid rgba(201,168,76,0.12)", color: "rgba(255,255,255,0.22)" }}
              >
                工作时间 09:00–22:00 · 通常在1小时内回复
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Inline contact trigger (for use in Services / Cases sections) ─────────────
export function InlineContactTrigger({ label = "立即咨询" }: { label?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-90 active:scale-95"
        style={{
          background: "rgba(201,168,76,0.12)",
          border: "1px solid rgba(201,168,76,0.4)",
          color: "#C9A84C",
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.05em",
        }}
      >
        <svg viewBox="0 0 40 40" fill="none" className="w-4 h-4">
          <ellipse cx="14" cy="16" rx="11" ry="9" fill="#C9A84C" fillOpacity="0.9" />
          <ellipse cx="27" cy="22" rx="9" ry="7.5" fill="#C9A84C" fillOpacity="0.6" />
          <circle cx="11" cy="15" r="1.8" fill="#0D1B2A" />
          <circle cx="17" cy="15" r="1.8" fill="#0D1B2A" />
          <circle cx="24.5" cy="21.5" r="1.5" fill="#0D1B2A" />
          <circle cx="29.5" cy="21.5" r="1.5" fill="#0D1B2A" />
        </svg>
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(8px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full"
            style={{ maxWidth: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <InlineModalContent onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

// Shared modal content used by both float and inline trigger
function InlineModalContent({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(CONTACT.wechatId).then(() => {
      setCopied(true);
      toast.success("微信号已复制", { description: CONTACT.wechatId, duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const channelBtnClass =
    "flex items-center gap-2 px-3 py-2 text-xs font-medium transition-all duration-200 border hover:scale-[1.02] active:scale-95";

  return (
    <div
      style={{
        background: "#0D1B2A",
        border: "1px solid rgba(201,168,76,0.4)",
        boxShadow: "0 0 60px rgba(201,168,76,0.12), 0 24px 64px rgba(0,0,0,0.7)",
      }}
    >
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
        <div>
          <div className="text-xs tracking-widest uppercase mb-1" style={{ color: "rgba(201,168,76,0.6)", fontFamily: "'DM Mono', monospace" }}>
            Contact · 联系我们
          </div>
          <div className="font-bold text-lg text-white" style={{ fontFamily: "'Noto Serif SC', serif" }}>代言 Sean DAI</div>
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>首席品牌增长专家 · 上海 徐汇</div>
        </div>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:opacity-70" style={{ color: "rgba(255,255,255,0.4)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="px-6 pt-5 pb-3 flex flex-col items-center">
        <div className="p-3 mb-3" style={{ background: "white", border: "1px solid rgba(201,168,76,0.3)" }}>
          <img src={WECHAT_QR_URL} alt="微信二维码" className="w-44 h-44 object-contain" />
        </div>
        <p className="text-center text-sm mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>扫一扫二维码，添加微信好友</p>
        <div className="w-full flex items-center justify-between px-4 py-2.5 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.2)" }}>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono', monospace" }}>微信号</span>
            <span className="text-sm font-medium text-white" style={{ fontFamily: "'DM Mono', monospace" }}>{CONTACT.wechatId}</span>
          </div>
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium transition-all hover:opacity-80 active:scale-95"
            style={{ background: copied ? "rgba(26,173,25,0.15)" : "rgba(201,168,76,0.12)", border: `1px solid ${copied ? "rgba(26,173,25,0.5)" : "rgba(201,168,76,0.35)"}`, color: copied ? "#1AAD19" : "#C9A84C" }}>
            {copied ? <IconCheck /> : <IconCopy />}
            {copied ? "已复制" : "复制"}
          </button>
        </div>
        <div className="w-full text-center py-2.5 text-xs font-medium mb-4" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", color: "#C9A84C", fontFamily: "'DM Mono', monospace" }}>
          ◆ &nbsp; 免费品牌诊断 · 限时开放 &nbsp; ◆
        </div>
      </div>
      <div className="px-6 pb-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="text-xs tracking-widest uppercase pt-4 mb-3" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>其他联系方式</div>
        <div className="grid grid-cols-2 gap-2">
          <a href={`tel:+${CONTACT.phone}`} className={channelBtnClass} style={{ borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.03)" }}>
            <IconPhone /><span>电话拨打</span>
          </a>
          <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" className={channelBtnClass} style={{ borderColor: "rgba(37,211,102,0.3)", color: "rgba(37,211,102,0.85)", background: "rgba(37,211,102,0.05)" }}>
            <IconWhatsApp /><span>WhatsApp</span>
          </a>
          <a href="#" className={channelBtnClass} style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.02)", pointerEvents: "none" }}>
            <IconTelegram /><span>Telegram</span><span className="text-[10px] ml-auto opacity-40">即将开通</span>
          </a>
          <a href="#" className={channelBtnClass} style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.02)", pointerEvents: "none" }}>
            <IconInstagram /><span>Instagram</span><span className="text-[10px] ml-auto opacity-40">即将开通</span>
          </a>
          <a href="#" className={`${channelBtnClass} col-span-2`} style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.02)", pointerEvents: "none", justifyContent: "center" }}>
            <IconX /><span>X (Twitter)</span><span className="text-[10px] ml-2 opacity-40">即将开通</span>
          </a>
        </div>
      </div>
      <div className="px-6 py-3 text-center text-xs" style={{ borderTop: "1px solid rgba(201,168,76,0.12)", color: "rgba(255,255,255,0.22)" }}>
        工作时间 09:00–22:00 · 通常在1小时内回复
      </div>
    </div>
  );
}
