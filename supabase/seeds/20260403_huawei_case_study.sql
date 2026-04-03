-- ============================================================
-- 华为案例数据填充 - Huawei Case Study Seed Data
-- 以华为为标杆案例，展示销售情报系统所有功能模块
-- ============================================================

-- ============================================================
-- 1. 创建华为相关销售线索 (sales_leads)
-- ============================================================

-- Lead 1: 中国移动 - 5G 核心网项目 (A级战略客户)
INSERT INTO sales_leads (
  name, company, title, email, phone, status, source, score,
  ai_insights, suggested_actions,
  value_rating, competitor_name, competitor_advantage, our_advantage,
  payment_risk, decision_cycle, need_prepayment, estimated_value, industry,
  power_map_version, ltc_stage, last_contact, next_follow_up
) VALUES (
  '张伟', '中国移动通信集团', '网络建设部副总经理',
  'zhangwei@chinamobile.com', '010-5268-8888',
  'proposal', 'referral', 92,
  ARRAY['5G核心网扩容需求明确，预算已批复', '与华为有历史合作基础', '决策链清晰，3个月内可能签约'],
  ARRAY['安排技术交流会', '提交定制化方案', '推进POC验证'],
  'A', '爱立信', '品牌影响力强，欧洲技术路线', '端到端交付能力，性价比更高，本地化服务',
  'low', '1_quarter', false, 28500000, '电信运营商',
  2, 'MO', '2026-03-28 14:00:00+08:00', '2026-04-08 10:00:00+08:00'
) ON CONFLICT DO NOTHING;

-- Lead 2: 比亚迪 - 智能工厂项目 (B级重点客户)
INSERT INTO sales_leads (
  name, company, title, email, phone, status, source, score,
  ai_insights, suggested_actions,
  value_rating, competitor_name, competitor_advantage, our_advantage,
  payment_risk, decision_cycle, need_prepayment, estimated_value, industry,
  power_map_version, ltc_stage, last_contact, next_follow_up
) VALUES (
  '李明', '比亚迪股份有限公司', '智能制造中心总监',
  'liming@byd.com', '0755-8988-6666',
  'qualified', 'outbound', 78,
  ARRAY['智能工厂改造需求刚启动', '西门子已介入', '预算规模约1500万'],
  ARRAY['快速安排POC演示', '准备与西门子差异化方案', '找到内部支持者'],
  'B', '西门子', '工业自动化领域权威，客户信任度高', '5G+工业互联网融合方案，部署周期短40%',
  'medium', '1_quarter', true, 15000000, '新能源汽车制造',
  1, 'ML', '2026-03-25 16:30:00+08:00', '2026-04-05 09:00:00+08:00'
) ON CONFLICT DO NOTHING;

-- Lead 3: 平安银行 - 数据中心升级 (A级战略客户)
INSERT INTO sales_leads (
  name, company, title, email, phone, status, source, score,
  ai_insights, suggested_actions,
  value_rating, competitor_name, competitor_advantage, our_advantage,
  payment_risk, decision_cycle, need_prepayment, estimated_value, industry,
  power_map_version, ltc_stage, last_contact, next_follow_up
) VALUES (
  '王芳', '平安银行股份有限公司', '信息技术部总经理',
  'wangfang@pingan.com', '0755-2588-9999',
  'negotiation', 'inbound', 88,
  ARRAY['金融级安全认证是关键门槛', '已通过技术评审', '商务条款进入最后谈判'],
  ARRAY['推进合同签署', '确认交付里程碑', '安排预付款条款'],
  'A', 'IBM', '金融行业老牌供应商，合规经验丰富', '国产化替代优势，信创认证，响应速度快',
  'low', '2_weeks', true, 32000000, '金融银行',
  3, 'ATC', '2026-04-01 10:00:00+08:00', '2026-04-06 14:00:00+08:00'
) ON CONFLICT DO NOTHING;

