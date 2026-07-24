import dayjs from 'dayjs';
import { supabase } from './supabaseClient';

export interface DhikrLog {
  id: string;
  user_id: string;
  date: string;
  dhikr_type: string;
  count: number;
  target_count: number | null;
}

const DEFAULT_TYPE = 'General';

export async function getTodayDhikr(type: string = DEFAULT_TYPE): Promise<DhikrLog | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('dhikr_logs')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('date', dayjs().format('YYYY-MM-DD'))
    .eq('dhikr_type', type)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function incrementDhikr(delta: number, type: string = DEFAULT_TYPE): Promise<DhikrLog> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .rpc('increment_dhikr', {
      p_user_id: userData.user.id,
      p_date: dayjs().format('YYYY-MM-DD'),
      p_type: type,
      p_delta: delta,
    })
    .single();

  if (error) throw error;
  return data as DhikrLog;
}
