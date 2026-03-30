-- ─── MaoAI × 猫眼自动内容平台：订阅分层 + Skill 权限控制 ────────────────────────
-- Migration: 20260327010000_subscription_and_skill_plan
-- Date: 2026-03-27

-- ── 1. node_skills 加 required_plan 字段 ────────────────────────────────────────
-- 'free'      = 免费用户可用
-- 'content'   = 内容会员（Content Pro）及以上可用
-- 'strategic' = 战略会员及以上可用
-- 'admin'     = 仅管理员可用
ALTER TABLE node_skills
  ADD COLUMN IF NOT EXISTS required_plan VARCHAR(16) NOT NULL DEFAULT 'free';

COMMENT ON COLUMN node_skills.required_plan IS
  'free | content | strategic | admin — 调用此 skill 所需的最低订阅等级';

-- ── 2. 创建 user_subscriptions 表 ───────────────────────────────────────────────
-- 存储用户订阅信息。user_id 对应 MySQL users.id（跨库引用，不做外键，靠业务层保证一致性）
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL,                       -- MySQL users.id
  open_id         VARCHAR(64) NOT NULL UNIQUE,            -- Manus OAuth openId，用于快速查询
  plan            VARCHAR(16) NOT NULL DEFAULT 'free',   -- free | content | strategic
  content_quota   INTEGER NOT NULL DEFAULT 5,            -- 当月可用内容生产次数（-1 = 不限）
  content_used    INTEGER NOT NULL DEFAULT 0,            -- 当月已用次数
  quota_reset_at  TIMESTAMP NOT NULL DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
  expires_at      TIMESTAMP,                             -- NULL = 永久有效（管理员手动开通场景）
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_open_id ON user_subscriptions (open_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan ON user_subscriptions (plan);

-- updatedAt 自动维护
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER trg_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_user_subscriptions_updated_at();

-- ── 3. 创建 content_tasks 表 ───────────────────────────────────────────────────
-- 记录每次通过 MaoAI 触发的内容生产任务（含手动触发和定时调度）
CREATE TABLE IF NOT EXISTS content_tasks (
  id              SERIAL PRIMARY KEY,
  skill_id        VARCHAR(128) NOT NULL,                 -- 触发的 skill（如 content-writer）
  node_id         INTEGER REFERENCES ai_nodes(id) ON DELETE SET NULL,
  triggered_by    VARCHAR(64),                           -- open_id 或 'scheduler'（定时任务）
  trigger_type    VARCHAR(16) NOT NULL DEFAULT 'manual', -- manual | scheduled | api
  status          VARCHAR(16) NOT NULL DEFAULT 'pending', -- pending | running | success | failed
  params          JSONB DEFAULT '{}',                    -- 传入参数
  result          JSONB DEFAULT '{}',                    -- 执行结果（帖子链接、平台等）
  error_message   TEXT,
  started_at      TIMESTAMP,
  finished_at     TIMESTAMP,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_tasks_skill ON content_tasks (skill_id);
CREATE INDEX IF NOT EXISTS idx_content_tasks_triggered_by ON content_tasks (triggered_by);
CREATE INDEX IF NOT EXISTS idx_content_tasks_status ON content_tasks (status);
CREATE INDEX IF NOT EXISTS idx_content_tasks_created ON content_tasks (created_at DESC);

-- ── 4. 创建 scheduled_skill_jobs 表 ─────────────────────────────────────────────
-- 管理员配置的定时内容生产任务
CREATE TABLE IF NOT EXISTS scheduled_skill_jobs (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(256) NOT NULL,
  skill_id        VARCHAR(128) NOT NULL,
  node_id         INTEGER REFERENCES ai_nodes(id) ON DELETE SET NULL,
  cron_expr       VARCHAR(64) NOT NULL,                  -- cron 表达式，如 '0 9 * * *'
  params          JSONB DEFAULT '{}',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at     TIMESTAMP,
  next_run_at     TIMESTAMP,
  created_by      VARCHAR(64),                           -- 创建的管理员 open_id
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_scheduled_skill_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_scheduled_skill_jobs_updated_at ON scheduled_skill_jobs;
CREATE TRIGGER trg_scheduled_skill_jobs_updated_at
  BEFORE UPDATE ON scheduled_skill_jobs
  FOR EACH ROW EXECUTE FUNCTION update_scheduled_skill_jobs_updated_at();

-- ── 5. 更新现有 marketing-claw skills 的 required_plan ───────────────────────────
-- 内容生产类 skill 默认需要 content 及以上
UPDATE node_skills
SET required_plan = 'content'
WHERE "skillId" IN (
  'content-writer',
  'seo-optimizer',
  'social-media-scheduler',
  'campaign-manager',
  'email-marketer',
  'ad-copywriter',
  'brand-storyteller',
  'influencer-outreach',
  'analytics-reporter',
  'trend-spotter',
  'competitor-watcher',
  'customer-voice'
);
