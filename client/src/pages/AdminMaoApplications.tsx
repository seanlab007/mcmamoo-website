/*
 * AdminMaoApplications — 毛智库申请管理后台
 * 仅管理员可访问，查看和管理所有战略咨询申请
 * Features: 详情弹窗、备注、状态管理
 * Migrated: tRPC → Supabase direct
 */
import { useState, useEffect } from "react";
import {
  adminListApplications,
  adminUpdateApplicationStatus,
  adminUpdateApplicationNotes,
} from "@/lib/supabase";
import { Link } from "wouter";

const ADMIN_PASSWORD = "maoyan2024admin";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: "待审核",  color: "#C9A84C" },
  reviewing: { label: "审核中",  color: "#4A90D9" },
  approved:  { label: "已批准",  color: "#27AE60" },
  rejected:  { label: "已拒绝",  color: "#8B1A1A" },
};

const DIRECTION_LABELS: Record<string, string> = {
  military:    "军事战略与兵棋推演",
  geopolitics: "地缘政治分析",
  economic:    "国家经济战略",
  enterprise:  "企业竞争战略",
  other:       "其他",
};

type Application = {
  id: number;
  name: string;
  organization: string;
  consult_type: string;
  description: string | null;
  status: "pending" | "reviewing" | "approved" | "rejected";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export default function AdminMaoApplications() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState("");

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [notesInput, setNotesInput] = useState<string>("");
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const data = await adminListApplications();
      setApplications(data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authed) fetchApplications();
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

  const handleUpdateStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await adminUpdateApplicationStatus(id, status);
      await fetchApplications();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedApp) return;
    setSavingNotes(true);
    try {
      await adminUpdateApplicationNotes(selectedApp.id, notesInput);
      await fetchApplications();
      setSelectedApp({ ...selectedApp, notes: notesInput });
    } finally {
      setSavingNotes(false);
    }
  };

  const openDetail = (app: Application) => {
    setSelectedApp(app);
    setNotesInput(app.notes ?? "");
  };

  const closeDetail = () => {
    setSelectedApp(null);
    setNotesInput("");
  };

  // ── Login gate ────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16, width: 280 }}>
          <div style={{ fontFamily: "'DM Mono', monospace", color: "#C9A84C", letterSpacing: "0.2em", fontSize: "0.7rem", textAlign: "center" }}>
            ADMIN — 毛智库管理后台
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

  const filtered = applications.filter(a =>
    filter === "all" ? true : a.status === filter
  );

  const counts = {
    all:      applications.length,
    pending:  applications.filter(a => a.status === "pending").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

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
          <Link href="/maothink">
            <a style={{ fontFamily: "'DM Mono', monospace", color: "rgba(201,168,76,0.5)", fontSize: "0.6rem", letterSpacing: "0.15em", textDecoration: "none" }}>
              ← 毛智库
            </a>
          </Link>
          <div style={{ width: 1, height: 20, background: "rgba(139,26,26,0.4)" }} />
          <div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "#8B1A1A", letterSpacing: "0.2em", textTransform: "uppercase" }}>
              ADMIN PANEL
            </div>
            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.1rem", color: "#F5F0E8", fontWeight: 700 }}>
              战略咨询申请管理
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/admin/subscribers">
            <a style={{ fontFamily: "'DM Mono', monospace", color: "rgba(201,168,76,0.5)", fontSize: "0.6rem", letterSpacing: "0.12em", textDecoration: "none", border: "1px solid rgba(201,168,76,0.2)", padding: "6px 12px" }}>
              订阅者列表 →
            </a>
          </Link>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(201,168,76,0.5)", letterSpacing: "0.1em" }}>
            ADMIN
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px clamp(20px, 5vw, 60px)" }}>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          {[
            { key: "all",      label: "全部申请", count: counts.all,      color: "#C9A84C" },
            { key: "pending",  label: "待审核",   count: counts.pending,  color: "#C9A84C" },
            { key: "approved", label: "已批准",   count: counts.approved, color: "#27AE60" },
            { key: "rejected", label: "已拒绝",   count: counts.rejected, color: "#8B1A1A" },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              style={{
                background: filter === s.key ? `${s.color}18` : "rgba(255,255,255,0.02)",
                border: `1px solid ${filter === s.key ? s.color + "66" : "rgba(255,255,255,0.06)"}`,
                padding: "16px 24px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
              }}
            >
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.5rem", color: s.color, fontWeight: 700 }}>
                {s.count}
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(245,240,232,0.5)", letterSpacing: "0.1em", marginTop: 4 }}>
                {s.label}
              </div>
            </button>
          ))}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div style={{
            padding: "80px 40px", textAlign: "center",
            border: "1px solid rgba(139,26,26,0.2)",
            fontFamily: "'DM Mono', monospace", fontSize: "0.7rem",
            color: "rgba(245,240,232,0.3)", letterSpacing: "0.15em",
          }}>
            暂无申请记录
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((app) => {
              const statusInfo = STATUS_LABELS[app.status] ?? { label: app.status, color: "#C9A84C" };
              const isUpdating = updatingId === app.id;
              return (
                <div
                  key={app.id}
                  style={{
                    border: "1px solid rgba(139,26,26,0.2)",
                    padding: "20px 24px",
                    background: "rgba(255,255,255,0.01)",
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <span style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1rem", color: "#F5F0E8", fontWeight: 700 }}>
                        {app.name}
                      </span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: statusInfo.color, border: `1px solid ${statusInfo.color}44`, padding: "2px 8px", letterSpacing: "0.1em" }}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(245,240,232,0.5)", marginBottom: 4 }}>
                      {app.organization} · {DIRECTION_LABELS[app.consult_type] ?? app.consult_type}
                    </div>
                    {app.description && (
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(245,240,232,0.4)", marginTop: 4, lineHeight: 1.6 }}>
                        {app.description}
                      </div>
                    )}
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "rgba(245,240,232,0.25)", marginTop: 8, letterSpacing: "0.1em" }}>
                      {new Date(app.created_at).toLocaleString("zh-CN")}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      onClick={() => openDetail(app)}
                      style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(201,168,76,0.7)", border: "1px solid rgba(201,168,76,0.2)", padding: "6px 12px", background: "transparent", cursor: "pointer", letterSpacing: "0.1em" }}
                    >
                      详情
                    </button>
                    {Object.keys(STATUS_LABELS).filter(s => s !== app.status).map(s => (
                      <button
                        key={s}
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(app.id, s)}
                        style={{
                          fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
                          color: STATUS_LABELS[s].color,
                          border: `1px solid ${STATUS_LABELS[s].color}44`,
                          padding: "6px 12px", background: "transparent",
                          cursor: isUpdating ? "not-allowed" : "pointer",
                          opacity: isUpdating ? 0.5 : 1,
                          letterSpacing: "0.1em",
                        }}
                      >
                        → {STATUS_LABELS[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedApp && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={closeDetail}
        >
          <div
            style={{ background: "#0D0D0D", border: "1px solid rgba(139,26,26,0.4)", padding: 32, maxWidth: 560, width: "100%", maxHeight: "80vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "#8B1A1A", letterSpacing: "0.2em", marginBottom: 16 }}>DETAIL — #{selectedApp.id}</div>
            <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1.2rem", color: "#F5F0E8", fontWeight: 700, marginBottom: 8 }}>{selectedApp.name}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(245,240,232,0.5)", marginBottom: 16 }}>
              {selectedApp.organization} · {DIRECTION_LABELS[selectedApp.consult_type] ?? selectedApp.consult_type}
            </div>
            {selectedApp.description && (
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(245,240,232,0.6)", lineHeight: 1.8, marginBottom: 20, padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                {selectedApp.description}
              </div>
            )}
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "rgba(201,168,76,0.5)", letterSpacing: "0.15em", marginBottom: 8 }}>NOTES / 跟进记录</div>
              <textarea
                value={notesInput}
                onChange={e => setNotesInput(e.target.value)}
                rows={4}
                style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.2)", color: "#F5F0E8", padding: "10px 12px", fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", resize: "vertical", outline: "none", boxSizing: "border-box" }}
                placeholder="记录跟进情况..."
              />
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={closeDetail} style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(245,240,232,0.4)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 16px", background: "transparent", cursor: "pointer" }}>
                关闭
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "#E8D5B7", background: "#8B1A1A", border: "none", padding: "8px 16px", cursor: savingNotes ? "not-allowed" : "pointer", opacity: savingNotes ? 0.6 : 1 }}
              >
                {savingNotes ? "保存中..." : "保存备注"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
