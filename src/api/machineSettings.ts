import { supabase } from './supabaseClient';

export interface MachineSettings {
  id: string;
  user_id: string;
  exercise_name: string;
  height: string | null;
  width: string | null;
}

export async function getMachineSettings(exerciseName: string): Promise<MachineSettings | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('exercise_machine_settings')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('exercise_name', exerciseName)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveMachineSettings(input: {
  exercise_name: string;
  height: string | null;
  width: string | null;
}): Promise<MachineSettings> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('exercise_machine_settings')
    .upsert(
      { user_id: userData.user.id, ...input, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,exercise_name' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