-- Lead 4: 南方电网 - 电力物联网 (B级重点客户)
INSERT INTO sales_leads (
  name, company, title, email, phone, status, source, score,
  ai_insights, suggested_actions,
  value_rating, competitor_name, competitor_advantage, our_advantage,
  payment_risk, decision_cycle, need_prepayment, estimated_value, industry,
  power_map_version, ltc_stage, last_contact, next_follow_up
) VALUES (
  '陈刚', '中国南方电网有限责任公司', '数字化部副总经理',
  'chengang@csg.cn', '020-3812-5555',
  'contacted', 'exhibition', 65,
  ARRAY['电力物联网标准刚发布', '国网已先行试点', '预算在Q3确定'],
  ARRAY['持续技术交流', '邀请参观标杆案例', '准备行业白皮书'],
  'B', '国家电网信通', '集团内部供应商优先', '差异化技术方案，边缘计算优势',
  'medium', '1_month', false, 18000000, '电力能源',
  0, 'ML', '2026-03-20 11:00:00+08:00', '2026-04-10 09:30:00+08:00'
) ON CONFLICT DO NOTHING;

-- Lead 5: 顺丰科技 - 智慧物流 (C级标准客户)
INSERT INTO sales_leads (
  name, company, title, email, phone, status, source, score,
  ai_insights, suggested_actions,
  value_rating, competitor_name, competitor_advantage, our_advantage,
  payment_risk, decision_cycle, need_prepayment, estimated_value, industry,
  power_map_version, ltc_stage, last_contact, next_follow_up
) VALUES (
  '刘洋', '顺丰科技有限公司', 'CTO',
  'liuyang@sf-tech.com', '0755-2688-3333',
  'new', 'cold_call', 45,
  ARRAY['顺丰正在自研部分系统', '竞争激烈', '决策流程长'],
  ARRAY['了解技术需求', '安排产品演示', '建立技术关系'],
  'C', '菜鸟网络', '阿里生态优势', '通信网络基础设施能力，边缘节点覆盖',
  'high', 'long', false, 5000000, '物流快递',
  0, 'ML', NULL, '2026-04-15 14:00:00+08:00'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 获取插入的 lead_id
-- ============================================================
-- Note: We use subqueries to dynamically get the IDs

-- ============================================================
-- 2. 决策链数据 (decision_makers) - Power Map
-- ============================================================

-- Lead 1 (中国移动) 的决策链 - 5G核心网项目
INSERT INTO decision_makers (lead_id, name, title, department, roles, business_pain, personal_goal, fear_point, communication_style, icebreaker, relationship_strength, ar_verified, sr_verified, fr_verified, next_action, next_action_date, notes)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '中国移动通信集团' LIMIT 1),
  '张伟', '网络建设部副总经理', '网络建设部',
  ARRAY['influencer', 'buyer'],
  '5G核心网扩容进度落后计划3个月，集团KPI考核压力巨大',
  '推动5G SA核心网全面商用，争取晋升集团副总',
  '项目延期会被问责，技术选型失败影响职业前景',
  'data_driven', '去年在深圳华为总部参观过5G展厅，对端到端方案印象深刻',
  75, true, true, false,
  '安排POC环境搭建，演示核心网切片能力', '2026-04-08 10:00:00+08:00',
  '关键技术决策者，对华为方案有好感'
) ON CONFLICT DO NOTHING;

INSERT INTO decision_makers (lead_id, name, title, department, roles, business_pain, personal_goal, fear_point, communication_style, icebreaker, relationship_strength, ar_verified, sr_verified, fr_verified, next_action, next_action_date, notes)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '中国移动通信集团' LIMIT 1),
  '赵强', '技术部总经理', '技术部',
  ARRAY['initiator', 'influencer'],
  '现网设备老化严重，运维成本年增30%，急需升级',
  '主导下一代网络架构设计，建立行业技术影响力',
  '新技术导入风险，担心被供应商锁定',
  'data_driven', '北邮同学，共同参加过3GPP标准会议',
  60, true, true, true,
  '邀请参加技术架构评审会', '2026-04-10 14:00:00+08:00',
  '技术把关人，需要用数据说话'
) ON CONFLICT DO NOTHING;

