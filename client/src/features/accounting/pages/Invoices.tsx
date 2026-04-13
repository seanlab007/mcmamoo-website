/**
 * 发票管理页面 - 发票上传、识别和列表
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Trash2, CheckCircle, Archive, Loader2 } from "lucide-react";
import { INVOICE_TYPES, INVOICE_STATUS, ACCOUNT_CATEGORIES } from "../constants";
import { toast } from "sonner";
import { format } from "date-fns";

export function AccountingInvoices() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "processed" | "archived">("all");

  // 获取发票列表
  const { data: invoices, isLoading } = useQuery({
    queryKey: ["accounting", "invoices", filter],
    queryFn: () =>
      trpcClient.accounting.listInvoices.query(
        filter !== "all" ? { status: filter as "pending" | "processed" | "archived" } : undefined
      ),
  });

  // 上传发票
  const uploadMutation = useMutation({
    mutationFn: async (imageData: string) => {
      return trpcClient.accounting.uploadInvoice.mutate({
        imageData,
        invoiceType: "fapiao",
      });
    },
    onSuccess: (result) => {
      toast.success(result.message || "发票上传成功");
      queryClient.invalidateQueries({ queryKey: ["accounting", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["accounting", "invoiceStats"] });
      queryClient.invalidateQueries({ queryKey: ["accounting", "financialReport"] });
    },
    onError: (error) => {
      toast.error(`上传失败: ${error.message}`);
    },
  });

  // 更新发票状态
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "pending" | "processed" | "archived" }) => {
      return trpcClient.accounting.updateInvoiceStatus.mutate({ id, status });
    },
    onSuccess: () => {
      toast.success("状态更新成功");
      queryClient.invalidateQueries({ queryKey: ["accounting", "invoices"] });
    },
  });

  // 删除发票
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return trpcClient.accounting.deleteInvoice.mutate({ id });
    },
    onSuccess: () => {
      toast.success("删除成功");
      queryClient.invalidateQueries({ queryKey: ["accounting", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["accounting", "invoiceStats"] });
    },
  });

  // 处理文件上传
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("请上传图片文件");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(",")[1];
        if (base64) {
          uploadMutation.mutate(base64);
        }
      };
      reader.readAsDataURL(file);

      // 清空 input
      event.target.value = "";
    },
    [uploadMutation]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "processed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "archived":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default:
        return "bg-slate-500/20 text-slate-400";
    }
  };

  const getCategoryColor = (category: string) => {
    const found = ACCOUNT_CATEGORIES.find((c) => c.category === category);
    return found?.color || "bg-gray-500/20 text-gray-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">发票管理</h1>
            <p className="text-slate-400 mt-1">上传发票图片，自动识别并生成记账凭证</p>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploadMutation.isPending}
            />
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-black"
              disabled={uploadMutation.isPending}
              asChild
            >
              <span>
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    识别中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    上传发票
                  </>
                )}
              </span>
            </Button>
          </label>
        </div>

        {/* 筛选器 */}
        <div className="flex gap-2">
          {(["all", "pending", "processed", "archived"] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(status)}
              className={
                filter === status
                  ? "bg-slate-700 hover:bg-slate-600"
                  : "bg-slate-800 border-slate-700 text-slate-300"
              }
            >
              {status === "all" ? "全部" : INVOICE_STATUS[status]}
            </Button>
          ))}
        </div>

        {/* 发票列表 */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : invoices && invoices.length > 0 ? (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-slate-700/50 rounded-lg">
                        <FileText className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{invoice.title}</span>
                          <Badge className={getStatusColor(invoice.status)}>
                            {INVOICE_STATUS[invoice.status]}
                          </Badge>
                        </div>
                        <div className="text-sm text-slate-400 space-y-1">
                          <div>
                            {INVOICE_TYPES[invoice.invoice_type]} · {invoice.date}
                          </div>
                          <div>税号: {invoice.tax_number || "无"}</div>
                          {invoice.items && invoice.items.length > 0 && (
                            <div className="text-slate-300">
                              {invoice.items.map((item: { description: string; amount: number }) => (
                                <span key={item.description}>
                                  {item.description}: ¥{item.amount.toFixed(2)} ·{" "}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-amber-400">
                        ¥{invoice.amount.toFixed(2)}
                      </div>
                      <div className="text-sm text-slate-400">
                        税额: ¥{invoice.tax_amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        识别置信度: {(invoice.ocr_confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700">
                    {invoice.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-emerald-500/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30"
                        onClick={() =>
                          updateStatusMutation.mutate({ id: invoice.id, status: "processed" })
                        }
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        标记已处理
                      </Button>
                    )}
                    {invoice.status === "processed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-slate-500/20 border-slate-500/30 text-slate-400 hover:bg-slate-500/30"
                        onClick={() =>
                          updateStatusMutation.mutate({ id: invoice.id, status: "archived" })
                        }
                      >
                        <Archive className="w-4 h-4 mr-1" />
                        归档
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 ml-auto"
                      onClick={() => {
                        if (confirm("确定要删除这张发票吗？")) {
                          deleteMutation.mutate(invoice.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-slate-500 mb-4" />
              <p className="text-slate-400">暂无发票记录</p>
              <p className="text-sm text-slate-500 mt-1">
                点击上方按钮上传发票图片进行识别
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
