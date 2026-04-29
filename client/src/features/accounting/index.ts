/**
 * 代账功能入口 - 统一导出
 */

export { AccountingDashboard } from "./pages/Dashboard";
export { AccountingInvoices } from "./pages/Invoices";
export { AccountingJournal } from "./pages/Journal";
export { AccountingTaxCalendar } from "./pages/TaxCalendar";

export { ACCOUNTING_ROUTES, INVOICE_TYPES, INVOICE_STATUS, TAX_TYPES, ACCOUNT_CATEGORIES } from "./constants";

export type {
  Invoice,
  InvoiceItem,
  InvoiceStats,
  JournalEntry,
  FinancialReport,
  TaxEvent,
  AccountingSuggestion,
  UploadInvoiceResult,
} from "./types";
