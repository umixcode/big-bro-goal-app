import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../api/supabaseClient';
import { queryClient } from '../queryClient';
import type { WorkoutSession } from '../../api/workoutSessions';
import type { LoggedSet } from '../../api/loggedSets';

const QUEUE_KEY = '@offline/mutationQueue';

type SessionPatch = Partial<Pick<WorkoutSession, 'ended_at'>>;

type PendingMutation =
  | { id: string; kind: 'insert_session'; payload: WorkoutSession }
  | { id: string; kind: 'update_session'; payload: { id: string; patch: SessionPatch } }
  | { id: string; kind: 'insert_set'; payload: LoggedSet }
  | { id: string; kind: 'delete_set'; payload: { id: string } };

async function readQueue(): Promise<PendingMutation[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingMutation[];
  } catch {
    return [];
  }
}

async function writeQueue(queue: PendingMutation[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// Every read-modify-write of the queue goes through this lock — enqueueing
// a new mutation, cancelling one, and flush()'s per-item removal all race
// against each other otherwise. flush() in particular holds its work across
// a real network call (applyMutation), so without serializing here, a set
// logged while a sync is mid-flight could get silently dropped when the
// in-progress flush writes back a queue snapshot that predates it.
let queueLock: Promise<unknown> = Promise.resolve();

function withQueueLock<T>(fn: () => Promise<T>): Promise<T> {
  const result = queueLock.then(fn, fn);
  queueLock = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

export function enqueue(mutation: PendingMutation): Promise<void> {
  return withQueueLock(async () => {
    const queue = await readQueue();
    queue.push(mutation);
    await writeQueue(queue);
  });
}

// If a set was deleted before its insert ever reached the server, just drop
// the queued insert instead of syncing a create-then-delete round trip.
// Returns true if a matching queued insert was found and removed.
export function cancelPendingInsert(setId: string): Promise<boolean> {
  return withQueueLock(async () => {
    const queue = await readQueue();
    const next = queue.filter((m) => !(m.kind === 'insert_set' && m.payload.id === setId));
    if (next.length === queue.length) return false;
    await writeQueue(next);
    return true;
  });
}

async function applyMutation(mutation: PendingMutation): Promise<void> {
  switch (mutation.kind) {
    case 'insert_session': {
      const { error } = await supabase.from('workout_sessions').insert(mutation.payload);
      if (error && error.code !== '23505') throw error; // 23505 = already exists, treat as success
      return;
    }
    case 'update_session': {
      // Tolerate the old { id, ended_at } shape too, in case a mutation
      // queued before this payload changed to { id, patch } is still
      // sitting on a device — flushing strictly in order means one
      // malformed entry would otherwise jam everything queued behind it.
      const legacyPayload = mutation.payload as unknown as { id: string; ended_at?: string; patch?: SessionPatch };
      const patch = legacyPayload.patch ?? (legacyPayload.ended_at ? { ended_at: legacyPayload.ended_at } : {});
      const { error } = await supabase.from('workout_sessions').update(patch).eq('id', mutation.payload.id);
      if (error) throw error;
      return;
    }
    case 'insert_set': {
      const { error } = await supabase.from('logged_sets').insert(mutation.payload);
      if (error && error.code !== '23505') throw error;
      return;
    }
    case 'delete_set': {
      const { error } = await supabase.from('logged_sets').delete().eq('id', mutation.payload.id);
      if (error) throw error;
      return;
    }
  }
}

let flushing = false;

// Drains the queue strictly in order (oldest first) so a session insert
// always lands before the logged sets that reference it. Stops at the
// first failure — offline or a transient server error — and leaves the
// rest queued for the next attempt, rather than skipping ahead and risking
// a set landing without its parent session.
//
// This can run with no screen mounted to react to it (a NetInfo callback,
// or the background task firing while the app is closed), so on success it
// invalidates the queries itself rather than relying on a component's
// mutation `onSuccess` — otherwise a sync that finishes in the background
// would silently never show up until something else happened to refetch.
export async function flush(): Promise<void> {
  if (flushing) return;
  flushing = true;
  let syncedAnything = false;
  try {
    while (true) {
      const queue = await readQueue();
      if (queue.length === 0) break;
      const next = queue[0];
      try {
        await applyMutation(next);
      } catch {
        return;
      }
      syncedAnything = true;
      // Only this removal needs the lock — applyMutation already finished,
      // so this is a quick local read-modify-write rather than something
      // that should hold up enqueue()/cancelPendingInsert() for the
      // duration of a network call.
      await withQueueLock(async () => {
        const current = await readQueue();
        await writeQueue(current.filter((m) => m.id !== next.id));
      });
    }
  } finally {
    flushing = false;
    if (syncedAnything) {
      queryClient.invalidateQueries({ queryKey: ['workoutSession'] });
      queryClient.invalidateQueries({ queryKey: ['loggedSets'] });
    }
  }
}

export async function hasPendingMutations(): Promise<boolean> {
  const queue = await readQueue();
  return queue.length > 0;
}
