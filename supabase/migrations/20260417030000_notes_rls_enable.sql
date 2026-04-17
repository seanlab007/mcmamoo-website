-- ============================================================
-- 私密云笔记 - 完整初始化（建表 + RLS 安全策略 + 审计）
-- ============================================================

-- 1. 建表
CREATE TABLE IF NOT EXISTS notes (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT '',
  content     TEXT NOT NULL DEFAULT '',
  tags        TEXT[] NOT NULL DEFAULT '{}',
  is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  color       TEXT DEFAULT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 索引
CREATE INDEX IF NOT EXISTS notes_tags_idx ON notes USING GIN (tags);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes (created_at DESC);
CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes (updated_at DESC);
CREATE INDEX IF NOT EXISTS notes_is_pinned_idx ON notes (is_pinned);
CREATE INDEX IF NOT EXISTS notes_is_archived_idx ON notes (is_archived);
CREATE INDEX IF NOT EXISTS notes_fts_idx ON notes
  USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,'')));

-- 3. 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS notes_updated_at_trigger ON notes;
CREATE TRIGGER notes_updated_at_trigger
BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_notes_updated_at();

-- 4. 开启 RLS（安全核心）
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 5. DENY ALL 策略 - 禁止任何直连访问
CREATE POLICY "notes_deny_all_select" ON notes
  FOR SELECT USING (false);

CREATE POLICY "notes_deny_all_insert" ON notes
  FOR INSERT WITH CHECK (false);

CREATE POLICY "notes_deny_all_update" ON notes
  FOR UPDATE USING (false);

CREATE POLICY "notes_deny_all_delete" ON notes
  FOR DELETE USING (false);

-- 6. 审计表
CREATE TABLE IF NOT EXISTS notes_audit (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL DEFAULT 'notes',
  record_id BIGINT,
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by TEXT NOT NULL DEFAULT current_user
);
ALTER TABLE notes_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_audit_deny_all" ON notes_audit FOR ALL USING (false);
