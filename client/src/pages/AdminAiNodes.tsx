/**
 * AdminAiNodes — OpenClaw 节点管理后台
 *
 * 展示已注册的本地 AI 节点（OpenClaw 实例）及其技能清单。
 * 数据直接从 /api/ai/node/list 获取，无需 tRPC。
 * 仅管理员可访问。
 */
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";

// ─── 类型 ─────────────────────────────────────────────────────────────────────

interface SkillItem {
  id: number;
  nodeId: number;
  skillId: string;
  name: string;
  version: string;
  description: string | null;
  triggers: string[];
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NodeItem {
  id: number;
  name: string;
  baseUrl: string;
  type: string;
  modelId: string | null;
  isOnline: boolean;
  isLocal: boolean;
  isActive: boolean;
  skillsChecksum: string | null;
  lastHeartbeatAt: string | null;
  createdAt: string;
  updatedAt: string;
  skills: SkillItem[];
}

// ─── 样式常量 ─────────────────────────────────────────────────────────────────

const S = {
  bg: "#0A0A0A",
  gold: "#C9A84C",
  goldDim: "rgba(201,168,76,0.6)",
  goldFaint: "rgba(201,168,76,0.15)",
  red: "#8B1A1A",
  redDim: "rgba(139,26,26,0.3)",
  green: "#2E7D32",
  greenBright: "#4CAF50",
  text: "#F5F0E8",
  textDim: "rgba(245,240,232,0.55)",
  border: "rgba(201,168,76,0.2)",
  mono: "'DM Mono', 'Courier New', monospace",
};

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

function timeAgo(isoStr: string | null): string {
  if (!isoStr) return "从未";
  const diff = Date.now() - new Date(isoStr).getTime();
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s 前`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m 前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h 前`;
  return `${Math.floor(diff / 86_400_000)}d 前`;
}

function categoryColor(cat: string): string {
  const map: Record<string, string> = {
    code: "#4FC3F7",
    productivity: "#81C784",
    communication: "#FFB74D",
    creative: "#CE93D8",
    ai: "#F48FB1",
    system: "#90A4AE",
    browser: "#64B5F6",
    file: "#A5D6A7",
    audio: "#FFCC02",
    information: "#80DEEA",
  };
  return map[cat] || "#BDBDBD";
}

// ─── 子组件：技能徽章 ─────────────────────────────────────────────────────────

function SkillBadge({ skill }: { skill: SkillItem }) {
  const [hover, setHover] = useState(false);
  return (
    <span
      title={skill.description ?? skill.skillId}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 3,
        fontSize: "0.6rem",
        fontFamily: S.mono,
        letterSpacing: "0.08em",
        background: hover ? "rgba(201,168,76,0.25)" : "rgba(201,168,76,0.08)",
        border: `1px solid ${hover ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.2)"}`,
        color: categoryColor(skill.category),
        cursor: "default",
        transition: "all 0.15s ease",
        marginBottom: 4,
      }}
    >
      {skill.skillId}
    </span>
  );
}

// ─── 子组件：节点卡片 ─────────────────────────────────────────────────────────

