-- Huawei-style Sales Intelligence System - Database Migration
-- 将华为 LTC/MCR 逻辑降维为个人版作战情报系统
-- Created: 2026-04-03

-- ============================================================
-- 1. 升级 sales_leads 表：增加客户价值评级、竞争情报、风险预警
-- ============================================================

-- 客户价值评级 (A/B/C/D)
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS value_rating VARCHAR(4) DEFAULT 'D'
  CHECK (value_rating IN ('A', 'B', 'C', 'D'));
COMMENT ON COLUMN sales_leads.value_rating IS '华为客户价值评级: A=战略客户, B=重要客户, C=一般客户, D=观察客户';

-- 竞争情报
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS competitor_name VARCHAR(256);
COMMENT ON COLUMN sales_leads.competitor_name IS '主要竞争对手';

ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS competitor_advantage TEXT;
COMMENT ON COLUMN sales_leads.competitor_advantage IS '竞品优势/护城河分析';

ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS our_advantage TEXT;
COMMENT ON COLUMN sales_leads.our_advantage IS '我方差异化优势';

-- 风险预警
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS payment_risk VARCHAR(32) DEFAULT 'low'
  CHECK (payment_risk IN ('low', 'medium', 'high'));
COMMENT ON COLUMN sales_leads.payment_risk IS '回款风险等级';

ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS decision_cycle VARCHAR(32) DEFAULT 'unknown'
  CHECK (decision_cycle IN ('1_week', '2_weeks', '1_month', '1_quarter', 'long', 'unknown'));
COMMENT ON COLUMN sales_leads.decision_cycle IS '决策周期预估';

ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS need_prepayment BOOLEAN DEFAULT false;
COMMENT ON COLUMN sales_leads.need_prepayment IS '是否需要预付款(华为ATC合同评审)';

-- 预估金额
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(12, 2);
COMMENT ON COLUMN sales_leads.estimated_value IS '预估成交金额';

-- 行业标签
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS industry VARCHAR(128);
COMMENT ON COLUMN sales_leads.industry IS '客户所属行业';

-- 权力地图版本号
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS power_map_version INTEGER DEFAULT 0;
COMMENT ON COLUMN sales_leads.power_map_version IS '决策链(权力地图)更新版本号';

-- LTC 阶段 (华为 Lead to Cash 降维)
ALTER TABLE sales_leads ADD COLUMN IF NOT EXISTS ltc_stage VARCHAR(32) DEFAULT 'ML'
  CHECK (ltc_stage IN ('ML', 'MO', 'ATC', 'delivery', 'collection'));
COMMENT ON COLUMN sales_leads.ltc_stage IS 'LTC阶段: ML=线索管理, MO=机会管理, ATC=合同评审, delivery=交付, collection=回款';

-- ============================================================
-- 2. 新建决策链表 (Power Map) - 华为决策五角色
-- ============================================================