INSERT INTO decision_makers (lead_id, name, title, department, roles, business_pain, personal_goal, fear_point, communication_style, icebreaker, relationship_strength, ar_verified, sr_verified, fr_verified, next_action, next_action_date, notes)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '中国移动通信集团' LIMIT 1),
  '孙丽', '采购部总监', '采购部',
  ARRAY['approver'],
  '采购成本优化指标：年度降本15%，供应链安全',
  '建立阳光采购标杆，年底评优',
  '审计风险，合规问题',
  'data_driven', NULL,
  40, true, false, false,
  NULL, NULL,
  '商务决策审批人，关注价格和合同条款'
) ON CONFLICT DO NOTHING;

INSERT INTO decision_makers (lead_id, name, title, department, roles, business_pain, personal_goal, fear_point, communication_style, icebreaker, relationship_strength, ar_verified, sr_verified, fr_verified, next_action, next_action_date, notes)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '中国移动通信集团' LIMIT 1),
  '刘总', '副总裁', '集团管理层',
  ARRAY['decider'],
  '集团数字化转型战略推进，5G投资回报率压力',
  '推动中国移动成为全球5G领导者，争取更高职位',
  '大规模投资后效果不达预期，影响集团业绩',
  'security', '高尔夫球友的介绍认识',
  30, true, false, false,
  '安排高层拜访，汇报项目方案和ROI', '2026-04-15 10:00:00+08:00',
  '最终决策者，需要从战略层面沟通'
) ON CONFLICT DO NOTHING;

-- Lead 2 (比亚迪) 的决策链 - 智能工厂项目
INSERT INTO decision_makers (lead_id, name, title, department, roles, business_pain, personal_goal, fear_point, communication_style, icebreaker, relationship_strength, ar_verified, sr_verified, fr_verified, next_action, next_action_date, notes)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '比亚迪股份有限公司' LIMIT 1),
  '李明', '智能制造中心总监', '智能制造中心',
  ARRAY['initiator', 'influencer'],
  '产线自动化率仅35%，低于特斯拉的75%，集团要求2年内提升到60%',
  '打造行业标杆智能工厂，成为比亚迪数字化转型的核心推动者',
  '项目失败会被认为能力不足，影响在集团的话语权',
  'data_driven', '参观过特斯拉上海超级工厂，希望对标学习',
  55, true, true, false,
  '安排技术交流会，展示5G+工业互联网方案', '2026-04-05 09:00:00+08:00',
  '需求发起人，有强烈意愿推进'
) ON CONFLICT DO NOTHING;

INSERT INTO decision_makers (lead_id, name, title, department, roles, business_pain, personal_goal, fear_point, communication_style, icebreaker, relationship_strength, ar_verified, sr_verified, fr_verified, next_action, next_action_date, notes)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '比亚迪股份有限公司' LIMIT 1),
  '王建国', '副总裁', '集团管理层',
  ARRAY['decider'],
  '集团毛利率持续下滑，需要通过数字化降本增效',
  '推动比亚迪制造体系全面超越特斯拉',
  '大规模投资后效率提升不明显',
  'security', NULL,
  20, false, false, false,
  NULL, NULL,
  '最终拍板人，需要从投资回报角度说服'
) ON CONFLICT DO NOTHING;

-- Lead 3 (平安银行) 的决策链 - 数据中心升级
INSERT INTO decision_makers (lead_id, name, title, department, roles, business_pain, personal_goal, fear_point, communication_style, icebreaker, relationship_strength, ar_verified, sr_verified, fr_verified, next_action, next_action_date, notes)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '平安银行股份有限公司' LIMIT 1),
  '王芳', '信息技术部总经理', '信息技术部',
  ARRAY['influencer', 'buyer'],
  '数据中心年运维成本超2亿，信创改造压力紧迫',
  '完成信创替代KPI，成为银行业数字化转型标杆',
  '系统迁移过程中出现安全事故',
  'data_driven', '去年金融科技论坛上认识的',
  85, true, true, true,
  '确认合同细节，推动签约', '2026-04-06 14:00:00+08:00',
  '核心推动者，关系非常好'
) ON CONFLICT DO NOTHING;

