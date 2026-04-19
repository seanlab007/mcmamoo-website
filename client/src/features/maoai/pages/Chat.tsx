import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { AgentModeSelector } from "../components/AgentModeSelector";
import {
  Loader2, Send, Bot, User, ChevronDown, LogOut, Cloud, Monitor, RefreshCw,
  ImagePlus, X, MessageSquarePlus, Trash2, PanelLeftClose, PanelLeftOpen, History,
  Wand2, Image as ImageIcon, Crown, Zap, Paperclip, FileText, FileJson, Table2,
  LayoutGrid, Lock, Search, BookOpen,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

import { useTranslation } from "react-i18next";
import { Streamdown } from "streamdown";
import { useLocation } from "wouter";
import { useContentSubscription } from "@/hooks/useContentSubscription";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { MAOAI_ROUTES, MAOAI_BACKEND_URL, MAOAI_TOOL_DISPLAY } from "../constants";
import type {
  MessageContent,
  Message,
  ActiveNodeInfo,
  CloudModel,
  LocalNode,
  ModelOption,
  Conversation,
  PendingFile,
  ToolCallStep,
} from "../types";

const BACKEND_URL = MAOAI_BACKEND_URL;

const stripTrailingColon = (value: string) => value.replace(/[：:]\s*$/, "");

const getModelDescriptions = (chat: any): Record<string, { description: string; supportsVision?: boolean }> => ({
  "deepseek-chat": { description: chat.modelDescriptions.deepseekChat },
  "deepseek-reasoner": { description: chat.modelDescriptions.deepseekReasoner },
  "glm-4-flash": { description: chat.modelDescriptions.glm4Flash },
  "glm-4-plus": { description: chat.modelDescriptions.glm4Plus },
  "glm-4v-flash": { description: chat.modelDescriptions.glm4vFlash, supportsVision: true },
  "llama-3.3-70b": { description: chat.modelDescriptions.llama },
  "llama-3.1-8b": { description: chat.modelDescriptions.llama },
  "gemma2-9b": { description: chat.modelDescriptions.llama },
  "gemini-2.5-flash": { description: chat.modelDescriptions.geminiFlash, supportsVision: true },
  "gemini-2.5-pro": { description: chat.modelDescriptions.geminiPro, supportsVision: true },
  "claude-opus-4": { description: chat.modelDescriptions.claudeOpus, supportsVision: true },
});

// ─── Types (local-only) ───────────────────────────────────────────────────────
// All shared types are imported from ../types; only Chat-specific types remain here.
type InputMode = "chat" | "image";

// Tool name → 中文显示名和图标（从 constants 统一导入）
const TOOL_DISPLAY = MAOAI_TOOL_DISPLAY;

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

// ─── ToolCallSteps Component ─────────────────────────────────────────────────
function ToolCallSteps({ steps, live = false }: { steps: ToolCallStep[]; live?: boolean }) {
  const { t } = useTranslation();
  const chat = t("maoai.chat", { returnObjects: true }) as any;
  void live;

  if (steps.length === 0) return null;
  return (
    <div className="flex flex-col gap-1 mb-2">
      {steps.map((tc) => {
        const display = TOOL_DISPLAY[tc.name] || { label: tc.name, emoji: "🔧", color: "text-white/50" };
        return (
          <div key={tc.id} className="flex items-start gap-2 px-3 py-2 bg-black/40 border border-white/8 text-[11px]">
            <span className="shrink-0 mt-0.5 text-base leading-none">{display.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`font-mono font-semibold ${display.color}`}>{display.label}</span>
                {tc.status === "calling" && <Loader2 size={10} className="animate-spin text-white/40" />}
                {tc.status === "done" && <span className="text-emerald-400/70 text-[10px]">✓ {chat.toolDone}</span>}
                {tc.status === "error" && <span className="text-red-400/70 text-[10px]">✗ {chat.toolError}</span>}
              </div>
              {tc.args && Object.keys(tc.args).length > 0 && (
                <div className="text-white/30 mt-0.5 font-mono truncate text-[10px]">
                  {Object.entries(tc.args).map(([k, v]) => `${k}: ${String(v).slice(0, 60)}`).join(" · ")}
                </div>
              )}
              {tc.outputPreview && (
                <div className="text-white/25 mt-1 font-mono text-[10px] line-clamp-3 whitespace-pre-wrap">
                  {tc.outputPreview.slice(0, 300)}{tc.outputPreview.length > 300 ? "..." : ""}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── AgentThinkingView — Manus Max 推理日志可视化 ────────────────────────────
function AgentThinkingView({
  logs,
  isOpen,
  onToggle,
}: {
  logs: any[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  if (logs.length === 0) return null;

  const roundColors: Record<string, string> = {
    thought: "text-blue-400",
    action: "text-emerald-400",
    observation: "text-amber-400",
    score: "text-purple-400",
    error: "text-red-400",
    done: "text-[#C9A84C]",
    start: "text-cyan-400",
  };

  const roundIcons: Record<string, string> = {
    start: "▶",
    thought: "💭",
    action: "⚡",
    observation: "👁",
    score: "📊",
    error: "⚠",
    done: "✓",
    patch: "🔧",
    iteration: "🔄",
    raw: "📋",
  };

  return (
    <div className="mb-3">
      {/* 标题栏 */}
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-1.5 bg-gradient-to-r from-[#1a1a2e] to-[#0f0f1a] border border-[#C9A84C]/30 rounded-t text-[11px] text-[#C9A84C]/80 hover:border-[#C9A84C]/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[#C9A84C] font-bold tracking-widest text-[10px]">HYPERAGENTS</span>
          <span className="text-white/20">|</span>
          <span className="text-white/40">Manus Max · ReAct 推理日志</span>
          <span className="bg-[#C9A84C]/20 text-[#C9A84C] px-1.5 py-0.5 rounded text-[10px] font-mono">{logs.length} 步</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: Math.min(logs.length, 12) }, (_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  i === logs.length - 1 ? "bg-[#C9A84C]" : "bg-[#C9A84C]/30"
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <span className="text-white/30">{isOpen ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* 日志内容 */}
      {isOpen && (
        <div className="border-x border-b border-[#C9A84C]/30 rounded-b bg-black/60 font-mono text-[11px] overflow-hidden">
          <div className="max-h-64 overflow-y-auto p-3 space-y-0.5">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2 py-0.5 border-b border-white/5 last:border-0">
                <span className="shrink-0 text-[10px] text-white/20 w-6 mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="shrink-0 text-[12px] mt-0.5">
                  {roundIcons[log.type] || "•"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className={`shrink-0 font-semibold uppercase text-[9px] ${roundColors[log.type] || "text-white/40"}`}>
                      {log.type}
                    </span>
                    {log.round && (
                      <span className="text-white/20 text-[9px]">· 第{log.round}轮</span>
                    )}
                    {log.tool && (
                      <span className="text-white/30 text-[9px] truncate">[{log.tool}]</span>
                    )}
                  </div>
                  <div className="text-white/70 mt-0.5 leading-relaxed">
                    {typeof log.message === "string"
                      ? log.message.slice(0, 200)
                      : JSON.stringify(log.message)?.slice(0, 100)}
                  </div>
                  {log.success !== undefined && (
                    <div className={`text-[9px] mt-0.5 ${log.success ? "text-emerald-400/60" : "text-red-400/60"}`}>
                      {log.success ? "✓ 成功" : "✗ 失败"}
                    </div>
                  )}
                  {log.score !== undefined && (
                    <div className="mt-0.5 flex items-center gap-1">
                      <div className="h-1 w-16 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-400 rounded-full transition-all"
                          style={{ width: `${Math.round(log.score * 100)}%` }}
                        />
                      </div>
                      <span className="text-purple-400/60 text-[9px]">{Math.round(log.score * 100)}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MaoAIChat() {
  const [location, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const chat = t("maoai.chat", { returnObjects: true }) as any;
  const locale = i18n.resolvedLanguage || i18n.language || "zh";
  const isChinese = locale.startsWith("zh");
  const timeLocale = isChinese ? "zh-CN" : "en-US";
  const listSeparator = isChinese ? "、" : ", ";
  const modelDescriptions = getModelDescriptions(chat);
  const deerflowStarterPrompt = chat.deerflowStarterPrompt as string;
  const deerflowQuickPrompts = (chat.deerflowQuickPrompts ?? []) as string[];
  const defaultQuickPrompts = (chat.defaultQuickPrompts ?? []) as string[];
  const imageQuickPrompts = (chat.imageQuickPrompts ?? []) as string[];
  const imageGeneratedPrefix = chat.imageGeneratedPrefix as string;
  const imageGeneratedLabel = stripTrailingColon(imageGeneratedPrefix);
  const { user, loading, logout } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: MAOAI_ROUTES.LOGIN,
  });
  const isAdmin = (user as any)?.role === "admin";
  const { data: contentSub, hasContentAccess, isAdmin: isContentAdmin } = useContentSubscription(!!user);
  const isResearchEntry = location === MAOAI_ROUTES.RESEARCH || location === "/deerflow";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [activeNodeInfo, setActiveNodeInfo] = useState<ActiveNodeInfo | null>(null);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("maoai_selected_model") || "deepseek-chat";
    }
    return "deepseek-chat";
  });
  const [showPicker, setShowPicker] = useState(false);
  const [localNodes, setLocalNodes] = useState<LocalNode[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [currentConvId, setCurrentConvId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("chat");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const [currentToolCalls, setCurrentToolCalls] = useState<ToolCallStep[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string | null>(null);
  // ReAct 推理轮次状态
  const [reactRound, setReactRound] = useState<{ round: number; maxRounds: number } | null>(null);
  // Agent 推理日志（Manus Max 流式可视化）
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [agentThinkingOpen, setAgentThinkingOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 用于 useEffect 判断：流式生成中不触发 auto-scroll
  const isGeneratingRef = useRef(false);
  // 追踪用户是否主动向上滚（暂停自动置底）
  const userScrolledUpRef = useRef(false);
  // 防抖计时器（100ms 间隔限制滚动频率）
  const scrollDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // ── tRPC ────────────────────────────────────────────────────────────────────
  const utils = trpc.useUtils();
  // Dynamic model list from backend
  const { data: backendModels = [] } = trpc.ai.models.useQuery(undefined, { staleTime: 60_000 });
  const CLOUD_MODELS: CloudModel[] = backendModels.map(m => ({
    id: m.id,
    name: m.name,
    badge: m.badge,
    description: modelDescriptions[m.id]?.description ?? "",
    supportsVision: modelDescriptions[m.id]?.supportsVision,
    available: m.available,
    isLocal: false as const,
  }));

  const { data: conversations = [], isLoading: loadingConvs } = trpc.conversations.list.useQuery(
    undefined,
    { enabled: !!user }
  );
  const conversationList: Conversation[] = Array.isArray(conversations)
    ? (conversations as Conversation[])
    : [];
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
  const { data: mySubscription, refetch: refetchSubscription } = trpc.billing.mySubscription.useQuery(
    undefined,
    { enabled: !!user, staleTime: 60_000 }
  );
  const { data: historyMessages } = trpc.messages.list.useQuery(
    { conversationId: currentConvId! },
    { enabled: !!currentConvId }
  );

  const activateDeerFlowEntry = useCallback(() => {
    setInputMode("chat");
    setShowUpgradePrompt(null);
    setInput((prev) => (prev.trim() ? prev : deerflowStarterPrompt));
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [deerflowStarterPrompt]);

  const formatConversationTime = useCallback((dateStr: string): string => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return d.toLocaleTimeString(timeLocale, { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays === 1) {
      return chat.yesterday;
    }
    if (diffDays < 7) {
      return t("maoai.chat.daysAgo", { count: diffDays });
    }
    return d.toLocaleDateString(timeLocale, { month: "short", day: "numeric" });
  }, [chat.yesterday, t, timeLocale]);

  useEffect(() => {
    // 仅在新消息追加时（非流式生成中）触发滚动
    if (!isGeneratingRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 流式内容更新时用防抖滚动
  useEffect(() => {
    if (streamingContent) {
      safeScrollToBottom();
    }
  }, [streamingContent]);

  useEffect(() => {
    if (isResearchEntry) {
      activateDeerFlowEntry();
    }
  }, [isResearchEntry, activateDeerFlowEntry]);

  // Load messages when switching conversations
  useEffect(() => {
    if (!Array.isArray(historyMessages) || !currentConvId) return;
    const loaded: Message[] = historyMessages.map((m: any) => {
      let content: MessageContent;
      let generatedImageUrl: string | undefined;
      let isImageGeneration = false;

      // Try to detect image generation messages stored as JSON
      try {
        const meta = JSON.parse(m.content);
        if (meta && typeof meta === "object" && meta.generatedImageUrl) {
          generatedImageUrl = meta.generatedImageUrl as string;
          isImageGeneration = true;
          content = meta.prompt ? `${imageGeneratedPrefix}${meta.prompt}` : imageGeneratedLabel;
        } else if (Array.isArray(meta)) {
          content = meta;
        } else {
          content = m.content as string;
        }
      } catch {
        content = m.content as string;
      }

      return {
        role: m.role as "user" | "assistant",
        content,
        displayText: getDisplayText(content),
        imageUrls: getImageUrls(content),
        generatedImageUrl,
        isImageGeneration,
      };
    });
    setMessages(loaded);
  }, [historyMessages, currentConvId, imageGeneratedLabel, imageGeneratedPrefix]);

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
            description: `${m.model_id || chat.localModel} · ${m.is_online !== false ? chat.online : chat.offline}`,
            modelId: m.model_id || "",
            isLocal: true,
            isOnline: m.is_online !== false,
          }));
        setLocalNodes(locals);
      }
    } catch { /* ignore */ }
    setLoadingNodes(false);
  }, [chat.localModel, chat.online, chat.offline, isAdmin]);

  useEffect(() => {
    if (isAdmin) fetchLocalNodes();
  }, [isAdmin, fetchLocalNodes]);

  // Auto-select first usable model when backend/local models load
  useEffect(() => {
    const currentCloud = backendModels.find((m) => m.id === selectedId);
    const currentLocal = localNodes.find((n) => n.id === selectedId);

    if (currentLocal && currentLocal.isOnline !== false) return;
    if (currentCloud && currentCloud.available !== false) return;

    const firstAvailableCloud = backendModels.find((m) => m.available);
    if (firstAvailableCloud) {
      if (firstAvailableCloud.id !== selectedId) setSelectedId(firstAvailableCloud.id);
      return;
    }

    if (isAdmin) {
      const firstAvailableLocal = localNodes.find((n) => n.isOnline !== false);
      if (firstAvailableLocal && firstAvailableLocal.id !== selectedId) {
        setSelectedId(firstAvailableLocal.id);
      }
    }
  }, [backendModels, isAdmin, localNodes, selectedId]);

  const addImageFromFile = async (file: File | Blob) => {
    if (!file.type.startsWith("image/")) return;
    const dataUrl = await fileToDataUrl(file);
    setPendingImages(prev => [...prev, dataUrl]);
  };

  // ── 防抖滚动到底 ──────────────────────────────────────────────
  // 100ms 间隔限制 + 用户主动滚上时暂停
  const safeScrollToBottom = useCallback((force = false) => {
    if (scrollDebounceRef.current) return; // 防抖：还在冷却中
    if (userScrolledUpRef.current && !force) return; // 用户滚上去了，除非强制

    scrollDebounceRef.current = setTimeout(() => {
      scrollDebounceRef.current = null;
      const container = messagesEndRef.current?.parentElement?.parentElement;
      if (!container) return;
      const dist = container.scrollHeight - container.scrollTop - container.clientHeight;
      if (dist > 100 || force) {
        container.scrollTo({ top: container.scrollHeight, behavior: isGeneratingRef.current ? "instant" : "smooth" });
      }
    }, 100);
  }, []);

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

  const removePendingFile = (idx: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    e.target.value = "";
    setIsUploadingFile(true);
    try {
      for (const file of Array.from(files)) {
        // Images go to pendingImages (base64 inline), documents go to pendingFiles
        if (file.type.startsWith("image/")) {
          await addImageFromFile(file);
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);
        const token = localStorage.getItem("maoai_session_token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const resp = await fetch(`${BACKEND_URL}/api/ai/upload`, {
          method: "POST",
          headers,
          credentials: "include",
          body: formData,
        });
        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
          throw new Error(errData.error || `HTTP ${resp.status}`);
        }
        const data = await resp.json();
        if (data.type === "image") {
          // Server returned image as base64 data URL
          setPendingImages(prev => [...prev, data.dataUrl]);
        } else {
          // Document: store extracted text
          setPendingFiles(prev => [...prev, {
            name: data.fileName,
            fileType: data.fileType,
            text: data.text,
            size: data.size,
            truncated: data.truncated,
            charCount: data.charCount,
          }]);
        }
      }
    } catch (err: any) {
      alert(t("maoai.chat.uploadFailed", { message: err.message }));
    } finally {
      setIsUploadingFile(false);
    }
  };

  // ── Drag & Drop handlers ────────────────────────────────────────────────────
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    setIsUploadingFile(true);
    try {
      for (const file of files) {
        if (file.type.startsWith("image/")) {
          await addImageFromFile(file);
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);
        const token = localStorage.getItem("maoai_session_token");
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const resp = await fetch(`${BACKEND_URL}/api/ai/upload`, {
          method: "POST",
          headers,
          credentials: "include",
          body: formData,
        });
        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
          throw new Error(errData.error || `HTTP ${resp.status}`);
        }
        const data = await resp.json();
        if (data.type === "image") {
          setPendingImages(prev => [...prev, data.dataUrl]);
        } else {
          setPendingFiles(prev => [...prev, {
            name: data.fileName,
            fileType: data.fileType,
            text: data.text,
            size: data.size,
            truncated: data.truncated,
            charCount: data.charCount,
          }]);
        }
      }
    } catch (err: any) {
      alert(t("maoai.chat.uploadFailed", { message: err.message }));
    } finally {
      setIsUploadingFile(false);
    }
  }, [t]);

  const startNewChat = () => {
    setCurrentConvId(null);
    setMessages([]);
    setInput("");
    setPendingImages([]);
    setPendingFiles([]);
    setInputMode("chat");
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
    return cleaned.length > 30 ? cleaned.slice(0, 30) + "…" : cleaned || chat.newConversation;
  };

  const ensureConversation = async (titleText: string): Promise<number | null> => {
    if (currentConvId) return currentConvId;
    try {
      const title = generateTitle(titleText);
      const created = await createConvMutation.mutateAsync({ title, model: selectedId });
      const newId = (created as any).id as number;
      setCurrentConvId(newId);
      return newId;
    } catch (err) {
      console.warn("[MaoAI] create conv failed:", err);
      return null;
    }
  };

  const allOptions: ModelOption[] = [...CLOUD_MODELS, ...(isAdmin ? localNodes : [])];
  const FALLBACK_MODEL: CloudModel = {
    id: "deepseek-chat",
    name: "DeepSeek V3",
    badge: "🔵",
    description: modelDescriptions["deepseek-chat"]?.description ?? "",
    isLocal: false,
  };
  const currentOption = allOptions.find(m => m.id === selectedId) || CLOUD_MODELS[0] || FALLBACK_MODEL;

  // ── Limit check helpers ───────────────────────────────────────────────────────────
  const checkChatLimit = (): boolean => {
    if (!mySubscription) return true; // not loaded yet, allow
    const { limits, usage } = mySubscription;
    if (limits.dailyChatMessages === -1) return true;
    if (usage.chatMessages >= limits.dailyChatMessages) {
      setShowUpgradePrompt("chat");
      return false;
    }
    return true;
  };

  const checkImageLimit = (): boolean => {
    if (!mySubscription) return true;
    const { limits, usage, tier } = mySubscription;
    if (!limits.imageGeneration) {
      setShowUpgradePrompt("image_locked");
      return false;
    }
    if (limits.dailyImageGenerations !== -1 && usage.imageGenerations >= limits.dailyImageGenerations) {
      setShowUpgradePrompt("image");
      return false;
    }
    return true;
  };

  const checkPremiumModel = (modelId: string): boolean => {
    const premiumModels = ["deepseek-reasoner", "glm-4-plus"];
    if (!premiumModels.includes(modelId)) return true;
    if (!mySubscription) return true;
    if (!mySubscription.limits.premiumModels) {
      setShowUpgradePrompt("premium_model");
      return false;
    }
    return true;
  };

  // ── Image generation (nano banana) ─────────────────────────────────────────
  const generateImage = async (prompt: string) => {
    if (!prompt.trim() || isGeneratingImage) return;
    if (!checkImageLimit()) return;

    const userMsg: Message = {
      role: "user",
      content: `${imageGeneratedPrefix}${prompt.trim()}`,
      displayText: `${imageGeneratedPrefix}${prompt.trim()}`,
      isImageGeneration: true,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsGeneratingImage(true);

    const convId = await ensureConversation(`${chat.imageTitlePrefix}${prompt.trim()}`);
    if (convId) {
      await saveMessageToDB(convId, "user", `${imageGeneratedPrefix}${prompt.trim()}`);
    }

    try {
      const resp = await fetch(`${BACKEND_URL}/api/ai/image/generate`, {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: "include",
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        throw new Error(errData.error || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const imageUrl = data.url as string;

      const assistantMsg: Message = {
        role: "assistant",
        content: JSON.stringify({ generatedImageUrl: imageUrl, prompt: prompt.trim() }),
        generatedImageUrl: imageUrl,
        isImageGeneration: true,
        displayText: `${chat.generatedImageSaved}${prompt.trim()}`,
      };
      setMessages(prev => [...prev, assistantMsg]);

      if (convId) {
        await saveMessageToDB(
          convId,
          "assistant",
          JSON.stringify({ generatedImageUrl: imageUrl, prompt: prompt.trim() }),
          "nano-banana"
        );
        updateConvMutation.mutate({ id: convId, model: "nano-banana" });
      }
    } catch (err: any) {
      const errMsg = t("maoai.chat.imageFailed", { message: err.message });
      setMessages(prev => [...prev, { role: "assistant", content: errMsg, displayText: errMsg }]);
      if (convId) {
        await saveMessageToDB(convId, "assistant", errMsg);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // ── Send chat message ────────────────────────────────────────────────────────
  const sendMessage = async (textContent: string) => {
    if ((!textContent.trim() && pendingImages.length === 0 && pendingFiles.length === 0) || isStreaming) return;
    if (!checkChatLimit()) return;
    if (!currentOption.isLocal && !checkPremiumModel(selectedId)) return;

    // Build document context system prompt from pending files
    let docSystemPrompt = "";
    if (pendingFiles.length > 0) {
      const sections = pendingFiles.map(f => {
        const typeLabels = chat.docTypeLabels ?? {};
        const typeLabel = f.fileType === "pdf"
          ? typeLabels.pdf
          : f.fileType === "docx"
          ? typeLabels.docx
          : f.fileType === "csv"
          ? typeLabels.csv
          : f.fileType === "json"
          ? typeLabels.json
          : f.fileType === "markdown"
          ? typeLabels.markdown
          : typeLabels.text;
        return `【${typeLabel}：${f.name}】\n${f.text}${f.truncated ? `\n\n${chat.docTruncatedNotice}` : ""}`;
      }).join("\n\n---\n\n");
      docSystemPrompt = `${chat.docContextIntro}\n\n${sections}`;
    }

    let userContent: MessageContent;
    if (pendingImages.length > 0) {
      const parts: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [];
      for (const imgUrl of pendingImages) parts.push({ type: "image_url", image_url: { url: imgUrl } });
      const textPart = textContent.trim() || (pendingFiles.length > 0 ? chat.analyzeImageWithFiles : chat.analyzeImageOnly);
      parts.push({ type: "text", text: textPart });
      userContent = parts;
    } else if (!textContent.trim() && pendingFiles.length > 0) {
      userContent = `${chat.analyzeUploadedFiles}${pendingFiles.map(f => f.name).join(listSeparator)}`;
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
    setPendingFiles([]);
    setIsStreaming(true);
    isGeneratingRef.current = true;
    userScrolledUpRef.current = false; // 重置：开始生成时默认跟随
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
    if (docSystemPrompt) {
      bodyPayload.systemPrompt = docSystemPrompt;
    }
    if (currentAgent) {
      bodyPayload.agent = currentAgent;
    }
    if (isLocal) {
      bodyPayload.useLocal = true;
      bodyPayload.nodeId = (currentOption as LocalNode).nodeId;
    } else {
      bodyPayload.model = selectedId;
    }

    let fullContent = "";
    let capturedNodeInfo: ActiveNodeInfo | null = null;
    const liveToolCalls: ToolCallStep[] = [];
    setCurrentToolCalls([]);
    setReactRound(null);
    setAgentLogs([]);

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
          if (!trimmed || trimmed === "data: [DONE]") {
            if (trimmed === "data: [DONE]") {
              // Mark any 'calling' skill invoke steps as done
              const updated = liveToolCalls.map(t =>
                t.status === "calling" && t.id.startsWith("skill-") ? { ...t, status: "done" as const } : t
              );
              if (updated.some((t, i) => t.status !== liveToolCalls[i]?.status)) {
                liveToolCalls.splice(0, liveToolCalls.length, ...updated);
                setCurrentToolCalls([...liveToolCalls]);
              }
            }
            continue;
          }
          if (trimmed.startsWith("data: ")) {
            try {
              const chunk = JSON.parse(trimmed.slice(6));
              if (chunk.nodeInfo) {
                capturedNodeInfo = chunk.nodeInfo as ActiveNodeInfo;
                setActiveNodeInfo(capturedNodeInfo);
              } else if (chunk.content) {
                fullContent += chunk.content;
                setStreamingContent(fullContent);
                safeScrollToBottom(); // 防抖滚动：避免每个字符都跳
              } else if (chunk.error) {
                fullContent += `\n\n${chat.streamErrorPrefix} ${chunk.error}`;
                setStreamingContent(fullContent);
                safeScrollToBottom(true);
              } else if (chunk.skillMatch) {
                // Skill was matched — show it as a tool-call-style step
                const step: ToolCallStep = {
                  id: `skill-${chunk.skillMatch.skillId}`,
                  name: chunk.skillMatch.mode === "invoke"
                    ? `${chat.skillInvokeLabel}: ${chunk.skillMatch.name}`
                    : `${chat.skillModeLabel}: ${chunk.skillMatch.name}`,
                  args: { skillId: chunk.skillMatch.skillId, mode: chunk.skillMatch.mode },
                  status: chunk.skillMatch.mode === "invoke" ? "calling" : "done",
                };
                liveToolCalls.push(step);
                setCurrentToolCalls([...liveToolCalls]);
              } else if (chunk.toolCall) {
                // Tool is being called
                const step: ToolCallStep = {
                  id: chunk.toolCall.id,
                  name: chunk.toolCall.name,
                  args: chunk.toolCall.args,
                  status: "calling",
                };
                liveToolCalls.push(step);
                setCurrentToolCalls([...liveToolCalls]);
              } else if (chunk.toolResult) {
                // Tool result received
                const idx = liveToolCalls.findIndex(t => t.id === chunk.toolResult.id);
                if (idx >= 0) {
                  liveToolCalls[idx] = {
                    ...liveToolCalls[idx],
                    status: chunk.toolResult.success ? "done" : "error",
                    outputPreview: chunk.toolResult.output,
                  };
                  setCurrentToolCalls([...liveToolCalls]);
                }
              } else if (chunk.reactRound) {
                // ReAct 推理轮次开始
                setReactRound({ round: chunk.reactRound.round, maxRounds: chunk.reactRound.maxRounds });
              } else if (chunk.reactEnd) {
                // ReAct 推理结束，清除轮次状态
                setReactRound(null);
              } else if (chunk.agentLog) {
                // Agent 推理日志（Manus Max 流式可视化）
                setAgentLogs(prev => [...prev, chunk.agentLog]);
              }
            } catch { /* skip */ }
          }
        }
      }

      setMessages(prev => [...prev, {
        role: "assistant",
        content: fullContent || chat.noResponse,
        nodeInfo: capturedNodeInfo || undefined,
        toolCalls: liveToolCalls.length > 0 ? [...liveToolCalls] : undefined,
      }]);
      setCurrentToolCalls([]);
      if (convId) {
        await saveMessageToDB(convId, "assistant", fullContent || chat.noResponse, selectedId);
        updateConvMutation.mutate({ id: convId, model: selectedId });
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        const errMsg = t("maoai.chat.requestFailed", { message: err.message });
        setMessages(prev => [...prev, { role: "assistant", content: errMsg }]);
        if (convId) await saveMessageToDB(convId, "assistant", errMsg);
      } else if (fullContent) {
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") return prev;
          return [...prev, { role: "assistant" as const, content: fullContent, nodeInfo: capturedNodeInfo || undefined, toolCalls: liveToolCalls.length > 0 ? [...liveToolCalls] : undefined }];
        });
        if (convId) await saveMessageToDB(convId, "assistant", fullContent, selectedId);
      }
      setCurrentToolCalls([]);
      setReactRound(null);
      setAgentLogs([]);
    } finally {
      isGeneratingRef.current = false;
      setIsStreaming(false);
      safeScrollToBottom(true); // 生成完毕，强制滚到底
      setStreamingContent("");
      setReactRound(null);
      setAgentLogs([]);
      abortRef.current = null;
    }
  };

  const handleSend = () => {
    if (inputMode === "image") {
      generateImage(input);
    } else {
      sendMessage(input);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ignore Enter during IME composition (e.g. Chinese/Japanese input methods)
    // Also ignore when busy — streaming / generating image / uploading file
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!isBusy) {
        handleSend();
      }
    }
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

  const isBusy = isStreaming || isGeneratingImage || isUploadingFile;

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
            <span className="text-xs font-semibold tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>{chat.history}</span>
          </div>
          <button
            onClick={startNewChat}
            className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#C9A84C]/60 border border-[#C9A84C]/20 hover:border-[#C9A84C]/50 hover:text-[#C9A84C] transition-all"
            title={chat.newConversation}
          >
            <MessageSquarePlus size={11} />
            <span>{chat.newChat}</span>
          </button>
        </div>
        {user && (
          <div className="px-2 pt-2 pb-1 shrink-0">
            {hasContentAccess ? (
              <a
                href="/content"
                className="flex items-center gap-2 px-3 py-2.5 text-xs text-[#40d090]/85 hover:text-[#40d090] hover:bg-[#40d090]/8 border border-[#40d090]/15 hover:border-[#40d090]/25 transition-all rounded"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                <LayoutGrid size={13} className="shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate">{t("nav.contentPlatform")}</div>
                  <div className="text-[9px] uppercase tracking-[0.18em] text-[#40d090]/35">CONTENT</div>
                </div>
                {contentSub.plan !== "free" && (
                  <span className="text-[9px] px-1.5 py-0.5 bg-[#40d090]/15 border border-[#40d090]/25 text-[#40d090]/70 rounded-sm capitalize shrink-0">
                    {contentSub.plan}
                  </span>
                )}
              </a>
            ) : (
              <button
                onClick={() => window.location.href = MAOAI_ROUTES.PRICING}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-white/35 hover:text-white/50 hover:bg-white/3 border border-white/6 hover:border-white/10 transition-all rounded cursor-pointer"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                <Lock size={12} className="shrink-0" />
                <div className="min-w-0 flex-1 text-left">
                  <div className="truncate">{t("nav.contentPlatform")}</div>
                  <div className="text-[9px] uppercase tracking-[0.18em] text-white/20">CONTENT</div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-[#C9A84C]/50 rounded-sm shrink-0">{chat.upgradeContent}</span>
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-1">
          {loadingConvs && (
            <div className="flex items-center justify-center py-8 text-white/20">
              <Loader2 size={16} className="animate-spin" />
            </div>
          )}
          {!loadingConvs && conversationList.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-white/20 text-xs">{chat.noHistory}</p>
              <p className="text-white/10 text-[11px] mt-1">{chat.autoSaved}</p>
            </div>
          )}
          {conversationList.map((conv) => (
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
                <p className="text-[10px] text-white/20 mt-0.5">{formatConversationTime(conv.updatedAt)}</p>
              </div>
              <button
                onClick={(e) => deleteConversation(conv.id, e)}
                className="absolute right-2 top-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-white/25 hover:text-red-400/70 p-0.5"
                title={chat.deleteConversation}
              >
                {deletingId === conv.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            </div>
          ))}
        </div>

        {/* ── Sidebar bottom nav ── */}
        <div className="shrink-0 border-t border-[#C9A84C]/10 px-2 py-2 flex flex-col gap-1">
          {user && (
            <a
              href={MAOAI_ROUTES.SALES}
              className="flex items-center gap-2 px-3 py-2 text-xs text-sky-400/75 hover:text-sky-400 hover:bg-sky-400/8 border border-transparent hover:border-sky-400/20 transition-all rounded"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              <Crown size={12} className="shrink-0" />
              <span className="truncate">{t("nav.salesWorkbench")}</span>
              <span className="ml-auto text-[9px] text-sky-400/45">CRM</span>
            </a>
          )}
          {user && (
            <button
              onClick={() => {
                navigate(MAOAI_ROUTES.RESEARCH);
                activateDeerFlowEntry();
              }}
              className={`flex items-center gap-2 px-3 py-2 text-xs border transition-all rounded ${
                isResearchEntry
                  ? "text-[#C9A84C] bg-[#C9A84C]/10 border-[#C9A84C]/25"
                  : "text-purple-400/75 hover:text-purple-400 hover:bg-purple-400/8 border-transparent hover:border-purple-400/20"
              }`}
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              <Search size={12} className="shrink-0" />
              <span className="truncate">{t("nav.deerflow")}</span>
              <span className="ml-auto text-[9px] text-purple-400/45">DEEP</span>
            </button>
          )}
          {user && (
            <a
              href={MAOAI_ROUTES.RESEARCH_DIGEST}
              className={`flex items-center gap-2 px-3 py-2 text-xs border transition-all rounded ${
                location === MAOAI_ROUTES.RESEARCH_DIGEST
                  ? "text-[#C9A84C] bg-[#C9A84C]/10 border-[#C9A84C]/25"
                  : "text-amber-400/65 hover:text-amber-400 hover:bg-amber-400/8 border-transparent hover:border-amber-400/20"
              }`}
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              <BookOpen size={12} className="shrink-0" />
              <span className="truncate">{t("nav.researchDigest")}</span>
              <span className="ml-auto text-[9px] text-amber-400/40">HBR</span>
            </a>
          )}
          {/* 管理员：内容调度 */}
          {(isAdmin || isContentAdmin) && (
            <a
              href="/admin/content-jobs"
              className="flex items-center gap-2 px-3 py-2 text-xs text-orange-400/60 hover:text-orange-400 hover:bg-orange-400/5 border border-transparent hover:border-orange-400/20 transition-all rounded"
              style={{ fontFamily: "'DM Mono', monospace" }}
              title={chat.contentSchedulerTitle}
            >
              <Zap size={12} className="shrink-0" />
              <span className="truncate">{chat.contentScheduler}</span>
              <span className="ml-auto text-[9px] text-orange-400/40">ADMIN</span>
            </a>
          )}
        </div>

        {mySubscription && (
          <div className="shrink-0 border-t border-white/5 bg-[#0D0D0D] px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Crown size={10} className={mySubscription.tier === "starter" ? "text-sky-400" : mySubscription.tier === "pro" ? "text-[#C9A84C]" : mySubscription.tier === "flagship" ? "text-purple-400" : "text-white/25"} />
                <span className={`text-[10px] font-medium ${
                  mySubscription.tier === "starter" ? "text-sky-400/70" :
                  mySubscription.tier === "pro" ? "text-[#C9A84C]/70" :
                  mySubscription.tier === "flagship" ? "text-purple-400/70" :
                  "text-white/30"
                }`}>
                  {mySubscription.tier === "free"
                    ? chat.tiers.free
                    : mySubscription.tier === "starter"
                    ? chat.tiers.starter
                    : mySubscription.tier === "pro"
                    ? chat.tiers.pro
                    : chat.tiers.flagship}
                </span>
              </div>
              <a href={MAOAI_ROUTES.PRICING} className="text-[9px] text-white/20 hover:text-[#C9A84C]/60 transition-colors">
                {mySubscription.tier === "free" ? `${chat.upgradeContent} →` : chat.manage}
              </a>
            </div>
            {mySubscription.limits.dailyChatMessages !== -1 && (
              <div className="mb-1.5">
                <div className="flex justify-between text-[9px] text-white/20 mb-0.5">
                  <span>{chat.chatUsage}</span>
                  <span>{mySubscription.usage.chatMessages}/{mySubscription.limits.dailyChatMessages}</span>
                </div>
                <div className="h-0.5 bg-white/8 w-full">
                  <div
                    className="h-0.5 bg-[#C9A84C]/50 transition-all"
                    style={{ width: `${Math.min(100, (mySubscription.usage.chatMessages / mySubscription.limits.dailyChatMessages) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            {mySubscription.limits.imageGeneration && mySubscription.limits.dailyImageGenerations !== -1 && (
              <div>
                <div className="flex justify-between text-[9px] text-white/20 mb-0.5">
                  <span>{chat.imageUsage}</span>
                  <span>{mySubscription.usage.imageGenerations}/{mySubscription.limits.dailyImageGenerations}</span>
                </div>
                <div className="h-0.5 bg-white/8 w-full">
                  <div
                    className="h-0.5 bg-purple-400/50 transition-all"
                    style={{ width: `${Math.min(100, (mySubscription.usage.imageGenerations / mySubscription.limits.dailyImageGenerations) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            {mySubscription.tier === "flagship" && (
              <p className="text-[9px] text-purple-400/40 mt-1">{chat.unlimited}</p>
            )}
          </div>
        )}
      </aside>

      {/* ── Main area ── */}
      <div
        className="flex-1 flex flex-col min-w-0 overflow-hidden relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-[#0A0A0A]/90 border-2 border-dashed border-[#C9A84C]/60 flex flex-col items-center justify-center gap-4 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
              <Paperclip size={28} className="text-[#C9A84C]/70" />
            </div>
            <p className="text-[#C9A84C]/80 text-lg font-medium">{chat.dragTitle}</p>
            <p className="text-white/30 text-sm">{chat.dragDescription}</p>
          </div>
        )}

        {/* ── Header ── */}
        <header className="border-b border-[#C9A84C]/20 bg-[#0A0A0A]/95 backdrop-blur-sm shrink-0 z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(v => !v)}
                className="text-white/30 hover:text-[#C9A84C]/70 transition-colors p-1"
                title={sidebarOpen ? chat.collapseSidebar : chat.expandSidebar}
              >
                {sidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
              </button>
              <div className="w-8 h-8 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
                <Bot size={16} className="text-[#C9A84C]" />
              </div>
              <div>
                <h1 className="text-[#C9A84C] font-semibold text-sm tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>
                  {isResearchEntry ? t("nav.deerflow") : "MaoAI"}
                </h1>
                <p className="text-white/30 text-xs">{isResearchEntry ? chat.researchWorkbench : chat.aiControlCenter}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={startNewChat} className="text-white/30 hover:text-[#C9A84C]/70 transition-colors p-1" title={chat.newConversation}>
                <MessageSquarePlus size={16} />
              </button>
              {/* Model picker — only in chat mode */}
              {inputMode === "chat" && (
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
                    <div className="absolute right-0 top-full mt-1 w-72 max-h-[70vh] overflow-y-auto bg-[#111] border border-[#C9A84C]/20 shadow-2xl z-20 rounded-lg">
                      <div className="px-3 py-2 border-b border-white/5 sticky top-0 bg-[#111]">
                        <div className="flex items-center gap-1.5 text-sky-400/70 text-[10px] font-semibold tracking-widest uppercase">
                          <Cloud size={10} /><span>{chat.cloudModels}</span>
                        </div>
                      </div>
                      {CLOUD_MODELS.map(m => (
                        <button key={m.id} onClick={() => { if (m.available !== false) { localStorage.setItem("maoai_selected_model", m.id); setSelectedId(m.id); setShowPicker(false); } }}
                          disabled={m.available === false}
                          className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors ${m.available === false ? "opacity-40 cursor-not-allowed" : "hover:bg-[#C9A84C]/5"} ${m.id === selectedId ? "bg-[#C9A84C]/10" : ""}`}>
                          <span className="text-sm mt-0.5 shrink-0">{m.badge}</span>
                          <div className="min-w-0">
                            <div className="text-white/90 text-xs font-medium flex items-center gap-1.5" style={{ fontFamily: "'DM Mono', monospace" }}>
                              {m.name}
                              {m.supportsVision && <span className="text-[9px] px-1 py-0.5 bg-purple-500/20 text-purple-400/80 border border-purple-500/20">{chat.vision}</span>}
                              {m.available === false && <span className="text-[9px] px-1 py-0.5 bg-red-500/20 text-red-400/80 border border-red-500/20">{chat.notConfigured}</span>}
                            </div>
                            <div className="text-white/35 text-[11px] mt-0.5 truncate">{m.description || "—"}</div>
                          </div>
                          {m.id === selectedId && <div className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-[#C9A84C] mt-1.5" />}
                        </button>
                      ))}
                      {isAdmin && (
                        <>
                          <div className="px-3 py-2 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-emerald-400/70 text-[10px] font-semibold tracking-widest uppercase">
                              <Monitor size={10} /><span>{chat.localNodes}</span>
                              <span className="text-white/20 normal-case font-normal">· {chat.adminOnly}</span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); fetchLocalNodes(); }} className="text-white/30 hover:text-white/60 transition-colors p-0.5" title={chat.refreshLocalNodes}>
                              <RefreshCw size={10} className={loadingNodes ? "animate-spin" : ""} />
                            </button>
                          </div>
                          {loadingNodes && <div className="px-4 py-3 text-white/30 text-xs flex items-center gap-2"><Loader2 size={12} className="animate-spin" /><span>{chat.loadingNodes}</span></div>}
                          {!loadingNodes && localNodes.length === 0 && <div className="px-4 py-3 text-white/25 text-xs">{chat.noLocalNodes}<div className="text-white/15 text-[11px] mt-0.5">{chat.ollamaHint}</div></div>}
                          {localNodes.map(n => (
                            <button key={n.id} onClick={() => { localStorage.setItem("maoai_selected_model", n.id); setSelectedId(n.id); setShowPicker(false); }}
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
              )}
              {/* Agent 模式选择器 */}
              <AgentModeSelector
                currentAgent={currentAgent}
                onAgentChange={(agentId) => setCurrentAgent(agentId)}
                disabled={isBusy}
              />
              {/* Image mode badge */}
              {inputMode === "image" && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-500/30 text-purple-400/80 text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>
                  <Wand2 size={11} />
                  <span>nano banana</span>
                </div>
              )}
              <LanguageSwitcher compact className="shrink-0" />
              {isAdmin && (
                <a href="/admin/nodes" className="text-[#C9A84C]/60 text-xs hover:text-[#C9A84C] transition-colors font-mono border border-[#C9A84C]/20 px-2 py-1 hover:border-[#C9A84C]/40" title={chat.adminConsole}>
                  ADMIN →
                </a>
              )}
              {user && (
                <div className="flex items-center gap-2">
                  <span className="text-white/30 text-xs hidden sm:block truncate max-w-[120px]">{(user as any).name || (user as any).email}</span>
                  <button onClick={logout} className="text-white/30 hover:text-white/60 transition-colors p-1" title={chat.logout}>
                    <LogOut size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Messages area ── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ overflowAnchor: "auto" }}
          onScroll={(e) => {
            const el = e.currentTarget;
            const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
            // 用户向上滚超过 150px → 暂停自动置底
            if (dist > 150) {
              userScrolledUpRef.current = true;
            } else if (dist < 30) {
              userScrolledUpRef.current = false;
            }
          }}
        >
          <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
            {messages.length === 0 && !isBusy && (
              <div className="flex flex-col items-center justify-center py-16 gap-6">
                <div className="w-16 h-16 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
                  <Bot size={28} className="text-[#C9A84C]/60" />
                </div>
                <div className="text-center">
                  <h2 className="text-white/70 text-lg font-medium mb-1">{isResearchEntry ? chat.welcomeResearch : chat.welcomeChat}</h2>
                  <p className="text-white/30 text-sm">
                    {chat.currentMode}
                    <span className={currentOption.isLocal ? "text-emerald-400/70" : "text-sky-400/70"}>
                      {currentOption.isLocal ? chat.localNode : chat.cloud}
                    </span>
                    {" · "}
                    <span className="text-white/50">{currentOption.badge} {currentOption.name}</span>
                  </p>
                  <p className="text-white/20 text-xs mt-2">
                    {isResearchEntry ? chat.researchDescription : chat.chatDescription}
                  </p>
                </div>
                {/* Chat quick prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {(isResearchEntry ? deerflowQuickPrompts : defaultQuickPrompts).map(prompt => (
                    <button key={prompt} onClick={() => { setInputMode("chat"); sendMessage(prompt); }}
                      className="text-left px-4 py-3 border border-white/10 text-white/50 text-sm hover:border-[#C9A84C]/40 hover:text-white/70 transition-all">
                      {prompt}
                    </button>
                  ))}
                </div>
                {/* Image generation quick prompts */}
                <div className="w-full max-w-lg">
                  <p className="text-white/20 text-[11px] mb-2 flex items-center gap-1.5">
                    <Wand2 size={10} className="text-purple-400/50" />
                    <span>{chat.imageQuickTitle}</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {imageQuickPrompts.map(prompt => (
                      <button key={prompt} onClick={() => { setInputMode("image"); setInput(prompt); textareaRef.current?.focus(); }}
                        className="text-left px-4 py-3 border border-purple-500/15 text-white/35 text-sm hover:border-purple-500/40 hover:text-white/60 transition-all flex items-center gap-2">
                        <ImageIcon size={12} className="text-purple-400/40 shrink-0" />
                        <span>{prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg, i) => {
              const displayText = msg.displayText ?? (typeof msg.content === "string" ? msg.content : getDisplayText(msg.content));
              const imageUrls = msg.imageUrls ?? getImageUrls(msg.content);

              return (
                <div key={i} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 mt-1 ${msg.isImageGeneration ? "bg-purple-500/10 border-purple-500/20" : "bg-[#C9A84C]/10 border-[#C9A84C]/20"}`}>
                      {msg.isImageGeneration ? <Wand2 size={14} className="text-purple-400" /> : <Bot size={14} className="text-[#C9A84C]" />}
                    </div>
                  )}
                  <div className="max-w-[80%] flex flex-col gap-1">
                    {msg.role === "assistant" && msg.nodeInfo && !msg.isImageGeneration && (
                      <div className={`flex items-center gap-1.5 text-[10px] ${msg.nodeInfo.isLocal ? "text-emerald-400/50" : "text-sky-400/50"}`}>
                        {msg.nodeInfo.isLocal ? <Monitor size={9} /> : <Cloud size={9} />}
                        <span>{msg.nodeInfo.isLocal ? chat.localNode : chat.cloud}</span>
                        <span className="text-white/20">·</span>
                        <span>{msg.nodeInfo.name}</span>
                        <span className="text-white/20">·</span>
                        <span className="font-mono">{msg.nodeInfo.model}</span>
                      </div>
                    )}
                    {/* Tool call steps — shown for completed messages */}
                    {msg.role === "assistant" && msg.toolCalls && msg.toolCalls.length > 0 && (
                      <ToolCallSteps steps={msg.toolCalls} />
                    )}
                    {/* Image generation result */}
                    {msg.role === "assistant" && msg.isImageGeneration && msg.generatedImageUrl ? (
                      <div className="bg-white/5 border border-purple-500/20 rounded px-4 py-3">
                        <div className="flex items-center gap-1.5 text-[10px] text-purple-400/60 mb-2">
                          <Wand2 size={9} />
                          <span>nano banana · {chat.modeImage}</span>
                        </div>
                        <img
                          src={msg.generatedImageUrl}
                          alt={chat.imageAlt}
                          className="max-w-full rounded border border-white/10 object-contain"
                          style={{ maxHeight: "512px" }}
                        />
                        <a
                          href={msg.generatedImageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex items-center gap-1 text-[10px] text-white/25 hover:text-white/50 transition-colors"
                        >
                          <ImageIcon size={9} />
                          <span>{chat.viewOriginal}</span>
                        </a>
                      </div>
                    ) : (
                      <div className={`rounded px-4 py-3 text-sm ${msg.role === "user" ? "bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-white/90" : "bg-white/5 border border-white/10 text-white/85"}`}>
                        {msg.role === "user" && imageUrls.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {imageUrls.map((url, idx) => (
                              <img key={idx} src={url} alt={chat.attachedImageAlt} className="max-h-48 max-w-xs object-contain rounded border border-white/10" />
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
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                      <User size={14} className="text-white/50" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Streaming chat bubble */}
            {isStreaming && (
              <div className="flex gap-4 justify-start" data-streaming="true">
                <div className="w-8 h-8 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={14} className="text-[#C9A84C]" />
                </div>
                <div className="max-w-[80%] flex flex-col gap-1">
                  {activeNodeInfo && (
                    <div className={`flex items-center gap-1.5 text-[10px] ${activeNodeInfo.isLocal ? "text-emerald-400/60" : "text-sky-400/60"}`}>
                      {activeNodeInfo.isLocal ? <Monitor size={9} /> : <Cloud size={9} />}
                      <span className="animate-pulse">●</span>
                      <span>{activeNodeInfo.isLocal ? chat.localNode : chat.cloud}</span>
                      <span className="text-white/20">·</span>
                      <span>{activeNodeInfo.name}</span>
                      <span className="text-white/20">·</span>
                      <span className="font-mono">{activeNodeInfo.model}</span>
                    </div>
                  )}
                  {currentToolCalls.length > 0 && (
                    <ToolCallSteps steps={currentToolCalls} live={true} />
                  )}
                  {/* ReAct 推理轮次指示器 */}
                  {reactRound && (
                    <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded text-[11px]">
                      <div className="flex gap-1">
                        {Array.from({ length: reactRound.maxRounds }, (_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${
                              i < reactRound.round
                                ? "bg-emerald-400/60"
                                : i === reactRound.round - 1
                                ? "bg-[#C9A84C] animate-pulse"
                                : "bg-white/20"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[#C9A84C]/80">
                        🔄 推理中 · 第 {reactRound.round}/{reactRound.maxRounds} 轮
                      </span>
                      <span className="text-white/30">· ReAct Thinking</span>
                    </div>
                  )}
                  {/* Agent 推理日志视图（Manus Max 流式可视化） */}
                  <AgentThinkingView logs={agentLogs} isOpen={agentThinkingOpen} onToggle={() => setAgentThinkingOpen(v => !v)} />
                  <div className="bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white/85">
                    {streamingContent ? (
                      <div className="prose prose-sm prose-invert max-w-none prose-p:text-white/85 prose-code:text-[#C9A84C] prose-pre:bg-black/50">
                        <Streamdown>{streamingContent}</Streamdown>
                      </div>
                    ) : currentToolCalls.length > 0 ? (
                      <div className="flex items-center gap-2 text-white/40">
                        <Loader2 size={14} className="animate-spin" />
                        <span>{chat.executingTools}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-white/40">
                        <Loader2 size={14} className="animate-spin" />
                        <span>{chat.thinking}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Image generating bubble */}
            {isGeneratingImage && (
              <div className="flex gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0 mt-1">
                  <Wand2 size={14} className="text-purple-400" />
                </div>
                <div className="max-w-[80%]">
                  <div className="flex items-center gap-1.5 text-[10px] text-purple-400/60 mb-1">
                    <span className="animate-pulse">●</span>
                    <span>{chat.generatingImage}</span>
                  </div>
                  <div className="bg-white/5 border border-purple-500/20 rounded px-4 py-4 flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin text-purple-400/60 shrink-0" />
                    <div>
                      <p className="text-white/50 text-sm">{chat.generatingImageDesc}</p>
                      <p className="text-white/20 text-xs mt-0.5">{chat.imageService}</p>
                    </div>
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
            {/* Mode tabs + status */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setInputMode("chat")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] transition-all ${
                    inputMode === "chat"
                      ? "text-[#C9A84C] border-b border-[#C9A84C]/60"
                      : "text-white/25 hover:text-white/50"
                  }`}
                >
                  <Bot size={10} />
                  <span>{chat.modeChat}</span>
                </button>
                <button
                  onClick={() => setInputMode("image")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] transition-all ${
                    inputMode === "image"
                      ? "text-purple-400 border-b border-purple-400/60"
                      : "text-white/25 hover:text-white/50"
                  }`}
                >
                  <Wand2 size={10} />
                  <span>{chat.modeImage}</span>
                </button>
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] ${inputMode === "image" ? "text-purple-400/40" : currentOption.isLocal ? "text-emerald-400/40" : "text-sky-400/40"}`}>
                {inputMode === "image" ? (
                  <>
                    <Wand2 size={9} />
                    <span>nano banana · {chat.modeImage}</span>
                  </>
                ) : (
                  <>
                    {currentOption.isLocal ? <Monitor size={9} /> : <Cloud size={9} />}
                    <span>{currentOption.isLocal ? chat.localNode : chat.cloud}</span>
                    <span className="text-white/15">·</span>
                    <span>{currentOption.badge} {currentOption.name}</span>
                    {currentOption.isLocal && !(currentOption as LocalNode).isOnline && <span className="text-red-400/60 ml-1">· {chat.offline}</span>}
                  </>
                )}
                {currentConvId && <><span className="text-white/15 ml-1">·</span><span className="text-[#C9A84C]/30 ml-1">{chat.saved}</span></>}
              </div>
            </div>

            {/* Pending image previews (chat mode only) */}
            {inputMode === "chat" && pendingImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {pendingImages.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt={chat.pendingImageAlt} className="h-20 w-auto max-w-[160px] object-contain border border-[#C9A84C]/30 rounded" />
                    <button onClick={() => removePendingImage(idx)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Pending document file previews (chat mode only) */}
            {inputMode === "chat" && pendingFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {pendingFiles.map((f, idx) => {
                  const icon = f.fileType === "pdf" ? <FileText size={12} className="text-red-400/70" /> :
                    f.fileType === "csv" ? <Table2 size={12} className="text-green-400/70" /> :
                    f.fileType === "json" ? <FileJson size={12} className="text-yellow-400/70" /> :
                    <FileText size={12} className="text-sky-400/70" />;
                  const sizeKb = Math.round(f.size / 1024);
                  return (
                    <div key={idx} className="relative group flex items-center gap-2 px-3 py-2 border border-sky-400/20 bg-sky-400/5 max-w-[200px]">
                      {icon}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-white/60 truncate">{f.name}</p>
                        <p className="text-[10px] text-white/25">{sizeKb}KB · {f.charCount?.toLocaleString(timeLocale)} {chat.characters}{f.truncated ? ` · ${chat.truncatedTag}` : ""}</p>
                      </div>
                      <button onClick={() => removePendingFile(idx)}
                        className="shrink-0 w-4 h-4 flex items-center justify-center text-white/20 hover:text-red-400/70 transition-colors opacity-0 group-hover:opacity-100">
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* File uploading indicator */}
            {isUploadingFile && (
              <div className="flex items-center gap-2 mb-3 text-[11px] text-sky-400/60">
                <Loader2 size={12} className="animate-spin" />
                <span>{chat.parsingFiles}</span>
              </div>
            )}

            <div className="flex gap-2 items-end">
              {/* Image upload button (chat mode only) */}
              {inputMode === "chat" && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isBusy}
                    className={`px-3 py-3 border text-xs transition-all shrink-0 ${pendingImages.length > 0 ? "border-[#C9A84C]/50 text-[#C9A84C] bg-[#C9A84C]/10" : "border-white/10 text-white/30 hover:border-[#C9A84C]/30 hover:text-[#C9A84C]/60"} disabled:opacity-30 disabled:cursor-not-allowed`}
                    title={chat.uploadImageTitle}
                  >
                    <ImagePlus size={16} />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                  {/* Document upload button */}
                  <button
                    onClick={() => docFileInputRef.current?.click()}
                    disabled={isBusy}
                    className={`px-3 py-3 border text-xs transition-all shrink-0 ${pendingFiles.length > 0 ? "border-sky-400/50 text-sky-400 bg-sky-400/10" : "border-white/10 text-white/30 hover:border-sky-400/30 hover:text-sky-400/60"} disabled:opacity-30 disabled:cursor-not-allowed`}
                    title={chat.uploadFileTitle}
                  >
                    {isUploadingFile ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                  </button>
                  <input
                    ref={docFileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.md,.csv,.json,image/*"
                    multiple
                    className="hidden"
                    onChange={handleDocFileChange}
                  />
                </>
              )}
              {/* Image mode icon */}
              {inputMode === "image" && (
                <div className="px-3 py-3 border border-purple-500/20 text-purple-400/40 shrink-0">
                  <Wand2 size={16} />
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isBusy
                    ? inputMode === "image" ? chat.busyGeneratingImage : isUploadingFile ? chat.busyParsingFiles : chat.busyReplying
                    : inputMode === "image"
                    ? chat.imagePromptPlaceholder
                    : pendingFiles.length > 0
                    ? t("maoai.chat.filesUploadedPlaceholder", { count: pendingFiles.length })
                    : pendingImages.length > 0
                    ? chat.imageAnalyzePlaceholder
                    : isResearchEntry
                    ? chat.researchPlaceholder
                    : chat.chatPlaceholder
                }
                disabled={isUploadingFile}
                rows={1}
                className={`flex-1 bg-white/5 border text-white/85 text-sm px-4 py-3 resize-none focus:outline-none placeholder-white/20 disabled:opacity-50 ${
                  isBusy ? "opacity-60" : ""
                } ${
                  inputMode === "image"
                    ? "border-purple-500/20 focus:border-purple-500/40"
                    : "border-white/10 focus:border-[#C9A84C]/40"
                }`}
                style={{ minHeight: "44px", maxHeight: "200px" }}
                onInput={e => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 200) + "px";
                }}
              />
              {isStreaming ? (
                <button onClick={stopStreaming} className="px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs hover:bg-red-500/20 transition-all shrink-0">{chat.stop}</button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={(!input.trim() && pendingImages.length === 0 && pendingFiles.length === 0) || isGeneratingImage || isUploadingFile}
                  className={`px-4 py-3 border transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 ${
                    inputMode === "image"
                      ? "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                      : "bg-[#C9A84C]/10 border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/20"
                  }`}
                >
                  {inputMode === "image" ? <Wand2 size={16} /> : <Send size={16} />}
                </button>
              )}
            </div>

            {/* Hints */}
            {inputMode === "chat" && pendingImages.length > 0 && (
              <p className="text-[10px] text-purple-400/50 mt-2 flex items-center gap-1">
                <ImageIcon size={9} />
                <span>{chat.visionHint}</span>
              </p>
            )}
            {inputMode === "chat" && pendingFiles.length > 0 && pendingImages.length === 0 && (
              <p className="text-[10px] text-sky-400/50 mt-2 flex items-center gap-1">
                <Paperclip size={9} />
                <span>{chat.fileHint}</span>
              </p>
            )}
            {inputMode === "image" && (
              <p className="text-[10px] text-purple-400/30 mt-2 flex items-center gap-1">
                <Wand2 size={9} />
                <span>{chat.imageHint}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {showPicker && <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />}

      {/* ── Upgrade Prompt Modal ── */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/15 w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Crown size={15} className="text-[#C9A84C]" />
                <h3 className="text-white font-medium text-sm">
                  {showUpgradePrompt === "image_locked"
                    ? chat.upgradeTitles.imageLocked
                    : showUpgradePrompt === "image"
                    ? chat.upgradeTitles.image
                    : showUpgradePrompt === "premium_model"
                    ? chat.upgradeTitles.premiumModel
                    : chat.upgradeTitles.chat}
                </h3>
              </div>
              <button onClick={() => setShowUpgradePrompt(null)} className="text-white/30 hover:text-white/60 transition-colors text-lg leading-none">×</button>
            </div>
            <div className="px-5 py-4">
              <p className="text-white/50 text-sm mb-4 leading-relaxed">
                {showUpgradePrompt === "image_locked" && chat.upgradeDescriptions.imageLocked}
                {showUpgradePrompt === "image" && t("maoai.chat.upgradeDescriptions.image", {
                  used: mySubscription?.usage.imageGenerations,
                  limit: mySubscription?.limits.dailyImageGenerations,
                })}
                {showUpgradePrompt === "premium_model" && chat.upgradeDescriptions.premiumModel}
                {showUpgradePrompt === "chat" && t("maoai.chat.upgradeDescriptions.chat", {
                  used: mySubscription?.usage.chatMessages,
                  limit: mySubscription?.limits.dailyChatMessages,
                })}
              </p>
              <div className="flex flex-col gap-2">
                <a
                  href={MAOAI_ROUTES.PRICING}
                  className="w-full py-2.5 text-center text-sm bg-[#C9A84C]/15 border border-[#C9A84C]/40 text-[#C9A84C] hover:bg-[#C9A84C]/25 transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={13} />
                  <span>{chat.viewPlans}</span>
                </a>
                <button
                  onClick={() => setShowUpgradePrompt(null)}
                  className="w-full py-2 text-center text-xs text-white/25 hover:text-white/40 transition-colors"
                >
                  {chat.later}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
