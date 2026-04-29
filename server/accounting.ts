/**
 * 代账服务路由 — tRPC
 *
 * 提供发票OCR识别、智能记账、税务日历、财务报表等代账功能。
 */

import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { dbFetch } from "./aiNodes";
import { notifyOwner } from "./_core/notification";
import { getSupabaseClient } from "./supabase";
import type { Storage } from "ai";
import { v4 as uuidv4 } from "uuid";

// ─── 类型定义 ────────────────────────────────────────────────────────────────

interface InvoiceRecord {
  id?: number;
  open_id: string;
  invoice_type: string; // "fapiao" | " receipt"
  amount: number;
  tax_amount: number;
  title: string;
  tax_number: string;
  date: string;
  items: InvoiceItem[];
  ocr_confidence: number;
  status: "pending" | "processed" | "archived";
  created_at: string;
  updated_at?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_rate: number;
  tax_amount: number;
}

interface JournalEntry {
  id?: number;
  open_id: string;
  invoice_id?: number;
  voucher_number: string;
  entry_date: string;
  description: string;
  debit_account: string;
  debit_amount: number;
  credit_account: string;
  credit_amount: number;
  status: "draft" | "confirmed" | "posted";
  created_at: string;
}

interface TaxCalendarEvent {
  id?: number;
  open_id: string;
  tax_type: string; // "vat" | "income_tax" | "personal_tax" | "other"
  event_name: string;
  deadline: string;
  description: string;
  status: "pending" | "completed" | "missed";
  created_at: string;
}

// ─── 会计科目规则 ────────────────────────────────────────────────────────────

const ACCOUNTING_RULES: Record<string, { debit_account: string; credit_account: string; description: string }> = {
  "办公用品": { debit_account: "6602 管理费用", credit_account: "1002 银行存款", description: "办公费用报销" },
  "餐饮发票": { debit_account: "6602 管理费用-业务招待费", credit_account: "1002 银行存款", description: "业务招待费" },
  "差旅费": { debit_account: "6602 管理费用-差旅费", credit_account: "1002 银行存款", description: "员工差旅报销" },
  "交通费": { debit_account: "6602 管理费用-交通费", credit_account: "1002 银行存款", description: "交通费用报销" },
  "住宿费": { debit_account: "6602 管理费用-差旅费", credit_account: "1002 银行存款", description: "出差住宿费" },
  "咨询服务": { debit_account: "6602 管理费用-咨询费", credit_account: "1002 银行存款", description: "咨询服务费" },
  "软件服务": { debit_account: "6602 管理费用-技术费", credit_account: "1002 银行存款", description: "软件服务费" },
  "广告宣传": { debit_account: "6602 销售费用-广告费", credit_account: "1002 银行存款", description: "广告宣传费" },
  "通讯费": { debit_account: "6602 管理费用-通讯费", credit_account: "1002 银行存款", description: "通讯费用" },
  "快递费": { debit_account: "6602 管理费用-快递费", credit_account: "1002 银行存款", description: "快递邮寄费" },
  "水电气": { debit_account: "6602 管理费用-水电费", credit_account: "1002 银行存款", description: "水电气费用" },
  "房租": { debit_account: "6602 管理费用-房租", credit_account: "1002 银行存款", description: "房屋租金" },
  "工资": { debit_account: "6602 管理费用-工资", credit_account: "1002 银行存款", description: "员工工资" },
  "社保": { debit_account: "6602 管理费用-社保", credit_account: "1002 银行存款", description: "社保公积金" },
  "默认": { debit_account: "6602 管理费用-其他", credit_account: "1002 银行存款", description: "其他费用" },
};

// ─── 发票分类规则 ────────────────────────────────────────────────────────────

