// Supabase Client for MaoAI Sales Automation
// Project: fczherphuixpdjuevzsh
// URL: https://fczherphuixpdjuevzsh.supabase.co

import { createClient } from '@supabase/supabase-js';

// Supabase配置
const SUPABASE_URL = 'https://fczherphuixpdjuevzsh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDM0OTEsImV4cCI6MjA4OTIxOTQ5MX0.t7FSUWbWDsKIcU-m-1ul65aVVu87RZn0zHleqccDEo4';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY0MzQ5MSwiZXhwIjoyMDg5MjE5NDkxfQ.XgyphQNQtmOPx1hFl5WyL5W_FCLOW8iX6k5ryf9KNIg';

// 创建Supabase客户端
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 创建Service Role客户端（用于服务端操作）
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// 销售线索类型
export interface SalesLead {
  id: number;
  name: string;
  company: string;
  title: string | null;
  email: string;
  phone: string | null;
  linkedin: string | null;
  website: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  source: 'website' | 'linkedin' | 'referral' | 'cold_outreach' | 'event' | 'other';
  score: number;
  notes: string | null;
  last_contact: string | null;
  next_follow_up: string | null;
  assigned_to: number | null;
  ai_insights: string[];
  suggested_actions: string[];
  created_at: string;
  updated_at: string;
}

// 外联模板类型
export interface OutreachTemplate {
  id: number;
  name: string;
  subject: string | null;
  body: string;
  type: 'email' | 'linkedin';
  category: string | null;
  ai_optimized: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

// 外联活动类型
export interface OutreachActivity {
  id: number;
  lead_id: number;
  type: 'email' | 'linkedin' | 'call' | 'meeting' | 'note';
  subject: string | null;
  content: string | null;
  status: 'draft' | 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced';
  sent_at: string | null;
  opened_at: string | null;
  replied_at: string | null;
  created_by: number | null;
  created_at: string;
}

// ==================== Sales Leads API ====================

export async function getSalesLeads(filters?: { status?: string; source?: string }) {
  let query = supabase
    .from('sales_leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.source) {
    query = query.eq('source', filters.source);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as SalesLead[];
}

export async function getSalesLeadById(id: number) {
  const { data, error } = await supabase
    .from('sales_leads')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as SalesLead;
}

export async function createSalesLead(lead: Omit<SalesLead, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('sales_leads')
    .insert(lead)
    .select()
    .single();
  
  if (error) throw error;
  return data as SalesLead;
}

export async function updateSalesLead(id: number, updates: Partial<SalesLead>) {
  const { data, error } = await supabase
    .from('sales_leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as SalesLead;
}

export async function deleteSalesLead(id: number) {
  const { error } = await supabase
    .from('sales_leads')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// ==================== Outreach Templates API ====================

export async function getOutreachTemplates(type?: 'email' | 'linkedin') {
  let query = supabase
    .from('outreach_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as OutreachTemplate[];
}

export async function getOutreachTemplateById(id: number) {
  const { data, error } = await supabase
    .from('outreach_templates')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as OutreachTemplate;
}

// ==================== Outreach Activities API ====================

export async function getOutreachActivities(leadId?: number) {
  let query = supabase
    .from('outreach_activities')
    .select('*')
    .order('created_at', { ascending: false });

  if (leadId) {
    query = query.eq('lead_id', leadId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as OutreachActivity[];
}

export async function createOutreachActivity(activity: Omit<OutreachActivity, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('outreach_activities')
    .insert(activity)
    .select()
    .single();
  
  if (error) throw error;
  return data as OutreachActivity;
}

export async function updateOutreachActivity(id: number, updates: Partial<OutreachActivity>) {
  const { data, error } = await supabase
    .from('outreach_activities')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as OutreachActivity;
}

// ==================== Pipeline Stats ====================

export async function getPipelineStats() {
  const { data, error } = await supabase
    .from('sales_leads')
    .select('status');
  
  if (error) throw error;
  
  const stats = {
    total: data.length,
    new: 0,
    contacted: 0,
    qualified: 0,
    proposal: 0,
    negotiation: 0,
    closedWon: 0,
    closedLost: 0,
  };
  
  data.forEach((lead: { status: string }) => {
    const key = lead.status === 'closed_won' ? 'closedWon' : 
                lead.status === 'closed_lost' ? 'closedLost' : 
                lead.status;
    if (key in stats) {
      (stats as any)[key]++;
    }
  });
  
  return stats;
}

// ==================== AI Insights ====================

export async function getAIInsights() {
  // 获取高价值线索作为机会
  const { data: opportunities, error: oppError } = await supabase
    .from('sales_leads')
    .select('*')
    .gte('score', 80)
    .limit(3);
  
  if (oppError) throw oppError;
  
  // 获取需要跟进的线索（超过3天未联系）
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const { data: risks, error: riskError } = await supabase
    .from('sales_leads')
    .select('*')
    .lt('last_contact', threeDaysAgo.toISOString())
    .limit(3);
  
  if (riskError) throw riskError;
  
  const insights = [
    ...opportunities.map((lead: SalesLead) => ({
      id: `opp-${lead.id}`,
      type: 'opportunity' as const,
      title: `高价值线索: ${lead.company}`,
      description: `${lead.name} (${lead.title}) 评分 ${lead.score}，建议优先跟进`,
      confidence: lead.score,
      leadId: lead.id,
    })),
    ...risks.map((lead: SalesLead) => ({
      id: `risk-${lead.id}`,
      type: 'risk' as const,
      title: `需要跟进: ${lead.company}`,
      description: `客户"${lead.name}"已超过3天未联系，建议跟进`,
      confidence: 70,
      leadId: lead.id,
    })),
  ];
  
  return insights;
}
