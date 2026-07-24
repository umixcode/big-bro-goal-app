import { supabase } from './supabaseClient';

export interface PlannerTask {
  id: string;
  user_id: string;
  date: string;
  title: string;
  is_completed: boolean;
  completed_at: string | null;
  sort_order: number;
}

export async function listPlannerTasks(date: string): Promise<PlannerTask[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('planner_tasks')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('date', date)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createPlannerTask(input: { date: string; title: string }): Promise<PlannerTask> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('planner_tasks')
    .insert({ user_id: userData.user.id, date: input.date, title: input.title })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function togglePlannerTask(id: string, isCompleted: boolean): Promise<PlannerTask> {
  const { data, error } = await supabase
    .from('planner_tasks')
    .update({ is_completed: isCompleted, completed_at: isCompleted ? new Date().toISOString() : null })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePlannerTask(id: string): Promise<void> {
  const { error } = await supabase.from('planner_tasks').delete().eq('id', id);
  if (error) throw error;
}
