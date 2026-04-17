-- ============================================================
-- 私密云笔记 - 安全加固 (Security Hardening)
-- 创建日期: 2026-04-17
-- 目标: 确保管理员之外任何人无法读取 notes 表数据
-- ============================================================

-- ─── 1. 开启 Row Level Security ─────────────────────────────
-- 这是数据库层的最后一道防线
-- 即使 API Key 泄露，RLS 也会阻止未授权读取

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- ─── 2. 安全策略：禁止所有直接访问 ──────────────────────────
-- Supabase REST API (PostgREST) 使用 anon / service_role key
-- 对于 notes 表，我们只允许服务端通过 Service Role Key 访问
-- 前端/匿名用户完全无法触碰此表

-- 策略: 禁止任何人（包括认证用户）通过 PostgREST 读取 notes
CREATE POLICY "notes_deny_all_select" ON notes
  FOR SELECT
  USING (false);

-- 策略: 禁止任何人通过 PostGREST 插入 notes
CREATE POLICY "notes_deny_all_insert" ON notes
  FOR INSERT
  WITH CHECK (false);

-- 策略: 禁止任何人通过 PostGREST 更新 notes
CREATE POLICY "notes_deny_all_update" ON notes
  FOR UPDATE
  USING (false);

-- 策略: 禁止任何人通过 PostGREST 删除 notes
CREATE POLICY "notes_deny_all_delete" ON notes
  FOR DELETE
  USING (false);

-- ─── 3. 允许 Service Role 绕过 RLS ───────────────────────────
-- Supabase 的 Service Role Key 会自动绕过 RLS
-- 我们的服务端代码 (server/notes.ts) 使用 Service Key 调用
-- 所以以下策略确保：只有服务端能操作，前端/API 直连全部拒绝

-- 注意: 如果需要在 Supabase Dashboard 中手动查看数据，
--       可以使用 SQL Editor 或临时禁用 RLS:
--       ALTER TABLE notes DISABLE ROW LEVEL SECURITY;

-- ─── 4. 审计日志触发器（可选）───────────────────────────────
-- 记录所有对 notes 表的修改操作
CREATE OR REPLACE FUNCTION notes_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notes_audit (
    action,
    table_name,
    record_id,
    old_data,
    new_data,
    changed_at,
    changed_by
  ) VALUES (
    TG_OP,
    'notes',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN row_to_json(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN row_to_json(NEW) END,
    NOW(),
    current_user
  );
  RETURN NULL; -- 不阻止原操作
END;
$$ LANGUAGE plpgsql;

-- 审计表
CREATE TABLE IF NOT EXISTS notes_audit (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,           -- INSERT / UPDATE / DELETE
  table_name TEXT NOT NULL DEFAULT 'notes',
  record_id BIGINT,
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  changed_by TEXT NOT NULL DEFAULT current_user
);

-- 对审计表也开启保护
ALTER TABLE notes_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes_audit_deny_all" ON notes_audit FOR ALL USING (false);
