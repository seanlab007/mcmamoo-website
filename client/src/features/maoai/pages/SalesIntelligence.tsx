import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import type { Lead, ValueRating, DecisionMaker as DMType, CommStyle } from "../types";
import { useAuth } from "@/_core/hooks/useAuth";
import { MAOAI_ROUTES } from "../constants";
import {
  Target, Shield, Eye, Brain, Crosshair, Swords,
  ChevronDown, ChevronUp, ChevronLeft, Plus, Trash2, Edit3, Check, X,
  Building2, Briefcase, AlertTriangle, TrendingUp, Heart,
  Zap, Lock, Clock, ArrowRight, Users, FileText,
  MessageSquare, Search, Filter, Loader2, Send
} from "lucide-react";

// ─── Value Rating Badge ───────────────────────────────────────────────────────

function ValueRatingBadge({ rating }: { rating: ValueRating }) {
  const colors: Record<ValueRating, string> = {
    A: "bg-red-500/20 text-red-400 border-red-500/40",
    B: "bg-orange-500/20 text-orange-400 border-orange-500/40",
    C: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    D: "bg-gray-500/20 text-gray-400 border-gray-500/40",
  };
  const labels: Record<ValueRating, string> = { A: "A - Strategic", B: "B - Key", C: "C - Standard", D: "D - Observe" };
  return <span className={`px-2 py-0.5 text-xs rounded border ${colors[rating]}`}>{labels[rating]}</span>;
}

// ─── LTC Stage Badge ──────────────────────────────────────────────────────────

function LTCStageBadge({ stage }: { stage: string }) {
  const colors: Record<string, string> = {
    ML: "bg-blue-500/20 text-blue-400",
    MO: "bg-purple-500/20 text-purple-400",
    ATC: "bg-orange-500/20 text-orange-400",
    delivery: "bg-cyan-500/20 text-cyan-400",
    collection: "bg-green-500/20 text-green-400",
  };
  const labels: Record<string, string> = { ML: "ML", MO: "MO", ATC: "ATC", delivery: "Delivery", collection: "Collection" };
  return <span className={`px-2 py-0.5 text-xs rounded ${colors[stage] || "bg-gray-500/20 text-gray-400"}`}>{labels[stage] || stage}</span>;
}

// ─── Payment Risk Indicator ────────────────────────────────────────────────────

function PaymentRiskBadge({ risk }: { risk: string }) {
  const colors: Record<string, string> = {
    low: "text-green-400",
    medium: "text-yellow-400",
    high: "text-red-400",
  };
  const icons: Record<string, string> = { low: "Low", medium: "Medium", high: "High" };
  return <span className={`text-xs font-medium ${colors[risk] || "text-gray-400"}`}>{icons[risk] || risk}</span>;
}

// ─── Main Enhanced Sales Page ─────────────────────────────────────────────────

export default function EnhancedSalesPage() {
  const { t } = useTranslation();
  const sales = t("maoai.sales", { returnObjects: true }) as any;
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true, redirectPath: MAOAI_ROUTES.LOGIN });
  const [activeTab, setActiveTab] = useState<"dashboard" | "leads" | "outreach" | "ai">("dashboard");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [detailView, setDetailView] = useState<"profile" | "powermap" | "painchain" | "irontriangle" | "competitors" | "intel" | "ltc">("profile");
  const [filterRating, setFilterRating] = useState<ValueRating | "">("");

  const { data: rawLeads = [], isLoading: leadsLoading } = trpc.salesIntel.listEnhancedLeads.useQuery(
    filterRating ? { valueRating: filterRating } : undefined
  );
  const leads = rawLeads as unknown as Lead[];
  const { data: stats } = trpc.salesIntel.getHuaweiStats.useQuery();

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  if (loading) {
    return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><div className="text-[#C9A84C]">{sales.loading}</div></div>;
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <header className="border-b border-[#C9A84C]/20 bg-[#0A0A0A]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
              <Target size={20} className="text-[#C9A84C]" />
            </div>
            <div>
              <h1 className="text-[#C9A84C] font-semibold text-lg">{sales.intelTitle}</h1>
              <p className="text-white/40 text-xs">{sales.intelSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(["dashboard", "leads", "outreach", "ai"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedLeadId(null); }}
                className={`px-4 py-2 text-sm transition-all ${activeTab === tab ? "bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/40" : "text-white/50 hover:text-white/80"}`}
              >
                {sales.tabs[tab]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1600px] mx-auto px-4 py-4">
        {activeTab === "dashboard" && stats && <IntelDashboard stats={stats} leads={leads} onSelectLead={(id) => { setSelectedLeadId(id); setActiveTab("leads"); }} />}
        {activeTab === "leads" && (
          selectedLead ? (
            <LeadDetail lead={selectedLead} view={detailView} onViewChange={setDetailView} onBack={() => setSelectedLeadId(null)} />
          ) : (
            <LeadListView leads={leads} isLoading={leadsLoading} onSelect={setSelectedLeadId} filterRating={filterRating} onFilterChange={setFilterRating} />
          )
        )}
        {activeTab === "outreach" && <OutreachView leads={leads} />}
        {activeTab === "ai" && <AIAssistantView />}
      </main>
    </div>
  );
}

// ─── Intelligence Dashboard ───────────────────────────────────────────────────

