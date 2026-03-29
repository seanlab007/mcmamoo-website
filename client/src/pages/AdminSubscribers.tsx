/**
 * AdminSubscribers — 战略简报订阅者管理后台
 * 仅管理员可访问，查看所有战略简报订阅邮箱，支持邮件群发
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

export default function AdminSubscribers() {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [showSendModal, setShowSendModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; message: string } | null>(null);
  const [sending, setSending] = useState(false);

  const { data: subscribers, isLoading } = trpc.mao.listSubscribers.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

  const sendNewsletter = trpc.mao.sendNewsletter.useMutation({
    onMutate: () => setSending(true),
    onSuccess: (data) => {
      setSending(false);
      setSendResult({ sent: data.sent, failed: data.failed, message: data.message });
      setEmailSubject("");
      setEmailContent("");
    },
    onError: (err) => {
      setSending(false);
      setSendResult({ sent: 0, failed: 0, message: `发送失败：${err.message}` });
    },
  });

  const handleSend = () => {
    if (!emailSubject.trim() || !emailContent.trim()) return;
    sendNewsletter.mutate({ subject: emailSubject, content: emailContent });
  };

  if (loading || isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", color: "rgba(201,168,76,0.6)", letterSpacing: "0.2em", fontSize: "0.7rem" }}>
          LOADING...
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
        <div style={{ fontFamily: "'DM Mono', monospace", color: "#8B1A1A", letterSpacing: "0.2em", fontSize: "0.75rem" }}>
          ACCESS DENIED — 仅限管理员
        </div>
        <Link href="/">
          <a style={{ fontFamily: "'DM Mono', monospace", color: "rgba(201,168,76,0.6)", fontSize: "0.65rem", letterSpacing: "0.15em", textDecoration: "none" }}>
            ← 返回首页
          </a>
        </Link>
      </div>
    );
  }

  const filtered = (subscribers ?? []).filter(s =>
    search ? s.email.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", color: "#F5F0E8" }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(139,26,26,0.3)",
        padding: "20px clamp(20px, 5vw, 60px)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(10,0,0,0.8)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/admin/mao-applications">
            <a style={{ fontFamily: "'DM Mono', monospace", color: "rgba(201,168,76,0.5)", fontSize: "0.6rem", letterSpacing: "0.15em", textDecoration: "none" }}>
              ← 申请管理
            </a>
          </Link>
          <div style={{ width: 1, height: 20, background: "rgba(139,26,26,0.4)" }} />
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "#8B1A1A", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              ADMIN PANEL
            </div>
            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.1rem", color: "#F5F0E8", fontWeight: 700 }}>
              战略简报订阅者管理
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/admin/ai-nodes">
            <a style={{ fontFamily: "'DM Mono', monospace", color: "rgba(201,168,76,0.5)", fontSize: "0.6rem", letterSpacing: "0.12em", textDecoration: "none", border: "1px solid rgba(201,168,76,0.2)", padding: "6px 12px" }}>
              AI 节点 →
            </a>
          </Link>
          <button
            onClick={() => { setShowSendModal(true); setSendResult(null); }}
            style={{
              fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
              color: "#C9A84C", border: "1px solid rgba(201,168,76,0.5)",
              background: "rgba(201,168,76,0.08)", padding: "8px 18px",
              cursor: "pointer", letterSpacing: "0.12em",
            }}
          >
            ✉ 发送战略简报
          </button>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(201,168,76,0.5)", letterSpacing: "0.1em" }}>
            {user.name} · ADMIN
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px clamp(20px, 5vw, 60px)" }}>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          <div style={{
            background: "rgba(201,168,76,0.08)",
            border: "1px solid rgba(201,168,76,0.3)",
            padding: "20px 28px",
          }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "2rem", color: "#C9A84C", fontWeight: 700 }}>
              {subscribers?.length ?? 0}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(245,240,232,0.5)", letterSpacing: "0.1em", marginTop: 4 }}>
              总订阅人数
            </div>
          </div>
          <div style={{
            background: "rgba(139,26,26,0.08)",
            border: "1px solid rgba(139,26,26,0.3)",
            padding: "20px 28px",
          }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "2rem", color: "#8B1A1A", fontWeight: 700 }}>
              {subscribers?.filter(s => {
                const d = new Date(s.createdAt);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              }).length ?? 0}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(245,240,232,0.5)", letterSpacing: "0.1em", marginTop: 4 }}>
              本月新增
            </div>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 24 }}>
          <input
            type="text"
            placeholder="搜索邮箱..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: "100%",
              maxWidth: 360,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(139,26,26,0.3)",
              padding: "10px 16px",
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.7rem",
              color: "#F5F0E8",
              outline: "none",
              letterSpacing: "0.05em",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Table header */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 16,
          padding: "10px 20px",
          borderBottom: "1px solid rgba(139,26,26,0.3)",
          marginBottom: 8,
        }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "rgba(245,240,232,0.35)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            邮箱地址
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "rgba(245,240,232,0.35)", letterSpacing: "0.2em", textTransform: "uppercase", textAlign: "right" }}>
            订阅时间
          </div>
        </div>

        {/* Subscriber list */}
        {filtered.length === 0 ? (
          <div style={{
            padding: "80px 40px", textAlign: "center",
            border: "1px solid rgba(139,26,26,0.2)",
            fontFamily: "'DM Mono', monospace", fontSize: "0.7rem",
            color: "rgba(245,240,232,0.3)", letterSpacing: "0.15em",
          }}>
            {search ? "未找到匹配的订阅者" : "暂无订阅记录"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {filtered.map((sub, i) => (
              <div
                key={sub.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 16,
                  padding: "14px 20px",
                  background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                  borderLeft: "2px solid rgba(201,168,76,0.2)",
                  alignItems: "center",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(201,168,76,0.05)")}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.55rem",
                    color: "rgba(201,168,76,0.4)",
                    minWidth: 28,
                    letterSpacing: "0.05em",
                  }}>
                    {String(i + 1).padStart(3, "0")}
                  </span>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.78rem",
                    color: "#F5F0E8",
                    letterSpacing: "0.03em",
                  }}>
                    {sub.email}
                  </span>
                </div>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.6rem",
                  color: "rgba(245,240,232,0.35)",
                  letterSpacing: "0.05em",
                  textAlign: "right",
                  whiteSpace: "nowrap",
                }}>
                  {new Date(sub.createdAt).toLocaleString("zh-CN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {(subscribers?.length ?? 0) > 0 && (
          <div style={{
            marginTop: 24,
            padding: "12px 16px",
            border: "1px solid rgba(201,168,76,0.15)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.55rem",
              color: "rgba(201,168,76,0.5)",
              letterSpacing: "0.1em",
            }}>
              TIP: 共 {filtered.length} 条记录{search ? `（已过滤，总计 ${subscribers?.length}）` : ""}
            </div>
          </div>
        )}
      </div>

      {/* Send Newsletter Modal */}
      {showSendModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.85)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !sending) setShowSendModal(false); }}
        >
          <div style={{
            background: "#111111",
            border: "1px solid rgba(201,168,76,0.3)",
            borderTop: "3px solid #C9A84C",
            width: "100%", maxWidth: 640,
            maxHeight: "90vh", overflowY: "auto",
            padding: "36px 40px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "#C9A84C", letterSpacing: "0.2em", marginBottom: 6 }}>
                  NEWSLETTER BROADCAST
                </div>
                <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.2rem", color: "#F5F0E8", fontWeight: 700 }}>
                  发送战略简报
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(245,240,232,0.4)", marginTop: 6 }}>
                  将发送给全部 {subscribers?.length ?? 0} 位订阅者
                </div>
              </div>
              {!sending && (
                <button
                  onClick={() => setShowSendModal(false)}
                  style={{
                    background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(245,240,232,0.5)", cursor: "pointer",
                    fontFamily: "'DM Mono', monospace", fontSize: "0.65rem",
                    padding: "6px 14px", letterSpacing: "0.1em",
                  }}
                >
                  关闭
                </button>
              )}
            </div>

            {sendResult ? (
              <div>
                <div style={{
                  padding: "24px",
                  background: sendResult.failed === 0 ? "rgba(39,174,96,0.1)" : "rgba(201,168,76,0.1)",
                  border: `1px solid ${sendResult.failed === 0 ? "rgba(39,174,96,0.3)" : "rgba(201,168,76,0.3)"}`,
                  marginBottom: 20,
                }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: sendResult.failed === 0 ? "#27AE60" : "#C9A84C", letterSpacing: "0.1em", marginBottom: 8 }}>
                    {sendResult.failed === 0 ? "✓ 发送完成" : "⚠ 部分发送"}
                  </div>
                  <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1rem", color: "#F5F0E8" }}>
                    {sendResult.message}
                  </div>
                  {sendResult.failed > 0 && (
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(245,240,232,0.4)", marginTop: 8 }}>
                      提示：发送失败可能是因为 SMTP 配置未设置，请在 Secrets 面板配置 SMTP_USER 和 SMTP_PASS
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setSendResult(null); setShowSendModal(false); }}
                  style={{
                    fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
                    color: "#C9A84C", border: "1px solid rgba(201,168,76,0.4)",
                    background: "transparent", padding: "10px 24px",
                    cursor: "pointer", letterSpacing: "0.12em",
                  }}
                >
                  关闭
                </button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.5rem", color: "rgba(245,240,232,0.35)", letterSpacing: "0.15em", marginBottom: 8, textTransform: "uppercase" }}>
                    邮件主题
                  </div>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                    placeholder="例：猫眼增长引擎 Mc&Mamoo Growth Engine战略简报 · 2025年Q1全球市场洞察"
                    disabled={sending}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(245,240,232,0.8)",
                      fontFamily: "'DM Mono', monospace", fontSize: "0.8rem",
                      padding: "12px 16px", outline: "none",
                    }}
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.5rem", color: "rgba(245,240,232,0.35)", letterSpacing: "0.15em", marginBottom: 8, textTransform: "uppercase" }}>
                    邮件内容
                  </div>
                  <textarea
                    value={emailContent}
                    onChange={e => setEmailContent(e.target.value)}
                    placeholder="输入战略简报正文内容..."
                    rows={10}
                    disabled={sending}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(245,240,232,0.8)",
                      fontFamily: "'Noto Serif SC', serif", fontSize: "0.85rem",
                      lineHeight: 1.8, padding: "14px 16px",
                      resize: "vertical", outline: "none",
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "rgba(245,240,232,0.3)", letterSpacing: "0.08em" }}>
                    ⚠ 发送前请确认 SMTP 凭据已在 Secrets 面板配置
                  </div>
                  <button
                    disabled={sending || !emailSubject.trim() || !emailContent.trim()}
                    onClick={handleSend}
                    style={{
                      fontFamily: "'DM Mono', monospace", fontSize: "0.65rem",
                      color: (sending || !emailSubject.trim() || !emailContent.trim()) ? "rgba(201,168,76,0.3)" : "#0A0A0A",
                      background: (sending || !emailSubject.trim() || !emailContent.trim()) ? "transparent" : "#C9A84C",
                      border: "1px solid rgba(201,168,76,0.4)",
                      padding: "12px 28px",
                      cursor: (sending || !emailSubject.trim() || !emailContent.trim()) ? "default" : "pointer",
                      letterSpacing: "0.12em", fontWeight: 700,
                    }}
                  >
                    {sending ? "发送中..." : `发送给 ${subscribers?.length ?? 0} 位订阅者`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
