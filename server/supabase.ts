import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://fczherphuixpdjuevzsh.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemhlcnBodWl4cGRqdWV2enNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY0MzQ5MSwiZXhwIjoyMDg5MjE5NDkxfQ.XgyphQNQtmOPx1hFl5WyL5W_FCLOW8iX6k5ryf9KNIg';

// 使用 Service Role Key 以绕过 RLS，仅用于服务端管理操作
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * 获取用户角色和订阅状态
 */
export async function getUserRole(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('role, subscription_status')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[Supabase] Error fetching user role:', error);
    return { role: 'user', subscription_status: 'free' };
  }

  return data;
}

/**
 * 获取私密笔记（管理员权限）
 */
export async function getAdminNotes() {
  const { data, error } = await supabaseAdmin
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Supabase] Error fetching notes:', error);
    throw error;
  }

  return data;
}