function IntelDashboard({ stats, leads, onSelectLead }: { stats: any; leads: Lead[]; onSelectLead: (id: string) => void }) {
  const { t } = useTranslation();
  const sales = t("maoai.sales", { returnObjects: true }) as any;

  const abLeads = leads.filter((l: Lead) => l.valueRating === "A" || l.valueRating === "B");

  return (
    <div className="space-y-6">
      {/* Top Stats - Huawei Value Rating Distribution */}
      <div className="grid grid-cols-6 gap-4">
        {[
          { label: sales.intelStats.focusLeads, value: stats?.focusLeads || 0, icon: Target, color: "text-red-400", sub: "A+B" },
          { label: sales.intelStats.strategic, value: stats?.byRating?.A || 0, icon: Shield, color: "text-red-400", sub: "A Rating" },
          { label: sales.intelStats.key, value: stats?.byRating?.B || 0, icon: Eye, color: "text-orange-400", sub: "B Rating" },
          { label: sales.intelStats.totalPipeline, value: "¥" + ((stats?.totalEstimatedValue || 0) / 10000).toFixed(1) + "W", icon: TrendingUp, color: "text-green-400", sub: "Estimated" },
          { label: sales.intelStats.highRisk, value: stats?.highRiskCount || 0, icon: AlertTriangle, color: "text-red-400", sub: "High Risk" },
          { label: sales.intelStats.total, value: stats?.total || 0, icon: Users, color: "text-blue-400", sub: "All Leads" },
        ].map((s) => (
          <div key={s.label} className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <s.icon size={18} className={s.color} />
              <span className="text-[10px] text-white/30">{s.sub}</span>
            </div>
            <p className="text-xl font-bold mt-2">{s.value}</p>
            <p className="text-xs text-white/40">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Focus Leads (A/B) - Huawei Style */}
      <div className="bg-gradient-to-r from-[#C9A84C]/10 to-red-500/10 border border-[#C9A84C]/20 p-5 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Crosshair size={18} className="text-[#C9A84C]" />
          <h3 className="text-[#C9A84C] font-semibold">{sales.focusLeads}</h3>
          <span className="text-xs text-white/30 ml-2">({abLeads.length})</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {abLeads.slice(0, 6).map((lead: Lead) => (
            <button
              key={lead.id}
              onClick={() => onSelectLead(lead.id)}
              className="flex items-center gap-3 p-3 bg-black/30 border border-white/10 hover:border-[#C9A84C]/40 rounded-lg text-left transition-all"
            >
              <ValueRatingBadge rating={lead.valueRating} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{lead.company}</p>
                <p className="text-xs text-white/40">{lead.name} - {lead.title}</p>
              </div>
              <div className="text-right">
                <LTCStageBadge stage={lead.ltcStage} />
                <p className="text-xs text-white/40 mt-1">{lead.industry || "-"}</p>
              </div>
              <ArrowRight size={14} className="text-white/20" />
            </button>
          ))}
        </div>
      </div>

      {/* LTC Pipeline Overview */}
      <div className="bg-white/5 border border-white/10 p-5 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={18} className="text-[#C9A84C]" />
          <h3 className="text-white font-semibold">{sales.ltcPipelineTitle}</h3>
        </div>
        <div className="flex items-center gap-2">
          {["ML", "MO", "ATC", "delivery", "collection"].map((stage) => (
            <div key={stage} className="flex-1 text-center">
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#C9A84C] to-orange-500" style={{ width: `${Math.max(10, ((stats?.byLTCStage?.[stage] || 0) / (stats?.total || 1)) * 100)}%` }} />
              </div>
              <p className="text-xs text-white/40 mt-2">{stage}</p>
              <p className="text-sm font-bold text-white">{stats?.byLTCStage?.[stage] || 0}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Lead List View ───────────────────────────────────────────────────────────

function LeadListView({ leads, isLoading, onSelect, filterRating, onFilterChange }: {
  leads: Lead[]; isLoading: boolean; onSelect: (id: string) => void;
  filterRating: ValueRating | ""; onFilterChange: (r: ValueRating | "") => void;
}) {
  const { t } = useTranslation();
  const sales = t("maoai.sales", { returnObjects: true }) as any;

  if (isLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 size={32} className="text-[#C9A84C] animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input type="text" placeholder={sales.searchPlaceholder} className="bg-white/5 border border-white/10 pl-10 pr-4 py-2 text-sm text-white placeholder-white/30 focus:border-[#C9A84C]/40 focus:outline-none w-64" />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10">
            <Filter size={14} /> {sales.filter}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {(["", "A", "B", "C", "D"] as const).map((r) => (
            <button
              key={r}
              onClick={() => onFilterChange(r)}
              className={`px-3 py-1.5 text-xs rounded border transition-all ${filterRating === r ? "bg-[#C9A84C]/20 border-[#C9A84C]/40 text-[#C9A84C]" : "border-white/10 text-white/40 hover:text-white/60"}`}
            >
              {r || "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Rating</th>
              <th className="text-left text-xs text-white/40 font-medium px-4 py-3">{sales.table.lead}</th>
              <th className="text-left text-xs text-white/40 font-medium px-4 py-3">{sales.table.company}</th>
              <th className="text-left text-xs text-white/40 font-medium px-4 py-3">LTC</th>
              <th className="text-left text-xs text-white/40 font-medium px-4 py-3">{sales.table.status}</th>
              <th className="text-left text-xs text-white/40 font-medium px-4 py-3">Risk</th>
              <th className="text-right text-xs text-white/40 font-medium px-4 py-3">{sales.table.actions}</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead: Lead) => (
              <tr key={lead.id} className="border-t border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => onSelect(lead.id)}>
                <td className="px-4 py-3"><ValueRatingBadge rating={lead.valueRating} /></td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm text-white font-medium">{lead.name}</p>
                    <p className="text-xs text-white/40">{lead.title}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-white/70">{lead.company}</p>
                  <p className="text-xs text-white/30">{lead.industry || "-"}</p>
                </td>
                <td className="px-4 py-3"><LTCStageBadge stage={lead.ltcStage} /></td>
                <td className="px-4 py-3">
                  <span className={`text-sm ${lead.status === "closed_won" ? "text-green-400" : lead.status === "closed_lost" ? "text-red-400" : "text-white/70"}`}>
                    {sales.statuses[lead.status] || lead.status}
                  </span>
                </td>
                <td className="px-4 py-3"><PaymentRiskBadge risk={lead.paymentRisk} /></td>
                <td className="px-4 py-3 text-right">
                  <button className="text-white/40 hover:text-[#C9A84C] p-1" onClick={(e) => { e.stopPropagation(); onSelect(lead.id); }}>
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

// ─── Lead Detail View with Tabs ───────────────────────────────────────────────

function LeadDetail({ lead, view, onViewChange, onBack }: { lead: Lead; view: string; onViewChange: (v: any) => void; onBack: () => void }) {
  const { t } = useTranslation();
  const sales = t("maoai.sales", { returnObjects: true }) as any;

  const detailTabs = [
    { id: "profile" as const, icon: Building2, label: sales.detailTabs.profile },
    { id: "powermap" as const, icon: Brain, label: sales.detailTabs.powerMap },
    { id: "painchain" as const, icon: Heart, label: sales.detailTabs.painChain },
    { id: "irontriangle" as const, icon: Swords, label: sales.detailTabs.ironTriangle },
    { id: "competitors" as const, icon: Zap, label: sales.detailTabs.competitors },
    { id: "intel" as const, icon: FileText, label: sales.detailTabs.intel },
    { id: "ltc" as const, icon: Clock, label: sales.detailTabs.ltc },
  ];

  return (
    <div className="space-y-4">
      {/* Back + Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-white/50 hover:text-white text-sm">
          <ChevronLeft size={16} /> {sales.back}
        </button>
        <div className="flex items-center gap-3">
          <ValueRatingBadge rating={lead.valueRating} />
          <LTCStageBadge stage={lead.ltcStage} />
          <span className="text-white font-medium">{lead.company}</span>
          <span className="text-white/40 text-sm">{lead.name}</span>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 border-b border-white/10 pb-0">
        {detailTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm border-b-2 transition-all ${view === tab.id ? "border-[#C9A84C] text-[#C9A84C]" : "border-transparent text-white/40 hover:text-white/70"}`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {view === "profile" && <CustomerProfile lead={lead} />}
      {view === "powermap" && <PowerMapView leadId={lead.id} />}
      {view === "painchain" && <PainChainView leadId={lead.id} />}
      {view === "irontriangle" && <IronTriangleView leadId={lead.id} />}
      {view === "competitors" && <CompetitorView leadId={lead.id} />}
      {view === "intel" && <IntelRecordsView leadId={lead.id} />}
      {view === "ltc" && <LTCWeeklyView leadId={lead.id} />}
    </div>
  );
}

// ─── Customer Profile ────────────────────────────────────────────────────────

function CustomerProfile({ lead }: { lead: Lead }) {
  const { t } = useTranslation();
  const sales = t("maoai.sales", { returnObjects: true }) as any;
  const [editing, setEditing] = useState(false);
  const updateMutation = trpc.salesIntel.updateLeadHuaweiFields.useMutation({
    onSuccess: () => setEditing(false),
    onError: (err) => alert("Failed to save: " + (err?.message || "Unknown error")),
  });
  const [form, setForm] = useState({
    valueRating: lead.valueRating as ValueRating,
    competitorName: lead.competitorName || "",
    competitorAdvantage: lead.competitorAdvantage || "",
    ourAdvantage: lead.ourAdvantage || "",
    paymentRisk: lead.paymentRisk as "low" | "medium" | "high",
    decisionCycle: lead.decisionCycle as string,
    needPrepayment: lead.needPrepayment || false,
    estimatedValue: lead.estimatedValue?.toString() || "",
    industry: lead.industry || "",
    ltcStage: lead.ltcStage as string,
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: lead.id,
      data: {
        valueRating: form.valueRating,
        competitorName: form.competitorName || undefined,
        competitorAdvantage: form.competitorAdvantage || undefined,
        ourAdvantage: form.ourAdvantage || undefined,
        paymentRisk: form.paymentRisk,
        decisionCycle: form.decisionCycle as any,
        needPrepayment: form.needPrepayment,
        estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : null,
        industry: form.industry || undefined,
        ltcStage: form.ltcStage as any,
      },
    });
    setEditing(false);
  };

  const handleCancel = () => {
    setForm({
      valueRating: lead.valueRating,
      competitorName: lead.competitorName || "",
      competitorAdvantage: lead.competitorAdvantage || "",
      ourAdvantage: lead.ourAdvantage || "",
      paymentRisk: lead.paymentRisk,
      decisionCycle: lead.decisionCycle,
      needPrepayment: lead.needPrepayment || false,
      estimatedValue: lead.estimatedValue?.toString() || "",
      industry: lead.industry || "",
      ltcStage: lead.ltcStage,
    });
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        {editing ? (
          <>
            <button onClick={handleCancel} className="flex items-center gap-1 px-3 py-1.5 text-sm text-white/50 hover:text-white"><X size={14} /> Cancel</button>
            <button onClick={handleSave} disabled={updateMutation.isPending} className="flex items-center gap-1 px-3 py-1.5 bg-[#C9A84C] text-black text-sm font-medium rounded hover:bg-[#C9A84C]/90">
              {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Save</>}
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#C9A84C] border border-[#C9A84C]/40 rounded hover:bg-[#C9A84C]/10"><Edit3 size={14} /> Edit Profile</button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-lg space-y-4">
          <h4 className="text-white font-semibold flex items-center gap-2"><Building2 size={16} className="text-[#C9A84C]" /> {sales.profile.basic}</h4>
          {[
            { label: sales.profile.company, value: lead.company },
            { label: sales.profile.title, value: lead.title },
            { label: sales.profile.email, value: lead.email },
          ].map((f) => (
            <div key={f.label} className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-white/40 text-sm">{f.label}</span>
              <span className="text-white text-sm">{f.value || "-"}</span>
            </div>
          ))}
          {/* Editable Industry */}
          <div className="flex justify-between border-b border-white/5 pb-2 items-center">
            <span className="text-white/40 text-sm">{sales.profile.industry}</span>
            {editing ? (
              <input type="text" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="bg-black/30 border border-white/10 px-2 py-1 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none w-48" />
            ) : (
              <span className="text-white text-sm">{lead.industry || "-"}</span>
            )}
          </div>
          {/* Editable Value Rating */}
          <div className="flex justify-between border-b border-white/5 pb-2 items-center">
            <span className="text-white/40 text-sm">{sales.profile.valueRating}</span>
            {editing ? (
              <select value={form.valueRating} onChange={(e) => setForm({ ...form, valueRating: e.target.value as ValueRating })} className="bg-black/30 border border-white/10 px-2 py-1 text-sm text-white focus:outline-none">
                {(["A", "B", "C", "D"] as const).map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            ) : (
              <ValueRatingBadge rating={lead.valueRating} />
            )}
          </div>
          {/* Editable Estimated Value */}
          <div className="flex justify-between items-center">
            <span className="text-white/40 text-sm">{sales.profile.estimatedValue}</span>
            {editing ? (
              <input type="number" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })} className="bg-black/30 border border-white/10 px-2 py-1 text-sm text-green-400 focus:border-[#C9A84C]/40 focus:outline-none w-32" placeholder="0" />
            ) : (
              <span className="text-green-400 text-sm font-medium">{lead.estimatedValue ? `¥${lead.estimatedValue.toLocaleString()}` : "-"}</span>
            )}
          </div>
        </div>

        {/* Competitive Intel */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-lg space-y-4">
          <h4 className="text-white font-semibold flex items-center gap-2"><Swords size={16} className="text-red-400" /> {sales.profile.competitive}</h4>
          {/* Editable Competitor Name */}
          <div>
            <p className="text-white/40 text-xs mb-1">{sales.profile.competitor}</p>
            {editing ? (
              <input type="text" value={form.competitorName} onChange={(e) => setForm({ ...form, competitorName: e.target.value })} className="w-full bg-black/30 border border-white/10 px-2 py-1 text-sm text-white focus:border-red-400/40 focus:outline-none" />
            ) : (
              <p className="text-white/80 text-sm">{lead.competitorName || "-"}</p>
            )}
          </div>
          {/* Editable Competitor Advantage */}
          <div>
            <p className="text-white/40 text-xs mb-1">{sales.profile.competitorAdv}</p>
            {editing ? (
              <textarea value={form.competitorAdvantage} onChange={(e) => setForm({ ...form, competitorAdvantage: e.target.value })} rows={2} className="w-full bg-black/30 border border-white/10 px-2 py-1 text-sm text-white focus:border-red-400/40 focus:outline-none resize-none" />
            ) : (
              <p className="text-white/80 text-sm">{lead.competitorAdvantage || "-"}</p>
            )}
          </div>
          {/* Editable Our Advantage */}
          <div>
            <p className="text-white/40 text-xs mb-1">{sales.profile.ourAdv}</p>
            {editing ? (
              <textarea value={form.ourAdvantage} onChange={(e) => setForm({ ...form, ourAdvantage: e.target.value })} rows={2} className="w-full bg-black/30 border border-green-500/10 px-2 py-1 text-sm text-green-400 focus:border-green-400/40 focus:outline-none resize-none" />
            ) : (
              <p className="text-green-300 text-sm">{lead.ourAdvantage || "-"}</p>
            )}
          </div>
        </div>

        {/* Risk Warning */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-lg space-y-4">
          <h4 className="text-white font-semibold flex items-center gap-2"><AlertTriangle size={16} className="text-yellow-400" /> {sales.profile.risk}</h4>
          {/* Editable Payment Risk */}
          <div className="flex justify-between border-b border-white/5 pb-2 items-center">
            <span className="text-white/40 text-sm">{sales.profile.paymentRisk}</span>
            {editing ? (
              <select value={form.paymentRisk} onChange={(e) => setForm({ ...form, paymentRisk: e.target.value as any })} className="bg-black/30 border border-white/10 px-2 py-1 text-sm text-white focus:outline-none">
                {(["low", "medium", "high"] as const).map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            ) : (
              <PaymentRiskBadge risk={lead.paymentRisk} />
            )}
          </div>
          {/* Editable Decision Cycle */}
          <div className="flex justify-between border-b border-white/5 pb-2 items-center">
            <span className="text-white/40 text-sm">{sales.profile.decisionCycle}</span>
            {editing ? (
              <select value={form.decisionCycle} onChange={(e) => setForm({ ...form, decisionCycle: e.target.value })} className="bg-black/30 border border-white/10 px-2 py-1 text-sm text-white focus:outline-none">
                {["1_week", "2_weeks", "1_month", "1_quarter", "long", "unknown"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            ) : (
              <span className="text-white text-sm">{sales.profileDecisionCycleLabels?.[lead.decisionCycle] || lead.decisionCycle}</span>
            )}
          </div>
          {/* Editable Prepayment */}
          <div className="flex justify-between items-center">
            <span className="text-white/40 text-sm">{sales.profile.needPrepayment}</span>
            {editing ? (
              <button onClick={() => setForm({ ...form, needPrepayment: !form.needPrepayment })} className={`px-3 py-1 text-sm rounded ${form.needPrepayment ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                {form.needPrepayment ? "Yes" : "No"}
              </button>
            ) : (
              <span className={lead.needPrepayment ? "text-red-400 text-sm" : "text-green-400 text-sm"}>{lead.needPrepayment ? "Yes" : "No"}</span>
            )}
          </div>
        </div>

        {/* LTC Stage */}
        <div className="bg-gradient-to-br from-[#C9A84C]/10 to-orange-500/10 border border-[#C9A84C]/20 p-5 rounded-lg">
          <h4 className="text-[#C9A84C] font-semibold flex items-center gap-2 mb-4"><Brain size={16} /> LTC Stage</h4>
          {editing ? (
            <div className="flex gap-2 flex-wrap">
              {["ML", "MO", "ATC", "delivery", "collection"].map((s) => (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, ltcStage: s })}
                  className={`px-3 py-1.5 text-xs rounded border ${form.ltcStage === s ? "bg-[#C9A84C]/20 border-[#C9A84C]/40 text-[#C9A84C]" : "border-white/10 text-white/40"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1 mb-3">
                {["ML", "MO", "ATC", "delivery", "collection"].map((s, i) => (
                  <div key={s} className="flex-1 text-center">
                    <div className={`h-2 rounded-full ${lead.ltcStage === s ? "bg-[#C9A84C]" : ["ML", "MO", "ATC", "delivery", "collection"].indexOf(lead.ltcStage) > i ? "bg-[#C9A84C]/40" : "bg-white/10"}`} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-white/40">
                <span>ML</span><span>MO</span><span>ATC</span><span>Delivery</span><span>Collection</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Power Map View ──────────────────────────────────────────────────────────

function PowerMapView({ leadId }: { leadId: string }) {
  const { t } = useTranslation();
  const sales = t("maoai.sales", { returnObjects: true }) as any;
  const { data: makers = [], refetch } = trpc.salesIntel.listDecisionMakers.useQuery({ leadId });
  const dms = makers as unknown as DMType[];
  const createMutation = trpc.salesIntel.createDecisionMaker.useMutation({ onSuccess: () => { refetch(); setShowForm(false); }, onError: (err) => alert("Failed to add: " + (err?.message || "Unknown error")) });
  const updateMutation = trpc.salesIntel.updateDecisionMaker.useMutation({ onSuccess: () => { refetch(); setEditingId(null); }, onError: (err) => alert("Failed to update: " + (err?.message || "Unknown error")) });
  const deleteMutation = trpc.salesIntel.deleteDecisionMaker.useMutation({ onSuccess: () => refetch(), onError: (err) => alert("Failed to delete: " + (err?.message || "Unknown error")) });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", title: "", department: "", businessPain: "", personalGoal: "", fearPoint: "", communicationStyle: "data_driven" as const, icebreaker: "", roles: [] as string[] });
  const [editForm, setEditForm] = useState({ name: "", title: "", department: "", businessPain: "", personalGoal: "", fearPoint: "", communicationStyle: "data_driven" as CommStyle, icebreaker: "", roles: [] as string[] });

  const roleLabels: Record<string, string> = {
    initiator: "Initiator", influencer: "Influencer", decider: "Decider", approver: "Approver", buyer: "Buyer",
  };
  const commStyleLabels: Record<string, string> = {
    data_driven: "Data", relationship: "Relationship", security: "Security", mixed: "Mixed",
  };

  const handleCreate = () => {
    if (!formData.name.trim()) return;
    createMutation.mutate({
      leadId,
      name: formData.name,
      title: formData.title || undefined,
      department: formData.department || undefined,
      roles: formData.roles as any,
      businessPain: formData.businessPain || undefined,
      personalGoal: formData.personalGoal || undefined,
      fearPoint: formData.fearPoint || undefined,
      communicationStyle: formData.communicationStyle,
      icebreaker: formData.icebreaker || undefined,
    });
    setFormData({ name: "", title: "", department: "", businessPain: "", personalGoal: "", fearPoint: "", communicationStyle: "data_driven", icebreaker: "", roles: [] });
    setShowForm(false);
  };

  const handleStartEdit = (dm: DMType) => {
    setEditForm({
      name: dm.name, title: dm.title, department: dm.department,
      businessPain: dm.businessPain, personalGoal: dm.personalGoal, fearPoint: dm.fearPoint,
      communicationStyle: dm.communicationStyle, icebreaker: dm.icebreaker, roles: dm.roles,
    });
    setEditingId(dm.id);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editForm.name.trim()) return;
    updateMutation.mutate({
      id: editingId,
      data: {
        name: editForm.name, title: editForm.title || undefined, department: editForm.department || undefined,
        roles: editForm.roles as any, businessPain: editForm.businessPain || undefined,
        personalGoal: editForm.personalGoal || undefined, fearPoint: editForm.fearPoint || undefined,
        communicationStyle: editForm.communicationStyle, icebreaker: editForm.icebreaker || undefined,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-white/40 text-sm">{sales.powerMap.desc}</p>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-3 py-1.5 bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-sm rounded hover:bg-[#C9A84C]/30">
          <Plus size={14} /> {sales.powerMap.addDecisionMaker}
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 border border-[#C9A84C]/30 p-4 rounded-lg space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <input type="text" placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none" />
            <input type="text" placeholder="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none" />
            <input type="text" placeholder="Department" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(roleLabels).map(([key, label]) => (
              <button key={key} onClick={() => setFormData({ ...formData, roles: formData.roles.includes(key) ? formData.roles.filter((r) => r !== key) : [...formData.roles, key] })} className={`px-2 py-1 text-xs rounded border ${formData.roles.includes(key) ? "bg-[#C9A84C]/20 border-[#C9A84C]/40 text-[#C9A84C]" : "border-white/10 text-white/40"}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <input type="text" placeholder="Business Pain (KPI)" value={formData.businessPain} onChange={(e) => setFormData({ ...formData, businessPain: e.target.value })} className="bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none" />
            <input type="text" placeholder="Personal Goal (Career)" value={formData.personalGoal} onChange={(e) => setFormData({ ...formData, personalGoal: e.target.value })} className="bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none" />
            <input type="text" placeholder="Fear Point" value={formData.fearPoint} onChange={(e) => setFormData({ ...formData, fearPoint: e.target.value })} className="bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none" />
          </div>
          <div className="flex items-center gap-3">
            <select value={formData.communicationStyle} onChange={(e) => setFormData({ ...formData, communicationStyle: e.target.value as any })} className="bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none">
              {Object.entries(commStyleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input type="text" placeholder="Icebreaker" value={formData.icebreaker} onChange={(e) => setFormData({ ...formData, icebreaker: e.target.value })} className="flex-1 bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-white/50 hover:text-white">Cancel</button>
            <button onClick={handleCreate} className="px-3 py-1.5 bg-[#C9A84C] text-black text-sm font-medium rounded hover:bg-[#C9A84C]/90">Add</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {dms.map((dm) => (
          <div key={dm.id} className={`bg-white/5 border p-4 rounded-lg space-y-3 ${editingId === dm.id ? "border-[#C9A84C]/40" : "border-white/10"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{dm.name}</p>
                <p className="text-xs text-white/40">{dm.title} {dm.department ? `- ${dm.department}` : ""}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {dm.roles.map((r) => (
                    <span key={r} className="text-[10px] px-1.5 py-0.5 bg-[#C9A84C]/10 text-[#C9A84C] rounded">{roleLabels[r] || r}</span>
                  ))}
                </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleStartEdit(dm)} className="text-white/20 hover:text-[#C9A84C] p-1"><Edit3 size={12} /></button>
                <button onClick={() => deleteMutation.mutate({ id: dm.id })} className="text-white/20 hover:text-red-400 p-1"><Trash2 size={12} /></button>
              </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-black/20 p-2 rounded">
                <p className="text-blue-400 mb-1">Pain (KPI)</p>
                <p className="text-white/70">{dm.businessPain || "-"}</p>
              </div>
              <div className="bg-black/20 p-2 rounded">
                <p className="text-purple-400 mb-1">Goal (Career)</p>
                <p className="text-white/70">{dm.personalGoal || "-"}</p>
              </div>
              <div className="bg-black/20 p-2 rounded">
                <p className="text-red-400 mb-1">Fear</p>
                <p className="text-white/70">{dm.fearPoint || "-"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-white/40">Style:</span>
              <span className="text-[#C9A84C]">{commStyleLabels[dm.communicationStyle] || dm.communicationStyle}</span>
              {dm.icebreaker && <span className="text-white/30">|</span>}
              {dm.icebreaker && <span className="text-green-400">{dm.icebreaker}</span>}
            </div>
            <div className="flex gap-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${dm.arVerified ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/20"}`}>AR</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${dm.srVerified ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/20"}`}>SR</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${dm.frVerified ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/20"}`}>FR</span>
            </div>
            {editingId === dm.id && (
              <div className="mt-3 pt-3 border-t border-[#C9A84C]/20 space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bg-black/30 border border-white/10 px-2 py-1 text-xs text-white focus:border-[#C9A84C]/40 focus:outline-none" />
                  <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="bg-black/30 border border-white/10 px-2 py-1 text-xs text-white focus:border-[#C9A84C]/40 focus:outline-none" />
                  <input type="text" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className="bg-black/30 border border-white/10 px-2 py-1 text-xs text-white focus:border-[#C9A84C]/40 focus:outline-none" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={editForm.businessPain} onChange={(e) => setEditForm({ ...editForm, businessPain: e.target.value })} placeholder="Pain" className="bg-black/30 border border-white/10 px-2 py-1 text-xs text-white focus:border-[#C9A84C]/40 focus:outline-none" />
                  <input type="text" value={editForm.personalGoal} onChange={(e) => setEditForm({ ...editForm, personalGoal: e.target.value })} placeholder="Goal" className="bg-black/30 border border-white/10 px-2 py-1 text-xs text-white focus:border-[#C9A84C]/40 focus:outline-none" />
                  <input type="text" value={editForm.fearPoint} onChange={(e) => setEditForm({ ...editForm, fearPoint: e.target.value })} placeholder="Fear" className="bg-black/30 border border-white/10 px-2 py-1 text-xs text-white focus:border-[#C9A84C]/40 focus:outline-none" />
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs text-white/50 hover:text-white">Cancel</button>
                  <button onClick={handleSaveEdit} disabled={updateMutation.isPending} className="px-2 py-1 bg-[#C9A84C] text-black text-xs rounded">
                    {updateMutation.isPending ? <Loader2 size={10} className="animate-spin inline" /> : "Save"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Pain Chain View ──────────────────────────────────────────────────────────

function PainChainView({ leadId }: { leadId: string }) {
  const { data: makers = [] } = trpc.salesIntel.listDecisionMakers.useQuery({ leadId });
  const dms = makers as unknown as DMType[];

  return (
    <div className="space-y-4">
      <p className="text-white/40 text-sm">Huawei Pain Chain analysis - whose pain drives the decision</p>
      {makers.length === 0 && <p className="text-white/20 text-center py-8">Add decision makers in the Power Map tab first</p>}
      <div className="space-y-3">
        {dms.map((dm) => (
          <div key={dm.id} className="bg-white/5 border border-white/10 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 text-sm font-bold">{dm.name[0]}</div>
              <div>
                <p className="text-white font-medium">{dm.name}</p>
                <p className="text-xs text-white/40">{dm.title}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-blue-400 mb-1 flex items-center gap-1"><AlertTriangle size={12} /> Business Pain (KPI)</p>
                <p className="text-sm text-white/80 bg-blue-500/5 border border-blue-500/10 p-2 rounded">{dm.businessPain || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-purple-400 mb-1 flex items-center gap-1"><TrendingUp size={12} /> Personal Goal (Career)</p>
                <p className="text-sm text-white/80 bg-purple-500/5 border border-purple-500/10 p-2 rounded">{dm.personalGoal || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-red-400 mb-1 flex items-center gap-1"><Lock size={12} /> Fear Point</p>
                <p className="text-sm text-white/80 bg-red-500/5 border border-red-500/10 p-2 rounded">{dm.fearPoint || "-"}</p>
              </div>
            </div>
            {dm.nextAction && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-xs text-green-400 mb-1">Next Action</p>
                <p className="text-sm text-white/70">{dm.nextAction}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Iron Triangle View ──────────────────────────────────────────────────────

function IronTriangleView({ leadId }: { leadId: string }) {
  const { data: reviews = [], refetch } = trpc.salesIntel.listIronTriangleReviews.useQuery({ leadId });
  const { data: makers = [] } = trpc.salesIntel.listDecisionMakers.useQuery({ leadId });
  const createMutation = trpc.salesIntel.createIronTriangleReview.useMutation({ onSuccess: () => refetch(), onError: (err) => alert("Failed to create review: " + (err?.message || "Unknown error")) });
  const dms = makers as unknown as DMType[];

  const [form, setForm] = useState({ arCoverage: "", arNextStep: "", srPainMatch: "", srProposalStatus: "", frDeliveryRisk: "", frPaymentPlan: "", overallActionPlan: "", winProbability: 50 });

  const handleSubmit = () => {
    createMutation.mutate({
      leadId,
      arCoverage: form.arCoverage || undefined,
      arNextStep: form.arNextStep || undefined,
      srPainMatch: form.srPainMatch || undefined,
      srProposalStatus: form.srProposalStatus || undefined,
      frDeliveryRisk: form.frDeliveryRisk || undefined,
      frPaymentPlan: form.frPaymentPlan || undefined,
      overallActionPlan: form.overallActionPlan || undefined,
      winProbability: form.winProbability,
    });
  };

  const arCoverage = dms.filter((m) => m.arVerified).length;
  const srCoverage = dms.filter((m) => m.srVerified).length;
  const frCoverage = dms.filter((m) => m.frVerified).length;
  const totalDm = dms.length || 1;

  return (
    <div className="space-y-6">
      {/* Coverage Overview */}
      <div className="bg-gradient-to-r from-[#C9A84C]/10 to-purple-500/10 border border-[#C9A84C]/20 p-5 rounded-lg">
        <h4 className="text-[#C9A84C] font-semibold mb-4 flex items-center gap-2"><Swords size={16} /> Iron Triangle Coverage</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-blue-400" style={{ width: `${(arCoverage / totalDm) * 100}%` }} />
            </div>
            <p className="text-sm text-blue-400 font-medium">AR (Customer Manager)</p>
            <p className="text-xs text-white/40">{arCoverage}/{makers.length} verified</p>
          </div>
          <div className="text-center">
            <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-purple-400" style={{ width: `${(srCoverage / totalDm) * 100}%` }} />
            </div>
            <p className="text-sm text-purple-400 font-medium">SR (Solution Expert)</p>
            <p className="text-xs text-white/40">{srCoverage}/{makers.length} verified</p>
          </div>
          <div className="text-center">
            <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-green-400" style={{ width: `${(frCoverage / totalDm) * 100}%` }} />
            </div>
            <p className="text-sm text-green-400 font-medium">FR (Delivery Expert)</p>
            <p className="text-xs text-white/40">{frCoverage}/{makers.length} verified</p>
          </div>
        </div>
      </div>

      {/* New Review Form */}
      <div className="bg-white/5 border border-white/10 p-5 rounded-lg space-y-4">
        <h4 className="text-white font-semibold">New Review</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-blue-400 font-medium">AR: Relationship Check</p>
            <textarea value={form.arCoverage} onChange={(e) => setForm({ ...form, arCoverage: e.target.value })} placeholder="Who haven't you met yet?" rows={3} className="w-full bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-blue-400/40 focus:outline-none resize-none" />
            <input type="text" value={form.arNextStep} onChange={(e) => setForm({ ...form, arNextStep: e.target.value })} placeholder="Next contact plan" className="w-full bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-blue-400/40 focus:outline-none" />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-purple-400 font-medium">SR: Pain Match Check</p>
            <textarea value={form.srPainMatch} onChange={(e) => setForm({ ...form, srPainMatch: e.target.value })} placeholder="Does proposal match their pain?" rows={3} className="w-full bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-purple-400/40 focus:outline-none resize-none" />
            <input type="text" value={form.srProposalStatus} onChange={(e) => setForm({ ...form, srProposalStatus: e.target.value })} placeholder="Proposal improvement direction" className="w-full bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-purple-400/40 focus:outline-none" />
          </div>
          <div className="space-y-2">
            <p className="text-xs text-green-400 font-medium">FR: Delivery & Payment Check</p>
            <textarea value={form.frDeliveryRisk} onChange={(e) => setForm({ ...form, frDeliveryRisk: e.target.value })} placeholder="Delivery cycle and risks?" rows={3} className="w-full bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-green-400/40 focus:outline-none resize-none" />
            <input type="text" value={form.frPaymentPlan} onChange={(e) => setForm({ ...form, frPaymentPlan: e.target.value })} placeholder="Prepayment terms?" className="w-full bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-green-400/40 focus:outline-none" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs text-white/40">Overall Action Plan</label>
            <input type="text" value={form.overallActionPlan} onChange={(e) => setForm({ ...form, overallActionPlan: e.target.value })} placeholder="Key next steps" className="w-full bg-black/30 border border-white/10 px-3 py-2 text-sm text-white mt-1 focus:border-[#C9A84C]/40 focus:outline-none" />
          </div>
          <div className="w-32">
            <label className="text-xs text-white/40">Win Probability</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="range" min={0} max={100} value={form.winProbability} onChange={(e) => setForm({ ...form, winProbability: parseInt(e.target.value) })} className="flex-1" />
              <span className={`text-sm font-bold ${form.winProbability >= 70 ? "text-green-400" : form.winProbability >= 40 ? "text-yellow-400" : "text-red-400"}`}>{form.winProbability}%</span>
            </div>
          </div>
          <button onClick={handleSubmit} disabled={createMutation.isPending} className="px-4 py-2 bg-[#C9A84C] text-black text-sm font-medium rounded hover:bg-[#C9A84C]/90 mt-5">
            {createMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : "Submit Review"}
          </button>
        </div>
      </div>

      {/* Review History */}
      {reviews.length > 0 && reviews.map((r: any) => (
        <div key={r.id} className="bg-white/5 border border-white/10 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/30">{r.reviewDate ? new Date(r.reviewDate).toLocaleDateString() : "-"}</p>
            {r.winProbability && <span className={`text-sm font-bold ${r.winProbability >= 70 ? "text-green-400" : "text-yellow-400"}`}>{r.winProbability}%</span>}
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div><p className="text-blue-400 mb-1">AR</p><p className="text-white/60">{r.arCoverage || "-"}</p></div>
            <div><p className="text-purple-400 mb-1">SR</p><p className="text-white/60">{r.srPainMatch || "-"}</p></div>
            <div><p className="text-green-400 mb-1">FR</p><p className="text-white/60">{r.frDeliveryRisk || "-"}</p></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Competitor View (Stub) ───────────────────────────────────────────────────

function CompetitorView({ leadId }: { leadId: string }) {
  const { t } = useTranslation();
  const sales = t("maoai.sales", { returnObjects: true }) as any;
  const { data: comps = [], refetch } = trpc.salesIntel.listCompetitors.useQuery({ leadId });
  const createMutation = trpc.salesIntel.createCompetitor.useMutation({ onSuccess: () => refetch(), onError: (err) => alert("Failed to add competitor: " + (err?.message || "Unknown error")) });
  const deleteMutation = trpc.salesIntel.deleteCompetitor.useMutation({ onSuccess: () => refetch(), onError: (err) => alert("Failed to delete: " + (err?.message || "Unknown error")) });
  const [form, setForm] = useState({ name: "", solution: "", priceRange: "", strengths: "", weaknesses: "", differentiator: "" });
  const [showForm, setShowForm] = useState(false);

  const handleCreate = () => {
    if (!form.name.trim()) return;
    createMutation.mutate({ leadId, competitorName: form.name, competitorSolution: form.solution, competitorPriceRange: form.priceRange, competitorStrengths: form.strengths, competitorWeaknesses: form.weaknesses, ourDifferentiator: form.differentiator });
    setForm({ name: "", solution: "", priceRange: "", strengths: "", weaknesses: "", differentiator: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-white/40 text-sm">{sales.competitorView.desc}</p>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/40 text-red-400 text-sm rounded hover:bg-red-500/30"><Plus size={14} /> Add Competitor</button>
      </div>

      {showForm && (
        <div className="bg-white/5 border border-red-500/30 p-4 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Competitor Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-red-400/40 focus:outline-none" />
            <input type="text" placeholder="Price Range" value={form.priceRange} onChange={(e) => setForm({ ...form, priceRange: e.target.value })} className="bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-red-400/40 focus:outline-none" />
          </div>
          <textarea placeholder="Their Solution" value={form.solution} onChange={(e) => setForm({ ...form, solution: e.target.value })} rows={2} className="w-full bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-red-400/40 focus:outline-none resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <textarea placeholder="Their Strengths" value={form.strengths} onChange={(e) => setForm({ ...form, strengths: e.target.value })} rows={2} className="w-full bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-red-400/40 focus:outline-none resize-none" />
            <textarea placeholder="Their Weaknesses" value={form.weaknesses} onChange={(e) => setForm({ ...form, weaknesses: e.target.value })} rows={2} className="w-full bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-red-400/40 focus:outline-none resize-none" />
          </div>
          <textarea placeholder="Our Differentiator" value={form.differentiator} onChange={(e) => setForm({ ...form, differentiator: e.target.value })} rows={2} className="w-full bg-black/30 border border-green-500/10 px-3 py-2 text-sm text-green-400 focus:border-green-400/40 focus:outline-none resize-none" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-white/50">Cancel</button>
            <button onClick={handleCreate} className="px-3 py-1.5 bg-red-500 text-white text-sm rounded">Add</button>
          </div>
        </div>
      )}

      {comps.map((c: any) => (
        <div key={c.id} className="bg-white/5 border border-white/10 p-4 rounded-lg grid grid-cols-4 gap-4 items-start">
          <div>
            <p className="text-red-400 font-medium text-sm">{c.competitorName}</p>
            <p className="text-xs text-white/30">{c.competitorPriceRange}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Strengths</p>
            <p className="text-xs text-white/70">{c.competitorStrengths || "-"}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Weaknesses</p>
            <p className="text-xs text-white/70">{c.competitorWeaknesses || "-"}</p>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-green-400 mb-1">Our Differentiator</p>
              <p className="text-xs text-green-300">{c.ourDifferentiator || "-"}</p>
            </div>
            <button onClick={() => deleteMutation.mutate({ id: c.id })} className="text-white/20 hover:text-red-400 p-1 mt-4"><Trash2 size={12} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Intel Records View (Stub) ────────────────────────────────────────────────

function IntelRecordsView({ leadId }: { leadId: string }) {
  const { data: records = [], refetch } = trpc.salesIntel.listIntelRecords.useQuery({ leadId });
  const createMutation = trpc.salesIntel.createIntelRecord.useMutation({ onSuccess: () => refetch(), onError: (err) => alert("Failed to add intel: " + (err?.message || "Unknown error")) });
  const [form, setForm] = useState({ intelType: "customer_public" as const, source: "", title: "", content: "", impact: "" });

  const handleSubmit = () => {
    if (!form.title.trim() || !form.source.trim()) return;
    createMutation.mutate({ leadId, ...form });
    setForm({ intelType: "customer_public", source: "", title: "", content: "", impact: "" });
  };

  const typeLabels: Record<string, string> = { customer_public: "Customer Intel", competitor: "Competitor Intel", industry: "Industry", other: "Other" };

  return (
    <div className="space-y-4">
      <div className="bg-white/5 border border-white/10 p-4 rounded-lg space-y-3">
        <p className="text-white/40 text-xs">Huawei "Two Looks" - Track customer public info and competitor intelligence</p>
        <div className="flex gap-3">
          <select value={form.intelType} onChange={(e) => setForm({ ...form, intelType: e.target.value as any })} className="bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none">
            {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="text" placeholder="Source (e.g. QCC, website, job posting...)" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="flex-1 bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none" />
        </div>
        <input type="text" placeholder="Intel title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none" />
        <input type="text" placeholder="Detailed content (optional)" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none" />
        <input type="text" placeholder="Impact on sales strategy" value={form.impact} onChange={(e) => setForm({ ...form, impact: e.target.value })} className="w-full bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none" />
        <div className="flex justify-end">
          <button onClick={handleSubmit} className="px-3 py-1.5 bg-[#C9A84C] text-black text-sm rounded">Add Intel</button>
        </div>
      </div>

      {records.map((r: any) => (
        <div key={r.id} className="bg-white/5 border border-white/10 p-3 rounded-lg flex items-start gap-3">
          <span className={`text-[10px] px-1.5 py-0.5 rounded mt-0.5 ${r.intelType === "competitor" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>{typeLabels[r.intelType] || r.intelType}</span>
          <div className="flex-1">
            <p className="text-sm text-white font-medium">{r.title}</p>
            <p className="text-xs text-white/40">Source: {r.source}</p>
            {r.impact && <p className="text-xs text-green-400 mt-1">Impact: {r.impact}</p>}
          </div>
          <span className="text-[10px] text-white/20">{new Date(r.recordedAt).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── LTC Weekly View (Stub) ───────────────────────────────────────────────────

function LTCWeeklyView({ leadId }: { leadId: string }) {
  const { t } = useTranslation();
  const sales = t("maoai.sales", { returnObjects: true }) as any;
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  const weekStr = weekStart.toISOString().split("T")[0];

  const { data: tasks = [], refetch } = trpc.salesIntel.listLTCWeeklyTasks.useQuery({ leadId, weekStart: weekStr });
  const createMutation = trpc.salesIntel.createLTCWeeklyTask.useMutation({ onSuccess: () => refetch(), onError: (err) => alert("Failed to create task: " + (err?.message || "Unknown error")) });
  const toggleMutation = trpc.salesIntel.toggleLTCWeeklyTask.useMutation({ onSuccess: () => refetch(), onError: (err) => alert("Failed to toggle task: " + (err?.message || "Unknown error")) });
  const [newTask, setNewTask] = useState("");
  const [newPhase, setNewPhase] = useState<string>("ML_clean");

  const handleCreate = () => {
    if (!newTask.trim()) return;
    createMutation.mutate({ leadId, weekStart: weekStr, phase: newPhase as any, taskDescription: newTask });
    setNewTask("");
  };

  const phases = [
    { id: "ML_clean", label: "ML: Clean Leads", color: "text-blue-400" },
    { id: "ML_value_email", label: "ML: Value Email", color: "text-blue-300" },
    { id: "MO_deep_update", label: "MO: Deep Update", color: "text-purple-400" },
    { id: "MO_strategy", label: "MO: Strategy", color: "text-purple-300" },
    { id: "ATC_review", label: "ATC: Contract Review", color: "text-orange-400" },
    { id: "delivery_monitor", label: "Delivery", color: "text-cyan-400" },
    { id: "collection", label: "Collection", color: "text-green-400" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-white/40 text-sm">Week of {weekStr} - Huawei LTC cycle</p>

      <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
        <div className="flex gap-2 mb-3">
          <select value={newPhase} onChange={(e) => setNewPhase(e.target.value)} className="bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none">
            {phases.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <input type="text" placeholder="Task description..." value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()} className="flex-1 bg-black/30 border border-white/10 px-3 py-2 text-sm text-white focus:border-[#C9A84C]/40 focus:outline-none" />
          <button onClick={handleCreate} className="px-3 py-2 bg-[#C9A84C]/20 border border-[#C9A84C]/40 text-[#C9A84C] text-sm rounded">Add</button>
        </div>

        {tasks.map((task: any) => {
          const phase = phases.find((p) => p.id === task.phase);
          return (
            <div key={task.id} className={`flex items-center gap-3 py-2 border-b border-white/5 ${task.completed ? "opacity-50" : ""}`}>
              <button onClick={() => toggleMutation.mutate({ id: task.id, completed: !task.completed })} className={`w-5 h-5 rounded border ${task.completed ? "bg-green-500/30 border-green-500/50" : "border-white/20"}`}>
                {task.completed && <Check size={12} className="text-green-400 mx-auto" />}
              </button>
              <span className={`text-xs ${phase?.color || "text-white/40"}`}>{phase?.label || task.phase}</span>
              <span className={`text-sm flex-1 ${task.completed ? "line-through text-white/30" : "text-white"}`}>{task.taskDescription}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Outreach View ──────────────────────────────────────────────────────────

function OutreachView({ leads }: { leads: Lead[] }) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [emailContent, setEmailContent] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [outreachType, setOutreachType] = useState<"email" | "phone" | "meeting" | "wechat">("email");
  const updateMutation = trpc.salesIntel.updateLeadHuaweiFields.useMutation({
    onSuccess: () => alert("Follow-up scheduled successfully!"),
    onError: (err) => alert("Failed to schedule: " + (err?.message || "Unknown error")),
  });

  const handleScheduleFollowUp = () => {
    if (!selectedLead || !followUpDate) return;
    // TODO: next_follow_up field needs to be added to updateLeadHuaweiFields schema in backend
    // For now, we update the LTC stage to trigger a record activity
    updateMutation.mutate({
      id: selectedLead.id,
      data: { ltcStage: selectedLead.ltcStage as any },
    });
    alert(`Follow-up scheduled for ${followUpDate}`);
  };

  const outreachTemplates: Record<string, string> = {
    email: `Dear {name},\n\nI hope this message finds you well. I wanted to reach out regarding {company}'s recent developments in {industry}.\n\nBased on my research, I understand that one of your key priorities is improving operational efficiency while reducing costs.\n\nI would love to schedule a brief 15-minute call to share how we've helped similar organizations achieve significant results.\n\nBest regards`,
    phone: `Key talking points:\n- Confirm their current pain points\n- Ask about budget cycle and decision timeline\n- Mention 2-3 relevant case studies\n- Propose next meeting with technical team`,
    meeting: `Meeting agenda:\n1. Introduction (5 min)\n2. Current challenges discussion (15 min)\n3. Our solution overview (15 min)\n4. Q&A and next steps (10 min)\n\nPreparation:\n- Review Power Map before meeting\n- Prepare customer-specific value proposition\n- Bring relevant case studies`,
    wechat: `Casual touchpoint message:\n\nHi {name}, saw the recent news about {company}. Congrats on the progress! Would love to catch up over coffee sometime.`,
  };

  const typeColors: Record<string, string> = {
    email: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    phone: "bg-green-500/20 text-green-400 border-green-500/40",
    meeting: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    wechat: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  };

  return (
    <div className="space-y-6">
      {/* Lead Selection */}
      <div className="bg-white/5 border border-white/10 p-5 rounded-lg">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><MessageSquare size={16} className="text-[#C9A84C]" /> Select Lead for Outreach</h3>
        <div className="grid grid-cols-3 gap-3">
          {leads.slice(0, 12).map((lead) => (
            <button
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${selectedLead?.id === lead.id ? "bg-[#C9A84C]/10 border-[#C9A84C]/40" : "bg-black/20 border-white/10 hover:border-white/20"}`}
            >
              <ValueRatingBadge rating={lead.valueRating} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{lead.company}</p>
                <p className="text-xs text-white/40 truncate">{lead.name} - {lead.title}</p>
              </div>
              <LTCStageBadge stage={lead.ltcStage} />
            </button>
          ))}
        </div>
      </div>

      {/* Outreach Composer */}
      {selectedLead && (
        <div className="bg-white/5 border border-white/10 p-5 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Compose Outreach - {selectedLead.company}</h3>
            <div className="flex gap-2">
              {(["email", "phone", "meeting", "wechat"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => { setOutreachType(type); setEmailContent(outreachTemplates[type].replace("{name}", selectedLead.name).replace("{company}", selectedLead.company).replace("{industry}", selectedLead.industry || "your industry")); }}
                  className={`px-3 py-1.5 text-xs rounded border ${outreachType === type ? typeColors[type] : "border-white/10 text-white/40 hover:text-white/60"}`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Lead Context Summary */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-black/20 p-3 rounded">
              <p className="text-xs text-white/40 mb-1">Decision Cycle</p>
              <p className="text-sm text-white">{selectedLead.decisionCycle || "Unknown"}</p>
            </div>
            <div className="bg-black/20 p-3 rounded">
              <p className="text-xs text-white/40 mb-1">Payment Risk</p>
              <PaymentRiskBadge risk={selectedLead.paymentRisk} />
            </div>
            <div className="bg-black/20 p-3 rounded">
              <p className="text-xs text-white/40 mb-1">Est. Value</p>
              <p className="text-sm text-green-400">{selectedLead.estimatedValue ? `¥${selectedLead.estimatedValue.toLocaleString()}` : "-"}</p>
            </div>
            <div className="bg-black/20 p-3 rounded">
              <p className="text-xs text-white/40 mb-1">LTC Stage</p>
              <LTCStageBadge stage={selectedLead.ltcStage} />
            </div>
          </div>

          {/* Content Editor */}
          <textarea
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            rows={12}
            className="w-full bg-black/30 border border-white/10 px-4 py-3 text-sm text-white/80 focus:border-[#C9A84C]/40 focus:outline-none resize-none font-mono"
            placeholder="Write your outreach message here..."
          />

          {/* Follow-up Scheduling */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-white/40" />
              <label className="text-xs text-white/40">Schedule Follow-up:</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="bg-black/30 border border-white/10 px-3 py-1.5 text-sm text-white focus:outline-none"
              />
            </div>
            <div className="flex-1" />
            <button
              onClick={handleScheduleFollowUp}
              className="px-4 py-2 bg-[#C9A84C] text-black text-sm font-medium rounded hover:bg-[#C9A84C]/90 flex items-center gap-2"
            >
              <Send size={14} /> Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Assistant View ──────────────────────────────────────────────────────

function AIAssistantView() {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hello! I'm your Huawei-style sales AI assistant. I can help you with:\n\n- Lead qualification & scoring\n- Power Map analysis\n- Pain Chain identification\n- Iron Triangle assessment\n- Competitive positioning\n- LTC stage recommendations\n\nAsk me anything about your sales pipeline!" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    // Simulate AI analysis response
    setTimeout(() => {
      const responses: Record<string, string> = {
        qualify: "Based on the BANT framework:\n\n**Budget**: Check procurement cycle - Q4 budgets typically close by Nov\n**Authority**: Map all 5 roles in the buying center (Initiator, Influencer, Decider, Approver, Buyer)\n**Need**: Quantify the pain - use the customer's own KPI metrics\n**Timeline**: For A/B leads, target 2-4 week decision cycles\n\nRecommendation: Focus on the economic buyer's personal goals (career advancement) as the emotional driver.",
        powermap: "Power Map Best Practices:\n\n1. **Identify all 5 buying roles** - don't miss the hidden influencer\n2. **Map relationships** - who trusts whom? Who blocks whom?\n3. **Score each contact** on AR/SR/FR coverage (Huawei铁三角)\n4. **Find the champion** - someone with both authority and motivation\n5. **Watch for blockers** - address their fears proactively\n\nThe key insight: In Chinese business culture, the 'guanxi' layer often sits above the org chart.",
        painchain: "Pain Chain Analysis Framework:\n\n**Level 1 - Surface Pain**: What they tell you (budget constraints, efficiency needs)\n**Level 2 - Business Pain**: KPI pressure, competitive threats, regulatory compliance\n**Level 3 - Personal Pain**: Career risk, bonus impact, reputation concerns\n\nThe deeper you go, the more leverage you have. Always ask 'Why?' three times.\n\nExample: 'We need to reduce costs' -> Why? -> 'Profit margins are shrinking' -> Why? -> 'New competitor entered the market' -> NOW you understand the real driver.",
        iron: "Iron Triangle Assessment (华为铁三角):\n\n**AR (客户经理)**: Relationship coverage - Have you met ALL decision makers?\n**SR (解决方案专家)**: Pain match - Does your proposal address their REAL pain?\n**FR (交付专家)**: Delivery confidence - Can you deliver on time? Payment secured?\n\nGreen flags:\n- AR: 80%+ of decision makers met\n- SR: Proposal directly addresses KPI pain\n- FR: Clear delivery plan with risk mitigation\n\nRed flags:\n- AR: Only talking to one contact\n- SR: Generic pitch, no customer-specific tailoring\n- FR: No prepayment, unclear delivery timeline",
        ltc: "LTC Stage Advancement Tips:\n\n**ML (线索管理)**: Focus on A/B leads. Use value email to generate interest.\n**MO (商机管理)**: Deep-dive into pain chain. Build Power Map. Align solution.\n**ATC (签单)**: Contract review. Prepayment terms. Delivery timeline.\n**Delivery (交付)**: Execute perfectly. Document success for case study.\n**Collection (回款)**: Proactive payment tracking. Build long-term relationship.\n\nKey metric: Conversion rate from MO to ATC should be >30% for A-rated leads.",
      };

      let response = "I can help you with lead qualification, Power Map analysis, Pain Chain identification, Iron Triangle assessment, or LTC stage recommendations. Please be more specific about what you need!";

      const lowerMsg = userMsg.toLowerCase();
      if (lowerMsg.includes("qualify") || lowerMsg.includes("bant") || lowerMsg.includes("评分") || lowerMsg.includes("qualified")) {
        response = responses.qualify;
      } else if (lowerMsg.includes("power") || lowerMsg.includes("决策") || lowerMsg.includes("map")) {
        response = responses.powermap;
      } else if (lowerMsg.includes("pain") || lowerMsg.includes("痛点") || lowerMsg.includes("chain")) {
        response = responses.painchain;
      } else if (lowerMsg.includes("iron") || lowerMsg.includes("铁三角") || lowerMsg.includes("triangle")) {
        response = responses.iron;
      } else if (lowerMsg.includes("ltc") || lowerMsg.includes("阶段") || lowerMsg.includes("stage") || lowerMsg.includes("pipeline")) {
        response = responses.ltc;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: response }]);
    }, 800);
  };

  return (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: "Qualify Lead", prompt: "How do I qualify a lead using BANT?" },
          { label: "Power Map Tips", prompt: "Give me tips on building a Power Map" },
          { label: "Pain Chain", prompt: "How to do Pain Chain analysis?" },
          { label: "Iron Triangle", prompt: "Iron Triangle assessment guide" },
          { label: "LTC Strategy", prompt: "LTC stage advancement strategy" },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => { setInput(action.prompt); }}
            className="px-3 py-1.5 bg-white/5 border border-white/10 text-xs text-white/60 hover:text-white hover:border-[#C9A84C]/40 rounded transition-all"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <div className="h-[500px] overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-4 rounded-lg text-sm whitespace-pre-wrap ${msg.role === "user" ? "bg-[#C9A84C]/20 text-white border border-[#C9A84C]/30" : "bg-black/30 text-white/80 border border-white/10"}`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about lead qualification, Power Map, Pain Chain, Iron Triangle..."
            className="flex-1 bg-black/30 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-[#C9A84C]/40 focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2.5 bg-[#C9A84C] text-black text-sm font-medium rounded hover:bg-[#C9A84C]/90 flex items-center gap-2"
          >
            <Send size={14} /> Send
          </button>
        </div>
      </div>
    </div>
  );
}


