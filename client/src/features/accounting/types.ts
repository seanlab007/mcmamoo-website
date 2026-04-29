/**
 * 代账功能类型定义
 */

// ─── 发票相关类型 ────────────────────────────────────────────────────────────

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_rate: number;
  tax_amount: number;
}

export interface Invoice {
  id: number;
  open_id: string;
  invoice_type: "fapiao" | "receipt";
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

export interface InvoiceStats {
  total: number;
  pending: number;
  processed: number;
  totalAmount: number;
  totalTax: number;
  thisMonth: number;
}

export interface UploadInvoiceResult {
  success: boolean;
  invoiceId?: number;
  category?: string;
  confidence?: number;
  taxAmount?: number;
  message?: string;
}

// ─── 记账凭证相关类型 ────────────────────────────────────────────────────────

export interface JournalEntry {
  id: number;
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

export interface FinancialReport {
  year: number;
  month: number;
  totalExpenses: number;
  categories: {
    管理费用: number;
    销售费用: number;
    财务费用: number;
    其他: number;
  };
  accountStats: Record<string, number>;
  entryCount: number;
}

// ─── 税务日历相关类型 ────────────────────────────────────────────────────────

export interface TaxEvent {
  id: number;
  open_id: string;
  tax_type: "vat" | "income_tax" | "personal_tax" | "other";
  event_name: string;
  deadline: string;
  description: string;
  status: "pending" | "completed" | "missed";
  created_at: string;
}

// ─── 会计科目建议 ────────────────────────────────────────────────────────────

export interface AccountingSuggestion {
  category: string;
  debit_account: string;
  credit_account: string;
  description: string;
}
