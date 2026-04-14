/**
 * 代账仪表盘 - 显示统计概览和快捷入口
 */

import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Receipt, Calendar, BarChart3, Plus, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { ACCOUNTING_ROUTES, INVOICE_STATUS, TAX_STATUS } from "../constants";
import { Skeleton } from "@/components/ui/skeleton";

export function AccountingDashboard() {
  // 获取发票统计
  const { data: invoiceStats, isLoading: statsLoading } = useQuery({
    queryKey: ["accounting", "invoiceStats"],
    queryFn: () => trpc.accounting.getInvoiceStats.query(),
  });

  // 获取即将到期的税务事件
  const { data: upcomingTaxEvents } = useQuery({
    queryKey: ["accounting", "taxCalendar", "upcoming"],
    queryFn: () =>
      trpc.accounting.getTaxCalendar.query({
        month: new Date().getMonth() + 1,
      }),
  });

  // 获取财务报表
  const { data: financialReport } = useQuery({
    queryKey: ["accounting", "financialReport"],
    queryFn: () =>
      trpc.accounting.getFinancialReport.query({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      }),
  });

  const currentMonth = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">账小秘 - 智能代账</h1>
            <p className="text-slate-400 mt-1">{currentMonth} 财务概览</p>
          </div>
          <Link href={ACCOUNTING_ROUTES.INVOICES}>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black">
              <Plus className="w-4 h-4 mr-2" />
              上传发票
            </Button>
          </Link>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 发票统计 */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-300 text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                发票总数
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-3xl font-bold text-white">{invoiceStats?.total || 0}</div>
              )}
              <p className="text-sm text-slate-400 mt-1">
                本月 {invoiceStats?.thisMonth?.toFixed(2) || 0} 元
              </p>
            </CardContent>
          </Card>

          {/* 待处理 */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-300 text-sm font-medium flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                待处理发票
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-400">{invoiceStats?.pending || 0}</div>
              <p className="text-sm text-slate-400 mt-1">
                {INVOICE_STATUS.pending} · {invoiceStats?.processed || 0} 已处理
              </p>
            </CardContent>
          </Card>

          {/* 税额合计 */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-300 text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                可抵扣税额
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">
                ¥{(invoiceStats?.totalTax || 0).toFixed(2)}
              </div>
              <p className="text-sm text-slate-400 mt-1">
                共 {invoiceStats?.total || 0} 张发票
              </p>
            </CardContent>
          </Card>

          {/* 税务申报 */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-300 text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                待申报事项
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">
                {upcomingTaxEvents?.filter((e) => e.status === "pending").length || 0}
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {TAX_STATUS.pending}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 快捷入口和内容区 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 快捷功能 */}
          <Card className="bg-slate-800/50 border-slate-700 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white">快捷功能</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={ACCOUNTING_ROUTES.INVOICES}>
                <Button variant="outline" className="w-full justify-start bg-slate-700/50 border-slate-600 hover:bg-slate-700">
                  <FileText className="w-4 h-4 mr-3 text-amber-400" />
                  <span className="text-slate-200">发票上传识别</span>
                  <ArrowRight className="w-4 h-4 ml-auto text-slate-400" />
                </Button>
              </Link>
              <Link href={ACCOUNTING_ROUTES.JOURNAL}>
                <Button variant="outline" className="w-full justify-start bg-slate-700/50 border-slate-600 hover:bg-slate-700">
                  <Receipt className="w-4 h-4 mr-3 text-blue-400" />
                  <span className="text-slate-200">记账凭证管理</span>
                  <ArrowRight className="w-4 h-4 ml-auto text-slate-400" />
                </Button>
              </Link>
              <Link href={ACCOUNTING_ROUTES.TAX_CALENDAR}>
                <Button variant="outline" className="w-full justify-start bg-slate-700/50 border-slate-600 hover:bg-slate-700">
                  <Calendar className="w-4 h-4 mr-3 text-emerald-400" />
                  <span className="text-slate-200">税务日历</span>
                  <ArrowRight className="w-4 h-4 ml-auto text-slate-400" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* 费用分类 */}
          <Card className="bg-slate-800/50 border-slate-700 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">
                {currentMonth} 费用分类
                <span className="text-sm font-normal text-slate-400 ml-2">
                  共 {financialReport?.entryCount || 0} 笔凭证
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {financialReport ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="text-blue-400 text-sm">管理费用</div>
                    <div className="text-2xl font-bold text-white mt-1">
                      ¥{financialReport.categories.管理费用.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                    <div className="text-orange-400 text-sm">销售费用</div>
                    <div className="text-2xl font-bold text-white mt-1">
                      ¥{financialReport.categories.销售费用.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <div className="text-purple-400 text-sm">财务费用</div>
                    <div className="text-2xl font-bold text-white mt-1">
                      ¥{financialReport.categories.财务费用.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-4 bg-slate-500/10 rounded-lg border border-slate-500/20">
                    <div className="text-slate-400 text-sm">其他费用</div>
                    <div className="text-2xl font-bold text-white mt-1">
                      ¥{financialReport.categories.其他.toFixed(2)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 py-8">
                  暂无本月费用数据
                </div>
              )}

              {/* 合计 */}
              {financialReport && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">本月支出合计</span>
                    <span className="text-2xl font-bold text-amber-400">
                      ¥{financialReport.totalExpenses.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 近期税务事项 */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              近期税务事项
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTaxEvents && upcomingTaxEvents.length > 0 ? (
              <div className="space-y-3">
                {upcomingTaxEvents.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          event.status === "completed"
                            ? "bg-emerald-400"
                            : new Date(event.deadline) < new Date()
                            ? "bg-red-400"
                            : "bg-amber-400"
                        }`}
                      />
                      <div>
                        <div className="text-slate-200 font-medium">{event.event_name}</div>
                        <div className="text-sm text-slate-400">{event.description}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-300">{event.deadline}</div>
                      <div
                        className={`text-xs ${
                          event.status === "completed"
                            ? "text-emerald-400"
                            : new Date(event.deadline) < new Date()
                            ? "text-red-400"
                            : "text-amber-400"
                        }`}
                      >
                        {event.status === "completed"
                          ? "已完成"
                          : new Date(event.deadline) < new Date()
                          ? "已逾期"
                          : "待申报"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-8">
                暂无近期税务事项
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
