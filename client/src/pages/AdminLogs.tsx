import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity } from "lucide-react";
import { Link } from "wouter";

const STATUS_COLORS: Record<string, string> = {
  success: "bg-green-500/20 text-green-400 border-green-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  timeout: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

export default function AdminLogs() {
  const { user } = useAuth();
  const { data: logs, isLoading, refetch } = trpc.logs.list.useQuery({ limit: 200 });
  const { data: nodes } = trpc.nodes.list.useQuery();

  if (user?.role !== "admin") return <div className="flex h-screen items-center justify-center text-muted-foreground">无权访问</div>;

  const nodeMap = Object.fromEntries((nodes || []).map(n => [n.id, n.name]));

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <Link href="/maoai" className="text-muted-foreground hover:text-foreground text-sm">← 返回聊天</Link>
          <span className="text-muted-foreground">/</span>
          <Link href="/admin/nodes" className="text-muted-foreground hover:text-foreground text-sm">节点管理</Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-base font-semibold">调用日志</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>刷新</Button>
      </header>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : logs && logs.length > 0 ? (
          <div className="max-w-5xl">
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">时间</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">节点</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">模型</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">状态</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">延迟</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">Token</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">错误</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: any) => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-xs">{nodeMap[log.nodeId] || `#${log.nodeId}`}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{log.model || "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_COLORS[log.status] || "bg-gray-500/20 text-gray-400"}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-right text-muted-foreground">
                        {log.latencyMs ? `${log.latencyMs}ms` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-right text-muted-foreground">
                        {log.tokens ? log.tokens.toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-red-400 max-w-xs truncate">
                        {log.error || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
              <Activity className="size-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">暂无调用日志</p>
              <p className="text-sm text-muted-foreground mt-1">AI 节点被调用后，日志将显示在这里</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
