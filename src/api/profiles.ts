import { supabase } from './supabaseClient';

export type Gender = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type UnitsPreference = 'metric' | 'imperial';

export interface Profile {
  id: string;
  full_name: string | null;
  gender: Gender | null;
  date_of_birth: string | null;
  height_cm: number | null;
  current_weight_kg: number | null;
  activity_level: ActivityLevel;
  units_preference: UnitsPreference;
  timezone: string;
  onboarding_completed_at: string | null;
}

export async function getMyProfile(): Promise<Profile | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertMyProfile(patch: Partial<Omit<Profile, 'id'>>): Promise<Profile> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userData.user.id, ...patch }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
