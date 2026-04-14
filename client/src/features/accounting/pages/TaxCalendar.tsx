/**
 * 税务日历页面
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, CheckCircle, Loader2 } from "lucide-react";
import { TAX_TYPES, TAX_STATUS } from "../constants";
import { toast } from "sonner";

export function AccountingTaxCalendar() {
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // 获取税务日历
  const { data: events, isLoading } = useQuery({
    queryKey: ["accounting", "taxCalendar", selectedMonth],
    queryFn: () =>
      trpc.accounting.getTaxCalendar.query({
        month: selectedMonth,
        year: new Date().getFullYear(),
      }),
  });

  // 添加税务事件
  const addEventMutation = useMutation({
    mutationFn: async (data: {
      taxType: "vat" | "income_tax" | "personal_tax" | "other";
      eventName: string;
      deadline: string;
      description?: string;
    }) => {
      return trpc.accounting.addTaxEvent.mutate(data);
    },
    onSuccess: () => {
      toast.success("添加成功");
      queryClient.invalidateQueries({ queryKey: ["accounting", "taxCalendar"] });
    },
  });

  // 完成税务事件
  const completeEventMutation = useMutation({
    mutationFn: async (id: number) => {
      return trpc.accounting.completeTaxEvent.mutate({ id });
    },
    onSuccess: () => {
      toast.success("已标记为完成");
      queryClient.invalidateQueries({ queryKey: ["accounting", "taxCalendar"] });
    },
  });

  const getStatusColor = (status: string, deadline: string) => {
    if (status === "completed") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (new Date(deadline) < new Date()) return "bg-red-500/20 text-red-400 border-red-500/30";
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  };

  const getStatusBadge = (status: string, deadline: string) => {
    if (status === "completed") return "已完成";
    if (new Date(deadline) < new Date()) return "已逾期";
    return "待申报";
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">税务日历</h1>
            <p className="text-slate-400 mt-1">
              {new Date().getFullYear()} 年度税务申报时间表
            </p>
          </div>
        </div>

        {/* 月份选择器 */}
        <div className="flex gap-2 flex-wrap">
          {months.map((month) => (
            <Button
              key={month}
              variant={selectedMonth === month ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMonth(month)}
              className={
                selectedMonth === month
                  ? "bg-slate-700 hover:bg-slate-600"
                  : "bg-slate-800 border-slate-700 text-slate-300"
              }
            >
              {month}月
            </Button>
          ))}
        </div>

        {/* 统计 */}
        {events && (
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-amber-400">
                  {events.filter((e) => e.status === "pending" && new Date(e.deadline) >= new Date()).length}
                </div>
                <div className="text-sm text-slate-400">待申报</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-emerald-400">
                  {events.filter((e) => e.status === "completed").length}
                </div>
                <div className="text-sm text-slate-400">已完成</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-red-400">
                  {events.filter((e) => e.status === "pending" && new Date(e.deadline) < new Date()).length}
                </div>
                <div className="text-sm text-slate-400">已逾期</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 税务事项列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : events && events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-slate-700/50 rounded-lg">
                        <Calendar className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{event.event_name}</span>
                          <Badge
                            className={getStatusColor(event.status, event.deadline)}
                          >
                            {getStatusBadge(event.status, event.deadline)}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-400 space-y-1">
                          <div>类型: {TAX_TYPES[event.tax_type]}</div>
                          <div>截止日期: {event.deadline}</div>
                          {event.description && <div>说明: {event.description}</div>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {event.status !== "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30"
                          onClick={() => completeEventMutation.mutate(event.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          完成
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-slate-500 mb-4" />
              <p className="text-slate-400">{selectedMonth}月暂无税务事项</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
