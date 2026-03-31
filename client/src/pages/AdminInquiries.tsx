/**
 * AdminInquiries — 咨询线索管理后台
 * 仅管理员可访问，展示所有咨询预约记录，支持按服务类型筛选 + 状态跟进管理
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

const SERVICE_LABELS: Record<string, { label: string; color: string }> = {
  "品牌全案":     { label: "品牌全案",     color: "#C9A84C" },
  "战略咨询":     { label: "战略咨询",     color: "#8B5CF6" },
  "内容平台":     { label: "内容平台",     color: "#40d090" },
  "品牌设计":     { label: "品牌设计",     color: "#4FC3F7" },
  "爆品营销":     { label: "爆品营销",     color: "#e05a30" },
  "毛智库":       { label: "毛智库",       color: "#8B1A1A" },
  // Whale Pictures services
  "TVC广告拍摄":  { label: "TVC广告拍摄",  color: "#F59E0B" },
  "外籍模特":     { label: "外籍模特",     color: "#EC4899" },
  "AI短剧制作":   { label: "AI短剧制作",   color: "#06B6D4" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new:       { label: "新线索",  color: "#C9A84C", bg: "#C9A84C15" },
  contacted: { label: "已联系",  color: "#4FC3F7", bg: "#4FC3F715" },
  signed:    { label: "已签约",  color: "#40d090", bg: "#40d09015" },
  dropped:   { label: "已放弃",  color: "#6b7280", bg: "#6b728015" },
};

const ALL_SERVICES = ["全部", ...Object.keys(SERVICE_LABELS)];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminInquiries() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const { data: inquiries, isLoading, refetch } = trpc.consulting.getInquiries.useQuery();
  const updateStatus = trpc.consulting.updateStatus.useMutation({
    onSuccess: () => utils.consulting.getInquiries.invalidate(),
  });

  const [filter, setFilter] = useState("全部");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center">
        <div className="text-[#C9A84C]/60 font-mono text-sm tracking-widest animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#020408] flex flex-col items-center justify-center gap-6">
        <div className="text-red-400 font-mono text-sm tracking-widest">ACCESS DENIED — 仅管理员可访问</div>
        <Link href="/">
          <a className="text-[#C9A84C]/60 hover:text-[#C9A84C] text-sm font-mono transition-colors">← 返回首页</a>
        </Link>
      </div>
    );
  }

  const rows = (inquiries as Record<string, unknown>[] | undefined) ?? [];

  const filtered = rows.filter((r) => {
    const svc = (r.service_interest as string) || "";
    const matchFilter = filter === "全部" || svc === filter;
    const matchSearch = !search || [
      r.name, r.company, r.email, r.phone, svc
    ].some(v => String(v || "").toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  const stats = [
    { label: "总线索数",  value: rows.length,                                              color: "#C9A84C" },
    { label: "新线索",    value: rows.filter(r => !r.status || r.status === "new").length, color: "#C9A84C" },
    { label: "已联系",    value: rows.filter(r => r.status === "contacted").length,        color: "#4FC3F7" },
    { label: "已签约",    value: rows.filter(r => r.status === "signed").length,           color: "#40d090" },
  ];

  const handleStatusChange = (id: number, status: string) => {
    updateStatus.mutate({ id, status });
  };

  const handleSaveNotes = (id: number) => {
    updateStatus.mutate({ id, status: (rows.find(r => r.id === id)?.status as string) || "new", notes: editNotes });
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#020408]/95 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <a className="text-white/40 hover:text-[#C9A84C] text-sm font-mono transition-colors">← 返回首页</a>
            </Link>
            <span className="text-white/10">|</span>
            <span className="text-[#C9A84C] text-xs font-mono tracking-[0.3em] uppercase">咨询线索管理</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/30 text-xs font-mono">共 {rows.length} 条线索</span>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 border border-[#C9A84C]/30 text-[#C9A84C] text-xs font-mono hover:bg-[#C9A84C]/10 transition-colors"
            >
              刷新
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat) => (
            <div key={stat.label} className="border border-white/5 bg-white/2 p-4">
              <div className="text-white/30 text-xs font-mono tracking-widest uppercase mb-2">{stat.label}</div>
              <div className="font-bold text-3xl" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Filter + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {ALL_SERVICES.map((svc) => (
              <button
                key={svc}
                onClick={() => setFilter(svc)}
                className={`px-3 py-1 text-xs font-mono tracking-wider border transition-all duration-200 ${
                  filter === svc
                    ? "border-[#C9A84C] bg-[#C9A84C]/15 text-[#C9A84C]"
                    : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/70"
                }`}
              >
                {svc}
                {svc !== "全部" && (
                  <span className="ml-1.5 text-[10px] opacity-60">
                    {rows.filter(r => r.service_interest === svc).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="搜索姓名/公司/邮箱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:ml-auto px-4 py-1.5 bg-white/3 border border-white/10 text-white/70 text-sm font-mono placeholder-white/20 focus:outline-none focus:border-[#C9A84C]/50 w-full sm:w-64"
          />
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-20 text-white/30 font-mono text-sm tracking-widest animate-pulse">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-white/5">
            <div className="text-white/20 font-mono text-sm tracking-widest">暂无线索记录</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  {["#", "姓名", "公司", "联系方式", "意向服务", "预算", "跟进状态", "备注", "提交时间"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-white/25 text-xs font-mono tracking-widest uppercase whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const svc = (row.service_interest as string) || "";
                  const svcMeta = SERVICE_LABELS[svc];
                  const rowStatus = (row.status as string) || "new";
                  const statusMeta = STATUS_CONFIG[rowStatus] || STATUS_CONFIG.new;
                  const rowId = row.id as number;
                  const isEditing = editingId === rowId;

                  return (
                    <tr key={rowId} className="border-b border-white/3 hover:bg-white/2 transition-colors">
                      <td className="px-4 py-4 text-white/20 text-xs font-mono">{rowId}</td>
                      <td className="px-4 py-4">
                        <div className="text-white text-sm font-medium">{row.name as string}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-white/60 text-sm">{(row.company as string) || "—"}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-white/70 text-xs font-mono">{row.email as string}</div>
                        {Boolean(row.phone) && <div className="text-white/40 text-xs font-mono mt-0.5">{String(row.phone)}</div>}
                      </td>
                      <td className="px-4 py-4">
                        {svcMeta ? (
                          <span
                            className="inline-block px-2 py-0.5 text-xs font-mono tracking-wider border"
                            style={{ color: svcMeta.color, borderColor: `${svcMeta.color}40`, background: `${svcMeta.color}10` }}
                          >
                            {svcMeta.label}
                          </span>
                        ) : (
                          <span className="text-white/30 text-xs">{svc || "未指定"}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-white/50 text-xs">{(row.budget as string) || "—"}</div>
                      </td>
                      {/* 状态下拉 */}
                      <td className="px-4 py-4">
                        <select
                          value={rowStatus}
                          onChange={(e) => handleStatusChange(rowId, e.target.value)}
                          className="text-xs font-mono px-2 py-1 border focus:outline-none cursor-pointer"
                          style={{
                            color: statusMeta.color,
                            borderColor: `${statusMeta.color}40`,
                            background: statusMeta.bg,
                          }}
                        >
                          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                            <option key={val} value={val} style={{ background: "#020408", color: cfg.color }}>
                              {cfg.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      {/* 备注 */}
                      <td className="px-4 py-4 max-w-xs">
                        {isEditing ? (
                          <div className="flex flex-col gap-1">
                            <textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              rows={2}
                              className="text-xs font-mono bg-white/5 border border-white/20 text-white/70 px-2 py-1 focus:outline-none focus:border-[#C9A84C]/50 resize-none w-40"
                              placeholder="输入备注..."
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleSaveNotes(rowId)}
                                className="text-[10px] px-2 py-0.5 bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30 hover:bg-[#C9A84C]/30"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-[10px] px-2 py-0.5 bg-white/5 text-white/40 border border-white/10 hover:bg-white/10"
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="text-white/40 text-xs leading-relaxed cursor-pointer hover:text-white/70 transition-colors group"
                            onClick={() => { setEditingId(rowId); setEditNotes((row.notes as string) || ""); }}
                          >
                            {(row.notes as string) || <span className="text-white/15 group-hover:text-white/30">点击添加备注...</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-white/30 text-xs font-mono">
                          {row.created_at ? formatDate(row.created_at as string) : "—"}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 text-right">
          <span className="text-white/15 text-xs font-mono">
            显示 {filtered.length} / {rows.length} 条 · 如需导出请访问 Supabase 控制台
          </span>
        </div>
      </main>
    </div>
  );
}
