import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { getLoginUrl } from "@/const";
import { ChatMessage } from "@/components/ChatMessage";
import { ModelSelector } from "@/components/ModelSelector";
import { SystemPromptSelector } from "@/components/SystemPromptSelector";
import { StatusIndicator } from "@/components/StatusIndicator";
import {
  Plus, Send, Trash2, MessageSquare, Loader2,
  PanelLeftClose, PanelLeftOpen, Sparkles, LogOut, RotateCcw,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface LocalMessage {
  id?: number;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string | null;
  createdAt?: Date;
  isStreaming?: boolean;
}

function LoginScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 p-8 max-w-sm w-full">
        <div className="size-16 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Sparkles className="size-8 text-primary" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Claude Code AI</h1>
          <p className="text-sm text-muted-foreground mt-2">
            多模型 AI 编程助手，支持 DeepSeek、智谱 GLM、Groq
          </p>
        </div>
        <Button
          onClick={() => { window.location.href = getLoginUrl(); }}
          size="lg"
          className="w-full"
        >
          登录开始使用
        </Button>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState("deepseek-chat");
  const [selectedPreset, setSelectedPreset] = useState("coding");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: conversations, isLoading: convsLoading } = trpc.conversations.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: presets } = trpc.ai.presets.useQuery();
  const createConv = trpc.conversations.create.useMutation({
    onSuccess: () => utils.conversations.list.invalidate(),
  });
  const deleteConv = trpc.conversations.delete.useMutation({
    onSuccess: () => utils.conversations.list.invalidate(),
  });
  const updateConv = trpc.conversations.update.useMutation({
    onSuccess: () => utils.conversations.list.invalidate(),
  });
  const saveMessage = trpc.messages.save.useMutation();
  const clearMsgs = trpc.messages.clear.useMutation({
    onSuccess: () => { setLocalMessages([]); toast.success("对话已清空"); },
  });
  const { data: dbMessages } = trpc.messages.list.useQuery(
    { conversationId: activeConvId! },
    { enabled: !!activeConvId }
  );

  useEffect(() => {
    if (dbMessages) {
      setLocalMessages(dbMessages.map(m => ({
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
        model: m.model,
        createdAt: m.createdAt,
      })));
    }
  }, [dbMessages]);

  useEffect(() => {
    if (presets && presets.length > 0 && !systemPrompt) {
      setSystemPrompt(presets[0].prompt);
    }
  }, [presets]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
    }
  }, [input]);

  const handleNewConversation = useCallback(async () => {
    try {
      const conv = await createConv.mutateAsync({
        title: "新对话",
        model: selectedModel,
        systemPrompt,
      });
      setActiveConvId(conv.id);
      setLocalMessages([]);
    } catch { toast.error("创建对话失败"); }
  }, [createConv, selectedModel, systemPrompt]);

  const handleSelectConversation = useCallback((id: number) => {
    if (isStreaming) return;
    setActiveConvId(id);
    const conv = conversations?.find(c => c.id === id);
    if (conv) setSelectedModel(conv.model);
  }, [isStreaming, conversations]);

  const handleDeleteConversation = useCallback(async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConv.mutateAsync({ id });
    if (activeConvId === id) { setActiveConvId(null); setLocalMessages([]); }
    toast.success("对话已删除");
  }, [deleteConv, activeConvId]);

  const handlePresetChange = useCallback((presetId: string, prompt: string) => {
    setSelectedPreset(presetId);
    setSystemPrompt(prompt);
  }, []);

  const handleModelChange = useCallback(async (model: string) => {
    setSelectedModel(model);
    if (activeConvId) await updateConv.mutateAsync({ id: activeConvId, model });
  }, [activeConvId, updateConv]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    let convId = activeConvId;
    if (!convId) {
      try {
        const conv = await createConv.mutateAsync({ title: text.slice(0, 40), model: selectedModel, systemPrompt });
        convId = conv.id;
        setActiveConvId(convId);
      } catch { toast.error("创建对话失败"); return; }
    } else if (localMessages.length === 0) {
      updateConv.mutate({ id: convId, title: text.slice(0, 40) });
    }
    setInput("");
    const userMsg: LocalMessage = { role: "user", content: text, createdAt: new Date() };
    setLocalMessages(prev => [...prev, userMsg]);
    saveMessage.mutate({ conversationId: convId!, role: "user", content: text });
    const assistantMsg: LocalMessage = { role: "assistant", content: "", model: selectedModel, isStreaming: true };
    setLocalMessages(prev => [...prev, assistantMsg]);
    setIsStreaming(true);
    const apiMessages = [
      ...localMessages.filter(m => m.role !== "system"),
      { role: "user" as const, content: text },
    ].map(m => ({ role: m.role, content: m.content }));
    abortRef.current = new AbortController();
    let fullContent = "";
    try {
      const res = await fetch("/api/ai/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel, messages: apiMessages, systemPrompt }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      if (reader) {
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
                const json = JSON.parse(trimmed.slice(6));
                if (json.error) { toast.error(`AI 错误: ${json.error}`); break; }
                if (json.content) {
                  fullContent += json.content;
                  setLocalMessages(prev => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last?.isStreaming) updated[updated.length - 1] = { ...last, content: fullContent };
                    return updated;
                  });
                }
              } catch { /* skip */ }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error(`连接失败: ${err.message}`);
        fullContent = fullContent || "[响应失败，请重试]";
      }
    } finally {
      setIsStreaming(false);
      setLocalMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.isStreaming) updated[updated.length - 1] = { ...last, content: fullContent, isStreaming: false, createdAt: new Date() };
        return updated;
      });
      if (fullContent && convId) saveMessage.mutate({ conversationId: convId, role: "assistant", content: fullContent, model: selectedModel });
    }
  }, [input, isStreaming, activeConvId, localMessages, selectedModel, systemPrompt, createConv, updateConv, saveMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const handleStop = useCallback(() => { abortRef.current?.abort(); setIsStreaming(false); }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );

  if (!isAuthenticated) return <LoginScreen />;

  const displayName = user?.name || user?.email || "用户";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 shrink-0",
        sidebarOpen ? "w-64" : "w-0 overflow-hidden"
      )}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Sparkles className="size-3.5 text-primary" />
            </div>
            <span className="text-sm font-semibold">Claude Code</span>
          </div>
          <Button variant="ghost" size="icon" className="size-7" onClick={() => setSidebarOpen(false)}>
            <PanelLeftClose className="size-4" />
          </Button>
        </div>
        <div className="px-3 py-2">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={handleNewConversation} disabled={createConv.isPending}>
            {createConv.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            新建对话
          </Button>
        </div>
        <ScrollArea className="flex-1 px-2">
          {convsLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
          ) : conversations && conversations.length > 0 ? (
            <div className="flex flex-col gap-0.5 py-1">
              {conversations.map(conv => (
                <button key={conv.id} onClick={() => handleSelectConversation(conv.id)}
                  className={cn(
                    "group flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left text-xs transition-colors",
                    activeConvId === conv.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}>
                  <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{conv.title}</span>
                  <button onClick={(e) => handleDeleteConversation(conv.id, e)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-destructive transition-all">
                    <Trash2 className="size-3" />
                  </button>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <MessageSquare className="size-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">暂无对话</p>
            </div>
          )}
        </ScrollArea>
        <div className="border-t border-sidebar-border px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground truncate max-w-[140px]">{displayName}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7" onClick={() => logout()}>
                  <LogOut className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">退出登录</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
          {!sidebarOpen && (
            <Button variant="ghost" size="icon" className="size-8" onClick={() => setSidebarOpen(true)}>
              <PanelLeftOpen className="size-4" />
            </Button>
          )}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ModelSelector value={selectedModel} onChange={handleModelChange} disabled={isStreaming} />
            <SystemPromptSelector value={selectedPreset} onChange={handlePresetChange} disabled={isStreaming} />
          </div>
          <div className="flex items-center gap-2">
            <StatusIndicator />
            {activeConvId && localMessages.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => clearMsgs.mutate({ conversationId: activeConvId })} disabled={isStreaming}>
                    <RotateCcw className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">清空对话</TooltipContent>
              </Tooltip>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {localMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
              <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="size-8 text-primary" />
              </div>
              <div className="text-center max-w-md">
                <h2 className="text-xl font-semibold mb-2">Claude Code AI 助手</h2>
                <p className="text-sm text-muted-foreground">
                  支持 DeepSeek V3/R1、智谱 GLM-4、Groq Llama 3.3。<br />
                  输入问题开始对话，支持代码生成、调试和解释。
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                {["用 Python 写一个快速排序算法", "解释 React useEffect 的工作原理", "帮我优化这段 SQL 查询", "什么是 Transformer 架构？"].map(prompt => (
                  <button key={prompt} onClick={() => setInput(prompt)}
                    className="text-left text-xs px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-colors">
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
              {localMessages.map((msg, i) => (
                <ChatMessage key={i} role={msg.role} content={msg.content} model={msg.model} isStreaming={msg.isStreaming} createdAt={msg.createdAt} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border bg-card/30 backdrop-blur-sm px-4 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
                className="flex-1 resize-none min-h-[44px] max-h-40 text-sm bg-secondary border-border focus-visible:ring-primary/50"
                rows={1}
                disabled={isStreaming}
              />
              {isStreaming ? (
                <Button variant="destructive" size="icon" className="size-11 shrink-0" onClick={handleStop}>
                  <span className="size-3 bg-white rounded-sm" />
                </Button>
              ) : (
                <Button size="icon" className="size-11 shrink-0" onClick={handleSend} disabled={!input.trim()}>
                  <Send className="size-4" />
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">AI 可能出错，重要信息请自行验证</p>
          </div>
        </div>
      </main>
    </div>
  );
}
