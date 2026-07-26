import { supabase } from './supabaseClient';

export interface LoggedSet {
  id: string;
  session_id: string;
  phase_exercise_id: string | null;
  exercise_name: string;
  set_number: number;
  is_warmup: boolean;
  weight: number | null;
  weight_unit: 'lb' | 'kg';
  reps: number | null;
  rpe: number | null;
}

export async function listSetsForSession(sessionId: string): Promise<LoggedSet[]> {
  const { data, error } = await supabase
    .from('logged_sets')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export interface CreateLoggedSetInput {
  session_id: string;
  phase_exercise_id: string | null;
  exercise_name: string;
  set_number: number;
  is_warmup: boolean;
  weight: number;
  weight_unit: 'lb' | 'kg';
  reps: number;
  rpe: number | null;
}

export async function createLoggedSet(input: CreateLoggedSetInput): Promise<LoggedSet> {
  const { data, error } = await supabase.from('logged_sets').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteLoggedSet(id: string): Promise<void> {
  const { error } = await supabase.from('logged_sets').delete().eq('id', id);
  if (error) throw error;
}

export interface PreviousTopSet {
  weight: number;
  weight_unit: 'lb' | 'kg';
  reps: number;
  rpe: number | null;
  session_date: string;
  session_id: string;
}

export async function getPreviousTopSet(
  exerciseName: string,
  excludeSessionId?: string
): Promise<PreviousTopSet | null> {
  const { data, error } = await supabase
    .rpc('previous_top_set', {
      p_exercise_name: exerciseName,
      p_exclude_session_id: excludeSessionId ?? null,
    })
    .maybeSingle();

  if (error) throw error;
  return data as PreviousTopSet | null;
}

export interface ExerciseHistoryRow {
  id: string;
  weight: number;
  weight_unit: 'lb' | 'kg';
  reps: number;
  created_at: string;
  session: { session_date: string } | null;
}

export async function listExerciseHistory(exerciseName: string, limit = 200): Promise<ExerciseHistoryRow[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('logged_sets')
    .select('id, weight, weight_unit, reps, created_at, session:workout_sessions!inner(session_date, user_id)')
    .eq('exercise_name', exerciseName)
    .eq('is_warmup', false)
    .not('weight', 'is', null)
    .eq('session.user_id', userData.user.id)
    .order('session_date', { ascending: true, foreignTable: 'session' })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as unknown as ExerciseHistoryRow[];
}
