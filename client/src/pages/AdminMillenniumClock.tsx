/*
 * AdminMillenniumClock — 万年钟预约管理员页面
 * 仅管理员可访问，展示所有预约数据
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

const INTENT_LABELS: Record<string, string> = {
  exhibition: "参观体验",
  purchase: "购买意向",
  forum: "论坛合作",
  media: "媒体报道",
  investment: "战略投资",
  other: "其他合作",
};

export default function AdminMillenniumClock() {
  const { user, loading } = useAuth();
  const { data: reservations, isLoading, refetch } = trpc.millenniumClock.getReservations.useQuery();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center">
        <div className="text-[#4FC3F7]/60 font-mono text-sm tracking-widest animate-pulse">LOADING...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#020408] flex flex-col items-center justify-center gap-6">
        <div className="text-red-400 font-mono text-sm tracking-widest">ACCESS DENIED — 仅管理员可访问</div>
        <Link href="/">
          <a className="text-[#4FC3F7]/60 hover:text-[#4FC3F7] text-sm font-mono transition-colors">← 返回首页</a>
        </Link>
      </div>
    );
  }

  const rows = (reservations as Record<string, unknown>[] | undefined) ?? [];

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
            <span className="text-[#4FC3F7] text-xs font-mono tracking-[0.3em] uppercase">万年钟预约管理</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/30 text-xs font-mono">共 {rows.length} 条预约</span>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 border border-[#4FC3F7]/30 text-[#4FC3F7] text-xs font-mono hover:bg-[#4FC3F7]/10 transition-colors"
            >
              刷新
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "总预约数", value: rows.length, color: "#4FC3F7" },
            { label: "待处理", value: rows.filter(r => r.status === "pending").length, color: "#C9A84C" },
            { label: "参观意向", value: rows.filter(r => r.intent === "exhibition").length, color: "#8B5CF6" },
            { label: "投资意向", value: rows.filter(r => r.intent === "investment").length, color: "#10B981" },
          ].map((stat) => (
            <div key={stat.label} className="border border-white/5 bg-white/2 p-4">
              <div className="text-white/30 text-xs font-mono tracking-widest uppercase mb-2">{stat.label}</div>
              <div className="font-bold text-3xl" style={{ color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-20 text-white/30 font-mono text-sm animate-pulse">加载预约数据中...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-20 border border-white/5">
            <div className="text-white/20 font-mono text-sm">暂无预约数据</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["ID", "姓名", "机构", "邮箱", "电话", "意向类型", "说明", "状态", "提交时间"].map(h => (
                    <th key={h} className="text-left text-white/30 text-xs font-mono tracking-widest uppercase pb-3 pr-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={String(r.id ?? i)} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="py-3 pr-4 text-white/30 font-mono text-xs">{String(r.id ?? "-")}</td>
                    <td className="py-3 pr-4 text-white font-medium whitespace-nowrap">{String(r.name ?? "-")}</td>
                    <td className="py-3 pr-4 text-white/60 whitespace-nowrap">{String(r.company ?? "-")}</td>
                    <td className="py-3 pr-4 text-[#4FC3F7]/80 font-mono text-xs whitespace-nowrap">{String(r.email ?? "-")}</td>
                    <td className="py-3 pr-4 text-white/50 font-mono text-xs whitespace-nowrap">{String(r.phone ?? "-")}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-[#4FC3F7]/10 text-[#4FC3F7] text-xs font-mono border border-[#4FC3F7]/20">
                        {INTENT_LABELS[String(r.intent ?? "")] ?? String(r.intent ?? "-")}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-white/40 text-xs max-w-[200px] truncate">{String(r.message ?? "-")}</td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-xs font-mono border ${
                        r.status === "pending"
                          ? "bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20"
                          : "bg-green-500/10 text-green-400 border-green-500/20"
                      }`}>
                        {r.status === "pending" ? "待处理" : "已处理"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-white/30 font-mono text-xs whitespace-nowrap">
                      {r.createdAt ? new Date(String(r.createdAt)).toLocaleString("zh-CN") : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
