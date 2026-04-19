import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { MAOAI_ROUTES } from "../constants";
import {
  Headphones, Mic, Phone, PhoneCall, PhoneOff, Bot, MessageSquare,
  Volume2, Settings, Play, Pause, Send, Loader2, CheckCircle2,
  AlertCircle, Clock, BarChart3, User, Globe, RefreshCw, Plus
} from "lucide-react";

type Tab = "dashboard" | "chat" | "calls" | "voices" | "agents" | "settings";

interface ChatMessage {
  id: string;
  message: string;
  reply: string;
  created_at: string;
}

interface CallRecord {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  call_type: string;
  status: string;
  summary?: string;
  duration?: number;
  created_at: string;
}

interface VoiceItem {
  voiceId: string;
  name: string;
  category: string;
  previewUrl?: string;
  description?: string;
}

export default function MaoAICustomerService() {
  const { t } = useTranslation();
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: MAOAI_ROUTES.LOGIN });
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: stats } = trpc.customerService.getStats.useQuery();
  const { data: voices = [] } = trpc.customerService.listVoices.useQuery(undefined, { staleTime: 60000 });
  const { data: calls = [] } = trpc.customerService.listCallRecords.useQuery(undefined, { staleTime: 30000 }) as { data: CallRecord[] };
  const { data: configStatus } = trpc.customerService.getConfigStatus.useQuery();

  const ttsMutation = trpc.customerService.textToSpeech.useMutation();
  const chatMutation = trpc.customerService.chat.useMutation();

  const sendChat = () => {
    if (!chatInput.trim() || isTyping) return;
    const msg = chatInput.trim();
    setChatInput("");
    setIsTyping(true);

    chatMutation.mutate(
      { message: msg, sessionId },
      {
        onSuccess: (data) => {
          setChatMessages(prev => [...prev, {
            id: `msg-${Date.now()}`,
            message: msg,
            reply: data.reply,
            created_at: new Date().toISOString(),
          }]);
          setIsTyping(false);
        },
        onError: () => setIsTyping(false),
      }
    );
  };

  const speak = (text: string, voiceId: string) => {
    ttsMutation.mutate({ text, voiceId }, {
      onSuccess: (data) => {
        const audio = new Audio(data.audio);
        audio.play();
      },
    });
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-[#C9A84C]">Loading...</div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    completed: "bg-green-500/20 text-green-400",
    in_progress: "bg-blue-500/20 text-blue-400",
    ringing: "bg-yellow-500/20 text-yellow-400",
    missed: "bg-red-500/20 text-red-400",
    failed: "bg-red-500/20 text-red-400",
  };
  const statusLabels: Record<string, string> = {
    completed: "已完成", in_progress: "通话中", ringing: "响铃中",
    missed: "未接听", failed: "失败",
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="border-b border-[#C9A84C]/20 bg-[#0A0A0A]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
              <Headphones size={20} className="text-[#C9A84C]" />
            </div>
            <div>
              <h1 className="text-[#C9A84C] font-semibold text-lg">Customer Service</h1>
              <p className="text-white/40 text-xs">AI-Powered Customer Service</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            {[
              { key: "dashboard" as Tab, icon: BarChart3, label: "Dashboard" },
              { key: "chat" as Tab, icon: MessageSquare, label: "AI Chat" },
              { key: "calls" as Tab, icon: Phone, label: "Calls" },
              { key: "voices" as Tab, icon: Volume2, label: "Voices" },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md transition-all ${
                  activeTab === key
                    ? "bg-[#C9A84C]/20 text-[#C9A84C]"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Status Banner */}
            {configStatus && !configStatus.configured && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle size={20} className="text-yellow-400" />
                <div>
                  <p className="text-yellow-400 text-sm font-medium">ElevenLabs API not configured</p>
                  <p className="text-yellow-400/60 text-xs">Please set ELEVENLABS_API_KEY in .env to enable voice features</p>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Total Calls", value: stats?.totalCalls ?? 0, icon: Phone, color: "text-blue-400" },
                { label: "Today", value: stats?.todayCalls ?? 0, icon: Clock, color: "text-green-400" },
                { label: "Avg Duration", value: `${stats?.averageDurationSeconds ?? 0}s`, icon: Timer, color: "text-purple-400" },
                { label: "Total Duration", value: `${stats?.totalDurationMinutes ?? 0}m`, icon: BarChart3, color: "text-[#C9A84C]" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/40 text-xs">{label}</p>
                      <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
                    </div>
                    <Icon size={24} className="text-white/20" />
                  </div>
                </div>
              ))}
            </div>

            {/* Status Breakdown */}
            {stats?.statusBreakdown && Object.keys(stats.statusBreakdown).length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">Call Status Breakdown</h3>
                <div className="flex gap-4">
                  {Object.entries(stats.statusBreakdown).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-xs rounded ${statusColors[status] || ""}`}>
                        {statusLabels[status] || status}
                      </span>
                      <span className="text-white/60 text-sm">{count as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Calls */}
            {calls.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Recent Calls</h3>
                  <button
                    onClick={() => setActiveTab("calls")}
                    className="text-[#C9A84C] text-xs hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="divide-y divide-white/5">
                  {calls.slice(0, 5).map((call) => (
                    <div key={call.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-sm">{call.customer_name || call.customer_phone}</p>
                          <p className="text-white/40 text-xs">
                            {call.call_type === "inbound" ? "Incoming" : "Outgoing"} - {call.duration ?? 0}s
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded ${statusColors[call.status] || ""}`}>
                        {statusLabels[call.status] || call.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Chat */}
        {activeTab === "chat" && (
          <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {chatMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-white/30">
                  <Bot size={48} />
                  <p className="mt-4 text-sm">AI Customer Service Chat</p>
                  <p className="text-xs mt-1">Ask about our services, pricing, or schedule a consultation</p>
                </div>
              )}
              {chatMessages.map((msg) => (
                <div key={msg.id} className="space-y-3">
                  <div className="flex justify-end">
                    <div className="max-w-[70%] bg-[#C9A84C]/20 border border-[#C9A84C]/30 rounded-lg px-4 py-2">
                      <p className="text-sm">{msg.message}</p>
                    </div>
                  </div>
                  <div className="flex justify-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot size={12} className="text-[#C9A84C]" />
                    </div>
                    <div className="max-w-[70%] bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                      <p className="text-sm whitespace-pre-wrap">{msg.reply}</p>
                      {voices.length > 0 && (
                        <button
                          onClick={() => speak(msg.reply, voices[0].voiceId)}
                          className="mt-2 flex items-center gap-1 text-[#C9A84C]/60 text-xs hover:text-[#C9A84C] transition-colors"
                        >
                          <Volume2 size={12} />
                          Play Voice
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
                    <Bot size={12} className="text-[#C9A84C]" />
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                    <Loader2 size={16} className="animate-spin text-[#C9A84C]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Type your message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#C9A84C]/50 placeholder-white/30"
              />
              <button
                onClick={sendChat}
                disabled={!chatInput.trim() || isTyping}
                className="bg-[#C9A84C] hover:bg-[#C9A84C]/80 disabled:opacity-50 px-4 py-3 rounded-lg transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Calls */}
        {activeTab === "calls" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Call Records</h2>
              <button className="flex items-center gap-1.5 bg-[#C9A84C]/20 text-[#C9A84C] px-3 py-1.5 rounded-lg text-sm hover:bg-[#C9A84C]/30">
                <Plus size={14} />
                New Call
              </button>
            </div>
            {calls.length === 0 ? (
              <div className="text-center py-20 text-white/30">
                <Phone size={48} className="mx-auto mb-4" />
                <p>No call records yet</p>
                <p className="text-xs mt-1">Configure ElevenLabs API to enable phone calls</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                <div className="divide-y divide-white/5">
                  {calls.map((call) => (
                    <div key={call.id} className="px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          call.call_type === "inbound" ? "bg-green-500/20" : "bg-blue-500/20"
                        }`}>
                          {call.call_type === "inbound"
                            ? <PhoneCall size={14} className="text-green-400" />
                            : <Phone size={14} className="text-blue-400" />
                          }
                        </div>
                        <div>
                          <p className="text-sm">{call.customer_name || "Unknown"}</p>
                          <p className="text-white/40 text-xs">{call.customer_phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-white/40 text-xs">
                          {call.duration ? `${call.duration}s` : "-"}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded ${statusColors[call.status] || ""}`}>
                          {statusLabels[call.status] || call.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Voices */}
        {activeTab === "voices" && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">ElevenLabs Voices</h2>
            {!configStatus?.configured ? (
              <div className="text-center py-20 text-white/30">
                <Volume2 size={48} className="mx-auto mb-4" />
                <p>ElevenLabs API not configured</p>
                <p className="text-xs mt-1">Set ELEVENLABS_API_KEY in .env to see available voices</p>
              </div>
            ) : voices.length === 0 ? (
              <div className="text-center py-20 text-white/30">
                <Volume2 size={48} className="mx-auto mb-4" />
                <p>Loading voices...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {voices.map((voice: VoiceItem) => (
                  <div key={voice.voiceId} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-[#C9A84C]/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{voice.name}</h3>
                      <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded">{voice.category}</span>
                    </div>
                    {voice.description && (
                      <p className="text-white/40 text-xs mb-3 line-clamp-2">{voice.description}</p>
                    )}
                    <div className="flex gap-2">
                      {voice.previewUrl && (
                        <audio controls className="h-8 w-full" preload="none">
                          <source src={voice.previewUrl} type="audio/mpeg" />
                        </audio>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Timer icon used in dashboard
function Timer({ size, className }: { size: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="10" x2="14" y1="2" y2="2" />
      <line x1="12" x2="12" y1="14" y2="8" />
      <circle cx="12" cy="14" r="8" />
    </svg>
  );
}
