import { supabase } from './supabaseClient';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  all_day: boolean;
  category: 'goal' | 'prayer' | 'workout' | 'custom';
}

export async function listEvents(): Promise<CalendarEvent[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('start_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createEvent(input: { title: string; start_at: string; all_day: boolean }): Promise<CalendarEvent> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({ user_id: userData.user.id, title: input.title, start_at: input.start_at, all_day: input.all_day })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('calendar_events').delete().eq('id', id);
  if (error) throw error;
}