INSERT INTO decision_makers (lead_id, name, title, department, roles, business_pain, personal_goal, fear_point, communication_style, icebreaker, relationship_strength, ar_verified, sr_verified, fr_verified, next_action, next_action_date, notes)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '平安银行股份有限公司' LIMIT 1),
  '周明远', '首席信息官CIO', '高管层',
  ARRAY['decider', 'approver'],
  '监管要求2027年前完成核心系统信创替代',
  '带领平安银行科技实力进入行业前三',
  '信创迁移风险导致业务中断',
  'security', '通过共同的朋友介绍，已在饭局上见过',
  65, true, true, false,
  '高层拜访，确认最终商务条款', '2026-04-08 19:00:00+08:00',
  '最终决策者，需要从合规和战略角度沟通'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. 竞品对比数据 (competitor_comparisons)
-- ============================================================

-- Lead 1 (中国移动) - vs 爱立信
INSERT INTO competitor_comparisons (lead_id, competitor_name, competitor_solution, competitor_price_range, competitor_delivery_cycle, competitor_strengths, competitor_weaknesses, our_differentiator)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '中国移动通信集团' LIMIT 1),
  '爱立信', '5G核心网全栈解决方案（Ericsson Cloud Core）',
  '¥3200-3800万', '6-9个月',
  '全球5G核心网市场份额第一，欧洲运营商标杆案例丰富，3GPP标准核心贡献者',
  '价格偏高20-30%，本地化服务团队不足，定制化能力弱，响应速度慢',
  '端到端国产化方案，部署周期缩短40%（4-6个月），7x24小时本地支持，性价比高30%'
) ON CONFLICT DO NOTHING;

INSERT INTO competitor_comparisons (lead_id, competitor_name, competitor_solution, competitor_price_range, competitor_delivery_cycle, competitor_strengths, competitor_weaknesses, our_differentiator)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '中国移动通信集团' LIMIT 1),
  '中兴通讯', '5G核心网 Common Core 解决方案',
  '¥2200-2800万', '5-8个月',
  '价格有优势，与中国移动历史合作基础好，国内市场份额第二',
  '高端技术能力不如华为和爱立信，国际化经验不足，部分核心芯片依赖进口',
  '芯片自研优势，高端技术领先，全球化交付经验，完整生态体系'
) ON CONFLICT DO NOTHING;

-- Lead 2 (比亚迪) - vs 西门子
INSERT INTO competitor_comparisons (lead_id, competitor_name, competitor_solution, competitor_price_range, competitor_delivery_cycle, competitor_strengths, competitor_weaknesses, our_differentiator)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '比亚迪股份有限公司' LIMIT 1),
  '西门子', 'Siemens MindSphere 工业物联网平台 + SIMATIC自动化',
  '¥1800-2200万', '12-18个月',
  '工业自动化百年品牌，汽车行业案例丰富（宝马、奔驰），PLM全流程覆盖',
  '系统封闭性强，部署周期长，定制化成本高，缺乏5G通信能力',
  '5G+工业互联网融合方案，部署周期缩短40%，开放架构支持快速集成，边缘计算能力强'
) ON CONFLICT DO NOTHING;

INSERT INTO competitor_comparisons (lead_id, competitor_name, competitor_solution, competitor_price_range, competitor_delivery_cycle, competitor_strengths, competitor_weaknesses, our_differentiator)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '比亚迪股份有限公司' LIMIT 1),
  '海尔卡奥斯', 'COSMOPlat 工业互联网平台',
  '¥800-1200万', '6-10个月',
  '价格有优势，国内制造业案例多，政府背书强',
  '汽车行业经验不足，技术深度不够，大型产线交付能力有限',
  '端到端通信+计算+控制方案，汽车行业已有成功案例（小鹏、理想），技术深度和交付能力更强'
) ON CONFLICT DO NOTHING;

