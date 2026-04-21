-- ============================================================
-- Supabase 数据库初始化脚本
-- 项目: mcmamoo-website
-- 数据库 ID: fczherphuixpdjuevzsh
-- 执行方式: Supabase Dashboard > SQL Editor > 粘贴执行
-- ============================================================

-- ============================================================
-- Part A: 核心订阅与限制表 (subscriptions, user_limits)
-- ============================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES auth.users(id) ON DELETE CASCADE,
  tier VARCHAR(32) NOT NULL DEFAULT 'free',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  daily_chat_messages INTEGER NOT NULL DEFAULT -1,
  daily_image_generations INTEGER NOT NULL DEFAULT -1,
  premium_models BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_limits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_chat_messages INTEGER NOT NULL DEFAULT 0,
  usage_image_generations INTEGER NOT NULL DEFAULT 0,
  usage_documents INTEGER NOT NULL DEFAULT 0,
  usage_rag_files INTEGER NOT NULL DEFAULT 0,
  last_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Part B: 对话与消息表
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '新对话',
  model VARCHAR(64),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL,
  content TEXT NOT NULL,
  model VARCHAR(64),
  token_usage INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);

-- ============================================================
-- Part C: 销售自动化表 (Sales Automation)
-- ============================================================

CREATE TABLE IF NOT EXISTS sales_leads (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(256) NOT NULL,
  contact_name VARCHAR(128),
  phone VARCHAR(32),
  email VARCHAR(256),
  stage VARCHAR(32) NOT NULL DEFAULT 'lead',
  value NUMERIC(12,2),
  probability INTEGER DEFAULT 0,
  notes TEXT,
  last_activity TIMESTAMP WITH TIME ZONE,
  next_follow_up TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_activities (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES sales_leads(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(32) NOT NULL,
  description TEXT,
  result VARCHAR(32),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_quotations (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES sales_leads(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 华为销售情报扩展
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS value_rating VARCHAR(4) DEFAULT 'D';
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS competitor_name VARCHAR(256);
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS competitor_advantage TEXT;
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS our_advantage TEXT;
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS payment_risk VARCHAR(32) DEFAULT 'low';
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS decision_cycle VARCHAR(32) DEFAULT 'unknown';
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS need_prepayment BOOLEAN DEFAULT false;
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(12, 2);
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS industry VARCHAR(128);
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS ltc_stage VARCHAR(32) DEFAULT 'ML';

CREATE TABLE IF NOT EXISTS decision_makers (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES sales_leads(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  title VARCHAR(256),
  department VARCHAR(128),
  roles VARCHAR(64)[] DEFAULT '{}',
  business_pain TEXT,
  personal_goal TEXT,
  fear_point TEXT,
  relationship_strength INTEGER DEFAULT 0,
  last_contact TIMESTAMP WITH TIME ZONE,
  next_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS competitor_comparisons (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES sales_leads(id) ON DELETE CASCADE,
  competitor_name VARCHAR(256) NOT NULL,
  competitor_solution TEXT,
  competitor_price_range VARCHAR(128),
  competitor_strengths TEXT,
  competitor_weaknesses TEXT,
  our_differentiator TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iron_triangle_reviews (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES sales_leads(id) ON DELETE CASCADE,
  review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ar_coverage TEXT,
  ar_next_step TEXT,
  sr_pain_match TEXT,
  sr_proposal_status TEXT,
  fr_delivery_risk TEXT,
  fr_payment_plan TEXT,
  overall_action_plan TEXT,
  win_probability INTEGER CHECK (win_probability BETWEEN 0 AND 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Part D: 客服系统表 (Customer Service)
-- ============================================================

CREATE TABLE IF NOT EXISTS customer_service_calls (
  id BIGSERIAL PRIMARY KEY,
  customer_name VARCHAR(128) NOT NULL DEFAULT '',
  customer_phone VARCHAR(32) NOT NULL DEFAULT '',
  customer_email VARCHAR(256),
  agent_id VARCHAR(128),
  conversation_id VARCHAR(128),
  call_type VARCHAR(20) NOT NULL DEFAULT 'outbound',
  status VARCHAR(20) NOT NULL DEFAULT 'ringing',
  summary TEXT,
  duration INTEGER DEFAULT 0,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_service_chats (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES auth.users(id),
  message TEXT NOT NULL,
  reply TEXT NOT NULL,
  lead_id VARCHAR(128),
  session_id VARCHAR(128),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_service_agents (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  elevenlabs_agent_id VARCHAR(128),
  system_prompt TEXT NOT NULL,
  first_message TEXT NOT NULL DEFAULT '您好，请问有什么可以帮您的？',
  voice_id VARCHAR(128),
  phone_number VARCHAR(32),
  language VARCHAR(10) DEFAULT 'zh',
  temperature NUMERIC(3,2) DEFAULT 0.7,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Part E: 私密云笔记表 (Notes)
-- ============================================================

CREATE TABLE IF NOT EXISTS notes (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  color TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notes_audit (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL DEFAULT 'notes',
  record_id BIGINT,
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  changed_by TEXT NOT NULL DEFAULT current_user
);

-- Notes 索引
CREATE INDEX IF NOT EXISTS notes_tags_idx ON notes USING GIN (tags);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes (created_at DESC);
CREATE INDEX IF NOT EXISTS notes_fts_idx ON notes USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,'')));

-- Notes 自动更新 updated_at
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

-- ============================================================
-- Part F: RLS 安全策略
-- ============================================================

-- 开启 RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE decision_makers ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE iron_triangle_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_service_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_service_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_service_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes_audit ENABLE ROW LEVEL SECURITY;

-- Service Role 完全访问策略
CREATE POLICY "service_role_all" ON subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON user_limits FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON messages FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON sales_leads FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON sales_activities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON sales_quotations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON decision_makers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON competitor_comparisons FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON iron_triangle_reviews FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON customer_service_calls FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON customer_service_chats FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all" ON customer_service_agents FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Notes DENY ALL (只允许 service_role 访问)
DROP POLICY IF EXISTS "notes_deny_all_select" ON notes;
DROP POLICY IF EXISTS "notes_deny_all_insert" ON notes;
DROP POLICY IF EXISTS "notes_deny_all_update" ON notes;
DROP POLICY IF EXISTS "notes_deny_all_delete" ON notes;
CREATE POLICY "notes_deny_all_select" ON notes FOR SELECT USING (false);
CREATE POLICY "notes_deny_all_insert" ON notes FOR INSERT WITH CHECK (false);
CREATE POLICY "notes_deny_all_update" ON notes FOR UPDATE USING (false);
CREATE POLICY "notes_deny_all_delete" ON notes FOR DELETE USING (false);

DROP POLICY IF EXISTS "notes_audit_deny_all" ON notes_audit;
CREATE POLICY "notes_audit_deny_all" ON notes_audit FOR ALL USING (false);

-- ============================================================
-- 执行完成
-- ============================================================
SELECT 'Schema initialization complete!' as status;
