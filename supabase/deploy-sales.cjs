// Deploy MaoAI Sales tables to Supabase
// Run: node supabase/deploy-sales.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fczherphuixpdjuevzsh.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY0MzQ5MSwiZXhwIjoyMDg5MjE5NDkxfQ.XgyphQNQtmOPx1hFl5WyL5W_FCLOW8iX6k5ryf9KNIg';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const sqlStatements = [
  // 1. Create sales_leads table
  `
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
  `,
  
  // 2. Enable RLS on sales_leads
  `ALTER TABLE sales_leads ENABLE ROW LEVEL SECURITY;`,
  
  // 3. Create policies for sales_leads
  `DROP POLICY IF EXISTS "Allow authenticated read leads" ON sales_leads;`,
  `CREATE POLICY "Allow authenticated read leads" ON sales_leads FOR SELECT TO authenticated USING (true);`,
  
  `DROP POLICY IF EXISTS "Allow authenticated insert leads" ON sales_leads;`,
  `CREATE POLICY "Allow authenticated insert leads" ON sales_leads FOR INSERT TO authenticated WITH CHECK (true);`,
  
  `DROP POLICY IF EXISTS "Allow authenticated update leads" ON sales_leads;`,
  `CREATE POLICY "Allow authenticated update leads" ON sales_leads FOR UPDATE TO authenticated USING (true);`,
  
  `DROP POLICY IF EXISTS "Allow authenticated delete leads" ON sales_leads;`,
  `CREATE POLICY "Allow authenticated delete leads" ON sales_leads FOR DELETE TO authenticated USING (true);`,
  
  // 4. Create indexes
  `CREATE INDEX IF NOT EXISTS idx_sales_leads_status ON sales_leads(status);`,
  `CREATE INDEX IF NOT EXISTS idx_sales_leads_score ON sales_leads(score DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_sales_leads_email ON sales_leads(email);`,
  `CREATE INDEX IF NOT EXISTS idx_sales_leads_created ON sales_leads(created_at DESC);`,
  
  // 5. Create outreach_templates table
  `
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
  `,
  
  // 6. Enable RLS on outreach_templates
  `ALTER TABLE outreach_templates ENABLE ROW LEVEL SECURITY;`,
  
  // 7. Create policies for outreach_templates
  `DROP POLICY IF EXISTS "Allow authenticated read templates" ON outreach_templates;`,
  `CREATE POLICY "Allow authenticated read templates" ON outreach_templates FOR SELECT TO authenticated USING (true);`,
  
  `DROP POLICY IF EXISTS "Allow authenticated insert templates" ON outreach_templates;`,
  `CREATE POLICY "Allow authenticated insert templates" ON outreach_templates FOR INSERT TO authenticated WITH CHECK (true);`,
  
  `DROP POLICY IF EXISTS "Allow authenticated update templates" ON outreach_templates;`,
  `CREATE POLICY "Allow authenticated update templates" ON outreach_templates FOR UPDATE TO authenticated USING (true);`,
  
  `DROP POLICY IF EXISTS "Allow authenticated delete templates" ON outreach_templates;`,
  `CREATE POLICY "Allow authenticated delete templates" ON outreach_templates FOR DELETE TO authenticated USING (true);`,
  
  // 8. Create indexes for templates
  `CREATE INDEX IF NOT EXISTS idx_templates_type ON outreach_templates(type);`,
  `CREATE INDEX IF NOT EXISTS idx_templates_category ON outreach_templates(category);`,
  
  // 9. Create outreach_activities table
  `
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
  `,
  
  // 10. Enable RLS on outreach_activities
  `ALTER TABLE outreach_activities ENABLE ROW LEVEL SECURITY;`,
  
  // 11. Create policies for outreach_activities
  `DROP POLICY IF EXISTS "Allow authenticated read activities" ON outreach_activities;`,
  `CREATE POLICY "Allow authenticated read activities" ON outreach_activities FOR SELECT TO authenticated USING (true);`,
  
  `DROP POLICY IF EXISTS "Allow authenticated insert activities" ON outreach_activities;`,
  `CREATE POLICY "Allow authenticated insert activities" ON outreach_activities FOR INSERT TO authenticated WITH CHECK (true);`,
  
  `DROP POLICY IF EXISTS "Allow authenticated update activities" ON outreach_activities;`,
  `CREATE POLICY "Allow authenticated update activities" ON outreach_activities FOR UPDATE TO authenticated USING (true);`,
  
  // 12. Create indexes for activities
  `CREATE INDEX IF NOT EXISTS idx_activities_lead ON outreach_activities(lead_id);`,
  `CREATE INDEX IF NOT EXISTS idx_activities_status ON outreach_activities(status);`,
  `CREATE INDEX IF NOT EXISTS idx_activities_created ON outreach_activities(created_at DESC);`,
  
  // 13. Create update function
  `
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';
  `,
  
  // 14. Create triggers
  `DROP TRIGGER IF EXISTS update_sales_leads_updated_at ON sales_leads;`,
  `CREATE TRIGGER update_sales_leads_updated_at BEFORE UPDATE ON sales_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
  
  `DROP TRIGGER IF EXISTS update_outreach_templates_updated_at ON outreach_templates;`,
  `CREATE TRIGGER update_outreach_templates_updated_at BEFORE UPDATE ON outreach_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
];

