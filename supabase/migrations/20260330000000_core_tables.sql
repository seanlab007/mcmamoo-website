-- ============================================================
-- MaoAI Supabase Migration: 核心业务表
-- Migration: 20260330000000_core_tables
-- Date: 2026-03-30
-- 覆盖：users / mao_applications / brief_subscribers /
--       routing_rules / node_logs
-- ============================================================

-- ── 0. 公共工具函数（如已存在则跳过）────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── 1. users 表（MaoAI 业务用户，通过 OAuth openId 标识）────────────────────────
-- 注意：这是应用层用户表，不是 Supabase auth.users
-- openId 来自 Manus OAuth，是跨平台唯一标识
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  "openId"        VARCHAR(64)  NOT NULL UNIQUE,
  name            TEXT,
  email           VARCHAR(320),
  "loginMethod"   VARCHAR(64),
  role            VARCHAR(8)   NOT NULL DEFAULT 'user'
                  CHECK (role IN ('user', 'admin')),
  "createdAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "lastSignedIn"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_open_id   ON users ("openId");
CREATE INDEX IF NOT EXISTS idx_users_email     ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role      ON users (role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 服务端 Service Key 可以完整操作；前端不直接访问此表
CREATE POLICY "Service role full access to users"
  ON users FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE  users           IS 'MaoAI 应用层用户表，通过 Manus OAuth openId 唯一标识';
COMMENT ON COLUMN users."openId"  IS 'Manus OAuth 分配的唯一用户 ID';
COMMENT ON COLUMN users.role      IS 'user = 普通用户；admin = 管理员';

-- ── 2. mao_applications 表（猫眼咨询申请）────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mao_applications (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(128) NOT NULL,
  organization    VARCHAR(256) NOT NULL,
  "consultType"   VARCHAR(64)  NOT NULL,
  description     TEXT,
  status          VARCHAR(16)  NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  notes           TEXT,
  "createdAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mao_apps_status     ON mao_applications (status);
CREATE INDEX IF NOT EXISTS idx_mao_apps_created_at ON mao_applications ("createdAt" DESC);

ALTER TABLE mao_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to mao_applications"
  ON mao_applications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_mao_applications_updated_at ON mao_applications;
CREATE TRIGGER trg_mao_applications_updated_at
  BEFORE UPDATE ON mao_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE mao_applications IS '猫眼咨询申请表，记录用户提交的咨询/合作意向';

-- ── 3. brief_subscribers 表（战略简报订阅）───────────────────────────────────────
CREATE TABLE IF NOT EXISTS brief_subscribers (
  id          SERIAL PRIMARY KEY,
  email       VARCHAR(320) NOT NULL UNIQUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brief_subscribers_email ON brief_subscribers (email);

ALTER TABLE brief_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to brief_subscribers"
  ON brief_subscribers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE brief_subscribers IS '战略简报邮件订阅列表，email 唯一';

-- ── 4. routing_rules 表（AI 节点路由规则）────────────────────────────────────────
-- 被 db.ts getRoutingRules() 使用
CREATE TABLE IF NOT EXISTS routing_rules (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(128)  NOT NULL,
  pattern     TEXT          NOT NULL,     -- 匹配的关键词 / 正则 / 技能 ID
  node_id     INTEGER       REFERENCES ai_nodes(id) ON DELETE SET NULL,
  priority    INTEGER       NOT NULL DEFAULT 100,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routing_rules_priority  ON routing_rules (priority ASC);
CREATE INDEX IF NOT EXISTS idx_routing_rules_active    ON routing_rules (is_active);

ALTER TABLE routing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to routing_rules"
  ON routing_rules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_routing_rules_updated_at ON routing_rules;
CREATE TRIGGER trg_routing_rules_updated_at
  BEFORE UPDATE ON routing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE routing_rules IS 'AI 节点请求路由规则，priority 越小优先级越高';

-- ── 5. node_logs 表（节点调用日志）──────────────────────────────────────────────
-- 被 db.ts createNodeLog() 使用；写入失败不影响主流程
CREATE TABLE IF NOT EXISTS node_logs (
  id          BIGSERIAL PRIMARY KEY,
  node_id     INTEGER     REFERENCES ai_nodes(id) ON DELETE SET NULL,
  event       VARCHAR(64) NOT NULL,              -- 'invoke' | 'heartbeat' | 'error' | 'skill_sync'
  skill_id    VARCHAR(128),
  duration_ms INTEGER,
  status_code INTEGER,
  message     TEXT,
  payload     JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 日志表分区友好索引
CREATE INDEX IF NOT EXISTS idx_node_logs_node_id    ON node_logs (node_id);
CREATE INDEX IF NOT EXISTS idx_node_logs_event      ON node_logs (event);
CREATE INDEX IF NOT EXISTS idx_node_logs_created_at ON node_logs ("createdAt" DESC);

ALTER TABLE node_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to node_logs"
  ON node_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE node_logs IS 'AI 节点调用日志；写入失败不阻断主流程';
