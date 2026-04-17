-- ============================================================
-- 📋 Supabase RLS 安全策略 - 手动执行版
-- 📍 执行位置: Supabase Dashboard → SQL Editor
-- 🔗 https://supabase.com/dashboard/project/fczherphuixpdjuevzsh/sql
--
-- ⚠️ 复制以下全部内容，粘贴到 SQL Editor 中，点 Run
-- ============================================================

-- ─── 1. 开启 Row Level Security（数据库层最后一道防线）────
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- ─── 2. DENY ALL 策略（禁止任何 PostgREST 直连访问）─────────
-- 即使有人拿到 anon key 或 service_role key 的 JWT，
-- 通过 REST API 也无法读取/写入 notes 表

DO $$
BEGIN
  -- SELECT：禁止读取
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'notes_deny_all_select') THEN
    CREATE POLICY "notes_deny_all_select" ON notes FOR SELECT USING (false);
  END IF;
  
  -- INSERT：禁止插入
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'notes_deny_all_insert') THEN
    CREATE POLICY "notes_deny_all_insert" ON notes FOR INSERT WITH CHECK (false);
  END IF;
  
  -- UPDATE：禁止更新
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'notes_deny_all_update') THEN
    CREATE POLICY "notes_deny_all_update" ON notes FOR UPDATE USING (false);
  END IF;
  
  -- DELETE：禁止删除
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notes' AND policyname = 'notes_deny_all_delete') THEN
    CREATE POLICY "notes_deny_all_delete" ON notes FOR DELETE USING (false);
  END IF;
END $$;

-- ─── 3. 验证执行结果 ──────────────────────────────────────────
SELECT 
  tablename,
  rowsecurity AS rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'notes') AS policy_count
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'notes';

-- 查看具体策略
SELECT policyname, cmd, 
  CASE WHEN qual IS NOT NULL THEN 'USING (' || substr(qual::text, 1, 20) || '...)' ELSE 'WITH CHECK (...)' END AS rule
FROM pg_policies 
WHERE tablename = 'notes'
ORDER BY cmd;

-- ✅ 预期输出：
--   rls_enabled = true
--   policy_count = 4
--   4 条策略全部为 DENY (false)
