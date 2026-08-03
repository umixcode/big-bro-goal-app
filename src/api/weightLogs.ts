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

// The earliest-ever log, used for a "since you started" delta rather than
// a delta relative to whatever window `listWeightLogs` happens to return.
export async function getFirstWeightLog(): Promise<WeightLog | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function deleteWeightLog(id: string): Promise<void> {
  const { error } = await supabase.from('weight_logs').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertWeightLog(input: {
  date: string;
  weight_kg: number;
  source?: 'healthkit' | 'manual';
}): Promise<WeightLog> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { source, ...rest } = input;
  const { data, error } = await supabase
    .from('weight_logs')
    .upsert({ user_id: userData.user.id, source: source ?? 'manual', ...rest }, { onConflict: 'user_id,date' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
