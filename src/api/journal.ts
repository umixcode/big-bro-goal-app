import { supabase } from './supabaseClient';

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_at: string;
  mood_score: number | null;
  content: string | null;
}

export async function listJournalEntries(limit = 30): Promise<JournalEntry[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('entry_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function createJournalEntry(input: { content: string; mood_score?: number | null }): Promise<JournalEntry> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({ user_id: userData.user.id, content: input.content, mood_score: input.mood_score ?? null })
    .select()
    .single();

  if (error) throw error;
  return data;
}