function NodeCard({ node }: { node: NodeItem }) {
  const [expanded, setExpanded] = useState(false);
  const isOnline = node.isOnline;

  return (
    <div
      style={{
        background: "rgba(20,10,10,0.8)",
        border: `1px solid ${isOnline ? "rgba(76,175,80,0.35)" : "rgba(139,26,26,0.3)"}`,
        borderRadius: 4,
        overflow: "hidden",
        transition: "border-color 0.2s ease",
      }}
    >
      {/* 节点头部 */}
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setExpanded(!expanded)}
      >
        {/* 状态指示灯 */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: isOnline ? S.greenBright : S.red,
            boxShadow: isOnline
              ? "0 0 6px rgba(76,175,80,0.8)"
              : "0 0 4px rgba(139,26,26,0.6)",
            flexShrink: 0,
          }}
        />

        {/* 节点信息 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: S.mono,
                fontSize: "0.8rem",
                color: S.gold,
                letterSpacing: "0.1em",
                fontWeight: 600,
              }}
            >
              {node.name}
            </span>
            <span
              style={{
                fontFamily: S.mono,
                fontSize: "0.58rem",
                color: S.textDim,
                letterSpacing: "0.08em",
                background: "rgba(255,255,255,0.04)",
                padding: "1px 6px",
                borderRadius: 2,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {node.type.toUpperCase()}
            </span>
            <span
              style={{
                fontFamily: S.mono,
                fontSize: "0.58rem",
                color: isOnline ? S.greenBright : "#EF5350",
                letterSpacing: "0.1em",
              }}
            >
              {isOnline ? "ONLINE" : "OFFLINE"}
            </span>
          </div>

          <div
            style={{
              marginTop: 4,
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontFamily: S.mono, fontSize: "0.6rem", color: S.textDim }}>
              {node.baseUrl}
            </span>
            {node.modelId && (
              <span style={{ fontFamily: S.mono, fontSize: "0.6rem", color: "rgba(201,168,76,0.5)" }}>
                模型: {node.modelId}
              </span>
            )}
            <span style={{ fontFamily: S.mono, fontSize: "0.6rem", color: S.textDim }}>
              心跳: {timeAgo(node.lastHeartbeatAt)}
            </span>
            <span style={{ fontFamily: S.mono, fontSize: "0.6rem", color: S.textDim }}>
              技能: {node.skills.length} 个
            </span>
          </div>
        </div>

        {/* checksum */}
        {node.skillsChecksum && (
          <span
            style={{
              fontFamily: S.mono,
              fontSize: "0.55rem",
              color: "rgba(201,168,76,0.35)",
              letterSpacing: "0.06em",
              flexShrink: 0,
              display: "none",
            }}
            className="hide-mobile"
          >
            {node.skillsChecksum}
          </span>
        )}

        {/* 展开箭头 */}
        <span
          style={{
            fontFamily: S.mono,
            fontSize: "0.7rem",
            color: S.goldDim,
            transform: expanded ? "rotate(90deg)" : "none",
            transition: "transform 0.2s ease",
            flexShrink: 0,
          }}
        >
          ▶
        </span>
      </div>

      {/* 技能清单（展开后显示） */}
      {expanded && (
        <div
          style={{
            borderTop: `1px solid rgba(201,168,76,0.1)`,
            padding: "16px 20px",
            background: "rgba(0,0,0,0.3)",
          }}
        >
          {node.skills.length === 0 ? (
            <div
              style={{
                fontFamily: S.mono,
                fontSize: "0.6rem",
                color: S.textDim,
                letterSpacing: "0.1em",
              }}
            >
              NO SKILLS REGISTERED
            </div>
          ) : (
            <>
              {/* 分类分组 */}
              {Array.from(new Set(node.skills.map((s) => s.category)))
                .sort()
                .map((cat) => {
                  const catSkills = node.skills.filter((s) => s.category === cat);
                  return (
                    <div key={cat} style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          fontFamily: S.mono,
                          fontSize: "0.55rem",
                          color: categoryColor(cat),
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          marginBottom: 6,
                          opacity: 0.8,
                        }}
                      >
                        {cat} ({catSkills.length})
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {catSkills.map((s) => (
                          <SkillBadge key={s.id} skill={s} />
                        ))}
                      </div>
                    </div>
                  );
                })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── 主页面 ───────────────────────────────────────────────────────────────────

export default function AdminAiNodes() {
  const { user, loading } = useAuth();
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchNodes = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/node/list");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setNodes(data.nodes ?? []);
      setLastRefresh(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setFetching(false);
    }
  }, []);

  // 初次加载
  useEffect(() => {
    if (user && user.role === "admin") {
      fetchNodes();
    }
  }, [user, fetchNodes]);

  // 自动刷新（30s）
  useEffect(() => {
    if (!autoRefresh || !user || user.role !== "admin") return;
    const id = setInterval(fetchNodes, 30_000);
    return () => clearInterval(id);
  }, [autoRefresh, user, fetchNodes]);

  // ── 加载状态 ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: S.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontFamily: S.mono,
            color: S.goldDim,
            letterSpacing: "0.2em",
            fontSize: "0.7rem",
          }}
        >
          LOADING...
        </div>
      </div>
    );
  }

  // ── 权限检查 ───────────────────────────────────────────────────────────────

  if (!user || user.role !== "admin") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: S.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <div
          style={{
            fontFamily: S.mono,
            color: S.red,
            letterSpacing: "0.2em",
            fontSize: "0.75rem",
          }}
        >
          ACCESS DENIED — 仅限管理员
        </div>
        <Link href="/">
          <a
            style={{
              fontFamily: S.mono,
              color: S.goldDim,
              fontSize: "0.65rem",
              letterSpacing: "0.15em",
              textDecoration: "none",
            }}
          >
            ← 返回首页
          </a>
        </Link>
      </div>
    );
  }

  // ── 统计 ───────────────────────────────────────────────────────────────────

  const onlineCount = nodes.filter((n) => n.isOnline).length;
  const totalSkills = nodes.reduce((sum, n) => sum + n.skills.length, 0);

  // ── 渲染 ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: S.bg, color: S.text }}>
      {/* ── 顶部导航栏 ─────────────────────────────────────────────────────── */}
      <div
        style={{
          borderBottom: `1px solid ${S.redDim}`,
          padding: "20px clamp(20px, 5vw, 60px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(10,0,0,0.85)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(8px)",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/">
            <a
              style={{
                fontFamily: S.mono,
                color: S.goldDim,
                fontSize: "0.65rem",
                letterSpacing: "0.15em",
                textDecoration: "none",
                opacity: 0.7,
              }}
            >
              ← HOME
            </a>
          </Link>
          <span style={{ color: S.border }}>|</span>
          <span
            style={{
              fontFamily: S.mono,
              color: S.gold,
              fontSize: "0.75rem",
              letterSpacing: "0.2em",
              fontWeight: 600,
            }}
          >
            AI NODES
          </span>
          <span
            style={{
              fontFamily: S.mono,
              fontSize: "0.55rem",
              color: S.textDim,
              letterSpacing: "0.1em",
            }}
          >
            OpenClaw × MaoAI 协同架构
          </span>
        </div>

        {/* 右侧操作区 */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* 自动刷新开关 */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              fontFamily: S.mono,
              fontSize: "0.6rem",
              color: S.textDim,
              letterSpacing: "0.1em",
            }}
          >
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ accentColor: S.gold, width: 12, height: 12 }}
            />
            AUTO-REFRESH 30s
          </label>

          {/* 手动刷新 */}
          <button
            onClick={fetchNodes}
            disabled={fetching}
            style={{
              fontFamily: S.mono,
              fontSize: "0.6rem",
              color: fetching ? S.goldDim : S.gold,
              letterSpacing: "0.15em",
              background: "transparent",
              border: `1px solid ${fetching ? "rgba(201,168,76,0.2)" : S.gold}`,
              padding: "5px 14px",
              borderRadius: 2,
              cursor: fetching ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {fetching ? "LOADING..." : "↻ REFRESH"}
          </button>

          {/* 后台导航 */}
          <Link href="/admin/mao-applications">
            <a
              style={{
                fontFamily: S.mono,
                color: S.goldDim,
                fontSize: "0.6rem",
                letterSpacing: "0.1em",
                textDecoration: "none",
              }}
            >
              APPLICATIONS →
            </a>
          </Link>
        </div>
      </div>

      {/* ── 主体 ───────────────────────────────────────────────────────────── */}
      <div style={{ padding: "clamp(24px, 4vw, 48px) clamp(20px, 5vw, 60px)" }}>
        {/* 统计栏 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 32,
          }}
        >
          {[
            { label: "TOTAL NODES", value: nodes.length, accent: S.gold },
            {
              label: "ONLINE",
              value: onlineCount,
              accent: S.greenBright,
            },
            {
              label: "OFFLINE",
              value: nodes.length - onlineCount,
              accent: "#EF5350",
            },
            { label: "TOTAL SKILLS", value: totalSkills, accent: S.goldDim },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "rgba(201,168,76,0.04)",
                border: `1px solid ${S.border}`,
                borderRadius: 4,
                padding: "16px 20px",
              }}
            >
              <div
                style={{
                  fontFamily: S.mono,
                  fontSize: "0.55rem",
                  color: S.textDim,
                  letterSpacing: "0.15em",
                  marginBottom: 6,
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontFamily: S.mono,
                  fontSize: "1.8rem",
                  color: stat.accent,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* 最后刷新时间 */}
        {lastRefresh && (
          <div
            style={{
              fontFamily: S.mono,
              fontSize: "0.55rem",
              color: S.textDim,
              letterSpacing: "0.1em",
              marginBottom: 20,
            }}
          >
            LAST UPDATED: {lastRefresh.toLocaleTimeString("zh-CN")}
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div
            style={{
              fontFamily: S.mono,
              fontSize: "0.65rem",
              color: "#EF5350",
              letterSpacing: "0.1em",
              background: "rgba(239,83,80,0.08)",
              border: "1px solid rgba(239,83,80,0.3)",
              borderRadius: 4,
              padding: "12px 16px",
              marginBottom: 20,
            }}
          >
            ⚠ 加载失败：{error}
          </div>
        )}

        {/* 节点列表 */}
        {nodes.length === 0 && !fetching && !error ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 20px",
              fontFamily: S.mono,
              fontSize: "0.65rem",
              color: S.textDim,
              letterSpacing: "0.15em",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: 16, opacity: 0.3 }}>◉</div>
            NO NODES REGISTERED
            <div
              style={{
                marginTop: 8,
                fontSize: "0.55rem",
                color: "rgba(245,240,232,0.3)",
              }}
            >
              启动 OpenClaw Switcher 后节点将自动注册
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {nodes.map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
