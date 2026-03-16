/**
 * AdminSubscribers — 战略简报订阅者管理后台
 * 仅管理员可访问，查看所有战略简报订阅邮箱
 * Migrated: tRPC → Supabase direct
 */
import { useState, useEffect } from "react";
import { adminListSubscribers } from "@/lib/supabase";
import { Link } from "wouter";

const ADMIN_PASSWORD = "maoyan2024admin";

type Subscriber = {
  id: number;
  email: string;
  created_at: string;
};

export default function AdminSubscribers() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState("");

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const data = await adminListSubscribers();
      setSubscribers(data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authed) fetchSubscribers();
  }, [authed]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      setAuthed(true);
      setPwErr("");
    } else {
      setPwErr("密码错误");
    }
  };

  // ── Login gate ────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16, width: 280 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", color: "#C9A84C", letterSpacing: "0.2em", fontSize: "0.7rem", textAlign: "center" }}>
            ADMIN — 订阅者管理
          </div>
          <input
            type="password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            placeholder="管理员密码"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.3)", color: "#F5F0E8", padding: "10px 14px", fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", outline: "none" }}
          />
          {pwErr && <div style={{ color: "#8B1A1A", fontSize: "0.65rem", fontFamily: "'DM Mono', monospace" }}>{pwErr}</div>}
          <button type="submit" style={{ background: "#8B1A1A", color: "#E8D5B7", border: "none", padding: "10px", fontFamily: "'DM Mono', monospace", fontSize: "0.7rem", letterSpacing: "0.1em", cursor: "pointer" }}>
            登录
          </button>
        </form>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "'DM Mono', monospace", color: "rgba(201,168,76,0.6)", letterSpacing: "0.2em", fontSize: "0.7rem" }}>
          LOADING...
        </div>
      </div>
    );
  }

  const filtered = subscribers.filter(s =>
    search ? s.email.toLowerCase().includes(search.toLowerCase()) : true
  );

  const thisMonthCount = subscribers.filter(s => {
    const d = new Date(s.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

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
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(201,168,76,0.5)", letterSpacing: "0.1em" }}>
          ADMIN
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px clamp(20px, 5vw, 60px)" }}>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)", padding: "20px 28px" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "2rem", color: "#C9A84C", fontWeight: 700 }}>
              {subscribers.length}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(245,240,232,0.5)", letterSpacing: "0.1em", marginTop: 4 }}>
              总订阅人数
            </div>
          </div>
          <div style={{ background: "rgba(139,26,26,0.08)", border: "1px solid rgba(139,26,26,0.3)", padding: "20px 28px" }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "2rem", color: "#8B1A1A", fontWeight: 700 }}>
              {thisMonthCount}
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
              width: "100%", maxWidth: 360,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(139,26,26,0.3)",
              padding: "10px 16px",
              fontFamily: "'DM Mono', monospace", fontSize: "0.7rem",
              color: "#F5F0E8", outline: "none", letterSpacing: "0.05em",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Table header */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr auto", gap: 16,
          padding: "10px 20px", borderBottom: "1px solid rgba(139,26,26,0.3)", marginBottom: 8,
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
                  display: "grid", gridTemplateColumns: "1fr auto", gap: 16,
                  padding: "14px 20px",
                  background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                  borderLeft: "2px solid rgba(201,168,76,0.2)",
                  alignItems: "center", transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(201,168,76,0.05)")}
                onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "rgba(201,168,76,0.4)", minWidth: 28, letterSpacing: "0.05em" }}>
                    {String(i + 1).padStart(3, "0")}
                  </span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", color: "#F5F0E8", letterSpacing: "0.03em" }}>
                    {sub.email}
                  </span>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(245,240,232,0.35)", letterSpacing: "0.05em", textAlign: "right", whiteSpace: "nowrap" }}>
                  {new Date(sub.created_at).toLocaleString("zh-CN", {
                    year: "numeric", month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {subscribers.length > 0 && (
          <div style={{ marginTop: 24, padding: "12px 16px", border: "1px solid rgba(201,168,76,0.15)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "rgba(201,168,76,0.5)", letterSpacing: "0.1em" }}>
              TIP: 共 {filtered.length} 条记录{search ? `（已过滤，总计 ${subscribers.length}）` : ""}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
