/**
 * AdminMaoApplications — 毛智库申请管理后台
 * 仅管理员可访问，查看和管理所有战略咨询申请
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:  { label: "待审核", color: "#C9A84C" },
  approved: { label: "已批准", color: "#27AE60" },
  rejected: { label: "已拒绝", color: "#8B1A1A" },
};

const DIRECTION_LABELS: Record<string, string> = {
  military:   "军事战略与兵棋推演",
  geopolitics:"地缘政治分析",
  economic:   "国家经济战略",
  enterprise: "企业竞争战略",
  other:      "其他",
};

export default function AdminMaoApplications() {
  const { user, loading } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { data: applications, isLoading, refetch } = trpc.mao.listApplications.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

  const updateStatus = trpc.mao.updateApplicationStatus.useMutation({
    onMutate: ({ id }: { id: number }) => setUpdatingId(id),
    onSettled: () => { setUpdatingId(null); refetch(); },
  });

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

  const filtered = (applications ?? []).filter(a =>
    filter === "all" ? true : a.status === filter
  );

  const counts = {
    all: applications?.length ?? 0,
    pending: applications?.filter(a => a.status === "pending").length ?? 0,
    approved: applications?.filter(a => a.status === "approved").length ?? 0,
    rejected: applications?.filter(a => a.status === "rejected").length ?? 0,
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
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(201,168,76,0.5)", letterSpacing: "0.1em" }}>
          {user.name} · ADMIN
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px clamp(20px, 5vw, 60px)" }}>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          {[
            { key: "all", label: "全部申请", count: counts.all, color: "#C9A84C" },
            { key: "pending", label: "待审核", count: counts.pending, color: "#C9A84C" },
            { key: "approved", label: "已批准", count: counts.approved, color: "#27AE60" },
            { key: "rejected", label: "已拒绝", count: counts.rejected, color: "#8B1A1A" },
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
              const statusInfo = STATUS_LABELS[app.status] ?? STATUS_LABELS.pending;
              return (
                <div
                  key={app.id}
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(139,26,26,0.2)",
                    borderLeft: `3px solid ${statusInfo.color}`,
                    padding: "24px 28px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr auto",
                    gap: 20,
                    alignItems: "start",
                  }}
                >
                  {/* Applicant info */}
                  <div>
                    <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "1rem", color: "#F5F0E8", fontWeight: 600, marginBottom: 4 }}>
                      {app.name}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: "rgba(201,168,76,0.7)", letterSpacing: "0.08em" }}>
                      {app.organization}
                    </div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "rgba(245,240,232,0.3)", marginTop: 6 }}>
                      {new Date(app.createdAt).toLocaleString("zh-CN")}
                    </div>
                  </div>

                  {/* Direction */}
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "rgba(245,240,232,0.4)", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase" }}>
                      咨询方向
                    </div>
                    <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "0.85rem", color: "rgba(245,240,232,0.8)" }}>
                      {DIRECTION_LABELS[app.consultType] ?? app.consultType}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.55rem", color: "rgba(245,240,232,0.4)", letterSpacing: "0.1em", marginBottom: 6, textTransform: "uppercase" }}>
                      简要说明
                    </div>
                    <div style={{ fontFamily: "'Noto Serif SC', serif", fontSize: "0.8rem", color: "rgba(245,240,232,0.65)", lineHeight: 1.6, maxHeight: 80, overflow: "hidden" }}>
                      {app.description || "—"}
                    </div>
                  </div>

                  {/* Status + Actions */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                    <div style={{
                      fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
                      color: statusInfo.color, letterSpacing: "0.12em",
                      border: `1px solid ${statusInfo.color}44`,
                      padding: "4px 10px",
                    }}>
                      {statusInfo.label}
                    </div>
                    {app.status === "pending" && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          disabled={updatingId === app.id}
                          onClick={() => updateStatus.mutate({ id: app.id, status: "approved" })}
                          style={{
                            fontFamily: "'DM Mono', monospace", fontSize: "0.55rem",
                            color: "#27AE60", border: "1px solid #27AE6066",
                            background: "transparent", padding: "6px 12px",
                            cursor: "pointer", letterSpacing: "0.1em",
                            opacity: updatingId === app.id ? 0.5 : 1,
                          }}
                        >
                          批准
                        </button>
                        <button
                          disabled={updatingId === app.id}
                          onClick={() => updateStatus.mutate({ id: app.id, status: "rejected" })}
                          style={{
                            fontFamily: "'DM Mono', monospace", fontSize: "0.55rem",
                            color: "#8B1A1A", border: "1px solid #8B1A1A66",
                            background: "transparent", padding: "6px 12px",
                            cursor: "pointer", letterSpacing: "0.1em",
                            opacity: updatingId === app.id ? 0.5 : 1,
                          }}
                        >
                          拒绝
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
