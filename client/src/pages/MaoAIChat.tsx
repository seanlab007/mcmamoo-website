import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Send, Bot, User, ChevronDown, Zap, Brain, Cpu, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Streamdown } from "streamdown";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://api.mcmamoo.com";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ModelConfig = {
  id: string;
  name: string;
  badge: string;
  description: string;
};

const MODELS: ModelConfig[] = [
  { id: "deepseek-chat", name: "DeepSeek V3", badge: "🔵", description: "强大的通用模型，速度快" },
  { id: "deepseek-reasoner", name: "DeepSeek R1", badge: "🧠", description: "深度推理，适合复杂问题" },
  { id: "glm-4-flash", name: "GLM-4 Flash", badge: "⚡", description: "智谱极速模型，免费额度多" },
  { id: "glm-4-plus", name: "GLM-4 Plus", badge: "🟣", description: "智谱旗舰模型，能力强" },
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", badge: "⚡", description: "Groq 超快推理，英文优秀" },
];

export default function MaoAIChat() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState("deepseek-chat");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    abortRef.current = new AbortController();

    try {
      const token = localStorage.getItem("maoai_session_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const resp = await fetch(`${BACKEND_URL}/api/ai/chat/stream`, {
        method: "POST",
        headers,
        credentials: "include",
        signal: abortRef.current.signal,
        body: JSON.stringify({
          model: selectedModel,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

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
              if (chunk.content) {
                fullContent += chunk.content;
                setStreamingContent(fullContent);
              } else if (chunk.error) {
                fullContent += `\n\n⚠️ 错误: ${chunk.error}`;
                setStreamingContent(fullContent);
              } else if (chunk.info) {
                // node switching info, ignore
              }
            } catch { /* skip */ }
          }
        }
      }

      setMessages(prev => [...prev, { role: "assistant", content: fullContent || "（无响应）" }]);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages(prev => [...prev, { role: "assistant", content: `⚠️ 请求失败: ${err.message}` }]);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const stopStreaming = () => {
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
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header className="border-b border-[#C9A84C]/20 bg-[#0A0A0A]/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
              <Bot size={16} className="text-[#C9A84C]" />
            </div>
            <div>
              <h1 className="text-[#C9A84C] font-semibold text-sm tracking-wide" style={{ fontFamily: "'DM Mono', monospace" }}>
                MaoAI
              </h1>
              <p className="text-white/30 text-xs">智能 AI 控制中心</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Model Picker */}
            <div className="relative">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="flex items-center gap-2 px-3 py-1.5 border border-[#C9A84C]/30 text-[#C9A84C]/80 text-xs hover:border-[#C9A84C]/60 hover:text-[#C9A84C] transition-all"
                style={{ fontFamily: "'DM Mono', monospace" }}
              >
                <span>{currentModel.badge}</span>
                <span>{currentModel.name}</span>
                <ChevronDown size={12} />
              </button>
              {showModelPicker && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-[#111] border border-[#C9A84C]/20 shadow-xl z-20">
                  {MODELS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); }}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#C9A84C]/5 transition-colors ${m.id === selectedModel ? "bg-[#C9A84C]/10" : ""}`}
                    >
                      <span className="text-base mt-0.5">{m.badge}</span>
                      <div>
                        <div className="text-white/90 text-xs font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>{m.name}</div>
                        <div className="text-white/40 text-xs mt-0.5">{m.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated && (
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-xs hidden sm:block">{user?.email}</span>
                <button
                  onClick={() => logout()}
                  className="text-white/30 hover:text-[#C9A84C] transition-colors p-1"
                  title="退出登录"
                >
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mb-6">
                <Bot size={28} className="text-[#C9A84C]/60" />
              </div>
              <h2 className="text-white/60 text-lg mb-2" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                你好，我是 MaoAI
              </h2>
              <p className="text-white/30 text-sm mb-8">当前模型：{currentModel.badge} {currentModel.name}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {["帮我写一份市场分析报告", "解释一下量子计算的原理", "用 Python 写一个爬虫", "给我推荐几本商业书籍"].map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-left px-4 py-3 border border-white/10 text-white/50 text-sm hover:border-[#C9A84C]/40 hover:text-white/70 transition-all"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center shrink-0 mt-1">
                  <Bot size={14} className="text-[#C9A84C]" />
                </div>
              )}
              <div className={`max-w-[80%] rounded px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-white/90"
                  : "bg-white/5 border border-white/10 text-white/85"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none prose-p:text-white/85 prose-code:text-[#C9A84C] prose-pre:bg-black/50">
                    <Streamdown>{msg.content}</Streamdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                  <User size={14} className="text-white/50" />
                </div>
              )}
            </div>
          ))}

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center shrink-0 mt-1">
                <Bot size={14} className="text-[#C9A84C]" />
              </div>
              <div className="max-w-[80%] bg-white/5 border border-white/10 rounded px-4 py-3 text-sm text-white/85">
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
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/10 bg-[#0A0A0A]/95 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`向 ${currentModel.name} 提问... (Enter 发送，Shift+Enter 换行)`}
              rows={1}
              disabled={isStreaming}
              className="flex-1 bg-white/5 border border-white/10 text-white/90 placeholder-white/25 text-sm px-4 py-3 resize-none focus:outline-none focus:border-[#C9A84C]/40 transition-colors max-h-32 disabled:opacity-50"
              style={{ minHeight: "48px" }}
            />
            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className="px-4 py-3 bg-red-500/20 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/30 transition-all shrink-0"
              >
                停止
              </button>
            ) : (
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className="px-4 py-3 bg-[#C9A84C]/10 border border-[#C9A84C]/30 text-[#C9A84C] hover:bg-[#C9A84C]/20 hover:border-[#C9A84C]/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                <Send size={16} />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="text-white/20 text-xs">
              {currentModel.badge} {currentModel.name} · {currentModel.description}
            </span>
            <span className="text-white/20 text-xs">{messages.length > 0 ? `${messages.length} 条消息` : ""}</span>
          </div>
        </div>
      </div>

      {/* Click outside to close model picker */}
      {showModelPicker && (
        <div className="fixed inset-0 z-10" onClick={() => setShowModelPicker(false)} />
      )}
    </div>
  );
}
