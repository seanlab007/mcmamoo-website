-- ─── MaoAI Customer Service Schema ────────────────────────────────────────
-- 客服功能所需的数据库表
-- 执行方式: psql -h db.fczherphuixpdjuevzsh.supabase.co -U postgres -f 20260403_customer_service.sql

-- 1. 客服电话记录表
CREATE TABLE IF NOT EXISTS customer_service_calls (
  id BIGSERIAL PRIMARY KEY,
  customer_name VARCHAR(128) NOT NULL DEFAULT '',
  customer_phone VARCHAR(32) NOT NULL DEFAULT '',
  customer_email VARCHAR(256),
  agent_id VARCHAR(128),              -- ElevenLabs Conversational AI Agent ID
  conversation_id VARCHAR(128),       -- ElevenLabs Conversation ID
  call_type VARCHAR(20) NOT NULL DEFAULT 'outbound',  -- inbound / outbound
  status VARCHAR(20) NOT NULL DEFAULT 'ringing',       -- ringing / in_progress / completed / missed / failed
  summary TEXT,                       -- AI 生成的对话摘要
  duration INTEGER DEFAULT 0,         -- 通话时长（秒）
  recording_url TEXT,                 -- 录音文件 URL
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_csc_status ON customer_service_calls(status);
CREATE INDEX IF NOT EXISTS idx_csc_created ON customer_service_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_csc_phone ON customer_service_calls(customer_phone);

-- 2. 客服聊天记录表（文本客服）
CREATE TABLE IF NOT EXISTS customer_service_chats (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES auth.users(id),
  message TEXT NOT NULL,
  reply TEXT NOT NULL,
  lead_id VARCHAR(128),               -- 关联的 Sales Lead ID（可选）
  session_id VARCHAR(128),             -- 会话 ID（用于关联同一对话）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_csch_session ON customer_service_chats(session_id);
CREATE INDEX IF NOT EXISTS idx_csch_user ON customer_service_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_csch_created ON customer_service_chats(created_at DESC);

-- 3. 客服 AI 代理配置表（本地存储，不依赖 ElevenLabs）
CREATE TABLE IF NOT EXISTS customer_service_agents (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  elevenlabs_agent_id VARCHAR(128),    -- ElevenLabs Agent ID（如已创建）
  system_prompt TEXT NOT NULL,         -- 系统提示词
  first_message TEXT NOT NULL DEFAULT '您好，请问有什么可以帮您的？',
  voice_id VARCHAR(128),               -- ElevenLabs Voice ID
  phone_number VARCHAR(32),            -- 关联的电话号码
  language VARCHAR(10) DEFAULT 'zh',   -- 语言
  temperature NUMERIC(3,2) DEFAULT 0.7,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_csag_active ON customer_service_agents(is_active);

-- 启用 RLS
ALTER TABLE customer_service_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_service_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_service_agents ENABLE ROW LEVEL SECURITY;

-- RLS Policies: 允许 service_role 完全访问
CREATE POLICY "Service role full access on customer_service_calls"
  ON customer_service_calls FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on customer_service_chats"
  ON customer_service_chats FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on customer_service_agents"
  ON customer_service_agents FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anon role: 只允许读取（用于公开统计）
CREATE POLICY "Anon read on customer_service_agents"
  ON customer_service_agents FOR SELECT
  TO anon
  USING (is_active = true);

-- ─── 完成 ─────────────────────────────────────────────────────────────────
-- 验证:
-- SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'customer_service%';
