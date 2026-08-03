import * as Crypto from 'expo-crypto';
import { supabase } from './supabaseClient';
import * as localStore from '../lib/offline/localWorkoutStore';
import * as offlineQueue from '../lib/offline/queue';

export interface LoggedSet {
  id: string;
  session_id: string;
  phase_exercise_id: string | null;
  exercise_name: string;
  set_number: number;
  is_warmup: boolean;
  is_miss: boolean;
  weight: number | null;
  weight_unit: 'lb' | 'kg';
  reps: number | null;
  rpe: number | null;
}

// Local sets (not yet confirmed on the server) win by simply appending after
// whatever the server already has — server rows arrive pre-sorted, and any
// id not among them is one this device created and hasn't synced yet.
function mergeSets(local: LoggedSet[], server: LoggedSet[]): LoggedSet[] {
  const serverIds = new Set(server.map((s) => s.id));
  const localOnly = local.filter((s) => !serverIds.has(s.id));
  return [...server, ...localOnly];
}

// Local-first: always returns at least what's cached on this device, and
// folds in the server's copy when reachable so sets logged on another
// device (or before this offline support existed) still show up.
export async function listSetsForSession(sessionId: string): Promise<LoggedSet[]> {
  const local = await localStore.getSetsForSession(sessionId);

  try {
    const { data, error } = await supabase
      .from('logged_sets')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const merged = mergeSets(local, data ?? []);
    await localStore.replaceSetsForSession(sessionId, merged);
    return merged;
  } catch {
    return local;
  }
}

export interface CreateLoggedSetInput {
  session_id: string;
  phase_exercise_id: string | null;
  exercise_name: string;
  set_number: number;
  is_warmup: boolean;
  is_miss: boolean;
  weight: number;
  weight_unit: 'lb' | 'kg';
  reps: number;
  rpe: number | null;
}

// Saved to the device immediately (with a client-generated id so it's
// stable whether or not — or whenever — it makes it to the server) and
// queued for sync, rather than waiting on a round trip to confirm the set
// before it shows up in the workout.
export async function createLoggedSet(input: CreateLoggedSetInput): Promise<LoggedSet> {
  const set: LoggedSet = { id: Crypto.randomUUID(), ...input };
  await localStore.addSet(set);
  await offlineQueue.enqueue({ id: Crypto.randomUUID(), kind: 'insert_set', payload: set });
  offlineQueue.flush();
  return set;
}

export async function deleteLoggedSet(id: string, sessionId: string): Promise<void> {
  await localStore.removeSet(id, sessionId);

  // If the set was never actually synced, just drop the queued insert
  // instead of syncing a create-then-delete round trip for something the
  // server has never seen.
  const cancelledInsert = await offlineQueue.cancelPendingInsert(id);
  if (!cancelledInsert) {
    await offlineQueue.enqueue({ id: Crypto.randomUUID(), kind: 'delete_set', payload: { id } });
  }
  offlineQueue.flush();
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
