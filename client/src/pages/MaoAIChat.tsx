import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Loader2, Send, Bot, User, ChevronDown, LogOut, Cloud, Monitor, RefreshCw,
  ImagePlus, X, MessageSquarePlus, Trash2, PanelLeftClose, PanelLeftOpen, History,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Streamdown } from "streamdown";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://api.mcmamoo.com";

// ─── Types ────────────────────────────────────────────────────────────────────
type MessageContent =
  | string
  | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

type Message = {
  role: "user" | "assistant";
  content: MessageContent;
  nodeInfo?: ActiveNodeInfo;
  displayText?: string;
  imageUrls?: string[];
};

type ActiveNodeInfo = {
  id: number | null;
  name: string;
  model: string;
  isLocal: boolean;
  badge?: string;
};

type CloudModel = {
  id: string;
  name: string;
  badge: string;
  description: string;
  supportsVision?: boolean;
  isLocal: false;
};

type LocalNode = {
  id: string;
  nodeId: number;
  name: string;
  badge: string;
  description: string;
  modelId: string;
  isLocal: true;
  isOnline: boolean;
};

type ModelOption = CloudModel | LocalNode;

type Conversation = {
  id: number;
  title: string;
  model: string;
  updatedAt: string;
};

// ─── Cloud models ─────────────────────────────────────────────────────────────
const CLOUD_MODELS: CloudModel[] = [
  { id: "deepseek-chat",           name: "DeepSeek V3",   badge: "🔵", description: "通用对话·写作·分析",   isLocal: false },
  { id: "deepseek-reasoner",       name: "DeepSeek R1",   badge: "🧠", description: "深度推理·复杂逻辑",   isLocal: false },
  { id: "glm-4-flash",             name: "GLM-4 Flash",   badge: "⚡", description: "智谱极速·免费额度多", isLocal: false },
  { id: "glm-4-plus",              name: "GLM-4 Plus",    badge: "🟣", description: "智谱旗舰·能力强",     isLocal: false },
  { id: "glm-4v-flash",            name: "GLM-4V 视觉",   badge: "👁️", description: "图片理解·截图分析",   supportsVision: true, isLocal: false },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", badge: "🦙", description: "Groq 超快·英文优秀",  isLocal: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("maoai_session_token");
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getDisplayText(content: MessageContent): string {
  if (typeof content === "string") return content;
  return content.filter(c => c.type === "text").map(c => (c as any).text).join("");
}

function getImageUrls(content: MessageContent): string[] {
  if (typeof content === "string") return [];
  return content.filter(c => c.type === "image_url").map(c => (c as any).image_url.url);
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays}天前`;
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MaoAIChat() {
  const { user, loading, logout } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: "/maoai/login",
  });
  const isAdmin = (user as any)?.role === "admin";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [activeNodeInfo, setActiveNodeInfo] = useState<ActiveNodeInfo | null>(null);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>("deepseek-chat");
  const [showPicker, setShowPicker] = useState(false);
  const [localNodes, setLocalNodes] = useState<LocalNode[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [currentConvId, setCurrentConvId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── tRPC ────────────────────────────────────────────────────────────────────
  const utils = trpc.useUtils();
  const { data: conversations = [], isLoading: loadingConvs } = trpc.conversations.list.useQuery(
    undefined,
    { enabled: !!user }
  );
  const createConvMutation = trpc.conversations.create.useMutation({
    onSuccess: () => utils.conversations.list.invalidate(),
  });
  const updateConvMutation = trpc.conversations.update.useMutation({
    onSuccess: () => utils.conversations.list.invalidate(),
  });
  const deleteConvMutation = trpc.conversations.delete.useMutation({
    onSuccess: () => utils.conversations.list.invalidate(),
  });
  const saveMsgMutation = trpc.messages.save.useMutation();
  const { data: historyMessages } = trpc.messages.list.useQuery(
    { conversationId: currentConvId! },
    { enabled: !!currentConvId }
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Load messages when switching conversations
  useEffect(() => {
    if (!historyMessages || !currentConvId) return;
    const loaded: Message[] = historyMessages.map((m: any) => {
      let content: MessageContent;
      try {
        const parsed = JSON.parse(m.content);
        content = Array.isArray(parsed) ? parsed : m.content;
      } catch {
        content = m.content as string;
      }
      return {
        role: m.role as "user" | "assistant",
        content,
        displayText: getDisplayText(content),
        imageUrls: getImageUrls(content),
      };
    });
    setMessages(loaded);
  }, [historyMessages, currentConvId]);

  const fetchLocalNodes = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingNodes(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/ai/v1/models`, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (resp.ok) {
        const data = await resp.json();
        const locals: LocalNode[] = (data.data || [])
          .filter((m: any) => m.is_local)
          .map((m: any) => ({
            id: m.id,
            nodeId: m.node_id,
            name: m.display_name,
            badge: "🖥️",
            description: `${m.model_id || "本地模型"} · ${m.is_online !== false ? "在线" : "离线"}`,
            modelId: m.model_id || "",
            isLocal: true,
            isOnline: m.is_online !== false,
          }));
        setLocalNodes(locals);
      }
    } catch { /* ignore */ }
    setLoadingNodes(false);
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchLocalNodes();
  }, [isAdmin, fetchLocalNodes]);

  const addImageFromFile = async (file: File | Blob) => {
    if (!file.type.startsWith("image/")) return;
    const dataUrl = await fileToDataUrl(file);
    setPendingImages(prev => [...prev, dataUrl]);
  };

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) await addImageFromFile(blob);
        return;
      }
    }
  }, []);

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) await addImageFromFile(file);
    e.target.value = "";
  };

  const removePendingImage = (idx: number) => {
    setPendingImages(prev => prev.filter((_, i) => i !== idx));
  };

  const startNewChat = () => {
    setCurrentConvId(null);
    setMessages([]);
    setInput("");
    setPendingImages([]);
  };

  const switchConversation = (conv: Conversation) => {
    if (conv.id === currentConvId) return;
    setCurrentConvId(conv.id);
    setMessages([]);
    setSelectedId(conv.model || "deepseek-chat");
  };

  const deleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (deletingId === id) return;
    setDeletingId(id);
    try {
      await deleteConvMutation.mutateAsync({ id });
      if (currentConvId === id) startNewChat();
    } finally {
      setDeletingId(null);
    }
  };

  const saveMessageToDB = async (convId: number, role: "user" | "assistant", content: MessageContent, model?: string) => {
    const contentStr = typeof content === "string" ? content : JSON.stringify(content);
    try {
      await saveMsgMutation.mutateAsync({ conversationId: convId, role, content: contentStr, model });
    } catch (err) {
      console.warn("[MaoAI] save msg failed:", err);
    }
  };

  const generateTitle = (text: string): string => {
    const cleaned = text.trim().replace(/\s+/g, " ");
    return cleaned.length > 30 ? cleaned.slice(0, 30) + "…" : cleaned || "新对话";
  };

  const allOptions: ModelOption[] = [...CLOUD_MODELS, ...(isAdmin ? localNodes : [])];
  const currentOption = allOptions.find(m => m.id === selectedId) || CLOUD_MODELS[0];

  const sendMessage = async (textContent: string) => {
    if ((!textContent.trim() && pendingImages.length === 0) || isStreaming) return;

    let userContent: MessageContent;
    if (pendingImages.length > 0) {
      const parts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [];
      for (const imgUrl of pendingImages) parts.push({ type: "image_url", image_url: { url: imgUrl } });
      parts.push({ type: "text", text: textContent.trim() || "请分析这张图片" });
      userContent = parts;
    } else {
      userContent = textContent.trim();
    }

    const userMsg: Message = {
      role: "user",
      content: userContent,
      displayText: getDisplayText(userContent),
      imageUrls: getImageUrls(userContent),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setPendingImages([]);
    setIsStreaming(true);
    setStreamingContent("");
    setActiveNodeInfo(null);
    abortRef.current = new AbortController();

    let convId = currentConvId;
    if (!convId) {
      try {
        const title = generateTitle(getDisplayText(userContent));
        const created = await createConvMutation.mutateAsync({ title, model: selectedId });
        convId = (created as any).id;
        setCurrentConvId(convId);
      } catch (err) {
        console.warn("[MaoAI] create conv failed:", err);
      }
    }

    if (convId) await saveMessageToDB(convId, "user", userContent);

    const isLocal = currentOption.isLocal;
    const bodyPayload: Record<string, any> = {
      messages: newMessages.map(m => ({ role: m.role, content: m.content })),
    };
    if (isLocal) {
      bodyPayload.useLocal = true;
      bodyPayload.nodeId = (currentOption as LocalNode).nodeId;
    } else {
      bodyPayload.model = selectedId;
    }

    let fullContent = "";
    let capturedNodeInfo: ActiveNodeInfo | null = null;

    try {
      const resp = await fetch(`${BACKEND_URL}/api/ai/chat/stream`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        signal: abortRef.current.signal,
        body: JSON.stringify(bodyPayload),
      });
      if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (trimmed.startsWith("data: ")) {
            try {
              const chunk = JSON.parse(trimmed.slice(6));
              if (chunk.nodeInfo) {
                capturedNodeInfo = chunk.nodeInfo as ActiveNodeInfo;
                setActiveNodeInfo(capturedNodeInfo);
              } else if (chunk.content) {
                fullContent += chunk.content;
                setStreamingContent(fullContent);
              } else if (chunk.error) {
                fullContent += `\n\n⚠️ 错误: ${chunk.error}`;
                setStreamingContent(fullContent);
              }
            } catch { /* skip */ }
          }
        }
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        content: fullContent || "（无响应）",
        nodeInfo: capturedNodeInfo || undefined,
      }]);
      if (convId) {
        await saveMessageToDB(convId, "assistant", fullContent || "（无响应）", selectedId);
        updateConvMutation.mutate({ id: convId, model: selectedId });
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        const errMsg = `⚠️ 请求失败: ${err.message}`;
        setMessages(prev => [...prev, { role: "assistant", content: errMsg }]);
        if (convId) await saveMessageToDB(convId, "assistant", errMsg);
      } else if (fullContent) {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") return prev;
          return [...prev, { role: "assistant" as const, content: fullContent, nodeInfo: capturedNodeInfo || undefined }];
        });
        if (convId) await saveMessageToDB(convId, "assistant", fullContent, selectedId);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const stopStreaming = () => {
    if (streamingContent) {
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === streamingContent) return prev;
        return [...prev, { role: "assistant" as const, content: streamingContent, nodeInfo: activeNodeInfo || undefined }];
      });
    }
    abortRef.current?.abort();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#C9A84C]" size={32} />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0A0A0A] flex overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside className={`flex flex-col border-r border-[#C9A84C]/10 bg-[#080808] transition-all duration-200 shrink-0 ${sidebarOpen ? "w-64" : "w-0 overflow-hidden"}`}>
        <div className="flex items-center justify-between px-3 py-3 border-b border-[#C9A84C]/10 shrink-0">
          <div className="flex items-center gap-2 text-[#C9A84C]/70">
            <History size={14} />
            <span className="text-xs font-semibold tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>历史对话</span>
          </div>
          <button
            onClick={startNewChat}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#C9A84C]/60 border border-[#C9A84C]/20 hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition-all"
            title="新建对话"
          >
            <MessageSquarePlus size={11} />
            <span>新建</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {loadingConvs && (
            <div className="flex items-center justify-center py-8 text-white/20">
              <Loader2 size={16} className="animate-spin" />
            </div>
          )}
          {!loadingConvs && (conversations as Conversation[]).length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-white/20 text-xs">暂无历史对话</p>
              <p className="text-white/10 text-[11px] mt-1">发送消息后自动保存</p>
            </div>
          )}
          {(conversations as Conversation[]).map((conv) => (
            <div
              key={conv.id}
              onClick={() => switchConversation(conv)}
              className={`group relative flex items-start gap-2 px-3 py-2.5 cursor-pointer transition-colors ${
                conv.id === currentConvId
                  ? "bg-[#C9A84C]/10 border-l-2 border-[#C9A84C]/60"
                  : "hover:bg-white/3 border-l-2 border-transparent"
              }`}
            >
              <div className="flex-1 min-w-0 pr-5">
                <p className={`text-xs truncate leading-snug ${conv.id === currentConvId ? "text-white/85" : "text-white/55"}`}>
                  {conv.title}
                </p>
                <p className="text-[10px] text-white/20 mt-0.5">{formatTime(conv.updatedAt)}</p>
              </div>
              <button
                onClick={(e) => deleteConversation(conv.id, e)}
                className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-white/25 hover:text-red-400/70 p-0.5"
                title="删除对话"
              >
                {deletingId === conv.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Header ── */}
        <header className="border-b border-[#C9A84C]/20 bg-[#0A0A0A]/95 backdrop-blur-sm shrink-0 z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(v => !v)}
                className="text-white/30 hover:text-[#C9A84C]/70 transition-colors p-1"
                title={sidebarOpen ? "收起侧边栏" : "展开侧边栏"}
              >
                {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
              </button>
              <div className="w-8 h-8 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
                <Bot size={16} className="text-[#C9A84C]" />
              </div>
              <div>
                <h1 className="text-[#C9A84C] font-semibold text-sm tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>MaoAI</h1>
                <p className="text-white/30 text-xs">智能 AI 控制中心</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={startNewChat} className="text-white/30 hover:text-[#C9A84C]/70 transition-colors p-1" title="新建对话">
                <MessageSquarePlus size={16} />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowPicker(!showPicker)}
                  className="flex items-center gap-2 px-3 py-1.5 border border-[#C9A84C]/30 text-[#C9A84C]/80 text-xs hover:border-[#C9A84C]/60 hover:text-[#C9A84C] transition-all"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {currentOption.isLocal ? <Monitor size={11} className="text-emerald-400" /> : <Cloud size={11} className="text-sky-400" />}
                  <span>{currentOption.badge}</span>
                  <span className="max-w-[100px] truncate">{currentOption.name}</span>
                  <ChevronDown size={12} />
                </button>
                {showPicker && (
                  <div className="absolute right-0 top-full mt-1 w-72 bg-[#111] border border-[#C9A84C]/20 shadow-2xl z-20">
                    <div className="px-3 py-2 border-b border-white/5">
                      <div className="flex items-center gap-1.5 text-sky-400/70 text-[10px] font-semibold tracking-widest uppercase">
                        <Cloud size={10} /><span>云端模型</span>
                      </div>
                    </div>
                    {CLOUD_MODELS.map(m => (
                      <button key={m.id} onClick={() => { setSelectedId(m.id); setShowPicker(false); }}
                        className={`w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-[#C9A84C]/5 transition-colors ${m.id === selectedId ? "bg-[#C9A84C]/10" : ""}`}>
                        <span className="text-sm mt-0.5 shrink-0">{m.badge}</span>
                        <div className="min-w-0">
                          <div className="text-white/90 text-xs font-medium flex items-center gap-1.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                            {m.name}
                            {m.supportsVision && <span className="text-[9px] px-1 py-0.5 bg-purple-500/20 text-purple-400/80 border border-purple-500/20">视觉</span>}
                          </div>
                          <div className="text-white/35 text-[11px] mt-0.5 truncate">{m.description}</div>
                        </div>
                        {m.id === selectedId && <div className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-[#C9A84C] mt-1.5" />}
                      </button>
                    ))}
                    {isAdmin && (
                      <>
                        <div className="px-3 py-2 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-emerald-400/70 text-[10px] font-semibold tracking-widest uppercase">
                            <Monitor size={10} /><span>本地节点</span>
                            <span className="text-white/20 normal-case font-normal">· 仅管理员</span>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); fetchLocalNodes(); }} className="text-white/30 hover:text-white/60 transition-colors p-0.5" title="刷新本地节点">
                            <RefreshCw size={10} className={loadingNodes ? "animate-spin" : ""} />
                          </button>
                        </div>
                        {loadingNodes && <div className="px-4 py-3 text-white/30 text-xs flex items-center gap-2"><Loader2 size={12} className="animate-spin" /><span>正在获取...</span></div>}
                        {!loadingNodes && localNodes.length === 0 && <div className="px-4 py-3 text-white/25 text-xs">暂无在线本地节点<div className="text-white/15 text-[11px] mt-0.5">需要先通过内网穿透注册</div></div>}
                        {localNodes.map(n => (
                          <button key={n.id} onClick={() => { setSelectedId(n.id); setShowPicker(false); }}
                            className={`w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-[#C9A84C]/5 transition-colors ${n.id === selectedId ? "bg-[#C9A84C]/10" : ""}`}>
                            <span className="text-sm mt-0.5 shrink-0">{n.badge}</span>
                            <div className="min-w-0">
                              <div className="text-white/90 text-xs font-medium flex items-center gap-1.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                                {n.name}
                                {n.isOnline ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" /> : <span className="w-1.5 h-1.5 rounded-full bg-red-400/60 inline-block" />}
                              </div>
                              <div className="text-white/35 text-[11px] mt-0.5 truncate">{n.description}</div>
                            </div>
                            {n.id === selectedId && <div className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-[#C9A84C] mt-1.5" />}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
              {isAdmin && (
                <a href="/admin/nodes" className="text-[#C9A84C]/60 text-xs hover:text-[#C9A84C] transition-colors font-mono border border-[#C9A84C]/20 px-2 py-1 hover:border-[#C9A84C]/40" title="进入管理控制台">
                  ADMIN →
                </a>
              )}
              {user && (
                <div className="flex items-center gap-2">
                  <span className="text-white/30 text-xs hidden sm:block truncate max-w-[120px]">{(user as any).name || (user as any).email}</span>
                  <button onClick={logout} className="text-white/30 hover:text-white/60 transition-colors p-1" title="退出登录">
                    <LogOut size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Messages area ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
            {messages.length === 0 && !isStreaming && (
              <div className="flex flex-col items-center justify-center py-16 gap-6">
                <div className="w-16 h-16 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
                  <Bot size={28} className="text-[#C9A84C]/60" />
                </div>
                <div className="text-center">
                  <h2 className="text-white/70 text-lg font-medium mb-1">你好，我是 MaoAI</h2>
                  <p className="text-white/30 text-sm">
                    当前：
                    <span className={currentOption.isLocal ? "text-emerald-400/70" : "text-sky-400/70"}>
                      {currentOption.isLocal ? "本地节点" : "云端"}
                    </span>
                    {" · "}
                    <span className="text-white/50">{currentOption.badge} {currentOption.name}</span>
                  </p>
                  <p className="text-white/20 text-xs mt-2">支持粘贴截图（Ctrl+V）或点击图标上传图片</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {["帮我写一份市场分析报告", "解释一下量子计算的原理", "用 Python 写一个爬虫", "给我推荐几本商业书籍"].map(prompt => (
                    <button key={prompt} onClick={() => sendMessage(prompt)}
                      className="text-left px-4 py-3 border border-white/10 text-white/50 text-sm hover:border-[#C9A84C]/40 hover:text-white/70 transition-all">
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg, i) => {
              const displayText = msg.displayText ?? (typeof msg.content === "string" ? msg.content : getDisplayText(msg.content));
              const imageUrls = msg.imageUrls ?? getImageUrls(msg.content);
              return (
                <div key={i} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center shrink-0 mt-1">
                      <Bot size={14} className="text-[#C9A84C]" />
                    </div>
                  )}
                  <div className="max-w-[80%] flex flex-col gap-1">
                    {msg.role === "assistant" && msg.nodeInfo && (
                      <div className={`flex items-center gap-1.5 text-[10px] ${msg.nodeInfo.isLocal ? "text-emerald-400/50" : "text-sky-400/50"}`}>
                        {msg.nodeInfo.isLocal ? <Monitor size={9} /> : <Cloud size={9} />}
                        <span>{msg.nodeInfo.isLocal ? "本地节点" : "云端"}</span>
                        <span className="text-white/20">·</span>
                        <span>{msg.nodeInfo.name}</span>
                        <span className="text-white/20">·</span>
                        <span className="font-mono">{msg.nodeInfo.model}</span>
                      </div>
                    )}
                    <div className={`rounded px-4 py-3 text-sm ${msg.role === "user" ? "bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-white/90" : "bg-white/5 border border-white/10 text-white/85"}`}>
                      {msg.role === "user" && imageUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {imageUrls.map((url, idx) => (
                            <img key={idx} src={url} alt="附图" className="max-h-48 max-w-xs object-contain rounded border border-white/10" />
                          ))}
                        </div>
                      )}
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none prose-p:text-white/85 prose-code:text-[#C9A84C] prose-pre:bg-black/50">
                          <Streamdown>{displayText}</Streamdown>
                        </div>
                      ) : (
                        displayText && <p className="whitespace-pre-wrap">{displayText}</p>
                      )}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                      <User size={14} className="text-white/50" />
                    </div>
                  )}
                </div>
              );
            })}
            {isStreaming && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={14} className="text-[#C9A84C]" />
                </div>
                <div className="max-w-[80%] flex flex-col gap-1">
                  {activeNodeInfo && (
                    <div className={`flex items-center gap-1.5 text-[10px] ${activeNodeInfo.isLocal ? "text-emerald-400/60" : "text-sky-400/60"}`}>
                      {activeNodeInfo.isLocal ? <Monitor size={9} /> : <Cloud size={9} />}
                      <span className="animate-pulse">●</span>
                      <span>{activeNodeInfo.isLocal ? "本地节点" : "云端"}</span>
                      <span className="text-white/20">·</span>
                      <span>{activeNodeInfo.name}</span>
                      <span className="text-white/20">·</span>
                      <span className="font-mono">{activeNodeInfo.model}</span>
                    </div>
                  )}
                  <div className="bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white/85">
                    {streamingContent ? (
                      <div className="prose prose-sm prose-invert max-w-none prose-p:text-white/85 prose-code:text-[#C9A84C] prose-pre:bg-black/50">
                        <Streamdown>{streamingContent}</Streamdown>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-white/40">
                        <Loader2 size={14} className="animate-spin" />
                        <span>思考中...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ── Input bar ── */}
        <div className="border-t border-white/5 bg-[#0A0A0A]/95 backdrop-blur-sm shrink-0">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className={`flex items-center gap-1.5 text-[10px] mb-2 ${currentOption.isLocal ? "text-emerald-400/40" : "text-sky-400/40"}`}>
              {currentOption.isLocal ? <Monitor size={9} /> : <Cloud size={9} />}
              <span>{currentOption.isLocal ? "本地节点" : "云端"}</span>
              <span className="text-white/15">·</span>
              <span>{currentOption.badge} {currentOption.name}</span>
              {currentOption.isLocal && !(currentOption as LocalNode).isOnline && <span className="text-red-400/60 ml-1">· 离线</span>}
              {currentConvId && <><span className="text-white/15 ml-1">·</span><span className="text-[#C9A84C]/30 ml-1">已保存</span></>}
            </div>
            {pendingImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {pendingImages.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt="待发送图片" className="h-20 w-auto max-w-[160px] object-contain border border-[#C9A84C]/30 rounded" />
                    <button onClick={() => removePendingImage(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 items-end">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming}
                className={`px-3 py-3 border text-xs transition-all shrink-0 ${pendingImages.length > 0 ? "border-[#C9A84C]/50 text-[#C9A84C] bg-[#C9A84C]/10" : "border-white/10 text-white/30 hover:border-[#C9A84C]/30 hover:text-[#C9A84C]/60"} disabled:opacity-30 disabled:cursor-not-allowed`}
                title="上传图片（或直接 Ctrl+V 粘贴截图）"
              >
                <ImagePlus size={16} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isStreaming ? "AI 正在回复中..." : pendingImages.length > 0 ? "描述图片内容，或直接发送让 AI 分析..." : "输入消息，Enter 发送，Shift+Enter 换行，Ctrl+V 粘贴截图"}
                disabled={isStreaming}
                rows={1}
                className="flex-1 bg-white/5 border border-white/10 text-white/85 text-sm px-4 py-3 resize-none focus:outline-none focus:border-[#C9A84C]/40 placeholder-white/20 disabled:opacity-50"
                style={{ minHeight: "44px", maxHeight: "200px" }}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 200) + "px";
                }}
              />
              {isStreaming ? (
                <button onClick={stopStreaming} className="px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/20 transition-all shrink-0">停止</button>
              ) : (
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() && pendingImages.length === 0}
                  className="px-4 py-3 bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  <Send size={16} />
                </button>
              )}
            </div>
            {pendingImages.length > 0 && (
              <p className="text-[10px] text-purple-400/50 mt-2 flex items-center gap-1">
                <span>👁️</span><span>将自动使用 GLM-4V 视觉模型分析图片</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {showPicker && <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />}
    </div>
  );
}
