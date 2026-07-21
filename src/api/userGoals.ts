import { supabase } from './supabaseClient';

export interface UserGoals {
  user_id: string;
  desired_weight_kg: number | null;
  target_date: string | null;
  sleep_goal_hours: number;
  step_goal: number;
  water_bottle_ml: number;
  water_cup_ml: number;
  calorie_goal_override: number | null;
  protein_goal_override_g: number | null;
  fat_goal_override_g: number | null;
  carbs_goal_override_g: number | null;
  water_goal_override_ml: number | null;
}

export async function getMyGoals(): Promise<UserGoals | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userData.user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertMyGoals(patch: Partial<Omit<UserGoals, 'user_id'>>): Promise<UserGoals> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('user_goals')
    .upsert({ user_id: userData.user.id, ...patch }, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}