-- Lead 3 (平安银行) - vs IBM
INSERT INTO competitor_comparisons (lead_id, competitor_name, competitor_solution, competitor_price_range, competitor_delivery_cycle, competitor_strengths, competitor_weaknesses, our_differentiator)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '平安银行股份有限公司' LIMIT 1),
  'IBM', 'IBM Cloud for Financial Services + z/OS迁移方案',
  '¥3500-4000万', '8-12个月',
  '金融行业全球领导者，安全合规经验丰富，IBM Z系列稳定可靠',
  '价格昂贵，信创合规性存疑（外资企业），本地化团队缩减，技术更新慢',
  '完全信创合规，金融级安全认证，国产化替代无缝迁移，价格优势25%，本地化7x24支持'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 4. 铁三角评审 (iron_triangle_reviews)
-- ============================================================

-- Lead 1 (中国移动) - 铁三角评审
INSERT INTO iron_triangle_reviews (lead_id, review_date, ar_coverage, ar_next_step, sr_pain_match, sr_proposal_status, fr_delivery_risk, fr_payment_plan, overall_action_plan, win_probability)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '中国移动通信集团' LIMIT 1),
  '2026-03-28 14:00:00+08:00',
  '已拜访：张伟(网络建设部)、赵强(技术部)、孙丽(采购部)。未拜访：刘总(副总裁)。整体关系覆盖75%，技术线和采购线关系良好。',
  '4月8日安排张伟POC环境搭建，4月10日邀请赵强参加架构评审，4月15日安排高层拜访刘总',
  '痛点匹配度85%：核心网扩容、运维成本优化、SA商用三大核心需求均有对应方案。切片能力POC需重点展示。',
  '技术方案V2已提交，等待技术评审反馈。需补充：性能压测数据、与其他省公司部署案例、运维工具对比',
  '交付风险低：核心网产品成熟度高，已有20+省公司部署经验。注意：需提前确认机房环境和传输资源',
  '中国移动年度框架协议付款，预付30%，验收70%。信用风险极低。',
  '1. POC环境搭建（本周） 2. 技术评审（4/10） 3. 高层拜访（4/15） 4. 商务报价（4/20） 5. 合同签署（5月初）',
  72
) ON CONFLICT DO NOTHING;

-- Lead 2 (比亚迪) - 铁三角评审
INSERT INTO iron_triangle_reviews (lead_id, review_date, ar_coverage, ar_next_step, sr_pain_match, sr_proposal_status, fr_delivery_risk, fr_payment_plan, overall_action_plan, win_probability)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '比亚迪股份有限公司' LIMIT 1),
  '2026-03-25 16:30:00+08:00',
  '已拜访：李明(智能制造中心)。未拜访：王建国(副总裁)。整体关系覆盖40%，缺乏高层关系。',
  '4月5日安排技术交流会，4月内争取拜访王建国副总裁',
  '痛点匹配度70%：自动化率提升需求匹配，但缺乏汽车行业深度案例。需补充与小鹏、理想的合作案例。',
  '方案框架已提交，需细化：ROI分析、与西门子的详细对比、分阶段实施计划',
  '中等风险：汽车工厂数字化改造复杂度高，需协调多个产线。建议分阶段交付。',
  '比亚迪要求30%预付，分三期支付。付款信用中等，需关注回款节奏。',
  '1. 技术交流会（4/5） 2. 提交详细方案（4/15） 3. 拜访副总裁（4/20） 4. POC验证（5月）',
  45
) ON CONFLICT DO NOTHING;

-- Lead 3 (平安银行) - 铁三角评审
INSERT INTO iron_triangle_reviews (lead_id, review_date, ar_coverage, ar_next_step, sr_pain_match, sr_proposal_status, fr_delivery_risk, fr_payment_plan, overall_action_plan, win_probability)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '平安银行股份有限公司' LIMIT 1),
  '2026-04-01 10:00:00+08:00',
  '已拜访：王芳(信息技术部)、周明远(CIO)。关系覆盖90%，所有关键决策者均已接触。',
  '4月6日确认合同细节，4月8日高层饭局推进最终签约',
  '痛点匹配度95%：信创替代、数据中心升级、安全合规三大需求完全匹配。技术方案已通过评审。',
  '方案已通过技术评审，商务条款进入最终谈判。待确认：维保年限、SLA标准、数据迁移服务',
  '低风险：方案成熟，团队经验丰富。注意：金融数据迁移需特别关注安全审计。',
  '平安银行预付30%，分三期支付（30-40-30）。银团付款，信用风险极低。',
  '1. 商务条款确认（4/6） 2. 高层确认（4/8） 3. 合同签署（4/10） 4. 项目启动（4/15）',
  88
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. 情报记录 (intel_records) - 华为"两看"
-- ============================================================

