/**
 * 私密云笔记
 *
 * 管理员专属笔记应用，移动端友好设计。
 * 功能：创建/编辑/删除笔记、标签管理、搜索、置顶、归档、颜色标记
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── 类型 ─────────────────────────────────────────────────────────────────────
interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  is_archived: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
}

// ─── 配置 ─────────────────────────────────────────────────────────────────────
const API_BASE = "/api/notes";
const ADMIN_TOKEN = "maoai-node-reg-2026-secret-workbuddy";

const NOTE_COLORS = [
  { label: "默认", value: null, bg: "#1A1A1A", border: "rgba(201,168,76,0.2)" },
  { label: "金", value: "#C9A84C", bg: "rgba(201,168,76,0.12)", border: "rgba(201,168,76,0.5)" },
  { label: "红", value: "#8B1A1A", bg: "rgba(139,26,26,0.15)", border: "rgba(200,50,50,0.5)" },
  { label: "蓝", value: "#1A4A8B", bg: "rgba(26,74,139,0.15)", border: "rgba(50,100,200,0.5)" },
  { label: "绿", value: "#1A5C2A", bg: "rgba(26,92,42,0.15)", border: "rgba(50,150,80,0.5)" },
  { label: "紫", value: "#4A1A8B", bg: "rgba(74,26,139,0.15)", border: "rgba(120,50,200,0.5)" },
];

// ─── 样式常量 ─────────────────────────────────────────────────────────────────
const S = {
  bg: "#0A0A0A",
  gold: "#C9A84C",
  goldDim: "rgba(201,168,76,0.6)",
  goldFaint: "rgba(201,168,76,0.12)",
  text: "#F5F0E8",
  textDim: "rgba(245,240,232,0.55)",
  border: "rgba(201,168,76,0.2)",
  mono: "'DM Mono', 'Courier New', monospace",
  card: "#141414",
};

// ─── API 工具 ─────────────────────────────────────────────────────────────────
async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      ...(options.headers as Record<string, string>),
    },
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "请求失败");
  return data;
}

// ─── 工具函数 ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  if (diff < 2_592_000_000) return `${Math.floor(diff / 86_400_000)} 天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

function getColorStyle(color: string | null) {
  const c = NOTE_COLORS.find(c => c.value === color) || NOTE_COLORS[0];
  return { background: c.bg, borderColor: c.border };
}

// ─── 笔记编辑器组件 ────────────────────────────────────────────────────────────
function NoteEditor({
  note,
  onSave,
  onClose,
}: {
  note: Partial<Note> | null;
  onSave: (note: Note) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [tags, setTags] = useState<string[]>(note?.tags || []);
  const [color, setColor] = useState<string | null>(note?.color || null);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    contentRef.current?.focus();
  }, []);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    try {
      let saved: Note;
      if (note?.id) {
        saved = await apiFetch(`/${note.id}`, {
          method: "PATCH",
          body: JSON.stringify({ title, content, tags, color }),
        });
      } else {
        saved = await apiFetch("/", {
          method: "POST",
          body: JSON.stringify({ title, content, tags, color }),
        });
      }
      onSave(saved);
    } catch (e) {
      alert("保存失败：" + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const removeTag = (t: string) => setTags(tags.filter(x => x !== t));

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.85)", display: "flex",
      alignItems: "flex-start", justifyContent: "center",
      padding: "0", overflowY: "auto",
    }}>
      <div style={{
        width: "100%", maxWidth: 680, minHeight: "100vh",
        background: S.bg, display: "flex", flexDirection: "column",
        borderLeft: `1px solid ${S.border}`, borderRight: `1px solid ${S.border}`,
      }}>
        {/* 顶栏 */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 16px", borderBottom: `1px solid ${S.border}`,
          position: "sticky", top: 0, background: S.bg, zIndex: 10,
        }}>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: S.textDim,
            fontSize: 22, cursor: "pointer", padding: "0 4px",
          }}>←</button>
          <span style={{ flex: 1, color: S.textDim, fontSize: 13, fontFamily: S.mono }}>
            {note?.id ? "编辑笔记" : "新建笔记"}
          </span>
          <button onClick={handleSave} disabled={saving} style={{
            background: S.gold, color: "#000", border: "none",
            borderRadius: 6, padding: "8px 20px", fontWeight: 700,
            fontSize: 14, cursor: saving ? "wait" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "保存中..." : "保存"}
          </button>
        </div>

        {/* 颜色选择 */}
        <div style={{ display: "flex", gap: 8, padding: "12px 16px 0" }}>
          {NOTE_COLORS.map(c => (
            <button key={c.label} onClick={() => setColor(c.value)} title={c.label} style={{
              width: 24, height: 24, borderRadius: "50%",
              background: c.value || "#333",
              border: color === c.value ? `2px solid ${S.gold}` : "2px solid transparent",
              cursor: "pointer", flexShrink: 0,
            }} />
          ))}
        </div>

        {/* 标题 */}
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="标题（可选）"
          style={{
            background: "none", border: "none", outline: "none",
            color: S.text, fontSize: 22, fontWeight: 700,
            padding: "16px 16px 8px", width: "100%", boxSizing: "border-box",
          }}
        />

        {/* 内容 */}
        <textarea
          ref={contentRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="写点什么..."
          style={{
            background: "none", border: "none", outline: "none",
            color: S.text, fontSize: 16, lineHeight: 1.7,
            padding: "8px 16px", width: "100%", boxSizing: "border-box",
            resize: "none", minHeight: 300, flex: 1,
            fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
          }}
          onInput={e => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = "auto";
            t.style.height = t.scrollHeight + "px";
          }}
        />

        {/* 标签 */}
        <div style={{ padding: "12px 16px", borderTop: `1px solid ${S.border}` }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {tags.map(t => (
              <span key={t} style={{
                background: S.goldFaint, color: S.gold,
                border: `1px solid ${S.border}`, borderRadius: 4,
                padding: "2px 8px", fontSize: 12, display: "flex", alignItems: "center", gap: 4,
              }}>
                #{t}
                <button onClick={() => removeTag(t)} style={{
                  background: "none", border: "none", color: S.goldDim,
                  cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1,
                }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
              placeholder="添加标签（回车确认）"
              style={{
                flex: 1, background: S.goldFaint, border: `1px solid ${S.border}`,
                borderRadius: 6, color: S.text, padding: "6px 10px", fontSize: 13, outline: "none",
              }}
            />
            <button onClick={addTag} style={{
              background: S.goldFaint, border: `1px solid ${S.border}`,
              color: S.gold, borderRadius: 6, padding: "6px 12px",
              cursor: "pointer", fontSize: 13,
            }}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 主组件 ────────────────────────────────────────────────────────────────────
export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [editingNote, setEditingNote] = useState<Partial<Note> | null | undefined>(undefined);
  const [initDone, setInitDone] = useState(false);

  // 初始化建表
  useEffect(() => {
    apiFetch("/init", { method: "POST" })
      .then(() => setInitDone(true))
      .catch(() => setInitDone(true)); // 表已存在也会走这里
  }, []);

  // 加载笔记列表
  const loadNotes = useCallback(async () => {
    if (!initDone) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (showArchived) params.set("archived", "true");
      if (activeTag) params.set("tag", activeTag);
      const data = await apiFetch(`/?${params}`);
      let list: Note[] = data?.notes || [];
      if (searchQ) {
        const q = searchQ.toLowerCase();
        list = list.filter(n =>
          n.title?.toLowerCase().includes(q) ||
          n.content?.toLowerCase().includes(q) ||
          n.tags?.some(t => t.toLowerCase().includes(q))
        );
      }
      setNotes(list);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [initDone, showArchived, activeTag, searchQ]);

  // 加载标签
  const loadTags = useCallback(async () => {
    if (!initDone) return;
    try {
      const data = await apiFetch("/tags/all");
      setTags(data?.tags || []);
    } catch {}
  }, [initDone]);

  useEffect(() => { loadNotes(); }, [loadNotes]);
  useEffect(() => { loadTags(); }, [loadTags]);

  const handleSave = (saved: Note) => {
    setNotes(prev => {
      const idx = prev.findIndex(n => n.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setEditingNote(undefined);
    loadTags();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除这条笔记？")) return;
    try {
      await apiFetch(`/${id}`, { method: "DELETE" });
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      alert("删除失败：" + (e as Error).message);
    }
  };

  const handlePin = async (id: number) => {
    try {
      const updated = await apiFetch(`/${id}/pin`, { method: "PATCH" });
      setNotes(prev => prev.map(n => n.id === id ? updated : n));
    } catch {}
  };

  const handleArchive = async (id: number) => {
    try {
      await apiFetch(`/${id}/archive`, { method: "PATCH" });
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  // 分组：置顶 + 普通
  const pinned = notes.filter(n => n.is_pinned);
  const normal = notes.filter(n => !n.is_pinned);

  return (
    <div style={{
      minHeight: "100vh", background: S.bg, color: S.text,
      fontFamily: "'PingFang SC', 'Microsoft YaHei', sans-serif",
    }}>
      {/* 编辑器弹层 */}
      {editingNote !== undefined && (
        <NoteEditor
          note={editingNote}
          onSave={handleSave}
          onClose={() => setEditingNote(undefined)}
        />
      )}

      {/* 顶栏 */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: S.bg, borderBottom: `1px solid ${S.border}`,
        padding: "12px 16px",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: S.gold }}>📒 私密笔记</span>
            <span style={{
              fontSize: 11, color: S.textDim, fontFamily: S.mono,
              background: S.goldFaint, border: `1px solid ${S.border}`,
              borderRadius: 4, padding: "2px 6px",
            }}>PRIVATE</span>
            <div style={{ flex: 1 }} />
            <button onClick={() => setEditingNote(null)} style={{
              background: S.gold, color: "#000", border: "none",
              borderRadius: 8, padding: "8px 16px", fontWeight: 700,
              fontSize: 14, cursor: "pointer",
            }}>+ 新建</button>
          </div>

          {/* 搜索框 */}
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="搜索笔记..."
            style={{
              width: "100%", boxSizing: "border-box",
              background: S.goldFaint, border: `1px solid ${S.border}`,
              borderRadius: 8, color: S.text, padding: "9px 14px",
              fontSize: 14, outline: "none",
            }}
          />
        </div>
      </div>

      {/* 标签栏 */}
      {tags.length > 0 && (
        <div style={{
          overflowX: "auto", padding: "10px 16px",
          borderBottom: `1px solid ${S.border}`,
          display: "flex", gap: 8, scrollbarWidth: "none",
        }}>
          <button
            onClick={() => setActiveTag(null)}
            style={{
              flexShrink: 0, padding: "4px 12px", borderRadius: 20,
              border: `1px solid ${activeTag === null ? S.gold : S.border}`,
              background: activeTag === null ? S.goldFaint : "none",
              color: activeTag === null ? S.gold : S.textDim,
              cursor: "pointer", fontSize: 13, whiteSpace: "nowrap",
            }}
          >全部</button>
          {tags.map(t => (
            <button
              key={t}
              onClick={() => setActiveTag(activeTag === t ? null : t)}
              style={{
                flexShrink: 0, padding: "4px 12px", borderRadius: 20,
                border: `1px solid ${activeTag === t ? S.gold : S.border}`,
                background: activeTag === t ? S.goldFaint : "none",
                color: activeTag === t ? S.gold : S.textDim,
                cursor: "pointer", fontSize: 13, whiteSpace: "nowrap",
              }}
            >#{t}</button>
          ))}
          <button
            onClick={() => setShowArchived(!showArchived)}
            style={{
              flexShrink: 0, padding: "4px 12px", borderRadius: 20,
              border: `1px solid ${showArchived ? S.gold : S.border}`,
              background: showArchived ? S.goldFaint : "none",
              color: showArchived ? S.gold : S.textDim,
              cursor: "pointer", fontSize: 13, whiteSpace: "nowrap",
            }}
          >📦 归档</button>
        </div>
      )}

      {/* 内容区 */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 16px 80px" }}>
        {loading && (
          <div style={{ textAlign: "center", color: S.textDim, padding: 40 }}>加载中...</div>
        )}
        {error && (
          <div style={{
            background: "rgba(139,26,26,0.2)", border: "1px solid rgba(200,50,50,0.4)",
            borderRadius: 8, padding: 16, color: "#FF6B6B", marginBottom: 16,
          }}>
            ⚠️ {error}
            <br />
            <small style={{ color: S.textDim }}>
              如果是首次使用，请确保 Supabase 中已创建 notes 表。
              <a href="#" onClick={e => { e.preventDefault(); loadNotes(); }}
                style={{ color: S.gold, marginLeft: 8 }}>重试</a>
            </small>
          </div>
        )}

        {!loading && !error && notes.length === 0 && (
          <div style={{ textAlign: "center", color: S.textDim, padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <div style={{ fontSize: 16 }}>
              {searchQ || activeTag ? "没有找到匹配的笔记" : "还没有笔记，点击右上角新建"}
            </div>
          </div>
        )}

        {/* 置顶笔记 */}
        {pinned.length > 0 && (
          <>
            <div style={{ color: S.textDim, fontSize: 12, fontFamily: S.mono, marginBottom: 8 }}>
              📌 置顶
            </div>
            {pinned.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => setEditingNote(note)}
                onDelete={() => handleDelete(note.id)}
                onPin={() => handlePin(note.id)}
                onArchive={() => handleArchive(note.id)}
              />
            ))}
            {normal.length > 0 && (
              <div style={{ color: S.textDim, fontSize: 12, fontFamily: S.mono, margin: "16px 0 8px" }}>
                其他笔记
              </div>
            )}
          </>
        )}

        {/* 普通笔记 */}
        {normal.map(note => (
          <NoteCard
            key={note.id}
            note={note}
            onEdit={() => setEditingNote(note)}
            onDelete={() => handleDelete(note.id)}
            onPin={() => handlePin(note.id)}
            onArchive={() => handleArchive(note.id)}
          />
        ))}
      </div>

      {/* 底部悬浮新建按钮（移动端） */}
      <button
        onClick={() => setEditingNote(null)}
        style={{
          position: "fixed", bottom: 24, right: 20, zIndex: 200,
          width: 56, height: 56, borderRadius: "50%",
          background: S.gold, color: "#000", border: "none",
          fontSize: 28, cursor: "pointer", boxShadow: "0 4px 20px rgba(201,168,76,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >+</button>
    </div>
  );
}

// ─── 笔记卡片组件 ──────────────────────────────────────────────────────────────
function NoteCard({
  note,
  onEdit,
  onDelete,
  onPin,
  onArchive,
}: {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
  onPin: () => void;
  onArchive: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const colorStyle = getColorStyle(note.color);
  const preview = note.content.slice(0, 200).replace(/\n+/g, " ");

  return (
    <div
      style={{
        background: colorStyle.background,
        border: `1px solid ${colorStyle.borderColor}`,
        borderRadius: 10, padding: "14px 16px", marginBottom: 10,
        cursor: "pointer", position: "relative",
        transition: "border-color 0.2s",
      }}
      onClick={onEdit}
    >
      {/* 置顶标记 */}
      {note.is_pinned && (
        <span style={{
          position: "absolute", top: 10, right: 44,
          fontSize: 14, opacity: 0.7,
        }}>📌</span>
      )}

      {/* 菜单按钮 */}
      <button
        onClick={e => { e.stopPropagation(); setShowMenu(!showMenu); }}
        style={{
          position: "absolute", top: 8, right: 8,
          background: "none", border: "none", color: S.textDim,
          fontSize: 18, cursor: "pointer", padding: "4px 6px",
          borderRadius: 4,
        }}
      >⋮</button>

      {/* 下拉菜单 */}
      {showMenu && (
        <div
          style={{
            position: "absolute", top: 36, right: 8, zIndex: 50,
            background: "#1E1E1E", border: `1px solid ${S.border}`,
            borderRadius: 8, overflow: "hidden", minWidth: 120,
            boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
          }}
          onClick={e => e.stopPropagation()}
        >
          {[
            { label: note.is_pinned ? "取消置顶" : "📌 置顶", action: onPin },
            { label: note.is_archived ? "取消归档" : "📦 归档", action: onArchive },
            { label: "✏️ 编辑", action: onEdit },
            { label: "🗑️ 删除", action: onDelete, danger: true },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => { item.action(); setShowMenu(false); }}
              style={{
                display: "block", width: "100%", textAlign: "left",
                background: "none", border: "none",
                color: item.danger ? "#FF6B6B" : S.text,
                padding: "10px 14px", cursor: "pointer", fontSize: 14,
              }}
            >{item.label}</button>
          ))}
        </div>
      )}

      {/* 标题 */}
      {note.title && (
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, paddingRight: 40 }}>
          {note.title}
        </div>
      )}

      {/* 内容预览 */}
      {preview && (
        <div style={{
          color: S.textDim, fontSize: 14, lineHeight: 1.6,
          marginBottom: note.tags.length ? 10 : 0,
          display: "-webkit-box", WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {preview}
        </div>
      )}

      {/* 标签 + 时间 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        {note.tags.map(t => (
          <span key={t} style={{
            background: "rgba(201,168,76,0.1)", color: S.goldDim,
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: 4, padding: "1px 6px", fontSize: 11,
          }}>#{t}</span>
        ))}
        <span style={{ marginLeft: "auto", color: S.textDim, fontSize: 11, fontFamily: S.mono }}>
          {timeAgo(note.updated_at)}
        </span>
      </div>
    </div>
  );
}
