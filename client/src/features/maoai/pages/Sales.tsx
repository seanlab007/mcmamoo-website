import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { MAOAI_ROUTES } from "../constants";
import {
  Target, Users, Mail, Linkedin, TrendingUp, BarChart3, Sparkles,
  CheckCircle2, AlertCircle, Search, Plus, Eye, Send, Bot, Crown,
  Wand2, ChevronRight, UserPlus, ThumbsUp, ThumbsDown, MoreVertical,
  ExternalLink, Clock, Calendar, Phone, MessageSquare, Filter, Loader2
} from "lucide-react";

type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";

interface Lead {
  id: string;
  name: string;
  company: string;
  title: string;
  email: string;
  status: LeadStatus;
  score: number;
  aiInsights: string[];
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const { t } = useTranslation();
  const labels = t("maoai.sales.statuses", { returnObjects: true }) as Record<LeadStatus, string>;
  const colors: Record<LeadStatus, string> = {
    new: "bg-blue-500/20 text-blue-400",
    contacted: "bg-yellow-500/20 text-yellow-400",
    qualified: "bg-purple-500/20 text-purple-400",
    proposal: "bg-orange-500/20 text-orange-400",
    negotiation: "bg-pink-500/20 text-pink-400",
    closed_won: "bg-green-500/20 text-green-400",
    closed_lost: "bg-red-500/20 text-red-400",
  };
  return <span className={`px-2 py-0.5 text-xs rounded ${colors[status]}`}>{labels[status]}</span>;
}

