import { supabase } from './supabaseClient';

export interface WeightLog {
  id: string;
  user_id: string;
  date: string;
  weight_kg: number;
  source: 'healthkit' | 'manual';
}

export async function listWeightLogs(limit = 14): Promise<WeightLog[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function upsertWeightLog(input: { date: string; weight_kg: number }): Promise<WeightLog> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('weight_logs')
    .upsert({ user_id: userData.user.id, source: 'manual', ...input }, { onConflict: 'user_id,date' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
