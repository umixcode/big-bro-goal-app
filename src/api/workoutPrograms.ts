import { supabase } from './supabaseClient';

export interface WorkoutPhase {
  id: string;
  program_id: string;
  phase_number: number;
  name: string | null;
  notes: string | null;
  program: { name: string; split_type: 'ppl_upper_lower' | 'full_body' };
}

export interface WorkoutPhaseDay {
  id: string;
  phase_id: string;
  day_key: string;
  day_name: string;
  day_order: number;
}

export interface WorkoutPhaseExercise {
  id: string;
  phase_day_id: string;
  exercise_order: number;
  exercise_name: string;
  original_exercise_name: string | null;
  last_set_intensity_technique: string | null;
  warm_up_sets: string | null;
  working_sets: number | null;
  reps_range: string | null;
  early_set_rpe: string | null;
  last_set_rpe: string | null;
  rest: string | null;
  substitution_option_1: string | null;
  substitution_option_2: string | null;
  notes: string | null;
}

export async function getDefaultPhase(): Promise<WorkoutPhase | null> {
  const { data, error } = await supabase
    .from('workout_phases')
    .select('id, program_id, phase_number, name, notes, program:workout_programs(name, split_type)')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as WorkoutPhase | null;
}

export async function listPhaseDays(phaseId: string): Promise<WorkoutPhaseDay[]> {
  const { data, error } = await supabase
    .from('workout_phase_days')
    .select('*')
    .eq('phase_id', phaseId)
    .order('day_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function listPhaseDayExercises(phaseDayId: string): Promise<WorkoutPhaseExercise[]> {
  const { data, error } = await supabase
    .from('workout_phase_exercises')
    .select('*')
    .eq('phase_day_id', phaseDayId)
    .order('exercise_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function swapPhaseExercise(
  phaseExerciseId: string,
  newExerciseName: string,
  originalExerciseName: string
): Promise<WorkoutPhaseExercise> {
  const { data, error } = await supabase
    .from('workout_phase_exercises')
    .update({
      exercise_name: newExerciseName,
      original_exercise_name: newExerciseName === originalExerciseName ? null : originalExerciseName,
    })
    .eq('id', phaseExerciseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
