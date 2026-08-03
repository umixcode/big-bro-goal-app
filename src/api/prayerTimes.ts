import { supabase } from './supabaseClient';

export interface PrayerTimesCache {
  id: string;
  user_id: string;
  date: string;
  latitude: number;
  longitude: number;
  calculation_method: number;
  school: number;
  fajr: string | null;
  sunrise: string | null;
  dhuhr: string | null;
  asr: string | null;
  maghrib: string | null;
  isha: string | null;
}

export async function getPrayerTimesForDate(date: string): Promise<PrayerTimesCache | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('prayer_times_cache')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('date', date)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export interface UpsertPrayerTimesInput {
  date: string;
  latitude: number;
  longitude: number;
  calculation_method: number;
  school: number;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

export async function upsertPrayerTimes(input: UpsertPrayerTimesInput): Promise<PrayerTimesCache> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('prayer_times_cache')
    .upsert({ user_id: userData.user.id, ...input }, { onConflict: 'user_id,date' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
