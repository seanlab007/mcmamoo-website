// Seed Huawei Case Study Data via Supabase REST API
// Usage: node supabase/seeds/seed-huawei-case.mjs

const SUPABASE_URL = 'https://fczherphuixpdjuevzsh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY0MzQ5MSwiZXhwIjoyMDg5MjE5NDkxfQ.XgyphQNQtmOPx1hFl5WyL5W_FCLOW8iX6k5ryf9KNIg';

const headers = {
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

async function fetchApi(table, method, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`  ERROR ${res.status} on ${table}: ${text}`);
    return null;
  }
  if (method === 'POST') {
    const data = await res.json();
    return data;
  }
  return true;
}

async function main() {
  console.log('Seeding Huawei Case Study Data...\n');

  // ============ 1. Create Sales Leads ============
  console.log('1. Creating sales leads...');

  const leads = [
    {
      name: '张伟', company: '中国移动通信集团', title: '网络建设部副总经理',
      email: 'zhangwei@chinamobile.com', phone: '010-5268-8888',
      status: 'proposal', source: 'referral', score: 92,
      ai_insights: ['5G核心网扩容需求明确，预算已批复', '与华为有历史合作基础', '决策链清晰，3个月内可能签约'],
      suggested_actions: ['安排技术交流会', '提交定制化方案', '推进POC验证'],
      value_rating: 'A', competitor_name: '爱立信',
      competitor_advantage: '品牌影响力强，欧洲技术路线',
      our_advantage: '端到端交付能力，性价比更高，本地化服务',
      payment_risk: 'low', decision_cycle: '1_quarter', need_prepayment: false,
      estimated_value: 28500000, industry: '电信运营商',
      power_map_version: 2, ltc_stage: 'MO',
      last_contact: '2026-03-28T14:00:00+08:00', next_follow_up: '2026-04-08T10:00:00+08:00',
    },
    {
      name: '李明', company: '比亚迪股份有限公司', title: '智能制造中心总监',
      email: 'liming@byd.com', phone: '0755-8988-6666',
      status: 'qualified', source: 'cold_outreach', score: 78,
      ai_insights: ['智能工厂改造需求刚启动', '西门子已介入', '预算规模约1500万'],
      suggested_actions: ['快速安排POC演示', '准备与西门子差异化方案', '找到内部支持者'],
      value_rating: 'B', competitor_name: '西门子',
      competitor_advantage: '工业自动化领域权威，客户信任度高',
      our_advantage: '5G+工业互联网融合方案，部署周期短40%',
      payment_risk: 'medium', decision_cycle: '1_quarter', need_prepayment: true,
      estimated_value: 15000000, industry: '新能源汽车制造',
      power_map_version: 1, ltc_stage: 'ML',
      last_contact: '2026-03-25T16:30:00+08:00', next_follow_up: '2026-04-05T09:00:00+08:00',
    },
    {
      name: '王芳', company: '平安银行股份有限公司', title: '信息技术部总经理',
      email: 'wangfang@pingan.com', phone: '0755-2588-9999',
      status: 'negotiation', source: 'event', score: 88,
      ai_insights: ['金融级安全认证是关键门槛', '已通过技术评审', '商务条款进入最后谈判'],
      suggested_actions: ['推进合同签署', '确认交付里程碑', '安排预付款条款'],
      value_rating: 'A', competitor_name: 'IBM',
      competitor_advantage: '金融行业老牌供应商，合规经验丰富',
      our_advantage: '国产化替代优势，信创认证，响应速度快',
      payment_risk: 'low', decision_cycle: '2_weeks', need_prepayment: true,
      estimated_value: 32000000, industry: '金融银行',
      power_map_version: 3, ltc_stage: 'ATC',
      last_contact: '2026-04-01T10:00:00+08:00', next_follow_up: '2026-04-06T14:00:00+08:00',
    },
    {
      name: '陈刚', company: '中国南方电网有限责任公司', title: '数字化部副总经理',
      email: 'chengang@csg.cn', phone: '020-3812-5555',
      status: 'contacted', source: 'event', score: 65,
      ai_insights: ['电力物联网标准刚发布', '国网已先行试点', '预算在Q3确定'],
      suggested_actions: ['持续技术交流', '邀请参观标杆案例', '准备行业白皮书'],
      value_rating: 'B', competitor_name: '国家电网信通',
      competitor_advantage: '集团内部供应商优先',
      our_advantage: '差异化技术方案，边缘计算优势',
      payment_risk: 'medium', decision_cycle: '1_month', need_prepayment: false,
      estimated_value: 18000000, industry: '电力能源',
      power_map_version: 0, ltc_stage: 'ML',
      last_contact: '2026-03-20T11:00:00+08:00', next_follow_up: '2026-04-10T09:30:00+08:00',
    },
    {
      name: '刘洋', company: '顺丰科技有限公司', title: 'CTO',
      email: 'liuyang@sf-tech.com', phone: '0755-2688-3333',
      status: 'new', source: 'cold_outreach', score: 45,
      ai_insights: ['顺丰正在自研部分系统', '竞争激烈', '决策流程长'],
      suggested_actions: ['了解技术需求', '安排产品演示', '建立技术关系'],
      value_rating: 'C', competitor_name: '菜鸟网络',
      competitor_advantage: '阿里生态优势',
      our_advantage: '通信网络基础设施能力，边缘节点覆盖',
      payment_risk: 'high', decision_cycle: 'long', need_prepayment: false,
      estimated_value: 5000000, industry: '物流快递',
      power_map_version: 0, ltc_stage: 'ML',
    },
  ];

  // Check if leads already exist
  const existingRes = await fetch(`${SUPABASE_URL}/rest/v1/sales_leads?company=in.(中国移动通信集团,比亚迪股份有限公司,平安银行股份有限公司,中国南方电网有限责任公司,顺丰科技有限公司)&select=id,company`, { headers });
  const existing = await existingRes.json();
  const existingCompanies = new Set(existing.map(l => l.company));

  const leadIds = {};
  for (const lead of leads) {
    if (existingCompanies.has(lead.company)) {
      const existingLead = existing.find(l => l.company === lead.company);
      leadIds[lead.company] = existingLead.id;
      console.log(`  SKIP ${lead.company} (already exists, id=${existingLead.id})`);
    } else {
      const result = await fetchApi('sales_leads', 'POST', lead);
      if (result && result[0]) {
        leadIds[lead.company] = result[0].id;
        console.log(`  OK ${lead.company} (id=${result[0].id}, rating=${lead.value_rating})`);
      }
    }
  }

  // ============ 2. Decision Makers (Power Map) ============
  console.log('\n2. Creating decision makers...');

  const decisionMakers = [
    // 中国移动
    { leadCompany: '中国移动通信集团', name: '张伟', title: '网络建设部副总经理', department: '网络建设部', roles: ['influencer', 'buyer'], business_pain: '5G核心网扩容进度落后计划3个月，集团KPI考核压力巨大', personal_goal: '推动5G SA核心网全面商用，争取晋升集团副总', fear_point: '项目延期会被问责，技术选型失败影响职业前景', communication_style: 'data_driven', icebreaker: '去年在深圳华为总部参观过5G展厅，对端到端方案印象深刻', relationship_strength: 75, ar_verified: true, sr_verified: true, fr_verified: false, next_action: '安排POC环境搭建，演示核心网切片能力', notes: '关键技术决策者，对华为方案有好感' },
    { leadCompany: '中国移动通信集团', name: '赵强', title: '技术部总经理', department: '技术部', roles: ['initiator', 'influencer'], business_pain: '现网设备老化严重，运维成本年增30%，急需升级', personal_goal: '主导下一代网络架构设计，建立行业技术影响力', fear_point: '新技术导入风险，担心被供应商锁定', communication_style: 'data_driven', icebreaker: '北邮同学，共同参加过3GPP标准会议', relationship_strength: 60, ar_verified: true, sr_verified: true, fr_verified: true, next_action: '邀请参加技术架构评审会', notes: '技术把关人，需要用数据说话' },
    { leadCompany: '中国移动通信集团', name: '孙丽', title: '采购部总监', department: '采购部', roles: ['approver'], business_pain: '采购成本优化指标：年度降本15%，供应链安全', personal_goal: '建立阳光采购标杆，年底评优', fear_point: '审计风险，合规问题', communication_style: 'data_driven', relationship_strength: 40, ar_verified: true, notes: '商务决策审批人，关注价格和合同条款' },
    { leadCompany: '中国移动通信集团', name: '刘总', title: '副总裁', department: '集团管理层', roles: ['decider'], business_pain: '集团数字化转型战略推进，5G投资回报率压力', personal_goal: '推动中国移动成为全球5G领导者，争取更高职位', fear_point: '大规模投资后效果不达预期，影响集团业绩', communication_style: 'security', icebreaker: '高尔夫球友的介绍认识', relationship_strength: 30, ar_verified: true, next_action: '安排高层拜访，汇报项目方案和ROI', notes: '最终决策者，需要从战略层面沟通' },
    // 比亚迪
    { leadCompany: '比亚迪股份有限公司', name: '李明', title: '智能制造中心总监', department: '智能制造中心', roles: ['initiator', 'influencer'], business_pain: '产线自动化率仅35%，低于特斯拉的75%，集团要求2年内提升到60%', personal_goal: '打造行业标杆智能工厂，成为比亚迪数字化转型的核心推动者', fear_point: '项目失败会被认为能力不足，影响在集团的话语权', communication_style: 'data_driven', icebreaker: '参观过特斯拉上海超级工厂，希望对标学习', relationship_strength: 55, ar_verified: true, sr_verified: true, next_action: '安排技术交流会，展示5G+工业互联网方案', notes: '需求发起人，有强烈意愿推进' },
    { leadCompany: '比亚迪股份有限公司', name: '王建国', title: '副总裁', department: '集团管理层', roles: ['decider'], business_pain: '集团毛利率持续下滑，需要通过数字化降本增效', personal_goal: '推动比亚迪制造体系全面超越特斯拉', fear_point: '大规模投资后效率提升不明显', communication_style: 'security', relationship_strength: 20, notes: '最终拍板人，需要从投资回报角度说服' },
    // 平安银行
    { leadCompany: '平安银行股份有限公司', name: '王芳', title: '信息技术部总经理', department: '信息技术部', roles: ['influencer', 'buyer'], business_pain: '数据中心年运维成本超2亿，信创改造压力紧迫', personal_goal: '完成信创替代KPI，成为银行业数字化转型标杆', fear_point: '系统迁移过程中出现安全事故', communication_style: 'data_driven', icebreaker: '去年金融科技论坛上认识的', relationship_strength: 85, ar_verified: true, sr_verified: true, fr_verified: true, next_action: '确认合同细节，推动签约', notes: '核心推动者，关系非常好' },
    { leadCompany: '平安银行股份有限公司', name: '周明远', title: '首席信息官CIO', department: '高管层', roles: ['decider', 'approver'], business_pain: '监管要求2027年前完成核心系统信创替代', personal_goal: '带领平安银行科技实力进入行业前三', fear_point: '信创迁移风险导致业务中断', communication_style: 'security', icebreaker: '通过共同的朋友介绍，已在饭局上见过', relationship_strength: 65, ar_verified: true, sr_verified: true, next_action: '高层拜访，确认最终商务条款', notes: '最终决策者，需要从合规和战略角度沟通' },
  ];

  let dmCount = 0;
  for (const dm of decisionMakers) {
    const leadId = leadIds[dm.leadCompany];
    if (!leadId) { console.log(`  SKIP ${dm.name} (lead not found)`); continue; }
    dm.lead_id = leadId;
    delete dm.leadCompany;
    const result = await fetchApi('decision_makers', 'POST', dm);
    if (result && result[0]) {
      dmCount++;
      console.log(`  OK ${dm.name} (${dm.department}) -> ${dm.leadCompany}`);
    }
  }
  console.log(`  Total: ${dmCount} decision makers`);

  // ============ 3. Competitor Comparisons ============
  console.log('\n3. Creating competitor comparisons...');

  const competitors = [
    { leadCompany: '中国移动通信集团', competitor_name: '爱立信', competitor_solution: '5G核心网全栈解决方案（Ericsson Cloud Core）', competitor_price_range: '¥3200-3800万', competitor_delivery_cycle: '6-9个月', competitor_strengths: '全球5G核心网市场份额第一，欧洲运营商标杆案例丰富，3GPP标准核心贡献者', competitor_weaknesses: '价格偏高20-30%，本地化服务团队不足，定制化能力弱，响应速度慢', our_differentiator: '端到端国产化方案，部署周期缩短40%（4-6个月），7x24小时本地支持，性价比高30%' },
    { leadCompany: '中国移动通信集团', competitor_name: '中兴通讯', competitor_solution: '5G核心网 Common Core 解决方案', competitor_price_range: '¥2200-2800万', competitor_delivery_cycle: '5-8个月', competitor_strengths: '价格有优势，与中国移动历史合作基础好，国内市场份额第二', competitor_weaknesses: '高端技术能力不如华为和爱立信，国际化经验不足，部分核心芯片依赖进口', our_differentiator: '芯片自研优势，高端技术领先，全球化交付经验，完整生态体系' },
    { leadCompany: '比亚迪股份有限公司', competitor_name: '西门子', competitor_solution: 'Siemens MindSphere 工业物联网平台 + SIMATIC自动化', competitor_price_range: '¥1800-2200万', competitor_delivery_cycle: '12-18个月', competitor_strengths: '工业自动化百年品牌，汽车行业案例丰富（宝马、奔驰），PLM全流程覆盖', competitor_weaknesses: '系统封闭性强，部署周期长，定制化成本高，缺乏5G通信能力', our_differentiator: '5G+工业互联网融合方案，部署周期缩短40%，开放架构支持快速集成，边缘计算能力强' },
    { leadCompany: '比亚迪股份有限公司', competitor_name: '海尔卡奥斯', competitor_solution: 'COSMOPlat 工业互联网平台', competitor_price_range: '¥800-1200万', competitor_delivery_cycle: '6-10个月', competitor_strengths: '价格有优势，国内制造业案例多，政府背书强', competitor_weaknesses: '汽车行业经验不足，技术深度不够，大型产线交付能力有限', our_differentiator: '端到端通信+计算+控制方案，汽车行业已有成功案例（小鹏、理想），技术深度和交付能力更强' },
    { leadCompany: '平安银行股份有限公司', competitor_name: 'IBM', competitor_solution: 'IBM Cloud for Financial Services + z/OS迁移方案', competitor_price_range: '¥3500-4000万', competitor_delivery_cycle: '8-12个月', competitor_strengths: '金融行业全球领导者，安全合规经验丰富，IBM Z系列稳定可靠', competitor_weaknesses: '价格昂贵，信创合规性存疑（外资企业），本地化团队缩减，技术更新慢', our_differentiator: '完全信创合规，金融级安全认证，国产化替代无缝迁移，价格优势25%，本地化7x24支持' },
  ];

  let compCount = 0;
  for (const comp of competitors) {
    const leadId = leadIds[comp.leadCompany];
    if (!leadId) { console.log(`  SKIP ${comp.competitor_name} vs ${comp.leadCompany}`); continue; }
    comp.lead_id = leadId;
    delete comp.leadCompany;
    const result = await fetchApi('competitor_comparisons', 'POST', comp);
    if (result && result[0]) {
      compCount++;
      console.log(`  OK ${comp.competitor_name} vs ${result[0].lead_id}`);
    }
  }
  console.log(`  Total: ${compCount} competitor comparisons`);

  // ============ 4. Iron Triangle Reviews ============
  console.log('\n4. Creating iron triangle reviews...');

  const reviews = [
    { leadCompany: '中国移动通信集团', ar_coverage: '已拜访：张伟(网络建设部)、赵强(技术部)、孙丽(采购部)。未拜访：刘总(副总裁)。整体关系覆盖75%，技术线和采购线关系良好。', ar_next_step: '4月8日安排张伟POC环境搭建，4月10日邀请赵强参加架构评审，4月15日安排高层拜访刘总', sr_pain_match: '痛点匹配度85%：核心网扩容、运维成本优化、SA商用三大核心需求均有对应方案。切片能力POC需重点展示。', sr_proposal_status: '技术方案V2已提交，等待技术评审反馈。需补充：性能压测数据、与其他省公司部署案例、运维工具对比', fr_delivery_risk: '交付风险低：核心网产品成熟度高，已有20+省公司部署经验。注意：需提前确认机房环境和传输资源', fr_payment_plan: '中国移动年度框架协议付款，预付30%，验收70%。信用风险极低。', overall_action_plan: '1. POC环境搭建（本周） 2. 技术评审（4/10） 3. 高层拜访（4/15） 4. 商务报价（4/20） 5. 合同签署（5月初）', win_probability: 72 },
    { leadCompany: '比亚迪股份有限公司', ar_coverage: '已拜访：李明(智能制造中心)。未拜访：王建国(副总裁)。整体关系覆盖40%，缺乏高层关系。', ar_next_step: '4月5日安排技术交流会，4月内争取拜访王建国副总裁', sr_pain_match: '痛点匹配度70%：自动化率提升需求匹配，但缺乏汽车行业深度案例。需补充与小鹏、理想的合作案例。', sr_proposal_status: '方案框架已提交，需细化：ROI分析、与西门子的详细对比、分阶段实施计划', fr_delivery_risk: '中等风险：汽车工厂数字化改造复杂度高，需协调多个产线。建议分阶段交付。', fr_payment_plan: '比亚迪要求30%预付，分三期支付。付款信用中等，需关注回款节奏。', overall_action_plan: '1. 技术交流会（4/5） 2. 提交详细方案（4/15） 3. 拜访副总裁（4/20） 4. POC验证（5月）', win_probability: 45 },
    { leadCompany: '平安银行股份有限公司', ar_coverage: '已拜访：王芳(信息技术部)、周明远(CIO)。关系覆盖90%，所有关键决策者均已接触。', ar_next_step: '4月6日确认合同细节，4月8日高层饭局推进最终签约', sr_pain_match: '痛点匹配度95%：信创替代、数据中心升级、安全合规三大需求完全匹配。技术方案已通过评审。', sr_proposal_status: '方案已通过技术评审，商务条款进入最终谈判。待确认：维保年限、SLA标准、数据迁移服务', fr_delivery_risk: '低风险：方案成熟，团队经验丰富。注意：金融数据迁移需特别关注安全审计。', fr_payment_plan: '平安银行预付30%，分三期支付（30-40-30）。银团付款，信用风险极低。', overall_action_plan: '1. 商务条款确认（4/6） 2. 高层确认（4/8） 3. 合同签署（4/10） 4. 项目启动（4/15）', win_probability: 88 },
  ];

  let revCount = 0;
  for (const rev of reviews) {
    const leadId = leadIds[rev.leadCompany];
    if (!leadId) { console.log(`  SKIP ${rev.leadCompany} review`); continue; }
    rev.lead_id = leadId;
    delete rev.leadCompany;
    const result = await fetchApi('iron_triangle_reviews', 'POST', rev);
    if (result && result[0]) {
      revCount++;
      console.log(`  OK ${rev.leadCompany} review (win=${rev.win_probability}%)`);
    }
  }
  console.log(`  Total: ${revCount} reviews`);

  // ============ 5. Intel Records ============
  console.log('\n5. Creating intel records...');

  const intels = [
    { leadCompany: '中国移动通信集团', intel_type: 'customer_public', source: '中国移动2025年报', title: '中国移动2025年资本开支计划公布', content: '2025年资本开支1850亿元，其中5G投资占比45%约830亿。SA核心网是重点投资方向，计划覆盖所有地级市。', impact: '预算充足，项目必投。需把握窗口期快速推进。' },
    { leadCompany: '中国移动通信集团', intel_type: 'competitor', source: '行业消息', title: '爱立信与中国移动签署5G核心网框架协议', content: '爱立信已与中国移动签署2025-2026年5G核心网框架协议，但具体项目需单独招标。框架协议不代表项目锁定。', impact: '有竞争压力，但框架协议不排除其他供应商参与具体项目投标。' },
    { leadCompany: '中国移动通信集团', intel_type: 'customer_public', source: '企查查', title: '中国移动网络建设部组织架构调整', content: '张伟由网络建设部副总监升任副总经理，职责扩大。新设5G核心网专项组，赵强任组长。', impact: '张伟决策权增大，赵强在技术选型上话语权增强。应重点维护这两位的关系。' },
    { leadCompany: '中国移动通信集团', intel_type: 'industry', source: '工信部', title: '工信部发布5G应用扬帆行动计划', content: '工信部要求2025年底实现5G SA网络全覆盖，推动核心网切片商用。运营商需在Q3前完成核心网升级。', impact: '政策驱动，时间窗口明确。有助于加速客户决策。' },
    { leadCompany: '比亚迪股份有限公司', intel_type: 'customer_public', source: '比亚迪年报', title: '比亚迪2025年年报：智能制造投入加大', content: '比亚迪2025年研发投入超400亿元，其中智能制造占比15%约60亿。明确提出"打造灯塔工厂"目标。', impact: '预算充足，需求真实。60亿智能制造预算中，我们的目标份额约1500万。' },
    { leadCompany: '比亚迪股份有限公司', intel_type: 'competitor', source: '西门子官网', title: '西门子与比亚迪签署智能制造MOU', content: '西门子与比亚迪签署智能制造合作谅解备忘录，但尚未签订具体项目合同。MOU有效期6个月。', impact: '有竞争压力但尚未锁定。需在MOU有效期内展示差异化优势，争取项目机会。' },
    { leadCompany: '比亚迪股份有限公司', intel_type: 'customer_public', source: '猎聘网', title: '比亚迪智能制造中心大量招聘', content: '比亚迪智能制造中心正在大量招聘：工业互联网架构师、MES产品经理、自动化工程师等20+岗位。', impact: '说明项目即将启动，团队正在组建。是切入的好时机。' },
    { leadCompany: '平安银行股份有限公司', intel_type: 'customer_public', source: '银保监会', title: '银保监会发布金融信创时间表', content: '银保监会要求全国性商业银行2027年前完成核心系统信创替代。2025年底前完成方案设计，2026年开始实施。', impact: '强制合规要求，项目势在必行。时间窗口明确，有利于推进签约。' },
    { leadCompany: '平安银行股份有限公司', intel_type: 'competitor', source: '内部消息', title: 'IBM平安银行团队缩减', content: 'IBM金融业务团队从15人缩减至8人，部分资深顾问离职。服务响应速度明显下降。', impact: '竞争对手实力下降，是我们的机会。可以强调服务能力和团队规模优势。' },
    { leadCompany: '平安银行股份有限公司', intel_type: 'customer_public', source: '财经新闻', title: '平安银行2025年报：科技投入超200亿', content: '平安银行2025年科技投入218亿元，占营收5.2%。IT团队超1万人。信创改造预算占比30%约65亿。', impact: '预算规模巨大，我们的3.2亿只是冰山一角。如果首期项目成功，有持续合作机会。' },
  ];

  let intelCount = 0;
  for (const intel of intels) {
    const leadId = leadIds[intel.leadCompany];
    if (!leadId) { console.log(`  SKIP ${intel.title}`); continue; }
    intel.lead_id = leadId;
    delete intel.leadCompany;
    const result = await fetchApi('intel_records', 'POST', intel);
    if (result && result[0]) {
      intelCount++;
      console.log(`  OK [${intel.intel_type}] ${intel.title}`);
    }
  }
  console.log(`  Total: ${intelCount} intel records`);

  // ============ 6. LTC Weekly Tasks ============
  console.log('\n6. Creating LTC weekly tasks...');
  const weekStart = '2026-03-31';

  const tasks = [
    // 中国移动 tasks
    { leadCompany: '中国移动通信集团', phase: 'MO_deep_update', task_description: '更新决策链关系强度评分，确认最新沟通状态', completed: true },
    { leadCompany: '中国移动通信集团', phase: 'MO_strategy', task_description: '准备与爱立信的差异化竞争策略文档', completed: false },
    { leadCompany: '中国移动通信集团', phase: 'MO_deep_update', task_description: '收集核心网切片POC的测试数据', completed: true },
    { leadCompany: '中国移动通信集团', phase: 'MO_strategy', task_description: '安排高层拜访刘总的行程和汇报材料', completed: false },
    { leadCompany: '中国移动通信集团', phase: 'ATC_review', task_description: '准备商务报价方案', completed: false },
    // 比亚迪 tasks
    { leadCompany: '比亚迪股份有限公司', phase: 'ML_value_email', task_description: '发送智能制造价值邮件（行业趋势+案例分享）', completed: true },
    { leadCompany: '比亚迪股份有限公司', phase: 'MO_deep_update', task_description: '准备比亚迪产线调研材料', completed: false },
    { leadCompany: '比亚迪股份有限公司', phase: 'MO_deep_update', task_description: '收集小鹏、理想工厂案例数据', completed: false },
    { leadCompany: '比亚迪股份有限公司', phase: 'ML_clean', task_description: '整理比亚迪项目CRM信息，补充决策链数据', completed: true },
    // 平安银行 tasks
    { leadCompany: '平安银行股份有限公司', phase: 'ATC_review', task_description: '确认合同最终条款', completed: false },
    { leadCompany: '平安银行股份有限公司', phase: 'ATC_review', task_description: '准备项目启动会材料', completed: false },
    { leadCompany: '平安银行股份有限公司', phase: 'ATC_review', task_description: '安排高层饭局（周明远CIO）', completed: false },
    { leadCompany: '平安银行股份有限公司', phase: 'collection', task_description: '确认预付款条款和发票信息', completed: true },
    // 南方电网 tasks
    { leadCompany: '中国南方电网有限责任公司', phase: 'ML_value_email', task_description: '发送电力物联网行业白皮书', completed: false },
    { leadCompany: '中国南方电网有限责任公司', phase: 'ML_clean', task_description: '整理南方电网组织架构和决策链', completed: false },
    { leadCompany: '中国南方电网有限责任公司', phase: 'ML_value_email', task_description: '邀请参加智慧能源峰会', completed: false },
  ];

  let taskCount = 0;
  for (const task of tasks) {
    const leadId = leadIds[task.leadCompany];
    if (!leadId) { console.log(`  SKIP ${task.task_description}`); continue; }
    task.lead_id = leadId;
    task.week_start = weekStart;
    delete task.leadCompany;
    const result = await fetchApi('ltc_weekly_tasks', 'POST', task);
    if (result && result[0]) {
      taskCount++;
    }
  }
  console.log(`  Total: ${taskCount} LTC tasks`);

  // ============ Summary ============
  console.log('\n========================================');
  console.log('Seed completed successfully!');
  console.log(`  Leads: ${Object.keys(leadIds).length}`);
  console.log(`  Decision Makers: ${dmCount}`);
  console.log(`  Competitor Comparisons: ${compCount}`);
  console.log(`  Iron Triangle Reviews: ${revCount}`);
  console.log(`  Intel Records: ${intelCount}`);
  console.log(`  LTC Weekly Tasks: ${taskCount}`);
  console.log('========================================');
}

main().catch(console.error);
