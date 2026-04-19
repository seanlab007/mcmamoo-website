/**
 * MaoAI Chat 页面
 * - 左侧：对话历史列表（新建/切换/删除/重命名）
 * - 右侧：对话窗口（流式输出 + Markdown 渲染）
 * - 工具栏：联网搜索开关 + 图片生成 + 模型选择 + 导出
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Trash2, MessageSquare, Search, Image, Download,
  ChevronDown, Send, Loader2, Globe, Bot, RefreshCw, Edit2, Check, X
} from "lucide-react";

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

interface Conversation {
  id: number;
  title: string;
  model: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: number | string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: { type?: string; imageUrl?: string; searched?: boolean; prompt?: string };
  created_at: string;
}

// ─── 模型列表 ─────────────────────────────────────────────────────────────────

const MODELS = [
  // DeepSeek
  { id: "deepseek-chat",     label: "DeepSeek Chat",      desc: "主力 · 推荐",    group: "DeepSeek" },
  { id: "deepseek-reasoner", label: "DeepSeek Reasoner",  desc: "深度推理",       group: "DeepSeek" },
  // Anthropic Claude
  { id: "claude-opus-4-5",   label: "Claude Opus 4.5",    desc: "Anthropic · 最强", group: "Claude" },
  { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5",  desc: "Anthropic · 均衡", group: "Claude" },
  { id: "claude-haiku-4",    label: "Claude Haiku 4",     desc: "Anthropic · 极速", group: "Claude" },
  // Groq（极速）
  { id: "llama-3.3-70b",    label: "Llama 3.3 70B",      desc: "Groq 极速",     group: "Groq" },
  { id: "llama-3.1-8b",     label: "Llama 3.1 8B",       desc: "Groq 轻量",     group: "Groq" },
  { id: "gemma2-9b",        label: "Gemma2 9B",          desc: "Groq · Google", group: "Groq" },
  // 智谱 GLM
  { id: "glm-4-flash",      label: "GLM-4 Flash",        desc: "免费额度",       group: "智谱" },
  { id: "glm-4-plus",       label: "GLM-4 Plus",         desc: "均衡",           group: "智谱" },
  { id: "glm-z1-flash",     label: "GLM-Z1 Flash",       desc: "推理轻量",       group: "智谱" },
  // Gemini
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash",   desc: "Google · 极速",   group: "Gemini" },
  { id: "gemini-2.5-pro",   label: "Gemini 2.5 Pro",     desc: "Google · 专业",   group: "Gemini" },
  // Google AI Studio (Gemma 4)
  { id: "gemma-4-e2b-it",   label: "Gemma 4 E2B",        desc: "Google AI Studio · 移动端", group: "Google AI" },
  { id: "gemma-4-e4b-it",   label: "Gemma 4 E4B",        desc: "Google AI Studio · 边缘设备", group: "Google AI" },
  { id: "gemma-4-26b-it",   label: "Gemma 4 26B",        desc: "Google AI Studio · MoE架构", group: "Google AI" },
  { id: "gemma-4-31b-it",   label: "Gemma 4 31B",        desc: "Google AI Studio · 最强性能", group: "Google AI" },
];

const DEFAULT_MODEL = "deepseek-chat";

// ─── API helpers ──────────────────────────────────────────────────────────────

const API = "/api/chat";

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res;
}

// ─── Markdown 简单渲染（不引入额外依赖）──────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // 图片
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="md-img" />')
    // 链接
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="md-link">$1</a>')
    // 粗体
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // 斜体
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // 代码块
    .replace(/```[\w]*\n?([\s\S]+?)```/g, '<pre class="md-code"><code>$1</code></pre>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')
    // 标题
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    // 分割线
    .replace(/^---+$/gm, '<hr class="md-hr" />')
    // 列表项
    .replace(/^[-*] (.+)$/gm, '<li class="md-li">$1</li>')
    // 换行
    .replace(/\n\n/g, '</p><p class="md-p">')
    .replace(/\n/g, "<br />");
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamingContentRef = useRef("");

  // ── 加载对话列表 ────────────────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const res = await apiFetch("/conversations");
      const data: Conversation[] = await res.json();
      setConversations(data);
      if (data.length > 0 && !activeId) {
        setActiveId(data[0].id);
      }
    } catch (e) {
      console.error("加载对话列表失败", e);
    }
  }, [activeId]);

  useEffect(() => { loadConversations(); }, []);

  // ── 加载消息 ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(`/conversations/${activeId}/messages`);
        const data: Message[] = await res.json();
        setMessages(data);
      } catch (e) {
        console.error("加载消息失败", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeId]);

  // ── 自动滚动 ────────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── 新建对话 ────────────────────────────────────────────────────────────────
  const newConversation = async () => {
    try {
      const res = await apiFetch("/conversations", {
        method: "POST",
        body: JSON.stringify({ title: "新对话", model }),
      });
      const conv: Conversation = await res.json();
      setConversations(prev => [conv, ...prev]);
      setActiveId(conv.id);
      setMessages([]);
    } catch (e) {
      console.error("新建对话失败", e);
    }
  };

  // ── 删除对话 ────────────────────────────────────────────────────────────────
  const deleteConversation = async (id: number) => {
    await apiFetch(`/conversations/${id}`, { method: "DELETE" });
    const next = conversations.filter(c => c.id !== id);
    setConversations(next);
    if (activeId === id) {
      setActiveId(next.length > 0 ? next[0].id : null);
    }
  };

  // ── 重命名对话 ──────────────────────────────────────────────────────────────
  const saveTitle = async (id: number) => {
    if (!editTitle.trim()) return;
    await apiFetch(`/conversations/${id}/title`, {
      method: "PATCH",
      body: JSON.stringify({ title: editTitle.trim() }),
    });
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, title: editTitle.trim() } : c)
    );
    setEditingId(null);
  };

  // ── 发送消息（SSE 流式）────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || streaming) return;
    let convId = activeId;

    // 没有活跃对话则自动新建
    if (!convId) {
      try {
        const res = await apiFetch("/conversations", {
          method: "POST",
          body: JSON.stringify({ title: "新对话", model }),
        });
        const conv: Conversation = await res.json();
        setConversations(prev => [conv, ...prev]);
        setActiveId(conv.id);
        convId = conv.id;
      } catch { return; }
    }

    const userMsg: Message = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: input.trim(),
      created_at: new Date().toISOString(),
    };
    const assistantMsg: Message = {
      id: `streaming-${Date.now()}`,
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput("");
    setStreaming(true);
    streamingContentRef.current = "";

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, message: userMsg.content, model, useSearch }),
      });

      if (!res.body) throw new Error("No stream body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.text !== undefined) {
              // 找前一行的 event:
              const eventLine = lines[lines.indexOf(line) - 1] || "";
              const eventType = eventLine.startsWith("event: ") ? eventLine.slice(7).trim() : "";

              if (eventType === "delta") {
                streamingContentRef.current += ev.text;
                setMessages(prev => prev.map(m =>
                  m.id === assistantMsg.id
                    ? { ...m, content: streamingContentRef.current }
                    : m
                ));
              } else if (eventType === "title") {
                setConversations(prev =>
                  prev.map(c => c.id === convId ? { ...c, title: ev.text } : c)
                );
              }
            }
          } catch { /* skip */ }
        }
      }

      // 刷新消息（用数据库中真实 ID 替换临时 ID）
      const reloadRes = await apiFetch(`/conversations/${convId}/messages`);
      const reloaded: Message[] = await reloadRes.json();
      setMessages(reloaded);

    } catch (e: any) {
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id ? { ...m, content: `出错了：${e.message}` } : m
      ));
    } finally {
      setStreaming(false);
    }
  };

  // ── 图片生成 ────────────────────────────────────────────────────────────────
  const generateImage = async () => {
    if (!imagePrompt.trim() || generatingImage) return;
    if (!activeId) {
      alert("请先创建或选择一个对话");
      return;
    }
    setGeneratingImage(true);
    try {
      const res = await apiFetch("/image-gen", {
        method: "POST",
        body: JSON.stringify({ prompt: imagePrompt, conversationId: activeId }),
      });
      const data = await res.json();
      if (data.url) {
        const imgMsg: Message = {
          id: `img-${Date.now()}`,
          role: "assistant",
          content: `![生成图片](${data.url})`,
          metadata: { type: "image", imageUrl: data.url, prompt: imagePrompt },
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, imgMsg]);
      }
      setImagePrompt("");
      setShowImageInput(false);
    } catch (e: any) {
      alert(`图片生成失败：${e.message}`);
    } finally {
      setGeneratingImage(false);
    }
  };

  // ── 导出对话 ────────────────────────────────────────────────────────────────
  const exportConversation = () => {
    const conv = conversations.find(c => c.id === activeId);
    const title = conv?.title || "对话记录";
    const md = messages
      .filter(m => m.role !== "system")
      .map(m => `**${m.role === "user" ? "我" : "MaoAI"}**\n\n${m.content}`)
      .join("\n\n---\n\n");
    const blob = new Blob([`# ${title}\n\n${md}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${title}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── 回车发送 ────────────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const activeConv = conversations.find(c => c.id === activeId);

  // ── 渲染 ─────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", height: "100vh", background: "#0A0A0A", color: "#e5e5e5", fontFamily: "'DM Mono', monospace" }}>

      {/* ── 侧边栏 ── */}
      {sidebarOpen && (
        <div style={{ width: 260, borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {/* 头部 */}
          <div style={{ padding: "16px 12px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: 12 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", color: "#C9A84C", fontSize: "1.1rem" }}>Mc&amp;Mamoo</span>
              <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.6rem" }}>/ MaoAI</span>
            </a>
            <button
              onClick={newConversation}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)",
                color: "#C9A84C", padding: "8px 12px", cursor: "pointer", fontSize: "0.7rem",
                letterSpacing: "0.08em",
              }}
            >
              <Plus size={14} />
              新建对话
            </button>
          </div>

          {/* 对话列表 */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
            {conversations.length === 0 && (
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.65rem", textAlign: "center", marginTop: 32 }}>
                暂无对话记录
              </div>
            )}
            {conversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setActiveId(conv.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 10px",
                  marginBottom: 2, cursor: "pointer",
                  background: activeId === conv.id ? "rgba(201,168,76,0.1)" : "transparent",
                  borderLeft: activeId === conv.id ? "2px solid #C9A84C" : "2px solid transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (activeId !== conv.id) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={e => { if (activeId !== conv.id) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <MessageSquare size={12} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0 }} />

                {editingId === conv.id ? (
                  <div style={{ flex: 1, display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveTitle(conv.id); if (e.key === "Escape") setEditingId(null); }}
                      style={{
                        flex: 1, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(201,168,76,0.3)",
                        color: "#e5e5e5", padding: "2px 6px", fontSize: "0.65rem", minWidth: 0,
                      }}
                    />
                    <button onClick={() => saveTitle(conv.id)} style={{ background: "none", border: "none", color: "#C9A84C", cursor: "pointer", padding: 2 }}><Check size={10} /></button>
                    <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: 2 }}><X size={10} /></button>
                  </div>
                ) : (
                  <>
                    <span style={{ flex: 1, fontSize: "0.65rem", color: activeId === conv.id ? "#C9A84C" : "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {conv.title}
                    </span>
                    <div style={{ display: "flex", gap: 2, opacity: 0 }} className="conv-actions"
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0"}
                    >
                      <button
                        onClick={e => { e.stopPropagation(); setEditingId(conv.id); setEditTitle(conv.title); }}
                        style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 2 }}
                      ><Edit2 size={10} /></button>
                      <button
                        onClick={e => { e.stopPropagation(); if (confirm("删除此对话？")) deleteConversation(conv.id); }}
                        style={{ background: "none", border: "none", color: "rgba(255,100,100,0.5)", cursor: "pointer", padding: 2 }}
                      ><Trash2 size={10} /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 主区域 ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* 顶部栏 */}
        <div style={{ height: 48, borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0 }}>
          <button onClick={() => setSidebarOpen(v => !v)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4 }}>
            <MessageSquare size={16} />
          </button>

          <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {activeConv?.title || "MaoAI Chat"}
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* 联网搜索 */}
            <button
              onClick={() => setUseSearch(v => !v)}
              title={useSearch ? "关闭联网搜索" : "开启联网搜索"}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", fontSize: "0.6rem", cursor: "pointer",
                background: useSearch ? "rgba(201,168,76,0.15)" : "transparent",
                border: `1px solid ${useSearch ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.1)"}`,
                color: useSearch ? "#C9A84C" : "rgba(255,255,255,0.3)",
                transition: "all 0.15s",
              }}
            >
              <Globe size={12} />
              联网
            </button>

            {/* 图片生成 */}
            <button
              onClick={() => setShowImageInput(v => !v)}
              title="生成图片"
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 10px", fontSize: "0.6rem", cursor: "pointer",
                background: showImageInput ? "rgba(201,168,76,0.15)" : "transparent",
                border: `1px solid ${showImageInput ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.1)"}`,
                color: showImageInput ? "#C9A84C" : "rgba(255,255,255,0.3)",
              }}
            >
              <Image size={12} />
              绘图
            </button>

            {/* 模型选择 */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowModelMenu(v => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "4px 10px", fontSize: "0.6rem", cursor: "pointer",
                  background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                <Bot size={12} />
                {MODELS.find(m => m.id === model)?.label || model}
                <ChevronDown size={10} />
              </button>
              {showModelMenu && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
                  background: "#111118", border: "1px solid rgba(255,255,255,0.1)",
                  minWidth: 200,
                }}>
                  {["DeepSeek", "Groq", "智谱"].map(group => {
                    const groupModels = MODELS.filter(m => m.group === group);
                    return (
                      <div key={group}>
                        <div style={{ padding: "6px 12px 4px", fontSize: "0.55rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          {group}
                        </div>
                        {groupModels.map(m => (
                          <div
                            key={m.id}
                            onClick={() => { setModel(m.id); setShowModelMenu(false); }}
                            style={{
                              padding: "6px 12px 6px 20px", cursor: "pointer", fontSize: "0.65rem",
                              background: model === m.id ? "rgba(201,168,76,0.1)" : "transparent",
                              color: model === m.id ? "#C9A84C" : "rgba(255,255,255,0.6)",
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                            }}
                          >
                            <span>{m.label}</span>
                            <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.55rem" }}>{m.desc}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 导出 */}
            {activeId && messages.length > 0 && (
              <button
                onClick={exportConversation}
                title="导出 Markdown"
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "4px 10px",
                  fontSize: "0.6rem", cursor: "pointer", background: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.3)",
                }}
              >
                <Download size={12} />
                导出
              </button>
            )}
          </div>
        </div>

        {/* 图片生成输入框 */}
        {showImageInput && (
          <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(201,168,76,0.04)", display: "flex", gap: 8, alignItems: "center" }}>
            <Image size={14} style={{ color: "#C9A84C", flexShrink: 0 }} />
            <input
              value={imagePrompt}
              onChange={e => setImagePrompt(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generateImage()}
              placeholder="描述你想生成的图片... (按 Enter 生成)"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "#e5e5e5", fontSize: "0.75rem",
              }}
            />
            <button
              onClick={generateImage}
              disabled={generatingImage}
              style={{
                padding: "4px 14px", background: "rgba(201,168,76,0.2)",
                border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C",
                cursor: generatingImage ? "not-allowed" : "pointer", fontSize: "0.65rem",
              }}
            >
              {generatingImage ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : "生成"}
            </button>
          </div>
        )}

        {/* 消息区域 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px" }}>
          {loading && (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: "0.7rem", paddingTop: 40 }}>
              <Loader2 size={20} style={{ animation: "spin 1s linear infinite", display: "inline-block" }} />
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div style={{ textAlign: "center", paddingTop: 80 }}>
              <div style={{ fontSize: "2rem", marginBottom: 12, color: "#C9A84C" }}>◈</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", color: "rgba(255,255,255,0.4)", fontSize: "1.1rem", letterSpacing: "0.1em" }}>
                MaoAI
              </div>
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.65rem", marginTop: 8, letterSpacing: "0.08em" }}>
                战略思维 · 全球视野 · 深度洞察
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 32, flexWrap: "wrap" }}>
                {["分析最新地缘政治动向", "帮我做竞争对手分析", "解读最新经济数据", "生成一张科技感图片"].map(s => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    style={{
                      padding: "8px 14px", background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)",
                      cursor: "pointer", fontSize: "0.65rem", letterSpacing: "0.05em",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.filter(m => m.role !== "system").map((msg, i) => (
            <div
              key={msg.id || i}
              style={{
                marginBottom: 20,
                display: "flex",
                flexDirection: msg.role === "user" ? "row-reverse" : "row",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              {/* 头像 */}
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: msg.role === "user" ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.06)",
                fontSize: "0.6rem", color: msg.role === "user" ? "#C9A84C" : "rgba(255,255,255,0.5)",
              }}>
                {msg.role === "user" ? "我" : "◈"}
              </div>

              {/* 气泡 */}
              <div style={{
                maxWidth: "75%",
                background: msg.role === "user" ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${msg.role === "user" ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.07)"}`,
                padding: "12px 16px",
                fontSize: "0.8rem",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.85)",
              }}>
                {msg.role === "assistant" ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: `<p class="md-p">${renderMarkdown(msg.content)}</p>` }}
                    style={{ wordBreak: "break-word" }}
                  />
                ) : (
                  <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{msg.content}</div>
                )}
                {streaming && i === messages.length - 1 && msg.role === "assistant" && msg.content === "" && (
                  <span style={{ display: "inline-block", width: 8, height: 14, background: "#C9A84C", animation: "blink 1s step-end infinite", verticalAlign: "middle" }} />
                )}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* 输入区 */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "12px 16px", flexShrink: 0 }}>
          {useSearch && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "rgba(201,168,76,0.6)", fontSize: "0.6rem" }}>
              <Globe size={10} />
              联网搜索已开启 — AI 将实时搜索相关信息
            </div>
          )}
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={streaming ? "AI 正在思考中..." : "发送消息... (Enter 发送，Shift+Enter 换行)"}
              disabled={streaming}
              rows={1}
              style={{
                flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "#e5e5e5", padding: "10px 14px", fontSize: "0.8rem", resize: "none",
                outline: "none", lineHeight: 1.5, minHeight: 42, maxHeight: 200,
                fontFamily: "inherit",
              }}
              onInput={e => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 200)}px`;
              }}
            />
            <button
              onClick={sendMessage}
              disabled={streaming || !input.trim()}
              style={{
                width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center",
                background: streaming || !input.trim() ? "rgba(255,255,255,0.05)" : "rgba(201,168,76,0.2)",
                border: `1px solid ${streaming || !input.trim() ? "rgba(255,255,255,0.08)" : "rgba(201,168,76,0.4)"}`,
                cursor: streaming || !input.trim() ? "not-allowed" : "pointer",
                color: streaming || !input.trim() ? "rgba(255,255,255,0.2)" : "#C9A84C",
                transition: "all 0.15s", flexShrink: 0,
              }}
            >
              {streaming ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
            </button>
          </div>
          <div style={{ marginTop: 6, color: "rgba(255,255,255,0.15)", fontSize: "0.55rem", textAlign: "right" }}>
            {MODELS.find(m => m.id === model)?.label} · MaoAI v1.0
          </div>
        </div>
      </div>

      {/* 全局样式 */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .md-img { max-width: 100%; border-radius: 4px; margin: 8px 0; display: block; }
        .md-link { color: #C9A84C; text-decoration: underline; }
        .md-code { background: rgba(255,255,255,0.06); padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 0.75rem; margin: 8px 0; white-space: pre; }
        .md-inline-code { background: rgba(255,255,255,0.1); padding: 1px 5px; border-radius: 3px; font-size: 0.8em; }
        .md-h1, .md-h2, .md-h3 { color: #C9A84C; margin: 12px 0 6px; }
        .md-h1 { font-size: 1.1rem; } .md-h2 { font-size: 1rem; } .md-h3 { font-size: 0.9rem; }
        .md-hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 12px 0; }
        .md-li { margin: 3px 0; padding-left: 12px; list-style: none; }
        .md-li::before { content: "·"; margin-right: 6px; color: #C9A84C; }
        .md-p { margin: 4px 0; }
        .conv-actions { opacity: 0; transition: opacity 0.15s; }
        div:hover > .conv-actions { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
