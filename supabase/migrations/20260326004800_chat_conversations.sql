-- ============================================================
-- MaoAI Chat: 修复并完善 conversations + messages 表
-- 迁移时间: 2026-03-26
-- ============================================================

-- 对话会话表（兼容已有 integer PK 的旧表）
CREATE TABLE IF NOT EXISTS conversations (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL DEFAULT 'anonymous',
  title       TEXT NOT NULL DEFAULT '新对话',
  model       TEXT NOT NULL DEFAULT 'glm-4-flash',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 补齐缺失列（幂等）
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_id  TEXT NOT NULL DEFAULT 'anonymous';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS title    TEXT NOT NULL DEFAULT '新对话';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS model    TEXT NOT NULL DEFAULT 'glm-4-flash';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 消息表（兼容已有表，conversation_id 用 INTEGER 关联）
CREATE TABLE IF NOT EXISTS messages (
  id              SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL DEFAULT 'user',
  content         TEXT NOT NULL DEFAULT '',
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 补齐缺失列（幂等）
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS role            TEXT NOT NULL DEFAULT 'user';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS content         TEXT NOT NULL DEFAULT '';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata        JSONB DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 索引（幂等）
CREATE INDEX IF NOT EXISTS idx_conversations_user_id    ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at      ON messages(created_at);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_messages_update_conversation ON messages;
CREATE TRIGGER trg_messages_update_conversation
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_timestamp();

-- RLS（service_role 全权，前端走服务端代理）
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_conversations" ON conversations;
CREATE POLICY "service_role_all_conversations" ON conversations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_messages" ON messages;
CREATE POLICY "service_role_all_messages" ON messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);
