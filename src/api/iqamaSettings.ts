import { supabase } from './supabaseClient';

export interface IqamaSettings {
  user_id: string;
  fajr_offset_minutes: number;
  dhuhr_offset_minutes: number;
  asr_offset_minutes: number;
  maghrib_offset_minutes: number;
  isha_offset_minutes: number;
  notifications_enabled: boolean;
}

// Matches the column defaults in the iqama_settings table — used when the
// user has no row yet (no settings UI to create one exists yet).
const DEFAULTS: Omit<IqamaSettings, 'user_id'> = {
  fajr_offset_minutes: 20,
  dhuhr_offset_minutes: 10,
  asr_offset_minutes: 10,
  maghrib_offset_minutes: 5,
  isha_offset_minutes: 10,
  notifications_enabled: true,
};

export async function getIqamaSettings(): Promise<IqamaSettings> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { user_id: '', ...DEFAULTS };

  const { data, error } = await supabase
    .from('iqama_settings')
    .select('*')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (error) throw error;
  return data ?? { user_id: userData.user.id, ...DEFAULTS };
}