-- Lead 1 (中国移动) 情报
INSERT INTO intel_records (lead_id, intel_type, source, title, content, impact, recorded_at)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '中国移动通信集团' LIMIT 1),
  'customer_public', '中国移动2025年报', '中国移动2025年资本开支计划公布',
  '2025年资本开支1850亿元，其中5G投资占比45%约830亿。SA核心网是重点投资方向，计划覆盖所有地级市。',
  '预算充足，项目必投。需把握窗口期快速推进。',
  '2026-03-20 09:00:00+08:00'
) ON CONFLICT DO NOTHING;

INSERT INTO intel_records (lead_id, intel_type, source, title, content, impact, recorded_at)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '中国移动通信集团' LIMIT 1),
  'competitor', '行业消息', '爱立信与中国移动签署5G核心网框架协议',
  '爱立信已与中国移动签署2025-2026年5G核心网框架协议，但具体项目需单独招标。框架协议不代表项目锁定。',
  '有竞争压力，但框架协议不排除其他供应商参与具体项目投标。',
  '2026-03-22 14:00:00+08:00'
) ON CONFLICT DO NOTHING;

INSERT INTO intel_records (lead_id, intel_type, source, title, content, impact, recorded_at)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '中国移动通信集团' LIMIT 1),
  'customer_public', '企查查', '中国移动网络建设部组织架构调整',
  '张伟由网络建设部副总监升任副总经理，职责扩大。新设5G核心网专项组，赵强任组长。',
  '张伟决策权增大，赵强在技术选型上话语权增强。应重点维护这两位的关系。',
  '2026-03-15 11:00:00+08:00'
) ON CONFLICT DO NOTHING;

INSERT INTO intel_records (lead_id, intel_type, source, title, content, impact, recorded_at)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '中国移动通信集团' LIMIT 1),
  'industry', '工信部', '工信部发布5G应用扬帆行动计划',
  '工信部要求2025年底实现5G SA网络全覆盖，推动核心网切片商用。运营商需在Q3前完成核心网升级。',
  '政策驱动，时间窗口明确。有助于加速客户决策。',
  '2026-03-18 10:00:00+08:00'
) ON CONFLICT DO NOTHING;

-- Lead 2 (比亚迪) 情报
INSERT INTO intel_records (lead_id, intel_type, source, title, content, impact, recorded_at)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '比亚迪股份有限公司' LIMIT 1),
  'customer_public', '比亚迪年报', '比亚迪2025年年报：智能制造投入加大',
  '比亚迪2025年研发投入超400亿元，其中智能制造占比15%约60亿。明确提出"打造灯塔工厂"目标。',
  '预算充足，需求真实。60亿智能制造预算中，我们的目标份额约1500万。',
  '2026-03-20 16:00:00+08:00'
) ON CONFLICT DO NOTHING;

INSERT INTO intel_records (lead_id, intel_type, source, title, content, impact, recorded_at)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '比亚迪股份有限公司' LIMIT 1),
  'competitor', '西门子官网', '西门子与比亚迪签署智能制造MOU',
  '西门子与比亚迪签署智能制造合作谅解备忘录，但尚未签订具体项目合同。MOU有效期6个月。',
  '有竞争压力但尚未锁定。需在MOU有效期内展示差异化优势，争取项目机会。',
  '2026-03-25 09:00:00+08:00'
) ON CONFLICT DO NOTHING;

INSERT INTO intel_records (lead_id, intel_type, source, title, content, impact, recorded_at)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '比亚迪股份有限公司' LIMIT 1),
  'customer_public', '猎聘网', '比亚迪智能制造中心大量招聘',
  '比亚迪智能制造中心正在大量招聘：工业互联网架构师、MES产品经理、自动化工程师等20+岗位。',
  '说明项目即将启动，团队正在组建。是切入的好时机。',
  '2026-03-28 08:00:00+08:00'
) ON CONFLICT DO NOTHING;

