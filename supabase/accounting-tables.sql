-- =====================================================
-- 代账功能数据库表 - Supabase PostgreSQL
-- 执行位置: Supabase Dashboard > SQL Editor
-- =====================================================

-- ─── 发票表 ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.invoices (
  id BIGSERIAL PRIMARY KEY,
  open_id TEXT NOT NULL,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('fapiao', 'receipt')),
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  title TEXT,
  tax_number TEXT,
  date TEXT,
  items JSONB DEFAULT '[]',
  ocr_confidence NUMERIC(3, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_invoices_open_id ON public.invoices(open_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);

-- RLS 策略
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能查看自己的发票"
  ON public.invoices FOR SELECT
  USING (open_id = current_setting('app.current_open_id', TRUE)::TEXT);

CREATE POLICY "用户只能插入自己的发票"
  ON public.invoices FOR INSERT
  WITH CHECK (open_id = current_setting('app.current_open_id', TRUE)::TEXT);

CREATE POLICY "用户只能更新自己的发票"
  ON public.invoices FOR UPDATE
  USING (open_id = current_setting('app.current_open_id', TRUE)::TEXT);

CREATE POLICY "用户只能删除自己的发票"
  ON public.invoices FOR DELETE
  USING (open_id = current_setting('app.current_open_id', TRUE)::TEXT);

-- ─── 记账凭证表 ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id BIGSERIAL PRIMARY KEY,
  open_id TEXT NOT NULL,
  invoice_id BIGINT REFERENCES public.invoices(id) ON DELETE SET NULL,
  voucher_number TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  description TEXT,
  debit_account TEXT NOT NULL,
  debit_amount NUMERIC(12, 2) NOT NULL,
  credit_account TEXT NOT NULL,
  credit_amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'posted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_journal_entries_open_id ON public.journal_entries(open_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON public.journal_entries(status);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_voucher ON public.journal_entries(voucher_number);

-- RLS 策略
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能查看自己的凭证"
  ON public.journal_entries FOR SELECT
  USING (open_id = current_setting('app.current_open_id', TRUE)::TEXT);

CREATE POLICY "用户只能插入自己的凭证"
  ON public.journal_entries FOR INSERT
  WITH CHECK (open_id = current_setting('app.current_open_id', TRUE)::TEXT);

CREATE POLICY "用户只能更新自己的凭证"
  ON public.journal_entries FOR UPDATE
  USING (open_id = current_setting('app.current_open_id', TRUE)::TEXT);

CREATE POLICY "用户只能删除自己的凭证"
  ON public.journal_entries FOR DELETE
  USING (open_id = current_setting('app.current_open_id', TRUE)::TEXT);

-- ─── 税务日历表 ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tax_calendar (
  id BIGSERIAL PRIMARY KEY,
  open_id TEXT NOT NULL,
  tax_type TEXT NOT NULL CHECK (tax_type IN ('vat', 'income_tax', 'personal_tax', 'other')),
  event_name TEXT NOT NULL,
  deadline TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_tax_calendar_open_id ON public.tax_calendar(open_id);
CREATE INDEX IF NOT EXISTS idx_tax_calendar_deadline ON public.tax_calendar(deadline);
CREATE INDEX IF NOT EXISTS idx_tax_calendar_status ON public.tax_calendar(status);

-- RLS 策略
ALTER TABLE public.tax_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能查看自己的税务事项"
  ON public.tax_calendar FOR SELECT
  USING (open_id = current_setting('app.current_open_id', TRUE)::TEXT);

CREATE POLICY "用户只能插入自己的税务事项"
  ON public.tax_calendar FOR INSERT
  WITH CHECK (open_id = current_setting('app.current_open_id', TRUE)::TEXT);

CREATE POLICY "用户只能更新自己的税务事项"
  ON public.tax_calendar FOR UPDATE
  USING (open_id = current_setting('app.current_open_id', TRUE)::TEXT);

CREATE POLICY "用户只能删除自己的税务事项"
  ON public.tax_calendar FOR DELETE
  USING (open_id = current_setting('app.current_open_id', TRUE)::TEXT);

-- ─── 完成提示 ─────────────────────────────────────────

SELECT '✅ 代账功能数据库表创建完成!' AS status;
