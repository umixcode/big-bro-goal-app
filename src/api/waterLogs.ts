import { supabase } from './supabaseClient';

export interface WaterLog {
  id: string;
  user_id: string;
  date: string;
  logged_at: string;
  amount_ml: number;
}

export async function listWaterLogsByDate(date: string): Promise<WaterLog[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('water_logs')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('date', date)
    .order('logged_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addWaterLog(input: { date: string; amount_ml: number }): Promise<WaterLog> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('water_logs')
    .insert({ user_id: userData.user.id, ...input })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteWaterLog(id: string): Promise<void> {
  const { error } = await supabase.from('water_logs').delete().eq('id', id);
  if (error) throw error;
}