-- Lead 3 (平安银行) 情报
INSERT INTO intel_records (lead_id, intel_type, source, title, content, impact, recorded_at)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '平安银行股份有限公司' LIMIT 1),
  'customer_public', '银保监会', '银保监会发布金融信创时间表',
  '银保监会要求全国性商业银行2027年前完成核心系统信创替代。2025年底前完成方案设计，2026年开始实施。',
  '强制合规要求，项目势在必行。时间窗口明确，有利于推进签约。',
  '2026-03-10 10:00:00+08:00'
) ON CONFLICT DO NOTHING;

INSERT INTO intel_records (lead_id, intel_type, source, title, content, impact, recorded_at)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '平安银行股份有限公司' LIMIT 1),
  'competitor', '内部消息', 'IBM平安银行团队缩减',
  'IBM金融业务团队从15人缩减至8人，部分资深顾问离职。服务响应速度明显下降。',
  '竞争对手实力下降，是我们的机会。可以强调服务能力和团队规模优势。',
  '2026-03-30 14:00:00+08:00'
) ON CONFLICT DO NOTHING;

INSERT INTO intel_records (lead_id, intel_type, source, title, content, impact, recorded_at)
VALUES (
  (SELECT id FROM sales_leads WHERE company = '平安银行股份有限公司' LIMIT 1),
  'customer_public', '财经新闻', '平安银行2025年报：科技投入超200亿',
  '平安银行2025年科技投入218亿元，占营收5.2%。IT团队超1万人。信创改造预算占比30%约65亿。',
  '预算规模巨大，我们的3.2亿只是冰山一角。如果首期项目成功，有持续合作机会。',
  '2026-04-01 08:00:00+08:00'
) ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. LTC 周循环任务 (ltc_weekly_tasks)
-- ============================================================

-- Lead 1 (中国移动) LTC任务 - 本周
INSERT INTO ltc_weekly_tasks (lead_id, week_start, phase, task_description, completed, completed_at, notes)
VALUES
  ((SELECT id FROM sales_leads WHERE company = '中国移动通信集团' LIMIT 1), '2026-03-31', 'MO_deep_update', '更新决策链关系强度评分，确认最新沟通状态', true, '2026-04-01 10:00:00+08:00', '张伟关系提升到75分'),
  ((SELECT id FROM sales_leads WHERE company = '中国移动通信集团' LIMIT 1), '2026-03-31', 'MO_strategy', '准备与爱立信的差异化竞争策略文档', false, NULL, '重点突出部署周期和性价比优势'),
  ((SELECT id FROM sales_leads WHERE company = '中国移动通信集团' LIMIT 1), '2026-03-31', 'MO_deep_update', '收集核心网切片POC的测试数据', true, '2026-04-02 16:00:00+08:00', '数据已准备完毕'),
  ((SELECT id FROM sales_leads WHERE company = '中国移动通信集团' LIMIT 1), '2026-03-31', 'MO_strategy', '安排高层拜访刘总的行程和汇报材料', false, NULL, '需要VP级别陪同'),
  ((SELECT id FROM sales_leads WHERE company = '中国移动通信集团' LIMIT 1), '2026-03-31', 'ATC_review', '准备商务报价方案', false, NULL, '需与采购部孙丽确认报价模板要求')
ON CONFLICT DO NOTHING;

