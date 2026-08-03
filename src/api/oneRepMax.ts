import NetInfo from '@react-native-community/netinfo';
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
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;
  const userData = { user: sessionData.session.user };

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
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return [];
  const userData = { user: sessionData.session.user };

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
//
// This inherently needs the server — there's no meaningful "offline" answer
// to "is this a new record" without a local copy of every past 1RM, which
// isn't worth replicating for this one feature. So rather than attempt it
// and let the request time out, skip it outright when there's no
// connectivity; the set itself is still saved separately either way.
export async function maybeRecordOneRepMax(input: MaybeRecordOneRepMaxInput): Promise<OneRepMaxLog | null> {
  const netState = await NetInfo.fetch();
  if (netState.isConnected === false || netState.isInternetReachable === false) return null;

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) throw new Error('Not signed in');
  const userData = { user: sessionData.session.user };

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
