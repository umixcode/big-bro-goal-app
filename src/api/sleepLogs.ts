import { supabase } from './supabaseClient';

export interface SleepLog {
  id: string;
  user_id: string;
  date: string;
  source: 'healthkit' | 'manual';
  total_minutes: number;
  rem_minutes: number | null;
  light_minutes: number | null;
  deep_minutes: number | null;
  awake_minutes: number | null;
  start_time: string | null;
  end_time: string | null;
  score: number | null;
}

export async function getSleepLogByDate(date: string): Promise<SleepLog | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getSleepLogsForRange(startDate: string, endDate: string): Promise<SleepLog[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', userData.user.id)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) throw error;
  return data ?? [];
}

export async function upsertSleepLog(input: {
  date: string;
  total_minutes: number;
  score?: number | null;
  rem_minutes?: number | null;
  light_minutes?: number | null;
  deep_minutes?: number | null;
  awake_minutes?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  source?: 'healthkit' | 'manual';
}): Promise<SleepLog> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { source, ...rest } = input;
  const { data, error } = await supabase
    .from('sleep_logs')
    .upsert({ user_id: userData.user.id, source: source ?? 'manual', ...rest }, { onConflict: 'user_id,date' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
