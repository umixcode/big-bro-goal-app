import { supabase } from './supabaseClient';

export interface ExerciseNote {
  id: string;
  user_id: string;
  exercise_name: string;
  notes: string | null;
}

export async function getExerciseNote(exerciseName: string): Promise<ExerciseNote | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('exercise_notes')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('exercise_name', exerciseName)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveExerciseNote(exerciseName: string, notes: string | null): Promise<ExerciseNote> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const { data, error } = await supabase
    .from('exercise_notes')
    .upsert(
      { user_id: userData.user.id, exercise_name: exerciseName, notes, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,exercise_name' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
