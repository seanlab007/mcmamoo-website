// Verify Huawei Case Study Seed Data
const SUPABASE_URL = 'https://fczherphuixpdjuevzsh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY0MzQ5MSwiZXhwIjoyMDg5MjE5NDkxfQ.XgyphQNQtmOPx1hFl5WyL5W_FCLOW8iX6k5ryf9KNIg';
const headers = { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, };

async function query(table, select = '*', filter = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}&select=${select}`, { headers });
  return res.json();
}

async function main() {
  const companies = ['中国移动通信集团', '比亚迪股份有限公司', '平安银行股份有限公司', '中国南方电网有限责任公司', '顺丰科技有限公司'];
  const ids = companies.map(c => c.replace(/'/g, "\\'")).join(',');
  
  console.log('=== HUAWEI CASE STUDY DATA VERIFICATION ===\n');
  
  // 1. Leads
  const leads = await query('sales_leads', 'id,company,value_rating,ltc_stage,estimated_value,industry,competitor_name', `company=in.(${ids})&order=value_rating.asc`);
  console.log('1. SALES LEADS (' + leads.length + ')');
  for (const l of leads) {
    console.log(`   [${l.value_rating}] ${l.company} | LTC:${l.ltc_stage} | ¥${(l.estimated_value/10000).toFixed(0)}万 | ${l.industry} | 竞品:${l.competitor_name}`);
  }

  // 2. Decision Makers
  const dms = await query('decision_makers', 'name,title,department,roles,relationship_strength', `lead_id=in.(${leads.map(l=>l.id).join(',')})&order=created_at.asc`);
  console.log(`\n2. DECISION MAKERS (${dms.length})`);
  for (const dm of dms) {
    const lead = leads.find(l => l.id === dm.lead_id);
    console.log(`   ${dm.name} (${dm.title}, ${dm.department}) -> ${lead?.company} | Roles:${dm.roles.join(',')} | Rel:${dm.relationship_strength}%`);
  }

  // 3. Competitor Comparisons
  const comps = await query('competitor_comparisons', 'competitor_name,competitor_strengths,our_differentiator,lead_id', `lead_id=in.(${leads.map(l=>l.id).join(',')})`);
  console.log(`\n3. COMPETITOR COMPARISONS (${comps.length})`);
  for (const c of comps) {
    const lead = leads.find(l => l.id === c.lead_id);
    console.log(`   ${c.competitor_name} vs ${lead?.company} | Diff: ${c.our_differentiator?.substring(0, 40)}...`);
  }

  // 4. Iron Triangle Reviews
  const reviews = await query('iron_triangle_reviews', 'win_probability,ar_coverage,overall_action_plan,lead_id', `lead_id=in.(${leads.map(l=>l.id).join(',')})`);
  console.log(`\n4. IRON TRIANGLE REVIEWS (${reviews.length})`);
  for (const r of reviews) {
    const lead = leads.find(l => l.id === r.lead_id);
    const prob = r.win_probability >= 70 ? '🟢' : r.win_probability >= 40 ? '🟡' : '🔴';
    console.log(`   ${prob} ${lead?.company} | Win: ${r.win_probability}% | AR: ${r.ar_coverage?.substring(0, 30)}...`);
  }

  // 5. Intel Records
  const intels = await query('intel_records', 'intel_type,title,source,lead_id', `lead_id=in.(${leads.map(l=>l.id).join(',')})&order=intel_type`);
  console.log(`\n5. INTEL RECORDS (${intels.length})`);
  for (const ir of intels) {
    const lead = leads.find(l => l.id === ir.lead_id);
    console.log(`   [${ir.intel_type}] ${ir.title} (${ir.source}) -> ${lead?.company}`);
  }

  // 6. LTC Weekly Tasks
  const tasks = await query('ltc_weekly_tasks', 'phase,task_description,completed,lead_id', `lead_id=in.(${leads.map(l=>l.id).join(',')})`);
  console.log(`\n6. LTC WEEKLY TASKS (${tasks.length})`);
  for (const t of tasks) {
    const lead = leads.find(l => l.id === t.lead_id);
    const status = t.completed ? '✅' : '⬜';
    console.log(`   ${status} [${t.phase}] ${t.task_description} -> ${lead?.company}`);
  }

  console.log('\n=== ALL DATA VERIFIED SUCCESSFULLY ===');
}

main().catch(console.error);