-- Lead 2 (比亚迪) LTC任务 - 本周
INSERT INTO ltc_weekly_tasks (lead_id, week_start, phase, task_description, completed, completed_at, notes)
VALUES
  ((SELECT id FROM sales_leads WHERE company = '比亚迪股份有限公司' LIMIT 1), '2026-03-31', 'ML_value_email', '发送智能制造价值邮件（行业趋势+案例分享）', true, '2026-04-01 09:00:00+08:00', '李明已回复确认参会'),
  ((SELECT id FROM sales_leads WHERE company = '比亚迪股份有限公司' LIMIT 1), '2026-03-31', 'MO_deep_update', '准备比亚迪产线调研材料', false, NULL, '需要了解比亚迪现有自动化水平'),
  ((SELECT id FROM sales_leads WHERE company = '比亚迪股份有限公司' LIMIT 1), '2026-03-31', 'MO_deep_update', '收集小鹏、理想工厂案例数据', false, NULL, '需要产品团队配合准备'),
  ((SELECT id FROM sales_leads WHERE company = '比亚迪股份有限公司' LIMIT 1), '2026-03-31', 'ML_clean', '整理比亚迪项目CRM信息，补充决策链数据', true, '2026-03-31 15:00:00+08:00', '已录入王建国副总裁信息')
ON CONFLICT DO NOTHING;

-- Lead 3 (平安银行) LTC任务 - 本周
INSERT INTO ltc_weekly_tasks (lead_id, week_start, phase, task_description, completed, completed_at, notes)
VALUES
  ((SELECT id FROM sales_leads WHERE company = '平安银行股份有限公司' LIMIT 1), '2026-03-31', 'ATC_review', '确认合同最终条款', false, NULL, '法务审核中，关注维保和SLA条款'),
  ((SELECT id FROM sales_leads WHERE company = '平安银行股份有限公司' LIMIT 1), '2026-03-31', 'ATC_review', '准备项目启动会材料', false, NULL, '合同签署后即启动'),
  ((SELECT id FROM sales_leads WHERE company = '平安银行股份有限公司' LIMIT 1), '2026-03-31', 'ATC_review', '安排高层饭局（周明远CIO）', false, NULL, '4月8日晚，已确认地点'),
  ((SELECT id FROM sales_leads WHERE company = '平安银行股份有限公司' LIMIT 1), '2026-03-31', 'collection', '确认预付款条款和发票信息', true, '2026-04-01 11:00:00+08:00', '预付30%，已确认开票信息')
ON CONFLICT DO NOTHING;

-- Lead 4 (南方电网) LTC任务 - 本周
INSERT INTO ltc_weekly_tasks (lead_id, week_start, phase, task_description, completed, completed_at, notes)
VALUES
  ((SELECT id FROM sales_leads WHERE company = '中国南方电网有限责任公司' LIMIT 1), '2026-03-31', 'ML_value_email', '发送电力物联网行业白皮书', false, NULL, '需联合市场部编写'),
  ((SELECT id FROM sales_leads WHERE company = '中国南方电网有限责任公司' LIMIT 1), '2026-03-31', 'ML_clean', '整理南方电网组织架构和决策链', false, NULL, '需从公开渠道收集信息'),
  ((SELECT id FROM sales_leads WHERE company = '中国南方电网有限责任公司' LIMIT 1), '2026-03-31', 'ML_value_email', '邀请参加智慧能源峰会', false, NULL, '4月15日在广州举办')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 完成 - 数据验证查询
-- ============================================================
-- 验证命令（执行后检查）：
-- SELECT company, value_rating, ltc_stage, estimated_value FROM sales_leads WHERE company LIKE '%中国%' OR company LIKE '%比亚迪%' OR company LIKE '%平安%' OR company LIKE '%顺丰%' ORDER BY value_rating;
-- SELECT dm.name, dm.title, dm.roles, l.company FROM decision_makers dm JOIN sales_leads l ON dm.lead_id = l.id;
-- SELECT cc.competitor_name, l.company FROM competitor_comparisons cc JOIN sales_leads l ON cc.lead_id = l.id;
-- SELECT itr.win_probability, l.company FROM iron_triangle_reviews itr JOIN sales_leads l ON itr.lead_id = l.id ORDER BY itr.review_date DESC;
-- SELECT ir.intel_type, ir.title, l.company FROM intel_records ir JOIN sales_leads l ON ir.lead_id = l.id ORDER BY ir.recorded_at DESC;
-- SELECT lt.phase, lt.task_description, lt.completed, l.company FROM ltc_weekly_tasks lt JOIN sales_leads l ON lt.lead_id = l.id;
