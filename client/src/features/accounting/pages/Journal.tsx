/**
 * 记账凭证管理页面
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Receipt, CheckCircle, FileText, Loader2 } from "lucide-react";
import { JOURNAL_STATUS } from "../constants";
import { toast } from "sonner";

export function AccountingJournal() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "confirmed" | "posted">("all");

  // 获取凭证列表
  const { data: entries, isLoading } = useQuery({
    queryKey: ["accounting", "journal", statusFilter],
    queryFn: () =>
      trpcClient.accounting.listJournalEntries.query(
        statusFilter !== "all" ? { status: statusFilter as "draft" | "confirmed" | "posted" } : undefined
      ),
  });

  // 更新凭证状态
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "draft" | "confirmed" | "posted" }) => {
      return trpcClient.accounting.updateJournalStatus.mutate({ id, status });
    },
    onSuccess: () => {
      toast.success("状态更新成功");
      queryClient.invalidateQueries({ queryKey: ["accounting", "journal"] });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "confirmed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "posted":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  const getNextStatus = (current: string) => {
    switch (current) {
      case "draft":
        return "confirmed";
      case "confirmed":
        return "posted";
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div>
          <h1 className="text-3xl font-bold text-white">记账凭证</h1>
          <p className="text-slate-400 mt-1">管理日常收支记账凭证，支持批量确认和过账</p>
        </div>

        {/* 筛选器 */}
        <div className="flex gap-2">
          {(["all", "draft", "confirmed", "posted"] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className={
                statusFilter === status
                  ? "bg-slate-700 hover:bg-slate-600"
                  : "bg-slate-800 border-slate-700 text-slate-300"
              }
            >
              {status === "all" ? "全部" : JOURNAL_STATUS[status]}
            </Button>
          ))}
        </div>

        {/* 凭证列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : entries && entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map((entry) => (
              <Card key={entry.id} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-slate-700/50 rounded-lg">
                        <Receipt className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-mono text-sm">
                            {entry.voucher_number}
                          </span>
                          <Badge className={getStatusColor(entry.status)}>
                            {JOURNAL_STATUS[entry.status]}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-400 space-y-1">
                          <div>日期: {entry.entry_date}</div>
                          <div>摘要: {entry.description}</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        ¥{entry.debit_amount.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* 借贷明细 */}
                  <div className="grid grid-cols-2 gap-4 mt-4 p-3 bg-slate-700/30 rounded-lg">
                    <div>
                      <div className="text-xs text-slate-400 mb-1">借方</div>
                      <div className="text-sm text-white">{entry.debit_account}</div>
                      <div className="text-amber-400 font-medium">
                        ¥{entry.debit_amount.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 mb-1">贷方</div>
                      <div className="text-sm text-white">{entry.credit_account}</div>
                      <div className="text-emerald-400 font-medium">
                        ¥{entry.credit_amount.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700">
                    {getNextStatus(entry.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: entry.id,
                            status: getNextStatus(entry.status) as "draft" | "confirmed" | "posted",
                          })
                        }
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {getNextStatus(entry.status) === "confirmed" ? "确认" : "过账"}
                      </Button>
                    )}
                    {entry.invoice_id && (
                      <Badge
                        variant="outline"
                        className="bg-slate-500/20 border-slate-500/30 text-slate-400"
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        已关联发票 #{entry.invoice_id}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Receipt className="w-12 h-12 mx-auto text-slate-500 mb-4" />
              <p className="text-slate-400">暂无记账凭证</p>
              <p className="text-sm text-slate-500 mt-1">
                上传发票后将自动生成记账凭证
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
