import { supabase } from './supabaseClient';
import { estimateOneRepMax } from '../lib/formulas';
import { lbToKg } from '../lib/units';

export const BENCH_PRESS_EXERCISE_NAME = 'Barbell Bench Press';

export interface OneRepMaxLog {
  id: string;
  user_id: string;
  exercise_name: string;
  estimated_1rm: number;
  source_set_id: string | null;
  logged_at: string;
}

export async function getCurrentOneRepMax(
  exerciseName: string = BENCH_PRESS_EXERCISE_NAME
): Promise<OneRepMaxLog | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from('one_rep_max_logs')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('exercise_name', exerciseName)
    .order('estimated_1rm', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listOneRepMaxHistory(
  exerciseName: string = BENCH_PRESS_EXERCISE_NAME,
  limit = 20
): Promise<OneRepMaxLog[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from('one_rep_max_logs')
    .select('*')
    .eq('user_id', userData.user.id)
    .eq('exercise_name', exerciseName)
    .order('logged_at', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export interface MaybeRecordOneRepMaxInput {
  sourceSetId: string;
  exerciseName: string;
  weight: number;
  weightUnit: 'lb' | 'kg';
  reps: number;
}

// Converts to kg (canonical unit for this table), computes the Epley estimate,
// and inserts a new row only if it beats the current best. Returns the new row
// when a new best was recorded, else null.
export async function maybeRecordOneRepMax(input: MaybeRecordOneRepMaxInput): Promise<OneRepMaxLog | null> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) throw new Error('Not signed in');

  const weightKg = input.weightUnit === 'kg' ? input.weight : lbToKg(input.weight);
  const estimate = estimateOneRepMax(weightKg, input.reps);

  const current = await getCurrentOneRepMax(input.exerciseName);
  if (current && estimate <= current.estimated_1rm) return null;

  const { data, error } = await supabase
    .from('one_rep_max_logs')
    .insert({
      user_id: userData.user.id,
      exercise_name: input.exerciseName,
      estimated_1rm: estimate,
      source_set_id: input.sourceSetId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