function classifyInvoice(text: string): { category: string; confidence: number } {
  const patterns = [
    { pattern: /办公|文具|纸张|打印/i, category: "办公用品", confidence: 0.9 },
    { pattern: /餐饮|餐厅|酒店|饭店/i, category: "餐饮发票", confidence: 0.85 },
    { pattern: /差旅|机票|火车|船票/i, category: "差旅费", confidence: 0.9 },
    { pattern: /交通|打车|滴滴|地铁|公交/i, category: "交通费", confidence: 0.85 },
    { pattern: /住宿|宾馆|酒店/i, category: "住宿费", confidence: 0.9 },
    { pattern: /咨询|顾问|代理/i, category: "咨询服务", confidence: 0.85 },
    { pattern: /软件|saas|云服务/i, category: "软件服务", confidence: 0.9 },
    { pattern: /广告|宣传|推广/i, category: "广告宣传", confidence: 0.85 },
    { pattern: /电话|电信|移动|联通/i, category: "通讯费", confidence: 0.9 },
    { pattern: /快递|邮寄|物流/i, category: "快递费", confidence: 0.85 },
    { pattern: /水电|燃气|物业/i, category: "水电气", confidence: 0.9 },
    { pattern: /房租|租赁|租金/i, category: "房租", confidence: 0.95 },
    { pattern: /工资|薪酬|奖金/i, category: "工资", confidence: 0.95 },
    { pattern: /社保|公积金|医保/i, category: "社保", confidence: 0.95 },
  ];

  for (const { pattern, category, confidence } of patterns) {
    if (pattern.test(text)) {
      return { category, confidence };
    }
  }

  return { category: "默认", confidence: 0.5 };
}

// ─── 路由定义 ────────────────────────────────────────────────────────────────

