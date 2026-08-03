import { supabase } from './supabaseClient';

export interface StepsLog {
  id: string;
  user_id: string;
  date: string;
  steps: number;
  source: 'healthkit' | 'manual';
  distance_m: number | null;
  floors_climbed: number | null;
  active_minutes: number | null;
  active_calories: number | null;
}

export async function listStepsLogs(limit = 14): Promise<StepsLog[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('steps_logs')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getStepsLogByDate(date: string): Promise<StepsLog | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('steps_logs')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getStepsLogsForRange(startDate: string, endDate: string): Promise<StepsLog[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('steps_logs')
    .select('*')
    .eq('user_id', userData.user.id)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) throw error;
  return data ?? [];
}

export async function upsertStepsLog(input: {
  date: string;
  steps: number;
  source?: 'healthkit' | 'manual';
  distance_m?: number | null;
  floors_climbed?: number | null;
  active_minutes?: number | null;
  active_calories?: number | null;
}): Promise<StepsLog> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { source, ...rest } = input;
  const { data, error } = await supabase
    .from('steps_logs')
    .upsert({ user_id: userData.user.id, source: source ?? 'manual', ...rest }, { onConflict: 'user_id,date' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
