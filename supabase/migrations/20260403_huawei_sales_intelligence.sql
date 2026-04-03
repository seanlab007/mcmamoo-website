-- Huawei-style Sales Intelligence System - Database Migration
-- 将华为 LTC/MCR 逻辑降维为个人版作战情报系统
-- Created: 2026-04-03

-- ============================================================
-- 1. 升级 sales_leads 表：增加客户价值评级、竞争情报、风险预警
-- ============================================================

ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS value_rating VARCHAR(4) DEFAULT 'D'
  CHECK (value_rating IN ('A', 'B', 'C', 'D'));

ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS competitor_name VARCHAR(256);

ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS competitor_advantage TEXT;

ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS our_advantage TEXT;

ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS payment_risk VARCHAR(32) DEFAULT 'low'
  CHECK (payment_risk IN ('low', 'medium', 'high'));

ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS decision_cycle VARCHAR(32) DEFAULT 'unknown'
  CHECK (decision_cycle IN ('1_week', '2_weeks', '1_month', '1_quarter', 'long', 'unknown'));

ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS need_prepayment BOOLEAN DEFAULT false;

ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(12, 2);

ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS industry VARCHAR(128);

ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS power_map_version INTEGER DEFAULT 0;

ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS ltc_stage VARCHAR(32) DEFAULT 'ML'
  CHECK (ltc_stage IN ('ML', 'MO', 'ATC', 'delivery', 'collection'));

-- ============================================================
-- 2. 新建决策链表 (Power Map) - 华为决策五角色
-- ============================================================

CREATE TABLE IF NOT EXISTS decision_makers (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  title VARCHAR(256),
  department VARCHAR(128),
  roles VARCHAR(64)[] DEFAULT '{}',
  business_pain TEXT,
  personal_goal TEXT,
  fear_point TEXT,
  communication_style VARCHAR(32) DEFAULT 'data_driven'
    CHECK (communication_style IN ('data_driven', 'relationship', 'security', 'mixed')),
  icebreaker TEXT,
  relationship_strength INTEGER DEFAULT 0 CHECK (relationship_strength BETWEEN 0 AND 100),
  last_contact TIMESTAMP WITH TIME ZONE,
  next_action TEXT,
  next_action_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  ar_verified BOOLEAN DEFAULT false,
  sr_verified BOOLEAN DEFAULT false,
  fr_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 3. 新建竞品对比表
-- ============================================================

CREATE TABLE IF NOT EXISTS competitor_comparisons (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  competitor_name VARCHAR(256) NOT NULL,
  competitor_solution TEXT,
  competitor_price_range VARCHAR(128),
  competitor_delivery_cycle VARCHAR(128),
  competitor_strengths TEXT,
  competitor_weaknesses TEXT,
  our_differentiator TEXT,
  comparison_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 4. 新建铁三角作战记录表
-- ============================================================

CREATE TABLE IF NOT EXISTS iron_triangle_reviews (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ar_coverage TEXT,
  ar_next_step TEXT,
  sr_pain_match TEXT,
  sr_proposal_status TEXT,
  fr_delivery_risk TEXT,
  fr_payment_plan TEXT,
  overall_action_plan TEXT,
  win_probability INTEGER CHECK (win_probability BETWEEN 0 AND 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 5. 新建情报收集记录表 (华为"两看")
-- ============================================================

CREATE TABLE IF NOT EXISTS intel_records (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  intel_type VARCHAR(32) NOT NULL CHECK (intel_type IN ('customer_public', 'competitor', 'industry', 'other')),
  source VARCHAR(128) NOT NULL,
  title VARCHAR(256) NOT NULL,
  content TEXT,
  impact TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 6. 新建 LTC 周循环任务表
-- ============================================================

CREATE TABLE IF NOT EXISTS ltc_weekly_tasks (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  phase VARCHAR(32) NOT NULL CHECK (phase IN ('ML_clean', 'ML_value_email', 'MO_deep_update', 'MO_strategy', 'ATC_review', 'delivery_monitor', 'collection')),
  task_description TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================
-- 7. RLS Policies
-- ============================================================

ALTER TABLE decision_makers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dm_authenticated_all" ON decision_makers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE competitor_comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc_authenticated_all" ON competitor_comparisons
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE iron_triangle_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itr_authenticated_all" ON iron_triangle_reviews
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE intel_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ir_authenticated_all" ON intel_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE ltc_weekly_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ltc_authenticated_all" ON ltc_weekly_tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 8. Triggers for updated_at
-- ============================================================

DROP TRIGGER IF EXISTS update_decision_makers_updated_at ON decision_makers;
CREATE TRIGGER update_decision_makers_updated_at
  BEFORE UPDATE ON decision_makers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_iron_triangle_reviews_updated_at ON iron_triangle_reviews;
CREATE TRIGGER update_iron_triangle_reviews_updated_at
  BEFORE UPDATE ON iron_triangle_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_decision_makers_lead ON decision_makers(lead_id);
CREATE INDEX IF NOT EXISTS idx_competitor_comparisons_lead ON competitor_comparisons(lead_id);
CREATE INDEX IF NOT EXISTS idx_iron_triangle_reviews_lead ON iron_triangle_reviews(lead_id);
CREATE INDEX IF NOT EXISTS idx_intel_records_lead ON intel_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_intel_records_type ON intel_records(intel_type);
CREATE INDEX IF NOT EXISTS idx_ltc_weekly_tasks_lead ON ltc_weekly_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_ltc_weekly_tasks_week ON ltc_weekly_tasks(week_start);
CREATE INDEX IF NOT EXISTS idx_sales_leads_value_rating ON sales_leads(value_rating);
CREATE INDEX IF NOT EXISTS idx_sales_leads_ltc_stage ON sales_leads(ltc_stage);
CREATE INDEX IF NOT EXISTS idx_sales_leads_payment_risk ON sales_leads(payment_risk);

-- ============================================================
-- 10. Update existing data: value_rating based on score
-- ============================================================

UPDATE sales_leads SET value_rating = CASE
  WHEN score >= 80 THEN 'A'
  WHEN score >= 60 THEN 'B'
  WHEN score >= 40 THEN 'C'
  ELSE 'D'
END WHERE value_rating = 'D' AND score > 0;
