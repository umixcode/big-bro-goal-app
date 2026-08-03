import { supabase } from './supabaseClient';

export interface FoodEntry {
  id: string;
  user_id: string;
  date: string;
  logged_at: string;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export async function listFoodEntriesByDate(date: string): Promise<FoodEntry[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('date', date)
    .order('logged_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getFoodEntriesForRange(startDate: string, endDate: string): Promise<FoodEntry[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('food_entries')
    .select('*')
    .eq('user_id', userData.user.id)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) throw error;
  return data ?? [];
}

export async function createFoodEntry(input: {
  date: string;
  name: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}): Promise<FoodEntry> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('food_entries')
    .insert({ user_id: userData.user.id, ...input })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFoodEntry(id: string): Promise<void> {
  const { error } = await supabase.from('food_entries').delete().eq('id', id);
  if (error) throw error;
}
