-- ============================================================
-- 私密云笔记 (Private Notes)
-- 管理员专属，存储在 Supabase PostgreSQL
-- ============================================================

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

-- 标签 GIN 索引（支持 @> 数组查询）
CREATE INDEX IF NOT EXISTS notes_tags_idx ON notes USING GIN (tags);

-- 时间排序索引
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes (created_at DESC);
CREATE INDEX IF NOT EXISTS notes_updated_at_idx ON notes (updated_at DESC);

-- 置顶 / 归档索引
CREATE INDEX IF NOT EXISTS notes_is_pinned_idx ON notes (is_pinned);
CREATE INDEX IF NOT EXISTS notes_is_archived_idx ON notes (is_archived);

-- 全文搜索索引（simple 分词器，兼容中英文）
CREATE INDEX IF NOT EXISTS notes_fts_idx ON notes
  USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,'')));

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notes_updated_at_trigger ON notes;
CREATE TRIGGER notes_updated_at_trigger
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_notes_updated_at();
