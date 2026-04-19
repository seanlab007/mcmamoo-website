// Supabase Client Extensions for Huawei-style Sales Intelligence
// Decision Makers (Power Map + Pain Chain) API

import { supabaseAdmin } from './sales-client';

// ==================== Decision Makers Types ====================

export interface DecisionMaker {
  id: number;
  lead_id: number;
  name: string;
  title: string | null;
  department: string | null;
  roles: string[]; // ['initiator', 'influencer', 'decider', 'approver', 'buyer']
  business_pain: string | null;
  personal_goal: string | null;
  fear_point: string | null;
  communication_style: 'data_driven' | 'relationship' | 'security' | 'mixed';
  icebreaker: string | null;
  relationship_strength: number;
  last_contact: string | null;
  next_action: string | null;
  next_action_date: string | null;
  notes: string | null;
  ar_verified: boolean;
  sr_verified: boolean;
  fr_verified: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== Decision Makers API ====================

export async function getDecisionMakers(leadId: number) {
  const { data, error } = await supabaseAdmin
    .from('decision_makers')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as DecisionMaker[];
}

export async function getDecisionMakerById(id: number) {
  const { data, error } = await supabaseAdmin
    .from('decision_makers')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as DecisionMaker;
}

export async function createDecisionMaker(dm: Omit<DecisionMaker, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabaseAdmin
    .from('decision_makers')
    .insert(dm)
    .select()
    .single();
  if (error) throw error;
  return data as DecisionMaker;
}

export async function updateDecisionMaker(id: number, updates: Partial<DecisionMaker>) {
  const { data, error } = await supabaseAdmin
    .from('decision_makers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as DecisionMaker;
}

export async function deleteDecisionMaker(id: number) {
  const { error } = await supabaseAdmin
    .from('decision_makers')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

// ==================== Competitor Comparisons ====================

export interface CompetitorComparison {
  id: number;
  lead_id: number;
  competitor_name: string;
  competitor_solution: string | null;
  competitor_price_range: string | null;
  competitor_delivery_cycle: string | null;
  competitor_strengths: string | null;
  competitor_weaknesses: string | null;
  our_differentiator: string | null;
  comparison_date: string;
  created_at: string;
}

export async function getCompetitorComparisons(leadId: number) {
  const { data, error } = await supabaseAdmin
    .from('competitor_comparisons')
    .select('*')
    .eq('lead_id', leadId)
    .order('comparison_date', { ascending: false });
  if (error) throw error;
  return data as CompetitorComparison[];
}

export async function createCompetitorComparison(cc: Omit<CompetitorComparison, 'id' | 'created_at'>) {
  const { data, error } = await supabaseAdmin
    .from('competitor_comparisons')
    .insert(cc)
    .select()
    .single();
  if (error) throw error;
  return data as CompetitorComparison;
}

export async function deleteCompetitorComparison(id: number) {
  const { error } = await supabaseAdmin
    .from('competitor_comparisons')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

// ==================== Iron Triangle Reviews ====================

export interface IronTriangleReview {
  id: number;
  lead_id: number;
  review_date: string;
  ar_coverage: string | null;
  ar_next_step: string | null;
  sr_pain_match: string | null;
  sr_proposal_status: string | null;
  fr_delivery_risk: string | null;
  fr_payment_plan: string | null;
  overall_action_plan: string | null;
  win_probability: number | null;
  created_at: string;
}

export async function getIronTriangleReviews(leadId: number) {
  const { data, error } = await supabaseAdmin
    .from('iron_triangle_reviews')
    .select('*')
    .eq('lead_id', leadId)
    .order('review_date', { ascending: false });
  if (error) throw error;
  return data as IronTriangleReview[];
}

export async function createIronTriangleReview(review: Omit<IronTriangleReview, 'id' | 'created_at'>) {
  const { data, error } = await supabaseAdmin
    .from('iron_triangle_reviews')
    .insert(review)
    .select()
    .single();
  if (error) throw error;
  return data as IronTriangleReview;
}

export async function getLatestIronTriangleReview(leadId: number) {
  const { data, error } = await supabaseAdmin
    .from('iron_triangle_reviews')
    .select('*')
    .eq('lead_id', leadId)
    .order('review_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as IronTriangleReview | null;
}

// ==================== Intel Records ====================

export interface IntelRecord {
  id: number;
  lead_id: number;
  intel_type: 'customer_public' | 'competitor' | 'industry' | 'other';
  source: string;
  title: string;
  content: string | null;
  impact: string | null;
  recorded_at: string;
  created_at: string;
}

export async function getIntelRecords(leadId: number) {
  const { data, error } = await supabaseAdmin
    .from('intel_records')
    .select('*')
    .eq('lead_id', leadId)
    .order('recorded_at', { ascending: false });
  if (error) throw error;
  return data as IntelRecord[];
}

export async function createIntelRecord(record: Omit<IntelRecord, 'id' | 'created_at'>) {
  const { data, error } = await supabaseAdmin
    .from('intel_records')
    .insert(record)
    .select()
    .single();
  if (error) throw error;
  return data as IntelRecord;
}

// ==================== LTC Weekly Tasks ====================

export interface LTCWeeklyTask {
  id: number;
  lead_id: number;
  week_start: string;
  phase: 'ML_clean' | 'ML_value_email' | 'MO_deep_update' | 'MO_strategy' | 'ATC_review' | 'delivery_monitor' | 'collection';
  task_description: string;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

export async function getLTCWeeklyTasks(leadId: number, weekStart?: string) {
  let query = supabaseAdmin
    .from('ltc_weekly_tasks')
    .select('*')
    .eq('lead_id', leadId)
    .order('week_start', { ascending: false });
  
  if (weekStart) {
    query = query.eq('week_start', weekStart);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as LTCWeeklyTask[];
}

export async function createLTCWeeklyTask(task: Omit<LTCWeeklyTask, 'id' | 'created_at'>) {
  const { data, error } = await supabaseAdmin
    .from('ltc_weekly_tasks')
    .insert(task)
    .select()
    .single();
  if (error) throw error;
  return data as LTCWeeklyTask;
}

export async function updateLTCWeeklyTask(id: number, updates: Partial<LTCWeeklyTask>) {
  const { data, error } = await supabaseAdmin
    .from('ltc_weekly_tasks')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as LTCWeeklyTask;
}

// ==================== Enhanced Lead with Huawei Fields ====================

export interface EnhancedSalesLead {
  // Base fields
  id: number;
  name: string;
  company: string;
  title: string | null;
  email: string;
  phone: string | null;
  linkedin: string | null;
  website: string | null;
  status: string;
  source: string;
  score: number;
  notes: string | null;
  last_contact: string | null;
  next_follow_up: string | null;
  assigned_to: number | null;
  ai_insights: string[];
  suggested_actions: string[];
  created_at: string;
  updated_at: string;

  // Huawei-style new fields
  value_rating: 'A' | 'B' | 'C' | 'D';
  competitor_name: string | null;
  competitor_advantage: string | null;
  our_advantage: string | null;
  payment_risk: 'low' | 'medium' | 'high';
  decision_cycle: string;
  need_prepayment: boolean;
  estimated_value: number | null;
  industry: string | null;
  power_map_version: number;
  ltc_stage: string;
}

export async function getEnhancedSalesLead(id: number) {
  const { data, error } = await supabaseAdmin
    .from('sales_leads')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as EnhancedSalesLead;
}

export async function getEnhancedSalesLeads(filters?: { value_rating?: string; ltc_stage?: string }) {
  let query = supabaseAdmin
    .from('sales_leads')
    .select('*')
    .order('value_rating', { ascending: true });

  if (filters?.value_rating) {
    query = query.eq('value_rating', filters.value_rating);
  }
  if (filters?.ltc_stage) {
    query = query.eq('ltc_stage', filters.ltc_stage);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as EnhancedSalesLead[];
}

// ==================== Dashboard Stats with Huawei Metrics ====================

export async function getHuaweiSalesStats() {
  const { data, error } = await supabaseAdmin
    .from('sales_leads')
    .select('value_rating, ltc_stage, status, score, estimated_value');
  
  if (error) throw error;

  const byRating = { A: 0, B: 0, C: 0, D: 0 };
  const byLTCStage: Record<string, number> = {};
  let totalEstimatedValue = 0;
  let highRiskCount = 0;

  data.forEach((lead: any) => {
    if (lead.value_rating) byRating[lead.value_rating as keyof typeof byRating]++;
    if (lead.ltc_stage) byLTCStage[lead.ltc_stage] = (byLTCStage[lead.ltc_stage] || 0) + 1;
    if (lead.estimated_value) totalEstimatedValue += parseFloat(lead.estimated_value);
    if (lead.payment_risk === 'high') highRiskCount++;
  });

  return {
    total: data.length,
    byRating,
    byLTCStage,
    totalEstimatedValue,
    highRiskCount,
    focusLeads: byRating.A + byRating.B,
  };
}
