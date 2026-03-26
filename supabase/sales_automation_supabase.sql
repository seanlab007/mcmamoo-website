-- =====================================================
-- MaoAI Sales Automation - Supabase SQL
-- Project: fczherphuixpdjuevzsh
-- URL: https://supabase.com/dashboard/project/fczherphuixpdjuevzsh
-- 
-- 使用方法：
-- 1. 登录 Supabase Dashboard: https://supabase.com/dashboard/project/fczherphuixpdjuevzsh
-- 2. 进入 SQL Editor
-- 3. 复制以下全部SQL代码并执行
-- =====================================================

-- =====================================================
-- 1. 销售线索表 (sales_leads)
-- =====================================================
CREATE TABLE IF NOT EXISTS sales_leads (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  company VARCHAR(256) NOT NULL,
  title VARCHAR(128),
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(64),
  linkedin VARCHAR(256),
  website VARCHAR(256),
  status VARCHAR(32) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  source VARCHAR(32) NOT NULL DEFAULT 'other' CHECK (source IN ('website', 'linkedin', 'referral', 'cold_outreach', 'event', 'other')),
  score INTEGER DEFAULT 0,
  notes TEXT,
  last_contact TIMESTAMP WITH TIME ZONE,
  next_follow_up TIMESTAMP WITH TIME ZONE,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ai_insights JSONB DEFAULT '[]',
  suggested_actions JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 启用行级安全
ALTER TABLE sales_leads ENABLE ROW LEVEL SECURITY;

-- 创建访问策略
CREATE POLICY "Allow authenticated read leads" ON sales_leads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert leads" ON sales_leads
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update leads" ON sales_leads
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete leads" ON sales_leads
  FOR DELETE TO authenticated USING (true);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON sales_leads(status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_score ON sales_leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_sales_leads_email ON sales_leads(email);
CREATE INDEX IF NOT EXISTS idx_sales_leads_created ON sales_leads(created_at DESC);

-- =====================================================
-- 2. 外联模板表 (outreach_templates)
-- =====================================================
CREATE TABLE IF NOT EXISTS outreach_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  subject VARCHAR(256),
  body TEXT NOT NULL,
  type VARCHAR(16) NOT NULL DEFAULT 'email' CHECK (type IN ('email', 'linkedin')),
  category VARCHAR(64),
  ai_optimized BOOLEAN DEFAULT false,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 启用行级安全
ALTER TABLE outreach_templates ENABLE ROW LEVEL SECURITY;

-- 创建访问策略
CREATE POLICY "Allow authenticated read templates" ON outreach_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert templates" ON outreach_templates
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update templates" ON outreach_templates
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete templates" ON outreach_templates
  FOR DELETE TO authenticated USING (true);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_templates_type ON outreach_templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_category ON outreach_templates(category);

-- =====================================================
-- 3. 外联活动表 (outreach_activities)
-- =====================================================
CREATE TABLE IF NOT EXISTS outreach_activities (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  type VARCHAR(16) NOT NULL CHECK (type IN ('email', 'linkedin', 'call', 'meeting', 'note')),
  subject VARCHAR(256),
  content TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'delivered', 'opened', 'replied', 'bounced')),
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 启用行级安全
ALTER TABLE outreach_activities ENABLE ROW LEVEL SECURITY;

-- 创建访问策略
CREATE POLICY "Allow authenticated read activities" ON outreach_activities
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert activities" ON outreach_activities
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update activities" ON outreach_activities
  FOR UPDATE TO authenticated USING (true);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_activities_lead ON outreach_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON outreach_activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_created ON outreach_activities(created_at DESC);

-- =====================================================
-- 4. 自动更新 updated_at 的函数和触发器
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- sales_leads 触发器
DROP TRIGGER IF EXISTS update_sales_leads_updated_at ON sales_leads;
CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- outreach_templates 触发器
DROP TRIGGER IF EXISTS update_outreach_templates_updated_at ON outreach_templates;
CREATE TRIGGER update_outreach_templates_updated_at
  BEFORE UPDATE ON outreach_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. 插入默认模板数据
-- =====================================================
INSERT INTO outreach_templates (name, subject, body, type, category, ai_optimized) VALUES
('初次接触邮件', '{{company}}的AI营销转型机会', E'您好{{name}}，\n\n我注意到{{company}}在数字营销领域的出色表现。我是MaoAI的销售顾问，专门帮助像您这样的企业利用AI技术提升营销效果。\n\n我们最近帮助一家类似规模的公司实现了：\n• 营销转化率提升40%\n• 客户获取成本降低35%\n• 销售周期缩短50%\n\n我想了解{{company}}目前的营销挑战，看看我们是否能提供帮助。您是否有15分钟时间进行简短交流？\n\n期待您的回复。\n\n此致，\nMaoAI销售团队', 'email', 'cold_outreach', true),

('跟进邮件', '关于{{company}}的AI解决方案 - 下一步', E'您好{{name}}，\n\n希望您一切都好。我想跟进我们上周关于{{company}}AI营销转型的讨论。\n\n基于我们的对话，我整理了一些针对性的建议：\n\n{{ai_insights}}\n\n如果您有任何问题或想进一步探讨，请随时联系我。\n\n此致，\nMaoAI销售团队', 'email', 'follow_up', true),

('提案邮件', '{{company}}专属AI解决方案提案', E'您好{{name}}，\n\n感谢您抽出时间了解MaoAI。根据我们之前的讨论，我为{{company}}准备了一份定制化的AI营销解决方案提案。\n\n提案亮点：\n• 定制AI销售助手\n• 智能线索评分系统\n• 自动化外联工具\n• 实时销售洞察\n\n请查收附件中的详细提案。我期待与您讨论如何帮助{{company}}实现销售增长。\n\n此致，\nMaoAI销售团队', 'email', 'proposal', true),

('LinkedIn连接请求', '', E'您好{{name}}，我是MaoAI的销售顾问。看到您在{{company}}担任{{title}}，想与您建立联系。我们专注于AI驱动的销售自动化，可能对您的工作有所帮助。期待交流！', 'linkedin', 'networking', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. 插入示例线索数据（用于测试）
-- =====================================================
INSERT INTO sales_leads (name, company, title, email, status, score, source, ai_insights, suggested_actions) VALUES
('张伟', '科技创新有限公司', '市场总监', 'zhangwei@tech.com', 'qualified', 85, 'website', '["高意向客户", "预算充足"]', '["发送案例研究", "安排演示"]'),
('李芳', '数字营销集团', 'CEO', 'lifang@digital.com', 'proposal', 92, 'referral', '["决策周期短", "预计2周成交"]', '["准备提案", "发送报价"]'),
('王强', '未来科技', '销售VP', 'wangqiang@future.com', 'new', 65, 'linkedin', '["需教育内容", "关注趋势"]', '["发送白皮书", "LinkedIn连接"]'),
('陈明', '智慧零售', 'CTO', 'chenming@retail.com', 'negotiation', 78, 'cold_outreach', '["技术决策者", "关注集成"]', '["技术演示", "API文档"]')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 完成！
-- =====================================================
SELECT 'MaoAI Sales Automation tables created successfully!' as status;
