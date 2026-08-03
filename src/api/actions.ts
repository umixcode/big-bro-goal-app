import { supabase } from './supabaseClient';

export type ActionStatus =
  | 'completed'
  | 'partially_completed'
  | 'migrated'
  | 'scheduled'
  | 'cancelled'
  | 'priority'
  | 'event'
  | 'note';

export interface ActionTask {
  id: string;
  user_id: string;
  date: string;
  title: string;
  status: ActionStatus | null;
  sort_order: number;
}

export async function listActionTasks(date: string): Promise<ActionTask[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('action_tasks')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('date', date)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

// Distinct dates (within a range) that have at least one action task, for
// marking days on the calendar grid without fetching every task on it.
export async function listActionTaskDates(startDate: string, endDate: string): Promise<string[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('action_tasks')
    .select('date')
    .eq('user_id', userData.user.id)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) throw error;
  return [...new Set((data ?? []).map((row) => row.date))];
}

export async function createActionTask(input: { date: string; title: string }): Promise<ActionTask> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('action_tasks')
    .insert({ user_id: userData.user.id, date: input.date, title: input.title })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function setActionTaskStatus(id: string, status: ActionStatus | null): Promise<ActionTask> {
  const { data, error } = await supabase.from('action_tasks').update({ status }).eq('id', id).select().single();

  if (error) throw error;
  return data;
}

export async function deleteActionTask(id: string): Promise<void> {
  const { error } = await supabase.from('action_tasks').delete().eq('id', id);
  if (error) throw error;
}
