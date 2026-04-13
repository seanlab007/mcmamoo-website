/**
 * 代账功能常量定义
 */

// ─── 路由配置 ────────────────────────────────────────────────────────────────

export const ACCOUNTING_ROUTES = {
  /** 代账主页面 */
  DASHBOARD: "/accounting",
  /** 发票管理 */
  INVOICES: "/accounting/invoices",
  /** 记账凭证 */
  JOURNAL: "/accounting/journal",
  /** 税务日历 */
  TAX_CALENDAR: "/accounting/tax-calendar",
} as const;

// ─── 发票类型 ────────────────────────────────────────────────────────────────

export const INVOICE_TYPES = {
  fapiao: "增值税发票",
  receipt: "普通收据",
} as const;

export const INVOICE_STATUS = {
  pending: "待处理",
  processed: "已处理",
  archived: "已归档",
} as const;

// ─── 税务类型 ────────────────────────────────────────────────────────────────

export const TAX_TYPES = {
  vat: "增值税",
  income_tax: "企业所得税",
  personal_tax: "个人所得税",
  other: "其他税费",
} as const;

export const TAX_STATUS = {
  pending: "待申报",
  completed: "已完成",
  missed: "已逾期",
} as const;

// ─── 凭证状态 ────────────────────────────────────────────────────────────────

export const JOURNAL_STATUS = {
  draft: "草稿",
  confirmed: "已确认",
  posted: "已过账",
} as const;

// ─── 会计科目分类 ────────────────────────────────────────────────────────────

export const ACCOUNT_CATEGORIES = [
  { category: "办公用品", color: "bg-blue-100 text-blue-800" },
  { category: "餐饮发票", color: "bg-orange-100 text-orange-800" },
  { category: "差旅费", color: "bg-green-100 text-green-800" },
  { category: "交通费", color: "bg-teal-100 text-teal-800" },
  { category: "住宿费", color: "bg-purple-100 text-purple-800" },
  { category: "咨询服务", color: "bg-pink-100 text-pink-800" },
  { category: "软件服务", color: "bg-indigo-100 text-indigo-800" },
  { category: "广告宣传", color: "bg-yellow-100 text-yellow-800" },
  { category: "通讯费", color: "bg-cyan-100 text-cyan-800" },
  { category: "快递费", color: "bg-gray-100 text-gray-800" },
  { category: "水电气", color: "bg-lime-100 text-lime-800" },
  { category: "房租", color: "bg-rose-100 text-rose-800" },
  { category: "工资", color: "bg-amber-100 text-amber-800" },
  { category: "社保", color: "bg-emerald-100 text-emerald-800" },
  { category: "默认", color: "bg-gray-100 text-gray-800" },
] as const;