export const accountingRouter = router({
  // ─── 发票管理 ─────────────────────────────────────────────────────────────

  /**
   * 上传发票图片并进行OCR识别
   */
  uploadInvoice: protectedProcedure
    .input(
      z.object({
        imageData: z.string(), // base64 encoded image
        invoiceType: z.enum(["fapiao", "receipt"]).optional().default("fapiao"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const openId = ctx.user.openId;

      // 调用OCR识别 (模拟阿里云OCR)
      // 实际生产环境需要接入真实的OCR API
      const ocrResult = await simulateOCR(input.imageData);

      // 根据发票内容自动分类
      const { category, confidence } = classifyInvoice(ocrResult.text);

      // 计算税额
      const taxRate = ocrResult.taxRate || 0.06; // 默认6%增值税
      const taxAmount = Math.round(ocrResult.amount * taxRate * 100) / 100;

      // 保存发票记录
      const invoiceData = {
        open_id: openId,
        invoice_type: input.invoiceType,
        amount: ocrResult.amount,
        tax_amount: taxAmount,
        title: ocrResult.title || "未开票",
        tax_number: ocrResult.taxNumber || "",
        date: ocrResult.date || new Date().toISOString().split("T")[0],
        items: JSON.stringify(ocrResult.items || []),
        ocr_confidence: confidence,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      const r = await dbFetch("/invoices", {
        method: "POST",
        body: JSON.stringify(invoiceData),
      }, "return=representation");

      const rows = r.data as Record<string, unknown>[] | null;
      const invoiceId = rows?.[0]?.id as number | undefined;

      // 自动生成记账凭证
      if (invoiceId && confidence > 0.6) {
        const rule = ACCOUNTING_RULES[category] || ACCOUNTING_RULES["默认"];
        const voucherNumber = `记-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(Date.now()).slice(-6)}`;

        await dbFetch("/journal_entries", {
          method: "POST",
          body: JSON.stringify({
            open_id: openId,
            invoice_id: invoiceId,
            voucher_number: voucherNumber,
            entry_date: invoiceData.date,
            description: `${rule.description} - ${ocrResult.title}`,
            debit_account: rule.debit_account,
            debit_amount: ocrResult.amount,
            credit_account: rule.credit_account,
            credit_amount: ocrResult.amount,
            status: "draft",
            created_at: new Date().toISOString(),
          }),
        });
      }

      return {
        success: true,
        invoiceId,
        category,
        confidence,
        taxAmount,
        message: `发票识别完成，自动归类为"${category}"`,
      };
    }),

  /**
   * 获取发票列表
   */
  listInvoices: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "processed", "archived"]).optional(),
        limit: z.number().optional().default(50),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const openId = ctx.user.openId;
      let query = `/invoices?open_id=eq.${encodeURIComponent(openId)}&order=created_at.desc`;

      if (input?.status) {
        query += `&status=eq.${input.status}`;
      }
      if (input?.limit) {
        query += `&limit=${input.limit}`;
      }

      const r = await dbFetch(query);
      const invoices = (r.data as Record<string, unknown>[]) ?? [];

      // 解析 items JSON 字段
      return invoices.map((inv) => ({
        ...inv,
        items: typeof inv.items === "string" ? JSON.parse(inv.items as string) : inv.items,
      }));
    }),

  /**
   * 获取发票统计
   */
  getInvoiceStats: protectedProcedure.query(async ({ ctx }) => {
    const openId = ctx.user.openId;

    const r = await dbFetch(`/invoices?open_id=eq.${encodeURIComponent(openId)}`);
    const invoices = (r.data as InvoiceRecord[]) ?? [];

    const stats = {
      total: invoices.length,
      pending: invoices.filter((i) => i.status === "pending").length,
      processed: invoices.filter((i) => i.status === "processed").length,
      totalAmount: invoices.reduce((sum, i) => sum + (i.amount || 0), 0),
      totalTax: invoices.reduce((sum, i) => sum + (i.tax_amount || 0), 0),
      thisMonth: invoices
        .filter((i) => {
          const invDate = new Date(i.date);
          const now = new Date();
          return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, i) => sum + (i.amount || 0), 0),
    };

    return stats;
  }),

  /**
   * 更新发票状态
   */
  updateInvoiceStatus: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["pending", "processed", "archived"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const openId = ctx.user.openId;

      await dbFetch(
        `/invoices?id=eq.${input.id}&open_id=eq.${encodeURIComponent(openId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: input.status,
            updated_at: new Date().toISOString(),
          }),
        }
      );

      return { success: true };
    }),

  /**
   * 删除发票
   */
  deleteInvoice: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const openId = ctx.user.openId;

      await dbFetch(
        `/invoices?id=eq.${input.id}&open_id=eq.${encodeURIComponent(openId)}`,
        { method: "DELETE" }
      );

      return { success: true };
    }),

  // ─── 记账凭证 ─────────────────────────────────────────────────────────────

  /**
   * 获取记账凭证列表
   */
  listJournalEntries: protectedProcedure
    .input(
      z.object({
        status: z.enum(["draft", "confirmed", "posted"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        limit: z.number().optional().default(100),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const openId = ctx.user.openId;
      let query = `/journal_entries?open_id=eq.${encodeURIComponent(openId)}&order=entry_date.desc`;

      if (input?.status) {
        query += `&status=eq.${input.status}`;
      }
      if (input?.startDate) {
        query += `&entry_date=gte.${input.startDate}`;
      }
      if (input?.endDate) {
        query += `&entry_date=lte.${input.endDate}`;
      }
      if (input?.limit) {
        query += `&limit=${input.limit}`;
      }

      const r = await dbFetch(query);
      return (r.data as JournalEntry[]) ?? [];
    }),

  /**
   * 更新凭证状态
   */
  updateJournalStatus: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["draft", "confirmed", "posted"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const openId = ctx.user.openId;

      await dbFetch(
        `/journal_entries?id=eq.${input.id}&open_id=eq.${encodeURIComponent(openId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: input.status,
          }),
        }
      );

      return { success: true };
    }),

  /**
   * 获取财务报表
   */
  getFinancialReport: protectedProcedure
    .input(
      z.object({
        year: z.number().int().min(2020).max(2100).optional(),
        month: z.number().int().min(1).max(12).optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const openId = ctx.user.openId;
      const now = new Date();
      const targetYear = input?.year || now.getFullYear();
      const targetMonth = input?.month || now.getMonth() + 1;

      // 获取当月凭证
      const startDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-01`;
      const endDate = `${targetYear}-${String(targetMonth).padStart(2, "0")}-31`;

      const r = await dbFetch(
        `/journal_entries?open_id=eq.${encodeURIComponent(openId)}&entry_date=gte.${startDate}&entry_date=lte.${endDate}&status=eq.posted`
      );
      const entries = (r.data as JournalEntry[]) ?? [];

      // 按科目分组统计
      const accountStats: Record<string, number> = {};
      for (const entry of entries) {
        accountStats[entry.debit_account] = (accountStats[entry.debit_account] || 0) + entry.debit_amount;
      }

      // 计算总计
      const totalExpenses = entries.reduce((sum, e) => sum + e.debit_amount, 0);

      // 分类统计
      const categories = {
        管理费用: Object.entries(accountStats)
          .filter(([k]) => k.includes("管理费用"))
          .reduce((sum, [, v]) => sum + v, 0),
        销售费用: Object.entries(accountStats)
          .filter(([k]) => k.includes("销售费用"))
          .reduce((sum, [, v]) => sum + v, 0),
        财务费用: Object.entries(accountStats)
          .filter(([k]) => k.includes("财务费用"))
          .reduce((sum, [, v]) => sum + v, 0),
        其他: Object.entries(accountStats)
          .filter(([k]) => !k.includes("管理费用") && !k.includes("销售费用") && !k.includes("财务费用"))
          .reduce((sum, [, v]) => sum + v, 0),
      };

      return {
        year: targetYear,
        month: targetMonth,
        totalExpenses,
        categories,
        accountStats,
        entryCount: entries.length,
      };
    }),

  // ─── 税务日历 ─────────────────────────────────────────────────────────────

  /**
   * 获取税务日历
   */
  getTaxCalendar: protectedProcedure
    .input(
      z.object({
        year: z.number().int().min(2020).max(2100).optional(),
        month: z.number().int().min(1).max(12).optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const openId = ctx.user.openId;
      const now = new Date();
      const targetYear = input?.year || now.getFullYear();

      // 获取用户自定义事件
      let query = `/tax_calendar?open_id=eq.${encodeURIComponent(openId)}&order=deadline.asc`;
      if (input?.month) {
        const startDate = `${targetYear}-${String(input.month).padStart(2, "0")}-01`;
        const endDate = `${targetYear}-${String(input.month).padStart(2, "0")}-31`;
        query += `&deadline=gte.${startDate}&deadline=lte.${endDate}`;
      }

      const r = await dbFetch(query);
      const userEvents = (r.data as TaxCalendarEvent[]) ?? [];

      // 预设税务日历
      const presetEvents = generatePresetTaxEvents(targetYear, openId);

      return [...presetEvents, ...userEvents].sort(
        (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );
    }),

  /**
   * 添加税务事件
   */
  addTaxEvent: protectedProcedure
    .input(
      z.object({
        taxType: z.enum(["vat", "income_tax", "personal_tax", "other"]),
        eventName: z.string().min(1).max(200),
        deadline: z.string(),
        description: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const openId = ctx.user.openId;

      const r = await dbFetch("/tax_calendar", {
        method: "POST",
        body: JSON.stringify({
          open_id: openId,
          tax_type: input.taxType,
          event_name: input.eventName,
          deadline: input.deadline,
          description: input.description || "",
          status: "pending",
          created_at: new Date().toISOString(),
        }),
      }, "return=representation");

      return { success: true, id: (r.data as Record<string, unknown>[])?.[0]?.id };
    }),

  /**
   * 完成税务事件
   */
  completeTaxEvent: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const openId = ctx.user.openId;

      await dbFetch(
        `/tax_calendar?id=eq.${input.id}&open_id=eq.${encodeURIComponent(openId)}`,
        { method: "PATCH", body: JSON.stringify({ status: "completed" }) }
      );

      return { success: true };
    }),

  // ─── 智能记账建议 ─────────────────────────────────────────────────────────

  /**
   * 获取智能记账建议
   */
  getAccountingSuggestions: protectedProcedure
    .input(
      z.object({
        keyword: z.string().min(1).max(100),
      })
    )
    .query(async ({ input }) => {
      const keyword = input.keyword.toLowerCase();

      // 匹配相关规则
      const matches = Object.entries(ACCOUNTING_RULES).filter(([key]) =>
        key.includes(input.keyword) || keyword.includes(key.toLowerCase())
      );

      if (matches.length > 0) {
        return matches.map(([_, rule]) => ({
          category: _,
          ...rule,
        }));
      }

      // 返回默认建议
      return [
        {
          category: "默认",
          ...ACCOUNTING_RULES["默认"],
        },
      ];
    }),

  /**
   * 获取会计科目列表
   */
  getAccountCategories: publicProcedure.query(() => {
    return Object.entries(ACCOUNTING_RULES).map(([category, rule]) => ({
      category,
      ...rule,
    }));
  }),
});

// ─── 辅助函数 ────────────────────────────────────────────────────────────────

/**
 * 模拟OCR识别 (实际生产环境需接入阿里云/腾讯云OCR)
 */
async function simulateOCR(imageData: string): Promise<{
  amount: number;
  taxRate: number;
  title: string;
  taxNumber: string;
  date: string;
  text: string;
  items: InvoiceItem[];
}> {
  // 模拟处理延迟
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 随机生成发票数据用于演示
  const amount = Math.round((Math.random() * 5000 + 100) * 100) / 100;
  const taxRates = [0.03, 0.06, 0.09, 0.13];

  return {
    amount,
    taxRate: taxRates[Math.floor(Math.random() * taxRates.length)],
    title: "上海示例科技有限公司",
    taxNumber: `91310000MA1FL${String(Math.floor(Math.random() * 100000)).padStart(6, "0")}`,
    date: new Date().toISOString().split("T")[0],
    text: "办公用品采购",
    items: [
      {
        description: "办公用品",
        quantity: 1,
        unit_price: amount,
        amount,
        tax_rate: taxRates[Math.floor(Math.random() * taxRates.length)],
        tax_amount: Math.round(amount * 0.06 * 100) / 100,
      },
    ],
  };
}

/**
 * 生成预设税务日历
 */
function generatePresetTaxEvents(year: number, openId: string): TaxCalendarEvent[] {
  const events: TaxCalendarEvent[] = [];

  // 增值税申报期 (每月15日，节假日顺延)
  for (let month = 1; month <= 12; month++) {
    events.push({
      id: -month,
      open_id: openId,
      tax_type: "vat",
      event_name: `${month}月增值税申报`,
      deadline: `${year}-${String(month).padStart(2, "0")}-15`,
      description: `增值税及附加税费申报截止日（季度内月度申报）`,
      status: new Date() > new Date(`${year}-${String(month).padStart(2, "0")}-15`) ? "completed" : "pending",
      created_at: new Date().toISOString(),
    });
  }

  // 企业所得税 (季度预缴：4月15日、7月15日、10月15日、次年1月15日)
  const quarters = [
    { month: 4, label: "第一季度" },
    { month: 7, label: "第二季度" },
    { month: 10, label: "第三季度" },
    { month: 1, label: "第四季度" },
  ];

  quarters.forEach((q, i) => {
    const actualYear = q.month === 1 ? year + 1 : year;
    events.push({
      id: -(100 + i),
      open_id: openId,
      tax_type: "income_tax",
      event_name: `${q.label}企业所得税预缴`,
      deadline: `${actualYear}-${String(q.month).padStart(2, "0")}-15`,
      description: `企业所得税季度预缴申报截止日`,
      status: new Date() > new Date(`${actualYear}-${String(q.month).padStart(2, "0")}-15`) ? "completed" : "pending",
      created_at: new Date().toISOString(),
    });
  });

  // 个税申报 (每月7日)
  for (let month = 1; month <= 12; month++) {
    events.push({
      id: -(200 + month),
      open_id: openId,
      tax_type: "personal_tax",
      event_name: `${month}月个人所得税申报`,
      deadline: `${year}-${String(month).padStart(2, "0")}-07`,
      description: `个人所得税代扣代缴申报截止日`,
      status: new Date() > new Date(`${year}-${String(month).padStart(2, "0")}-07`) ? "completed" : "pending",
      created_at: new Date().toISOString(),
    });
  }

  return events;
}