CREATE TABLE IF NOT EXISTS decision_makers (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  title VARCHAR(256),
  department VARCHAR(128),

  -- 华为五角色
  roles VARCHAR(64)[] DEFAULT '{}',
  COMMENT ON COLUMN decision_makers.roles IS '决策角色: initiator=发起者, influencer=影响者, decider=决策者, approver=批准者, buyer=使用者';

  -- 痛苦链 Pain Chain
  business_pain TEXT,
  COMMENT ON COLUMN decision_makers.business_pain IS '业务痛点(KPI压力)';
  personal_goal TEXT,
  COMMENT ON COLUMN decision_makers.personal_goal IS '个人诉求(Career目标)';
  fear_point TEXT,
  COMMENT ON COLUMN decision_makers.fear_point IS '恐惧点(担心什么)';

  -- 影响策略
  communication_style VARCHAR(32) DEFAULT 'data_driven'
    CHECK (communication_style IN ('data_driven', 'relationship', 'security', 'mixed')),
  COMMENT ON COLUMN decision_makers.communication_style IS '沟通密钥: data_driven=数据派, relationship=关系派, security=安全派';

  icebreaker TEXT,
  COMMENT ON COLUMN decision_makers.icebreaker IS '破冰内容(行业报告/案例等)';

  relationship_strength INTEGER DEFAULT 0 CHECK (relationship_strength BETWEEN 0 AND 100),
  COMMENT ON COLUMN decision_makers.relationship_strength IS '关系强度 0-100';

  last_contact TIMESTAMP WITH TIME ZONE,
  next_action TEXT,
  next_action_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,

  -- 铁三角视角覆盖
  ar_verified BOOLEAN DEFAULT false,
  COMMENT ON COLUMN decision_makers.ar_verified IS 'AR(客户经理)已验证关系';
  sr_verified BOOLEAN DEFAULT false,
  COMMENT ON COLUMN decision_makers.sr_verified IS 'SR(方案专家)已验证需求';
  fr_verified BOOLEAN DEFAULT false,
  COMMENT ON COLUMN decision_makers.fr_verified IS 'FR(交付经理)已验证交付能力';

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 决策链 RLS
ALTER TABLE decision_makers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dm_authenticated_all" ON decision_makers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 索引
CREATE INDEX IF NOT EXISTS idx_decision_makers_lead ON decision_makers(lead_id);

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

ALTER TABLE competitor_comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc_authenticated_all" ON competitor_comparisons
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_competitor_comparisons_lead ON competitor_comparisons(lead_id);

-- ============================================================
-- 4. 新建铁三角作战记录表
-- ============================================================

CREATE TABLE IF NOT EXISTS iron_triangle_reviews (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- AR 客户经理视角
  ar_coverage TEXT,
  COMMENT ON COLUMN iron_triangle_reviews.ar_coverage IS 'AR: 决策链中谁还没见过? 关系到位了吗?';
  ar_next_step TEXT,
  COMMENT ON COLUMN iron_triangle_reviews.ar_next_step IS 'AR: 下次接触计划';

  -- SR 方案专家视角
  sr_pain_match TEXT,
  COMMENT ON COLUMN iron_triangle_reviews.sr_pain_match IS 'SR: 方案匹配痛点吗? 针对业务痛点还是个人诉求?';
  sr_proposal_status TEXT,
  COMMENT ON COLUMN iron_triangle_reviews.sr_proposal_status IS 'SR: 提案状态和改进方向';

  -- FR 交付经理视角
  fr_delivery_risk TEXT,
  COMMENT ON COLUMN iron_triangle_reviews.fr_delivery_risk IS 'FR: 交付周期和风险是什么?';
  fr_payment_plan TEXT,
  COMMENT ON COLUMN iron_triangle_reviews.fr_payment_plan IS 'FR: 回款计划和预付款条款';

  -- 总结
  overall_action_plan TEXT,
  win_probability INTEGER CHECK (win_probability BETWEEN 0 AND 100),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE iron_triangle_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itr_authenticated_all" ON iron_triangle_reviews
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_iron_triangle_reviews_lead ON iron_triangle_reviews(lead_id);

-- ============================================================
-- 5. 新建情报收集记录表 (华为"两看")
-- ============================================================

CREATE TABLE IF NOT EXISTS intel_records (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES sales_leads(id) ON DELETE CASCADE,
  intel_type VARCHAR(32) NOT NULL CHECK (intel_type IN ('customer_public', 'competitor', 'industry', 'other')),
  source VARCHAR(128) NOT NULL,
  COMMENT ON COLUMN intel_records.source IS '情报来源: 企查查/官网/招聘/招标网/客户反馈等';
  title VARCHAR(256) NOT NULL,
  content TEXT,
  impact TEXT,
  COMMENT ON COLUMN intel_records.impact IS '对销售策略的影响';
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE intel_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ir_authenticated_all" ON intel_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_intel_records_lead ON intel_records(lead_id);
CREATE INDEX IF NOT EXISTS idx_intel_records_type ON intel_records(intel_type);

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

ALTER TABLE ltc_weekly_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ltc_authenticated_all" ON ltc_weekly_tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ltc_weekly_tasks_lead ON ltc_weekly_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_ltc_weekly_tasks_week ON ltc_weekly_tasks(week_start);

-- ============================================================
-- 7. Triggers for updated_at
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
-- 8. 更新现有数据的 value_rating (基于现有 score)
-- ============================================================

UPDATE sales_leads SET value_rating = CASE
  WHEN score >= 80 THEN 'A'
  WHEN score >= 60 THEN 'B'
  WHEN score >= 40 THEN 'C'
  ELSE 'D'
END WHERE value_rating = 'D' AND score > 0;

-- ============================================================
-- 9. 新增索引
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_sales_leads_value_rating ON sales_leads(value_rating);
CREATE INDEX IF NOT EXISTS idx_sales_leads_ltc_stage ON sales_leads(ltc_stage);
CREATE INDEX IF NOT EXISTS idx_sales_leads_payment_risk ON sales_leads(payment_risk);
