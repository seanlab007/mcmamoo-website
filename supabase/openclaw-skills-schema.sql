-- ============================================================
-- OpenClaw Skills Integration — Supabase Schema
-- 适用于 MaoAI (mcmamoo-website) 项目
-- 在 Supabase SQL Editor 中执行此脚本
-- ============================================================

-- ─── mao_memories 表 ─────────────────────────────────────────────────────────
-- 用于 openclaw_memory skill 的持久化记忆存储

CREATE TABLE IF NOT EXISTS mao_memories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,                    -- Supabase 用户 openId
  memory_key  TEXT NOT NULL,                    -- 记忆键名，如 'user_preferences'
  memory_value TEXT NOT NULL DEFAULT '',        -- 记忆内容
  tags        TEXT[] DEFAULT '{}',              -- 标签数组，用于分类检索
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, memory_key)                  -- 同一用户同一 key 唯一
);

-- 索引：按用户查询
CREATE INDEX IF NOT EXISTS idx_mao_memories_user_id ON mao_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_mao_memories_tags ON mao_memories USING gin(tags);

-- RLS 策略
ALTER TABLE mao_memories ENABLE ROW LEVEL SECURITY;

-- 允许 service_role 全权操作（服务端使用 service_role key）
CREATE POLICY "service_role_all" ON mao_memories
  FOR ALL
  USING (auth.role() = 'service_role');

-- ─── openclaw_skill_logs 表 ───────────────────────────────────────────────────
-- 记录 OpenClaw Skill 调用日志，方便 openclaw_model_usage 统计

CREATE TABLE IF NOT EXISTS openclaw_skill_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT,
  skill_name  TEXT NOT NULL,                    -- 如 'openclaw_weather'
  input_args  JSONB DEFAULT '{}',              -- 调用参数
  success     BOOLEAN NOT NULL DEFAULT TRUE,
  duration_ms INTEGER,                          -- 执行耗时（毫秒）
  error_msg   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_logs_user ON openclaw_skill_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_logs_skill ON openclaw_skill_logs(skill_name);
CREATE INDEX IF NOT EXISTS idx_skill_logs_created ON openclaw_skill_logs(created_at DESC);

ALTER TABLE openclaw_skill_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_logs" ON openclaw_skill_logs
  FOR ALL
  USING (auth.role() = 'service_role');

-- ─── 完成提示 ─────────────────────────────────────────────────────────────────
-- 执行后请确认：
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public'
--   AND table_name IN ('mao_memories', 'openclaw_skill_logs');