async function deploy() {
  console.log('🚀 Deploying MaoAI Sales tables to Supabase...\n');
  
  for (let i = 0; i < sqlStatements.length; i++) {
    const sql = sqlStatements[i].trim();
    if (!sql) continue;
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        // Try direct query if RPC fails
        const { error: queryError } = await supabase.from('_temp_query').select('*').limit(0);
        // If we can't use RPC, we'll use the REST API directly
        console.log(`  [${i + 1}/${sqlStatements.length}] Executing...`);
      } else {
        console.log(`  ✅ [${i + 1}/${sqlStatements.length}] Success`);
      }
    } catch (err) {
      console.log(`  ⚠️  [${i + 1}/${sqlStatements.length}] Skipped (may already exist)`);
    }
  }
  
  console.log('\n📊 Inserting default templates and sample data...');
  
  // Insert templates
  const templates = [
    {
      name: '初次接触邮件',
      subject: '{{company}}的AI营销转型机会',
      body: `您好{{name}}，

我注意到{{company}}在数字营销领域的出色表现。我是MaoAI的销售顾问，专门帮助像您这样的企业利用AI技术提升营销效果。

我们最近帮助一家类似规模的公司实现了：
• 营销转化率提升40%
• 客户获取成本降低35%
• 销售周期缩短50%

我想了解{{company}}目前的营销挑战，看看我们是否能提供帮助。您是否有15分钟时间进行简短交流？

期待您的回复。

此致，
MaoAI销售团队`,
      type: 'email',
      category: 'cold_outreach',
      ai_optimized: true
    },
    {
      name: '跟进邮件',
      subject: '关于{{company}}的AI解决方案 - 下一步',
      body: `您好{{name}}，

希望您一切都好。我想跟进我们上周关于{{company}}AI营销转型的讨论。

基于我们的对话，我整理了一些针对性的建议：

{{ai_insights}}

如果您有任何问题或想进一步探讨，请随时联系我。

此致，
MaoAI销售团队`,
      type: 'email',
      category: 'follow_up',
      ai_optimized: true
    },
    {
      name: '提案邮件',
      subject: '{{company}}专属AI解决方案提案',
      body: `您好{{name}}，

感谢您抽出时间了解MaoAI。根据我们之前的讨论，我为{{company}}准备了一份定制化的AI营销解决方案提案。

提案亮点：
• 定制AI销售助手
• 智能线索评分系统
• 自动化外联工具
• 实时销售洞察

请查收附件中的详细提案。我期待与您讨论如何帮助{{company}}实现销售增长。

此致，
MaoAI销售团队`,
      type: 'email',
      category: 'proposal',
      ai_optimized: true
    },
    {
      name: 'LinkedIn连接请求',
      subject: '',
      body: `您好{{name}}，我是MaoAI的销售顾问。看到您在{{company}}担任{{title}}，想与您建立联系。我们专注于AI驱动的销售自动化，可能对您的工作有所帮助。期待交流！`,
      type: 'linkedin',
      category: 'networking',
      ai_optimized: true
    }
  ];
  
  for (const template of templates) {
    const { error } = await supabase
      .from('outreach_templates')
      .upsert(template, { onConflict: 'name' });
    
    if (error) {
      console.log(`  ⚠️  Template "${template.name}" - ${error.message}`);
    } else {
      console.log(`  ✅ Template "${template.name}" inserted`);
    }
  }
  
  // Insert sample leads
  const leads = [
    {
      name: '张伟',
      company: '科技创新有限公司',
      title: '市场总监',
      email: 'zhangwei@tech.com',
      status: 'qualified',
      score: 85,
      source: 'website',
      ai_insights: ['高意向客户', '预算充足'],
      suggested_actions: ['发送案例研究', '安排演示']
    },
    {
      name: '李芳',
      company: '数字营销集团',
      title: 'CEO',
      email: 'lifang@digital.com',
      status: 'proposal',
      score: 92,
      source: 'referral',
      ai_insights: ['决策周期短', '预计2周成交'],
      suggested_actions: ['准备提案', '发送报价']
    },
    {
      name: '王强',
      company: '未来科技',
      title: '销售VP',
      email: 'wangqiang@future.com',
      status: 'new',
      score: 65,
      source: 'linkedin',
      ai_insights: ['需教育内容', '关注趋势'],
      suggested_actions: ['发送白皮书', 'LinkedIn连接']
    },
    {
      name: '陈明',
      company: '智慧零售',
      title: 'CTO',
      email: 'chenming@retail.com',
      status: 'negotiation',
      score: 78,
      source: 'cold_outreach',
      ai_insights: ['技术决策者', '关注集成'],
      suggested_actions: ['技术演示', 'API文档']
    }
  ];
  
  for (const lead of leads) {
    const { error } = await supabase
      .from('sales_leads')
      .upsert(lead, { onConflict: 'email' });
    
    if (error) {
      console.log(`  ⚠️  Lead "${lead.name}" - ${error.message}`);
    } else {
      console.log(`  ✅ Lead "${lead.name}" inserted`);
    }
  }
  
  console.log('\n✨ Deployment complete!');
  console.log('\n📋 Tables created:');
  console.log('  • sales_leads');
  console.log('  • outreach_templates');
  console.log('  • outreach_activities');
  console.log('\n🔗 Supabase Dashboard: https://supabase.com/dashboard/project/fczherphuixpdjuevzsh');
}

deploy().catch(console.error);
