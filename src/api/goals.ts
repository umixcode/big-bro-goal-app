import { supabase } from './supabaseClient';

export type GoalCategory = 'weight' | 'sleep' | 'food' | 'reading' | 'prayer' | 'workout' | 'custom';
export type GoalStatus = 'active' | 'completed' | 'archived';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  target_value: number | null;
  target_unit: string | null;
  target_date: string | null;
  status: GoalStatus;
  created_at: string;
}

export async function listGoals(): Promise<Goal[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createGoal(input: {
  title: string;
  category?: GoalCategory;
  description?: string;
  target_value?: number;
  target_unit?: string;
  target_date?: string;
}): Promise<Goal> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('goals')
    .insert({ user_id: userData.user.id, ...input })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGoal(id: string, patch: Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>>): Promise<Goal> {
  const { data, error } = await supabase.from('goals').update(patch).eq('id', id).select().single();
  if (error) throw error;
  return data;
}