export default function MaoAISales() {
  const { t } = useTranslation();
  const sales = t("maoai.sales", { returnObjects: true }) as any;
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: MAOAI_ROUTES.LOGIN });
  const [activeTab, setActiveTab] = useState<"dashboard" | "leads" | "outreach" | "ai">("dashboard");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // tRPC queries
  const { data: leads = [], isLoading: leadsLoading } = trpc.sales.listLeads.useQuery();
  const { data: stats } = trpc.sales.getPipelineStats.useQuery();
  const { data: insights = [] } = trpc.sales.getInsights.useQuery();

  if (loading) {
    return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><div className="text-[#C9A84C]">{sales.loading}</div></div>;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="border-b border-[#C9A84C]/20 bg-[#0A0A0A]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
              <Target size={20} className="text-[#C9A84C]" />
            </div>
            <div>
              <h1 className="text-[#C9A84C] font-semibold text-lg">{sales.title}</h1>
              <p className="text-white/40 text-xs">{sales.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {["dashboard", "leads", "outreach", "ai"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm transition-all ${activeTab === tab ? "bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/40" : "text-white/50 hover:text-white/80"}`}
              >
                {sales.tabs[tab]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "dashboard" && <DashboardView stats={stats} insights={insights} />}
        {activeTab === "leads" && <LeadsView leads={leads as Lead[]} onSelect={setSelectedLead} isLoading={leadsLoading} />}
        {activeTab === "outreach" && <OutreachView leads={leads as Lead[]} />}
        {activeTab === "ai" && <AIAssistantView />}
      </main>
    </div>
  );
}

function DashboardView({ stats, insights }: { stats?: any; insights: any[] }) {
  const { t } = useTranslation();
  const sales = t("maoai.sales", { returnObjects: true }) as any;
  const statCards = [
    { label: sales.statCards.total, value: stats?.total?.toString() || "0", change: "+12%", icon: Users, color: "text-blue-400" },
    { label: sales.statCards.qualified, value: stats?.qualified?.toString() || "0", change: "+25%", icon: CheckCircle2, color: "text-purple-400" },
    { label: sales.statCards.proposal, value: stats?.proposal?.toString() || "0", change: "+20%", icon: Target, color: "text-orange-400" },
    { label: sales.statCards.closedWon, value: stats?.closedWon?.toString() || "0", change: "+50%", icon: TrendingUp, color: "text-green-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white/5 border border-white/10 p-4 rounded">
            <div className="flex items-center justify-between">
              <stat.icon size={20} className={stat.color} />
              <span className="text-xs text-green-400">{stat.change}</span>
            </div>
            <p className="text-2xl font-bold mt-2">{stat.value}</p>
            <p className="text-xs text-white/40">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-[#C9A84C]/10 to-purple-500/10 border border-[#C9A84C]/20 p-6 rounded">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-[#C9A84C]" />
          <h3 className="text-[#C9A84C] font-semibold">{sales.insightTitle}</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {insights.slice(0, 3).map((insight) => (
            <div key={insight.id} className="bg-black/30 p-4 rounded">
              <div className="flex items-center gap-2 mb-2">
                {insight.type === "opportunity" && <TrendingUp size={14} className="text-green-400" />}
                {insight.type === "risk" && <AlertCircle size={14} className="text-red-400" />}
                {insight.type === "action" && <Clock size={14} className="text-blue-400" />}
                <span className={`text-sm ${
                  insight.type === "opportunity" ? "text-green-400" :
                  insight.type === "risk" ? "text-red-400" : "text-blue-400"
                }`}>
                  {insight.type === "opportunity" ? sales.insightTypes.opportunity : insight.type === "risk" ? sales.insightTypes.risk : sales.insightTypes.action}
                </span>
                <span className="text-xs text-white/30">({insight.confidence}%)</span>
              </div>
              <p className="text-sm font-medium text-white/90">{insight.title}</p>
              <p className="text-sm text-white/70">{insight.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-white/5 border border-white/10 p-6 rounded">
        <h3 className="text-white font-semibold mb-4">{sales.pipelineTitle}</h3>
        <div className="flex items-center gap-2">
          {sales.pipelineStages.map((stage: string, i: number) => (
            <div key={stage} className="flex-1">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#C9A84C]" style={{ width: `${[100, 80, 60, 40, 20, 10][i]}%` }} />
              </div>
              <p className="text-xs text-white/40 mt-2 text-center">{stage}</p>
              <p className="text-xs text-white/60 text-center">{[8, 6, 4, 3, 2, 1][i]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeadsView({ leads, onSelect, isLoading }: { leads: Lead[]; onSelect: (l: Lead) => void; isLoading?: boolean }) {
  const { t } = useTranslation();
  const sales = t("maoai.sales", { returnObjects: true }) as any;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-[#C9A84C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder={sales.searchPlaceholder}
              className="bg-white/5 border border-white/10 pl-10 pr-4 py-2 text-sm text-white placeholder-white/30 focus:border-[#C9A84C]/40 focus:outline-none w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10">
            <Filter size={14} /> {sales.filter}
          </button>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-sm hover:bg-[#C9A84C]/30">
          <Plus size={16} /> {sales.addLead}
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left text-xs text-white/40 font-medium px-4 py-3">{sales.table.lead}</th>
              <th className="text-left text-xs text-white/40 font-medium px-4 py-3">{sales.table.company}</th>
              <th className="text-left text-xs text-white/40 font-medium px-4 py-3">{sales.table.status}</th>
              <th className="text-left text-xs text-white/40 font-medium px-4 py-3">{sales.table.score}</th>
              <th className="text-left text-xs text-white/40 font-medium px-4 py-3">{sales.table.insight}</th>
              <th className="text-right text-xs text-white/40 font-medium px-4 py-3">{sales.table.actions}</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-white/5 hover:bg-white/5">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm text-white">{lead.name}</p>
                    <p className="text-xs text-white/40">{lead.title}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-white/70">{lead.company}</td>
                <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-bold ${lead.score >= 80 ? "text-green-400" : lead.score >= 60 ? "text-yellow-400" : "text-red-400"}`}>
                    {lead.score}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {lead.aiInsights.map((insight, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-[#C9A84C]/10 text-[#C9A84C]/80 rounded">{insight}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => onSelect(lead)} className="text-white/40 hover:text-[#C9A84C] p-1">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OutreachView({ leads }: { leads: Lead[] }) {
  const { t } = useTranslation();
  const sales = t("maoai.sales", { returnObjects: true }) as any;
  const [selectedTemplate, setSelectedTemplate] = useState<"cold" | "followup" | "proposal" | "linkedin">("cold");
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [generatedEmail, setGeneratedEmail] = useState("");

  const templates = [
    { id: "cold" as const, name: sales.templates.cold, icon: Mail },
    { id: "followup" as const, name: sales.templates.followup, icon: Clock },
    { id: "proposal" as const, name: sales.templates.proposal, icon: Target },
    { id: "linkedin" as const, name: sales.templates.linkedin, icon: Linkedin },
  ];

  const generateMutation = trpc.sales.generateEmail.useMutation({
    onSuccess: (data) => {
      if (data.content) {
        setGeneratedEmail(`主题：${data.content.subject}\n\n${data.content.body}`);
      }
    }
  });

  const generateEmail = () => {
    if (!selectedLeadId) {
      alert(sales.chooseRecipientFirst);
      return;
    }
    generateMutation.mutate({
      leadId: selectedLeadId,
      template: selectedTemplate,
      tone: "professional"
    });
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Templates */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold">{sales.templatesTitle}</h3>
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTemplate(t.id)}
            className={`w-full flex items-center gap-3 p-3 border text-left transition-all ${selectedTemplate === t.id ? "bg-[#C9A84C]/10 border-[#C9A84C]/40" : "bg-white/5 border-white/10 hover:bg-white/10"}`}
          >
            <t.icon size={18} className={selectedTemplate === t.id ? "text-[#C9A84C]" : "text-white/40"} />
            <span className={selectedTemplate === t.id ? "text-[#C9A84C]" : "text-white/70"}>{t.name}</span>
          </button>
        ))}

        <div className="pt-4 border-t border-white/10">
          <h4 className="text-sm text-white/60 mb-2">{sales.selectRecipient}</h4>
          {leads.slice(0, 3).map((lead) => (
            <div key={lead.id} 
              onClick={() => setSelectedLeadId(lead.id)}
              className={`flex items-center gap-2 p-2 hover:bg-white/5 cursor-pointer ${selectedLeadId === lead.id ? "bg-[#C9A84C]/10" : ""}`}>
              <input 
                type="radio" 
                checked={selectedLeadId === lead.id}
                onChange={() => setSelectedLeadId(lead.id)}
                className="accent-[#C9A84C]" 
              />
              <div>
                <p className="text-sm text-white">{lead.name}</p>
                <p className="text-xs text-white/40">{lead.company}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">{sales.editorTitle}</h3>
          <button
            onClick={generateEmail}
            disabled={generateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-sm hover:bg-[#C9A84C]/30 disabled:opacity-50"
          >
            {generateMutation.isPending ? <><Loader2 size={16} className="animate-spin" /> {sales.generating}</> : <><Wand2 size={16} /> {sales.generateEmail}</>}
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 p-4 space-y-4">
          <div>
            <label className="text-xs text-white/40">{sales.subject}</label>
            <input
              type="text"
              value={generatedEmail ? generatedEmail.split("\n")[0].replace(/^(主题：|Subject:\s*)/, "") : ""}
              placeholder={sales.subjectPlaceholder}
              className="w-full bg-black/30 border border-white/10 px-3 py-2 text-sm text-white mt-1 focus:border-[#C9A84C]/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-white/40">{sales.body}</label>
            <textarea
              value={generatedEmail ? generatedEmail.split("\n").slice(2).join("\n") : ""}
              placeholder={sales.bodyPlaceholder}
              rows={12}
              className="w-full bg-black/30 border border-white/10 px-3 py-2 text-sm text-white mt-1 focus:border-[#C9A84C]/40 focus:outline-none resize-none"
            />
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">{sales.aiSuggestions}</span>
              <span className="text-xs text-green-400">{sales.suggestionPersonalized}</span>
              <span className="text-xs text-green-400">{sales.suggestionValue}</span>
              <span className="text-xs text-yellow-400">{sales.suggestionCta}</span>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#C9A84C] text-black text-sm font-medium hover:bg-[#C9A84C]/90">
              <Send size={16} /> {sales.sendEmail}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AIAssistantView() {
  const { t } = useTranslation();
  const sales = t("maoai.sales", { returnObjects: true }) as any;
  const [messages, setMessages] = useState([
    { role: "assistant", content: sales.assistantGreeting }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const chatMutation = trpc.sales.chatWithAssistant.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
      setIsTyping(false);
    },
    onError: () => {
      setMessages(prev => [...prev, { role: "assistant", content: sales.assistantError }]);
      setIsTyping(false);
    }
  });

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: "user", content: input }]);
    setInput("");
    setIsTyping(true);
    chatMutation.mutate({ message: input });
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Chat */}
      <div className="col-span-2 bg-white/5 border border-white/10 rounded flex flex-col h-[600px]">
        <div className="flex items-center gap-2 p-4 border-b border-white/10">
          <Bot size={18} className="text-[#C9A84C]" />
          <span className="text-[#C9A84C] font-semibold">{sales.assistantTitle}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center shrink-0">
                  <Bot size={14} className="text-[#C9A84C]" />
                </div>
              )}
              <div className={`max-w-[80%] p-3 text-sm ${m.role === "user" ? "bg-[#C9A84C]/10 border border-[#C9A84C]/20 text-white" : "bg-white/5 border border-white/10 text-white/80"}`}>
                <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
                <Bot size={14} className="text-[#C9A84C]" />
              </div>
              <div className="bg-white/5 border border-white/10 p-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#C9A84C] rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-[#C9A84C] rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-[#C9A84C] rounded-full animate-bounce delay-200" />
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={sales.inputPlaceholder}
              className="flex-1 bg-black/30 border border-white/10 px-4 py-2 text-sm text-white placeholder-white/30 focus:border-[#C9A84C]/40 focus:outline-none"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-[#C9A84C] text-black text-sm font-medium hover:bg-[#C9A84C]/90"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold">{sales.quickActionsTitle}</h3>
        <div className="space-y-2">
          {[
            { icon: Target, ...sales.quickActions[0] },
            { icon: Mail, ...sales.quickActions[1] },
            { icon: TrendingUp, ...sales.quickActions[2] },
            { icon: Clock, ...sales.quickActions[3] },
            { icon: MessageSquare, ...sales.quickActions[4] },
            { icon: BarChart3, ...sales.quickActions[5] },
          ].map((action) => (
            <button key={action.label} className="w-full flex items-start gap-3 p-3 bg-white/5 border border-white/10 hover:bg-white/10 text-left transition-all">
              <action.icon size={18} className="text-[#C9A84C] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-white">{action.label}</p>
                <p className="text-xs text-white/40">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-white/10">
          <h4 className="text-sm text-white/60 mb-3">{sales.todayStats}</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">{sales.statsLabels.emails}</span>
              <span className="text-white">{sales.statsValues.emails}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">{sales.statsLabels.analysis}</span>
              <span className="text-white">{sales.statsValues.analysis}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/40">{sales.statsLabels.forecast}</span>
              <span className="text-green-400">{sales.statsValues.forecast}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
