/**
 * AgentModeSelector - Agent 模式选择器
 * 
 * 在聊天界面顶部显示，允许用户选择不同的专业 Agent
 */

import { useState, useEffect } from "react";
import { Bot, ChevronDown, Sparkles, Loader2 } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string;
  emoji: string;
  exampleQuestions?: string[];
}

interface Category {
  category: string;
  info: {
    label: string;
    emoji: string;
    color: string;
  };
  agents: Agent[];
}

interface AgentModeSelectorProps {
  currentAgent: string | null;
  onAgentChange: (agentId: string) => void;
  disabled?: boolean;
}

// 分类颜色映射
const CATEGORY_COLORS: Record<string, string> = {
  engineering: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  marketing: "text-pink-400 border-pink-400/30 bg-pink-400/10",
  design: "text-purple-400 border-purple-400/30 bg-purple-400/10",
  product: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10",
  testing: "text-green-400 border-green-400/30 bg-green-400/10",
};

export function AgentModeSelector({ currentAgent, onAgentChange, disabled }: AgentModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  // 获取 Agent 列表
  useEffect(() => {
    async function fetchAgents() {
      try {
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://api.mcmamoo.com";
        const resp = await fetch(`${BACKEND_URL}/api/chat/agents`, {
          credentials: "include",
        });
        if (resp.ok) {
          const data = await resp.json();
          setCategories(data);
          
          // 设置当前选中的 Agent
          if (currentAgent) {
            for (const cat of data) {
              const agent = cat.agents.find((a: Agent) => a.id === currentAgent);
              if (agent) {
                setSelectedAgent(agent);
                break;
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch agents:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchAgents();
  }, [currentAgent]);

  const handleSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    onAgentChange(agent.id);
    setIsOpen(false);
  };

  const handleClearAgent = () => {
    setSelectedAgent(null);
    onAgentChange("");
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 border border-white/10 text-white/40">
        <Loader2 size={12} className="animate-spin" />
        <span className="text-xs">加载中...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* 当前选中的 Agent 显示 */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-1.5 border text-xs transition-all ${
          selectedAgent
            ? CATEGORY_COLORS[selectedAgent.id.split("-")[0]] || "text-[#C9A84C] border-[#C9A84C]/30 bg-[#C9A84C]/10"
            : "text-white/40 border-white/10 hover:border-[#C9A84C]/30 hover:text-[#C9A84C]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        style={{ fontFamily: "'DM Mono', monospace" }}
      >
        {selectedAgent ? (
          <>
            <span>{selectedAgent.emoji}</span>
            <span>{selectedAgent.name}</span>
            <ChevronDown size={10} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </>
        ) : (
          <>
            <Sparkles size={10} />
            <span>选择 Agent 模式</span>
            <ChevronDown size={10} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </>
        )}
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-80 bg-[#111] border border-[#C9A84C]/20 shadow-2xl z-30 max-h-[400px] overflow-y-auto">
          {/* 清除按钮 */}
          {selectedAgent && (
            <button
              onClick={handleClearAgent}
              className="w-full text-left px-4 py-2 text-xs text-white/30 hover:text-white/60 border-b border-white/5 flex items-center gap-2"
            >
              ← 切换回通用模式
            </button>
          )}

          {/* 分类列表 */}
          {categories.map((cat) => (
            <div key={cat.category} className="border-b border-white/5 last:border-0">
              {/* 分类标题 */}
              <div className={`px-4 py-2 text-[10px] font-semibold tracking-widest uppercase flex items-center gap-1.5 ${CATEGORY_COLORS[cat.category]?.split(" ")[0] || "text-white/40"}`}>
                <span>{cat.info.emoji}</span>
                <span>{cat.info.label}</span>
              </div>

              {/* Agent 列表 */}
              <div className="pb-2">
                {cat.agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => handleSelect(agent)}
                    className={`w-full text-left px-4 py-2 flex items-start gap-3 transition-colors hover:bg-[#C9A84C]/5 ${
                      selectedAgent?.id === agent.id ? "bg-[#C9A84C]/10" : ""
                    }`}
                  >
                    <span className="text-sm mt-0.5 shrink-0">{agent.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-white/90 text-xs font-medium flex items-center gap-1.5">
                        {agent.name}
                        {selectedAgent?.id === agent.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
                        )}
                      </div>
                      <div className="text-white/35 text-[11px] mt-0.5 truncate">
                        {agent.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 点击外部关闭 */}
      {isOpen && <div className="fixed inset-0 z-20" onClick={() => setIsOpen(false)} />}
    </div>
  );
}

export default AgentModeSelector;